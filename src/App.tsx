import { useEffect } from 'react';
import { cleanup } from './activities.ts';
import { requestPersistence } from './db.ts';
import { today, useWakeLock } from './hooks.ts';
import { NavProvider, useNav } from './nav.tsx';
import { useSettings, type Settings } from './settings.ts';
import { ActivityScreen } from './views/ActivityScreen.tsx';
import { BaseActivitiesScreen, BaseTimersScreen } from './views/BaseScreens.tsx';
import { CalendarScreen } from './views/Calendar.tsx';
import { EditScreen } from './views/EditFlow.tsx';
import { ClockScreen, MenuScreen, SearchFlow, TimerScreen, TimerStartFlow } from './views/MenuScreens.tsx';
import { Onboarding } from './views/Onboarding.tsx';
import { SettingsScreen } from './views/SettingsScreens.tsx';

export function App() {
  const settings = useSettings();
  useEffect(() => {
    requestPersistence();
    cleanup();
  }, []);
  useWakeLock(!!settings?.keepAwake);
  if (!settings) return null;
  if (!settings.onboarded) return <Onboarding />;
  return (
    <NavProvider initialDay={today()} initialTab={settings.startView}>
      <Screens settings={settings} />
    </NavProvider>
  );
}

function Screens({ settings }: { settings: Settings }) {
  const { screen: s, day, setDay, setTab } = useNav();
  // Ny startvy i inställningarna gäller direkt.
  useEffect(() => setTab(settings.startView), [settings.startView, setTab]);
  // Byt till nästa dag vid midnatt om man tittar på idag.
  useEffect(() => {
    let last = today();
    const id = setInterval(() => {
      const t = today();
      if (t !== last) {
        if (day === last) setDay(t);
        last = t;
        cleanup();
      }
    }, 30000);
    return () => clearInterval(id);
  }, [day, setDay]);

  switch (s.name) {
    case 'calendar':
      return <CalendarScreen settings={settings} />;
    case 'activity':
      return <ActivityScreen key={`${s.id}${s.date}`} id={s.id} date={s.date} settings={settings} />;
    case 'edit':
      return <EditScreen key={s.id ?? 'new'} id={s.id} date={s.date} settings={settings} />;
    case 'timer':
      return <TimerScreen id={s.id} settings={settings} />;
    case 'timerStart':
      return <TimerStartFlow settings={settings} />;
    case 'clock':
      return <ClockScreen settings={settings} />;
    case 'menu':
      return <MenuScreen settings={settings} />;
    case 'search':
      return <SearchFlow />;
    case 'settings':
      return <SettingsScreen settings={settings} />;
    case 'baseActivities':
      return <BaseActivitiesScreen settings={settings} />;
    case 'baseTimers':
      return <BaseTimersScreen settings={settings} />;
  }
}
