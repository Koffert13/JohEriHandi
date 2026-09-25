import Dexie, { type Table } from 'dexie';
import type { Activity, ActivityInfo, CategoryId, HM, Timer } from './domain/index.ts';

export interface StoredImage {
  id: string;
  name: string;
  blob: Blob;
  createdAt: number;
}

/** Fördefinierad aktivitet (handbok 1.11 Basaktivitet). */
export interface BaseActivity {
  id: string;
  title: string;
  image?: string;
  fullDay: boolean;
  start?: HM;
  end?: HM;
  checkable: boolean;
  category?: CategoryId;
  info?: ActivityInfo;
}

/** Fördefinierad timer (handbok 1.11 Bastimer). */
export interface BaseTimer {
  id: string;
  title: string;
  image?: string;
  minutes: number;
}

export interface KV {
  key: string;
  value: unknown;
}

class HandiDB extends Dexie {
  activities!: Table<Activity, string>;
  timers!: Table<Timer, string>;
  images!: Table<StoredImage, string>;
  baseActivities!: Table<BaseActivity, string>;
  baseTimers!: Table<BaseTimer, string>;
  kv!: Table<KV, string>;

  constructor() {
    super('handi');
    this.version(1).stores({
      activities: 'id, date',
      timers: 'id, startAt',
      images: 'id, createdAt',
      baseActivities: 'id, title',
      baseTimers: 'id, minutes',
      kv: 'key',
    });
  }
}

export const db = new HandiDB();

// Gör databasen åtkomlig för automatiska tester.
(globalThis as { handiDb?: HandiDB }).handiDb = db;

export function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

/** Be webbläsaren att inte rensa datan automatiskt. */
export async function requestPersistence(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    // Stöds inte överallt.
  }
}
