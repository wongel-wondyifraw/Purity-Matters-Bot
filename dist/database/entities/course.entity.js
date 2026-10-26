var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, } from 'typeorm';
import { CourseModule } from './course-module.entity.js';
let Course = class Course {
    id;
    name;
    slug;
    bannerImage;
    type;
    price;
    currency;
    theme;
    description;
    generalObjective;
    learningOutcomes;
    orderIndex;
    isActive;
    modules;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Course.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Course.prototype, "name", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], Course.prototype, "slug", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], Course.prototype, "bannerImage", void 0);
__decorate([
    Column({ type: 'varchar', length: 16, default: 'free' }),
    __metadata("design:type", String)
], Course.prototype, "type", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 }),
    __metadata("design:type", Number)
], Course.prototype, "price", void 0);
__decorate([
    Column({ type: 'varchar', length: 8, default: 'ETB' }),
    __metadata("design:type", String)
], Course.prototype, "currency", void 0);
__decorate([
    Column({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], Course.prototype, "theme", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Course.prototype, "description", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Course.prototype, "generalObjective", void 0);
__decorate([
    Column({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], Course.prototype, "learningOutcomes", void 0);
__decorate([
    Column({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Course.prototype, "orderIndex", void 0);
__decorate([
    Column({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Course.prototype, "isActive", void 0);
__decorate([
    OneToMany(() => CourseModule, (module) => module.course, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Course.prototype, "modules", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Course.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Course.prototype, "updatedAt", void 0);
Course = __decorate([
    Entity('courses')
], Course);
export { Course };
//# sourceMappingURL=course.entity.js.map