var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, } from 'typeorm';
let CourseProgress = class CourseProgress {
    id;
    telegramId;
    courseId;
    currentDay;
    totalDays;
    completedDays;
    accountabilityRequested;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], CourseProgress.prototype, "id", void 0);
__decorate([
    Index(),
    Column({ type: 'bigint' }),
    __metadata("design:type", String)
], CourseProgress.prototype, "telegramId", void 0);
__decorate([
    Column({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], CourseProgress.prototype, "courseId", void 0);
__decorate([
    Column({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], CourseProgress.prototype, "currentDay", void 0);
__decorate([
    Column({ type: 'int', default: 7 }),
    __metadata("design:type", Number)
], CourseProgress.prototype, "totalDays", void 0);
__decorate([
    Column({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], CourseProgress.prototype, "completedDays", void 0);
__decorate([
    Column({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], CourseProgress.prototype, "accountabilityRequested", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], CourseProgress.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], CourseProgress.prototype, "updatedAt", void 0);
CourseProgress = __decorate([
    Entity('course_progress')
], CourseProgress);
export { CourseProgress };
//# sourceMappingURL=course-progress.entity.js.map