import { prisma } from './db.js';
import { pollAll } from './poller.js';

await pollAll();
await prisma.$disconnect();
