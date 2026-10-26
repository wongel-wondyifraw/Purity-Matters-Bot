var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, } from 'typeorm';
import { Course } from './course.entity.js';
import { CourseSection } from './course-section.entity.js';
let CourseModule = class CourseModule {
    id;
    courseId;
    title;
    slug;
    description;
    bannerImage;
    orderIndex;
    course;
    sections;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], CourseModule.prototype, "id", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], CourseModule.prototype, "courseId", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CourseModule.prototype, "title", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CourseModule.prototype, "slug", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CourseModule.prototype, "description", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], CourseModule.prototype, "bannerImage", void 0);
__decorate([
    Column({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], CourseModule.prototype, "orderIndex", void 0);
__decorate([
    ManyToOne(() => Course, (course) => course.modules, {
        onDelete: 'CASCADE',
    }),
    JoinColumn({ name: 'courseId' }),
    __metadata("design:type", Object)
], CourseModule.prototype, "course", void 0);
__decorate([
    OneToMany(() => CourseSection, (section) => section.module, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], CourseModule.prototype, "sections", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], CourseModule.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], CourseModule.prototype, "updatedAt", void 0);
CourseModule = __decorate([
    Entity('course_modules')
], CourseModule);
export { CourseModule };
//# sourceMappingURL=course-module.entity.js.map