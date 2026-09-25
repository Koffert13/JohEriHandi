import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { minutesLabel } from '../activities.ts';
import { BackButton, BottomBar, ConfirmPage, ListRow, Page } from '../components/handi.tsx';
import { Icon } from '../components/Icon.tsx';
import { Picture } from '../components/Picture.tsx';
import { ImagePickPage, NamePage, TimerTimePage } from '../components/pickers.tsx';
import { db, uid, type BaseActivity, type BaseTimer } from '../db.ts';
import { today } from '../hooks.ts';
import { useNav } from '../nav.tsx';
import type { Settings } from '../settings.ts';
import { EditFlow, emptyActivity } from './EditFlow.tsx';

/** Blå verktygsrad med Ny, Ta bort och Ändra (handbok 5.14). */
function Toolbar({ onNew, onDelete, onEdit, hasSelection }: { onNew: () => void; onDelete: () => void; onEdit: () => void; hasSelection: boolean }) {
  return (
    <div className="toolbar">
      <button onClick={onNew} aria-label="Ny">
        <Icon name="plus" size={28} stroke={3} />
      </button>
      <button onClick={onDelete} disabled={!hasSelection} aria-label="Ta bort">
        <Icon name="trash" size={26} />
      </button>
      <button onClick={onEdit} disabled={!hasSelection} aria-label="Ändra">
        <Icon name="edit" size={26} />
      </button>
    </div>
  );
}

export function BaseActivitiesScreen({ settings }: { settings: Settings }) {
  const nav = useNav();
  const list = useLiveQuery(() => db.baseActivities.toArray());
  const [selected, setSelected] = useState<string>();
  const [editing, setEditing] = useState<BaseActivity | 'new'>();
  const [confirm, setConfirm] = useState(false);
  const sel = list?.find((b) => b.id === selected);

  if (editing) {
    const b = editing === 'new' ? undefined : editing;
    const initial = b
      ? { ...emptyActivity(today()), ...b, id: b.id }
      : { ...emptyActivity(today()), id: uid() };
    return (
      <EditFlow
        mode="base"
        initial={initial}
        isNew={!b}
        occurrenceDate={today()}
        settings={{ ...settings, addMethod: 'edit', editChooseType: false, editBaseButton: false }}
        onDone={() => setEditing(undefined)}
      />
    );
  }
  if (confirm && sel) {
    return (
      <ConfirmPage
        title="Ta bort basaktiviteten?"
        onNo={() => setConfirm(false)}
        onYes={async () => {
          await db.baseActivities.delete(sel.id);
          setConfirm(false);
          setSelected(undefined);
        }}
      >
        <div className="cp-activity">
          {sel.image && <Picture image={sel.image} alt="" />}
          <strong>{sel.title}</strong>
        </div>
      </ConfirmPage>
    );
  }
  return (
    <Page>
      <Toolbar hasSelection={!!sel} onNew={() => setEditing('new')} onDelete={() => setConfirm(true)} onEdit={() => sel && setEditing(sel)} />
      <div className="list">
        {list
          ?.sort((x, y) => x.title.localeCompare(y.title, 'sv'))
          .map((b) => (
            <ListRow
              key={b.id}
              icon={b.image ? <Picture image={b.image} alt="" /> : undefined}
              label={b.title}
              sub={b.fullDay ? 'Heldag' : [b.start, b.end].filter(Boolean).join(' - ')}
              selected={b.id === selected}
              onClick={() => setSelected(b.id === selected ? undefined : b.id)}
            />
          ))}
        {list?.length === 0 && <p className="empty">Inga basaktiviteter. Tryck på + för att skapa en.</p>}
      </div>
      <BottomBar left={<BackButton onClick={nav.back} />} />
    </Page>
  );
}

export function BaseTimersScreen({ settings }: { settings: Settings }) {
  const nav = useNav();
  const list = useLiveQuery(() => db.baseTimers.toArray());
  const [selected, setSelected] = useState<string>();
  const [editing, setEditing] = useState<{ timer: BaseTimer; step: 'time' | 'image' | 'name' }>();
  const [confirm, setConfirm] = useState(false);
  const sel = list?.find((b) => b.id === selected);

  if (editing) {
    const t = editing.timer;
    const update = (p: Partial<BaseTimer>, step?: 'time' | 'image' | 'name') => {
      const timer = { ...t, ...p };
      if (step) setEditing({ timer, step });
      else {
        db.baseTimers.put({ ...timer, title: timer.title.trim() || minutesLabel(timer.minutes) });
        setEditing(undefined);
      }
    };
    if (editing.step === 'time') {
      return <TimerTimePage mode={settings.timerInput} initial={t.minutes} onBack={() => setEditing(undefined)} onOk={(minutes) => update({ minutes }, 'image')} />;
    }
    if (editing.step === 'image') {
      return (
        <ImagePickPage
          value={t.image}
          onBack={() => setEditing({ timer: t, step: 'time' })}
          onOk={(image, name) => update({ image, title: t.title || name || '' }, 'name')}
        />
      );
    }
    return <NamePage title="Namnge bastimern" value={t.title} onCancel={() => setEditing({ timer: t, step: 'image' })} onOk={(title) => update({ title })} />;
  }
  if (confirm && sel) {
    return (
      <ConfirmPage
        title="Ta bort bastimern?"
        onNo={() => setConfirm(false)}
        onYes={async () => {
          await db.baseTimers.delete(sel.id);
          setConfirm(false);
          setSelected(undefined);
        }}
      >
        <div className="cp-activity">
          {sel.image && <Picture image={sel.image} alt="" />}
          <strong>{sel.title}</strong>
        </div>
      </ConfirmPage>
    );
  }
  return (
    <Page>
      <Toolbar
        hasSelection={!!sel}
        onNew={() => setEditing({ timer: { id: uid(), title: '', minutes: 10 }, step: 'time' })}
        onDelete={() => setConfirm(true)}
        onEdit={() => sel && setEditing({ timer: sel, step: 'time' })}
      />
      <div className="list">
        {list
          ?.sort((x, y) => x.minutes - y.minutes)
          .map((b) => (
            <ListRow
              key={b.id}
              icon={b.image ? <Picture image={b.image} alt="" /> : undefined}
              label={b.title}
              sub={minutesLabel(b.minutes)}
              selected={b.id === selected}
              onClick={() => setSelected(b.id === selected ? undefined : b.id)}
            />
          ))}
        {list?.length === 0 && <p className="empty">Inga bastimers. Tryck på + för att skapa en.</p>}
      </div>
      <BottomBar left={<BackButton onClick={nav.back} />} />
    </Page>
  );
}
