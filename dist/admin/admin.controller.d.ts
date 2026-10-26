import { ClientsService } from '../clients/clients.service.js';
import { CounselingService } from '../features/counseling.service.js';
import { InnerHealingService } from '../features/inner-healing.service.js';
import { CoursesService } from '../features/courses.service.js';
import { CourseEnrollmentsService } from '../features/course-enrollments.service.js';
import { ResourcesService } from '../features/resources.service.js';
import { AnonymousQuestionsService } from '../features/anonymous-questions.service.js';
import { PaymentSettingsService } from '../features/payment-settings.service.js';
import { DonationsService } from '../features/donations.service.js';
import { BotService } from '../bot/bot.service.js';
import { PhysicalOrderStatus } from '../database/entities/physical-book-order.entity.js';
import { Resource } from '../database/entities/resource.entity.js';
export declare class AdminController {
    private readonly clientsService;
    private readonly counselingService;
    private readonly innerHealingService;
    private readonly coursesService;
    private readonly courseEnrollmentsService;
    private readonly resourcesService;
    private readonly questionsService;
    private readonly paymentSettingsService;
    private readonly donationsService;
    private readonly botService;
    constructor(clientsService: ClientsService, counselingService: CounselingService, innerHealingService: InnerHealingService, coursesService: CoursesService, courseEnrollmentsService: CourseEnrollmentsService, resourcesService: ResourcesService, questionsService: AnonymousQuestionsService, paymentSettingsService: PaymentSettingsService, donationsService: DonationsService, botService: BotService);
    getStats(): Promise<{
        totalClients: number;
        totalCounseling: number;
        pendingCounseling: number;
        totalInnerHealing: number;
        pendingInnerHealing: number;
        totalCourseEnrolled: number;
        accountabilityNeeded: number;
        totalPurchases: number;
        totalSales: number;
        totalDonations: number;
        totalDonatedAmount: number;
        pendingDonations: number;
    }>;
    getClients(): Promise<{
        counselingCount: number;
        innerHealingCount: number;
        coursesCount: number;
        purchasesCount: number;
        id: number;
        telegramId: string;
        fullName?: string | null;
        username?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        languageCode?: string | null;
        phone?: string | null;
        isRegistered: boolean;
        role: string;
        registrationStep?: string | null;
        metadata?: Record<string, any> | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createClient(body: {
        fullName: string;
        telegramId?: string | number | null;
        username?: string | null;
        phone?: string | null;
        languageCode?: string | null;
        role?: string;
        isRegistered?: boolean;
    }): Promise<import("../database/entities/client.entity.js").Client>;
    updateClient(id: number, body: {
        role?: string;
        phone?: string;
        fullName?: string;
        username?: string;
        languageCode?: string;
        isRegistered?: boolean;
    }): Promise<import("../database/entities/client.entity.js").Client | null>;
    deleteClient(id: number): Promise<{
        success: boolean;
    }>;
    getCounseling(): Promise<import("../database/entities/counseling-request.entity.js").CounselingRequest[]>;
    createCounseling(body: {
        clientName: string;
        phone?: string | null;
        telegramId?: string | number | null;
        concern: string;
        description?: string | null;
        preferredMethod: string;
        preferredTime?: string | null;
        status?: string;
        assignedTo?: string | null;
        scheduledAt?: Date | string | null;
    }): Promise<import("../database/entities/counseling-request.entity.js").CounselingRequest>;
    updateCounseling(id: number, body: {
        status?: string;
        assignedTo?: string | null;
        concern?: string;
        description?: string | null;
        preferredMethod?: string;
        preferredTime?: string;
        scheduledAt?: Date | string | null;
    }): Promise<import("../database/entities/counseling-request.entity.js").CounselingRequest>;
    deleteCounseling(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getInnerHealing(): Promise<{
        clientName: string;
        phone: string;
        id: number;
        referenceNumber: string;
        telegramId: string;
        topic: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    updateInnerHealing(id: number, body: {
        status: string;
    }): Promise<import("../database/entities/inner-healing-request.entity.js").InnerHealingRequest | null>;
    getCourses(): Promise<{
        clientName: string;
        phone: string;
        id: number;
        telegramId: string;
        courseId: string;
        currentDay: number;
        totalDays: number;
        completedDays: number[];
        accountabilityRequested: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getCoursesCatalog(query: any): Promise<any[]>;
    getCourseDetails(id: number): Promise<import("../database/entities/course.entity.js").Course>;
    createCourse(body: any, bannerFile?: Express.Multer.File): Promise<import("../database/entities/course.entity.js").Course>;
    updateCourse(id: number, body: any, bannerFile?: Express.Multer.File): Promise<import("../database/entities/course.entity.js").Course>;
    deleteCourse(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    createModule(courseId: number, body: any, bannerFile?: Express.Multer.File): Promise<import("../database/entities/course-module.entity.js").CourseModule>;
    updateModule(courseId: number, moduleId: number, body: any, bannerFile?: Express.Multer.File): Promise<import("../database/entities/course-module.entity.js").CourseModule>;
    deleteModule(courseId: number, moduleId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    createSection(moduleId: number, body: any): Promise<import("../database/entities/course-section.entity.js").CourseSection>;
    updateSection(sectionId: number, body: any): Promise<import("../database/entities/course-section.entity.js").CourseSection>;
    deleteSection(sectionId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadSectionMaterial(courseId: number, moduleId: number, sectionId: number, body: any, file: Express.Multer.File): Promise<import("../database/entities/course-material.entity.js").CourseMaterial>;
    deleteMaterial(materialId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getCourseEnrollments(courseId?: string, paymentStatus?: string, status?: string, search?: string): Promise<any[]>;
    getCourseEnrollmentById(id: number): Promise<any>;
    verifyCourseEnrollment(id: number, body?: {
        adminNotes?: string;
    }): Promise<{
        success: boolean;
        enrollment: import("../database/entities/course-enrollment.entity.js").CourseEnrollment;
        message: string;
    }>;
    rejectCourseEnrollment(id: number, body?: {
        reason?: string;
    }): Promise<{
        success: boolean;
        enrollment: import("../database/entities/course-enrollment.entity.js").CourseEnrollment;
        message: string;
    }>;
    deleteCourseEnrollment(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getResourcesCatalog(query: any): Promise<Resource[]>;
    createResource(body: any, file?: Express.Multer.File): Promise<Resource>;
    updateResource(id: number, body: any, file?: Express.Multer.File): Promise<Resource>;
    deleteResource(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getPhysicalOrders(query: any): Promise<import("../database/entities/physical-book-order.entity.js").PhysicalBookOrder[]>;
    createPhysicalOrder(body: any): Promise<import("../database/entities/physical-book-order.entity.js").PhysicalBookOrder>;
    updatePhysicalOrderStatus(id: number, body: {
        status: PhysicalOrderStatus;
        dispatchNotes?: string;
    }): Promise<import("../database/entities/physical-book-order.entity.js").PhysicalBookOrder | null>;
    getResources(): Promise<{
        id: number;
        telegramId: string;
        clientName: string;
        phone: string;
        resourceTitle: string;
        amount: number;
        currency: string;
        status: PhysicalOrderStatus;
        date: string;
    }[] | {
        clientName: string;
        phone: string;
        id: number;
        telegramId: string;
        resourceId: string;
        resourceTitle: string;
        amount: number;
        currency: string;
        status: string;
        downloadUrl?: string | null;
        createdAt: Date;
    }[]>;
    getQuestions(): Promise<import("../database/entities/anonymous-question.entity.js").AnonymousQuestion[]>;
    answerQuestion(id: number, body: {
        answer: string;
        assignedCounselor?: string | null;
        isPublic?: boolean;
        postToChannel?: boolean;
    }): Promise<{
        channelBroadcast: {
            success: boolean;
            messageId?: number;
            error?: string;
        } | null;
        id: number;
        referenceNumber: string;
        category: string;
        question: string;
        status: string;
        answer?: string | null;
        answeredAt?: Date | null;
        assignedCounselor?: string | null;
        isPublic: boolean;
        postedToChannel: boolean;
        telegramMessageId?: number | null;
        postedToChannelAt?: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteQuestion(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getPaymentSettings(): Promise<import("../features/payment-settings.service.js").PaymentAccountsResponse>;
    updatePaymentSettings(body: {
        telebirr?: any;
        cbe?: any;
    }): Promise<import("../features/payment-settings.service.js").PaymentAccountsResponse>;
    getResourceOrders(status?: string, search?: string): Promise<import("../database/entities/resource-order.entity.js").ResourceOrder[]>;
    confirmResourceOrderPayment(id: number, body?: {
        adminNotes?: string;
    }): Promise<{
        success: boolean;
        order: import("../database/entities/resource-order.entity.js").ResourceOrder;
        message: string;
        dispatched?: undefined;
        dispatchError?: undefined;
    } | {
        success: boolean;
        order: import("../database/entities/resource-order.entity.js").ResourceOrder;
        dispatched: boolean;
        dispatchError: string | null;
        message?: undefined;
    }>;
    rejectResourceOrderPayment(id: number, body: {
        reason: string;
    }): Promise<{
        success: boolean;
        order: import("../database/entities/resource-order.entity.js").ResourceOrder;
    }>;
    deletePhysicalOrder(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteResourceOrder(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getDonations(status?: string, search?: string): Promise<import("../database/entities/donation.entity.js").Donation[]>;
    verifyDonation(id: number, body?: {
        adminNotes?: string;
    }): Promise<{
        success: boolean;
        donation: import("../database/entities/donation.entity.js").Donation;
        message: string;
    }>;
    rejectDonation(id: number, body?: {
        reason?: string;
    }): Promise<{
        success: boolean;
        donation: import("../database/entities/donation.entity.js").Donation;
        message: string;
    }>;
    deleteDonation(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    broadcastBotUpdate(body: {
        version: string;
        releaseNotes?: string;
    }): Promise<{
        success: boolean;
        sent: number;
        failed: number;
        message: string;
    }>;
}
