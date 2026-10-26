import { Repository } from 'typeorm';
import { InnerHealingRequest } from '../database/entities/inner-healing-request.entity.js';
import { ClientsService } from '../clients/clients.service.js';
export declare class InnerHealingService {
    private readonly requestRepo;
    private readonly clientsService;
    private readonly logger;
    constructor(requestRepo: Repository<InnerHealingRequest>, clientsService: ClientsService);
    private generateRef;
    createRequest(telegramId: string | number, topic: string): Promise<InnerHealingRequest | null>;
    getRequestsByClient(telegramId: string | number): Promise<InnerHealingRequest[]>;
    findAll(): Promise<InnerHealingRequest[]>;
    count(): Promise<number>;
    updateStatus(id: number, status: string): Promise<InnerHealingRequest | null>;
}
