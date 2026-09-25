import { useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  addDays,
  addMonths,
  daysInMonth,
  hmAt,
  holidayOn,
  isoWeek,
  isoWeekday,
  MONTHS_SV,
  parseYMD,
  toYMD,
  type CategoryId,
  type HM,
  type YMD,
} from '../domain/index.ts';
import pictograms from '../pictograms.json';
import { db, uid } from '../db.ts';
import { TZ, today, useNow } from '../hooks.ts';
import { CATEGORY_COLORS, CATEGORY_IDS, type Settings } from '../settings.ts';
import { BackButton, BottomBar, CloseButton, ListRow, NumPad, OkButton, Page, TitleBar } from './handi.tsx';
import { Icon, StepArrow } from './Icon.tsx';
import { Picture } from './Picture.tsx';

/** "Ange starttid": fyra sifferrutor och sifferknappar. */
export function TimeEntryPage({
  title,
  value,
  onOk,
  onCancel,
  allowEmpty,
}: {
  title: string;
  value?: HM;
  onOk: (v: HM | undefined) => void;
  onCancel: () => void;
  allowEmpty?: boolean;
}) {
  const now = useNow(30000);
  const [digits, setDigits] = useState(value ? value.replace(':', '') : '');
  const [error, setError] = useState(false);
  const ok = () => {
    if (!digits) {
      if (allowEmpty) onOk(undefined);
      else setError(true);
      return;
    }
    const d = digits.padEnd(4, '0');
    const h = Number(d.slice(0, 2));
    const m = Number(d.slice(2, 4));
    if (h > 23 || m > 59) {
      setError(true);
      return;
    }
    onOk(`${d.slice(0, 2)}:${d.slice(2, 4)}`);
  };
  return (
    <Page className="entry-page">
      <TitleBar title={title} right={<span className="tb-time">{hmAt(now, TZ)}</span>} />
      <div className="entry-display">
        <div className={`digit-boxes ${error ? 'error' : ''}`}>
          {[0, 1].map((i) => (
            <span key={i} className="digit-box">
              {digits[i] ?? ''}
            </span>
          ))}
          <span className="digit-colon">:</span>
          {[2, 3].map((i) => (
            <span key={i} className="digit-box">
              {digits[i] ?? ''}
            </span>
          ))}
        </div>
      </div>
      <NumPad
        onDigit={(d) => {
          setError(false);
          setDigits((x) => (x.length >= 4 ? d : x + d));
        }}
        onClear={() => {
          setError(false);
          setDigits('');
        }}
      />
      <BottomBar left={<CloseButton onClick={onCancel} />} right={<OkButton onClick={ok} />} />
    </Page>
  );
}

/** "Ange timertid": 2, 3 eller 4 siffror beroende på inställning (handbok 5.13.1). */
export function TimerTimePage({
  mode,
  initial,
  onOk,
  onBack,
}: {
  mode: Settings['timerInput'];
  initial?: number;
  onOk: (minutes: number) => void;
  onBack: () => void;
}) {
  const len = mode === 'm99' ? 2 : mode === 'm999' ? 3 : 4;
  const [digits, setDigits] = useState(() => {
    if (!initial) return '';
    if (mode === 'hhmm') return `${String(Math.floor(initial / 60)).padStart(2, '0')}${String(initial % 60).padStart(2, '0')}`;
    return String(initial).padStart(len, '0').slice(-len);
  });
  const minutes = () => {
    const d = digits.padStart(len, '0');
    return mode === 'hhmm' ? Number(d.slice(0, 2)) * 60 + Math.min(59, Number(d.slice(2))) : Number(d);
  };
  return (
    <Page className="entry-page">
      <TitleBar title="Ange timertid" />
      <div className="entry-display">
        <div className="digit-boxes">
          {Array.from({ length: len }, (_, i) => (
            <span key={i} style={{ display: 'contents' }}>
              {mode === 'hhmm' && i === 2 && <span className="digit-colon">:</span>}
              <span className="digit-box">{digits.padStart(len, ' ')[i]?.trim() ?? ''}</span>
            </span>
          ))}
        </div>
      </div>
      <NumPad onDigit={(d) => setDigits((x) => (x.length >= len ? d : x + d))} onClear={() => setDigits('')} />
      <BottomBar left={<BackButton onClick={onBack} />} right={<OkButton onClick={() => minutes() > 0 && onOk(minutes())} disabled={minutes() <= 0} />} />
    </Page>
  );
}

