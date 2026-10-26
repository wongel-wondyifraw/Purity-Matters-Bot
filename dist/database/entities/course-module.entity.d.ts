import { Course } from './course.entity.js';
import { CourseSection } from './course-section.entity.js';
export declare class CourseModule {
    id: number;
    courseId: number;
    title: string;
    slug: string;
    description?: string | null;
    bannerImage?: string | null;
    orderIndex: number;
    course: Course | null;
    sections: CourseSection[];
    createdAt: Date;
    updatedAt: Date;
}
