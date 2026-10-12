export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  telegram: {
    token: process.env.BOT_TOKEN ?? '',
    mode: (process.env.BOT_MODE ?? 'polling').toLowerCase(), // 'polling' | 'webhook'
    webhookDomain: process.env.WEBHOOK_DOMAIN ?? '',
    webhookPath: process.env.WEBHOOK_PATH ?? '/api/telegram/webhook',
    webhookSecret: process.env.WEBHOOK_SECRET ?? '',
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'purity_matters_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV !== 'production',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
});
