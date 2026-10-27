import type { Ats } from '@prisma/client';

export interface SeedCompany {
  name: string;
  ats: Ats;
  boardToken: string;
  region?: string;
}

// Starter set; the full list is verified against the live APIs later.
export const companies: SeedCompany[] = [
  { name: 'Airbnb', ats: 'GREENHOUSE', boardToken: 'airbnb', region: 'us' },
  { name: 'Palantir', ats: 'LEVER', boardToken: 'palantir', region: 'us' },
  { name: 'Ramp', ats: 'ASHBY', boardToken: 'ramp', region: 'us' },
];
