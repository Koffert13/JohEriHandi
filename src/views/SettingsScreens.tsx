import { useRef, useState, type ReactNode } from 'react';
import { downloadBackup, importBackup } from '../backup.ts';
import {
  BackButton,
  BottomBar,
  CheckRow,
  CloseButton,
  ConfirmPage,
  ListRow,
  NumPad,
  OkButton,
  Page,
  RadioRow,
  SettingsGroup,
  TitleBar,
} from '../components/handi.tsx';
import { ColorIcon, Icon } from '../components/Icon.tsx';
import { useNav } from '../nav.tsx';
import {
  CATEGORY_COLORS,
  CATEGORY_IDS,
  DEFAULT_SETTINGS,
  INFO_LABELS,
  updateSettings,
  type EditField,
  type MenuItem,
  type SequenceStep,
  type Settings,
} from '../settings.ts';
import { installStarterSet } from '../starter.ts';
import { NamePage } from '../components/pickers.tsx';

type SettingsPageId =
  | 'code'
  | 'calendar'
  | 'activity'
  | 'add'
  | 'edit'
  | 'info'
  | 'menu'
  | 'time'
  | 'clock'
  | 'month'
  | 'week'
  | 'timer'
  | 'categories'
  | 'backup'
  | 'about';

const PAGES: { id: SettingsPageId; label: string }[] = [
  { id: 'code', label: 'Kodskydd' },
  { id: 'calendar', label: 'Kalendervyn' },
  { id: 'activity', label: 'Aktivitetsvyn' },
  { id: 'add', label: 'Lägga in aktivitet' },
  { id: 'edit', label: 'Ändravyn' },
  { id: 'info', label: 'Info-menyn' },
  { id: 'menu', label: 'Kalendermenyn' },
  { id: 'time', label: 'Tidvisning' },
  { id: 'clock', label: 'Klockvy' },
  { id: 'month', label: 'Månadsvy' },
  { id: 'week', label: 'Veckovy' },
  { id: 'timer', label: 'Starta timer' },
  { id: 'categories', label: 'Kategorier' },
  { id: 'backup', label: 'Säkerhetskopia' },
  { id: 'about', label: 'Om appen' },
];

export function SettingsScreen({ settings }: { settings: Settings }) {
  const nav = useNav();
  const [unlocked, setUnlocked] = useState(!settings.codeProtect);
  const [page, setPage] = useState<SettingsPageId>();
  if (!unlocked) return <CodeLock code={settings.code} onUnlock={() => setUnlocked(true)} onBack={nav.back} />;
  if (page) return <SettingsPage id={page} settings={settings} onClose={() => setPage(undefined)} />;
  return (
    <Page className="settings-screen">
      <TitleBar title="Inställningar" variant="yellow" icon={<ColorIcon name="settings" size={28} />} />
      <div className="list">
        {PAGES.map((p) => (
          <ListRow key={p.id} label={p.label} chevron onClick={() => setPage(p.id)} />
        ))}
      </div>
      <BottomBar left={<BackButton onClick={nav.back} />} />
    </Page>
  );
}

/** Kodskydd (handbok 5.1). */
function CodeLock({ code, onUnlock, onBack }: { code: string; onUnlock: () => void; onBack: () => void }) {
  const [entered, setEntered] = useState('');
  const [wrong, setWrong] = useState(false);
  return (
    <Page className="entry-page">
      <TitleBar title="Ange kod" icon={<Icon name="lock" size={24} />} />
      <div className="entry-display">
        <div className={`digit-boxes ${wrong ? 'error' : ''}`}>
          {Array.from({ length: code.length }, (_, i) => (
            <span key={i} className="digit-box">
              {i < entered.length ? '●' : ''}
            </span>
          ))}
        </div>
        {wrong && <p className="entry-error">Fel kod</p>}
      </div>
      <NumPad
        onDigit={(d) => {
          const next = entered + d;
          setWrong(false);
          if (next === code) onUnlock();
          else if (next.length >= code.length) {
            setWrong(true);
            setEntered('');
          } else setEntered(next);
        }}
        onClear={() => setEntered('')}
      />
      <BottomBar left={<BackButton onClick={onBack} />} />
    </Page>
  );
}

