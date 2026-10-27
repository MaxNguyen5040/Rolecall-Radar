import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NormalizedPosting } from '../src/fetchers/types.js';

const fetchPostings = vi.hoisted(() => vi.fn());
const sendAlert = vi.hoisted(() => vi.fn());
vi.mock('../src/fetchers/index.js', () => ({ fetchPostings }));
vi.mock('../src/alert.js', () => ({ sendAlert }));

const { prisma } = await import('../src/db.js');
const { pollCompany } = await import('../src/poller.js');

const posting = (id: string, title: string): NormalizedPosting => ({
  externalId: id,
  title,
  location: 'Toronto, ON',
  url: `https://example.com/${id}`,
  isRemote: null,
  sourcePostedAt: null,
});

async function makeCompany() {
  return prisma.company.create({
    data: { name: 'Dedup Test', ats: 'LEVER', boardToken: `dedup-${Date.now()}-${Math.random()}` },
  });
}

describe('poller', () => {
  beforeEach(() => {
    fetchPostings.mockReset();
    sendAlert.mockReset();
    sendAlert.mockResolvedValue(true);
  });

  afterAll(async () => {
    const companies = await prisma.company.findMany({ where: { name: 'Dedup Test' } });
    const ids = companies.map((c) => c.id);
    await prisma.posting.deleteMany({ where: { companyId: { in: ids } } });
    await prisma.pollRun.deleteMany({ where: { companyId: { in: ids } } });
    await prisma.company.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  it('stores the same posting once when it is polled twice', async () => {
    const company = await makeCompany();
    fetchPostings.mockResolvedValue([posting('a', 'Software Engineer I')]);

    const first = await pollCompany(company);
    const second = await pollCompany(company);

    expect(first.newCount).toBe(1);
    expect(second.newCount).toBe(0);
    expect(await prisma.posting.count({ where: { companyId: company.id } })).toBe(1);
  });

  it('sends no alerts on the first poll, then alerts on a new matching posting', async () => {
    const company = await makeCompany();
    fetchPostings.mockResolvedValue([posting('a', 'Software Engineer I')]);
    await pollCompany(company);
    expect(sendAlert).not.toHaveBeenCalled();

    fetchPostings.mockResolvedValue([
      posting('a', 'Software Engineer I'),
      posting('b', 'New Grad Software Engineer'),
      posting('c', 'Senior Software Engineer'),
    ]);
    await pollCompany(company);

    expect(sendAlert).toHaveBeenCalledTimes(1);
    const alerted = await prisma.posting.findMany({
      where: { companyId: company.id, alertedAt: { not: null } },
    });
    expect(alerted.map((p) => p.externalId)).toEqual(['b']);
  });

  it('records a failed poll without throwing', async () => {
    const company = await makeCompany();
    fetchPostings.mockRejectedValue(new Error('HTTP 500'));

    const result = await pollCompany(company);

    expect(result.ok).toBe(false);
    const run = await prisma.pollRun.findFirstOrThrow({ where: { companyId: company.id } });
    expect(run.ok).toBe(false);
    expect(run.error).toContain('HTTP 500');
  });
});
