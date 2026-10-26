import { Repository } from 'typeorm';
import { Course, type CourseType } from '../database/entities/course.entity.js';
import { CourseModule } from '../database/entities/course-module.entity.js';
import { CourseSection } from '../database/entities/course-section.entity.js';
import { CourseMaterial } from '../database/entities/course-material.entity.js';
import { CourseProgress } from '../database/entities/course-progress.entity.js';
export declare function slugify(text: string): string;
export declare function detectFileType(mime: string, filename: string): string;
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
export declare class CoursesService {
    private readonly courseRepo;
    private readonly moduleRepo;
    private readonly sectionRepo;
    private readonly materialRepo;
    private readonly progressRepo;
    private readonly logger;
    constructor(courseRepo: Repository<Course>, moduleRepo: Repository<CourseModule>, sectionRepo: Repository<CourseSection>, materialRepo: Repository<CourseMaterial>, progressRepo: Repository<CourseProgress>);
    findAllCourses(options?: {
        search?: string;
        type?: string;
        theme?: string;
    }): Promise<any[]>;
    findCourseById(id: number): Promise<Course>;
    findCourseBySlug(slug: string): Promise<Course | null>;
    createCourse(data: {
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
    }, bannerFile?: Express.Multer.File): Promise<Course>;
    updateCourse(id: number, data: Partial<Course>, bannerFile?: Express.Multer.File): Promise<Course>;
    deleteCourse(id: number): Promise<boolean>;
    createModule(courseId: number, data: {
        title: string;
        description?: string | null;
        bannerImage?: string | null;
        orderIndex?: number;
    }, bannerFile?: Express.Multer.File): Promise<CourseModule>;
    updateModule(courseId: number, moduleId: number, data: Partial<CourseModule>, bannerFile?: Express.Multer.File): Promise<CourseModule>;
    deleteModule(courseId: number, moduleId: number): Promise<boolean>;
    findModuleWithSections(moduleId: number): Promise<CourseModule | null>;
    createSection(moduleId: number, data: {
        title: string;
        additionalContent?: string | null;
        orderIndex?: number;
    }): Promise<CourseSection>;
    updateSection(sectionId: number, data: Partial<CourseSection>): Promise<CourseSection>;
    deleteSection(sectionId: number): Promise<boolean>;
    uploadMaterial(courseId: number, moduleId: number, sectionId: number, file: Express.Multer.File, title?: string): Promise<CourseMaterial>;
    deleteMaterial(materialId: number): Promise<boolean>;
    getCourses(): CourseDefinition[];
    getCourse(courseId: string): CourseDefinition | undefined;
    getProgress(telegramId: string | number, courseId: string): Promise<CourseProgress>;
    markDayComplete(telegramId: string | number, courseId: string, day: number): Promise<CourseProgress>;
    requestAccountability(telegramId: string | number, courseId: string): Promise<CourseProgress>;
    getAllProgress(): Promise<CourseProgress[]>;
    count(): Promise<number>;
}
