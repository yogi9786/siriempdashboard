/**
 * Standard Jewelry Schemes for Siri Samruddhi Gold Palace
 * Exactly 3 active schemes across all showroom & outdoor modules:
 * 1. SIRISAMRUDDHI GOLDEN DREAMS
 * 2. SIRISAMRUDDHI GOLDEN AMBARI
 * 3. SIRISAMRUDDHI GOLDEN NIDHI
 */

export const SCHEMES = [
  'SIRISAMRUDDHI GOLDEN DREAMS',
  'SIRISAMRUDDHI GOLDEN AMBARI',
  'SIRISAMRUDDHI GOLDEN NIDHI',
] as const;

export type SchemeName = (typeof SCHEMES)[number];

export const DEFAULT_SCHEME: SchemeName = SCHEMES[0];

export const SCHEME_DETAILS: Record<
  SchemeName,
  {
    badge: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  'SIRISAMRUDDHI GOLDEN DREAMS': {
    badge: 'Dreams Plan',
    description: 'Premier monthly gold savings & wealth creation scheme',
    icon: '✨',
    color: 'from-amber-500 to-yellow-600',
  },
  'SIRISAMRUDDHI GOLDEN AMBARI': {
    badge: 'Ambari Plan',
    description: 'Royal bridal advance booking & heritage gold scheme',
    icon: '👑',
    color: 'from-amber-600 to-orange-600',
  },
  'SIRISAMRUDDHI GOLDEN NIDHI': {
    badge: 'Nidhi Plan',
    description: '11-Month auspicious gold treasure accumulation scheme',
    icon: '🏛️',
    color: 'from-yellow-600 to-amber-700',
  },
};
