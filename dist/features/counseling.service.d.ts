import { Repository } from 'typeorm';
import { CounselingRequest } from '../database/entities/counseling-request.entity.js';
import { ClientsService } from '../clients/clients.service.js';
export interface CounselingDraft {
    concern?: string;
    description?: string | null;
    preferredMethod?: string;
    preferredTime?: string | null;
}
export declare class CounselingService {
    private readonly requestRepo;
    private readonly clientsService;
    private readonly logger;
    constructor(requestRepo: Repository<CounselingRequest>, clientsService: ClientsService);
    private generateRef;
    getDraft(telegramId: string | number): Promise<CounselingDraft>;
    updateDraft(telegramId: string | number, draft: Partial<CounselingDraft>): Promise<{
        concern?: string;
        description?: string | null;
        preferredMethod?: string;
        preferredTime?: string | null;
    }>;
    clearDraft(telegramId: string | number): Promise<void>;
    createRequest(telegramId: string | number): Promise<CounselingRequest | null>;
    getRequestsByClient(telegramId: string | number): Promise<CounselingRequest[]>;
    findAll(): Promise<CounselingRequest[]>;
    count(): Promise<number>;
    updateStatus(id: number, status: string, assignedTo?: string): Promise<CounselingRequest | null>;
    updateRequest(id: number, data: {
        status?: string;
        assignedTo?: string | null;
        concern?: string;
        description?: string | null;
        preferredMethod?: string;
        preferredTime?: string;
        scheduledAt?: Date | string | null;
    }): Promise<CounselingRequest | null>;
    directCreate(data: {
        clientName: string;
        phone?: string | null;
        telegramId?: string | number | null;
        concern: string;
        description?: string | null;
        preferredMethod: string;
        preferredTime?: string | null;
        status?: string;
        assignedTo?: string | null;
        scheduledAt?: Date | string | null;
    }): Promise<CounselingRequest>;
    deleteRequest(id: number): Promise<boolean>;
}
