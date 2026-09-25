import { db, uid, type BaseActivity, type BaseTimer } from './db.ts';

/** Startuppsättning (handbok 3.3): basaktiviteter och bastimers. */
export async function installStarterSet(): Promise<void> {
  const bases: Omit<BaseActivity, 'id'>[] = [
    { title: 'Vakna', image: 'p:8989.png', fullDay: false, start: '07:00', checkable: false },
    { title: 'Frukost', image: 'p:4626.png', fullDay: false, start: '08:00', end: '08:30', checkable: false },
    { title: 'Ta medicin', image: 'p:8163.png', fullDay: false, start: '08:30', checkable: true, category: 'red' },
    { title: 'Lunch', image: 'p:4611.png', fullDay: false, start: '12:00', end: '12:45', checkable: false },
    { title: 'Fika', image: 'p:24479.png', fullDay: false, start: '15:00', end: '15:30', checkable: false },
    { title: 'Middag', image: 'p:4592.png', fullDay: false, start: '17:30', end: '18:15', checkable: false },
    { title: 'Promenad', image: 'p:29951.png', fullDay: false, start: '10:00', end: '11:00', checkable: false, category: 'green' },
    { title: 'Handla', image: 'p:8986.png', fullDay: false, start: '14:00', end: '15:00', checkable: false },
    { title: 'Duscha', image: 'p:26803.png', fullDay: false, start: '19:00', end: '19:30', checkable: true },
    {
      title: 'Kvällsrutin',
      image: 'p:2326.png',
      fullDay: false,
      start: '21:30',
      end: '22:00',
      checkable: true,
      info: {
        type: 'checklist',
        items: [
          { id: uid(), text: 'Ta medicin', image: 'p:8163.png' },
          { id: uid(), text: 'Borsta tänderna', image: 'p:2326.png' },
          { id: uid(), text: 'Ladda telefonen', image: 'p:34939.png' },
        ],
      },
    },
    { title: 'Sova', image: 'p:6479.png', fullDay: false, start: '22:00', checkable: false },
    { title: 'Läkarbesök', image: 'p:6561.png', fullDay: false, start: '10:00', end: '11:00', checkable: false, category: 'blue' },
    { title: 'Besök', image: 'p:27126.png', fullDay: false, start: '14:00', end: '16:00', checkable: false, category: 'purple' },
    { title: 'Hemtjänst', image: 'p:2476.png', fullDay: false, start: '09:00', end: '09:30', checkable: false, category: 'turquoise' },
  ];
  const timers: Omit<BaseTimer, 'id'>[] = [
    { title: 'Koka ägg', image: 'p:30526.png', minutes: 8 },
    { title: 'Vila', image: 'p:16643.png', minutes: 30 },
    { title: 'Tvättmaskin', image: 'p:2442.png', minutes: 60 },
  ];
  await db.transaction('rw', db.baseActivities, db.baseTimers, async () => {
    const existing = new Set((await db.baseActivities.toArray()).map((b) => b.title));
    await db.baseActivities.bulkPut(bases.filter((b) => !existing.has(b.title)).map((b) => ({ ...b, id: uid() })));
    const existingT = new Set((await db.baseTimers.toArray()).map((b) => b.title));
    await db.baseTimers.bulkPut(timers.filter((b) => !existingT.has(b.title)).map((b) => ({ ...b, id: uid() })));
  });
}
