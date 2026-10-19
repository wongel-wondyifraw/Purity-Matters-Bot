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

  const rawAllowedOrigins = [
    'https://anonymous.puritymattersethiopia.com',
    'https://console.puritymattersethiopia.com',
    'https://admin.puritymattersethiopia.com',
    'https://portal.puritymattersethiopia.com',
    'https://puritymattersethiopia.com',
    'https://www.puritymattersethiopia.com',
    'https://app.puritymatters.com',
    'https://puritymatters.com',
    'https://www.puritymatters.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()) : []),
  ];
  const allowedOrigins = new Set(rawAllowedOrigins.map((o) => o.replace(/\/+$/, '')));

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. Telegram webhooks, mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');

      // Check explicit allowlist or regex matches for any domain/subdomain/local environment
      const isAllowed =
        allowedOrigins.has(normalizedOrigin) ||
        /^https?:\/\/([a-zA-Z0-9-]+\.)*puritymattersethiopia\.com(:\d+)?$/i.test(normalizedOrigin) ||
        /^https?:\/\/([a-zA-Z0-9-]+\.)*puritymatters\.com(:\d+)?$/i.test(normalizedOrigin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(normalizedOrigin) ||
        /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(normalizedOrigin) ||
        /^https?:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/i.test(normalizedOrigin);

      if (isAllowed) {
        return callback(null, true);
      }

      logger.warn(`Blocked by CORS: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    // Omitting allowedHeaders allows cors to dynamically echo back Access-Control-Request-Headers,
    // preventing browser preflight rejection due to headers like Cache-Control, RSC, or client hints.
    optionsSuccessStatus: 204,
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

  const port = configService.get<number | string>('port', 3000);
  await app.listen(port);
  logger.log(`Server listening on ${typeof port === 'number' ? `port ${port}` : port} (Bot mode: ${mode})`);
}
await bootstrap();
