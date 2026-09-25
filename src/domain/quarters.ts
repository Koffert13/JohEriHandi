/**
 * Kvartursprincipen (handbok 1.9): 1 prick = 15 minuter, fler än 8 prickar = "lång tid".
 * Sista kvarten kan visas som 5 små punkter à 3 minuter (handbok 5.3).
 */
export const QUARTER_MS = 15 * 60 * 1000;
export const MAX_DOTS = 8;

export interface QuarterDots {
  /** Antal tända stora prickar (0–8). */
  lit: number;
  /** Sant om det är mer än 8 kvart kvar. */
  longTime: boolean;
  /** Tända småpunkter (0–5) i sista kvarten, när lit === 0 eller sista kvarten pågår. */
  small: number;
  /** Kvarvarande ms. */
  remaining: number;
}

export function quarterDots(remainingMs: number): QuarterDots {
  const remaining = Math.max(0, remainingMs);
  const quarters = Math.ceil(remaining / QUARTER_MS);
  if (quarters > MAX_DOTS) return { lit: MAX_DOTS, longTime: true, small: 5, remaining };
  // Sista kvarten delas i 5 × 3 min.
  const inLast = remaining <= QUARTER_MS;
  const small = inLast ? Math.ceil(remaining / (3 * 60 * 1000)) : 5;
  return { lit: inLast ? 0 : quarters - 1, longTime: false, small: Math.min(5, small), remaining };
}

/** "1 tim 20 min", "5 min", "Nu". */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Nu';
  const total = Math.ceil(ms / 60000);
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d} ${d === 1 ? 'dag' : 'dagar'}`);
  if (h) parts.push(`${h} tim`);
  if (m && !d) parts.push(`${m} min`);
  return parts.join(' ') || '1 min';
}
