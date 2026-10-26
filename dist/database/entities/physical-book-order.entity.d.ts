export type PhysicalOrderStatus = 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
export type PhysicalPaymentStatus = 'pending' | 'verified' | 'refunded';
export declare class PhysicalBookOrder {
    id: number;
    orderNumber: string;
    resourceId: number;
    resourceTitle: string;
    telegramId: string;
    clientName: string;
    phone: string;
    shippingAddress: string;
    city: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    currency: string;
    paymentStatus: PhysicalPaymentStatus;
    paymentReference?: string | null;
    status: PhysicalOrderStatus;
    dispatchNotes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
