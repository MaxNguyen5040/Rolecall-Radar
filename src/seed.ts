import { companies } from './companies.js';
import { prisma } from './db.js';

for (const c of companies) {
  await prisma.company.upsert({
    where: { ats_boardToken: { ats: c.ats, boardToken: c.boardToken } },
    update: { name: c.name, region: c.region ?? null },
    create: { ...c, region: c.region ?? null },
  });
}
console.log(`Seeded ${companies.length} companies`);
await prisma.$disconnect();
