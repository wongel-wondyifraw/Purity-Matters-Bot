var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, } from 'typeorm';
import { Course } from './course.entity.js';
let CourseEnrollment = class CourseEnrollment {
    id;
    telegramId;
    clientName;
    clientUsername;
    clientPhone;
    courseId;
    courseName;
    courseType;
    amount;
    currency;
    paymentStatus;
    paymentMethod;
    paymentReference;
    adminNotes;
    verifiedAt;
    status;
    currentModuleId;
    completedModuleIds;
    completedAt;
    lastActiveAt;
    course;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], CourseEnrollment.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], CourseEnrollment.prototype, "telegramId", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CourseEnrollment.prototype, "clientName", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], CourseEnrollment.prototype, "clientUsername", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], CourseEnrollment.prototype, "clientPhone", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], CourseEnrollment.prototype, "courseId", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CourseEnrollment.prototype, "courseName", void 0);
__decorate([
    Column({ type: 'varchar', length: 16, default: 'free' }),
    __metadata("design:type", String)
], CourseEnrollment.prototype, "courseType", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 }),
    __metadata("design:type", Number)
], CourseEnrollment.prototype, "amount", void 0);
__decorate([
    Column({ type: 'varchar', length: 8, default: 'ETB' }),
    __metadata("design:type", String)
], CourseEnrollment.prototype, "currency", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'free' }),
    __metadata("design:type", String)
], CourseEnrollment.prototype, "paymentStatus", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], CourseEnrollment.prototype, "paymentMethod", void 0);
__decorate([
    Column({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], CourseEnrollment.prototype, "paymentReference", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CourseEnrollment.prototype, "adminNotes", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], CourseEnrollment.prototype, "verifiedAt", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'in_progress' }),
    __metadata("design:type", String)
], CourseEnrollment.prototype, "status", void 0);
__decorate([
    Column({ type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], CourseEnrollment.prototype, "currentModuleId", void 0);
__decorate([
    Column({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], CourseEnrollment.prototype, "completedModuleIds", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], CourseEnrollment.prototype, "completedAt", void 0);
__decorate([
    Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], CourseEnrollment.prototype, "lastActiveAt", void 0);
__decorate([
    ManyToOne(() => Course, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'courseId' }),
    __metadata("design:type", Object)
], CourseEnrollment.prototype, "course", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], CourseEnrollment.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], CourseEnrollment.prototype, "updatedAt", void 0);
CourseEnrollment = __decorate([
    Entity('course_enrollments')
], CourseEnrollment);
export { CourseEnrollment };
//# sourceMappingURL=course-enrollment.entity.js.map