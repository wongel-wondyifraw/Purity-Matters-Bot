import { CourseSection } from './course-section.entity.js';
export declare class CourseMaterial {
    id: number;
    sectionId: number;
    title: string;
    fileName: string;
    filePath: string;
    fileSizeBytes?: number | null;
    fileMimeType?: string | null;
    fileType: string;
    section: CourseSection | null;
    createdAt: Date;
    updatedAt: Date;
}
