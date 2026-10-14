import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getBotToken } from 'nestjs-telegraf';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(process.cwd(), 'uploads/resources/ebooks');
  fs.mkdirSync(uploadsDir, { recursive: true });

  // Serve uploaded files statically at /uploads/*
  app.useStaticAssets(path.resolve(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
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
