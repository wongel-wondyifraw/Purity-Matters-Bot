import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getBotToken } from 'nestjs-telegraf';
import * as path from 'path';
import * as fs from 'fs';
import express from 'express';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module.js';
dotenv.config();
async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);
    app.set('trust proxy', 1);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use((req, res, next) => {
        if (req.path.startsWith('/uploads/')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
        else {
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
            if (!origin) {
                return callback(null, true);
            }
            const normalizedOrigin = origin.replace(/\/+$/, '');
            const isAllowed = allowedOrigins.has(normalizedOrigin) ||
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
        optionsSuccessStatus: 204,
    });
    const uploadsDir = path.resolve(process.cwd(), 'uploads/resources/ebooks');
    fs.mkdirSync(uploadsDir, { recursive: true });
    app.useStaticAssets(path.resolve(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });
    const configService = app.get(ConfigService);
    const mode = (configService.get('telegram.mode', 'polling') || '').trim().toLowerCase();
    const token = (configService.get('telegram.token', '') || '').trim();
    const webhookDomain = (configService.get('telegram.webhookDomain', '') || '').trim();
    const rawWebhookPath = (configService.get('telegram.webhookPath', '/api/telegram/webhook') || '').trim();
    const webhookSecret = (configService.get('telegram.webhookSecret', '') || '').trim();
    const normalizedWebhookPath = (rawWebhookPath.startsWith('/') ? rawWebhookPath : `/${rawWebhookPath}`).replace(/\/+$/, '');
    const hasValidToken = token.length > 0 &&
        token !== 'your_telegram_bot_token_here';
    let webhookEnabled = false;
    if (mode === 'webhook' && hasValidToken && webhookDomain) {
        try {
            const bot = app.get(getBotToken());
            bot.catch((err, ctx) => {
                logger.error(`Telegraf update error (update_id: ${ctx?.update?.update_id}):`, err instanceof Error ? err.stack : String(err));
            });
            app.use(async (req, res, next) => {
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
                        let update = req.body;
                        if (Buffer.isBuffer(update)) {
                            update = update.toString('utf-8');
                        }
                        if (typeof update === 'string') {
                            try {
                                update = JSON.parse(update);
                            }
                            catch {
                                update = undefined;
                            }
                        }
                        if (!update) {
                            let rawStream = '';
                            for await (const chunk of req) {
                                rawStream += chunk;
                            }
                            if (rawStream.trim().length > 0) {
                                try {
                                    update = JSON.parse(rawStream);
                                }
                                catch (streamErr) {
                                    logger.error('Failed to parse incoming webhook body stream:', streamErr);
                                }
                            }
                        }
                        if (update && typeof update === 'object' && 'update_id' in update) {
                            await bot.handleUpdate(update, res);
                        }
                        else {
                            logger.warn(`Received Telegram webhook POST without valid update_id: ${JSON.stringify(update)}`);
                        }
                    }
                    catch (err) {
                        logger.error('Error handling Telegram webhook update:', err);
                    }
                    finally {
                        if (!res.headersSent) {
                            res.status(200).send('OK');
                        }
                    }
                    return;
                }
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
        }
        catch (error) {
            logger.error('Failed to attach Telegram webhook handler', error instanceof Error ? error.stack : String(error));
        }
    }
    const rawPort = configService.get('port', 3000);
    const isPassenger = typeof global.PhusionPassenger !== 'undefined';
    const listenTarget = isPassenger ? 'passenger' : rawPort;
    await app.listen(listenTarget);
    logger.log(`Server listening on ${isPassenger ? 'Passenger IPC socket' : `port ${rawPort}`} (Bot mode: ${mode})`);
    if (mode === 'webhook' && hasValidToken && webhookDomain && webhookEnabled) {
        const normalizedDomain = webhookDomain.replace(/\/+$/, '');
        const webhookUrl = `${normalizedDomain}${normalizedWebhookPath}`;
        try {
            const bot = app.get(getBotToken());
            logger.log(`Registering webhook with Telegram Bot API: ${webhookUrl}`);
            const registered = await bot.telegram.setWebhook(webhookUrl, webhookSecret
                ? { secret_token: webhookSecret }
                : {});
            if (registered) {
                logger.log(`Telegram webhook successfully registered: ${webhookUrl}`);
                try {
                    const info = await bot.telegram.getWebhookInfo();
                    logger.log(`Telegram Webhook Status: URL=${info.url}, PendingUpdates=${info.pending_update_count}, LastError=${info.last_error_message ?? 'none'}`);
                }
                catch (infoError) {
                    logger.warn('Could not query getWebhookInfo after registration:', infoError);
                }
            }
            else {
                logger.error('Telegram webhook registration returned false.');
            }
        }
        catch (error) {
            logger.error('Telegram webhook registration failed', error instanceof Error ? error.stack : String(error));
        }
    }
}
bootstrap().catch((error) => {
    console.error('Fatal application bootstrap error:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map