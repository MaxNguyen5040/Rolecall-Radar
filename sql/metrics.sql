-- Usage: psql -v since="'2026-10-29'" -f sql/metrics.sql
-- `since` drops test alerts sent while setting things up, which reuse old postings.

SELECT COUNT(*) AS companies_polled FROM "Company" WHERE active;

SELECT COUNT(*) AS postings_ingested FROM "Posting";

SELECT
  COUNT(*) AS runs,
  COUNT(*) FILTER (WHERE ok) AS ok_runs,
  ROUND(100.0 * COUNT(*) FILTER (WHERE ok) / NULLIF(COUNT(*), 0), 2) AS success_pct
FROM "PollRun"
WHERE "finishedAt" IS NOT NULL;

-- Lever and Ashby only, because Greenhouse timestamps are approximate.
SELECT
  COUNT(*) AS alerts,
  ROUND(percentile_cont(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (p."alertedAt" - p."sourcePostedAt")) / 60
  )::numeric, 1) AS median_minutes
FROM "Posting" p
JOIN "Company" c ON c.id = p."companyId"
WHERE p."alertedAt" IS NOT NULL
  AND p."sourcePostedAt" IS NOT NULL
  AND p."alertedAt" >= :since
  AND c.ats IN ('LEVER', 'ASHBY');