function SettingsPage({ id, settings, onClose }: { id: SettingsPageId; settings: Settings; onClose: () => void }) {
  const [s, setS] = useState<Settings>(settings);
  const [sub, setSub] = useState<ReactNode>();
  const set = (p: Partial<Settings>) => setS((x) => ({ ...x, ...p }));
  const title = PAGES.find((p) => p.id === id)!.label;
  const save = async () => {
    await updateSettings(s);
    onClose();
  };
  if (sub) return <>{sub}</>;

  const body = (() => {
    switch (id) {
      case 'code':
        return (
          <>
            <SettingsGroup>
              <CheckRow label="Kodskydda inställningar" checked={s.codeProtect} onChange={(v) => set({ codeProtect: v })} />
            </SettingsGroup>
            <SettingsGroup title="Kod">
              <ListRow
                label={`Byt kod (nu: ${s.code})`}
                chevron
                onClick={() =>
                  setSub(
                    <NamePage
                      title="Ny kod (4 siffror)"
                      value={s.code}
                      onCancel={() => setSub(undefined)}
                      onOk={(v) => {
                        if (/^\d{4}$/.test(v)) set({ code: v });
                        setSub(undefined);
                      }}
                    />,
                  )
                }
              />
            </SettingsGroup>
          </>
        );
      case 'calendar':
        return (
          <>
            <SettingsGroup title="Startvy">
              {(
                [
                  ['timeline', 'Tidspelarvy'],
                  ['list', 'Listvy'],
                  ['week', 'Veckovy'],
                  ['month', 'Månadsvy'],
                ] as const
              ).map(([v, l]) => (
                <RadioRow key={v} label={l} checked={s.startView === v} onChange={() => set({ startView: v })} />
              ))}
            </SettingsGroup>
            <SettingsGroup>
              <CheckRow label="Visa snabbval för kalendervyn (flikar)" checked={s.showTabs} onChange={(v) => set({ showTabs: v })} />
            </SettingsGroup>
            <SettingsGroup title="Zoom">
              <RadioRow label="Liten" checked={s.zoom === 'small'} onChange={() => set({ zoom: 'small' })} />
              <RadioRow label="Stor" checked={s.zoom === 'large'} onChange={() => set({ zoom: 'large' })} />
            </SettingsGroup>
            <SettingsGroup>
              <CheckRow label="Bläddra bakåt samma dag" checked={s.browseBackSameDay} onChange={(v) => set({ browseBackSameDay: v })} />
            </SettingsGroup>
            <SettingsGroup title="Bläddra dagar framåt">
              <RadioRow label="Inte tillåtet" checked={s.browseForward === 'none'} onChange={() => set({ browseForward: 'none' })} />
              <RadioRow label="Max 6 dagar" checked={s.browseForward === 'six'} onChange={() => set({ browseForward: 'six' })} />
              <RadioRow label="Obegränsat" checked={s.browseForward === 'unlimited'} onChange={() => set({ browseForward: 'unlimited' })} />
            </SettingsGroup>
            <SettingsGroup>
              <CheckRow label="Bläddra dagar bakåt" checked={s.browseBack} onChange={(v) => set({ browseBack: v })} />
              <CheckRow label="Visa digital tid för aktiviteten" checked={s.showActivityTime} onChange={(v) => set({ showActivityTime: v })} />
              <CheckRow label="Visa text för aktiviteten" checked={s.showActivityText} onChange={(v) => set({ showActivityText: v })} />
              <CheckRow label="Visa kvartursprickar" checked={s.showQuarterDots} onChange={(v) => set({ showQuarterDots: v })} />
              <CheckRow label="Håll skärmen tänd" checked={s.keepAwake} onChange={(v) => set({ keepAwake: v })} />
            </SettingsGroup>
          </>
        );
      case 'activity':
        return (
          <>
            <SettingsGroup title="Visa/Dölj i knappraden:">
              <CheckRow label="Ta bort-knapp" checked={s.showDeleteButton} onChange={(v) => set({ showDeleteButton: v })} />
              <CheckRow label="Ändra-knapp (öppnar Ändravyn)" checked={s.showEditButton} onChange={(v) => set({ showEditButton: v })} />
            </SettingsGroup>
            <SettingsGroup title="Visa/Dölj kvartursvisning:">
              <CheckRow label="Kvartursvisning" checked={s.quarterView} onChange={(v) => set({ quarterView: v })} />
              <CheckRow label="Sista kvarten som fem punkter" checked={s.lastQuarterAsFive} onChange={(v) => set({ lastQuarterAsFive: v })} />
              <CheckRow label="Digital nedräkning" checked={s.digitalCountdown} onChange={(v) => set({ digitalCountdown: v })} />
            </SettingsGroup>
          </>
        );
      case 'add': {
        const seq: [SequenceStep, string][] = [
          ['date', 'Välj datum'],
          ['type', 'Välj typ av aktivitet'],
          ['base', 'Välj basaktivitet'],
          ['image', 'Välj bild'],
          ['name', 'Namnge aktiviteten'],
          ['info', 'Info-meny'],
          ['removeAfter', 'Ta bort efteråt och kvittering'],
          ['category', 'Välj kategori'],
          ['end', 'Ange sluttid'],
        ];
        return (
          <>
            <SettingsGroup title="Passerad starttid">
              <CheckRow label="Tillåt passerad starttid" checked={s.allowPastStart} onChange={(v) => set({ allowPastStart: v })} />
            </SettingsGroup>
            <SettingsGroup title="Lägg in aktivitet">
              <RadioRow label="Lägg in aktivitet via Ändravyn" checked={s.addMethod === 'edit'} onChange={() => set({ addMethod: 'edit' })} />
              {s.addMethod === 'edit' && (
                <div className="indent">
                  <CheckRow label="Välj typ av aktivitet" checked={s.editChooseType} onChange={(v) => set({ editChooseType: v })} />
                  <CheckRow label="Basaktivitet-knapp" checked={s.editBaseButton} onChange={(v) => set({ editBaseButton: v })} />
                </div>
              )}
              <RadioRow label="Lägg in aktivitet via sekvens" checked={s.addMethod === 'sequence'} onChange={() => set({ addMethod: 'sequence' })} />
              {s.addMethod === 'sequence' && (
                <div className="indent">
                  {seq.map(([k, l]) => (
                    <CheckRow key={k} label={l} checked={s.sequence[k]} onChange={(v) => set({ sequence: { ...s.sequence, [k]: v } })} />
                  ))}
                </div>
              )}
            </SettingsGroup>
          </>
        );
      }
      case 'edit': {
        const fields: [EditField, string][] = [
          ['date', 'Datum'],
          ['name', 'Namn'],
          ['start', 'Starttid'],
          ['end', 'Sluttid'],
          ['duration', 'Tidslängd'],
          ['fullDay', 'Heldag'],
          ['checkable', 'Kvittering'],
          ['image', 'Bild'],
          ['info', 'Info-menyn'],
          ['removeAfter', 'Ta bort efteråt'],
          ['category', 'Kategorier'],
        ];
        return (
          <SettingsGroup title="Visa/Dölj">
            {fields.map(([k, l]) => (
              <CheckRow key={k} label={l} checked={s.editFields[k]} onChange={(v) => set({ editFields: { ...s.editFields, [k]: v } })} />
            ))}
          </SettingsGroup>
        );
      }
      case 'info': {
        const move = (i: number, dir: -1 | 1) => {
          const list = [...s.infoMenu];
          const j = i + dir;
          if (j < 0 || j >= list.length) return;
          [list[i], list[j]] = [list[j], list[i]];
          set({ infoMenu: list });
        };
        return (
          <SettingsGroup title="Visa/Dölj och ordning">
            {s.infoMenu.map((it, i) => (
              <div key={it.kind} className="order-row">
                <CheckRow
                  label={INFO_LABELS[it.kind]}
                  checked={it.visible}
                  onChange={(v) => set({ infoMenu: s.infoMenu.map((x) => (x.kind === it.kind ? { ...x, visible: v } : x)) })}
                />
                <button className="icon-mini" onClick={() => move(i, -1)} aria-label="Flytta upp">
                  <Icon name="up" size={20} />
                </button>
                <button className="icon-mini" onClick={() => move(i, 1)} aria-label="Flytta ner">
                  <Icon name="down" size={20} />
                </button>
              </div>
            ))}
          </SettingsGroup>
        );
      }
      case 'menu': {
        const items: [MenuItem, string][] = [
          ['addActivity', 'Lägga in aktivitet'],
          ['startTimer', 'Starta timer'],
          ['clock', 'Klocka'],
          ['search', 'Sök aktivitet'],
          ['baseActivities', 'Basaktiviteter'],
          ['baseTimers', 'Bastimers'],
        ];
        return (
          <SettingsGroup title="Visa/Dölj">
            {items.map(([k, l]) => (
              <CheckRow key={k} label={l} checked={s.calendarMenu[k]} onChange={(v) => set({ calendarMenu: { ...s.calendarMenu, [k]: v } })} />
            ))}
          </SettingsGroup>
        );
      }
      case 'time':
        return (
          <>
            <SettingsGroup title="Månadssymbol/Veckonummer">
              <RadioRow label="Handisymbol" checked={s.monthSymbol === 'handi'} onChange={() => set({ monthSymbol: 'handi' })} />
              <RadioRow label="Veckonummer" checked={s.monthSymbol === 'week'} onChange={() => set({ monthSymbol: 'week' })} />
              <RadioRow label="Varken symbol eller veckonummer" checked={s.monthSymbol === 'none'} onChange={() => set({ monthSymbol: 'none' })} />
            </SettingsGroup>
            <SettingsGroup title="Knapp i datumfältet">
              <RadioRow label="Lägg till aktivitet" checked={s.dateFieldButton === 'add'} onChange={() => set({ dateFieldButton: 'add' })} />
              <RadioRow label="Analog klocka" checked={s.dateFieldButton === 'clock'} onChange={() => set({ dateFieldButton: 'clock' })} />
            </SettingsGroup>
            <SettingsGroup>
              <CheckRow label="Visa veckodagsfärger" checked={s.weekdayColors} onChange={(v) => set({ weekdayColors: v })} />
              <CheckRow label="Visa helgdagar" checked={s.holidays} onChange={(v) => set({ holidays: v })} />
            </SettingsGroup>
          </>
        );
      case 'clock':
        return (
          <>
            <SettingsGroup title="Visa/Dölj">
              <CheckRow label="Visa datum" checked={s.clockShowDate} onChange={(v) => set({ clockShowDate: v })} />
              <CheckRow label="Visa tid på dygnet" checked={s.clockShowPartOfDay} onChange={(v) => set({ clockShowPartOfDay: v })} />
            </SettingsGroup>
            <SettingsGroup title="Klocka">
              <RadioRow label="Analog" checked={s.clockType === 'analog'} onChange={() => set({ clockType: 'analog' })} />
              <RadioRow label="Digital" checked={s.clockType === 'digital'} onChange={() => set({ clockType: 'digital' })} />
              <RadioRow label="Både analog och digital" checked={s.clockType === 'both'} onChange={() => set({ clockType: 'both' })} />
            </SettingsGroup>
          </>
        );
      case 'month':
        return (
          <SettingsGroup title="Visa/Dölj">
            <CheckRow label="Visa markering för återkommande aktiviteter" checked={s.monthMarkRecurring} onChange={(v) => set({ monthMarkRecurring: v })} />
            <p className="hint">(Markering för enstaka aktiviteter visas alltid.)</p>
          </SettingsGroup>
        );
      case 'week':
        return (
          <>
            <SettingsGroup title="Antal dagar i veckovyn">
              <RadioRow label="7 dagar" checked={s.weekDays === 7} onChange={() => set({ weekDays: 7 })} />
              <RadioRow label="5 dagar" checked={s.weekDays === 5} onChange={() => set({ weekDays: 5 })} />
            </SettingsGroup>
            <SettingsGroup title="Visning av aktivitet">
              <RadioRow label="Alltid tid" checked={s.weekDisplay === 'time'} onChange={() => set({ weekDisplay: 'time' })} />
              <RadioRow label="Bild" checked={s.weekDisplay === 'image'} onChange={() => set({ weekDisplay: 'image' })} />
            </SettingsGroup>
            <SettingsGroup title="Visa/Dölj">
              <CheckRow label="Visa återkommande aktiviteter" checked={s.weekShowRecurring} onChange={(v) => set({ weekShowRecurring: v })} />
              <CheckRow label="Visa Timvy-knapp" checked={s.weekHourViewButton} onChange={(v) => set({ weekHourViewButton: v })} />
            </SettingsGroup>
          </>
        );
      case 'timer':
        return (
          <>
            <SettingsGroup>
              <CheckRow label="Välj bastimer" checked={s.timerChooseBase} onChange={(v) => set({ timerChooseBase: v })} />
              <CheckRow label="Välj bild" checked={s.timerChooseImage} onChange={(v) => set({ timerChooseImage: v })} />
              <CheckRow label="Namnge timern" checked={s.timerName} onChange={(v) => set({ timerName: v })} />
            </SettingsGroup>
            <SettingsGroup title="Timertid">
              <RadioRow label="1–99 minuter" checked={s.timerInput === 'm99'} onChange={() => set({ timerInput: 'm99' })} />
              <RadioRow label="1–999 minuter" checked={s.timerInput === 'm999'} onChange={() => set({ timerInput: 'm999' })} />
              <RadioRow label="Timmar och minuter" checked={s.timerInput === 'hhmm'} onChange={() => set({ timerInput: 'hhmm' })} />
            </SettingsGroup>
          </>
        );
      case 'categories':
        return (
          <SettingsGroup title="Visa och byt namn">
            {CATEGORY_IDS.map((c) => (
              <div key={c} className="category-row">
                <CheckRow
                  label={<span className="cat-circle" style={{ background: CATEGORY_COLORS[c] }} />}
                  checked={s.categories[c].visible}
                  onChange={(v) => set({ categories: { ...s.categories, [c]: { ...s.categories[c], visible: v } } })}
                />
                <input
                  value={s.categories[c].name}
                  onChange={(e) => set({ categories: { ...s.categories, [c]: { ...s.categories[c], name: e.target.value } } })}
                  aria-label="Kategorins namn"
                />
              </div>
            ))}
          </SettingsGroup>
        );
      case 'backup':
        return <BackupPage onSub={setSub} />;
      case 'about':
        return (
          <SettingsGroup>
            <p className="hint">
              En egen kalender byggd efter HandiKalenderns handbok. All data sparas bara på den här enheten. Larm, påminnelser och talstöd finns inte med.
            </p>
            <p className="hint">Bilder: Sergio Palao, ARASAAC (arasaac.org), CC BY-NC-SA 4.0. Aragoniens regering.</p>
            <ListRow
              label="Återställ grundinställning"
              onClick={() =>
                setSub(
                  <ConfirmPage
                    title="Återställa grundinställningen?"
                    yes="JA"
                    no="NEJ"
                    onNo={() => setSub(undefined)}
                    onYes={async () => {
                      await updateSettings({ ...DEFAULT_SETTINGS, onboarded: true });
                      onClose();
                    }}
                  >
                    <p>Aktiviteter och bilder påverkas inte.</p>
                  </ConfirmPage>,
                )
              }
            />
          </SettingsGroup>
        );
    }
  })();

  const readOnly = id === 'backup' || id === 'about';
  return (
    <Page className="settings-page">
      <TitleBar title={title} variant="yellow" />
      <div className="settings-body">{body}</div>
      <BottomBar left={readOnly ? <BackButton onClick={onClose} /> : <CloseButton onClick={onClose} />} right={readOnly ? undefined : <OkButton onClick={save} />} />
    </Page>
  );
}

