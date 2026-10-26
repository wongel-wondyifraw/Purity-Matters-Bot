import { Repository } from 'typeorm';
import { CourseEnrollment } from '../database/entities/course-enrollment.entity.js';
import { Course } from '../database/entities/course.entity.js';
import { CourseModule } from '../database/entities/course-module.entity.js';
export declare class CourseEnrollmentsService {
    private readonly enrollmentRepo;
    private readonly courseRepo;
    private readonly moduleRepo;
    private readonly logger;
    constructor(enrollmentRepo: Repository<CourseEnrollment>, courseRepo: Repository<Course>, moduleRepo: Repository<CourseModule>);
    getEnrollment(telegramId: string | number, courseId: number): Promise<CourseEnrollment | null>;
    getUserEnrollments(telegramId: string | number): Promise<CourseEnrollment[]>;
    enrollFreeCourse(data: {
        telegramId: string | number;
        clientName: string;
        clientUsername?: string | null;
        clientPhone?: string | null;
        courseId: number;
        courseName: string;
    }): Promise<CourseEnrollment>;
    submitPaymentRequest(data: {
        telegramId: string | number;
        clientName: string;
        clientUsername?: string | null;
        clientPhone?: string | null;
        courseId: number;
        courseName: string;
        amount: number;
        currency: string;
        paymentMethod?: string | null;
        paymentReference?: string | null;
    }): Promise<CourseEnrollment>;
    verifyPayment(id: number, adminNotes?: string): Promise<CourseEnrollment>;
    rejectPayment(id: number, reason?: string): Promise<CourseEnrollment>;
    completeModule(telegramId: string | number, courseId: number, moduleId: number): Promise<{
        enrollment: CourseEnrollment;
        nextModule: CourseModule | null;
        isCourseCompleted: boolean;
    }>;
    findAll(options?: {
        courseId?: number;
        paymentStatus?: string;
        status?: string;
        search?: string;
    }): Promise<any[]>;
    findById(id: number): Promise<any>;
    deleteEnrollment(id: number): Promise<boolean>;
}
