import type { Ats } from '@prisma/client';

export interface SeedCompany {
  name: string;
  ats: Ats;
  boardToken: string;
  region?: string;
}

// Every token here returned a live board when checked against the ATS API.
export const companies: SeedCompany[] = [
  { name: 'Airbnb', ats: 'GREENHOUSE', boardToken: 'airbnb', region: 'us' },
  { name: 'Stripe', ats: 'GREENHOUSE', boardToken: 'stripe', region: 'us' },
  { name: 'Databricks', ats: 'GREENHOUSE', boardToken: 'databricks', region: 'us' },
  { name: 'Figma', ats: 'GREENHOUSE', boardToken: 'figma', region: 'us' },
  { name: 'Affirm', ats: 'GREENHOUSE', boardToken: 'affirm', region: 'us' },
  { name: 'Lyft', ats: 'GREENHOUSE', boardToken: 'lyft', region: 'us' },
  { name: 'Pinterest', ats: 'GREENHOUSE', boardToken: 'pinterest', region: 'us' },
  { name: 'DoorDash', ats: 'GREENHOUSE', boardToken: 'doordashusa', region: 'us' },
  { name: 'Palantir', ats: 'LEVER', boardToken: 'palantir', region: 'us' },
  { name: 'Veeva', ats: 'LEVER', boardToken: 'veeva', region: 'us' },
  { name: 'Gopuff', ats: 'LEVER', boardToken: 'gopuff', region: 'us' },
  { name: 'Rover', ats: 'LEVER', boardToken: 'rover', region: 'us' },
  { name: 'Spotify', ats: 'LEVER', boardToken: 'spotify', region: 'us' },
  { name: 'Ramp', ats: 'ASHBY', boardToken: 'ramp', region: 'us' },
  { name: 'Notion', ats: 'ASHBY', boardToken: 'notion', region: 'us' },
  { name: 'OpenAI', ats: 'ASHBY', boardToken: 'openai', region: 'us' },
  { name: 'Snowflake', ats: 'ASHBY', boardToken: 'snowflake', region: 'us' },
  { name: 'Cohere', ats: 'ASHBY', boardToken: 'cohere', region: 'toronto' },
  { name: '1Password', ats: 'ASHBY', boardToken: '1password', region: 'toronto' },
  { name: 'KOHO', ats: 'ASHBY', boardToken: 'koho', region: 'toronto' },
];
