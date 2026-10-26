import { CourseModule } from './course-module.entity.js';
import { CourseMaterial } from './course-material.entity.js';
export declare class CourseSection {
    id: number;
    moduleId: number;
    title: string;
    additionalContent?: string | null;
    orderIndex: number;
    module: CourseModule | null;
    materials: CourseMaterial[];
    createdAt: Date;
    updatedAt: Date;
}