function BackupPage({ onSub }: { onSub: (n: ReactNode) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string>();
  return (
    <>
      <SettingsGroup>
        <p className="hint">
          Allt finns bara på den här telefonen. Spara en säkerhetskopia ibland, till exempel i Filer eller skicka den till dig själv.
        </p>
        <ListRow icon={<Icon name="download" />} label="Spara säkerhetskopia" onClick={() => downloadBackup().catch((e) => setMessage(String(e)))} />
        <ListRow icon={<Icon name="upload" />} label="Läs in säkerhetskopia" onClick={() => fileRef.current?.click()} />
        <ListRow
          icon={<ColorIcon name="baseActivities" size={28} />}
          label="Lägg in startuppsättning"
          onClick={() => installStarterSet().then(() => setMessage('Startuppsättningen är inlagd.'))}
        />
        {message && <p className="hint strong">{message}</p>}
      </SettingsGroup>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          onSub(
            <ConfirmPage
              title="Läsa in säkerhetskopian?"
              onNo={() => onSub(undefined)}
              onYes={async () => {
                try {
                  await importBackup(f);
                  setMessage('Säkerhetskopian är inläst.');
                } catch (err) {
                  setMessage(`Kunde inte läsa filen: ${(err as Error).message}`);
                }
                onSub(undefined);
              }}
            >
              <p>All data på telefonen ersätts med innehållet i filen.</p>
            </ConfirmPage>,
          );
        }}
      />
    </>
  );
}
