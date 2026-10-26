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
var CounselingService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselingRequest } from '../database/entities/counseling-request.entity.js';
import { ClientsService } from '../clients/clients.service.js';
let CounselingService = CounselingService_1 = class CounselingService {
    requestRepo;
    clientsService;
    logger = new Logger(CounselingService_1.name);
    constructor(requestRepo, clientsService) {
        this.requestRepo = requestRepo;
        this.clientsService = clientsService;
    }
    generateRef() {
        const num = Math.floor(10000 + Math.random() * 90000);
        return `CN-${num}`;
    }
    async getDraft(telegramId) {
        const client = await this.clientsService.findByTelegramId(telegramId);
        return client?.metadata?.counselingDraft ?? {};
    }
    async updateDraft(telegramId, draft) {
        const current = await this.getDraft(telegramId);
        const updated = { ...current, ...draft };
        await this.clientsService.updateMetadata(telegramId, { counselingDraft: updated });
        return updated;
    }
    async clearDraft(telegramId) {
        await this.clientsService.updateMetadata(telegramId, { counselingDraft: null });
    }
    async createRequest(telegramId) {
        const client = await this.clientsService.findByTelegramId(telegramId);
        if (!client)
            return null;
        const draft = await this.getDraft(telegramId);
        if (!draft.concern || !draft.preferredMethod) {
            return null;
        }
        const request = this.requestRepo.create({
            referenceNumber: this.generateRef(),
            telegramId: String(telegramId),
            clientName: client.fullName ?? client.firstName ?? 'Client',
            phone: client.phone ?? null,
            concern: draft.concern,
            description: draft.description && draft.description.trim().length > 0 ? draft.description : 'Not specified',
            preferredMethod: draft.preferredMethod,
            preferredTime: draft.preferredTime || null,
            status: 'pending',
        });
        const saved = await this.requestRepo.save(request);
        await this.clearDraft(telegramId);
        await this.clientsService.setRegistrationStep(telegramId, null);
        this.logger.log(`Created Counseling Request ${saved.referenceNumber} for client ${telegramId}`);
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
    async updateStatus(id, status, assignedTo) {
        return this.updateRequest(id, { status, assignedTo });
    }
    async updateRequest(id, data) {
        const req = await this.requestRepo.findOne({ where: { id } });
        if (!req)
            return null;
        if (data.status !== undefined)
            req.status = data.status;
        if (data.assignedTo !== undefined)
            req.assignedTo = data.assignedTo?.trim() || null;
        if (data.concern !== undefined)
            req.concern = data.concern;
        if (data.description !== undefined)
            req.description = data.description;
        if (data.preferredMethod !== undefined)
            req.preferredMethod = data.preferredMethod;
        if (data.preferredTime !== undefined)
            req.preferredTime = data.preferredTime;
        if (data.scheduledAt !== undefined) {
            req.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
        }
        return this.requestRepo.save(req);
    }
    async directCreate(data) {
        const rawTid = data.telegramId && String(data.telegramId).trim() !== ''
            ? String(data.telegramId).trim()
            : null;
        let client = null;
        if (rawTid) {
            client = await this.clientsService.findByTelegramId(rawTid);
        }
        if (!client && data.phone && data.phone.trim().length > 0) {
            client = await this.clientsService.findByPhone(data.phone.trim());
        }
        if (!client) {
            let assignedTid = rawTid;
            if (!assignedTid) {
                let candidate = String(Date.now());
                while (await this.clientsService.findByTelegramId(candidate)) {
                    candidate = String(Date.now() + Math.floor(Math.random() * 10000));
                }
                assignedTid = candidate;
            }
            client = await this.clientsService.createClient({
                fullName: data.clientName.trim(),
                telegramId: assignedTid,
                phone: data.phone?.trim() || null,
                role: 'client',
                isRegistered: true,
            });
            this.logger.log(`Registered Walk-in Client #${client.id} ("${client.fullName}") in clients table with Telegram ID ${client.telegramId}`);
        }
        else {
            let changed = false;
            if (data.phone && (!client.phone || client.phone === 'Not shared')) {
                client.phone = data.phone.trim();
                changed = true;
            }
            if (data.clientName && (!client.fullName || client.fullName.startsWith('User #'))) {
                client.fullName = data.clientName.trim();
                changed = true;
            }
            if (changed) {
                await this.clientsService.saveClient(client);
            }
        }
        let ref = this.generateRef();
        let existing = await this.requestRepo.findOne({ where: { referenceNumber: ref } });
        while (existing) {
            ref = this.generateRef();
            existing = await this.requestRepo.findOne({ where: { referenceNumber: ref } });
        }
        const request = this.requestRepo.create({
            referenceNumber: ref,
            telegramId: String(client.telegramId),
            clientName: client.fullName || data.clientName.trim(),
            phone: client.phone || data.phone?.trim() || null,
            concern: data.concern.trim(),
            description: data.description && data.description.trim().length > 0
                ? data.description.trim()
                : 'Not specified',
            preferredMethod: data.preferredMethod.trim(),
            preferredTime: data.preferredTime?.trim() || null,
            status: data.status?.trim() || 'pending',
            assignedTo: data.assignedTo?.trim() || null,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        });
        const saved = await this.requestRepo.save(request);
        this.logger.log(`Created Direct Counseling Request ${saved.referenceNumber} for client "${saved.clientName}" (client #${client.id}, TG: ${client.telegramId})`);
        return saved;
    }
    async deleteRequest(id) {
        const req = await this.requestRepo.findOne({ where: { id } });
        if (!req)
            return false;
        await this.requestRepo.remove(req);
        this.logger.log(`Deleted Counseling Request #${id} (${req.referenceNumber})`);
        return true;
    }
};
CounselingService = CounselingService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(CounselingRequest)),
    __metadata("design:paramtypes", [Repository,
        ClientsService])
], CounselingService);
export { CounselingService };
//# sourceMappingURL=counseling.service.js.map