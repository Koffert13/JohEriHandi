/** Ikoner i Handi-stil. Linjeikoner ärver textfärgen. */
const LINE = {
  left: 'M15 4l-8 8 8 8',
  right: 'M9 4l8 8-8 8',
  plus: 'M12 4v16M4 12h16',
  close: 'M5 5l14 14M19 5L5 19',
  check: 'M3 12.5l6 6L21 5.5',
  trash: 'M3.5 6h17M9 6V3.5h6V6M5.5 6l1 15h11l1-15M10 10v8M14 10v8',
  edit: 'M4 4h11v3M4 4v16h14v-6M9 16l1-4 8.5-8.5 3 3L13 15l-4 1z',
  play: 'M7 4l13 8-13 8z',
  stop: 'M6 6h12v12H6z',
  camera: 'M3 8h4l2-3h6l2 3h4v11H3zM12 10a3.5 3.5 0 100 7 3.5 3.5 0 000-7z',
  up: 'M12 20V5M5 11l7-7 7 7',
  down: 'M12 4v15M5 13l7 7 7-7',
  search: 'M10 3a7 7 0 100 14 7 7 0 000-14zM15 15l6 6',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 118 0v4',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3',
  info: 'M12 10v8M12 6.5v.5',
  download: 'M12 3v12M7 10l5 5 5-5M4 20h16',
  upload: 'M12 21V9M7 14l5-5 5 5M4 4h16',
  share: 'M12 3v12M7 8l5-5 5 5M5 12v8h14v-8',
  folder: 'M3 6h6l2 2h10v11H3z',
} as const;

export type IconName = keyof typeof LINE;

export function Icon({ name, size = 28, stroke = 2.2 }: { name: IconName; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={LINE[name]} />
    </svg>
  );
}

/** Bläddra-pil med siffra (1 = dag, 7 = vecka, 30 = månad). */
export function StepArrow({ dir, label, size = 40 }: { dir: 'prev' | 'next'; label: string; size?: number }) {
  const d = dir === 'prev' ? 'M2 20L14 6h26v28H14z' : 'M40 20L28 6H2v28h26z';
  const tx = dir === 'prev' ? 26 : 16;
  return (
    <svg width={size} height={size} viewBox="0 0 42 40" aria-hidden="true">
      <path d={d} fill="#fff" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#0b4c86" strokeWidth="1" transform="translate(0 0)" />
      <text x={tx} y="26.5" textAnchor="middle" fontSize={label.length > 1 ? 15 : 19} fontWeight="800" fill="#0b4c86" fontStyle="italic">
        {label}
      </text>
    </svg>
  );
}

/** "idag"-knappen: cirkelpil med texten idag. */
export function TodayIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 13A14 14 0 1 1 6 22" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M3 8l5 6 6-4" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="21" y="25" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
        idag
      </text>
    </svg>
  );
}

/** Kalendermeny-knappen: en lista i en ram. */
export function MenuIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="10" y="4" width="20" height="32" rx="3" fill="none" stroke="#fff" strokeWidth="2.5" />
      {[11, 17, 23, 29].map((y) => (
        <line key={y} x1="14" x2="26" y1={y} y2={y} stroke="#fff" strokeWidth="2.5" />
      ))}
    </svg>
  );
}

