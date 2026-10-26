import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaymentSetting } from '../database/entities/payment-setting.entity.js';
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
export declare class PaymentSettingsService implements OnModuleInit {
    private readonly paymentSettingRepo;
    private readonly logger;
    constructor(paymentSettingRepo: Repository<PaymentSetting>);
    onModuleInit(): Promise<void>;
    seedDefaultsIfNeeded(): Promise<void>;
    getFormattedAccounts(): Promise<PaymentAccountsResponse>;
    getPaymentAccounts(): Promise<PaymentAccountsResponse>;
    getActiveAccounts(): Promise<PaymentSetting[]>;
    updateAccounts(payload: {
        telebirr?: Partial<PaymentSetting>;
        cbe?: Partial<PaymentSetting>;
    }): Promise<PaymentAccountsResponse>;
}
