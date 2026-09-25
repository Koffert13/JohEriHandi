import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon.tsx';

/** Helskärmssida med innehåll och knapprad. */
export function Page({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={`page ${className ?? ''}`}>{children}</div>;
}

/** Blå rubrikrad ("Välj bild", "Kalendermenyn"). */
export function TitleBar({ title, icon, right, variant }: { title: string; icon?: ReactNode; right?: ReactNode; variant?: 'yellow' }) {
  return (
    <header className={`title-bar ${variant ?? ''}`}>
      {icon && <span className="tb-icon">{icon}</span>}
      <h1>{title}</h1>
      {right && <span className="tb-right">{right}</span>}
    </header>
  );
}

/** Blå knapprad längst ned med tre zoner: vänster, mitten, höger. */
export function BottomBar({ left, center, right }: { left?: ReactNode; center?: ReactNode; right?: ReactNode }) {
  return (
    <nav className="bottom-bar">
      <div className="bb-left">{left}</div>
      <div className="bb-center">{center}</div>
      <div className="bb-right">{right}</div>
    </nav>
  );
}

/** Rund mörkblå knapp. */
export function RoundButton({
  onClick,
  label,
  icon,
  text,
  disabled,
}: {
  onClick: () => void;
  label: string;
  icon?: IconName;
  text?: string;
  disabled?: boolean;
}) {
  return (
    <button className="round-btn" onClick={onClick} aria-label={label} disabled={disabled}>
      {icon ? <Icon name={icon} size={24} stroke={2.6} /> : <span className="rb-text">{text}</span>}
    </button>
  );
}

/** Knapp utan cirkel i knappraden. */
export function BarIconButton({
  onClick,
  label,
  children,
  hidden,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  hidden?: boolean;
}) {
  return (
    <button className="bar-icon-btn" onClick={onClick} aria-label={label} style={hidden ? { visibility: 'hidden' } : undefined}>
      {children}
    </button>
  );
}

export const BackButton = ({ onClick }: { onClick: () => void }) => <RoundButton onClick={onClick} label="Tillbaka" icon="left" />;
export const OkButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <RoundButton onClick={onClick} label="OK" text="OK" disabled={disabled} />
);
export const CloseButton = ({ onClick }: { onClick: () => void }) => <RoundButton onClick={onClick} label="Avbryt" icon="close" />;

/** Vit rad i en lista (Kalendermenyn, Välj typ av aktivitet …). */
export function ListRow({
  icon,
  label,
  sub,
  onClick,
  selected,
  chevron,
  right,
}: {
  icon?: ReactNode;
  label: ReactNode;
  sub?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  chevron?: boolean;
  right?: ReactNode;
}) {
  return (
    <button className={`list-row ${selected ? 'selected' : ''}`} onClick={onClick} aria-pressed={selected}>
      {icon && <span className="lr-icon">{icon}</span>}
      <span className="lr-label">
        {sub && <small>{sub}</small>}
        <span>{label}</span>
      </span>
      {right}
      {chevron && (
        <span className="lr-chevron">
          <Icon name="right" size={20} />
        </span>
      )}
    </button>
  );
}

/** Grå knapp i Ändravyn. */
export function GreyButton({ children, onClick, className, placeholder }: { children?: ReactNode; onClick: () => void; className?: string; placeholder?: string }) {
  return (
    <button className={`grey-btn ${className ?? ''}`} onClick={onClick}>
      {children ?? <span className="placeholder">{placeholder}</span>}
    </button>
  );
}

/** Rader i inställningssidor. */
export function SettingsGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="settings-group">
      {title && <h3>{title}</h3>}
      <div className="sg-box">{children}</div>
    </section>
  );
}

export function CheckRow({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="check-row" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span className="cr-mark">{checked && <Icon name="check" size={18} stroke={3} />}</span>
      <span>{label}</span>
    </button>
  );
}

export function RadioRow({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: () => void }) {
  return (
    <button className="radio-row" role="radio" aria-checked={checked} onClick={onChange}>
      <span className={`rr-mark ${checked ? 'on' : ''}`} />
      <span>{label}</span>
    </button>
  );
}

/** Siffertangentbord som i Handi (1–5, 6–0, C). */
export function NumPad({ onDigit, onClear }: { onDigit: (d: string) => void; onClear: () => void }) {
  return (
    <div className="numpad">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => (
        <button key={d} onClick={() => onDigit(d)}>
          {d}
        </button>
      ))}
      <button className="np-clear" onClick={onClear}>
        C
      </button>
    </div>
  );
}

/** Ja/Nej-dialog i helskärm. */
export function ConfirmPage({
  title,
  children,
  yes = 'JA',
  no = 'NEJ',
  onYes,
  onNo,
}: {
  title: string;
  children?: ReactNode;
  yes?: string;
  no?: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <Page className="confirm-page">
      <div className="cp-body">
        <h2>{title}</h2>
        <div className="cp-content">{children}</div>
      </div>
      <BottomBar
        left={
          <button className="bar-text-btn" onClick={onNo}>
            {no}
          </button>
        }
        right={
          <button className="bar-text-btn" onClick={onYes}>
            {yes}
          </button>
        }
      />
    </Page>
  );
}
