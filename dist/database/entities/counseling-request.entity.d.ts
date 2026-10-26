export declare class CounselingRequest {
    id: number;
    referenceNumber: string;
    telegramId: string;
    clientName: string;
    phone?: string | null;
    concern: string;
    description?: string | null;
    preferredMethod: string;
    preferredTime?: string | null;
    status: string;
    assignedTo?: string | null;
    scheduledAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
