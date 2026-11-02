import { Repository } from 'typeorm';
import { Donation, DonationStatus } from '../database/entities/donation.entity.js';
import type { PageRequest } from '../common/pagination.js';
export interface CreateDonationDto {
    telegramId: string | number;
    clientName: string;
    clientUsername?: string | null;
    clientPhone?: string | null;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    notes?: string;
}
export declare class DonationsService {
    private readonly donationRepo;
    private readonly logger;
    constructor(donationRepo: Repository<Donation>);
    generateReference(): string;
    create(data: CreateDonationDto): Promise<Donation>;
    findAll(filter?: {
        status?: string;
        search?: string;
    }): Promise<Donation[]>;
    findAdminPage(pageRequest: PageRequest, filter: {
        status?: string;
        search?: string;
        paymentMethod?: string;
    }): Promise<{
        items: Donation[];
        total: number;
        page: number;
    }>;
    getAdminSummary(): Promise<{
        total: number;
        verifiedAmount: number;
        verifiedCount: number;
        pendingCount: number;
    }>;
    findById(id: number): Promise<Donation>;
    markAsDonated(id: number, method?: string): Promise<Donation>;
    updateStatus(id: number, status: DonationStatus, adminNotes?: string): Promise<Donation>;
    delete(id: number): Promise<boolean>;
}
