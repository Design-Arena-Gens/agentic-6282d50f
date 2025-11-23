## Agentic AI/CS Briefing

Agentic AI/CS Briefing is a production-ready intelligence layer that scrapes, summarises, and distributes the latest
signals from AI and Computer Science communities. It prioritises fast-moving, high-signal discussions while filtering out
low-value AI detection chatter.

### Feature Highlights
- Multi-source ingestion (Reddit, Hacker News, arXiv, OpenAI blog) with simple extensibility for new feeds.
- Extractive summarisation engine tailored for argument/finding capture.
- Topic clustering and scoring pipeline balancing engagement, novelty, and recency.
- Delivery service for Telegram and email with pluggable formatting.
- Operational script (`npm run collect`) for cron/scheduler integration, plus runtime and filter metrics.
- Guardrails for source attribution and basic harm filtering.

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the dashboard, refresh signals, and trigger deliveries.

### Operational Commands

- `npm run collect` – execute the full pipeline from the CLI.  
  Use `SEND_BRIEFING=true SEND_TELEGRAM=true SEND_EMAIL=true` to push via delivery channels when credentials are present.
- `npm run lint` – lint the codebase.
- `npm run build` – produce a production build.

### Configuration

| Channel   | Environment variables |
|-----------|-----------------------|
| Telegram  | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Email     | `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS`, `BRIEFING_EMAIL_FROM`, `BRIEFING_EMAIL_TO` |

### Deployment

The project is optimised for Vercel. After running `npm run build`, deploy with:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-6282d50f
```
