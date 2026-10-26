var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotService } from './bot.service.js';
import { BotUpdate } from './bot.update.js';
import { ClientsModule } from '../clients/clients.module.js';
import { FeaturesModule } from '../features/features.module.js';
const logger = new Logger('TelegrafInit');
let BotModule = class BotModule {
};
BotModule = __decorate([
    Module({
        imports: [
            ClientsModule,
            FeaturesModule,
            TelegrafModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService) => {
                    const token = configService.get('telegram.token') || '';
                    const mode = configService.get('telegram.mode', 'polling');
                    const webhookDomain = configService.get('telegram.webhookDomain', '');
                    const webhookPath = configService.get('telegram.webhookPath', '/api/telegram/webhook');
                    const hasValidToken = token.trim().length > 0 &&
                        token !== 'your_telegram_bot_token_here';
                    if (!hasValidToken) {
                        logger.warn('BOT_TOKEN is not configured. Telegram bot startup is disabled.');
                        return {
                            token: '0000000000:dummy_token',
                            launchOptions: false,
                        };
                    }
                    if (mode === 'webhook') {
                        if (!webhookDomain) {
                            logger.warn('BOT_MODE is webhook but WEBHOOK_DOMAIN is not configured.');
                        }
                        logger.log(`Configuring Telegram Bot in WEBHOOK mode: ${webhookDomain}${webhookPath}`);
                        return {
                            token,
                            launchOptions: false,
                        };
                    }
                    logger.log('Configuring Telegram Bot in POLLING mode');
                    return {
                        token,
                        launchOptions: undefined,
                    };
                },
            }),
        ],
        providers: [BotService, BotUpdate],
        exports: [BotService],
    })
], BotModule);
export { BotModule };
//# sourceMappingURL=bot.module.js.map