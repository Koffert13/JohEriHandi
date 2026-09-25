import { useLayoutEffect, useRef, useState } from 'react';
import {
  addDays,
  addMonths,
  daysInMonth,
  holidayOn,
  isoWeek,
  isoWeekday,
  minutesOfDayAt,
  MONTHS_SV,
  pad2,
  parseYMD,
  startOfWeek,
  toYMD,
  WEEKDAYS_SHORT_SV,
  ymdAt,
  type Timer,
  type YMD,
} from '../domain/index.ts';
import { occurrencesOn, timeRange, timerEnd, useActivities, useTimers, type Occurrence } from '../activities.ts';
import { DateBar, dayColors } from '../components/DateBar.tsx';
import { Icon, MenuIcon, StepArrow, TabIcon, TodayIcon, type TabIconName } from '../components/Icon.tsx';
import { Picture } from '../components/Picture.tsx';
import { TZ, today, useNow } from '../hooks.ts';
import { useNav } from '../nav.tsx';
import { CATEGORY_COLORS, type Settings } from '../settings.ts';

export function canBrowse(date: YMD, dir: -1 | 1, s: Settings): boolean {
  const t = today();
  const target = addDays(date, dir);
  if (dir < 0) return s.browseBack || target >= t;
  if (s.browseForward === 'none') return target <= t;
  if (s.browseForward === 'six') return target <= addDays(t, 6);
  return true;
}

function Signed() {
  return (
    <span className="signed-mark" aria-label="Kvitterad">
      <Icon name="check" size={20} stroke={3.4} />
    </span>
  );
}

export function CalendarScreen({ settings }: { settings: Settings }) {
  const nav = useNav();
  const now = useNow();
  const activities = useActivities();
  const timers = useTimers() ?? [];
  const { tab, setTab } = nav;
  const date = nav.day;
  const t = today();
  const { bg, fg } = dayColors(date, settings);
  const add = () => nav.push({ name: 'edit', date });
  const openOcc = (o: Occurrence) => nav.push({ name: 'activity', id: o.activity.id, date: o.date });
  const all = activities ?? [];

  const step = tab === 'week' ? 7 : tab === 'month' ? 0 : 1;
  const stepLabel = tab === 'week' ? '7' : tab === 'month' ? '30' : '1';
  const move = (dir: -1 | 1) => {
    if (tab === 'month') nav.setDay(addMonths(date, dir));
    else nav.setDay(addDays(date, dir * step));
  };
  const canPrev = tab === 'timeline' || tab === 'list' ? canBrowse(date, -1, settings) : true;
  const canNext = tab === 'timeline' || tab === 'list' ? canBrowse(date, 1, settings) : true;
  const onToday =
    tab === 'week' ? startOfWeek(date) === startOfWeek(t) : tab === 'month' ? date.slice(0, 7) === t.slice(0, 7) : date === t;

  const tabs: TabIconName[] = ['timeline', 'list', 'week', 'month'];
  return (
    <div className="page calendar">
      <DateBar date={tab === 'week' || tab === 'month' ? t : date} now={now} settings={settings} onAdd={add} onClock={() => nav.push({ name: 'clock' })} />
      {settings.showTabs && (
        <div className="view-tabs" style={{ background: bg, color: fg }}>
          {tabs.map((name) => (
            <button key={name} className={tab === name ? 'on' : ''} onClick={() => setTab(name)} aria-label={name} aria-pressed={tab === name}>
              <TabIcon name={name} />
            </button>
          ))}
        </div>
      )}
      {tab === 'timeline' && (
        <Timeline date={date} occurrences={occurrencesOn(all, date)} timers={timers} now={now} settings={settings} onOpen={openOcc} />
      )}
      {tab === 'list' && <DayList date={date} occurrences={occurrencesOn(all, date)} timers={timers} now={now} settings={settings} onOpen={openOcc} />}
      {tab === 'week' && (
        <WeekView
          date={date}
          settings={settings}
          onPickDay={(d) => {
            nav.setDay(d);
            setTab('timeline');
          }}
        />
      )}
      {tab === 'month' && <MonthView date={date} settings={settings} now={now} />}
      <nav className="bottom-bar five">
        <button className="bar-icon-btn" onClick={() => move(-1)} aria-label="Bakåt" style={{ visibility: canPrev ? 'visible' : 'hidden' }}>
          <StepArrow dir="prev" label={stepLabel} />
        </button>
        <button className="round-btn" onClick={() => nav.setDay(t)} aria-label="Idag" style={{ visibility: onToday ? 'hidden' : 'visible' }}>
          <TodayIcon size={38} />
        </button>
        <button className="round-btn" onClick={() => nav.push({ name: 'menu' })} aria-label="Kalendermenyn">
          <MenuIcon size={34} />
        </button>
        <span />
        <button className="bar-icon-btn" onClick={() => move(1)} aria-label="Framåt" style={{ visibility: canNext ? 'visible' : 'hidden' }}>
          <StepArrow dir="next" label={stepLabel} />
        </button>
      </nav>
    </div>
  );
}

