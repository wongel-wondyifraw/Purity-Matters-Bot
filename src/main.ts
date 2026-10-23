import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getBotToken } from 'nestjs-telegraf';
import * as path from 'path';
import * as fs from 'fs';
import express, { type Request, type Response, type NextFunction } from 'express';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module.js';

// Preload .env before any service configuration evaluates
dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust reverse proxy (cPanel / Phusion Passenger / Apache / LiteSpeed / Nginx)
  app.set('trust proxy', 1);

  // Ensure JSON body parsing is active before route and middleware execution
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Strict anti-caching middleware for dynamic API endpoints.
  // Overrides upstream proxy defaults (e.g. cPanel LiteSpeed/Apache public, max-age=2592000).
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/uploads/')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('X-LiteSpeed-Cache-Control', 'no-cache');
    }
    next();
  });

  const rawAllowedOrigins = [
    'https://anonymous.puritymattersethiopia.com',
    'https://app.puritymattersethiopia.com',
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
    'http://localhost:3003',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
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

  const mode = (configService.get<string>('telegram.mode', 'polling') || '').trim().toLowerCase();
  const token = (configService.get<string>('telegram.token', '') || '').trim();
  const webhookDomain = (configService.get<string>('telegram.webhookDomain', '') || '').trim();
  const rawWebhookPath = (configService.get<string>('telegram.webhookPath', '/api/telegram/webhook') || '').trim();
  const webhookSecret = (configService.get<string>('telegram.webhookSecret', '') || '').trim();

  // Normalize path to always begin with '/' and have no trailing slash
  const normalizedWebhookPath = (rawWebhookPath.startsWith('/') ? rawWebhookPath : `/${rawWebhookPath}`).replace(/\/+$/, '');

  const hasValidToken =
    token.length > 0 &&
    token !== 'your_telegram_bot_token_here';

  let webhookEnabled = false;

  if (mode === 'webhook' && hasValidToken && webhookDomain) {
    try {
      const bot = app.get(getBotToken());

      // Handle uncaught errors within bot commands so they don't crash or return 500
      bot.catch((err: any, ctx: any) => {
        logger.error(`Telegraf update error (update_id: ${ctx?.update?.update_id}):`, err instanceof Error ? err.stack : String(err));
      });

      // Dedicated Telegram webhook middleware.
      // Avoids Express prefix-stripping bugs where bot.webhookCallback fails safeCompare.
      app.use(async (req: Request, res: Response, next: NextFunction) => {
        const reqPath = (req.originalUrl || req.url || '').split('?')[0].replace(/\/+$/, '');

        if (req.method === 'POST' && reqPath === normalizedWebhookPath) {
          if (webhookSecret) {
            const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
            if (secretHeader !== webhookSecret) {
              logger.warn(`Telegram webhook rejected: secret token mismatch (received "${secretHeader}")`);
              return res.status(403).send('Forbidden');
            }
          }

          try {
            let update: any = req.body;

            // 1. If req.body is a Buffer, convert to string
            if (Buffer.isBuffer(update)) {
              update = update.toString('utf-8');
            }

            // 2. If update is a string, parse as JSON
            if (typeof update === 'string') {
              try {
                update = JSON.parse(update);
              } catch {
                update = undefined;
              }
            }

            // 3. If update is still undefined/null, read directly from the incoming request stream
            if (!update) {
              let rawStream = '';
              for await (const chunk of req) {
                rawStream += chunk;
              }
              if (rawStream.trim().length > 0) {
                try {
                  update = JSON.parse(rawStream);
                } catch (streamErr) {
                  logger.error('Failed to parse incoming webhook body stream:', streamErr);
                }
              }
            }

            // 4. Validate that update is a genuine Telegram update object with update_id
            if (update && typeof update === 'object' && 'update_id' in update) {
              await bot.handleUpdate(update, res);
            } else {
              logger.warn(`Received Telegram webhook POST without valid update_id: ${JSON.stringify(update)}`);
            }
          } catch (err) {
            logger.error('Error handling Telegram webhook update:', err);
          } finally {
            // Telegram strictly requires an HTTP 200 OK acknowledgement,
            // otherwise it will retry in an infinite loop.
            if (!res.headersSent) {
              res.status(200).send('OK');
            }
          }
          return;
        }

        // Friendly browser health response for GET requests to the webhook URL
        if (req.method === 'GET' && reqPath === normalizedWebhookPath) {
          return res.status(200).json({
            status: 'ok',
            endpoint: 'Telegram Webhook',
            registeredUrl: `${webhookDomain.replace(/\/+$/, '')}${normalizedWebhookPath}`,
            message: 'Telegram Webhook Endpoint is online and listening for Telegram POST updates.',
          });
        }

        return next();
      });

      webhookEnabled = true;
      logger.log(`Telegram webhook handler mounted at ${normalizedWebhookPath}`);
    } catch (error) {
      logger.error(
        'Failed to attach Telegram webhook handler',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  const rawPort = configService.get<number | string>('port', 3000);
  const isPassenger = typeof (global as any).PhusionPassenger !== 'undefined';
  const listenTarget = isPassenger ? 'passenger' : rawPort;
  await app.listen(listenTarget);

  logger.log(
    `Server listening on ${isPassenger ? 'Passenger IPC socket' : `port ${rawPort}`} (Bot mode: ${mode})`,
  );

  // Register the Telegram webhook with Telegram Bot API
  if (mode === 'webhook' && hasValidToken && webhookDomain && webhookEnabled) {
    const normalizedDomain = webhookDomain.replace(/\/+$/, '');
    const webhookUrl = `${normalizedDomain}${normalizedWebhookPath}`;

    try {
      const bot = app.get(getBotToken());

      logger.log(`Registering webhook with Telegram Bot API: ${webhookUrl}`);
      const registered = await bot.telegram.setWebhook(
        webhookUrl,
        webhookSecret
          ? { secret_token: webhookSecret }
          : {},
      );

      if (registered) {
        logger.log(`Telegram webhook successfully registered: ${webhookUrl}`);
        try {
          const info = await bot.telegram.getWebhookInfo();
          logger.log(
            `Telegram Webhook Status: URL=${info.url}, PendingUpdates=${info.pending_update_count}, LastError=${info.last_error_message ?? 'none'}`,
          );
        } catch (infoError) {
          logger.warn('Could not query getWebhookInfo after registration:', infoError);
        }
      } else {
        logger.error('Telegram webhook registration returned false.');
      }
    } catch (error) {
      logger.error(
        'Telegram webhook registration failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}

bootstrap().catch((error) => {
  console.error('Fatal application bootstrap error:', error);
  process.exit(1);
});
