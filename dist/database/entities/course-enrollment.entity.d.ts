import { Course } from './course.entity.js';
export type CoursePaymentStatus = 'free' | 'pending_verification' | 'confirmed' | 'rejected';
export type CourseEnrollmentStatus = 'not_started' | 'in_progress' | 'completed';
export declare class CourseEnrollment {
    id: number;
    telegramId: string;
    clientName: string;
    clientUsername?: string | null;
    clientPhone?: string | null;
    courseId: number;
    courseName: string;
    courseType: 'free' | 'paid';
    amount: number;
    currency: string;
    paymentStatus: CoursePaymentStatus;
    paymentMethod?: string | null;
    paymentReference?: string | null;
    adminNotes?: string | null;
    verifiedAt?: Date | null;
    status: CourseEnrollmentStatus;
    currentModuleId?: number | null;
    completedModuleIds: number[];
    completedAt?: Date | null;
    lastActiveAt: Date;
    course: Course | null;
    createdAt: Date;
    updatedAt: Date;
}