/** Heldagsaktiviteter visas överst, skilda från de tidsatta (handbok 1.11). */
function FullDayStrip({ occurrences, settings, onOpen }: { occurrences: Occurrence[]; settings: Settings; onOpen: (o: Occurrence) => void }) {
  const list = occurrences.filter((o) => o.startAt === undefined);
  if (!list.length) return null;
  return (
    <div className="fullday-strip">
      {list.map((o) => (
        <button key={o.activity.id} className="fullday-item" onClick={() => onOpen(o)}>
          {o.activity.image && <Picture image={o.activity.image} alt="" />}
          {(settings.showActivityText || !o.activity.image) && <span>{o.activity.title}</span>}
          {o.signedOff && <Signed />}
        </button>
      ))}
    </div>
  );
}

interface Item {
  key: string;
  top: number;
  height: number;
  lane: number;
  lanes: number;
  occ?: Occurrence;
  timer?: Timer;
}

/** Placerar block sida vid sida när de överlappar. */
function layout(items: Omit<Item, 'lane' | 'lanes'>[]): Item[] {
  const sorted = [...items].sort((a, b) => a.top - b.top);
  const out: Item[] = [];
  let group: Item[] = [];
  let groupEnd = -Infinity;
  const laneEnds: number[] = [];
  const flush = () => {
    const lanes = Math.max(1, ...group.map((g) => g.lane + 1));
    for (const g of group) g.lanes = lanes;
    group = [];
    laneEnds.length = 0;
  };
  for (const it of sorted) {
    if (it.top >= groupEnd) flush();
    let lane = laneEnds.findIndex((e) => e <= it.top);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = it.top + it.height;
    const item: Item = { ...it, lane, lanes: 1 };
    group.push(item);
    out.push(item);
    groupEnd = Math.max(groupEnd, it.top + it.height);
  }
  flush();
  return out;
}

