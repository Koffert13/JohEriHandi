import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { YMD } from './domain/index.ts';
import type { CalendarTab } from './settings.ts';

export type Screen =
  | { name: 'calendar' }
  | { name: 'activity'; id: string; date: YMD }
  | { name: 'edit'; id?: string; date: YMD }
  | { name: 'timer'; id: string }
  | { name: 'timerStart' }
  | { name: 'clock' }
  | { name: 'menu' }
  | { name: 'search' }
  | { name: 'settings' }
  | { name: 'baseActivities' }
  | { name: 'baseTimers' };

interface Nav {
  screen: Screen;
  push: (s: Screen) => void;
  back: () => void;
  /** Gå tillbaka till kalendern, eventuellt vidare till en ny skärm. */
  home: (next?: Screen) => void;
  /** Vald dag i kalendern. */
  day: YMD;
  setDay: (d: YMD) => void;
  /** Vald kalendervy (flik). */
  tab: CalendarTab;
  setTab: (t: CalendarTab) => void;
}

const NavContext = createContext<Nav | null>(null);

/** Enkel skärmstack i minnet. Appen har egna tillbaka-knappar på varje skärm. */
export function NavProvider({ initialDay, initialTab, children }: { initialDay: YMD; initialTab: CalendarTab; children: ReactNode }) {
  const [stack, setStack] = useState<Screen[]>([{ name: 'calendar' }]);
  const [day, setDay] = useState<YMD>(initialDay);
  const [tab, setTab] = useState<CalendarTab>(initialTab);

  const push = useCallback((s: Screen) => {
    setStack((prev) => [...prev, s]);
    window.scrollTo(0, 0);
  }, []);

  const back = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  const home = useCallback((next?: Screen) => {
    setStack((s) => (next ? [s[0], next] : [s[0]]));
    window.scrollTo(0, 0);
  }, []);

  const value = useMemo(
    () => ({ screen: stack[stack.length - 1], push, back, home, day, setDay, tab, setTab }),
    [stack, push, back, home, day, tab],
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const n = useContext(NavContext);
  if (!n) throw new Error('useNav utanför NavProvider');
  return n;
}
