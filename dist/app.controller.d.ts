import { AppService } from './app.service.js';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getStatus(): {
        status: string;
        service: string;
        mode: string;
        timestamp: string;
    };
    getHealth(): {
        status: string;
        service: string;
        mode: string;
        timestamp: string;
    };
    getTelegramStatus(dropPending?: string): Promise<{
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
