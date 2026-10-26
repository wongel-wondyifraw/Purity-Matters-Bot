import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
export declare class AppService {
    private readonly configService;
    private readonly moduleRef;
    constructor(configService: ConfigService, moduleRef: ModuleRef);
    getStatus(): {
        status: string;
        service: string;
        mode: string;
        timestamp: string;
    };
    getTelegramStatus(dropPending?: boolean): Promise<{
        status: string;
        botConfigured: boolean;
        mode: string;
        webhookDomain: string;
        webhookPath: string;
        webhookSecretConfigured: boolean;
        telegramWebhookInfo: any;
        error: string | null;
        timestamp: string;
    }>;
}
