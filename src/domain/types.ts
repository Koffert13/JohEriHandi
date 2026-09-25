/** Datum som "ÅÅÅÅ-MM-DD" i användarens tidszon. */
export type YMD = string;
/** Klockslag som "TT:MM". */
export type HM = string;

export type CategoryId = 'blue' | 'purple' | 'red' | 'orange' | 'green' | 'turquoise';

export type Recurrence =
  | { type: 'weekly'; weekdays: number[]; everyOtherWeek: boolean; endDate?: YMD }
  | { type: 'monthly'; days: number[]; endDate?: YMD }
  | { type: 'yearly'; endDate?: YMD };

export interface ChecklistItem {
  id: string;
  text: string;
  image?: string;
}

export type ActivityInfo =
  | { type: 'note'; text: string }
  | { type: 'checklist'; items: ChecklistItem[] }
  | { type: 'timer'; minutes: number }
  | { type: 'image'; image: string }
  | { type: 'link'; url: string }
  | { type: 'address'; address: string }
  | { type: 'phone'; number: string }
  | { type: 'sms'; number: string };

export interface Activity {
  id: string;
  title: string;
  /** "p:<fil>" för piktogram, "u:<id>" för egen bild. */
  image?: string;
  /** Första (eller enda) dagen. */
  date: YMD;
  fullDay: boolean;
  start?: HM;
  end?: HM;
  checkable: boolean;
  category?: CategoryId;
  removeAfter: boolean;
  info?: ActivityInfo;
  recurrence?: Recurrence;
  /** Dagar som tagits bort ur en återkommande serie. */
  exceptions?: YMD[];
  /** Dagar då aktiviteten är kvitterad. */
  signedOff?: YMD[];
  /** Avbockade checklistpunkter per dag. */
  checked?: Record<YMD, string[]>;
  updatedAt: number;
}

export interface Timer {
  id: string;
  title: string;
  image?: string;
  /** Epoch-ms. */
  startAt: number;
  minutes: number;
}
