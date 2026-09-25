import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Activity, YMD } from '../domain/index.ts';
import {
  deleteActivity,
  minutesLabel,
  occurrence,
  startTimer,
  timeRange,
  toggleChecklistItem,
  toggleSignOff,
  type Scope,
} from '../activities.ts';
import { BottomBar, ConfirmPage, ListRow, OkButton, Page, RoundButton, TitleBar, BackButton } from '../components/handi.tsx';
import { CheckableIcon, Icon } from '../components/Icon.tsx';
import { Picture } from '../components/Picture.tsx';
import { QuarterDots } from '../components/QuarterDots.tsx';
import { db } from '../db.ts';
import { useNow } from '../hooks.ts';
import { useNav } from '../nav.tsx';
import type { Settings } from '../settings.ts';

/** Rubriken i aktivitetsvyn: liten bild, tid och namn. */
export function ActivityHeader({ image, time, title, badges }: { image?: string; time: string; title: string; badges?: React.ReactNode }) {
  return (
    <header className="act-header">
      {image && <Picture image={image} alt="" className="ah-img" />}
      <span className="ah-text">
        <small>{time}</small>
        <strong>{title}</strong>
      </span>
      {badges && <span className="ah-badges">{badges}</span>}
    </header>
  );
}

export function ActivityScreen({ id, date, settings }: { id: string; date: YMD; settings: Settings }) {
  const nav = useNav();
  const now = useNow(1000);
  const a = useLiveQuery(async () => (await db.activities.get(id)) ?? null, [id]);
  const [page, setPage] = useState<'view' | 'signOff' | 'delete' | 'image'>('view');

  if (a === undefined) return <div className="page" />;
  if (a === null) {
    return (
      <Page>
        <TitleBar title="Aktivitet" />
        <p className="empty">Aktiviteten finns inte längre.</p>
        <BottomBar left={<BackButton onClick={nav.back} />} />
      </Page>
    );
  }
  const o = occurrence(a, date);

  if (page === 'signOff') {
    return (
      <ConfirmPage
        title="Klar?"
        onYes={async () => {
          if (!o.signedOff) await toggleSignOff(a, date);
          setPage('view');
        }}
        onNo={async () => {
          if (o.signedOff) await toggleSignOff(a, date);
          setPage('view');
        }}
      >
        <div className="cp-activity">
          {a.image && <Picture image={a.image} alt="" />}
          <strong>{a.title}</strong>
        </div>
      </ConfirmPage>
    );
  }

  if (page === 'delete') {
    return <DeletePage activity={a} date={date} onDone={nav.back} onCancel={() => setPage('view')} />;
  }

  // Nedräkning till start, eller till slut när aktiviteten pågår.
  let remaining = 0;
  if (o.startAt !== undefined) {
    if (now < o.startAt) remaining = o.startAt - now;
    else if (o.endAt !== undefined && now < o.endAt) remaining = o.endAt - now;
  }
  const showDots = settings.quarterView && o.startAt !== undefined;
  const info = a.info;
  const fullWidthInfo = info?.type === 'checklist';
  const checked = new Set(a.checked?.[date] ?? []);

  const content = (() => {
    if (!info) return a.image ? <ImageCard image={a.image} onOpen={() => setPage('image')} /> : null;
    switch (info.type) {
      case 'note':
        return <div className="note-card">{info.text}</div>;
      case 'image':
        return <ImageCard image={info.image} onOpen={() => setPage('image')} />;
      case 'timer':
        return (
          <button
            className="action-card"
            onClick={async () => {
              const tid = await startTimer(a.title, info.minutes, a.image);
              nav.push({ name: 'timer', id: tid });
            }}
          >
            <Icon name="play" size={44} />
            <span>Starta timer</span>
            <small>{minutesLabel(info.minutes)}</small>
          </button>
        );
      case 'link':
        return (
          <a className="action-card" href={info.url} target="_blank" rel="noreferrer">
            <span className="ac-emoji">🌐</span>
            <span>{info.url.replace(/^https?:\/\//, '')}</span>
          </a>
        );
      case 'address':
        return (
          <a className="action-card" href={`https://maps.apple.com/?q=${encodeURIComponent(info.address)}`} target="_blank" rel="noreferrer">
            <span className="ac-emoji">📍</span>
            <span>{info.address}</span>
          </a>
        );
      case 'phone':
        return (
          <a className="action-card" href={`tel:${info.number}`}>
            <span className="ac-emoji">📞</span>
            <span>{info.number}</span>
          </a>
        );
      case 'sms':
        return (
          <a className="action-card" href={`sms:${info.number}`}>
            <span className="ac-emoji">💬</span>
            <span>{info.number}</span>
          </a>
        );
      case 'checklist':
        return (
          <ul className="checklist">
            {info.items.map((it) => (
              <li key={it.id}>
                <button className="cl-row" onClick={() => toggleChecklistItem(a, date, it.id)} aria-pressed={checked.has(it.id)}>
                  <span className="cl-box">{checked.has(it.id) && <Icon name="check" size={30} stroke={3.4} />}</span>
                  {it.image && <Picture image={it.image} alt="" className="cl-img" />}
                  <span className="cl-text">{it.text}</span>
                </button>
              </li>
            ))}
          </ul>
        );
    }
  })();

  return (
    <Page className="activity-screen">
      <ActivityHeader
        image={a.image}
        time={timeRange(a).replace('–', ' - ')}
        title={a.title}
        badges={
          <>
            {info && <span className="badge-i">i</span>}
            {a.checkable && (
              <span className={`badge-check ${o.signedOff ? 'done' : ''}`}>
                <Icon name="check" size={16} stroke={3.2} />
              </span>
            )}
            {a.recurrence && <Icon name="repeat" size={16} />}
          </>
        }
      />
      <div className={`act-body ${fullWidthInfo ? 'full' : ''}`}>
        {showDots && !fullWidthInfo && (
          <QuarterDots remainingMs={remaining} lastAsFive={settings.lastQuarterAsFive} digital={settings.digitalCountdown} />
        )}
        <div className="act-content">
          {content}
          {o.signedOff && !fullWidthInfo && (
            <div className="signed-banner">
              <Icon name="check" size={28} stroke={3.4} /> Klar
            </div>
          )}
        </div>
      </div>
      <BottomBar
        left={
          a.checkable ? (
            <button className="bar-icon-btn" onClick={() => setPage('signOff')} aria-label="Kvittera">
              <CheckableIcon on />
            </button>
          ) : undefined
        }
        center={
          <>
            {settings.showDeleteButton && <RoundButton onClick={() => setPage('delete')} label="Ta bort" icon="trash" />}
            {settings.showEditButton && <RoundButton onClick={() => nav.push({ name: 'edit', id: a.id, date })} label="Ändra" icon="edit" />}
          </>
        }
        right={<OkButton onClick={nav.back} />}
      />
      {page === 'image' && (
        <button className="fullscreen-image" onClick={() => setPage('view')} aria-label="Stäng bilden">
          <Picture image={info?.type === 'image' ? info.image : a.image} alt={a.title} />
        </button>
      )}
    </Page>
  );
}

function ImageCard({ image, onOpen }: { image: string; onOpen: () => void }) {
  return (
    <button className="image-card" onClick={onOpen} aria-label="Visa bilden i helskärm">
      <Picture image={image} alt="" />
    </button>
  );
}

/** Ta bort aktivitet (handbok 4.8): återkommande får välja vilka dagar. */
function DeletePage({ activity: a, date, onDone, onCancel }: { activity: Activity; date: YMD; onDone: () => void; onCancel: () => void }) {
  const del = async (scope: Scope) => {
    await deleteActivity(a, scope, date);
    onDone();
  };
  if (!a.recurrence) {
    return (
      <ConfirmPage title="Ta bort aktiviteten?" yes="OK" no="AVBRYT" onYes={() => del('all')} onNo={onCancel}>
        <div className="cp-activity">
          {a.image && <Picture image={a.image} alt="" />}
          <strong>{a.title}</strong>
        </div>
      </ConfirmPage>
    );
  }
  return (
    <Page>
      <TitleBar title="Ta bort återkommande aktivitet" />
      <div className="list centered">
        <ListRow label="Endast denna dag" onClick={() => del('thisDay')} />
        <ListRow label="Denna dag och framåt" onClick={() => del('forward')} />
        <ListRow label="Alla dagar" onClick={() => del('all')} />
      </div>
      <BottomBar left={<BackButton onClick={onCancel} />} />
    </Page>
  );
}
