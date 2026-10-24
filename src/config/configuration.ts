export default () => ({
  port: process.env.PORT && !isNaN(Number(process.env.PORT))
    ? parseInt(process.env.PORT, 10)
    : process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  telegram: {
    token: (process.env.BOT_TOKEN ?? '').trim(),
    mode: (process.env.BOT_MODE ?? 'polling').trim().toLowerCase(), // 'polling' | 'webhook'
    webhookDomain: (process.env.WEBHOOK_DOMAIN ?? '').trim(),
    webhookPath: (process.env.WEBHOOK_PATH ?? '/api/telegram/webhook').trim(),
    webhookSecret: (process.env.WEBHOOK_SECRET ?? '').trim(),
  },
  database: {
    host: (process.env.DB_HOST ?? 'localhost').trim(),
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: (process.env.DB_USERNAME ?? 'postgres').trim(),
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: (process.env.DB_NAME ?? 'purity_matters_db').trim(),
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV !== 'production',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'purity-matters-console-jwt-secret-key-2026',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  },
  defaultAdmin: {
    email: process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@puritymatters.org',
    password: process.env.DEFAULT_ADMIN_PASSWORD ?? 'Admin@12345',
    firstName: process.env.DEFAULT_ADMIN_FIRST_NAME ?? 'Bereket',
    middleName: process.env.DEFAULT_ADMIN_MIDDLE_NAME ?? 'Tadesse',
    lastName: process.env.DEFAULT_ADMIN_LAST_NAME ?? 'Alemu',
    role: process.env.DEFAULT_ADMIN_ROLE ?? 'superadmin',
  },
});
