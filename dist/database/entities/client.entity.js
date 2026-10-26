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
let Client = class Client {
    id;
    telegramId;
    fullName;
    username;
    firstName;
    lastName;
    languageCode;
    phone;
    isRegistered;
    role;
    registrationStep;
    metadata;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Client.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: 'bigint' }),
    __metadata("design:type", String)
], Client.prototype, "telegramId", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Client.prototype, "fullName", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Client.prototype, "username", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Client.prototype, "firstName", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Client.prototype, "lastName", void 0);
__decorate([
    Column({ type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", Object)
], Client.prototype, "languageCode", void 0);
__decorate([
    Column({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], Client.prototype, "phone", void 0);
__decorate([
    Column({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Client.prototype, "isRegistered", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'client' }),
    __metadata("design:type", String)
], Client.prototype, "role", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], Client.prototype, "registrationStep", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true, default: {} }),
    __metadata("design:type", Object)
], Client.prototype, "metadata", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Client.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Client.prototype, "updatedAt", void 0);
Client = __decorate([
    Entity('client')
], Client);
export { Client };
//# sourceMappingURL=client.entity.js.map