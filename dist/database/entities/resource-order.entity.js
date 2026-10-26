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
let ResourceOrder = class ResourceOrder {
    id;
    orderNumber;
    resourceId;
    resourceTitle;
    resourceType;
    telegramId;
    clientName;
    username;
    phone;
    amount;
    currency;
    paymentMethod;
    paymentReference;
    paymentStatus;
    fulfillmentStatus;
    adminNotes;
    paymentSubmittedAt;
    verifiedAt;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], ResourceOrder.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ResourceOrder.prototype, "orderNumber", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], ResourceOrder.prototype, "resourceId", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ResourceOrder.prototype, "resourceTitle", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'ebook' }),
    __metadata("design:type", String)
], ResourceOrder.prototype, "resourceType", void 0);
__decorate([
    Index(),
    Column({ type: 'bigint' }),
    __metadata("design:type", String)
], ResourceOrder.prototype, "telegramId", void 0);
__decorate([
    Column({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], ResourceOrder.prototype, "clientName", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], ResourceOrder.prototype, "username", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], ResourceOrder.prototype, "phone", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ResourceOrder.prototype, "amount", void 0);
__decorate([
    Column({ type: 'varchar', length: 8, default: 'ETB' }),
    __metadata("design:type", String)
], ResourceOrder.prototype, "currency", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'telebirr' }),
    __metadata("design:type", String)
], ResourceOrder.prototype, "paymentMethod", void 0);
__decorate([
    Column({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], ResourceOrder.prototype, "paymentReference", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'pending' }),
    __metadata("design:type", String)
], ResourceOrder.prototype, "paymentStatus", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'pending' }),
    __metadata("design:type", String)
], ResourceOrder.prototype, "fulfillmentStatus", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ResourceOrder.prototype, "adminNotes", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ResourceOrder.prototype, "paymentSubmittedAt", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ResourceOrder.prototype, "verifiedAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], ResourceOrder.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], ResourceOrder.prototype, "updatedAt", void 0);
ResourceOrder = __decorate([
    Entity('resource_orders')
], ResourceOrder);
export { ResourceOrder };
//# sourceMappingURL=resource-order.entity.js.map