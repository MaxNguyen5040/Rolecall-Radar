import { Ats, Prisma } from '@prisma/client';
import express, { type ErrorRequestHandler } from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { prisma } from './db.js';

const postingsQuery = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  since: z.coerce.date().optional(),
  ats: z.enum(Ats).optional(),
  matched: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: 'Invalid query', issues: err.issues });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};

export function createApp(): express.Express {
  const app = express();

  app.get('/health', async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  });

  app.get('/companies', async (_req, res) => {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { postings: true } },
        pollRuns: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { startedAt: true, ok: true, newCount: true, error: true },
        },
      },
    });
    res.json(
      companies.map(({ pollRuns, _count, ...company }) => ({
        ...company,
        postingCount: _count.postings,
        lastPoll: pollRuns[0] ?? null,
      })),
    );
  });

  app.get('/postings', async (req, res) => {
    const { q, location, since, ats, matched, limit } = postingsQuery.parse(req.query);

    const where: Prisma.PostingWhereInput = {
      ...(q && { title: { contains: q, mode: 'insensitive' } }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(since && { firstSeenAt: { gte: since } }),
      ...(ats && { company: { ats } }),
      ...(matched && { matched: matched === 'true' }),
    };

    const postings = await prisma.posting.findMany({
      where,
      orderBy: { firstSeenAt: 'desc' },
      take: limit,
      include: { company: { select: { name: true, ats: true } } },
    });
    res.json(postings);
  });

  // The built dashboard only exists in the Docker image, so skip it in dev and tests.
  const webDist = path.resolve('web/dist');
  if (existsSync(webDist)) app.use(express.static(webDist));

  app.use(handleError);
  return app;
}
