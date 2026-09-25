import { describe, expect, it } from 'vitest';
import {
  easterSunday,
  holidayOn,
  isoWeek,
  occursOn,
  quarterDots,
  type Activity,
} from '../src/domain/index.ts';

function act(p: Partial<Activity>): Activity {
  return {
    id: 'a1',
    title: 'Lunch',
    date: '2026-09-21',
    fullDay: false,
    start: '12:00',
    checkable: false,
    removeAfter: false,
    updatedAt: 0,
    ...p,
  };
}

describe('återkommande', () => {
  it('enstaka förekommer bara på sitt datum', () => {
    const a = act({});
    expect(occursOn(a, '2026-09-21')).toBe(true);
    expect(occursOn(a, '2026-09-22')).toBe(false);
  });

  it('veckovis tisdag och torsdag', () => {
    const a = act({ recurrence: { type: 'weekly', weekdays: [2, 4], everyOtherWeek: false } });
    expect(occursOn(a, '2026-09-22')).toBe(true); // tisdag
    expect(occursOn(a, '2026-09-23')).toBe(false);
    expect(occursOn(a, '2026-09-24')).toBe(true); // torsdag
    expect(occursOn(a, '2026-09-15')).toBe(false); // före startdatum
  });

  it('varannan vecka räknas från startveckan', () => {
    const a = act({ date: '2026-09-21', recurrence: { type: 'weekly', weekdays: [1], everyOtherWeek: true } });
    expect(occursOn(a, '2026-09-21')).toBe(true);
    expect(occursOn(a, '2026-09-28')).toBe(false);
    expect(occursOn(a, '2026-10-05')).toBe(true);
  });

  it('månadsvis med slutdatum och undantag', () => {
    const a = act({
      date: '2026-01-01',
      recurrence: { type: 'monthly', days: [1, 15], endDate: '2026-03-01' },
      exceptions: ['2026-02-15'],
    });
    expect(occursOn(a, '2026-01-15')).toBe(true);
    expect(occursOn(a, '2026-02-15')).toBe(false);
    expect(occursOn(a, '2026-03-01')).toBe(true);
    expect(occursOn(a, '2026-03-15')).toBe(false);
  });

  it('månadsvis den 31:a hamnar på sista dagen i kortare månader', () => {
    const a = act({ date: '2026-01-31', recurrence: { type: 'monthly', days: [31] } });
    expect(occursOn(a, '2026-02-28')).toBe(true);
    expect(occursOn(a, '2026-04-30')).toBe(true);
  });

  it('årsvis', () => {
    const a = act({ date: '2026-05-10', recurrence: { type: 'yearly' } });
    expect(occursOn(a, '2027-05-10')).toBe(true);
    expect(occursOn(a, '2027-05-11')).toBe(false);
  });
});

describe('kvartursprickar', () => {
  it('räknar kvartar', () => {
    expect(quarterDots(2 * 3600e3)).toMatchObject({ lit: 7, small: 5, longTime: false });
    expect(quarterDots(20 * 60e3)).toMatchObject({ lit: 1, small: 5 });
    expect(quarterDots(10 * 60e3)).toMatchObject({ lit: 0, small: 4 });
    expect(quarterDots(3 * 3600e3)).toMatchObject({ lit: 8, longTime: true });
    expect(quarterDots(0)).toMatchObject({ lit: 0, small: 0 });
  });
});

describe('helgdagar', () => {
  it('påskdagen', () => {
    expect(easterSunday(2026)).toBe('2026-04-05');
    expect(easterSunday(2027)).toBe('2027-03-28');
    expect(easterSunday(2028)).toBe('2028-04-16');
    expect(easterSunday(2029)).toBe('2029-04-01');
    expect(easterSunday(2030)).toBe('2030-04-21');
  });

  it('rörliga helgdagar 2026', () => {
    expect(holidayOn('2026-06-19')?.name).toBe('Midsommarafton');
    expect(holidayOn('2026-10-31')?.name).toBe('Alla helgons dag');
    expect(holidayOn('2026-05-31')?.name).toBe('Mors dag');
    expect(holidayOn('2026-11-08')?.name).toBe('Fars dag');
    expect(holidayOn('2026-05-14')?.name).toBe('Kristi himmelfärdsdag');
    expect(holidayOn('2026-04-02')).toEqual({ name: 'Skärtorsdag', red: false });
    expect(holidayOn('2026-09-25')).toBeUndefined();
  });

  it('veckonummer', () => {
    expect(isoWeek('2026-09-25')).toBe(39);
    expect(isoWeek('2027-01-01')).toBe(53);
    expect(isoWeek('2026-01-01')).toBe(1);
  });
});
