export declare class AnonymousQuestion {
    id: number;
    referenceNumber: string;
    category: string;
    question: string;
    status: string;
    answer?: string | null;
    answeredAt?: Date | null;
    assignedCounselor?: string | null;
    isPublic: boolean;
    postedToChannel: boolean;
    telegramMessageId?: number | null;
    postedToChannelAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
