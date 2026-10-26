import { CourseModule } from './course-module.entity.js';
export type CourseType = 'free' | 'paid';
export declare class Course {
    id: number;
    name: string;
    slug: string;
    bannerImage?: string | null;
    type: CourseType;
    price: number;
    currency: string;
    theme: string;
    description?: string | null;
    generalObjective?: string | null;
    learningOutcomes: string[];
    orderIndex: number;
    isActive: boolean;
    modules: CourseModule[];
    createdAt: Date;
    updatedAt: Date;
}
