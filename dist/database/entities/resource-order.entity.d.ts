export type ResourcePaymentStatus = 'pending' | 'payment_submitted' | 'verified' | 'rejected' | 'cancelled';
export type ResourceFulfillmentStatus = 'pending' | 'delivered' | 'failed_delivery';
export declare class ResourceOrder {
    id: number;
    orderNumber: string;
    resourceId: number;
    resourceTitle: string;
    resourceType: string;
    telegramId: string;
    clientName?: string | null;
    username?: string | null;
    phone?: string | null;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentReference?: string | null;
    paymentStatus: ResourcePaymentStatus;
    fulfillmentStatus: ResourceFulfillmentStatus;
    adminNotes?: string | null;
    paymentSubmittedAt?: Date | null;
    verifiedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
