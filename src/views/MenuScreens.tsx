import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  hmAt,
  minutesOfDayAt,
  occursOn,
  partOfDay,
  ymdAt,
  addDays,
  type Activity,
  type PartOfDay,
  type YMD,
} from '../domain/index.ts';
import { minutesLabel, startTimer, timeRange, timerEnd, useActivities } from '../activities.ts';
import { DateBar } from '../components/DateBar.tsx';
import { BackButton, BottomBar, ListRow, OkButton, Page, RoundButton, TitleBar } from '../components/handi.tsx';
import { ColorIcon, Icon, type MenuIconName } from '../components/Icon.tsx';
import { AnalogClock } from '../components/AnalogClock.tsx';
import { Picture } from '../components/Picture.tsx';
import { QuarterDots } from '../components/QuarterDots.tsx';
import { ImagePickPage, NamePage, TimerTimePage } from '../components/pickers.tsx';
import { db } from '../db.ts';
import { TZ, today, useNow } from '../hooks.ts';
import { useNav, type Screen } from '../nav.tsx';
import type { MenuItem, Settings } from '../settings.ts';
import { ActivityHeader } from './ActivityScreen.tsx';

/** Kalendermenyn (handbok 4.1.5). */
export function MenuScreen({ settings }: { settings: Settings }) {
  const nav = useNav();
  const items: { key: MenuItem | 'settings'; icon: MenuIconName; label: string; screen: Screen }[] = [
    { key: 'addActivity', icon: 'addActivity', label: 'Lägga in aktivitet', screen: { name: 'edit', date: nav.day } },
    { key: 'startTimer', icon: 'startTimer', label: 'Starta timer', screen: { name: 'timerStart' } },
    { key: 'clock', icon: 'clock', label: 'Klocka', screen: { name: 'clock' } },
    { key: 'search', icon: 'search', label: 'Sök aktivitet', screen: { name: 'search' } },
    { key: 'baseActivities', icon: 'baseActivities', label: 'Basaktiviteter', screen: { name: 'baseActivities' } },
    { key: 'baseTimers', icon: 'baseTimers', label: 'Bastimers', screen: { name: 'baseTimers' } },
    { key: 'settings', icon: 'settings', label: 'Inställningar', screen: { name: 'settings' } },
  ];
  return (
    <Page className="menu-screen">
      <TitleBar title="Kalendermenyn" icon={<MenuListIcon />} />
      <div className="list menu-list">
        {items
          .filter((i) => i.key === 'settings' || settings.calendarMenu[i.key])
          .map((i) => (
            <ListRow key={i.key} icon={<ColorIcon name={i.icon} />} label={i.label} onClick={() => nav.push(i.screen)} />
          ))}
      </div>
      <BottomBar left={<BackButton onClick={nav.back} />} />
    </Page>
  );
}

function MenuListIcon() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" aria-hidden="true">
      <rect x="2" y="1" width="26" height="32" rx="2" fill="#e8eef7" stroke="#fff" strokeWidth="1.5" />
      {[7, 14, 21, 28].map((y) => (
        <rect key={y} x="6" y={y - 2.5} width="18" height="4" rx="1" fill="#4a79b8" />
      ))}
    </svg>
  );
}

const PART_ORDER: PartOfDay[] = ['morning', 'day', 'evening', 'night'];

