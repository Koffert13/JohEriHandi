import { useState } from 'react';
import { BottomBar, ListRow, Page, TitleBar } from '../components/handi.tsx';
import { updateSettings } from '../settings.ts';
import { installStarterSet } from '../starter.ts';

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Första start: lägg på hemskärmen och lägg in startuppsättning (handbok 3.3). */
export function Onboarding() {
  const [step, setStep] = useState(isStandalone() ? 1 : 0);
  const [busy, setBusy] = useState(false);
  const finish = async (starter: boolean) => {
    setBusy(true);
    if (starter) await installStarterSet();
    await updateSettings({ onboarded: true });
  };
  return (
    <Page className="onboarding">
      <TitleBar title="Välkommen" />
      <div className="ob-body">
        {step === 0 ? (
          <>
            <p>Lägg kalendern på hemskärmen, så öppnas den i helskärm som en vanlig app.</p>
            <p>
              <strong>iPhone:</strong> tryck på dela-knappen <span aria-hidden="true">⬆︎</span> i Safari och välj <em>Lägg till på hemskärmen</em>.
            </p>
            <p>
              <strong>Android:</strong> tryck på ⋮ i Chrome och välj <em>Installera app</em>.
            </p>
            <div className="list centered">
              <ListRow label="Fortsätt" chevron onClick={() => setStep(1)} />
            </div>
          </>
        ) : (
          <>
            <p>Lägg in startuppsättning med bildarkiv, basaktiviteter, bastimers och checklistor?</p>
            <div className="list centered">
              <ListRow label="Ja, lägg in startuppsättning" onClick={() => !busy && finish(true)} />
              <ListRow label="Nej, börja med tom kalender" onClick={() => !busy && finish(false)} />
            </div>
          </>
        )}
      </div>
      <BottomBar />
    </Page>
  );
}
