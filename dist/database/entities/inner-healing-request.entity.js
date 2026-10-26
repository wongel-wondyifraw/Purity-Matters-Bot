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
let InnerHealingRequest = class InnerHealingRequest {
    id;
    referenceNumber;
    telegramId;
    clientName;
    phone;
    topic;
    status;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], InnerHealingRequest.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], InnerHealingRequest.prototype, "referenceNumber", void 0);
__decorate([
    Index(),
    Column({ type: 'bigint' }),
    __metadata("design:type", String)
], InnerHealingRequest.prototype, "telegramId", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], InnerHealingRequest.prototype, "clientName", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], InnerHealingRequest.prototype, "phone", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InnerHealingRequest.prototype, "topic", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'pending' }),
    __metadata("design:type", String)
], InnerHealingRequest.prototype, "status", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], InnerHealingRequest.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], InnerHealingRequest.prototype, "updatedAt", void 0);
InnerHealingRequest = __decorate([
    Entity('inner_healing_request')
], InnerHealingRequest);
export { InnerHealingRequest };
//# sourceMappingURL=inner-healing-request.entity.js.map