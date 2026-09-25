import { minutesOfDayAt } from '../domain/index.ts';
import { TZ } from '../hooks.ts';

/** Analog klocka. "navy" är Handis klockvy, "small" är klockan i datumraden. */
export function AnalogClock({ now, size = 56, variant = 'small' }: { now: number; size?: number; variant?: 'small' | 'navy' }) {
  const min = minutesOfDayAt(now, TZ);
  const hAngle = ((min / 60) % 12) * 30;
  const mAngle = (min % 60) * 6;
  const navy = variant === 'navy';
  const face = navy ? '#17466f' : '#fff';
  const ink = navy ? '#fff' : '#333';
  return (
    <svg className="analog-clock" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Klocka">
      <circle cx="50" cy="50" r="48" fill={face} stroke={navy ? '#17466f' : '#999'} strokeWidth="2" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1="3.5"
          x2="50"
          y2={i % 5 === 0 ? 8 : 6}
          stroke={ink}
          strokeWidth={i % 5 === 0 ? 1.4 : 0.8}
          transform={`rotate(${i * 6} 50 50)`}
        />
      ))}
      {navy &&
        Array.from({ length: 12 }, (_, i) => {
          const n = i + 1;
          const a = (n * 30 * Math.PI) / 180;
          return (
            <text key={n} x={50 + 36 * Math.sin(a)} y={50 - 36 * Math.cos(a) + 4.5} textAnchor="middle" fontSize="12.5" fill="#fff">
              {n}
            </text>
          );
        })}
      <line x1="50" y1="50" x2="50" y2={navy ? 27 : 24} stroke={navy ? '#e8102a' : '#222'} strokeWidth={navy ? 3.2 : 5} strokeLinecap="round" transform={`rotate(${hAngle} 50 50)`} />
      <line x1="50" y1="50" x2="50" y2={navy ? 13 : 12} stroke={navy ? '#e8102a' : '#222'} strokeWidth={navy ? 3.2 : 3} strokeLinecap="round" transform={`rotate(${mAngle} 50 50)`} />
      <circle cx="50" cy="50" r={navy ? 5 : 3.5} fill={navy ? '#fff' : '#d8262c'} />
    </svg>
  );
}