function PartIcon({ part }: { part: PartOfDay }) {
  const c = '#fff';
  return (
    <svg viewBox="0 0 60 50" width="60" height="50" aria-hidden="true">
      {part === 'day' && (
        <>
          <circle cx="30" cy="25" r="10" fill="none" stroke={c} strokeWidth="4" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="30" y1="6" x2="30" y2="11" stroke={c} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${i * 30} 30 25)`} />
          ))}
        </>
      )}
      {(part === 'morning' || part === 'evening') && (
        <>
          <path d="M14 36a16 16 0 0132 0z" fill={c} />
          {[-60, -30, 0, 30, 60].map((r) => (
            <line key={r} x1="30" y1="10" x2="30" y2="15" stroke={c} strokeWidth="3" strokeLinecap="round" transform={`rotate(${r} 30 36)`} />
          ))}
          <line x1="6" y1="40" x2="54" y2="40" stroke={c} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {part === 'night' && (
        <>
          <path d="M34 8a17 17 0 1 0 12 30A15 15 0 0 1 34 8z" fill={c} />
          <path d="M46 10l1.5 3.5L51 15l-3.5 1.5L46 20l-1.5-3.5L41 15l3.5-1.5z" fill={c} />
        </>
      )}
    </svg>
  );
}

/** Klockvyn (handbok 4.10): datum, klocka och del av dygnet. */
export function ClockScreen({ settings }: { settings: Settings }) {
  const nav = useNav();
  const now = useNow(5000);
  const date = ymdAt(now, TZ);
  const part = partOfDay(minutesOfDayAt(now, TZ));
  const showAnalog = settings.clockType !== 'digital';
  const showDigital = settings.clockType !== 'analog';
  return (
    <Page className="clock-screen">
      {settings.clockShowDate && <DateBar date={date} now={now} settings={settings} showButton={false} />}
      <div className="cs-body">
        {showDigital && <div className={`cs-digital ${showAnalog ? '' : 'big'}`}>{hmAt(now, TZ)}</div>}
        {showAnalog && <AnalogClock now={now} size={290} variant="navy" />}
      </div>
      {settings.clockShowPartOfDay && (
        <div className="cs-parts">
          {PART_ORDER.map((p) => (
            <span key={p} className={`cs-part part-${p} ${p === part ? 'on' : ''}`}>
              <PartIcon part={p} />
            </span>
          ))}
        </div>
      )}
      <BottomBar left={<BackButton onClick={nav.back} />} />
    </Page>
  );
}

/** Starta timer (handbok 4.6): bastimer → tid → bild → namn. */
export function TimerStartFlow({ settings }: { settings: Settings }) {
  const nav = useNav();
  const bases = useLiveQuery(() => db.baseTimers.toArray());
  const steps = [
    ...(settings.timerChooseBase ? (['base'] as const) : []),
    'time' as const,
    ...(settings.timerChooseImage ? (['image'] as const) : []),
    ...(settings.timerName ? (['name'] as const) : []),
  ];
  const [i, setI] = useState(0);
  const [minutes, setMinutes] = useState(10);
  const [image, setImage] = useState<string>();
  const [title, setTitle] = useState('');
  const step = steps[i];

  const start = async (t: string, m: number, img?: string) => {
    const id = await startTimer(t, m, img);
    nav.home({ name: 'timer', id });
  };
  const next = (t = title, m = minutes, img = image) => {
    if (i + 1 >= steps.length) start(t, m, img);
    else setI(i + 1);
  };
  const back = () => (i === 0 ? nav.back() : setI(i - 1));

  if (step === 'base') {
    return (
      <Page>
        <TitleBar title="Välj bastimer" icon={<ColorIcon name="startTimer" size={30} />} />
        <div className="list">
          <ListRow icon={<span className="no-base">⊘</span>} label="Ingen bastimer" onClick={() => next()} />
          {bases
            ?.sort((x, y) => x.minutes - y.minutes)
            .map((b) => (
              <ListRow
                key={b.id}
                icon={b.image ? <Picture image={b.image} alt="" /> : <span className="timer-dot" style={{ background: timerColor(b.minutes) }} />}
                label={b.title}
                sub={minutesLabel(b.minutes)}
                onClick={() => start(b.title, b.minutes, b.image)}
              />
            ))}
        </div>
        <BottomBar left={<BackButton onClick={back} />} />
      </Page>
    );
  }
  if (step === 'time') {
    return (
      <TimerTimePage
        mode={settings.timerInput}
        initial={minutes}
        onBack={back}
        onOk={(m) => {
          setMinutes(m);
          next(title, m);
        }}
      />
    );
  }
  if (step === 'image') {
    return (
      <ImagePickPage
        value={image}
        onBack={back}
        onOk={(img, name) => {
          setImage(img);
          const t = title || name || '';
          setTitle(t);
          next(t, minutes, img);
        }}
      />
    );
  }
  return (
    <NamePage
      title="Namnge timern"
      value={title}
      onCancel={back}
      onOk={(t) => {
        setTitle(t);
        start(t, minutes, image);
      }}
    />
  );
}

function timerColor(min: number): string {
  if (min <= 5) return '#1fa3c4';
  if (min <= 10) return '#e23b3b';
  if (min <= 15) return '#f2c12e';
  return '#35a45a';
}

/** Timer: som aktivitetsvyn, med nedräkning. */
export function TimerScreen({ id, settings }: { id: string; settings: Settings }) {
  const nav = useNav();
  const now = useNow(1000);
  const t = useLiveQuery(async () => (await db.timers.get(id)) ?? null, [id]);
  if (t === undefined) return <div className="page" />;
  if (t === null) {
    return (
      <Page>
        <TitleBar title="Timer" />
        <p className="empty">Timern är borttagen.</p>
        <BottomBar left={<BackButton onClick={nav.back} />} />
      </Page>
    );
  }
  const remaining = timerEnd(t) - now;
  const done = remaining <= 0;
  return (
    <Page className="activity-screen">
      <ActivityHeader image={t.image} time={`Timer ${minutesLabel(t.minutes)}`} title={t.title} />
      <div className="act-body">
        <QuarterDots remainingMs={remaining} lastAsFive={settings.lastQuarterAsFive} digital />
        <div className="act-content">
          {t.image ? (
            <div className="image-card">
              <Picture image={t.image} alt="" />
            </div>
          ) : (
            <div className="image-card">
              <ColorIcon name="startTimer" size={160} />
            </div>
          )}
          {done && (
            <div className="signed-banner">
              <Icon name="check" size={28} stroke={3.4} /> Klar
            </div>
          )}
        </div>
      </div>
      <BottomBar
        center={
          <RoundButton
            onClick={async () => {
              await db.timers.delete(t.id);
              nav.back();
            }}
            label="Ta bort timern"
            icon="trash"
          />
        }
        right={<OkButton onClick={nav.back} />}
      />
    </Page>
  );
}

/** Sök aktivitet (handbok 4.11). */
export function SearchFlow() {
  const nav = useNav();
  const activities = useActivities() ?? [];
  const [query, setQuery] = useState<string>();
  const [showRecurring, setShowRecurring] = useState<boolean>();

  if (query === undefined) {
    return <NamePage title="Ange sökord" value="" onCancel={nav.back} onOk={(q) => (q ? setQuery(q) : nav.back())} />;
  }
  const q = query.toLowerCase();
  const hits = activities.filter((a) => a.title.toLowerCase().includes(q));
  const hasRecurring = hits.some((a) => a.recurrence);
  if (hasRecurring && showRecurring === undefined) {
    return (
      <Page>
        <TitleBar title="Sök aktivitet" />
        <div className="list centered">
          <ListRow label="Visa återkommande" onClick={() => setShowRecurring(true)} />
          <ListRow label="Dölj återkommande" onClick={() => setShowRecurring(false)} />
        </div>
        <BottomBar left={<BackButton onClick={() => setQuery(undefined)} />} />
      </Page>
    );
  }
  const list = hits.filter((a) => showRecurring !== false || !a.recurrence);
  const t = today();
  // För återkommande aktiviteter visas nästa förekomst.
  const dateFor = (a: Activity): YMD => {
    if (!a.recurrence) return a.date;
    for (let d = a.date > t ? a.date : t, i = 0; i < 800; i++, d = addDays(d, 1)) if (occursOn(a, d)) return d;
    return a.date;
  };
  const rows = list.map((a) => ({ a, d: dateFor(a) })).sort((x, y) => x.d.localeCompare(y.d));
  return (
    <Page>
      <TitleBar title="Sök aktivitet" icon={<ColorIcon name="search" size={30} />} />
      <div className="list">
        {rows.map(({ a, d }) => (
          <ListRow
            key={a.id}
            icon={a.image ? <Picture image={a.image} alt="" /> : undefined}
            sub={`${d} ${timeRange(a)}`}
            label={a.title}
            chevron
            onClick={() => nav.push({ name: 'activity', id: a.id, date: d })}
          />
        ))}
        {rows.length === 0 && <p className="empty">Ingen aktivitet hittades.</p>}
      </div>
      <BottomBar left={<BackButton onClick={() => (setQuery(undefined), setShowRecurring(undefined))} />} right={<OkButton onClick={nav.back} />} />
    </Page>
  );
}
