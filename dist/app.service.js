var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { getBotToken } from 'nestjs-telegraf';
let AppService = class AppService {
    configService;
    moduleRef;
    constructor(configService, moduleRef) {
        this.configService = configService;
        this.moduleRef = moduleRef;
    }
    getStatus() {
        return {
            status: 'ok',
            service: 'Purity Matters Bot Backend',
            mode: this.configService.get('telegram.mode', 'polling'),
            timestamp: new Date().toISOString(),
        };
    }
    async getTelegramStatus(dropPending = false) {
        const token = this.configService.get('telegram.token', '');
        const mode = this.configService.get('telegram.mode', 'polling');
        const webhookDomain = this.configService.get('telegram.webhookDomain', '');
        const webhookPath = this.configService.get('telegram.webhookPath', '/api/telegram/webhook');
        const hasSecret = Boolean(this.configService.get('telegram.webhookSecret', ''));
        const hasValidToken = token.trim().length > 0 && token !== 'your_telegram_bot_token_here';
        let webhookInfo = null;
        let botError = null;
        let droppedUpdates = false;
        if (hasValidToken) {
            try {
                const bot = this.moduleRef.get(getBotToken(), { strict: false });
                if (bot?.telegram) {
                    if (dropPending && mode === 'webhook' && webhookDomain) {
                        const normalizedDomain = webhookDomain.replace(/\/+$/, '');
                        const normalizedPath = (webhookPath.startsWith('/') ? webhookPath : `/${webhookPath}`).replace(/\/+$/, '');
                        const webhookUrl = `${normalizedDomain}${normalizedPath}`;
                        const secret = this.configService.get('telegram.webhookSecret', '');
                        await bot.telegram.setWebhook(webhookUrl, {
                            ...(secret ? { secret_token: secret } : {}),
                            drop_pending_updates: true,
                        });
                        droppedUpdates = true;
                    }
                    webhookInfo = await bot.telegram.getWebhookInfo();
                }
            }
            catch (err) {
                botError = err instanceof Error ? err.message : String(err);
            }
        }
        return {
            status: 'ok',
            botConfigured: hasValidToken,
            mode,
            webhookDomain,
            webhookPath,
            webhookSecretConfigured: hasSecret,
            telegramWebhookInfo: webhookInfo,
            error: botError,
            timestamp: new Date().toISOString(),
        };
    }
};
AppService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService,
        ModuleRef])
], AppService);
export { AppService };
//# sourceMappingURL=app.service.js.map