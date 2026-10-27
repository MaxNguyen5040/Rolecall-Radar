import 'dotenv/config';
import { defineConfig } from 'vitest/config';

// Tests write to the database, so prefer a dedicated one when TEST_DATABASE_URL is set.
const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    fileParallelism: false,
    env: databaseUrl ? { DATABASE_URL: databaseUrl } : {},
  },
});
