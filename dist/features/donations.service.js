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
var DonationsService_1;
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from '../database/entities/donation.entity.js';
let DonationsService = DonationsService_1 = class DonationsService {
    donationRepo;
    logger = new Logger(DonationsService_1.name);
    constructor(donationRepo) {
        this.donationRepo = donationRepo;
    }
    generateReference() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(1000 + Math.random() * 9000);
        return `DON-${timestamp}-${random}`;
    }
    async create(data) {
        const donation = new Donation();
        donation.referenceNumber = this.generateReference();
        donation.telegramId = String(data.telegramId);
        donation.clientName = data.clientName || 'Anonymous Partner';
        donation.clientUsername = data.clientUsername || null;
        donation.clientPhone = data.clientPhone || null;
        donation.amount = Number(data.amount) || 0;
        donation.currency = data.currency || 'ETB';
        donation.paymentMethod = data.paymentMethod || 'telebirr';
        donation.status = 'pending';
        donation.notes = data.notes || null;
        return this.donationRepo.save(donation);
    }
    async findAll(filter) {
        const qb = this.donationRepo.createQueryBuilder('donation');
        if (filter?.status && filter.status !== 'all') {
            qb.andWhere('donation.status = :status', { status: filter.status });
        }
        if (filter?.search) {
            const s = `%${filter.search.toLowerCase()}%`;
            qb.andWhere('(LOWER(donation.referenceNumber) LIKE :s OR LOWER(donation.clientName) LIKE :s OR LOWER(donation.telegramId) LIKE :s OR LOWER(donation.paymentMethod) LIKE :s)', { s });
        }
        qb.orderBy('donation.createdAt', 'DESC');
        return qb.getMany();
    }
    async findById(id) {
        const donation = await this.donationRepo.findOneBy({ id });
        if (!donation) {
            throw new NotFoundException(`Donation #${id} not found.`);
        }
        return donation;
    }
    async markAsDonated(id, method) {
        const donation = await this.findById(id);
        donation.status = 'payment_submitted';
        if (method) {
            donation.paymentMethod = method;
        }
        return this.donationRepo.save(donation);
    }
    async updateStatus(id, status, adminNotes) {
        const donation = await this.findById(id);
        donation.status = status;
        if (adminNotes !== undefined) {
            donation.adminNotes = adminNotes;
        }
        if (status === 'verified') {
            donation.verifiedAt = new Date();
        }
        return this.donationRepo.save(donation);
    }
    async delete(id) {
        const result = await this.donationRepo.delete(id);
        return (result.affected ?? 0) > 0;
    }
};
DonationsService = DonationsService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(Donation)),
    __metadata("design:paramtypes", [Repository])
], DonationsService);
export { DonationsService };
//# sourceMappingURL=donations.service.js.map