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
var PaymentSettingsService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentSetting, } from '../database/entities/payment-setting.entity.js';
let PaymentSettingsService = PaymentSettingsService_1 = class PaymentSettingsService {
    paymentSettingRepo;
    logger = new Logger(PaymentSettingsService_1.name);
    constructor(paymentSettingRepo) {
        this.paymentSettingRepo = paymentSettingRepo;
    }
    async onModuleInit() {
        await this.seedDefaultsIfNeeded();
    }
    async seedDefaultsIfNeeded() {
        try {
            const count = await this.paymentSettingRepo.count();
            if (count === 0) {
                this.logger.log('Seeding initial Telebirr & CBE Payment Settings...');
                await this.paymentSettingRepo.save([
                    {
                        provider: 'telebirr',
                        accountName: 'Purity Matters Ministry',
                        accountNumber: '0911223344',
                        branchOrShortcode: null,
                        instructions: 'Transfer the exact amount via Telebirr app. Include your Order Reference in the transaction remarks.',
                        isActive: true,
                    },
                    {
                        provider: 'cbe',
                        accountName: 'Purity Matters Ministry',
                        accountNumber: '1000123456789',
                        branchOrShortcode: 'Finfinnee Branch',
                        instructions: 'Transfer via CBE Birr or CBE Mobile Banking. Include your Order Reference in the transaction reason.',
                        isActive: true,
                    },
                ]);
                this.logger.log('Telebirr & CBE Payment Settings seeded successfully.');
            }
        }
        catch (err) {
            this.logger.warn('Payment settings seed deferred or skipped:', err);
        }
    }
    async getFormattedAccounts() {
        const records = await this.paymentSettingRepo.find();
        const telebirr = records.find((r) => r.provider === 'telebirr');
        const cbe = records.find((r) => r.provider === 'cbe');
        return {
            telebirr: {
                id: telebirr?.id,
                accountName: telebirr?.accountName || 'Purity Matters Ministry',
                accountNumber: telebirr?.accountNumber || '0911223344',
                branchOrShortcode: telebirr?.branchOrShortcode || null,
                instructions: telebirr?.instructions ||
                    'Transfer exact amount via Telebirr app. Include Order Ref in remarks.',
                isActive: telebirr?.isActive ?? true,
            },
            cbe: {
                id: cbe?.id,
                accountName: cbe?.accountName || 'Purity Matters Ministry',
                accountNumber: cbe?.accountNumber || '1000123456789',
                branchOrShortcode: cbe?.branchOrShortcode || 'Finfinnee Branch',
                instructions: cbe?.instructions ||
                    'Transfer via CBE Birr or Mobile Banking. Include Order Ref in reason.',
                isActive: cbe?.isActive ?? true,
            },
        };
    }
    async getPaymentAccounts() {
        return this.getFormattedAccounts();
    }
    async getActiveAccounts() {
        return this.paymentSettingRepo.find({ where: { isActive: true } });
    }
    async updateAccounts(payload) {
        if (payload.telebirr) {
            let telebirrRecord = await this.paymentSettingRepo.findOne({
                where: { provider: 'telebirr' },
            });
            if (!telebirrRecord) {
                telebirrRecord = this.paymentSettingRepo.create({
                    provider: 'telebirr',
                    accountName: payload.telebirr.accountName || 'Purity Matters Ministry',
                    accountNumber: payload.telebirr.accountNumber || '',
                    instructions: payload.telebirr.instructions || '',
                    isActive: payload.telebirr.isActive ?? true,
                });
            }
            else {
                Object.assign(telebirrRecord, payload.telebirr);
            }
            await this.paymentSettingRepo.save(telebirrRecord);
        }
        if (payload.cbe) {
            let cbeRecord = await this.paymentSettingRepo.findOne({
                where: { provider: 'cbe' },
            });
            if (!cbeRecord) {
                cbeRecord = this.paymentSettingRepo.create({
                    provider: 'cbe',
                    accountName: payload.cbe.accountName || 'Purity Matters Ministry',
                    accountNumber: payload.cbe.accountNumber || '',
                    branchOrShortcode: payload.cbe.branchOrShortcode || null,
                    instructions: payload.cbe.instructions || '',
                    isActive: payload.cbe.isActive ?? true,
                });
            }
            else {
                Object.assign(cbeRecord, payload.cbe);
            }
            await this.paymentSettingRepo.save(cbeRecord);
        }
        return this.getFormattedAccounts();
    }
};
PaymentSettingsService = PaymentSettingsService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(PaymentSetting)),
    __metadata("design:paramtypes", [Repository])
], PaymentSettingsService);
export { PaymentSettingsService };
//# sourceMappingURL=payment-settings.service.js.map