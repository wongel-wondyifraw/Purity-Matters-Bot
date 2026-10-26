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
let AnonymousQuestion = class AnonymousQuestion {
    id;
    referenceNumber;
    category;
    question;
    status;
    answer;
    answeredAt;
    assignedCounselor;
    isPublic;
    postedToChannel;
    telegramMessageId;
    postedToChannelAt;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], AnonymousQuestion.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], AnonymousQuestion.prototype, "referenceNumber", void 0);
__decorate([
    Column({ type: 'varchar', length: 128, default: 'General' }),
    __metadata("design:type", String)
], AnonymousQuestion.prototype, "category", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], AnonymousQuestion.prototype, "question", void 0);
__decorate([
    Column({ type: 'varchar', length: 32, default: 'pending' }),
    __metadata("design:type", String)
], AnonymousQuestion.prototype, "status", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AnonymousQuestion.prototype, "answer", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], AnonymousQuestion.prototype, "answeredAt", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], AnonymousQuestion.prototype, "assignedCounselor", void 0);
__decorate([
    Column({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], AnonymousQuestion.prototype, "isPublic", void 0);
__decorate([
    Column({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AnonymousQuestion.prototype, "postedToChannel", void 0);
__decorate([
    Column({ type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], AnonymousQuestion.prototype, "telegramMessageId", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], AnonymousQuestion.prototype, "postedToChannelAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], AnonymousQuestion.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], AnonymousQuestion.prototype, "updatedAt", void 0);
AnonymousQuestion = __decorate([
    Entity('anonymous_question')
], AnonymousQuestion);
export { AnonymousQuestion };
//# sourceMappingURL=anonymous-question.entity.js.map