# cPanel Deployment Guide for Purity Matters Telegram Bot

This guide walks you through deploying the NestJS Telegram Bot backend to cPanel using **Webhooks** and **cPanel's Setup Node.js App**.

---

## 📋 Prerequisites on cPanel

1. **cPanel Node.js Selector:** Your cPanel hosting must support the **Setup Node.js App** (Phusion Passenger) feature.
2. **Domain / Subdomain with SSL (HTTPS):**
   - Telegram **strictly requires** HTTPS with a valid certificate.
   - Use cPanel's free **AutoSSL** or **Let's Encrypt** for your domain (e.g., `bot.yourdomain.com` or `yourdomain.com`).
3. **PostgreSQL Database:**
   - In cPanel, go to **PostgreSQL Databases**.
   - Create a new database (e.g., `cpaneluser_purity_db`).
   - Create a database user and assign it all privileges to the database.

---

## 🚀 Step-by-Step Deployment

### Step 1: Build the Application
Before uploading to cPanel, compile the TypeScript code locally or via cPanel terminal:

```bash
npm run build
```

This generates the production bundle inside the `dist/` directory.

---

### Step 2: Upload Files to cPanel
Using cPanel File Manager, FTP, or Git Version Control, upload the following to your application directory (e.g. `/home/username/purity-matters-bot`):

- `dist/` *(Compiled code)*
- `package.json`
- `package-lock.json`
- `.npmrc`
- `app.js` *(cPanel Passenger entrypoint)*
- `.env` *(Environment configuration)*

*(You do **not** need to upload `node_modules` or `src/`).*

---

### Step 3: Configure "Setup Node.js App" in cPanel

1. In cPanel, open **Setup Node.js App**.
2. Click **Create Application**.
3. Configure the following fields:
   - **Node.js version:** Select **20.x** or **22.x** (or the latest available Node 20+).
   - **Application mode:** `Production`
   - **Application root:** `purity-matters-bot` *(directory name relative to your home directory)*
   - **Application URL:** Select your domain or subdomain (e.g., `bot.yourdomain.com`).
   - **Application startup file:** `app.js`
4. Click **Create**.

---

### Step 4: Install Dependencies

1. In the Node.js application management screen, click **Run NPM Install** (or copy the virtual environment command at the top and run `npm install --omit=dev` inside the cPanel Terminal).

---

### Step 5: Configure `.env` for Webhooks

Create or edit `.env` in the application root directory with your production details:

```env
PORT=3000
NODE_ENV=production

# Telegram Bot
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
BOT_MODE=webhook

# Webhook Details (Must use your actual HTTPS domain)
WEBHOOK_DOMAIN=https://bot.yourdomain.com
WEBHOOK_PATH=/api/telegram/webhook
WEBHOOK_SECRET=your_custom_secret_key_here

# PostgreSQL Database (Created in cPanel)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=cpaneluser_dbuser
DB_PASSWORD=your_db_password
DB_NAME=cpaneluser_purity_db
DB_SYNCHRONIZE=true
DB_LOGGING=false
DB_SSL=false
```

---

### Step 6: Restart & Test

1. Click **Restart** in the cPanel Node.js App manager.
2. **Verify Health Endpoint:**
   Open in your browser:
   ```
   https://bot.yourdomain.com/health
   ```
   You should see:
   ```json
   {
     "status": "ok",
     "service": "Purity Matters Bot Backend",
     "mode": "webhook",
     "timestamp": "..."
   }
   ```
3. **Verify Webhook Diagnostics Endpoint:**
   Visit in your browser:
   ```
   https://bot.yourdomain.com/api/telegram/status
   ```
   This endpoint directly checks Telegram's Bot API and returns the real-time webhook status:
   ```json
   {
     "status": "ok",
     "botConfigured": true,
     "mode": "webhook",
     "webhookDomain": "https://bot.yourdomain.com",
     "webhookPath": "/api/telegram/webhook",
     "webhookSecretConfigured": true,
     "telegramWebhookInfo": {
       "url": "https://bot.yourdomain.com/api/telegram/webhook",
       "has_custom_certificate": false,
       "pending_update_count": 0,
       "last_error_date": 0,
       "last_error_message": null
     }
   }
   ```
4. **Verify Direct Telegram Webhook Info:**
   Visit in your browser:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
   ```
5. **Test in Telegram:**
   Open your bot in Telegram and send `/start`. You should receive the welcome message and interactive keyboard buttons immediately!

---

## 🔍 Troubleshooting cPanel Webhook Issues

| Issue | Cause | Fix |
|---|---|---|
| **Telegram `getWebhookInfo` says: `Wrong response from webhook: 404`** | Webhook URL path mismatch or route prefix stripped | Check `/api/telegram/status`. Verify `WEBHOOK_DOMAIN` matches your exact HTTPS URL without trailing slashes. |
| **Telegram `getWebhookInfo` says: `SSL error: ...`** | Missing or expired SSL certificate | Telegram **strictly requires** valid HTTPS. In cPanel, go to **SSL/TLS Status** and click **Run AutoSSL** to issue a free SSL certificate. |
| **Status endpoint says `botConfigured: false`** | `.env` file not found or `BOT_TOKEN` missing | Ensure `.env` is located in the application root directory (where `app.js` is) and `BOT_TOKEN` is set with your actual token from `@BotFather`. |
| **cPanel shows 503 / 500 error** | Database connection failed or crash on startup | In cPanel PostgreSQL, verify your DB user has permissions to the database. Check `stderr.log` inside your app root directory or cPanel Node.js App logs. |
| **Bot not responding to commands** | Secret token mismatch | If `WEBHOOK_SECRET` is set in `.env`, verify it has no extra quotes or spaces. You can leave `WEBHOOK_SECRET` blank during initial testing. |
