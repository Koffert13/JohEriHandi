import { useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  addDays,
  hmToMinutes,
  isoWeekday,
  minutesToHM,
  parseYMD,
  recurrenceLabel,
  WEEKDAY_COLORS,
  zonedTime,
  type Activity,
  type ActivityInfo,
  type ChecklistItem,
  type YMD,
} from '../domain/index.ts';
import { minutesLabel, saveActivity, type Scope } from '../activities.ts';
import { dateTitle } from '../components/DateBar.tsx';
import { BackButton, BottomBar, CheckRow, GreyButton, ListRow, OkButton, Page, TitleBar } from '../components/handi.tsx';
import { CheckableIcon, ColorIcon, Icon } from '../components/Icon.tsx';
import { Picture } from '../components/Picture.tsx';
import { CategoryPage, ChoicePage, DatePickPage, ImagePickPage, NamePage, TimeEntryPage, TimerTimePage } from '../components/pickers.tsx';
import { db, uid, type BaseActivity } from '../db.ts';
import { TZ, today } from '../hooks.ts';
import { useNav } from '../nav.tsx';
import { CATEGORY_COLORS, INFO_LABELS, type InfoKind, type SequenceStep, type Settings } from '../settings.ts';

type PageName =
  | 'form'
  | 'type'
  | 'pattern'
  | 'weekdays'
  | 'monthdays'
  | 'yeardate'
  | 'endDate'
  | 'date'
  | 'name'
  | 'start'
  | 'end'
  | 'duration'
  | 'image'
  | 'category'
  | 'info'
  | 'infoEdit'
  | 'base'
  | 'scope'
  | 'flags';

export function emptyActivity(date: YMD): Activity {
  return { id: uid(), title: '', date, fullDay: false, checkable: false, removeAfter: false, updatedAt: 0 };
}

export function applyBase(a: Activity, b: BaseActivity): Activity {
  return {
    ...a,
    title: b.title,
    image: b.image,
    fullDay: b.fullDay,
    start: b.start,
    end: b.end,
    checkable: b.checkable,
    category: b.category,
    info: b.info && structuredClone(b.info),
  };
}

const INFO_EMOJI: Record<InfoKind, string> = {
  timer: '⏱️',
  image: '🖼️',
  note: '📝',
  checklist: '✅',
  link: '🌐',
  address: '📍',
  phone: '📞',
  sms: '💬',
};

function infoLabel(info?: ActivityInfo): string {
  if (!info) return 'Ingen info';
  if (info.type === 'timer') return `Timer ${minutesLabel(info.minutes)}`;
  return INFO_LABELS[info.type];
}

/** Skärm för att skapa eller ändra en aktivitet. */
export function EditScreen({ id, date, settings }: { id?: string; date: YMD; settings: Settings }) {
  const nav = useNav();
  const [newId] = useState(uid);
  const loaded = useLiveQuery(async () => (id ? ((await db.activities.get(id)) ?? null) : { ...emptyActivity(date), id: newId }), [id]);
  if (loaded === undefined) return <div className="page" />;
  if (loaded === null) {
    return (
      <Page>
        <TitleBar title="Ändra" />
        <p className="empty">Aktiviteten finns inte längre.</p>
        <BottomBar left={<BackButton onClick={nav.back} />} />
      </Page>
    );
  }
  return (
    <EditFlow
      key={loaded.id}
      mode="activity"
      initial={loaded}
      isNew={!id}
      occurrenceDate={date}
      settings={settings}
      onDone={(savedDate) => {
        if (savedDate && !id) nav.setDay(savedDate);
        nav.back();
      }}
    />
  );
}

