import { Prisma, type Company } from '@prisma/client';
import { sendAlert } from './alert.js';
import { config } from './config.js';
import { prisma } from './db.js';
import { matchPosting } from './filters.js';
import { fetchPostings } from './fetchers/index.js';
import { log } from './log.js';

export async function pollCompany(company: Company): Promise<{ ok: boolean; newCount: number }> {
  const started = Date.now();
  const run = await prisma.pollRun.create({ data: { companyId: company.id } });

  try {
    // The first successful poll is a baseline: store everything, alert on nothing.
    const isBaseline =
      (await prisma.pollRun.count({ where: { companyId: company.id, ok: true } })) === 0;
    const postings = await fetchPostings(company.ats, company.boardToken);

    let newCount = 0;
    for (const posting of postings) {
      const { matched, priority } = matchPosting(posting, { broad: config.BROAD_MATCH });
      let created;
      try {
        created = await prisma.posting.create({
          data: { ...posting, companyId: company.id, matched },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue;
        throw err;
      }
      newCount++;

      if (matched && !isBaseline) {
        const sent = await sendAlert({ company: company.name, priority, ...posting });
        if (sent) {
          await prisma.posting.update({
            where: { id: created.id },
            data: { alertedAt: new Date() },
          });
        }
      }
    }

    await prisma.pollRun.update({
      where: { id: run.id },
      data: { ok: true, newCount, finishedAt: new Date() },
    });
    log('poll_done', {
      company: company.name,
      ok: true,
      newCount,
      isBaseline,
      ms: Date.now() - started,
    });
    return { ok: true, newCount };
  } catch (err) {
    await prisma.pollRun.update({
      where: { id: run.id },
      data: { ok: false, error: String(err).slice(0, 500), finishedAt: new Date() },
    });
    log('poll_done', {
      company: company.name,
      ok: false,
      error: String(err),
      ms: Date.now() - started,
    });
    return { ok: false, newCount: 0 };
  }
}

export async function pollAll(): Promise<void> {
  const companies = await prisma.company.findMany({
    where: { active: true },
    orderBy: { id: 'asc' },
  });
  const started = Date.now();
  log('poll_start', { companies: companies.length });

  let failed = 0;
  let newCount = 0;
  for (const company of companies) {
    const result = await pollCompany(company);
    if (!result.ok) failed++;
    newCount += result.newCount;
  }
  log('poll_finished', { companies: companies.length, failed, newCount, ms: Date.now() - started });
}
