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
let CounselingRequest = class CounselingRequest {
    id;
    referenceNumber;
    telegramId;
    clientName;
    phone;
    concern;
    description;
    preferredMethod;
    preferredTime;
    status;
    assignedTo;
    scheduledAt;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], CounselingRequest.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], CounselingRequest.prototype, "referenceNumber", void 0);
__decorate([
    Index(),
    Column({ type: 'bigint' }),
    __metadata("design:type", String)
], CounselingRequest.prototype, "telegramId", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CounselingRequest.prototype, "clientName", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], CounselingRequest.prototype, "phone", void 0);
__decorate([
    Column({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], CounselingRequest.prototype, "concern", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CounselingRequest.prototype, "description", void 0);
__decorate([
    Column({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], CounselingRequest.prototype, "preferredMethod", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], CounselingRequest.prototype, "preferredTime", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'pending' }),
    __metadata("design:type", String)
], CounselingRequest.prototype, "status", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], CounselingRequest.prototype, "assignedTo", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], CounselingRequest.prototype, "scheduledAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], CounselingRequest.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], CounselingRequest.prototype, "updatedAt", void 0);
CounselingRequest = __decorate([
    Entity('counseling_request')
], CounselingRequest);
export { CounselingRequest };
//# sourceMappingURL=counseling-request.entity.js.map