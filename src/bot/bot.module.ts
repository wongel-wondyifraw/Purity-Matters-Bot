import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotService } from './bot.service.js';
import { BotUpdate } from './bot.update.js';
import { UsersModule } from '../users/users.module.js';

const logger = new Logger('TelegrafInit');

@Module({
  imports: [
    UsersModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('telegram.token') || '';
        const mode = configService.get<string>('telegram.mode', 'polling');
        const webhookDomain = configService.get<string>('telegram.webhookDomain', '');
        const webhookPath = configService.get<string>('telegram.webhookPath', '/api/telegram/webhook');
        const webhookSecret = configService.get<string>('telegram.webhookSecret', '');

        const hasValidToken = token.trim().length > 0 && token !== 'your_telegram_bot_token_here';

        if (!hasValidToken) {
          logger.warn('⚠️  BOT_TOKEN is not configured in .env. Bot update processing is disabled until a valid token is provided.');
          return {
            token: '0000000000:dummy_token',
            launchOptions: false,
          };
        }

        if (mode === 'webhook') {
          if (!webhookDomain) {
            logger.warn('⚠️  BOT_MODE is set to "webhook" but WEBHOOK_DOMAIN is not specified in .env. Update listening is paused.');
            return {
              token,
              launchOptions: false,
            };
          }

          logger.log(`🌐 Configuring Telegram Bot in WEBHOOK mode with domain: ${webhookDomain}${webhookPath}`);
          return {
            token,
            launchOptions: {
              webhook: {
                domain: webhookDomain,
                path: webhookPath,
                ...(webhookSecret ? { secretToken: webhookSecret } : {}),
              },
            },
          };
        }

        logger.log('🔄 Configuring Telegram Bot in POLLING mode');
        return {
          token,
          launchOptions: undefined, // Default long-polling
        };
      },
    }),
  ],
  providers: [BotService, BotUpdate],
  exports: [BotService],
})
export class BotModule {}