/** "Namnge aktiviteten": textruta med OK/Avbryt. */
export function NamePage({
  title,
  value,
  onOk,
  onCancel,
  multiline,
}: {
  title: string;
  value: string;
  onOk: (v: string) => void;
  onCancel: () => void;
  multiline?: boolean;
}) {
  const [text, setText] = useState(value);
  return (
    <Page className="name-page">
      <TitleBar title={title} />
      <div className="np-body">
        {multiline ? (
          <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} />
        ) : (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value.replace(/\n/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onOk(text.trim()))}
          />
        )}
        <div className="ok-cancel">
          <button className="oc-ok" onClick={() => onOk(text.trim())}>
            OK
          </button>
          <button className="oc-cancel" onClick={onCancel}>
            Avbryt
          </button>
        </div>
      </div>
    </Page>
  );
}

/** Månadskalender för att välja datum ("Välj datum", "Välj slutdatum"). */
export function DatePickPage({
  title,
  value,
  onOk,
  onBack,
  minDate,
  extra,
  settings,
}: {
  title: string;
  value?: YMD;
  onOk: (d: YMD) => void;
  onBack: () => void;
  minDate?: YMD;
  extra?: ReactNode;
  settings: Settings;
}) {
  const [selected, setSelected] = useState<YMD>(value ?? today());
  const [month, setMonth] = useState(() => (value ?? today()).slice(0, 8) + '01');
  const { y, m } = parseYMD(month);
  const first = toYMD(y, m, 1);
  const cells: (YMD | null)[] = [
    ...Array.from({ length: isoWeekday(first) - 1 }, () => null),
    ...Array.from({ length: daysInMonth(y, m) }, (_, i) => addDays(first, i)),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  return (
    <Page className="date-page">
      <TitleBar title={title} />
      <div className="dp-body">
        <div className="dp-month">
          {MONTHS_SV[m - 1].charAt(0).toUpperCase() + MONTHS_SV[m - 1].slice(1)} {y}
        </div>
        <table className="dp-table">
          <thead>
            <tr>
              <th />
              {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => {
              const firstDay = w.find(Boolean)!;
              return (
                <tr key={i}>
                  <td className="dp-week">{isoWeek(firstDay)}</td>
                  {w.map((d, j) => {
                    if (!d) return <td key={j} className="dp-empty" />;
                    const disabled = !!minDate && d < minDate;
                    const red = j === 6 || (settings.holidays && holidayOn(d)?.red);
                    return (
                      <td key={j}>
                        <button
                          className={`dp-day ${d === selected ? 'selected' : ''} ${red ? 'red' : ''}`}
                          disabled={disabled}
                          onClick={() => setSelected(d)}
                        >
                          {parseYMD(d).d}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {extra}
      </div>
      <BottomBar
        left={<BackButton onClick={onBack} />}
        center={
          <>
            <button className="bar-icon-btn" onClick={() => setMonth(addMonths(month, -1))} aria-label="Förra månaden">
              <StepArrow dir="prev" label="30" size={36} />
            </button>
            <button className="bar-icon-btn" onClick={() => setMonth(addMonths(month, 1))} aria-label="Nästa månad">
              <StepArrow dir="next" label="30" size={36} />
            </button>
          </>
        }
        right={<OkButton onClick={() => onOk(selected)} disabled={!!minDate && selected < minDate} />}
      />
    </Page>
  );
}

/** Skalar ner en bild och sparar den som JPEG. */
async function resizeImage(file: File, max = 600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Kunde inte spara bilden'))), 'image/jpeg', 0.85),
  );
}

const FOLDERS = [...new Set(pictograms.map((p) => p.folder))];
const MY_PHOTOS = 'Mina foton';

function FolderIcon({ images }: { images: string[] }) {
  return (
    <span className="folder">
      <span className="folder-tab" />
      <span className="folder-body">
        <span className="folder-paper">
          {images.slice(0, 4).map((im) => (
            <Picture key={im} image={im} alt="" />
          ))}
        </span>
      </span>
    </span>
  );
}

/** "Välj bild": mappar med bilder och kamera (handbok 1.8). */
export function ImagePickPage({
  value,
  onOk,
  onBack,
}: {
  value?: string;
  onOk: (image: string | undefined, name?: string) => void;
  onBack: () => void;
}) {
  const [folder, setFolder] = useState<string>();
  const [selected, setSelected] = useState<{ image?: string; name?: string }>({ image: value });
  const [removing, setRemoving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photos = useLiveQuery(() => db.images.orderBy('createdAt').reverse().toArray());

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const blob = await resizeImage(file);
    const id = uid();
    await db.images.put({ id, name: '', blob, createdAt: Date.now() });
    onOk(`u:${id}`);
  };

  const cells =
    folder === MY_PHOTOS
      ? (photos ?? []).map((p) => ({ image: `u:${p.id}`, name: '', id: p.id }))
      : pictograms.filter((p) => p.folder === folder).map((p) => ({ image: `p:${p.file}`, name: p.name, id: p.file }));

  return (
    <Page className="image-page">
      <TitleBar
        title={folder ?? 'Välj bild'}
        right={
          folder === MY_PHOTOS && (photos?.length ?? 0) > 0 ? (
            <button className="tb-text-btn" onClick={() => setRemoving(!removing)}>
              {removing ? 'Klar' : 'Ta bort'}
            </button>
          ) : undefined
        }
      />
      <div className="image-grid">
        {!folder && (
          <>
            <button
              className={`ig-cell no-image ${selected.image === undefined ? 'selected' : ''}`}
              onClick={() => setSelected({})}
              aria-label="Ingen bild"
            >
              <svg viewBox="0 0 60 60" width="70%" aria-hidden="true">
                <circle cx="30" cy="30" r="24" fill="none" stroke="#777" strokeWidth="5" />
                <line x1="13" y1="47" x2="47" y2="13" stroke="#777" strokeWidth="5" />
              </svg>
            </button>
            {FOLDERS.map((f) => (
              <button key={f} className="ig-cell folder-cell" onClick={() => setFolder(f)}>
                <FolderIcon images={pictograms.filter((p) => p.folder === f).slice(0, 4).map((p) => `p:${p.file}`)} />
                <span className="ig-label">{f}</span>
              </button>
            ))}
            <button className="ig-cell folder-cell" onClick={() => setFolder(MY_PHOTOS)}>
              <FolderIcon images={(photos ?? []).slice(0, 4).map((p) => `u:${p.id}`)} />
              <span className="ig-label">{MY_PHOTOS}</span>
            </button>
          </>
        )}
        {folder &&
          cells.map((c) => (
            <button
              key={c.id}
              className={`ig-cell ${selected.image === c.image ? 'selected' : ''} ${removing ? 'removing' : ''}`}
              onClick={() => {
                if (removing) db.images.delete(c.id);
                else setSelected({ image: c.image, name: c.name });
              }}
            >
              <Picture image={c.image} alt="" />
              {c.name && <span className="ig-label">{c.name}</span>}
              {removing && (
                <span className="ig-remove">
                  <Icon name="trash" size={22} />
                </span>
              )}
            </button>
          ))}
        {folder === MY_PHOTOS && photos?.length === 0 && <p className="empty">Tryck på kameran för att ta ett foto eller välja en bild.</p>}
      </div>
      {!folder && <p className="attribution">Bilder: Sergio Palao, ARASAAC (arasaac.org), CC BY-NC-SA. Aragoniens regering.</p>}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <BottomBar
        left={<BackButton onClick={() => (folder ? (setFolder(undefined), setRemoving(false)) : onBack())} />}
        center={
          <button className="bar-icon-btn" onClick={() => fileRef.current?.click()} aria-label="Ta foto eller välj bild">
            <Icon name="camera" size={34} />
          </button>
        }
        right={<OkButton onClick={() => onOk(selected.image, selected.name)} />}
      />
    </Page>
  );
}

/** "Välj kategori". */
export function CategoryPage({
  value,
  settings,
  onOk,
  onCancel,
}: {
  value?: CategoryId;
  settings: Settings;
  onOk: (c: CategoryId | undefined) => void;
  onCancel: () => void;
}) {
  const [sel, setSel] = useState(value);
  return (
    <Page>
      <TitleBar title="Välj kategori" />
      <div className="list">
        <ListRow icon={<span className="cat-circle" style={{ background: '#fff' }} />} label="Ingen kategori" selected={!sel} onClick={() => setSel(undefined)} />
        {CATEGORY_IDS.filter((c) => settings.categories[c].visible || c === value).map((c) => (
          <ListRow
            key={c}
            icon={<span className="cat-circle" style={{ background: CATEGORY_COLORS[c] }} />}
            label={settings.categories[c].name}
            selected={sel === c}
            onClick={() => setSel(c)}
          />
        ))}
      </div>
      <BottomBar left={<CloseButton onClick={onCancel} />} right={<OkButton onClick={() => onOk(sel)} />} />
    </Page>
  );
}

/** Lista där ett tryck väljer direkt ("Välj typ av aktivitet"). */
export function ChoicePage<T extends string>({
  title,
  options,
  value,
  onPick,
  onBack,
  footer,
}: {
  title: string;
  options: { value: T; label: string; icon?: ReactNode }[];
  value?: T;
  onPick: (v: T) => void;
  onBack: () => void;
  footer?: ReactNode;
}) {
  return (
    <Page>
      <TitleBar title={title} />
      <div className="list centered">
        {options.map((o) => (
          <ListRow key={o.value} icon={o.icon} label={o.label} selected={o.value === value} onClick={() => onPick(o.value)} />
        ))}
        {footer}
      </div>
      <BottomBar left={<BackButton onClick={onBack} />} />
    </Page>
  );
}
