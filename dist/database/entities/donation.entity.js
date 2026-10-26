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
let Donation = class Donation {
    id;
    referenceNumber;
    telegramId;
    clientName;
    clientUsername;
    clientPhone;
    amount;
    currency;
    paymentMethod;
    status;
    transactionReference;
    notes;
    adminNotes;
    verifiedAt;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Donation.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, unique: true }),
    __metadata("design:type", String)
], Donation.prototype, "referenceNumber", void 0);
__decorate([
    Column({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], Donation.prototype, "telegramId", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Donation.prototype, "clientName", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Donation.prototype, "clientUsername", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], Donation.prototype, "clientPhone", void 0);
__decorate([
    Column({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Donation.prototype, "amount", void 0);
__decorate([
    Column({ type: 'varchar', length: 16, default: 'ETB' }),
    __metadata("design:type", String)
], Donation.prototype, "currency", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, default: 'telebirr' }),
    __metadata("design:type", String)
], Donation.prototype, "paymentMethod", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'pending' }),
    __metadata("design:type", String)
], Donation.prototype, "status", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Donation.prototype, "transactionReference", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Donation.prototype, "notes", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Donation.prototype, "adminNotes", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Donation.prototype, "verifiedAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Donation.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Donation.prototype, "updatedAt", void 0);
Donation = __decorate([
    Entity('donations')
], Donation);
export { Donation };
//# sourceMappingURL=donation.entity.js.map