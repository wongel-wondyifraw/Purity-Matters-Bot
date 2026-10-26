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
let PhysicalBookOrder = class PhysicalBookOrder {
    id;
    orderNumber;
    resourceId;
    resourceTitle;
    telegramId;
    clientName;
    phone;
    shippingAddress;
    city;
    quantity;
    unitPrice;
    totalAmount;
    currency;
    paymentStatus;
    paymentReference;
    status;
    dispatchNotes;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], PhysicalBookOrder.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], PhysicalBookOrder.prototype, "orderNumber", void 0);
__decorate([
    Column({ type: 'integer' }),
    __metadata("design:type", Number)
], PhysicalBookOrder.prototype, "resourceId", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PhysicalBookOrder.prototype, "resourceTitle", void 0);
__decorate([
    Index(),
    Column({ type: 'bigint' }),
    __metadata("design:type", String)
], PhysicalBookOrder.prototype, "telegramId", void 0);
__decorate([
    Column({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], PhysicalBookOrder.prototype, "clientName", void 0);
__decorate([
    Column({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], PhysicalBookOrder.prototype, "phone", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], PhysicalBookOrder.prototype, "shippingAddress", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, default: 'Addis Ababa' }),
    __metadata("design:type", String)
], PhysicalBookOrder.prototype, "city", void 0);
__decorate([
    Column({ type: 'integer', default: 1 }),
    __metadata("design:type", Number)
], PhysicalBookOrder.prototype, "quantity", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PhysicalBookOrder.prototype, "unitPrice", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PhysicalBookOrder.prototype, "totalAmount", void 0);
__decorate([
    Column({ type: 'varchar', length: 8, default: 'ETB' }),
    __metadata("design:type", String)
], PhysicalBookOrder.prototype, "currency", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'pending' }),
    __metadata("design:type", String)
], PhysicalBookOrder.prototype, "paymentStatus", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], PhysicalBookOrder.prototype, "paymentReference", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'pending' }),
    __metadata("design:type", String)
], PhysicalBookOrder.prototype, "status", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PhysicalBookOrder.prototype, "dispatchNotes", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], PhysicalBookOrder.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], PhysicalBookOrder.prototype, "updatedAt", void 0);
PhysicalBookOrder = __decorate([
    Entity('physical_book_orders')
], PhysicalBookOrder);
export { PhysicalBookOrder };
//# sourceMappingURL=physical-book-order.entity.js.map