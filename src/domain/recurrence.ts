import type { Activity, Recurrence, YMD } from './types.ts';
import { dayNumber, daysInMonth, isoWeekday, parseYMD, startOfWeek } from './time.ts';

type Occurs = Pick<Activity, 'date' | 'recurrence' | 'exceptions'>;

/** Sant om aktiviteten förekommer på given dag. */
export function occursOn(a: Occurs, day: YMD): boolean {
  if (day < a.date) return false;
  if (a.exceptions?.includes(day)) return false;
  const r = a.recurrence;
  if (!r) return day === a.date;
  if (r.endDate && day > r.endDate) return false;
  return matchesRule(r, a.date, day);
}

function matchesRule(r: Recurrence, first: YMD, day: YMD): boolean {
  switch (r.type) {
    case 'weekly': {
      if (!r.weekdays.includes(isoWeekday(day))) return false;
      if (!r.everyOtherWeek) return true;
      const weeks = (dayNumber(startOfWeek(day)) - dayNumber(startOfWeek(first))) / 7;
      return weeks % 2 === 0;
    }
    case 'monthly': {
      const { y, m, d } = parseYMD(day);
      if (r.days.includes(d)) return true;
      // Den 29–31 i en kortare månad läggs på sista dagen.
      const last = daysInMonth(y, m);
      return d === last && r.days.some((x) => x > last);
    }
    case 'yearly': {
      const f = parseYMD(first);
      const t = parseYMD(day);
      if (f.m !== t.m) return false;
      if (f.d === t.d) return true;
      return f.m === 2 && f.d === 29 && t.d === 28 && daysInMonth(t.y, 2) === 28;
    }
  }
}

export function recurrenceLabel(r: Recurrence | undefined): string {
  if (!r) return 'Enstaka';
  const days = ['mån', 'tis', 'ons', 'tor', 'fre', 'lör', 'sön'];
  switch (r.type) {
    case 'weekly': {
      const list = [...r.weekdays].sort().map((d) => days[d - 1]);
      const every = list.length === 7 ? 'Varje dag' : `Varje ${list.join(', ')}`;
      return r.everyOtherWeek ? `${every} (varannan vecka)` : every;
    }
    case 'monthly':
      return `Varje månad den ${[...r.days].sort((a, b) => a - b).join(', ')}:e`;
    case 'yearly':
      return 'Varje år';
  }
}
