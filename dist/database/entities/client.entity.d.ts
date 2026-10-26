export declare class Client {
    id: number;
    telegramId: string;
    fullName?: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    languageCode?: string | null;
    phone?: string | null;
    isRegistered: boolean;
    role: string;
    registrationStep?: string | null;
    metadata?: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
}
