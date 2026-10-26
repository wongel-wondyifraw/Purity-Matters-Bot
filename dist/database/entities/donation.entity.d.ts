export type DonationStatus = 'pending' | 'payment_submitted' | 'verified' | 'rejected';
export declare class Donation {
    id: number;
    referenceNumber: string;
    telegramId: string;
    clientName: string;
    clientUsername?: string | null;
    clientPhone?: string | null;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: DonationStatus;
    transactionReference?: string | null;
    notes?: string | null;
    adminNotes?: string | null;
    verifiedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
