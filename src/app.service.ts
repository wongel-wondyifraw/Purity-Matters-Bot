import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { getBotToken } from 'nestjs-telegraf';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  getStatus() {
    return {
      status: 'ok',
      service: 'Purity Matters Bot Backend',
      mode: this.configService.get<string>('telegram.mode', 'polling'),
      timestamp: new Date().toISOString(),
    };
  }

  async getTelegramStatus(dropPending = false) {
    const token = this.configService.get<string>('telegram.token', '');
    const mode = this.configService.get<string>('telegram.mode', 'polling');
    const webhookDomain = this.configService.get<string>('telegram.webhookDomain', '');
    const webhookPath = this.configService.get<string>('telegram.webhookPath', '/api/telegram/webhook');
    const hasSecret = Boolean(this.configService.get<string>('telegram.webhookSecret', ''));

    const hasValidToken = token.trim().length > 0 && token !== 'your_telegram_bot_token_here';

    let webhookInfo: any = null;
    let botError: string | null = null;
    let droppedUpdates = false;

    if (hasValidToken) {
      try {
        const bot = this.moduleRef.get(getBotToken(), { strict: false });
        if (bot?.telegram) {
          if (dropPending && mode === 'webhook' && webhookDomain) {
            const normalizedDomain = webhookDomain.replace(/\/+$/, '');
            const normalizedPath = (webhookPath.startsWith('/') ? webhookPath : `/${webhookPath}`).replace(/\/+$/, '');
            const webhookUrl = `${normalizedDomain}${normalizedPath}`;
            const secret = this.configService.get<string>('telegram.webhookSecret', '');

            await bot.telegram.setWebhook(webhookUrl, {
              ...(secret ? { secret_token: secret } : {}),
              drop_pending_updates: true,
            });
            droppedUpdates = true;
          }
          webhookInfo = await bot.telegram.getWebhookInfo();
        }
      } catch (err) {
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
}