/** Tidspelarvy (handbok 4.1.1): en prick per kvart, röd linje för nu. */
function Timeline({
  date,
  occurrences,
  timers,
  now,
  settings,
  onOpen,
}: {
  date: YMD;
  occurrences: Occurrence[];
  timers: Timer[];
  now: number;
  settings: Settings;
  onOpen: (o: Occurrence) => void;
}) {
  const nav = useNav();
  const rowH = settings.zoom === 'large' ? 30 : 20;
  const hourH = rowH * 4;
  const t = today();
  const isToday = date === t;
  const nowMin = minutesOfDayAt(now, TZ);
  const scrollRef = useRef<HTMLDivElement>(null);
  const px = (min: number) => (min / 15) * rowH;
  const minCard = settings.zoom === 'large' ? 64 : 52;

  const dayTimers = timers.filter((x) => ymdAt(x.startAt, TZ) === date);
  const items = layout([
    ...occurrences
      .filter((o) => o.startAt !== undefined)
      .map((o) => ({
        key: o.activity.id,
        top: px(minutesOfDayAt(o.startAt!, TZ)),
        height: Math.max(px(o.endAt ? (o.endAt - o.startAt!) / 60000 : 30), minCard),
        occ: o,
      })),
    ...dayTimers.map((x) => ({ key: `t${x.id}`, top: px(minutesOfDayAt(x.startAt, TZ)), height: Math.max(px(x.minutes), minCard), timer: x })),
  ]);

  // Visa aktuell tid (idag) eller första aktiviteten när dagen byts.
  const firstTop = items.length ? Math.min(...items.map((i) => i.top)) : px(7 * 60);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, isToday ? px(nowMin) - el.clientHeight * 0.3 : firstTop - 16);
  }, [date, rowH]);

  const beforeToday = date < t;
  const afterNow = (min: number) => (isToday ? min > nowMin : !beforeToday);
  // Tidigare samma dag kan döljas (handbok 5.2.1 Bläddra bakåt samma dag).
  const minTop = isToday && !settings.browseBackSameDay ? px(Math.floor(nowMin / 60) * 60) : 0;

  return (
    <div className="day-body">
      <FullDayStrip occurrences={occurrences} settings={settings} onOpen={onOpen} />
      <div className="timeline-scroll" ref={scrollRef}>
        <div className="timeline" style={{ height: hourH * 24 - minTop, ['--row' as string]: `${rowH}px` }}>
          <div className="tl-inner" style={{ transform: `translateY(${-minTop}px)` }}>
            {settings.showQuarterDots && (
              <div className="tl-dots">
                {Array.from({ length: 96 }, (_, i) => (
                  <span key={i} className={`tl-dot ${afterNow((i + 1) * 15) ? 'on' : ''}`} />
                ))}
              </div>
            )}
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="tl-hour" style={{ top: h * hourH }}>
                <span className="tl-label">{pad2(h)}:00</span>
              </div>
            ))}
            <div className="tl-lanes">
              {items.map((it) => {
                const style = {
                  top: it.top,
                  height: it.height,
                  left: `calc(${(it.lane / it.lanes) * 100}% + 2px)`,
                  width: `calc(${100 / it.lanes}% - 4px)`,
                };
                if (it.occ) {
                  const o = it.occ;
                  const end = o.endAt ?? o.startAt! + 30 * 60000;
                  return (
                    <button
                      key={it.key}
                      className={`tl-card ${end < now ? 'past' : ''}`}
                      style={{ ...style, borderLeftColor: o.activity.category ? CATEGORY_COLORS[o.activity.category] : undefined }}
                      onClick={() => onOpen(o)}
                    >
                      {o.activity.image && <Picture image={o.activity.image} alt="" className="tc-img" />}
                      <span className="tc-text">
                        {settings.showActivityTime && <span className="tc-time">{timeRange(o.activity).replace('–', ' - ')}</span>}
                        {(settings.showActivityText || !o.activity.image) && <span className="tc-title">{o.activity.title}</span>}
                      </span>
                      {o.signedOff && <Signed />}
                    </button>
                  );
                }
                const x = it.timer!;
                const done = timerEnd(x) <= now;
                return (
                  <button key={it.key} className={`tl-card timer ${done ? 'past' : ''}`} style={style} onClick={() => nav.push({ name: 'timer', id: x.id })}>
                    {x.image && <Picture image={x.image} alt="" className="tc-img" />}
                    <span className="tc-text">
                      <span className="tc-time">{done ? 'Klar' : `Timer · ${Math.ceil((timerEnd(x) - now) / 60000)} min kvar`}</span>
                      <span className="tc-title">{x.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {isToday && <div className="tl-now" style={{ top: px(nowMin) }} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Listvy (handbok 4.1.2): passerade aktiviteter är dolda. */
function DayList({
  date,
  occurrences,
  timers,
  now,
  settings,
  onOpen,
}: {
  date: YMD;
  occurrences: Occurrence[];
  timers: Timer[];
  now: number;
  settings: Settings;
  onOpen: (o: Occurrence) => void;
}) {
  const nav = useNav();
  const [showPast, setShowPast] = useState(false);
  const timed = occurrences.filter((o) => o.startAt !== undefined);
  const isPast = (o: Occurrence) => (o.endAt ?? o.startAt! + 30 * 60000) < now;
  const past = date === today() ? timed.filter(isPast) : [];
  const shown = showPast ? timed : timed.filter((o) => !past.includes(o));
  const dayTimers = timers.filter((x) => ymdAt(x.startAt, TZ) === date && timerEnd(x) > now);
  return (
    <div className="day-body">
      <FullDayStrip occurrences={occurrences} settings={settings} onOpen={onOpen} />
      <div className="day-list">
        {past.length > 0 && (
          <button className="show-past" onClick={() => setShowPast(!showPast)}>
            <Icon name={showPast ? 'up' : 'down'} size={18} /> {showPast ? 'Dölj passerade' : `Visa passerade (${past.length})`}
          </button>
        )}
        {dayTimers.map((x) => (
          <button key={x.id} className="dl-row" onClick={() => nav.push({ name: 'timer', id: x.id })}>
            <span className="dl-img">{x.image && <Picture image={x.image} alt="" />}</span>
            <span className="dl-text">
              <small>Timer · {Math.ceil((timerEnd(x) - now) / 60000)} min kvar</small>
              <strong>{x.title}</strong>
            </span>
            <Icon name="right" size={20} />
          </button>
        ))}
        {shown.map((o) => (
          <ActivityRow key={o.activity.id} occ={o} settings={settings} onOpen={() => onOpen(o)} past={isPast(o)} />
        ))}
      </div>
    </div>
  );
}

export function ActivityRow({ occ: o, settings, onOpen, past }: { occ: Occurrence; settings: Settings; onOpen: () => void; past?: boolean }) {
  return (
    <button
      className={`dl-row ${past ? 'past' : ''}`}
      onClick={onOpen}
      style={o.activity.category ? { boxShadow: `inset 6px 0 0 ${CATEGORY_COLORS[o.activity.category]}` } : undefined}
    >
      <span className="dl-img">
        {o.activity.image && <Picture image={o.activity.image} alt="" />}
        {o.signedOff && <Signed />}
      </span>
      <span className="dl-text">
        {settings.showActivityTime && <small>{timeRange(o.activity).replace('–', ' - ')}</small>}
        <strong>{o.activity.title}</strong>
      </span>
      <Icon name="right" size={20} />
    </button>
  );
}

/** Veckovy (handbok 4.1.3). */
function WeekView({ date, settings, onPickDay }: { date: YMD; settings: Settings; onPickDay: (d: YMD) => void }) {
  const nav = useNav();
  const activities = useActivities() ?? [];
  const [hourView, setHourView] = useState(false);
  const monday = startOfWeek(date);
  const t = today();
  const days = Array.from({ length: settings.weekDays }, (_, i) => addDays(monday, i));
  const last = days[days.length - 1];
  const fmt = (d: YMD) => `${parseYMD(d).d} ${MONTHS_SV[parseYMD(d).m - 1].slice(0, 3)}`;
  return (
    <div className="week-view">
      <div className="wv-band">
        <span>Vecka {isoWeek(monday)}</span>
        <span>
          {fmt(monday)} - {fmt(last)} {parseYMD(last).y}
        </span>
        {settings.weekHourViewButton && (
          <button className="wv-hour-btn" onClick={() => setHourView(!hourView)}>
            {hourView ? 'Aktiviteter' : 'Timvy'}
          </button>
        )}
      </div>
      <div className="wv-grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
        {days.map((d) => {
          const { bg, fg } = dayColors(d, settings);
          const holiday = settings.holidays ? holidayOn(d) : undefined;
          const occ = occurrencesOn(activities, d).filter((o) => settings.weekShowRecurring || !o.activity.recurrence);
          return (
            <div key={d} className={`wv-col ${d === t ? 'today' : ''} ${d < t ? 'past' : ''}`}>
              <button
                className="wv-head"
                style={{ background: bg, color: fg }}
                onClick={() => onPickDay(d)}
                title={holiday?.name}
              >
                <span className={d === t ? 'wv-today-num' : ''}>{parseYMD(d).d}</span>
                <span>{WEEKDAYS_SHORT_SV[isoWeekday(d) - 1].toUpperCase()}</span>
              </button>
              {hourView ? (
                <div className="wv-hours">
                  {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => {
                    const busy = occ.some((o) => {
                      if (o.startAt === undefined) return false;
                      const s = minutesOfDayAt(o.startAt, TZ);
                      const e = o.endAt ? minutesOfDayAt(o.endAt, TZ) : s + 30;
                      return s < (h + 1) * 60 && e > h * 60;
                    });
                    return <span key={h} className={`wv-hour ${busy ? 'busy' : ''}`} title={`${pad2(h)}:00`} />;
                  })}
                </div>
              ) : (
                <div className="wv-items">
                  {occ.map((o) => (
                    <button key={o.activity.id} className="wv-item" onClick={() => nav.push({ name: 'activity', id: o.activity.id, date: d })}>
                      {settings.weekDisplay === 'image' && o.activity.image ? (
                        <Picture image={o.activity.image} alt={o.activity.title} />
                      ) : (
                        <span className="wv-time">{o.activity.start ?? 'Heldag'}</span>
                      )}
                      {o.signedOff && <Signed />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Månadsvy (handbok 4.1.4). */
function MonthView({ date, settings, now }: { date: YMD; settings: Settings; now: number }) {
  const nav = useNav();
  const activities = useActivities() ?? [];
  const t = today();
  const { y, m } = parseYMD(date);
  const first = toYMD(y, m, 1);
  const cells: (YMD | null)[] = [
    ...Array.from({ length: isoWeekday(first) - 1 }, () => null),
    ...Array.from({ length: daysInMonth(y, m) }, (_, i) => addDays(first, i)),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const selected = date;
  const selectedOcc = occurrencesOn(activities, selected);
  const { d: sd, m: sm } = parseYMD(selected);
  const wd = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'][isoWeekday(selected) - 1];
  return (
    <div className="month-view">
      <div className="mv-title">
        {MONTHS_SV[m - 1].charAt(0).toUpperCase() + MONTHS_SV[m - 1].slice(1)} {y}
      </div>
      <table className="mv-table">
        <thead>
          <tr>
            <th />
            {WEEKDAYS_SHORT_SV.map((w) => (
              <th key={w}>{w.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((w, i) => (
            <tr key={i}>
              <td className="mv-week">{isoWeek(w.find(Boolean)!)}</td>
              {w.map((d, j) => {
                if (!d) return <td key={j} />;
                const { bg, fg } = dayColors(d, settings);
                const marked = occurrencesOn(activities, d).some((o) => settings.monthMarkRecurring || !o.activity.recurrence);
                const holiday = settings.holidays ? holidayOn(d) : undefined;
                return (
                  <td key={j}>
                    <button
                      className={`mv-day ${d < t ? 'past' : ''} ${d === selected ? 'selected' : ''}`}
                      style={{ background: bg, color: holiday?.red && !settings.weekdayColors ? '#d8262c' : fg }}
                      onClick={() => nav.setDay(d)}
                    >
                      <span className={d === t ? 'mv-today' : ''}>{parseYMD(d).d}</span>
                      {marked && <span className="mv-mark" />}
                      {holiday && settings.weekdayColors && <span className="mv-holiday" />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mv-selected">
        <div className="mv-sel-title">
          {wd} {sd}:e {MONTHS_SV[sm - 1]}
          {settings.holidays && holidayOn(selected) ? ` · ${holidayOn(selected)!.name}` : ''}
        </div>
        {selectedOcc.map((o) => (
          <ActivityRow
            key={o.activity.id}
            occ={o}
            settings={settings}
            past={(o.endAt ?? (o.startAt ?? Infinity) + 30 * 60000) < now}
            onOpen={() => nav.push({ name: 'activity', id: o.activity.id, date: selected })}
          />
        ))}
      </div>
    </div>
  );
}