export function EditFlow({
  mode,
  initial,
  isNew,
  occurrenceDate,
  settings,
  onDone,
}: {
  mode: 'activity' | 'base';
  initial: Activity;
  isNew: boolean;
  occurrenceDate: YMD;
  settings: Settings;
  onDone: (savedDate?: YMD) => void;
}) {
  const sequenceMode = mode === 'activity' && isNew && settings.addMethod === 'sequence';
  const seqSteps: (SequenceStep | 'start')[] = sequenceMode
    ? [...(['date', 'type', 'base', 'image', 'name', 'info', 'removeAfter', 'category'] as const).filter((s) => settings.sequence[s]), 'start']
    : [];
  if (sequenceMode && settings.sequence.end) seqSteps.push('end');

  const firstPage = (): PageName => {
    if (sequenceMode) return stepPage(seqSteps[0]);
    if (mode === 'activity' && isNew && settings.editChooseType) return 'type';
    return 'form';
  };
  const [a, setA] = useState<Activity>(initial);
  const [page, setPage] = useState<PageName>(firstPage);
  const [seqIndex, setSeqIndex] = useState(0);
  const [infoKind, setInfoKind] = useState<ActivityInfo['type']>();
  const [error, setError] = useState<string>();
  const set = (p: Partial<Activity>) => setA((x) => ({ ...x, ...p }));
  const bases = useLiveQuery(() => db.baseActivities.toArray());

  function stepPage(s: SequenceStep | 'start'): PageName {
    const map: Record<SequenceStep | 'start', PageName> = {
      date: 'date',
      type: 'type',
      base: 'base',
      image: 'image',
      name: 'name',
      info: 'info',
      removeAfter: 'flags',
      checkable: 'flags',
      category: 'category',
      start: 'start',
      end: 'end',
    };
    return map[s];
  }

  /** Nästa sida efter ett steg: i sekvensläge nästa steg, annars tillbaka till formuläret. */
  const next = (from?: PageName, draft: Activity = a) => {
    if (!sequenceMode) {
      setPage('form');
      return;
    }
    let i = seqIndex + 1;
    // Heldag hoppar över tiderna.
    while (i < seqSteps.length && draft.fullDay && (seqSteps[i] === 'start' || seqSteps[i] === 'end')) i++;
    if (from === 'base') i = seqSteps.indexOf('start');
    if (i >= seqSteps.length || i < 0) {
      save('all', draft);
      return;
    }
    setSeqIndex(i);
    setPage(stepPage(seqSteps[i]));
  };
  const prev = () => {
    if (!sequenceMode) {
      if (page === 'form' || (page === 'type' && isNew)) onDone();
      else setPage('form');
      return;
    }
    if (seqIndex === 0) onDone();
    else {
      setSeqIndex(seqIndex - 1);
      setPage(stepPage(seqSteps[seqIndex - 1]));
    }
  };

  const validate = (x: Activity): string | undefined => {
    if (!x.title.trim() && !x.image) return 'En aktivitet måste ha ett namn eller en bild.';
    if (mode === 'activity' && !x.fullDay && !x.start) return 'Ange starttid.';
    if (!x.fullDay && x.start && x.end && hmToMinutes(x.end) <= hmToMinutes(x.start)) return 'Sluttiden måste vara efter starttiden.';
    if (mode === 'activity' && isNew && !settings.allowPastStart && !x.fullDay && x.start && !x.recurrence && zonedTime(x.date, x.start, TZ) < Date.now()) {
      return 'Starttiden har redan passerat.';
    }
    return undefined;
  };

  async function save(scope: Scope = 'all', draft: Activity = a) {
    const err = validate(draft);
    if (err) {
      setError(err);
      if (sequenceMode) setPage('form');
      return;
    }
    const clean: Activity = {
      ...draft,
      title: draft.title.trim(),
      start: draft.fullDay ? undefined : draft.start,
      end: draft.fullDay ? undefined : draft.end,
    };
    if (mode === 'base') {
      await db.baseActivities.put({
        id: clean.id,
        title: clean.title,
        image: clean.image,
        fullDay: clean.fullDay,
        start: clean.start,
        end: clean.end,
        checkable: clean.checkable,
        category: clean.category,
        info: clean.info,
      });
      onDone();
      return;
    }
    await saveActivity(clean, scope, occurrenceDate);
    onDone(clean.date);
  }

  const onOk = () => {
    const err = validate(a);
    if (err) return setError(err);
    if (!isNew && initial.recurrence) setPage('scope');
    else save();
  };

  // ---- Sidor ----
  if (page === 'type') {
    return (
      <ChoicePage
        title="Välj typ av aktivitet"
        value={a.recurrence ? 'recurring' : a.fullDay ? 'fullDay' : 'single'}
        options={[
          { value: 'single', label: 'Enstaka' },
          { value: 'fullDay', label: 'Heldag' },
          { value: 'recurring', label: 'Återkommande' },
        ]}
        onPick={(v) => {
          if (v === 'recurring') {
            set({ fullDay: false, removeAfter: true });
            setPage('pattern');
            return;
          }
          const draft = { ...a, fullDay: v === 'fullDay', recurrence: undefined };
          setA(draft);
          next('type', draft);
        }}
        onBack={prev}
      />
    );
  }

  if (page === 'pattern') {
    const cur = a.recurrence?.type;
    return (
      <ChoicePage
        title="Välj dagar"
        value={cur}
        options={[
          { value: 'weekly', label: 'Veckovis', icon: <span className="pattern-icon">7</span> },
          { value: 'monthly', label: 'Månadsvis', icon: <span className="pattern-icon">30</span> },
          { value: 'yearly', label: 'Årsvis', icon: <span className="pattern-icon">365</span> },
        ]}
        onPick={(v) => {
          const endDate = a.recurrence?.endDate;
          if (v === 'weekly') {
            set({ recurrence: a.recurrence?.type === 'weekly' ? a.recurrence : { type: 'weekly', weekdays: [isoWeekday(a.date)], everyOtherWeek: false, endDate } });
            setPage('weekdays');
          } else if (v === 'monthly') {
            set({ recurrence: a.recurrence?.type === 'monthly' ? a.recurrence : { type: 'monthly', days: [parseYMD(a.date).d], endDate } });
            setPage('monthdays');
          } else {
            set({ recurrence: { type: 'yearly', endDate } });
            setPage('yeardate');
          }
        }}
        onBack={() => (isNew && settings.editChooseType ? setPage('type') : setPage('form'))}
      />
    );
  }

  if (page === 'weekdays' && a.recurrence?.type === 'weekly') {
    const r = a.recurrence;
    const setR = (p: Partial<typeof r>) => set({ recurrence: { ...r, ...p } });
    return (
      <Page>
        <TitleBar title="Välj dagar" />
        <div className="weekday-picker">
          {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((l, i) => {
            const on = r.weekdays.includes(i + 1);
            return (
              <button
                key={i}
                className={on ? 'on' : ''}
                style={{ background: WEEKDAY_COLORS[i], color: i === 2 || i === 4 ? '#1d1d1d' : '#fff' }}
                onClick={() => setR({ weekdays: on ? r.weekdays.filter((d) => d !== i + 1) : [...r.weekdays, i + 1].sort() })}
                aria-pressed={on}
              >
                {l}
              </button>
            );
          })}
        </div>
        <div className="settings-inline">
          <CheckRow label="Alla dagar" checked={r.weekdays.length === 7} onChange={(v) => setR({ weekdays: v ? [1, 2, 3, 4, 5, 6, 7] : [] })} />
          <CheckRow label="Varannan vecka" checked={r.everyOtherWeek} onChange={(v) => setR({ everyOtherWeek: v })} />
        </div>
        <BottomBar left={<BackButton onClick={() => setPage('pattern')} />} right={<OkButton onClick={() => setPage('endDate')} disabled={r.weekdays.length === 0} />} />
      </Page>
    );
  }

  if (page === 'monthdays' && a.recurrence?.type === 'monthly') {
    const r = a.recurrence;
    return (
      <Page>
        <TitleBar title="Välj dagar" />
        <div className="monthday-picker">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
            const on = r.days.includes(d);
            return (
              <button key={d} className={on ? 'on' : ''} onClick={() => set({ recurrence: { ...r, days: on ? r.days.filter((x) => x !== d) : [...r.days, d] } })}>
                {d}
              </button>
            );
          })}
        </div>
        <BottomBar left={<BackButton onClick={() => setPage('pattern')} />} right={<OkButton onClick={() => setPage('endDate')} disabled={r.days.length === 0} />} />
      </Page>
    );
  }

  if (page === 'yeardate') {
    return (
      <DatePickPage
        title="Välj datum"
        value={a.date}
        settings={settings}
        onBack={() => setPage('pattern')}
        onOk={(d) => {
          set({ date: d });
          setPage('endDate');
        }}
      />
    );
  }

  if (page === 'endDate' && a.recurrence) {
    const r = a.recurrence;
    return (
      <DatePickPage
        title="Välj slutdatum"
        value={r.endDate ?? addDays(a.date, 30)}
        minDate={a.date}
        settings={settings}
        onBack={() => setPage(r.type === 'weekly' ? 'weekdays' : r.type === 'monthly' ? 'monthdays' : 'yeardate')}
        onOk={(d) => {
          const draft = { ...a, recurrence: { ...r, endDate: d } };
          setA(draft);
          next('endDate', draft);
        }}
        extra={
          <button
            className="grey-btn wide"
            onClick={() => {
              const draft = { ...a, recurrence: { ...r, endDate: undefined } };
              setA(draft);
              next('endDate', draft);
            }}
          >
            Utan slutdatum
          </button>
        }
      />
    );
  }

  if (page === 'date') {
    return (
      <DatePickPage
        title={a.recurrence ? 'Välj startdatum' : 'Välj datum'}
        value={a.date}
        minDate={settings.allowPastStart ? undefined : today()}
        settings={settings}
        onBack={prev}
        onOk={(d) => {
          const draft = { ...a, date: d };
          setA(draft);
          next('date', draft);
        }}
      />
    );
  }

  if (page === 'base') {
    return (
      <Page>
        <TitleBar title="Välj basaktivitet" icon={<ColorIcon name="baseActivities" size={30} />} />
        <div className="list">
          <ListRow icon={<span className="no-base">⊘</span>} label="Ingen basaktivitet" onClick={() => next()} />
          {bases
            ?.sort((x, y) => x.title.localeCompare(y.title, 'sv'))
            .map((b) => (
              <ListRow
                key={b.id}
                icon={b.image ? <Picture image={b.image} alt="" /> : undefined}
                label={b.title}
                sub={b.fullDay ? 'Heldag' : [b.start, b.end].filter(Boolean).join(' - ')}
                onClick={() => {
                  const draft = applyBase(a, b);
                  setA(draft);
                  next('base', draft);
                }}
              />
            ))}
        </div>
        <BottomBar left={<BackButton onClick={prev} />} />
      </Page>
    );
  }

  if (page === 'image') {
    return (
      <ImagePickPage
        value={a.image}
        onBack={prev}
        onOk={(image, name) => {
          const draft = { ...a, image, title: a.title || name || '' };
          setA(draft);
          next('image', draft);
        }}
      />
    );
  }

  if (page === 'name') {
    return (
      <NamePage
        title={mode === 'base' ? 'Namnge basaktiviteten' : 'Namnge aktiviteten'}
        value={a.title}
        onCancel={prev}
        onOk={(title) => {
          const draft = { ...a, title };
          setA(draft);
          next('name', draft);
        }}
      />
    );
  }

  if (page === 'start' || page === 'end' || page === 'duration') {
    const title = page === 'start' ? 'Ange starttid' : page === 'end' ? 'Ange sluttid' : 'Ange tidslängd';
    const duration = a.start && a.end ? minutesToHM(hmToMinutes(a.end) - hmToMinutes(a.start)) : undefined;
    return (
      <TimeEntryPage
        key={page}
        title={title}
        value={page === 'start' ? a.start : page === 'end' ? a.end : duration}
        allowEmpty={page !== 'start'}
        onCancel={prev}
        onOk={(v) => {
          let draft = a;
          if (page === 'start') {
            // Behåll längden när starttiden flyttas.
            const len = a.start && a.end ? hmToMinutes(a.end) - hmToMinutes(a.start) : undefined;
            draft = { ...a, start: v, end: v && len !== undefined ? minutesToHM(Math.min(hmToMinutes(v) + len, 1439)) : a.end };
          } else if (page === 'end') draft = { ...a, end: v };
          else draft = { ...a, end: v && a.start ? minutesToHM(Math.min(hmToMinutes(a.start) + hmToMinutes(v), 1439)) : undefined };
          setA(draft);
          next(page, draft);
        }}
      />
    );
  }

  if (page === 'category') {
    return (
      <CategoryPage
        value={a.category}
        settings={settings}
        onCancel={prev}
        onOk={(c) => {
          const draft = { ...a, category: c };
          setA(draft);
          next('category', draft);
        }}
      />
    );
  }

  if (page === 'flags') {
    return (
      <Page>
        <TitleBar title="Ta bort efteråt och kvittering" />
        <div className="settings-inline">
          <CheckRow label="Ta bort efteråt" checked={a.removeAfter} onChange={(v) => set({ removeAfter: v })} />
          <CheckRow label="Kvitterbar" checked={a.checkable} onChange={(v) => set({ checkable: v })} />
        </div>
        <BottomBar left={<BackButton onClick={prev} />} right={<OkButton onClick={() => next('flags')} />} />
      </Page>
    );
  }

  if (page === 'info') {
    const kinds = settings.infoMenu.filter((i) => i.visible).map((i) => i.kind);
    return (
      <Page>
        <TitleBar title="Info-menyn" icon={<span className="badge-i big">i</span>} />
        <div className="list">
          <ListRow
            icon={<span className="info-emoji">🚫</span>}
            label="Ingen info"
            selected={!a.info}
            onClick={() => {
              const draft = { ...a, info: undefined };
              setA(draft);
              next('info', draft);
            }}
          />
          {kinds.map((k) => (
            <ListRow
              key={k}
              icon={<span className="info-emoji">{INFO_EMOJI[k]}</span>}
              label={INFO_LABELS[k]}
              selected={a.info?.type === k}
              onClick={() => {
                setInfoKind(k);
                setPage('infoEdit');
              }}
            />
          ))}
        </div>
        <BottomBar left={<BackButton onClick={prev} />} />
      </Page>
    );
  }

  if (page === 'infoEdit' && infoKind) {
    const done = (info: ActivityInfo) => {
      const draft = { ...a, info };
      setA(draft);
      next('info', draft);
    };
    const back = () => setPage('info');
    const cur = a.info?.type === infoKind ? a.info : undefined;
    switch (infoKind) {
      case 'note':
        return <NamePage title="Anteckning" multiline value={cur?.type === 'note' ? cur.text : ''} onCancel={back} onOk={(text) => done({ type: 'note', text })} />;
      case 'timer':
        return (
          <TimerTimePage
            mode={settings.timerInput}
            initial={cur?.type === 'timer' ? cur.minutes : 10}
            onBack={back}
            onOk={(minutes) => done({ type: 'timer', minutes })}
          />
        );
      case 'image':
        return <ImagePickPage value={cur?.type === 'image' ? cur.image : undefined} onBack={back} onOk={(image) => (image ? done({ type: 'image', image }) : back())} />;
      case 'checklist':
        return <ChecklistEditor items={cur?.type === 'checklist' ? cur.items : []} onBack={back} onOk={(items) => done({ type: 'checklist', items })} />;
      case 'link':
      case 'address':
      case 'phone':
      case 'sms': {
        const kind = infoKind;
        const val = cur && 'url' in cur ? cur.url : cur && 'address' in cur ? cur.address : cur && 'number' in cur ? cur.number : '';
        const titles = { link: 'Ange länk', address: 'Ange adress', phone: 'Ange telefonnummer', sms: 'Ange telefonnummer för SMS' };
        return (
          <NamePage
            title={titles[kind]}
            value={val}
            onCancel={back}
            onOk={(v) => {
              if (!v) return back();
              if (kind === 'link') done({ type: 'link', url: /^https?:\/\//.test(v) ? v : `https://${v}` });
              else if (kind === 'address') done({ type: 'address', address: v });
              else done({ type: kind, number: v });
            }}
          />
        );
      }
    }
  }

  if (page === 'scope') {
    return (
      <Page>
        <TitleBar title="Ändra återkommande aktivitet" />
        <div className="list centered">
          <ListRow label="Endast denna dag" onClick={() => save('thisDay')} />
          <ListRow label="Denna dag och framåt" onClick={() => save('forward')} />
        </div>
        <BottomBar left={<BackButton onClick={() => setPage('form')} />} />
      </Page>
    );
  }

  // ---- Ändravyn (handbok 4.9) ----
  const f = settings.editFields;
  const duration = a.start && a.end ? minutesToHM(hmToMinutes(a.end) - hmToMinutes(a.start)) : undefined;
  const row = (label: string, child: ReactNode) => (
    <div className="ev-row">
      <span className="ev-label">{label}</span>
      {child}
    </div>
  );
  return (
    <Page className="edit-view">
      {mode === 'base' && <TitleBar title={isNew ? 'Ny basaktivitet' : 'Ändra basaktivitet'} icon={<ColorIcon name="baseActivities" size={30} />} />}
      <div className="ev-body">
        {mode === 'activity' && (f.date || (isNew && settings.editBaseButton)) && (
          <div className="ev-top">
            {isNew && settings.editBaseButton && (
              <button className="grey-btn square" onClick={() => setPage('base')} aria-label="Välj basaktivitet">
                <ColorIcon name="baseActivities" size={34} />
              </button>
            )}
            {f.date && <GreyButton className="grow" onClick={() => setPage('date')}>{dateTitle(a.date, { ...settings, monthSymbol: 'week' })}</GreyButton>}
          </div>
        )}
        {f.name && row('Namn:', <GreyButton className="grow" onClick={() => setPage('name')} placeholder="Namnge aktiviteten">{a.title || undefined}</GreyButton>)}

        <div className="ev-split">
          <div className="ev-col">
            {!a.fullDay && (
              <>
                {f.start && row('Starttid:', <GreyButton onClick={() => setPage('start')} placeholder="__:__">{a.start}</GreyButton>)}
                {f.end && row('Sluttid:', <GreyButton onClick={() => setPage('end')} placeholder="__:__">{a.end}</GreyButton>)}
                {f.duration && row('Tidslängd:', <GreyButton onClick={() => setPage('duration')} placeholder="__:__">{duration}</GreyButton>)}
              </>
            )}
          </div>
          {f.image && (
            <button className="grey-btn image-btn" onClick={() => setPage('image')}>
              {a.image ? <Picture image={a.image} alt="" /> : 'Bild'}
            </button>
          )}
        </div>

        <div className="ev-split">
          <div className="ev-col">
            {f.fullDay && row('Heldag:', <GreyButton onClick={() => set({ fullDay: !a.fullDay })}>{a.fullDay ? 'Ja' : 'Nej'}</GreyButton>)}
            {mode === 'activity' && f.removeAfter && row('Ta bort efteråt:', <GreyButton onClick={() => set({ removeAfter: !a.removeAfter })}>{a.removeAfter ? 'Ja' : 'Nej'}</GreyButton>)}
            {f.category &&
              row(
                'Kategori:',
                <GreyButton onClick={() => setPage('category')}>
                  {a.category ? (
                    <>
                      <span className="cat-circle small" style={{ background: CATEGORY_COLORS[a.category] }} /> {settings.categories[a.category].name}
                    </>
                  ) : (
                    'Ingen'
                  )}
                </GreyButton>,
              )}
          </div>
          {f.info && (
            <button className="grey-btn info-btn" onClick={() => setPage('info')} aria-label={infoLabel(a.info)}>
              <span className="badge-i big">i</span>
              {a.info && <small>{infoLabel(a.info)}</small>}
            </button>
          )}
        </div>

        {mode === 'activity' &&
          row(
            'Upprepas:',
            <GreyButton className="grow" onClick={() => setPage('pattern')}>
              {recurrenceLabel(a.recurrence)}
              {a.recurrence?.endDate ? `, t.o.m. ${a.recurrence.endDate}` : ''}
            </GreyButton>,
          )}
        {a.recurrence && (
          <button className="text-link" onClick={() => set({ recurrence: undefined, removeAfter: false })}>
            Gör till enstaka aktivitet
          </button>
        )}
      </div>
      {error && (
        <div className="modal-backdrop" onClick={() => setError(undefined)}>
          <div className="alert" role="alertdialog">
            <p>{error}</p>
            <button className="grey-btn wide" onClick={() => setError(undefined)}>
              OK
            </button>
          </div>
        </div>
      )}
      <BottomBar
        left={<BackButton onClick={() => onDone()} />}
        center={
          f.checkable ? (
            <button className="round-btn" onClick={() => set({ checkable: !a.checkable })} aria-label={a.checkable ? 'Kvitterbar' : 'Inte kvitterbar'} aria-pressed={a.checkable}>
              <CheckableIcon on={a.checkable} size={28} />
            </button>
          ) : undefined
        }
        right={<OkButton onClick={onOk} />}
      />
    </Page>
  );
}

/** Checklista: uppgifter med bild och/eller text (handbok 4.9.12). */
function ChecklistEditor({ items: initial, onOk, onBack }: { items: ChecklistItem[]; onOk: (items: ChecklistItem[]) => void; onBack: () => void }) {
  const [items, setItems] = useState<ChecklistItem[]>(initial.length ? initial : [{ id: uid(), text: '' }]);
  const [picking, setPicking] = useState<string>();
  if (picking) {
    const it = items.find((i) => i.id === picking);
    return (
      <ImagePickPage
        value={it?.image}
        onBack={() => setPicking(undefined)}
        onOk={(image, name) => {
          setItems(items.map((i) => (i.id === picking ? { ...i, image, text: i.text || name || '' } : i)));
          setPicking(undefined);
        }}
      />
    );
  }
  const clean = items.filter((i) => i.text.trim() || i.image);
  return (
    <Page>
      <TitleBar title="Checklista" />
      <div className="checklist-edit">
        {items.map((it, idx) => (
          <div key={it.id} className="cle-row">
            <button className="cle-img" onClick={() => setPicking(it.id)} aria-label="Välj bild">
              {it.image ? <Picture image={it.image} alt="" /> : <Icon name="camera" size={22} />}
            </button>
            <input
              value={it.text}
              placeholder={`Uppgift ${idx + 1}`}
              onChange={(e) => setItems(items.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)))}
            />
            <button className="cle-del" onClick={() => setItems(items.filter((x) => x.id !== it.id))} aria-label="Ta bort uppgift">
              <Icon name="close" size={20} />
            </button>
          </div>
        ))}
        <button className="grey-btn wide" onClick={() => setItems([...items, { id: uid(), text: '' }])}>
          <Icon name="plus" size={20} /> Lägg till uppgift
        </button>
      </div>
      <BottomBar left={<BackButton onClick={onBack} />} right={<OkButton onClick={() => onOk(clean)} disabled={clean.length === 0} />} />
    </Page>
  );
}
