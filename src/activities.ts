import { useLiveQuery } from 'dexie-react-hooks';
import { addDays, hmToMinutes, occursOn, zonedTime, type Activity, type Timer, type YMD } from './domain/index.ts';
import { db, uid } from './db.ts';
import { TZ, today } from './hooks.ts';

/** En aktivitet på en viss dag. */
export interface Occurrence {
  activity: Activity;
  date: YMD;
  /** Epoch-ms, saknas för heldag. */
  startAt?: number;
  endAt?: number;
  signedOff: boolean;
}

export function occurrence(a: Activity, date: YMD): Occurrence {
  const startAt = !a.fullDay && a.start ? zonedTime(date, a.start, TZ) : undefined;
  let endAt = !a.fullDay && a.end ? zonedTime(date, a.end, TZ) : undefined;
  if (startAt !== undefined && endAt !== undefined && endAt <= startAt) endAt = undefined;
  return { activity: a, date, startAt, endAt, signedOff: a.signedOff?.includes(date) ?? false };
}

/** Sant om förekomsten ska visas (hanterar "Ta bort efteråt"). */
function visible(a: Activity, date: YMD, todayYmd: YMD): boolean {
  return occursOn(a, date) && !(a.removeAfter && date < todayYmd);
}

export function occurrencesOn(all: Activity[], date: YMD): Occurrence[] {
  const t = today();
  return all
    .filter((a) => visible(a, date, t))
    .map((a) => occurrence(a, date))
    .sort(compareOccurrences);
}

export function compareOccurrences(x: Occurrence, y: Occurrence): number {
  if (x.activity.fullDay !== y.activity.fullDay) return x.activity.fullDay ? -1 : 1;
  const sx = x.activity.start ? hmToMinutes(x.activity.start) : 0;
  const sy = y.activity.start ? hmToMinutes(y.activity.start) : 0;
  return sx - sy || x.activity.title.localeCompare(y.activity.title, 'sv');
}

export function useActivities(): Activity[] | undefined {
  return useLiveQuery(() => db.activities.toArray());
}

export function useTimers(): Timer[] | undefined {
  return useLiveQuery(() => db.timers.orderBy('startAt').toArray());
}

export function timerEnd(t: Timer): number {
  return t.startAt + t.minutes * 60000;
}

export type Scope = 'thisDay' | 'forward' | 'all';

/** Spara en ny eller ändrad aktivitet. För återkommande aktiviteter anger scope vad som ändras. */
export async function saveActivity(next: Activity, scope: Scope = 'all', occurrenceDate?: YMD): Promise<string> {
  const now = Date.now();
  const existing = await db.activities.get(next.id);
  if (!existing || !existing.recurrence || scope === 'all' || !occurrenceDate) {
    await db.activities.put({ ...next, updatedAt: now });
    return next.id;
  }
  return db.transaction('rw', db.activities, async () => {
    if (scope === 'thisDay') {
      // Undantag i serien + en enstaka kopia för dagen.
      await db.activities.put({ ...existing, exceptions: [...(existing.exceptions ?? []), occurrenceDate], updatedAt: now });
      const single: Activity = {
        ...next,
        id: uid(),
        recurrence: undefined,
        exceptions: undefined,
        date: occurrenceDate,
        signedOff: existing.signedOff?.filter((d) => d === occurrenceDate),
        checked: pick(existing.checked, occurrenceDate),
        updatedAt: now,
      };
      await db.activities.put(single);
      return single.id;
    }
    // Denna dag och framåt: avsluta gamla serien dagen innan och starta en ny.
    if (occurrenceDate <= existing.date) {
      await db.activities.put({ ...next, updatedAt: now });
      return next.id;
    }
    await db.activities.put({
      ...existing,
      recurrence: existing.recurrence && { ...existing.recurrence, endDate: addDays(occurrenceDate, -1) },
      updatedAt: now,
    });
    const series: Activity = {
      ...next,
      id: uid(),
      date: occurrenceDate,
      signedOff: existing.signedOff?.filter((d) => d >= occurrenceDate),
      exceptions: existing.exceptions?.filter((d) => d >= occurrenceDate),
      updatedAt: now,
    };
    await db.activities.put(series);
    return series.id;
  });
}

function pick(checked: Activity['checked'], date: YMD): Activity['checked'] {
  return checked?.[date] ? { [date]: checked[date] } : undefined;
}

export async function deleteActivity(a: Activity, scope: Scope, date: YMD): Promise<void> {
  if (!a.recurrence || scope === 'all' || (scope === 'forward' && date <= a.date)) {
    await db.activities.delete(a.id);
    return;
  }
  if (scope === 'thisDay') {
    await db.activities.update(a.id, { exceptions: [...(a.exceptions ?? []), date], updatedAt: Date.now() });
    return;
  }
  await db.activities.update(a.id, {
    recurrence: { ...a.recurrence, endDate: addDays(date, -1) },
    updatedAt: Date.now(),
  });
}

export async function toggleSignOff(a: Activity, date: YMD): Promise<void> {
  const cur = new Set(a.signedOff ?? []);
  if (cur.has(date)) cur.delete(date);
  else cur.add(date);
  await db.activities.update(a.id, { signedOff: [...cur].sort(), updatedAt: Date.now() });
}

export async function toggleChecklistItem(a: Activity, date: YMD, itemId: string): Promise<void> {
  const fresh = await db.activities.get(a.id);
  if (!fresh) return;
  const list = new Set(fresh.checked?.[date] ?? []);
  if (list.has(itemId)) list.delete(itemId);
  else list.add(itemId);
  await db.activities.update(a.id, { checked: { ...(fresh.checked ?? {}), [date]: [...list] }, updatedAt: Date.now() });
}

/** Rensar enstaka aktiviteter med "Ta bort efteråt" och gamla timers. */
export async function cleanup(): Promise<void> {
  const t = today();
  await db.activities.filter((a) => !a.recurrence && a.removeAfter && a.date < t).delete();
  const dayAgo = Date.now() - 86400000;
  await db.timers.filter((x) => timerEnd(x) < dayAgo).delete();
}

export async function startTimer(title: string, minutes: number, image?: string): Promise<string> {
  const id = uid();
  await db.timers.put({ id, title: title.trim() || minutesLabel(minutes), minutes, image, startAt: Date.now() });
  return id;
}

export function minutesLabel(min: number): string {
  if (min % 60 === 0) return min === 60 ? '1 timme' : `${min / 60} timmar`;
  if (min > 60) return `${Math.floor(min / 60)} tim ${min % 60} min`;
  return `${min} minuter`;
}

export function timeRange(a: Activity): string {
  if (a.fullDay) return 'Heldag';
  if (!a.start) return '';
  return a.end && a.end !== a.start ? `${a.start}–${a.end}` : a.start;
}
