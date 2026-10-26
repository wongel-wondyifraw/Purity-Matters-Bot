import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentSetting,
  PaymentProvider,
} from '../database/entities/payment-setting.entity.js';

export interface PaymentAccountsResponse {
  telebirr: {
    id?: number;
    accountName: string;
    accountNumber: string;
    branchOrShortcode?: string | null;
    instructions: string;
    isActive: boolean;
  };
  cbe: {
    id?: number;
    accountName: string;
    accountNumber: string;
    branchOrShortcode?: string | null;
    instructions: string;
    isActive: boolean;
  };
}

@Injectable()
export class PaymentSettingsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentSettingsService.name);

  constructor(
    @InjectRepository(PaymentSetting)
    private readonly paymentSettingRepo: Repository<PaymentSetting>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultsIfNeeded();
  }

  async seedDefaultsIfNeeded(): Promise<void> {
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
            instructions:
              'Transfer the exact amount via Telebirr app. Include your Order Reference in the transaction remarks.',
            isActive: true,
          },
          {
            provider: 'cbe',
            accountName: 'Purity Matters Ministry',
            accountNumber: '1000123456789',
            branchOrShortcode: 'Finfinnee Branch',
            instructions:
              'Transfer via CBE Birr or CBE Mobile Banking. Include your Order Reference in the transaction reason.',
            isActive: true,
          },
        ]);
        this.logger.log('Telebirr & CBE Payment Settings seeded successfully.');
      }
    } catch (err) {
      this.logger.warn('Payment settings seed deferred or skipped:', err);
    }
  }

  async getFormattedAccounts(): Promise<PaymentAccountsResponse> {
    const records = await this.paymentSettingRepo.find();
    const telebirr = records.find((r) => r.provider === 'telebirr');
    const cbe = records.find((r) => r.provider === 'cbe');

    return {
      telebirr: {
        id: telebirr?.id,
        accountName: telebirr?.accountName || 'Purity Matters Ministry',
        accountNumber: telebirr?.accountNumber || '0911223344',
        branchOrShortcode: telebirr?.branchOrShortcode || null,
        instructions:
          telebirr?.instructions ||
          'Transfer exact amount via Telebirr app. Include Order Ref in remarks.',
        isActive: telebirr?.isActive ?? true,
      },
      cbe: {
        id: cbe?.id,
        accountName: cbe?.accountName || 'Purity Matters Ministry',
        accountNumber: cbe?.accountNumber || '1000123456789',
        branchOrShortcode: cbe?.branchOrShortcode || 'Finfinnee Branch',
        instructions:
          cbe?.instructions ||
          'Transfer via CBE Birr or Mobile Banking. Include Order Ref in reason.',
        isActive: cbe?.isActive ?? true,
      },
    };
  }

  async getPaymentAccounts(): Promise<PaymentAccountsResponse> {
    return this.getFormattedAccounts();
  }

  async getActiveAccounts(): Promise<PaymentSetting[]> {
    return this.paymentSettingRepo.find({ where: { isActive: true } });
  }

  async updateAccounts(payload: {
    telebirr?: Partial<PaymentSetting>;
    cbe?: Partial<PaymentSetting>;
  }): Promise<PaymentAccountsResponse> {
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
      } else {
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
      } else {
        Object.assign(cbeRecord, payload.cbe);
      }
      await this.paymentSettingRepo.save(cbeRecord);
    }

    return this.getFormattedAccounts();
  }
}
