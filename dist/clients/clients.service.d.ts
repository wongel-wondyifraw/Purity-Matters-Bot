import { Repository } from 'typeorm';
import { Client } from '../database/entities/client.entity.js';
export interface TelegramUserData {
    id: number | string;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    language_code?: string | null;
}
export declare class ClientsService {
    private readonly clientRepository;
    private readonly logger;
    constructor(clientRepository: Repository<Client>);
    findOrCreateFromTelegram(data: TelegramUserData): Promise<Client>;
    findByTelegramId(telegramId: number | string): Promise<Client | null>;
    setRegistrationStep(telegramId: number | string, step: string | null): Promise<Client | null>;
    saveNameAndPromptPhone(telegramId: number | string, fullName: string): Promise<Client | null>;
    completeRegistration(telegramId: number | string, phone: string): Promise<Client | null>;
    saveClient(client: Client): Promise<Client>;
    updateMetadata(telegramId: number | string, metadata: Record<string, any>): Promise<Client | null>;
    cancelRegistration(telegramId: number | string): Promise<Client | null>;
    findAll(): Promise<Client[]>;
    findById(id: number): Promise<Client | null>;
    updateRole(id: number, role: string): Promise<Client | null>;
    findByPhone(phone: string): Promise<Client | null>;
    count(): Promise<number>;
    createClient(data: {
        fullName: string;
        telegramId?: string | number | null;
        username?: string | null;
        phone?: string | null;
        languageCode?: string | null;
        role?: string;
        isRegistered?: boolean;
    }): Promise<Client>;
    deleteClient(id: number): Promise<boolean>;
}
