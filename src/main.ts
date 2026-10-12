import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getBotToken } from 'nestjs-telegraf';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });
  const configService = app.get(ConfigService);

  const mode = configService.get<string>('telegram.mode', 'polling');
  const token = configService.get<string>('telegram.token');
  const webhookDomain = configService.get<string>('telegram.webhookDomain');
  const webhookPath = configService.get<string>('telegram.webhookPath', '/api/telegram/webhook');
  const webhookSecret = configService.get<string>('telegram.webhookSecret');

  const hasValidToken = !!token && token.trim().length > 0 && token !== 'your_telegram_bot_token_here';

  if (mode === 'webhook' && hasValidToken && webhookDomain) {
    try {
      const bot = app.get(getBotToken());
      app.use(bot.webhookCallback(webhookPath, webhookSecret ? { secretToken: webhookSecret } : undefined));
      logger.log(`Telegram webhook endpoint mounted at: ${webhookPath}`);
    } catch (error) {
      logger.error('Failed to attach Telegram webhook handler', error);
    }
  }

  const port = configService.get<number>('port', 3000);
  await app.listen(port);
  logger.log(`Server listening on port ${port} (Bot mode: ${mode})`);
}
await bootstrap();
