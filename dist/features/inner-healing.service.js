var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var InnerHealingService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InnerHealingRequest } from '../database/entities/inner-healing-request.entity.js';
import { ClientsService } from '../clients/clients.service.js';
let InnerHealingService = InnerHealingService_1 = class InnerHealingService {
    requestRepo;
    clientsService;
    logger = new Logger(InnerHealingService_1.name);
    constructor(requestRepo, clientsService) {
        this.requestRepo = requestRepo;
        this.clientsService = clientsService;
    }
    generateRef() {
        const num = Math.floor(10000 + Math.random() * 90000);
        return `IH-${num}`;
    }
    async createRequest(telegramId, topic) {
        const client = await this.clientsService.findByTelegramId(telegramId);
        if (!client)
            return null;
        const request = this.requestRepo.create({
            referenceNumber: this.generateRef(),
            telegramId: String(telegramId),
            clientName: client.fullName ?? client.firstName ?? 'Client',
            phone: client.phone ?? null,
            topic,
            status: 'pending',
        });
        const saved = await this.requestRepo.save(request);
        this.logger.log(`Created Inner Healing Request ${saved.referenceNumber} for client ${telegramId}`);
        return saved;
    }
    async getRequestsByClient(telegramId) {
        return this.requestRepo.find({
            where: { telegramId: String(telegramId) },
            order: { createdAt: 'DESC' },
        });
    }
    async findAll() {
        return this.requestRepo.find({ order: { createdAt: 'DESC' } });
    }
    async count() {
        return this.requestRepo.count();
    }
    async updateStatus(id, status) {
        const req = await this.requestRepo.findOne({ where: { id } });
        if (!req)
            return null;
        req.status = status;
        return this.requestRepo.save(req);
    }
};
InnerHealingService = InnerHealingService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(InnerHealingRequest)),
    __metadata("design:paramtypes", [Repository,
        ClientsService])
], InnerHealingService);
export { InnerHealingService };
//# sourceMappingURL=inner-healing.service.js.map