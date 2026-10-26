var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
let Resource = class Resource {
    id;
    title;
    author;
    description;
    type;
    pricingType;
    price;
    currency;
    filePath;
    fileName;
    fileSizeBytes;
    fileMimeType;
    stockQuantity;
    coverImageUrl;
    isActive;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Resource.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Resource.prototype, "title", void 0);
__decorate([
    Column({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], Resource.prototype, "author", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Resource.prototype, "description", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'ebook' }),
    __metadata("design:type", String)
], Resource.prototype, "type", void 0);
__decorate([
    Column({ type: 'varchar', length: 16, default: 'free' }),
    __metadata("design:type", String)
], Resource.prototype, "pricingType", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 }),
    __metadata("design:type", Number)
], Resource.prototype, "price", void 0);
__decorate([
    Column({ type: 'varchar', length: 8, default: 'ETB' }),
    __metadata("design:type", String)
], Resource.prototype, "currency", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], Resource.prototype, "filePath", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Resource.prototype, "fileName", void 0);
__decorate([
    Column({ type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], Resource.prototype, "fileSizeBytes", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], Resource.prototype, "fileMimeType", void 0);
__decorate([
    Column({ type: 'integer', nullable: true, default: 0 }),
    __metadata("design:type", Object)
], Resource.prototype, "stockQuantity", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], Resource.prototype, "coverImageUrl", void 0);
__decorate([
    Column({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Resource.prototype, "isActive", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Resource.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Resource.prototype, "updatedAt", void 0);
Resource = __decorate([
    Entity('resources')
], Resource);
export { Resource };
//# sourceMappingURL=resource.entity.js.map