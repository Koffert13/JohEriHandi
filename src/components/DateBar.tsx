import { holidayOn, isoWeek, isoWeekday, MONTHS_SV, parseYMD, WEEKDAY_COLORS, WEEKDAYS_SV, type YMD } from '../domain/index.ts';
import type { Settings } from '../settings.ts';
import { AnalogClock } from './AnalogClock.tsx';
import { Icon } from './Icon.tsx';

/** Månadssymboler (Handisymbol, handbok 5.8.2). */
const MONTH_SYMBOLS = ['⛄', '❄️', '🌱', '🐣', '🌷', '🌿', '☀️', '🌻', '🍎', '🍂', '🕯️', '🎄'];

/** Veckodagsfärg och textfärg. Utan veckodagsfärger används Handis blå. */
export function dayColors(date: YMD, s: Settings): { bg: string; fg: string } {
  if (!s.weekdayColors) return { bg: '#3f6fb6', fg: isoWeekday(date) === 7 ? '#ffb3b3' : '#fff' };
  const wd = isoWeekday(date) - 1;
  const dark = wd === 2 || wd === 4;
  return { bg: WEEKDAY_COLORS[wd], fg: dark ? '#1d1d1d' : '#fff' };
}

export function dateTitle(date: YMD, s: Settings, withWeek = true): string {
  const { d, m } = parseYMD(date);
  const wd = WEEKDAYS_SV[isoWeekday(date) - 1];
  const week = withWeek && s.monthSymbol === 'week' ? ` v${isoWeek(date)}` : '';
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${d} ${MONTHS_SV[m - 1]}${week}`;
}

/** Datumfältet överst i kalendern. */
export function DateBar({
  date,
  now,
  settings,
  onAdd,
  onClock,
  showButton = true,
}: {
  date: YMD;
  now: number;
  settings: Settings;
  onAdd?: () => void;
  onClock?: () => void;
  showButton?: boolean;
}) {
  const { bg, fg } = dayColors(date, settings);
  const holiday = settings.holidays ? holidayOn(date) : undefined;
  return (
    <header className="date-bar" style={{ background: bg, color: fg }}>
      {settings.monthSymbol === 'handi' && (
        <span className="db-symbol" aria-hidden="true">
          {MONTH_SYMBOLS[parseYMD(date).m - 1]}
        </span>
      )}
      <span className="db-text">
        <span className="db-title">{dateTitle(date, settings)}</span>
        {holiday && <span className={`db-holiday ${holiday.red ? 'red' : ''}`}>{holiday.name}</span>}
      </span>
      {showButton &&
        (settings.dateFieldButton === 'clock' ? (
          <button className="db-clock" onClick={onClock} aria-label="Klocka">
            <AnalogClock now={now} size={40} />
          </button>
        ) : (
          <button className="db-add" onClick={onAdd} aria-label="Lägg in aktivitet" style={{ borderColor: fg, color: fg }}>
            <Icon name="plus" size={26} stroke={2.6} />
          </button>
        ))}
    </header>
  );
}