/** Kvittera-ikon: bock i en ruta. Överstruken när aktiviteten inte är kvitterbar. */
export function CheckableIcon({ on, size = 32 }: { on: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="4" width="24" height="24" rx="4" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path d="M9 16l5 5 9-11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {!on && <line x1="3" y1="29" x2="29" y2="3" stroke="#fff" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

export type TabIconName = 'timeline' | 'list' | 'week' | 'month';

/** Flikikonerna under datumraden. */
export function TabIcon({ name, size = 30 }: { name: TabIconName; size?: number }) {
  const c = 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      {name === 'timeline' && (
        <>
          <line x1="15" y1="2" x2="15" y2="28" stroke={c} strokeWidth="2.5" />
          <line x1="8" y1="10" x2="22" y2="10" stroke={c} strokeWidth="2.5" />
          <circle cx="15" cy="16" r="1.8" fill={c} />
          <circle cx="15" cy="21" r="1.8" fill={c} />
        </>
      )}
      {name === 'list' &&
        [7, 12, 17, 22].map((y, i) => <line key={y} x1="4" x2={i === 3 ? 18 : 26} y1={y} y2={y} stroke={c} strokeWidth="2.5" />)}
      {(name === 'week' || name === 'month') && (
        <>
          <rect x="3" y="5" width="24" height="21" rx="2" fill="none" stroke={c} strokeWidth="2.5" />
          <line x1="3" y1="11" x2="27" y2="11" stroke={c} strokeWidth="2.5" />
          <line x1="9" y1="3" x2="9" y2="7" stroke={c} strokeWidth="2.5" />
          <line x1="21" y1="3" x2="21" y2="7" stroke={c} strokeWidth="2.5" />
          {name === 'week' && <line x1="7" y1="18" x2="23" y2="18" stroke={c} strokeWidth="2.5" strokeDasharray="2 2" />}
          {name === 'month' &&
            [15, 19, 23].map((y) => [7, 12, 17, 22].map((x) => <rect key={`${x}-${y}`} x={x - 1} y={y - 1} width="2.4" height="2.4" fill={c} />))}
        </>
      )}
    </svg>
  );
}

export type MenuIconName = 'addActivity' | 'startTimer' | 'clock' | 'search' | 'baseActivities' | 'baseTimers' | 'settings' | 'backup';

/** Färgade ikoner i Kalendermenyn. */
export function ColorIcon({ name, size = 44 }: { name: MenuIconName; size?: number }) {
  const face = (cx: number, cy: number, r: number, fill: string) => (
    <>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#555" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r - 3} fill="#fff" />
      <line x1={cx} y1={cy} x2={cx} y2={cy - r + 6} stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + r - 7} y2={cy + 2} stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="1.8" fill="#d8262c" />
    </>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      {name === 'addActivity' && (
        <>
          {face(20, 25, 16, '#f07c6c')}
          <path d="M30 4l10 0-3 3 6 6-3 3-6-6-3 3z" fill="#f5c400" stroke="#8a6d00" strokeWidth="1" />
        </>
      )}
      {name === 'startTimer' && (
        <>
          <rect x="6" y="4" width="32" height="36" rx="6" fill="#c9ccd1" stroke="#666" strokeWidth="1.5" />
          {face(22, 24, 12, '#e6e6e6')}
        </>
      )}
      {name === 'clock' && face(22, 22, 19, '#f2f2f2')}
      {name === 'search' && (
        <>
          {face(18, 24, 15, '#9dbbe0')}
          <circle cx="29" cy="14" r="8" fill="#cfe6ff" fillOpacity="0.6" stroke="#2a6db5" strokeWidth="3" />
          <line x1="35" y1="20" x2="41" y2="26" stroke="#2a6db5" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {(name === 'baseActivities' || name === 'baseTimers') && (
        <>
          <rect x="7" y="6" width="30" height="36" rx="3" fill="#a0632e" stroke="#5d3510" strokeWidth="1.5" />
          <rect x="15" y="3" width="14" height="7" rx="2" fill="#b9b9b9" stroke="#555" />
          {face(22, 26, 11, name === 'baseActivities' ? '#f07c6c' : '#c9ccd1')}
        </>
      )}
      {name === 'settings' && (
        <>
          <path
            d="M22 4l3 5 6-2 1 6 6 1-2 6 5 3-5 3 2 6-6 1-1 6-6-2-3 5-3-5-6 2-1-6-6-1 2-6-5-3 5-3-2-6 6-1 1-6 6 2z"
            fill="#b5b8bd"
            stroke="#6b6e73"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="22" cy="22" r="7" fill="#e8e9eb" stroke="#6b6e73" strokeWidth="1.5" />
        </>
      )}
      {name === 'backup' && (
        <>
          <rect x="6" y="6" width="32" height="32" rx="4" fill="#5b8fd1" stroke="#2b5a95" strokeWidth="1.5" />
          <rect x="12" y="6" width="20" height="12" fill="#e8eef7" />
          <rect x="12" y="25" width="20" height="13" fill="#fff" />
        </>
      )}
    </svg>
  );
}
