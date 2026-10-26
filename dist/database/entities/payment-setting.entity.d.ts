export type PaymentProvider = 'telebirr' | 'cbe';
export declare class PaymentSetting {
    id: number;
    provider: PaymentProvider;
    accountName: string;
    accountNumber: string;
    branchOrShortcode?: string | null;
    instructions?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
