export interface FilterInput {
  title: string;
  location: string | null;
  isRemote: boolean | null;
}

export interface FilterResult {
  matched: boolean;
  priority: boolean; // Toronto / Canada
}

const levelOne = /\b(engineer|developer)\s+(i|1)\b(?!\w)/i;

// "ios" and "mobile" only count alongside one of these, so they need no entry of their own.
const entryLevel =
  /\b(new\s+grad(uate)?s?|entry[\s-]level|early\s+career|junior|university\s+grad(uate)?s?|2027)\b/i;

const excluded =
  /\b(senior|sr|staff|principal|lead|manager|director|intern|internship|co-op)\b|\s(ii|iii)\b/i;

const canada = /\b(canada|toronto|ontario|ottawa|waterloo|mississauga|kitchener)\b|,\s*ON\b/;

const usStates =
  'AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY';

const usCities = [
  'new york',
  'los angeles',
  'chicago',
  'houston',
  'phoenix',
  'philadelphia',
  'san antonio',
  'san diego',
  'dallas',
  'san jose',
  'austin',
  'jacksonville',
  'fort worth',
  'columbus',
  'charlotte',
  'san francisco',
  'indianapolis',
  'seattle',
  'denver',
  'washington',
  'boston',
  'el paso',
  'nashville',
  'detroit',
  'portland',
  'las vegas',
  'memphis',
  'louisville',
  'baltimore',
  'milwaukee',
  'albuquerque',
  'tucson',
  'fresno',
  'sacramento',
  'atlanta',
  'kansas city',
  'miami',
  'raleigh',
  'omaha',
  'oakland',
  'minneapolis',
  'tampa',
  'pittsburgh',
  'cincinnati',
  'salt lake city',
  'palo alto',
  'mountain view',
  'menlo park',
  'sunnyvale',
  'cambridge',
  'brooklyn',
];

const usPattern = new RegExp(
  `\\b(united states|usa|u\\.s\\.|us)\\b|,\\s*(${usStates})\\b|\\b(${usCities.join('|')})\\b`,
  'i',
);

// Bare "Remote" is accepted because boards rarely say which country.
const remoteOnly = /^\s*remote\s*$/i;

export function matchesTitle(title: string): boolean {
  if (excluded.test(title)) return false;
  return entryLevel.test(title) || levelOne.test(title);
}

export function matchesLocation(location: string | null, isRemote: boolean | null): boolean {
  if (!location) return isRemote === true;
  return canada.test(location) || usPattern.test(location) || remoteOnly.test(location);
}

export function matchPosting({ title, location, isRemote }: FilterInput): FilterResult {
  const matched = matchesTitle(title) && matchesLocation(location, isRemote);
  return { matched, priority: matched && !!location && canada.test(location) };
}
