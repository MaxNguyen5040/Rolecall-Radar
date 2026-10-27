# Job Aggregator: Build Reference

## 1. Goal

Poll public ATS job boards for my target companies. Store each new posting once. Alert me within minutes when a matching role appears.

**Success:** I see a matching posting before it reaches LinkedIn.

### Out of scope

- No auto-apply.
- No LinkedIn scraping. LinkedIn's terms forbid it.
- No Workday scraping. Workday has no documented public API. Use job alerts on those career sites.

---

## 2. Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript (strict mode) | Proves TS on my resume |
| Runtime | Node.js (current LTS) | Built-in `fetch` |
| API | Express | Most common Node.js framework in postings |
| Validation | Zod | Parse three ATS formats into one `Posting` type; reject bad data |
| Database | PostgreSQL + Prisma | Relational data, unique constraints, migrations |
| Scheduler | node-cron | One process. No queue needed |
| Frontend | React + TypeScript (Vite) | Small dashboard |
| Tests | Vitest | Fast, TypeScript-native |
| Packaging | Docker + Docker Compose | One command to run everything |
| CI/CD | GitHub Actions | Tests on every push, deploy on merge |
| Hosting | AWS EC2 (one instance) | Check prices before you create anything |
| Alerts | Discord or Slack webhook | Simplest option |

**Do not add:** Redis, Celery, RabbitMQ, Kubernetes, MongoDB, Prometheus. Each one solves a scaling problem this project does not have, and each one adds interview questions you must justify.

---

## 3. Data sources

| ATS | Endpoint | Find the token in | Timestamp field | Notes |
|---|---|---|---|---|
| Greenhouse | `GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true` | `boards.greenhouse.io/{token}` or `job-boards.greenhouse.io/{token}` | `updated_at` | No auth for GET. No salary in the API (parse the description). `updated_at` changes when a posting is edited, so it is approximate. |
| Lever | `GET https://api.lever.co/v0/postings/{company}?mode=json` | `jobs.lever.co/{company}` | `createdAt` (epoch ms) | Max 1 request per second. |
| Ashby | `GET https://api.ashbyhq.com/posting-api/job-board/{org}?includeCompensation=true` | `jobs.ashbyhq.com/{org}` | `publishedAt` | Returns compensation when the company publishes it. |
| Workday | None | — | — | Use career-site job alerts. |

### Rules

- Before you write a parser, save one real response per ATS as a test fixture. The field names in this file are a starting point. Trust the fixture.
- Record your own `firstSeenAt` for every posting. Use it when the source timestamp is missing or approximate.
- Send one request per company per poll. Wait at least 1 second between requests to the same host.
- Set a 10-second timeout on every request. Retry a failed request up to 2 times, with a longer wait each time.

---

## 4. Data model (Prisma)

```prisma
enum Ats {
  GREENHOUSE
  LEVER
  ASHBY
}

model Company {
  id         Int       @id @default(autoincrement())
  name       String
  ats        Ats
  boardToken String
  region     String?   // "toronto", "us", "remote-ca"
  active     Boolean   @default(true)
  postings   Posting[]
  pollRuns   PollRun[]

  @@unique([ats, boardToken])
}

model Posting {
  id             Int       @id @default(autoincrement())
  companyId      Int
  company        Company   @relation(fields: [companyId], references: [id])
  externalId     String
  title          String
  location       String?
  url            String
  isRemote       Boolean?
  sourcePostedAt DateTime? // From the ATS. Approximate for Greenhouse.
  firstSeenAt    DateTime  @default(now())
  matched        Boolean   @default(false)
  alertedAt      DateTime?

  @@unique([companyId, externalId])
  @@index([firstSeenAt])
}

model PollRun {
  id         Int       @id @default(autoincrement())
  companyId  Int
  company    Company   @relation(fields: [companyId], references: [id])
  startedAt  DateTime  @default(now())
  finishedAt DateTime?
  ok         Boolean   @default(false)
  newCount   Int       @default(0)
  error      String?
}
```

### Deduplication

- The unique constraint on `(companyId, externalId)` is the source of truth.
- Call `prisma.posting.create()`. If it throws Prisma error `P2002` (unique constraint failed), the posting already exists. Skip it.
- Send an alert only when `create()` succeeds and the posting matches your filters.

### First-run trap

On the first poll of a new company, every existing posting looks new. That floods your alerts. Treat the first successful poll per company as a baseline: store the postings, but send no alerts.

---

## 5. Filters

### Include (title, case-insensitive)

`new grad`, `new graduate`, `entry level`, `entry-level`, `early career`, `junior`, `university grad`, `2027`, `ios`, `mobile`

### Level "I"

Match "Engineer I" and "Developer 1", but not "AI", "UI", or "II":

```ts
const levelOne = /\b(engineer|developer)\s+(i|1)\b(?!\w)/i;
```

