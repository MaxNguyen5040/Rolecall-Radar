import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  DISCORD_WEBHOOK_URL: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  POLL_CRON: z.string().default('0 * * * *'),
  BROAD_MATCH: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export const config = schema.parse(process.env);
