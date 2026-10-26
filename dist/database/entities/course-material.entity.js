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
import { CourseSection } from './course-section.entity.js';
let CourseMaterial = class CourseMaterial {
    id;
    sectionId;
    title;
    fileName;
    filePath;
    fileSizeBytes;
    fileMimeType;
    fileType;
    section;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], CourseMaterial.prototype, "id", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], CourseMaterial.prototype, "sectionId", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CourseMaterial.prototype, "title", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CourseMaterial.prototype, "fileName", void 0);
__decorate([
    Column({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], CourseMaterial.prototype, "filePath", void 0);
__decorate([
    Column({ type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], CourseMaterial.prototype, "fileSizeBytes", void 0);
__decorate([
    Column({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], CourseMaterial.prototype, "fileMimeType", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, default: 'document' }),
    __metadata("design:type", String)
], CourseMaterial.prototype, "fileType", void 0);
__decorate([
    ManyToOne(() => CourseSection, (section) => section.materials, {
        onDelete: 'CASCADE',
    }),
    JoinColumn({ name: 'sectionId' }),
    __metadata("design:type", Object)
], CourseMaterial.prototype, "section", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], CourseMaterial.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], CourseMaterial.prototype, "updatedAt", void 0);
CourseMaterial = __decorate([
    Entity('course_materials')
], CourseMaterial);
export { CourseMaterial };
//# sourceMappingURL=course-material.entity.js.map