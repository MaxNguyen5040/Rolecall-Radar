# Job Aggregator

Polls public ATS job boards (Greenhouse, Lever, Ashby) for a list of target companies, stores each posting once in PostgreSQL, and sends a Discord alert when a new posting matches my filters (new grad / entry level roles in Toronto, Canada or the US).

> Work in progress. Sections below are filled in as each phase ships.

## Architecture

```
node-cron (hourly)
  └─ for each active company
       ├─ fetch ATS JSON (timeout + retry)
       ├─ Zod parse -> normalize -> Posting
       ├─ create() -> unique violation? skip : new
       ├─ new + matches filters -> Discord webhook
       └─ write PollRun

Express API ──► PostgreSQL ◄── React dashboard
```

## Stack

TypeScript, Node.js, Express, Zod, PostgreSQL + Prisma, node-cron, React (Vite), Vitest, Docker Compose, GitHub Actions, AWS EC2.

## Run it

Requires Node 22+ and Docker.

```bash
cp .env.example .env          # add DISCORD_WEBHOOK_URL
docker compose up -d db
npm install
npx prisma migrate dev
npm run seed                  # load companies
npm run poll                  # poll once (first poll per company is a silent baseline)
npm run dev                   # hourly scheduler
```
