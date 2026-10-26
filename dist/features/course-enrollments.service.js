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
var CourseEnrollmentsService_1;
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEnrollment } from '../database/entities/course-enrollment.entity.js';
import { Course } from '../database/entities/course.entity.js';
import { CourseModule } from '../database/entities/course-module.entity.js';
let CourseEnrollmentsService = CourseEnrollmentsService_1 = class CourseEnrollmentsService {
    enrollmentRepo;
    courseRepo;
    moduleRepo;
    logger = new Logger(CourseEnrollmentsService_1.name);
    constructor(enrollmentRepo, courseRepo, moduleRepo) {
        this.enrollmentRepo = enrollmentRepo;
        this.courseRepo = courseRepo;
        this.moduleRepo = moduleRepo;
    }
    async getEnrollment(telegramId, courseId) {
        return this.enrollmentRepo.findOne({
            where: { telegramId: String(telegramId), courseId },
            relations: { course: { modules: true } },
        });
    }
    async getUserEnrollments(telegramId) {
        return this.enrollmentRepo.find({
            where: { telegramId: String(telegramId) },
            relations: { course: true },
            order: { updatedAt: 'DESC' },
        });
    }
    async enrollFreeCourse(data) {
        const tid = String(data.telegramId);
        let enrollment = await this.enrollmentRepo.findOne({
            where: { telegramId: tid, courseId: data.courseId },
            relations: { course: { modules: true } },
        });
        if (enrollment) {
            enrollment.lastActiveAt = new Date();
            return this.enrollmentRepo.save(enrollment);
        }
        const course = await this.courseRepo.findOne({
            where: { id: data.courseId },
            relations: { modules: true },
            order: { modules: { orderIndex: 'ASC' } },
        });
        const firstModuleId = course?.modules?.[0]?.id ?? null;
        enrollment = this.enrollmentRepo.create({
            telegramId: tid,
            clientName: data.clientName,
            clientUsername: data.clientUsername || null,
            clientPhone: data.clientPhone || null,
            courseId: data.courseId,
            courseName: data.courseName,
            courseType: 'free',
            amount: 0,
            currency: course?.currency || 'ETB',
            paymentStatus: 'free',
            status: 'in_progress',
            currentModuleId: firstModuleId,
            completedModuleIds: [],
            lastActiveAt: new Date(),
        });
        return this.enrollmentRepo.save(enrollment);
    }
    async submitPaymentRequest(data) {
        const tid = String(data.telegramId);
        let enrollment = await this.enrollmentRepo.findOne({
            where: { telegramId: tid, courseId: data.courseId },
            relations: { course: { modules: true } },
        });
        if (enrollment) {
            if (enrollment.paymentStatus === 'confirmed') {
                return enrollment;
            }
            enrollment.paymentStatus = 'pending_verification';
            enrollment.amount = data.amount;
            enrollment.currency = data.currency;
            enrollment.paymentMethod = data.paymentMethod || enrollment.paymentMethod || null;
            enrollment.paymentReference = data.paymentReference || enrollment.paymentReference || null;
            enrollment.lastActiveAt = new Date();
            return this.enrollmentRepo.save(enrollment);
        }
        const course = await this.courseRepo.findOne({
            where: { id: data.courseId },
            relations: { modules: true },
            order: { modules: { orderIndex: 'ASC' } },
        });
        const firstModuleId = course?.modules?.[0]?.id ?? null;
        enrollment = this.enrollmentRepo.create({
            telegramId: tid,
            clientName: data.clientName,
            clientUsername: data.clientUsername || null,
            clientPhone: data.clientPhone || null,
            courseId: data.courseId,
            courseName: data.courseName,
            courseType: 'paid',
            amount: data.amount,
            currency: data.currency,
            paymentStatus: 'pending_verification',
            status: 'not_started',
            paymentMethod: data.paymentMethod || null,
            paymentReference: data.paymentReference || null,
            currentModuleId: firstModuleId,
            completedModuleIds: [],
            lastActiveAt: new Date(),
        });
        return this.enrollmentRepo.save(enrollment);
    }
    async verifyPayment(id, adminNotes) {
        const enrollment = await this.enrollmentRepo.findOne({
            where: { id },
            relations: { course: { modules: true } },
        });
        if (!enrollment) {
            throw new NotFoundException(`Course enrollment #${id} not found.`);
        }
        enrollment.paymentStatus = 'confirmed';
        if (enrollment.status === 'not_started') {
            enrollment.status = 'in_progress';
        }
        enrollment.verifiedAt = new Date();
        if (adminNotes !== undefined) {
            enrollment.adminNotes = adminNotes.trim() || null;
        }
        if (!enrollment.currentModuleId && enrollment.course?.modules?.length) {
            const sortedModules = [...enrollment.course.modules].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            enrollment.currentModuleId = sortedModules[0].id;
        }
        enrollment.lastActiveAt = new Date();
        return this.enrollmentRepo.save(enrollment);
    }
    async rejectPayment(id, reason) {
        const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
        if (!enrollment) {
            throw new NotFoundException(`Course enrollment #${id} not found.`);
        }
        enrollment.paymentStatus = 'rejected';
        enrollment.adminNotes = reason?.trim() || 'Payment verification could not be confirmed.';
        enrollment.lastActiveAt = new Date();
        return this.enrollmentRepo.save(enrollment);
    }
    async completeModule(telegramId, courseId, moduleId) {
        const tid = String(telegramId);
        const enrollment = await this.enrollmentRepo.findOne({
            where: { telegramId: tid, courseId },
            relations: { course: true },
        });
        if (!enrollment) {
            throw new NotFoundException(`No enrollment found for course #${courseId} and user ${tid}.`);
        }
        const course = await this.courseRepo.findOne({
            where: { id: courseId },
            relations: { modules: true },
            order: { modules: { orderIndex: 'ASC' } },
        });
        const modules = course?.modules || [];
        const completedSet = new Set(enrollment.completedModuleIds || []);
        completedSet.add(moduleId);
        enrollment.completedModuleIds = Array.from(completedSet);
        const currentIdx = modules.findIndex((m) => m.id === moduleId);
        const nextModule = currentIdx >= 0 && currentIdx < modules.length - 1 ? modules[currentIdx + 1] : null;
        const allModuleIds = modules.map((m) => m.id);
        const isCourseCompleted = allModuleIds.length > 0 && allModuleIds.every((id) => completedSet.has(id));
        if (isCourseCompleted) {
            enrollment.status = 'completed';
            enrollment.completedAt = new Date();
        }
        else {
            enrollment.status = 'in_progress';
            if (nextModule) {
                enrollment.currentModuleId = nextModule.id;
            }
        }
        enrollment.lastActiveAt = new Date();
        const saved = await this.enrollmentRepo.save(enrollment);
        return {
            enrollment: saved,
            nextModule,
            isCourseCompleted,
        };
    }
    async findAll(options) {
        const qb = this.enrollmentRepo
            .createQueryBuilder('enrollment')
            .leftJoinAndSelect('enrollment.course', 'course')
            .leftJoinAndSelect('course.modules', 'modules')
            .orderBy('enrollment.lastActiveAt', 'DESC')
            .addOrderBy('enrollment.createdAt', 'DESC');
        if (options?.courseId) {
            qb.andWhere('enrollment.courseId = :courseId', { courseId: options.courseId });
        }
        if (options?.paymentStatus && options.paymentStatus !== 'all') {
            qb.andWhere('enrollment.paymentStatus = :paymentStatus', { paymentStatus: options.paymentStatus });
        }
        if (options?.status && options.status !== 'all') {
            qb.andWhere('enrollment.status = :status', { status: options.status });
        }
        if (options?.search) {
            const q = `%${options.search.trim()}%`;
            qb.andWhere('(enrollment.clientName ILIKE :q OR enrollment.clientUsername ILIKE :q OR enrollment.clientPhone ILIKE :q OR enrollment.telegramId ILIKE :q OR enrollment.courseName ILIKE :q)', { q });
        }
        const list = await qb.getMany();
        return list.map((item) => {
            const totalModules = item.course?.modules?.length || 0;
            const completedCount = item.completedModuleIds?.length || 0;
            const progressPercent = totalModules > 0 ? Math.min(100, Math.round((completedCount / totalModules) * 100)) : 0;
            const currentModule = item.course?.modules?.find((m) => m.id === item.currentModuleId);
            return {
                ...item,
                amount: Number(item.amount) || 0,
                totalModules,
                completedCount,
                progressPercent,
                currentModuleTitle: currentModule?.title || (completedCount === totalModules && totalModules > 0 ? 'Course Finished' : 'Not Started'),
            };
        });
    }
    async findById(id) {
        const enrollment = await this.enrollmentRepo.findOne({
            where: { id },
            relations: {
                course: {
                    modules: {
                        sections: {
                            materials: true,
                        },
                    },
                },
            },
        });
        if (!enrollment) {
            throw new NotFoundException(`Enrollment #${id} not found.`);
        }
        const course = enrollment.course;
        const modules = [...(course?.modules || [])].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        const completedSet = new Set(enrollment.completedModuleIds || []);
        const moduleProgress = modules.map((mod, idx) => {
            const isCompleted = completedSet.has(mod.id);
            const isUnlocked = idx === 0 || completedSet.has(modules[idx - 1].id);
            const isCurrent = enrollment.currentModuleId === mod.id;
            return {
                id: mod.id,
                title: mod.title,
                description: mod.description,
                orderIndex: mod.orderIndex,
                isCompleted,
                isUnlocked,
                isCurrent,
                sectionsCount: mod.sections?.length || 0,
                materialsCount: mod.sections?.reduce((acc, sec) => acc + (sec.materials?.length || 0), 0) || 0,
            };
        });
        const totalModules = modules.length;
        const completedCount = completedSet.size;
        const progressPercent = totalModules > 0 ? Math.min(100, Math.round((completedCount / totalModules) * 100)) : 0;
        return {
            ...enrollment,
            amount: Number(enrollment.amount) || 0,
            totalModules,
            completedCount,
            progressPercent,
            moduleProgress,
        };
    }
    async deleteEnrollment(id) {
        const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
        if (!enrollment)
            return false;
        await this.enrollmentRepo.remove(enrollment);
        return true;
    }
};
CourseEnrollmentsService = CourseEnrollmentsService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(CourseEnrollment)),
    __param(1, InjectRepository(Course)),
    __param(2, InjectRepository(CourseModule)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository])
], CourseEnrollmentsService);
export { CourseEnrollmentsService };
//# sourceMappingURL=course-enrollments.service.js.map