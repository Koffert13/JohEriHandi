import { useLiveQuery } from 'dexie-react-hooks';
import type { CategoryId } from './domain/index.ts';
import { db } from './db.ts';

export type CalendarTab = 'timeline' | 'list' | 'week' | 'month';
export type InfoKind = 'timer' | 'image' | 'note' | 'checklist' | 'link' | 'address' | 'phone' | 'sms';
export type MenuItem = 'addActivity' | 'startTimer' | 'clock' | 'search' | 'baseActivities' | 'baseTimers';
export type EditField =
  | 'date'
  | 'name'
  | 'start'
  | 'end'
  | 'duration'
  | 'fullDay'
  | 'checkable'
  | 'image'
  | 'info'
  | 'removeAfter'
  | 'category';
export type SequenceStep = 'date' | 'type' | 'base' | 'image' | 'name' | 'info' | 'removeAfter' | 'checkable' | 'category' | 'end';

/** Alla inställningar från Handis inställningsmeny (handbok kapitel 5), utom larm och talstöd. */
export interface Settings {
  onboarded: boolean;
  /** 5.1 Kodskydd */
  codeProtect: boolean;
  code: string;
  /** 5.2 Kalendervyn */
  startView: CalendarTab;
  showTabs: boolean;
  zoom: 'small' | 'large';
  browseBackSameDay: boolean;
  browseForward: 'none' | 'six' | 'unlimited';
  browseBack: boolean;
  showActivityTime: boolean;
  showActivityText: boolean;
  showQuarterDots: boolean;
  /** 5.3 Aktivitetsvyn */
  showDeleteButton: boolean;
  showEditButton: boolean;
  quarterView: boolean;
  lastQuarterAsFive: boolean;
  digitalCountdown: boolean;
  /** 5.4 Lägga in aktivitet */
  allowPastStart: boolean;
  addMethod: 'edit' | 'sequence';
  editChooseType: boolean;
  editBaseButton: boolean;
  sequence: Record<SequenceStep, boolean>;
  /** 5.5 Ändravyn */
  editFields: Record<EditField, boolean>;
  /** 5.6 Info-menyn (ordningen styr listan) */
  infoMenu: { kind: InfoKind; visible: boolean }[];
  /** 5.7 Kalendermenyn */
  calendarMenu: Record<MenuItem, boolean>;
  /** 5.8 Tidvisning */
  monthSymbol: 'handi' | 'week' | 'none';
  dateFieldButton: 'add' | 'clock';
  weekdayColors: boolean;
  holidays: boolean;
  /** 5.10 Klockvy */
  clockShowDate: boolean;
  clockShowPartOfDay: boolean;
  clockType: 'analog' | 'digital' | 'both';
  /** 5.11 Månadsvy */
  monthMarkRecurring: boolean;
  /** 5.12 Veckovy */
  weekDays: 5 | 7;
  weekDisplay: 'time' | 'image';
  weekShowRecurring: boolean;
  weekHourViewButton: boolean;
  /** 5.13 Starta timer */
  timerChooseBase: boolean;
  timerChooseImage: boolean;
  timerName: boolean;
  timerInput: 'm99' | 'm999' | 'hhmm';
  /** 5.16 Kategorier */
  categories: Record<CategoryId, { name: string; visible: boolean }>;
  /** Extra: håll skärmen tänd. */
  keepAwake: boolean;
}

/** Kategorifärger som i Handis kategorilista. */
export const CATEGORY_COLORS: Record<CategoryId, string> = {
  blue: '#9fcdf2',
  purple: '#f0a8ef',
  red: '#f28b8b',
  orange: '#f6c99a',
  green: '#a5e8a5',
  turquoise: '#9ee8e0',
};

export const CATEGORY_IDS = Object.keys(CATEGORY_COLORS) as CategoryId[];

export const INFO_LABELS: Record<InfoKind, string> = {
  timer: 'Timer',
  image: 'Bild',
  note: 'Anteckningar',
  checklist: 'Checklista',
  link: 'Länk',
  address: 'Adress',
  phone: 'Telefon',
  sms: 'SMS',
};

/** Grundinställning (handbok kapitel 7). */
export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  codeProtect: true,
  code: '0353',
  startView: 'timeline',
  showTabs: true,
  zoom: 'small',
  browseBackSameDay: true,
  browseForward: 'unlimited',
  browseBack: true,
  showActivityTime: true,
  showActivityText: true,
  showQuarterDots: true,
  showDeleteButton: true,
  showEditButton: true,
  quarterView: true,
  lastQuarterAsFive: true,
  digitalCountdown: true,
  allowPastStart: true,
  addMethod: 'edit',
  editChooseType: true,
  editBaseButton: true,
  sequence: {
    date: true,
    type: false,
    base: true,
    image: true,
    name: true,
    info: true,
    removeAfter: true,
    checkable: true,
    category: true,
    end: true,
  },
  editFields: {
    date: true,
    name: true,
    start: true,
    end: true,
    duration: false,
    fullDay: true,
    checkable: true,
    image: true,
    info: true,
    removeAfter: true,
    category: true,
  },
  infoMenu: [
    { kind: 'timer', visible: true },
    { kind: 'image', visible: true },
    { kind: 'note', visible: true },
    { kind: 'checklist', visible: true },
    { kind: 'link', visible: false },
    { kind: 'address', visible: false },
    { kind: 'phone', visible: false },
    { kind: 'sms', visible: false },
  ],
  calendarMenu: {
    addActivity: true,
    startTimer: true,
    clock: true,
    search: true,
    baseActivities: true,
    baseTimers: true,
  },
  monthSymbol: 'week',
  dateFieldButton: 'add',
  weekdayColors: true,
  holidays: true,
  clockShowDate: true,
  clockShowPartOfDay: true,
  clockType: 'analog',
  monthMarkRecurring: true,
  weekDays: 7,
  weekDisplay: 'image',
  weekShowRecurring: true,
  weekHourViewButton: false,
  timerChooseBase: true,
  timerChooseImage: true,
  timerName: true,
  timerInput: 'm99',
  categories: {
    blue: { name: 'Blå', visible: true },
    purple: { name: 'Lila', visible: true },
    red: { name: 'Röd', visible: true },
    orange: { name: 'Orange', visible: true },
    green: { name: 'Grön', visible: true },
    turquoise: { name: 'Turkos', visible: true },
  },
  keepAwake: false,
};

function merge(stored: Partial<Settings> | undefined): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  // Nya nycklar i nästlade objekt får sina grundvärden.
  s.sequence = { ...DEFAULT_SETTINGS.sequence, ...(stored?.sequence ?? {}) };
  s.editFields = { ...DEFAULT_SETTINGS.editFields, ...(stored?.editFields ?? {}) };
  s.calendarMenu = { ...DEFAULT_SETTINGS.calendarMenu, ...(stored?.calendarMenu ?? {}) };
  s.categories = { ...DEFAULT_SETTINGS.categories, ...(stored?.categories ?? {}) };
  const known = new Set(s.infoMenu.map((i) => i.kind));
  s.infoMenu = [...s.infoMenu, ...DEFAULT_SETTINGS.infoMenu.filter((i) => !known.has(i.kind))];
  return s;
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(async () => merge((await db.kv.get('settings'))?.value as Partial<Settings> | undefined));
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await db.transaction('rw', db.kv, async () => {
    const current = merge((await db.kv.get('settings'))?.value as Partial<Settings> | undefined);
    await db.kv.put({ key: 'settings', value: { ...current, ...patch } });
  });
}
