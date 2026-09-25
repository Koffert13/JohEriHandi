import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DEFAULT_TZ, ymdAt, type YMD } from './domain/index.ts';
import { db } from './db.ts';

export const TZ = DEFAULT_TZ;

/** Aktuell tid, uppdateras regelbundet. */
export function useNow(intervalMs = 10000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    const onVisible = () => document.visibilityState === 'visible' && setNow(Date.now());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
  return now;
}

export function today(): YMD {
  return ymdAt(Date.now(), TZ);
}

/** Objekt-URL för en bildreferens ("p:<fil>" eller "u:<id>"). */
export function useImageUrl(ref: string | undefined): string | undefined {
  const blob = useLiveQuery(async () => {
    if (!ref?.startsWith('u:')) return undefined;
    return (await db.images.get(ref.slice(2)))?.blob;
  }, [ref]);
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (ref?.startsWith('p:')) return `${import.meta.env.BASE_URL}pictograms/${ref.slice(2)}`;
  return url;
}

/** Håller skärmen tänd när appen är öppen (om inställt). */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    const acquire = async () => {
      try {
        if (document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen');
      } catch {
        // Nekas t.ex. i lågströmsläge.
      }
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      document.removeEventListener('visibilitychange', acquire);
      lock?.release().catch(() => {});
    };
  }, [enabled]);
}
