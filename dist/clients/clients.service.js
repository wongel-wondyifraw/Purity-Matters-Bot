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
var ClientsService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../database/entities/client.entity.js';
let ClientsService = ClientsService_1 = class ClientsService {
    clientRepository;
    logger = new Logger(ClientsService_1.name);
    constructor(clientRepository) {
        this.clientRepository = clientRepository;
    }
    async findOrCreateFromTelegram(data) {
        const telegramId = String(data.id);
        let client = await this.clientRepository.findOne({ where: { telegramId } });
        if (!client) {
            client = this.clientRepository.create({
                telegramId,
                username: data.username ?? null,
                firstName: data.first_name ?? null,
                lastName: data.last_name ?? null,
                languageCode: data.language_code ?? null,
                role: 'client',
                isRegistered: false,
            });
            await this.clientRepository.save(client);
            this.logger.log(`Created new Telegram client: ${telegramId} (@${data.username ?? 'none'})`);
        }
        else {
            let hasChanged = false;
            if (data.username !== undefined && client.username !== data.username) {
                client.username = data.username;
                hasChanged = true;
            }
            if (data.first_name !== undefined && client.firstName !== data.first_name) {
                client.firstName = data.first_name;
                hasChanged = true;
            }
            if (data.last_name !== undefined && client.lastName !== data.last_name) {
                client.lastName = data.last_name;
                hasChanged = true;
            }
            if (hasChanged) {
                await this.clientRepository.save(client);
            }
        }
        return client;
    }
    async findByTelegramId(telegramId) {
        return this.clientRepository.findOne({
            where: { telegramId: String(telegramId) },
        });
    }
    async setRegistrationStep(telegramId, step) {
        const client = await this.findByTelegramId(telegramId);
        if (!client)
            return null;
        client.registrationStep = step;
        return this.clientRepository.save(client);
    }
    async saveNameAndPromptPhone(telegramId, fullName) {
        const client = await this.findByTelegramId(telegramId);
        if (!client)
            return null;
        client.fullName = fullName;
        client.registrationStep = 'awaiting_phone';
        return this.clientRepository.save(client);
    }
    async completeRegistration(telegramId, phone) {
        const client = await this.findByTelegramId(telegramId);
        if (!client)
            return null;
        client.phone = phone;
        client.isRegistered = true;
        client.role = 'client';
        client.registrationStep = null;
        return this.clientRepository.save(client);
    }
    async saveClient(client) {
        return this.clientRepository.save(client);
    }
    async updateMetadata(telegramId, metadata) {
        const client = await this.findByTelegramId(telegramId);
        if (!client)
            return null;
        client.metadata = { ...(client.metadata ?? {}), ...metadata };
        return this.clientRepository.save(client);
    }
    async cancelRegistration(telegramId) {
        const client = await this.findByTelegramId(telegramId);
        if (!client)
            return null;
        client.registrationStep = null;
        return this.clientRepository.save(client);
    }
    async findAll() {
        return this.clientRepository.find({ order: { createdAt: 'DESC' } });
    }
    async findById(id) {
        return this.clientRepository.findOne({ where: { id } });
    }
    async updateRole(id, role) {
        const client = await this.findById(id);
        if (!client)
            return null;
        client.role = role;
        return this.clientRepository.save(client);
    }
    async findByPhone(phone) {
        if (!phone || !phone.trim())
            return null;
        const clean = phone.trim();
        const direct = await this.clientRepository.findOne({ where: { phone: clean } });
        if (direct)
            return direct;
        const digitsOnly = clean.replace(/\D/g, '');
        if (digitsOnly.length >= 7) {
            const allWithPhone = await this.clientRepository.find({
                select: { id: true, phone: true, fullName: true, telegramId: true },
            });
            const match = allWithPhone.find((c) => c.phone && c.phone.replace(/\D/g, '') === digitsOnly);
            if (match) {
                return this.findById(match.id);
            }
        }
        return null;
    }
    async count() {
        return this.clientRepository.count();
    }
    async createClient(data) {
        const telegramId = data.telegramId && String(data.telegramId).trim().length > 0
            ? String(data.telegramId).trim()
            : String(Date.now());
        const trimmedName = data.fullName.trim();
        const parts = trimmedName.split(/\s+/);
        const firstName = parts[0] || null;
        const lastName = parts.slice(1).join(' ') || null;
        const client = this.clientRepository.create({
            telegramId,
            fullName: trimmedName,
            firstName,
            lastName,
            username: data.username ? data.username.replace(/^@/, '').trim() : null,
            phone: data.phone ? data.phone.trim() : null,
            languageCode: data.languageCode || 'en',
            role: data.role || 'client',
            isRegistered: data.isRegistered !== undefined ? data.isRegistered : true,
            registrationStep: 'completed',
        });
        return this.clientRepository.save(client);
    }
    async deleteClient(id) {
        const res = await this.clientRepository.delete(id);
        return (res.affected ?? 0) > 0;
    }
};
ClientsService = ClientsService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(Client)),
    __metadata("design:paramtypes", [Repository])
], ClientsService);
export { ClientsService };
//# sourceMappingURL=clients.service.js.map