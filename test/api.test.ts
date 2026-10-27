import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/api.js';
import { prisma } from '../src/db.js';

let server: Server;
let base: string;
let companyId: number;

beforeAll(async () => {
  const company = await prisma.company.create({
    data: { name: 'Api Test', ats: 'ASHBY', boardToken: `api-${Date.now()}` },
  });
  companyId = company.id;
  await prisma.posting.createMany({
    data: [
      {
        companyId,
        externalId: '1',
        title: 'New Grad iOS Engineer',
        location: 'Toronto, ON',
        url: 'https://x/1',
        matched: true,
      },
      {
        companyId,
        externalId: '2',
        title: 'Senior Backend Engineer',
        location: 'Austin, TX',
        url: 'https://x/2',
      },
    ],
  });
  server = createApp().listen(0);
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.close();
  await prisma.posting.deleteMany({ where: { companyId } });
  await prisma.company.delete({ where: { id: companyId } });
  await prisma.$disconnect();
});

const get = async (path: string) => {
  const res = await fetch(base + path);
  return { status: res.status, body: await res.json() };
};

describe('API', () => {
  it('GET /health', async () => {
    expect(await get('/health')).toEqual({ status: 200, body: { status: 'ok' } });
  });

  it('GET /companies includes posting counts', async () => {
    const { body } = await get('/companies');
    const company = body.find((c: { id: number }) => c.id === companyId);
    expect(company.postingCount).toBe(2);
  });

  it('GET /postings filters by title, location and matched', async () => {
    const byTitle = await get('/postings?q=ios&ats=ASHBY');
    expect(byTitle.body.map((p: { title: string }) => p.title)).toEqual(['New Grad iOS Engineer']);

    const byLocation = await get('/postings?location=austin');
    expect(byLocation.body.map((p: { externalId: string }) => p.externalId)).toEqual(['2']);

    const matched = await get('/postings?matched=true&q=engineer');
    expect(matched.body).toHaveLength(1);
  });

  it('GET /postings rejects invalid query values', async () => {
    expect((await get('/postings?ats=BOGUS')).status).toBe(400);
    expect((await get('/postings?since=not-a-date')).status).toBe(400);
  });
});
