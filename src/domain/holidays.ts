import type { YMD } from './types.ts';
import { addDays, isoWeekday, toYMD } from './time.ts';

export interface Holiday {
  name: string;
  /** Sant för "röd dag"/ledig dag, falskt för högtidsdag (handbok 4.1.6). */
  red: boolean;
}

/** Påskdagen enligt den gregorianska algoritmen (Meeus/Jones/Butcher). */
export function easterSunday(year: number): YMD {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return toYMD(year, month, day);
}

/** Första dagen i intervallet [from, from+6] som har given veckodag. */
function weekdayOnOrAfter(from: YMD, weekday: number): YMD {
  let d = from;
  while (isoWeekday(d) !== weekday) d = addDays(d, 1);
  return d;
}

const cache = new Map<number, Map<YMD, Holiday>>();

export function holidaysForYear(year: number): Map<YMD, Holiday> {
  const hit = cache.get(year);
  if (hit) return hit;
  const easter = easterSunday(year);
  const lastSundayMay = weekdayOnOrAfter(toYMD(year, 5, 25), 7);
  const midsummerEve = weekdayOnOrAfter(toYMD(year, 6, 19), 5);
  const allSaints = weekdayOnOrAfter(toYMD(year, 10, 31), 6);
  const fathersDay = addDays(weekdayOnOrAfter(toYMD(year, 11, 1), 7), 7);
  const list: [YMD, string, boolean][] = [
    [toYMD(year, 1, 1), 'Nyårsdagen', true],
    [toYMD(year, 1, 6), 'Trettondedag jul', true],
    [toYMD(year, 2, 14), 'Alla hjärtans dag', false],
    [addDays(easter, -3), 'Skärtorsdag', false],
    [addDays(easter, -2), 'Långfredag', true],
    [easter, 'Påskdagen', true],
    [addDays(easter, 1), 'Annandag påsk', true],
    [toYMD(year, 4, 30), 'Valborgsmässoafton', false],
    [toYMD(year, 5, 1), 'Första maj', true],
    [addDays(easter, 39), 'Kristi himmelfärdsdag', true],
    [lastSundayMay, 'Mors dag', false],
    [addDays(easter, 49), 'Pingstdagen', true],
    [addDays(easter, 50), 'Annandag pingst', false],
    [toYMD(year, 6, 6), 'Nationaldagen', true],
    [midsummerEve, 'Midsommarafton', true],
    [addDays(midsummerEve, 1), 'Midsommardagen', true],
    [allSaints, 'Alla helgons dag', true],
    [fathersDay, 'Fars dag', false],
    [toYMD(year, 12, 13), 'Lucia', false],
    [toYMD(year, 12, 24), 'Julafton', true],
    [toYMD(year, 12, 25), 'Juldagen', true],
    [toYMD(year, 12, 26), 'Annandag jul', true],
    [toYMD(year, 12, 31), 'Nyårsafton', true],
  ];
  const map = new Map<YMD, Holiday>();
  for (const [d, name, red] of list) {
    const prev = map.get(d);
    map.set(d, prev ? { name: `${prev.name}, ${name}`, red: prev.red || red } : { name, red });
  }
  cache.set(year, map);
  return map;
}

export function holidayOn(date: YMD): Holiday | undefined {
  return holidaysForYear(Number(date.slice(0, 4))).get(date);
}
