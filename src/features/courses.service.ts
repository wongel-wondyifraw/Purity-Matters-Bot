import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { Course, type CourseType } from '../database/entities/course.entity.js';
import { CourseModule } from '../database/entities/course-module.entity.js';
import { CourseSection } from '../database/entities/course-section.entity.js';
import { CourseMaterial } from '../database/entities/course-material.entity.js';
import { CourseProgress } from '../database/entities/course-progress.entity.js';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

export function detectFileType(mime: string, filename: string): string {
  const m = (mime || '').toLowerCase();
  const ext = path.extname(filename || '').toLowerCase();

  if (m.includes('pdf') || ext === '.pdf') return 'pdf';
  if (m.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.aac'].includes(ext)) return 'audio';
  if (m.startsWith('video/') || ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) return 'video';
  if (m.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext)) return 'image';
  if (
    m.includes('word') ||
    m.includes('document') ||
    m.includes('text') ||
    m.includes('powerpoint') ||
    m.includes('presentation') ||
    m.includes('excel') ||
    m.includes('spreadsheet') ||
    ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.md'].includes(ext)
  ) {
    return 'document';
  }
  if (m.includes('zip') || m.includes('compressed') || m.includes('tar') || ['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) {
    return 'archive';
  }
  return 'other';
}

export interface CourseLesson {
  day: number;
  title: string;
  scripture: string;
  teaching: string;
  reflectionQuestion: string;
  practicalAction: string;
}

export interface CourseDefinition {
  id: string;
  title: string;
  durationDays: number;
  description: string;
  lessons: Record<number, CourseLesson>;
}

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CourseModule)
    private readonly moduleRepo: Repository<CourseModule>,
    @InjectRepository(CourseSection)
    private readonly sectionRepo: Repository<CourseSection>,
    @InjectRepository(CourseMaterial)
    private readonly materialRepo: Repository<CourseMaterial>,
    @InjectRepository(CourseProgress)
    private readonly progressRepo: Repository<CourseProgress>,
  ) {}

  // ==========================================
  // COURSES MANAGEMENT (Full Hierarchy)
  // ==========================================

  async findAllCourses(options?: {
    search?: string;
    type?: string;
    theme?: string;
  }): Promise<any[]> {
    const qb = this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.modules', 'modules')
      .leftJoinAndSelect('modules.sections', 'sections')
      .leftJoinAndSelect('sections.materials', 'materials')
      .orderBy('course.orderIndex', 'ASC')
      .addOrderBy('course.createdAt', 'DESC')
      .addOrderBy('modules.orderIndex', 'ASC')
      .addOrderBy('sections.orderIndex', 'ASC');

    if (options?.type && options.type !== 'all') {
      qb.andWhere('course.type = :type', { type: options.type });
    }

    if (options?.theme && options.theme !== 'all') {
      qb.andWhere('course.theme ILIKE :theme', { theme: `%${options.theme}%` });
    }

    if (options?.search) {
      const q = `%${options.search.trim()}%`;
      qb.andWhere(
        '(course.name ILIKE :q OR course.theme ILIKE :q OR course.description ILIKE :q OR course.generalObjective ILIKE :q)',
        { q },
      );
    }

    const courses = await qb.getMany();

    return courses.map((course) => {
      const moduleCount = course.modules?.length || 0;
      let sectionCount = 0;
      let materialCount = 0;

      course.modules?.forEach((mod) => {
        sectionCount += mod.sections?.length || 0;
        mod.sections?.forEach((sec) => {
          materialCount += sec.materials?.length || 0;
        });
      });

      return {
        ...course,
        price: Number(course.price) || 0,
        moduleCount,
        sectionCount,
        materialCount,
      };
    });
  }

  async findCourseById(id: number): Promise<Course> {
    const course = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.modules', 'modules')
      .leftJoinAndSelect('modules.sections', 'sections')
      .leftJoinAndSelect('sections.materials', 'materials')
      .where('course.id = :id', { id })
      .orderBy('modules.orderIndex', 'ASC')
      .addOrderBy('sections.orderIndex', 'ASC')
      .addOrderBy('materials.createdAt', 'ASC')
      .getOne();

    if (!course) {
      throw new NotFoundException(`Course #${id} not found.`);
    }

    course.price = Number(course.price) || 0;
    return course;
  }

  async findCourseBySlug(slug: string): Promise<Course | null> {
    return this.courseRepo.findOne({
      where: { slug },
      relations: {
        modules: {
          sections: {
            materials: true,
          },
        },
      },
    });
  }

  async createCourse(
    data: {
      name: string;
      bannerImage?: string | null;
      type?: CourseType;
      price?: number;
      currency?: string;
      theme: string;
      description?: string | null;
      generalObjective?: string | null;
      learningOutcomes?: string[];
      orderIndex?: number;
      isActive?: boolean;
    },
    bannerFile?: Express.Multer.File,
  ): Promise<Course> {
    let slug = slugify(data.name);
    // Ensure slug uniqueness
    const existing = await this.courseRepo.findOne({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Ensure uploads/courses/{slug}/banner directory exists
    const courseDir = path.resolve(process.cwd(), 'uploads/courses', slug);
    const bannerDir = path.resolve(courseDir, 'banner');
    fs.mkdirSync(bannerDir, { recursive: true });

    let bannerUrl = data.bannerImage || null;
    if (bannerFile) {
      const cleanFileName = bannerFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const targetFileName = `${Date.now()}-${cleanFileName}`;
      const targetPath = path.resolve(bannerDir, targetFileName);
      fs.copyFileSync(bannerFile.path, targetPath);
      bannerUrl = `/uploads/courses/${slug}/banner/${targetFileName}`;
    }

    const course = this.courseRepo.create({
      name: data.name.trim(),
      slug,
      bannerImage: bannerUrl,
      type: (data.type as CourseType) || 'free',
      price: data.type === 'paid' ? Number(data.price) || 0 : 0,
      currency: data.currency || 'ETB',
      theme: (data.theme || 'General Purity').trim(),
      description: data.description?.trim() || null,
      generalObjective: data.generalObjective?.trim() || null,
      learningOutcomes: Array.isArray(data.learningOutcomes) ? data.learningOutcomes.filter(Boolean) : [],
      orderIndex: data.orderIndex !== undefined ? Number(data.orderIndex) : 0,
      isActive: data.isActive !== undefined ? !!data.isActive : true,
    });

    return this.courseRepo.save(course);
  }

  async updateCourse(
    id: number,
    data: Partial<Course>,
    bannerFile?: Express.Multer.File,
  ): Promise<Course> {
    const course = await this.findCourseById(id);

    if (data.name && data.name.trim() !== course.name) {
      course.name = data.name.trim();
    }
    if (data.type !== undefined) {
      course.type = data.type;
      course.price = data.type === 'paid' ? Number(data.price) || 0 : 0;
    }
    if (data.price !== undefined && course.type === 'paid') {
      course.price = Number(data.price) || 0;
    }
    if (data.currency !== undefined) course.currency = data.currency;
    if (data.theme !== undefined) course.theme = data.theme.trim();
    if (data.description !== undefined) course.description = data.description?.trim() || null;
    if (data.generalObjective !== undefined) course.generalObjective = data.generalObjective?.trim() || null;
    if (data.learningOutcomes !== undefined) {
      course.learningOutcomes = Array.isArray(data.learningOutcomes)
        ? data.learningOutcomes.filter(Boolean)
        : [];
    }
    if (data.orderIndex !== undefined) course.orderIndex = Number(data.orderIndex) || 0;
    if (data.isActive !== undefined) course.isActive = !!data.isActive;

    if (bannerFile) {
      const bannerDir = path.resolve(process.cwd(), 'uploads/courses', course.slug, 'banner');
      fs.mkdirSync(bannerDir, { recursive: true });
      const cleanFileName = bannerFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const targetFileName = `${Date.now()}-${cleanFileName}`;
      const targetPath = path.resolve(bannerDir, targetFileName);
      fs.copyFileSync(bannerFile.path, targetPath);
      course.bannerImage = `/uploads/courses/${course.slug}/banner/${targetFileName}`;
    } else if (data.bannerImage !== undefined) {
      course.bannerImage = data.bannerImage;
    }

    return this.courseRepo.save(course);
  }

  async deleteCourse(id: number): Promise<boolean> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) return false;

    // Remove filesystem directory
    try {
      const courseDir = path.resolve(process.cwd(), 'uploads/courses', course.slug);
      if (fs.existsSync(courseDir)) {
        fs.rmSync(courseDir, { recursive: true, force: true });
      }
    } catch (err) {
      this.logger.warn(`Could not delete directory for course #${id} (${course.slug}):`, err);
    }

    await this.courseRepo.remove(course);
    return true;
  }

  // ==========================================
  // MODULE MANAGEMENT
  // ==========================================

  async createModule(
    courseId: number,
    data: {
      title: string;
      description?: string | null;
      bannerImage?: string | null;
      orderIndex?: number;
    },
    bannerFile?: Express.Multer.File,
  ): Promise<CourseModule> {
    const course = await this.findCourseById(courseId);

    let slug = slugify(data.title);
    const existing = await this.moduleRepo.findOne({
      where: { courseId, slug },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Ensure uploads/courses/{course-name}/{module-name}/ exists
    const moduleDir = path.resolve(process.cwd(), 'uploads/courses', course.slug, slug);
    fs.mkdirSync(moduleDir, { recursive: true });

    let bannerUrl = data.bannerImage || null;
    if (bannerFile) {
      const cleanFileName = bannerFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const targetFileName = `banner-${Date.now()}-${cleanFileName}`;
      const targetPath = path.resolve(moduleDir, targetFileName);
      fs.copyFileSync(bannerFile.path, targetPath);
      bannerUrl = `/uploads/courses/${course.slug}/${slug}/${targetFileName}`;
    }

    const maxOrder = course.modules?.length
      ? Math.max(...course.modules.map((m) => m.orderIndex || 0))
      : 0;

    const module = this.moduleRepo.create({
      courseId,
      title: data.title.trim(),
      slug,
      description: data.description?.trim() || null,
      bannerImage: bannerUrl,
      orderIndex: data.orderIndex !== undefined ? Number(data.orderIndex) : maxOrder + 1,
    });

    return this.moduleRepo.save(module);
  }

  async updateModule(
    courseId: number,
    moduleId: number,
    data: Partial<CourseModule>,
    bannerFile?: Express.Multer.File,
  ): Promise<CourseModule> {
    const module = await this.moduleRepo.findOne({
      where: { id: moduleId, courseId },
      relations: { course: true },
    });

    if (!module) {
      throw new NotFoundException(`Module #${moduleId} not found for Course #${courseId}.`);
    }

    if (data.title && data.title.trim() !== module.title) {
      module.title = data.title.trim();
    }
    if (data.description !== undefined) {
      module.description = data.description?.trim() || null;
    }
    if (data.orderIndex !== undefined) {
      module.orderIndex = Number(data.orderIndex) || 0;
    }

    if (bannerFile) {
      const courseSlug = module.course?.slug || (await this.findCourseById(courseId)).slug;
      const moduleDir = path.resolve(process.cwd(), 'uploads/courses', courseSlug, module.slug);
      fs.mkdirSync(moduleDir, { recursive: true });
      const cleanFileName = bannerFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const targetFileName = `banner-${Date.now()}-${cleanFileName}`;
      const targetPath = path.resolve(moduleDir, targetFileName);
      fs.copyFileSync(bannerFile.path, targetPath);
      module.bannerImage = `/uploads/courses/${courseSlug}/${module.slug}/${targetFileName}`;
    } else if (data.bannerImage !== undefined) {
      module.bannerImage = data.bannerImage;
    }

    return this.moduleRepo.save(module);
  }

  async deleteModule(courseId: number, moduleId: number): Promise<boolean> {
    const module = await this.moduleRepo.findOne({
      where: { id: moduleId, courseId },
      relations: { course: true },
    });
    if (!module) return false;

    try {
      const courseSlug = module.course?.slug || (await this.findCourseById(courseId)).slug;
      const moduleDir = path.resolve(process.cwd(), 'uploads/courses', courseSlug, module.slug);
      if (fs.existsSync(moduleDir)) {
        fs.rmSync(moduleDir, { recursive: true, force: true });
      }
    } catch (err) {
      this.logger.warn(`Could not delete directory for module #${moduleId}:`, err);
    }

    await this.moduleRepo.remove(module);
    return true;
  }

  async findModuleWithSections(moduleId: number): Promise<CourseModule | null> {
    return this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: {
        sections: {
          materials: true,
        },
        course: true,
      },
      order: {
        sections: { orderIndex: 'ASC' },
      },
    });
  }

  // ==========================================
  // SECTION MANAGEMENT
  // ==========================================

  async createSection(
    moduleId: number,
    data: {
      title: string;
      additionalContent?: string | null;
      orderIndex?: number;
    },
  ): Promise<CourseSection> {
    const module = await this.moduleRepo.findOne({
      where: { id: moduleId },
      relations: { sections: true },
    });

    if (!module) {
      throw new NotFoundException(`Module #${moduleId} not found.`);
    }

    const maxOrder = module.sections?.length
      ? Math.max(...module.sections.map((s) => s.orderIndex || 0))
      : 0;

    const section = this.sectionRepo.create({
      moduleId,
      title: data.title.trim(),
      additionalContent: data.additionalContent?.trim() || null,
      orderIndex: data.orderIndex !== undefined ? Number(data.orderIndex) : maxOrder + 1,
    });

    return this.sectionRepo.save(section);
  }

  async updateSection(
    sectionId: number,
    data: Partial<CourseSection>,
  ): Promise<CourseSection> {
    const section = await this.sectionRepo.findOne({ where: { id: sectionId } });
    if (!section) {
      throw new NotFoundException(`Section #${sectionId} not found.`);
    }

    if (data.title && data.title.trim()) {
      section.title = data.title.trim();
    }
    if (data.additionalContent !== undefined) {
      section.additionalContent = data.additionalContent?.trim() || null;
    }
    if (data.orderIndex !== undefined) {
      section.orderIndex = Number(data.orderIndex) || 0;
    }

    return this.sectionRepo.save(section);
  }

  async deleteSection(sectionId: number): Promise<boolean> {
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId },
      relations: { materials: true },
    });
    if (!section) return false;

    // Delete attached physical files
    if (section.materials && section.materials.length > 0) {
      for (const mat of section.materials) {
        try {
          const fullPath = path.resolve(process.cwd(), mat.filePath.replace(/^\//, ''));
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (e) {
          this.logger.warn(`Could not remove file for material #${mat.id}:`, e);
        }
      }
    }

    await this.sectionRepo.remove(section);
    return true;
  }

  // ==========================================
  // LEARNING MATERIALS MANAGEMENT
  // ==========================================

  async uploadMaterial(
    courseId: number,
    moduleId: number,
    sectionId: number,
    file: Express.Multer.File,
    title?: string,
  ): Promise<CourseMaterial> {
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId, moduleId },
      relations: { module: { course: true } },
    });

    if (!section) {
      throw new NotFoundException(`Section #${sectionId} not found under Module #${moduleId}.`);
    }

    const courseSlug = section.module?.course?.slug || (await this.findCourseById(courseId)).slug;
    const moduleSlug = section.module?.slug || `module-${moduleId}`;

    // Target directory: uploads/courses/{course-name}/{module-name}/
    const targetDir = path.resolve(process.cwd(), 'uploads/courses', courseSlug, moduleSlug);
    fs.mkdirSync(targetDir, { recursive: true });

    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const targetFileName = `${Date.now()}-${cleanOriginalName}`;
    const destinationPath = path.resolve(targetDir, targetFileName);

    fs.copyFileSync(file.path, destinationPath);
    // Cleanup multer temp file if needed
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch {}

    const relativeFilePath = `/uploads/courses/${courseSlug}/${moduleSlug}/${targetFileName}`;
    const fileType = detectFileType(file.mimetype, file.originalname);

    const material = this.materialRepo.create({
      sectionId,
      title: title?.trim() || file.originalname,
      fileName: file.originalname,
      filePath: relativeFilePath,
      fileSizeBytes: file.size,
      fileMimeType: file.mimetype,
      fileType,
    });

    return this.materialRepo.save(material);
  }

  async deleteMaterial(materialId: number): Promise<boolean> {
    const material = await this.materialRepo.findOne({ where: { id: materialId } });
    if (!material) return false;

    try {
      const fullPath = path.resolve(process.cwd(), material.filePath.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      this.logger.warn(`Could not delete file ${material.filePath}:`, err);
    }

    await this.materialRepo.remove(material);
    return true;
  }

  // ==========================================
  // BOT BACKWARDS COMPATIBILITY & CLIENT JOURNEYS
  // ==========================================

  getCourses(): CourseDefinition[] {
    return [];
  }

  getCourse(courseId: string): CourseDefinition | undefined {
    return this.getCourses().find((c) => c.id === courseId);
  }

  async getProgress(telegramId: string | number, courseId: string): Promise<CourseProgress> {
    const tid = String(telegramId);
    let progress = await this.progressRepo.findOne({
      where: { telegramId: tid, courseId },
    });

    if (!progress) {
      const course = this.getCourse(courseId);
      progress = this.progressRepo.create({
        telegramId: tid,
        courseId,
        currentDay: 1,
        totalDays: course?.durationDays ?? 7,
        completedDays: [],
        accountabilityRequested: false,
      });
      await this.progressRepo.save(progress);
    }

    return progress;
  }

  async markDayComplete(telegramId: string | number, courseId: string, day: number): Promise<CourseProgress> {
    const progress = await this.getProgress(telegramId, courseId);
    const completed = new Set(progress.completedDays ?? []);
    completed.add(day);
    progress.completedDays = Array.from(completed);

    if (progress.currentDay <= day && progress.currentDay < progress.totalDays) {
      progress.currentDay = day + 1;
    }

    return this.progressRepo.save(progress);
  }

  async requestAccountability(telegramId: string | number, courseId: string): Promise<CourseProgress> {
    const progress = await this.getProgress(telegramId, courseId);
    progress.accountabilityRequested = true;
    return this.progressRepo.save(progress);
  }

  async getAllProgress(): Promise<CourseProgress[]> {
    return this.progressRepo.find({ order: { updatedAt: 'DESC' } });
  }

  async count(): Promise<number> {
    return this.courseRepo.count();
  }
}
