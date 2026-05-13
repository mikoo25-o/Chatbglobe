# TransMsg — Cross-Border Messaging SaaS

A full-stack SaaS messaging platform with real-time translation. Customers sign up, connect their own WhatsApp/SMS/Telegram accounts, and communicate with contacts in any language with automatic translation.

## Architecture

```
transmsg/
├── frontend/        React + Vite + Tailwind (port 5173)
└── backend/         Node.js + Express + SQLite + WebSockets (port 4000)
```

## Quick Start

### 1. Install dependencies

```bash
cd transmsg
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure backend

```bash
cd backend
cp .env.example .env
# Edit .env — set JWT_SECRET and translation API keys
```

### 3. Start development

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:5173

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `PORT` | Backend port (default: 4000) |
| `JWT_SECRET` | Secret for JWT tokens — **change in production** |
| `DB_PATH` | SQLite database path (default: ./data/transmsg.db) |
| `AZURE_TRANSLATOR_KEY` | Microsoft Azure Translator API key |
| `AZURE_TRANSLATOR_REGION` | Azure region (e.g. `global`) |
| `GOOGLE_TRANSLATE_KEY` | Google Cloud Translation API key |
| `LIBRETRANSLATE_URL` | LibreTranslate instance URL (free/self-hosted) |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook verification token |
| `FRONTEND_URL` | Frontend origin for CORS (default: http://localhost:5173) |

**You only need ONE translation provider.** Azure is recommended for best quality.

## Translation Providers

The app supports three translation backends (configure any one):

1. **Microsoft Azure Translator** — Best quality, $10/month for 2M chars. Get key at https://portal.azure.com
2. **Google Cloud Translation** — Good quality. Get key at https://console.cloud.google.com
3. **LibreTranslate** — Free, open source, self-hosted. https://libretranslate.com

## Platform Integrations

### WhatsApp Business
1. Create a Meta Developer app at https://developers.facebook.com
2. Enable WhatsApp Business API
3. Get your phone number and permanent access token
4. Set webhook URL to: `https://yourdomain.com/api/webhooks/whatsapp`
5. Set `WHATSAPP_VERIFY_TOKEN` in your .env
6. In the app, go to Integrations → Connect WhatsApp → enter credentials

### SMS (Twilio)
1. Create account at https://twilio.com
2. Get Account SID, Auth Token, and a phone number
3. Set webhook for inbound SMS to: `https://yourdomain.com/api/webhooks/sms`
4. In the app, go to Integrations → Connect SMS

### Telegram
1. Create a bot via @BotFather on Telegram
2. Copy the bot token
3. In the app, go to Integrations → Connect Telegram

## Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Serve with nginx or a reverse proxy
# Point /api and /ws to backend (port 4000)
# Serve frontend/dist as static files

# Run backend with PM2
npm install -g pm2
cd backend && pm2 start src/index.js --name transmsg-api
```

### Security checklist for production
- [ ] Set a strong, random `JWT_SECRET`
- [ ] Add API key encryption (AES-256) before storing in DB — see comments in integrations.js
- [ ] Use HTTPS (required for WhatsApp webhooks)
- [ ] Set `FRONTEND_URL` to your actual domain
- [ ] Use a proper database (PostgreSQL) for scale — replace better-sqlite3 with pg

## API Reference

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login

### Conversations
- `GET /api/conversations` — List all conversations
- `POST /api/conversations` — Create conversation
- `GET /api/conversations/:id/messages` — Get messages
- `POST /api/conversations/:id/messages` — Send message
- `POST /api/conversations/:id/messages/:msgId/translate` — Translate a message
- `POST /api/conversations/:id/read` — Mark as read

### Integrations
- `GET /api/integrations` — List connected integrations
- `POST /api/integrations` — Connect new integration
- `DELETE /api/integrations/:id` — Disconnect

### Webhooks (inbound)
- `GET/POST /api/webhooks/whatsapp` — WhatsApp Business
- `POST /api/webhooks/sms` — Twilio SMS

### WebSocket
Connect to `ws://localhost:4000/ws?token=<jwt>` for real-time events:
- `new_message` — Incoming message
- `new_conversation` — New conversation created
- `typing` — Contact is typing

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Zustand, React Router
- **Backend**: Node.js, Express, better-sqlite3, WebSockets (ws)
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Translation**: Azure / Google / LibreTranslate
- **Platforms**: WhatsApp Business API, Twilio SMS, Telegram Bot API
