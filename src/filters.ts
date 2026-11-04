export interface FilterInput {
  title: string;
  location: string | null;
  isRemote: boolean | null;
  description?: string | null;
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
const nonSoftwareDiscipline =
  /\b(mechanical|electrical|civil|chemical|manufacturing|process|quality|industrial|structural|aerospace|biomedical|materials|environmental|facilities|construction)\b/i;

// Only used when broad matching is on, e.g. to collect alert timing data faster.
const softwareRole =
  /\b(software|backend|back-end|front-?end|full[\s-]?stack|web|mobile|ios|android|machine\s+learning|ml|data|devops)\s+(engineer|developer)\b|\bswe\b/i;
const experienceYears =
  /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:\+|[-–]\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:relevant|professional|software|engineering|industry|work))*\s+experience\b/i;
const numberWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function requiresThreeYears(description: string | null | undefined): boolean {
  if (!description) return false;
  const plainText = description.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ');
  return plainText.split(/[.!?;\n]/).some((sentence) => {
    const match = experienceYears.exec(sentence);
    if (!match || /\b(preferred|ideally|desired|bonus|nice to have)\b/i.test(sentence)) {
      return false;
    }
    const yearsText = match[1] ?? '';
    const years = Number(yearsText) || numberWords[yearsText.toLowerCase()] || 0;
    return years >= 3;
  });
}

// Province and state codes are case-sensitive so ", on" or ", in" in prose does not match.
const canadaWords = /\b(canada|toronto|ontario|ottawa|waterloo|mississauga|kitchener)\b/i;
const ontarioCode = /,\s*ON\b/;
const isCanada = (location: string) => canadaWords.test(location) || ontarioCode.test(location);

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

const usWords = new RegExp(
  `united states|usa|\\bus\\b|u\\.s\\.|\\b(${usCities.join('|')})\\b`,
  'i',
);
const usStateCode = new RegExp(`,\\s*(${usStates})\\b`);

// Bare "Remote" is accepted because boards rarely say which country.
const remoteOnly = /^\s*remote\s*$/i;

export function matchesTitle(title: string, broad = false): boolean {
  if (excluded.test(title) || nonSoftwareDiscipline.test(title)) return false;
  return entryLevel.test(title) || levelOne.test(title) || (broad && softwareRole.test(title));
}

export function matchesLocation(location: string | null, isRemote: boolean | null): boolean {
  if (!location) return isRemote === true;
  return (
    isCanada(location) ||
    usWords.test(location) ||
    usStateCode.test(location) ||
    remoteOnly.test(location)
  );
}

export function matchPosting(
  { title, location, isRemote, description }: FilterInput,
  { broad = false }: { broad?: boolean } = {},
): FilterResult {
  const matched =
    matchesTitle(title, broad) &&
    !requiresThreeYears(description) &&
    matchesLocation(location, isRemote);
  return { matched, priority: matched && !!location && isCanada(location) };
}
