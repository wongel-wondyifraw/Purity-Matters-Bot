# Purity Matters Telegram Bot Backend

A scalable, modular Telegram bot backend built with [NestJS](https://nestjs.com/), [nestjs-telegraf](https://github.com/bukhalo/nestjs-telegraf), and [TypeORM](https://typeorm.io/) with PostgreSQL.

---

## 🚀 Tech Stack

- **Framework:** NestJS 12 (TypeScript NodeNext ESM)
- **Telegram SDK:** `telegraf` + `nestjs-telegraf`
- **Delivery Modes:** Both **Webhooks** (production / cPanel) and **Polling** (local development)
- **Database:** PostgreSQL with TypeORM
- **Configuration:** `@nestjs/config` (`.env`)
- **Testing:** Vitest

---

## 📁 Project Architecture

```
├── app.js                       # cPanel / Phusion Passenger Node.js entrypoint
├── CPANEL_DEPLOYMENT.md         # Complete cPanel deployment manual
src/
├── app.controller.ts            # Root health check endpoints (/ & /health)
├── app.module.ts                # Main application module
├── app.service.ts               # Core app services
├── main.ts                      # App bootstrap & webhook middleware registration
├── bot/
│   ├── bot.interface.ts         # Telegraf Context extensions
│   ├── bot.module.ts            # Dynamic TelegrafModule integration
│   ├── bot.service.ts           # Bot messaging, markup & templates
│   └── bot.update.ts            # Telegram command & callback handlers
├── config/
│   └── configuration.ts         # Strongly-typed environment variables loader
├── database/
│   └── entities/
│       └── user.entity.ts       # Telegram User & Member entity
└── users/
    ├── users.module.ts          # User management module
    └── users.service.ts         # Telegram user upsert & registration logic
```

---

## ⚙️ Getting Started

### 1. Environment Setup

Create or edit your local [.env](file:///.env) file (based on [.env.example](file:///.env.example)):

```env
# Application
PORT=3000
NODE_ENV=development

# Telegram Bot Token (Get from @BotFather)
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Mode: 'polling' for local dev, 'webhook' for cPanel production
BOT_MODE=polling

# Webhook Details (when BOT_MODE=webhook)
WEBHOOK_DOMAIN=https://yourdomain.com
WEBHOOK_PATH=/api/telegram/webhook
WEBHOOK_SECRET=your_optional_secret_token

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=purity_matters_db
DB_SYNCHRONIZE=true
DB_LOGGING=false
DB_SSL=false
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Backend Locally

```bash
# Development mode with hot-reload (uses polling if BOT_MODE=polling)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 4. Running Tests

```bash
npm run test
```

---

## 🌐 Deploying to cPanel with Webhooks

For a complete step-by-step guide on deploying to cPanel using **Setup Node.js App** and PostgreSQL, see:
👉 **[CPANEL_DEPLOYMENT.md](file:///c:/Users/WW/Projects/Purity-Matters-Bot/CPANEL_DEPLOYMENT.md)**

---

## 🤖 Built-in Bot Commands & Actions

| Command / Action | Description |
|---|---|
| `/start` | Welcomes user, records their profile to PostgreSQL, and presents interactive menu |
| `/status` | Displays user's membership and registration status |
| `/register` | Initiates member registration flow |
| `/about` | Information about Purity Matters |
| `/ping` | Healthcheck latency test |
| `/help` | Shows command guide |
