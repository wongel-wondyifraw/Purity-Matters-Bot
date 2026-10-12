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
├── web-console/                 # Next.js 16 + shadcn/ui Admin Management Portal
│   ├── src/app/page.tsx         # Interactive Admin Dashboard & Management Console
│   └── src/components/ui/       # shadcn/ui components (cards, tables, badges, tabs, dialogs)
src/
├── app.controller.ts            # Root health check endpoints (/ & /health)
├── app.module.ts                # Main application module
├── app.service.ts               # Core app services
├── main.ts                      # App bootstrap & webhook middleware registration
├── bot/                         # Telegram Bot handlers & services
├── config/                      # Environment variables loader
├── database/                    # TypeORM PostgreSQL entities
└── clients/                     # Telegram client management
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

### 5. Running Purity Matters Web Console (Admin Dashboard)

```bash
# Start Admin Web Console in development mode (http://localhost:3001)
npm run web:dev

# Build Admin Web Console for production
npm run web:build
npm run web:start
```

---

## 🌐 Deploying to cPanel with Webhooks

For a complete step-by-step guide on deploying to cPanel using **Setup Node.js App** and PostgreSQL, see:
👉 **[CPANEL_DEPLOYMENT.md](file:///c:/Users/WW/Projects/Purity-Matters-Bot/CPANEL_DEPLOYMENT.md)**

---

## 🤖 Built-in Bot Commands & Actions

| Command / Action | Description |
|---|---|
| `/start` | Welcomes user and displays main navigation menu |
| `/register` | 2-step registration: prompts full name, then requests verified phone number |
| `/services` | Opens interactive Services Menu with emojis (A, B, C, D) |
| `/status` | Displays client profile, registration status, and active request references |
| `/cancel` | Cancels any ongoing registration or session booking draft |
| `/about` | Information about Purity Matters |
| `/ping` | Server health and latency test |
| `/help` | Shows command guide |

---

## 🌟 Client Services Features

### 🛋️ A. Counselling
1. **Select Concern:** Personal, Relationship, Family, Purity & Mindset, Emotional.
2. **Brief Description:** Describe current challenges or tap `[ ⏩ Skip Sensitive Details ]`.
3. **Preferred Method:** Telegram Chat, Direct Phone Call, Video Call, or In-Person.
4. **Preferred Time:** Next Available, Morning (9am-12pm), Afternoon (1pm-5pm), Evening (6pm-9pm).
5. **Review & Submit:** Detailed review card before confirmation.
6. **Reference Code:** Auto-generates unique reference number (`CN-XXXXX`) and logs status updates (`PENDING` -> `ASSIGNED` -> `SCHEDULED` -> `COMPLETED`).

### 🕊️ B. Inner Healing
1. **Choose Topic:** Rejection, Abandonment, Forgiveness, Shame & Guilt, Identity & Worth, Emotional Wounds.
2. **Instant Minister Notification:** Generates tracking reference (`IH-XXXXX`) and informs client that a minister will communicate with them shortly.

### 📚 C. Training & Courses
1. **Journey Selection:** 7-Day Journey (Purity & Mindset Triggers) and 21-Day Journey (Freedom & Wholeness).
2. **Daily Lessons:** Scripture, teaching commentary, trigger reflection questions, and practical action steps.
3. **Progress Tracking:** Tracks completed days and updates progress indicators.
4. **Accountability:** Request a dedicated accountability partner at any time.

### 📖 D. Resources & E-Books
1. **Catalog:** Free practical battle guides and paid transformational e-books.
2. **Details & Pricing:** Synopsis, chapter breakdown, and price ($4.99 / 250 ETB).
3. **Checkout & Access:** Server-side verification and instant access under **"My Purchases"**.

