import { MAX_DOTS, quarterDots } from '../domain/index.ts';

/** Placering av de 5 små punkterna i sista kvarten (som en tärning). */
const FIVE = [
  [30, 30],
  [70, 30],
  [50, 50],
  [30, 70],
  [70, 70],
];

/** hh:mm kvar, som under prickarna i Handi. */
export function formatHM(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 60000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Kvartursvisning (handbok 1.9): 8 prickar, 1 prick = 15 min. Svart prick = tid kvar,
 * prickarna slocknar uppifrån och ned. Sista kvarten kan visas som 5 små punkter à 3 min.
 */
export function QuarterDots({ remainingMs, lastAsFive, digital }: { remainingMs: number; lastAsFive: boolean; digital: boolean }) {
  const q = quarterDots(remainingMs);
  const inLast = !q.longTime && q.lit === 0;
  return (
    <div className="qd-wrap">
      <div className="qd-panel" role="img" aria-label={`${formatHM(remainingMs)} kvar`}>
        {Array.from({ length: MAX_DOTS - 1 }, (_, i) => (
          <span key={i} className={`qd ${MAX_DOTS - 2 - i < q.lit ? 'on' : ''}`} />
        ))}
        {inLast && lastAsFive ? (
          <span className="qd">
            <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
              {FIVE.slice(0, q.small).map(([x, y]) => (
                <circle key={`${x}${y}`} cx={x} cy={y} r="11" fill="#1d1d1d" />
              ))}
            </svg>
          </span>
        ) : (
          <span className={`qd ${q.small > 0 ? 'on' : ''}`} />
        )}
      </div>
      {digital && <div className="qd-digital">{formatHM(remainingMs)}</div>}
    </div>
  );
}
