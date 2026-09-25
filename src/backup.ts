import { db } from './db.ts';

interface BackupFile {
  app: 'handi-webapp';
  version: 1;
  exportedAt: string;
  tables: Record<string, unknown[]>;
}

const TABLES = ['activities', 'timers', 'baseActivities', 'baseTimers', 'kv'] as const;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob();
}

/** Skapar en JSON-fil med all data, inklusive egna foton. */
export async function exportBackup(): Promise<Blob> {
  const tables: BackupFile['tables'] = {};
  for (const t of TABLES) tables[t] = await db.table(t).toArray();
  const images = await db.images.toArray();
  tables.images = await Promise.all(images.map(async (i) => ({ ...i, blob: await blobToDataUrl(i.blob) })));
  const file: BackupFile = { app: 'handi-webapp', version: 1, exportedAt: new Date().toISOString(), tables };
  return new Blob([JSON.stringify(file)], { type: 'application/json' });
}

/** Ersätter all data med innehållet i en säkerhetskopia. */
export async function importBackup(file: File): Promise<void> {
  const data = JSON.parse(await file.text()) as BackupFile;
  if (data.app !== 'handi-webapp' || !data.tables) throw new Error('Filen är inte en säkerhetskopia från den här appen.');
  const images = await Promise.all(
    ((data.tables.images ?? []) as { blob: string }[]).map(async (i) => ({ ...i, blob: await dataUrlToBlob(i.blob) })),
  );
  await db.transaction('rw', [...TABLES.map((t) => db.table(t)), db.images], async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      await db.table(t).bulkPut(data.tables[t] ?? []);
    }
    await db.images.clear();
    await db.images.bulkPut(images as never[]);
  });
}

export async function downloadBackup(): Promise<void> {
  const blob = await exportBackup();
  const name = `kalender-sakerhetskopia-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  // På iPhone öppnas dela-menyn så att filen kan sparas i Filer eller skickas.
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Säkerhetskopia' });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
