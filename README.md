# Rolecall Radar

A small service that watches the Greenhouse, Lever and Ashby job boards of companies I want to work at. It saves every posting once in Postgres and sends me a Discord message when a new one looks like an entry level or new grad role in Toronto, Canada or the US. The goal is to see a posting before it shows up on LinkedIn.

Still being built, so this README will grow as I go.

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
