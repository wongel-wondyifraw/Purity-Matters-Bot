var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CoursesService_1;
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { Course } from '../database/entities/course.entity.js';
import { CourseModule } from '../database/entities/course-module.entity.js';
import { CourseSection } from '../database/entities/course-section.entity.js';
import { CourseMaterial } from '../database/entities/course-material.entity.js';
import { CourseProgress } from '../database/entities/course-progress.entity.js';
export function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'item';
}
export function detectFileType(mime, filename) {
    const m = (mime || '').toLowerCase();
    const ext = path.extname(filename || '').toLowerCase();
    if (m.includes('pdf') || ext === '.pdf')
        return 'pdf';
    if (m.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.aac'].includes(ext))
        return 'audio';
    if (m.startsWith('video/') || ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext))
        return 'video';
    if (m.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext))
        return 'image';
    if (m.includes('word') ||
        m.includes('document') ||
        m.includes('text') ||
        m.includes('powerpoint') ||
        m.includes('presentation') ||
        m.includes('excel') ||
        m.includes('spreadsheet') ||
        ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.md'].includes(ext)) {
        return 'document';
    }
    if (m.includes('zip') || m.includes('compressed') || m.includes('tar') || ['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) {
        return 'archive';
    }
    return 'other';
}
let CoursesService = CoursesService_1 = class CoursesService {
    courseRepo;
    moduleRepo;
    sectionRepo;
    materialRepo;
    progressRepo;
    logger = new Logger(CoursesService_1.name);
    constructor(courseRepo, moduleRepo, sectionRepo, materialRepo, progressRepo) {
        this.courseRepo = courseRepo;
        this.moduleRepo = moduleRepo;
        this.sectionRepo = sectionRepo;
        this.materialRepo = materialRepo;
        this.progressRepo = progressRepo;
    }
    async findAllCourses(options) {
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
            qb.andWhere('(course.name ILIKE :q OR course.theme ILIKE :q OR course.description ILIKE :q OR course.generalObjective ILIKE :q)', { q });
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
    async findCourseById(id) {
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
    async findCourseBySlug(slug) {
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
    async createCourse(data, bannerFile) {
        let slug = slugify(data.name);
        const existing = await this.courseRepo.findOne({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
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
            type: data.type || 'free',
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
    async updateCourse(id, data, bannerFile) {
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
        if (data.currency !== undefined)
            course.currency = data.currency;
        if (data.theme !== undefined)
            course.theme = data.theme.trim();
        if (data.description !== undefined)
            course.description = data.description?.trim() || null;
        if (data.generalObjective !== undefined)
            course.generalObjective = data.generalObjective?.trim() || null;
        if (data.learningOutcomes !== undefined) {
            course.learningOutcomes = Array.isArray(data.learningOutcomes)
                ? data.learningOutcomes.filter(Boolean)
                : [];
        }
        if (data.orderIndex !== undefined)
            course.orderIndex = Number(data.orderIndex) || 0;
        if (data.isActive !== undefined)
            course.isActive = !!data.isActive;
        if (bannerFile) {
            const bannerDir = path.resolve(process.cwd(), 'uploads/courses', course.slug, 'banner');
            fs.mkdirSync(bannerDir, { recursive: true });
            const cleanFileName = bannerFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            const targetFileName = `${Date.now()}-${cleanFileName}`;
            const targetPath = path.resolve(bannerDir, targetFileName);
            fs.copyFileSync(bannerFile.path, targetPath);
            course.bannerImage = `/uploads/courses/${course.slug}/banner/${targetFileName}`;
        }
        else if (data.bannerImage !== undefined) {
            course.bannerImage = data.bannerImage;
        }
        return this.courseRepo.save(course);
    }
    async deleteCourse(id) {
        const course = await this.courseRepo.findOne({ where: { id } });
        if (!course)
            return false;
        try {
            const courseDir = path.resolve(process.cwd(), 'uploads/courses', course.slug);
            if (fs.existsSync(courseDir)) {
                fs.rmSync(courseDir, { recursive: true, force: true });
            }
        }
        catch (err) {
            this.logger.warn(`Could not delete directory for course #${id} (${course.slug}):`, err);
        }
        await this.courseRepo.remove(course);
        return true;
    }
    async createModule(courseId, data, bannerFile) {
        const course = await this.findCourseById(courseId);
        let slug = slugify(data.title);
        const existing = await this.moduleRepo.findOne({
            where: { courseId, slug },
        });
        if (existing) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
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
    async updateModule(courseId, moduleId, data, bannerFile) {
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
        }
        else if (data.bannerImage !== undefined) {
            module.bannerImage = data.bannerImage;
        }
        return this.moduleRepo.save(module);
    }
    async deleteModule(courseId, moduleId) {
        const module = await this.moduleRepo.findOne({
            where: { id: moduleId, courseId },
            relations: { course: true },
        });
        if (!module)
            return false;
        try {
            const courseSlug = module.course?.slug || (await this.findCourseById(courseId)).slug;
            const moduleDir = path.resolve(process.cwd(), 'uploads/courses', courseSlug, module.slug);
            if (fs.existsSync(moduleDir)) {
                fs.rmSync(moduleDir, { recursive: true, force: true });
            }
        }
        catch (err) {
            this.logger.warn(`Could not delete directory for module #${moduleId}:`, err);
        }
        await this.moduleRepo.remove(module);
        return true;
    }
    async findModuleWithSections(moduleId) {
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
    async createSection(moduleId, data) {
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
    async updateSection(sectionId, data) {
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
    async deleteSection(sectionId) {
        const section = await this.sectionRepo.findOne({
            where: { id: sectionId },
            relations: { materials: true },
        });
        if (!section)
            return false;
        if (section.materials && section.materials.length > 0) {
            for (const mat of section.materials) {
                try {
                    const fullPath = path.resolve(process.cwd(), mat.filePath.replace(/^\//, ''));
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                    }
                }
                catch (e) {
                    this.logger.warn(`Could not remove file for material #${mat.id}:`, e);
                }
            }
        }
        await this.sectionRepo.remove(section);
        return true;
    }
    async uploadMaterial(courseId, moduleId, sectionId, file, title) {
        const section = await this.sectionRepo.findOne({
            where: { id: sectionId, moduleId },
            relations: { module: { course: true } },
        });
        if (!section) {
            throw new NotFoundException(`Section #${sectionId} not found under Module #${moduleId}.`);
        }
        const courseSlug = section.module?.course?.slug || (await this.findCourseById(courseId)).slug;
        const moduleSlug = section.module?.slug || `module-${moduleId}`;
        const targetDir = path.resolve(process.cwd(), 'uploads/courses', courseSlug, moduleSlug);
        fs.mkdirSync(targetDir, { recursive: true });
        const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const targetFileName = `${Date.now()}-${cleanOriginalName}`;
        const destinationPath = path.resolve(targetDir, targetFileName);
        fs.copyFileSync(file.path, destinationPath);
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
        catch { }
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
    async deleteMaterial(materialId) {
        const material = await this.materialRepo.findOne({ where: { id: materialId } });
        if (!material)
            return false;
        try {
            const fullPath = path.resolve(process.cwd(), material.filePath.replace(/^\//, ''));
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
        catch (err) {
            this.logger.warn(`Could not delete file ${material.filePath}:`, err);
        }
        await this.materialRepo.remove(material);
        return true;
    }
    getCourses() {
        return [
            {
                id: 'journey_7d',
                title: '🌅 7-Day Journey: Overcoming Triggers & Building Purity',
                durationDays: 7,
                description: 'A focused 7-day journey to understand personal triggers, guard your heart, and build sustainable purity habits.',
                lessons: {
                    1: {
                        day: 1,
                        title: 'Identifying Your Core Triggers',
                        scripture: 'Proverbs 4:23 — "Above all else, guard your heart, for everything you do flows from it."',
                        teaching: 'Freedom begins with self-awareness. Most slips happen when we are tired, lonely, stressed, or bored (HALT: Hungry, Angry, Lonely, Tired). By identifying what sparks unwanted thoughts, we can replace the vulnerability with truth and healthier coping mechanisms.',
                        reflectionQuestion: 'What specific time of day or emotional state makes you feel most vulnerable? Write down your top 2 triggers.',
                        practicalAction: 'Remove or set screen-time locks on 1 digital app or environment that frequently triggers you.',
                    },
                    2: {
                        day: 2,
                        title: 'The Power of Renewing the Mind',
                        scripture: 'Romans 12:2 — "Do not conform to the pattern of this world, but be transformed by the renewing of your mind."',
                        teaching: 'Thoughts become beliefs, beliefs become actions, and actions form habits. When an impure or destructive thought enters, do not entertain it. Immediately redirect your attention to higher purpose.',
                        reflectionQuestion: 'What lie have you believed about your ability to walk in total purity and wholeness?',
                        practicalAction: 'Memorize or write down Romans 12:2 on a card or phone wallpaper for today.',
                    },
                },
            },
            {
                id: 'journey_21d',
                title: '🌱 21-Day Journey: Walking in Freedom & Wholeness',
                durationDays: 21,
                description: 'A deep transformational 21-day program to rewire your neuro-pathways, heal heart wounds, and cultivate lasting victory.',
                lessons: {
                    1: {
                        day: 1,
                        title: 'Laying the Foundation of Freedom',
                        scripture: 'John 8:36 — "So if the Son sets you free, you will be free indeed."',
                        teaching: 'Purity is not merely the absence of a negative behavior; it is the presence of divine life, purpose, and integrity within your heart.',
                        reflectionQuestion: 'What does true freedom look like for you one year from now?',
                        practicalAction: 'Take 10 minutes of quiet reflection and prayer to commit this 21-day journey.',
                    },
                },
            },
        ];
    }
    getCourse(courseId) {
        return this.getCourses().find((c) => c.id === courseId);
    }
    async getProgress(telegramId, courseId) {
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
    async markDayComplete(telegramId, courseId, day) {
        const progress = await this.getProgress(telegramId, courseId);
        const completed = new Set(progress.completedDays ?? []);
        completed.add(day);
        progress.completedDays = Array.from(completed);
        if (progress.currentDay <= day && progress.currentDay < progress.totalDays) {
            progress.currentDay = day + 1;
        }
        return this.progressRepo.save(progress);
    }
    async requestAccountability(telegramId, courseId) {
        const progress = await this.getProgress(telegramId, courseId);
        progress.accountabilityRequested = true;
        return this.progressRepo.save(progress);
    }
    async getAllProgress() {
        return this.progressRepo.find({ order: { updatedAt: 'DESC' } });
    }
    async count() {
        return this.courseRepo.count();
    }
};
CoursesService = CoursesService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(Course)),
    __param(1, InjectRepository(CourseModule)),
    __param(2, InjectRepository(CourseSection)),
    __param(3, InjectRepository(CourseMaterial)),
    __param(4, InjectRepository(CourseProgress)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        Repository])
], CoursesService);
export { CoursesService };
//# sourceMappingURL=courses.service.js.map