### Exclude (title)

`senior`, `sr.`, `staff`, `principal`, `lead`, `manager`, `director`, `intern`, `internship`, `co-op`, ` ii`, ` iii`

### Location

Toronto, Ontario, ON, Canada, Remote (Canada or North America), plus the US cities you accept.

### Required filter tests

| Title | Expected |
|---|---|
| Software Engineer I | Match |
| Software Engineer II | No match |
| AI Engineer | No match |
| UI Developer | No match |
| iOS Engineer, New Grad | Match |
| Senior Software Engineer, Mobile | No match |
| Software Engineering Intern | No match |

---

## 6. Architecture

```
node-cron (every 30–60 min)
  └─ for each active company (1 s delay per host)
       ├─ fetch ATS JSON (timeout + retry)
       ├─ Zod parse → normalize → Posting
       ├─ create() → P2002? skip : new
       ├─ new + matches filters → webhook alert → set alertedAt
       └─ write PollRun (ok, newCount, error)

Express API ──► PostgreSQL ◄── React dashboard
  GET /health
  GET /companies
  GET /postings?q=&location=&since=&ats=
```

Everything runs in one Node process, plus PostgreSQL.

---

## 7. Build phases

Each phase leaves you with a working system. You can stop after any phase and still have something to show.

### Phase 1: Working poller

**Done when:** a real alert arrives for a new posting.

- [ ] Repo setup: TypeScript strict mode, ESLint, Prettier, Vitest
- [ ] `.gitignore` includes `node_modules/`, `.env`, `dist/`. Never commit secrets or dependency folders.
- [ ] PostgreSQL in Docker Compose. Prisma schema and first migration.
- [ ] Seed 20 companies, with all three ATS types represented.
- [ ] Three fetchers, Zod schemas, and one normalizer.
- [ ] Deduplication with `create()` and `P2002`. Baseline first run.
- [ ] Webhook alert.
- [ ] node-cron schedule.

### Phase 2: Reliability

- [ ] Timeouts, retries, and per-host delay
- [ ] `PollRun` logging for every company and poll
- [ ] Structured logs: company, duration, result, new count

### Phase 3: API and tests

- [ ] Express endpoints from section 6
- [ ] Parser tests against saved fixtures, one per ATS
- [ ] Filter tests from section 5
- [ ] Deduplication test: insert the same posting twice, expect one row

### Phase 4: Ship

- [ ] Dockerfile and Docker Compose for the app and database
- [ ] GitHub Actions: lint, typecheck, and test on every push; deploy on merge to `main`
- [ ] Deploy to EC2. Confirm alerts still arrive.

### Phase 5: Dashboard (optional)

- [ ] React table of postings
- [ ] Filters for role, location, and date
- [ ] "New since last visit" view

---

## 8. CI outline (GitHub Actions)

```yaml
name: ci
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-retries 10
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
  # deploy job: on main only, needs: test
  # SSH to EC2 with a key stored in GitHub Secrets,
  # then: git pull && docker compose up -d --build
```

---

## 9. Metrics

Measure these before you write the resume bullets.

| Metric | How to get it |
|---|---|
| Companies polled | `SELECT COUNT(*) FROM "Company" WHERE active;` |
| Postings ingested | `SELECT COUNT(*) FROM "Posting";` |
| Poll success rate | `ok = true` runs ÷ all runs in `PollRun` |
| Median posting-to-alert time | Query below. Lever and Ashby only, because Greenhouse timestamps are approximate. |
| Test count | Vitest summary output |

```sql
SELECT percentile_cont(0.5) WITHIN GROUP (
  ORDER BY EXTRACT(EPOCH FROM ("alertedAt" - "sourcePostedAt")) / 60
) AS median_minutes
FROM "Posting" p
JOIN "Company" c ON c.id = p."companyId"
WHERE p."alertedAt" IS NOT NULL
  AND p."sourcePostedAt" IS NOT NULL
  AND c.ats IN ('LEVER', 'ASHBY');
```

---

---

## 12. Where to find target companies

- SimplifyJobs New-Grad-Positions repo (US, Canada, and remote roles)
- VC portfolio job boards
- My Toronto company list (banks, Toronto-based tech companies, US companies with Toronto offices)
- Hacker News "Who's Hiring" (search "Toronto")

**Find a company's ATS and token:** open its careers page and check the URL of any job link. It will point to `greenhouse.io`, `lever.co`, `ashbyhq.com`, or `myworkdayjobs.com` (Workday has no public API, so skip it).

---

## 13. Repo hygiene (recruiters will click)

- [ ] README: the problem, an architecture diagram, how to run it, and one dashboard screenshot
- [ ] No secrets in git history. Use `.env` locally and GitHub Secrets in CI.
- [ ] No committed `node_modules/` or build output
- [ ] Clear commit messages