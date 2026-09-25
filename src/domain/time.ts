import { TZDate } from '@date-fns/tz';
import type { HM, YMD } from './types.ts';

export const DEFAULT_TZ = 'Europe/Stockholm';

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function parseYMD(d: YMD): { y: number; m: number; d: number } {
  const [y, m, day] = d.split('-').map(Number);
  return { y, m, d: day };
}

export function toYMD(y: number, m: number, d: number): YMD {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function parseHM(t: HM): { h: number; m: number } {
  const [h, m] = t.split(':').map(Number);
  return { h, m };
}

export function hmToMinutes(t: HM): number {
  const { h, m } = parseHM(t);
  return h * 60 + m;
}

export function minutesToHM(min: number): HM {
  const v = ((min % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(v / 60))}:${pad2(v % 60)}`;
}

/** Epoch-ms för ett datum + klockslag i given tidszon. */
export function zonedTime(date: YMD, time: HM | undefined, tz: string): number {
  const { y, m, d } = parseYMD(date);
  const { h, m: mi } = time ? parseHM(time) : { h: 0, m: 0 };
  return new TZDate(y, m - 1, d, h, mi, tz).getTime();
}

/** Datum (ÅÅÅÅ-MM-DD) för en tidpunkt i given tidszon. */
export function ymdAt(epoch: number, tz: string): YMD {
  const z = new TZDate(epoch, tz);
  return toYMD(z.getFullYear(), z.getMonth() + 1, z.getDate());
}

/** Minuter sedan midnatt för en tidpunkt i given tidszon. */
export function minutesOfDayAt(epoch: number, tz: string): number {
  const z = new TZDate(epoch, tz);
  return z.getHours() * 60 + z.getMinutes() + z.getSeconds() / 60;
}

export function hmAt(epoch: number, tz: string): HM {
  const z = new TZDate(epoch, tz);
  return `${pad2(z.getHours())}:${pad2(z.getMinutes())}`;
}

/** Dagnummer räknat från 1970-01-01 (kalenderdagar, oberoende av tidszon). */
export function dayNumber(date: YMD): number {
  const { y, m, d } = parseYMD(date);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function fromDayNumber(n: number): YMD {
  const dt = new Date(n * 86400000);
  return toYMD(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function addDays(date: YMD, days: number): YMD {
  return fromDayNumber(dayNumber(date) + days);
}

export function addMonths(date: YMD, months: number): YMD {
  const { y, m } = parseYMD(date);
  const idx = y * 12 + (m - 1) + months;
  return toYMD(Math.floor(idx / 12), (idx % 12) + 1, 1);
}

/** ISO-veckodag: 1 = måndag … 7 = söndag. */
export function isoWeekday(date: YMD): number {
  const wd = new Date(dayNumber(date) * 86400000).getUTCDay();
  return wd === 0 ? 7 : wd;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function isoWeek(date: YMD): number {
  const n = dayNumber(date);
  const thursday = n - isoWeekday(date) + 4;
  const ty = new Date(thursday * 86400000).getUTCFullYear();
  const jan1 = dayNumber(toYMD(ty, 1, 1));
  return Math.floor((thursday - jan1) / 7) + 1;
}

/** Måndagen i samma vecka. */
export function startOfWeek(date: YMD): YMD {
  return addDays(date, 1 - isoWeekday(date));
}

export type PartOfDay = 'morning' | 'day' | 'evening' | 'night';

/** Morgon 06–10, Dag 10–18, Kväll 18–23, Natt 23–06 (handbok 4.10). */
export function partOfDay(minutes: number): PartOfDay {
  const h = minutes / 60;
  if (h >= 6 && h < 10) return 'morning';
  if (h >= 10 && h < 18) return 'day';
  if (h >= 18 && h < 23) return 'evening';
  return 'night';
}

export const PART_OF_DAY_SV: Record<PartOfDay, string> = {
  morning: 'Morgon',
  day: 'Dag',
  evening: 'Kväll',
  night: 'Natt',
};

export const WEEKDAYS_SV = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];
export const WEEKDAYS_SHORT_SV = ['mån', 'tis', 'ons', 'tor', 'fre', 'lör', 'sön'];
export const MONTHS_SV = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
];

/** Standardiserade veckodagsfärger (handbok 5.8.3). Index 0 = måndag. */
export const WEEKDAY_COLORS = ['#3ea948', '#3b6cc0', '#ffffff', '#7b4a26', '#eedb3a', '#d46bb8', '#dc3a3a'];
