

/** Exempeldata för skärmdumpar och tester. Datum: fredag 2026-09-25. */
export async function seed(page) {
  await page.evaluate(async () => {
    const db = globalThis.handiDb;
    const base = { fullDay: false, checkable: false, removeAfter: false, updatedAt: 0 };
    await db.kv.put({ key: 'settings', value: { onboarded: true } });
    await db.activities.bulkPut([
      { ...base, id: 'a1', title: 'Frukost', image: 'p:4626.png', date: '2026-09-25', start: '08:00', end: '08:30', signedOff: ['2026-09-25'], checkable: true },
      { ...base, id: 'a2', title: 'Ta medicin', image: 'p:8163.png', date: '2026-09-25', start: '08:30', checkable: true, category: 'red' },
      { ...base, id: 'a3', title: 'Promenad', image: 'p:29951.png', date: '2026-09-25', start: '10:00', end: '11:00', category: 'green' },
      { ...base, id: 'a4', title: 'Lunch', image: 'p:4611.png', date: '2026-09-25', start: '12:00', end: '12:45', info: { type: 'note', text: 'Spaghetti med köttfärssås' } },
      { ...base, id: 'a5', title: 'Tandläkaren', image: 'p:2733.png', date: '2026-09-25', start: '14:00', end: '15:00', category: 'blue' },
      { ...base, id: 'a6', title: 'Middag', image: 'p:4592.png', date: '2026-09-01', start: '17:30', end: '18:15', recurrence: { type: 'weekly', weekdays: [1, 2, 3, 4, 5, 6, 7], everyOtherWeek: false } },
      {
        ...base,
        id: 'a7',
        title: 'Kvällsrutin',
        image: 'p:2326.png',
        date: '2026-09-25',
        start: '21:30',
        end: '22:00',
        checkable: true,
        info: {
          type: 'checklist',
          items: [
            { id: 'c1', text: 'Ta medicin', image: 'p:8163.png' },
            { id: 'c2', text: 'Borsta tänderna', image: 'p:2326.png' },
            { id: 'c3', text: 'Ladda telefonen', image: 'p:34939.png' },
          ],
        },
        checked: { '2026-09-25': ['c1'] },
      },
      { ...base, id: 'a8', title: 'Mammas födelsedag', image: 'p:37363.png', date: '2026-09-25', fullDay: true },
      { ...base, id: 'a9', title: 'Handla', image: 'p:8986.png', date: '2026-09-22', start: '14:00', end: '15:00', recurrence: { type: 'weekly', weekdays: [2, 4], everyOtherWeek: false } },
      { ...base, id: 'a10', title: 'Bowling', image: 'p:2283.png', date: '2026-09-30', start: '18:00', end: '20:00' },
    ]);
    await db.baseActivities.bulkPut([
      { id: 'b1', title: 'Lunch', image: 'p:4611.png', fullDay: false, start: '12:00', end: '12:45', checkable: false },
      { id: 'b2', title: 'Ta medicin', image: 'p:8163.png', fullDay: false, start: '08:30', checkable: true, category: 'red' },
    ]);
    await db.baseTimers.bulkPut([{ id: 't1', title: 'Koka ägg', image: 'p:30526.png', minutes: 8 }]);
  });
}
