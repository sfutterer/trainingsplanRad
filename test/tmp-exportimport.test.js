import { describe, it, expect } from 'vitest';
import { memoryAdapter, createRepos, KEYS } from '../src/data/storage.js';
import { exportAll, importAll, exportFilename } from '../src/data/exportImport.js';

function vollerBestand(){
  return {
    [KEYS.startDate]: '2026-08-15',
    [KEYS.apiKey]: 'abc123',
    [KEYS.mapKey]: 'tf-key',
    [KEYS.coreLog]: JSON.stringify([{ date:'2026-08-20', level:2 }]),
    [KEYS.thresholds]: JSON.stringify({ ftp:230, lthr:160, hrmax:186 }),
    [KEYS.testLog]: JSON.stringify([{ date:'2026-08-18', ftp:230 }]),
    [KEYS.interimLog]: JSON.stringify([{ date:'2026-08-19', gewicht:82 }]),
    [KEYS.planOverride]: JSON.stringify({ schemaVersion:2, weeks:[] }),
    [KEYS.settings]: JSON.stringify({ voice:false, keepAwake:true, showIllu:true, theme:'dark', mapStyle:'cycle' }),
    [KEYS.untergrund]: JSON.stringify({ i1: { asphalt: 0.9 } })
  };
}

describe('Sicherung', () => {
  it('erfasst jeden bekannten Schluessel', async () => {
    const quelle = createRepos(memoryAdapter(vollerBestand()));
    const backup = await exportAll(quelle.store);
    expect(Object.keys(backup.data).sort()).toEqual(Object.values(KEYS).sort());
    expect(backup.format).toBe('trainingsplanRad-backup');
    expect(backup.version).toBe(1);
  });

  it('kommt nach JSON-Runde unveraendert zurueck', async () => {
    const bestand = vollerBestand();
    const quelle = createRepos(memoryAdapter(bestand));
    const datei = JSON.parse(JSON.stringify(await exportAll(quelle.store)));

    const ziel = createRepos(memoryAdapter({}));
    const k = await importAll(ziel.store, datei);
    expect(k.sort()).toEqual(Object.values(KEYS).sort());

    for(const key of Object.values(KEYS)){
      expect(await ziel.store.get(key)).toBe(bestand[key]);
    }
    expect(await ziel.thresholds()).toEqual({ ftp:230, lthr:160, hrmax:186 });
    expect(await ziel.settings()).toEqual({ voice:false, keepAwake:true, showIllu:true, theme:'dark', mapStyle:'cycle' });
    expect(await ziel.coreLog()).toEqual([{ date:'2026-08-20', level:2 }]);
    expect(await ziel.planOverride()).toEqual({ schemaVersion:2, weeks:[] });
  });

  it('laesst fehlende Schluessel im Ziel stehen', async () => {
    const quelle = createRepos(memoryAdapter({ [KEYS.coreLog]: '[]' }));
    const datei = await exportAll(quelle.store);
    const ziel = createRepos(memoryAdapter({
      [KEYS.planOverride]: JSON.stringify({ alt: true }),
      [KEYS.apiKey]: 'fremder-schluessel'
    }));
    await importAll(ziel.store, datei);
    // Dokumentiert das Ist-Verhalten: Import ist ein Merge, kein Ersetzen.
    expect(await ziel.store.get(KEYS.planOverride)).toBe(JSON.stringify({ alt: true }));
    expect(await ziel.store.get(KEYS.apiKey)).toBe('fremder-schluessel');
  });

  it('weist fremde Dateien ab, ohne zu schreiben', async () => {
    const ziel = createRepos(memoryAdapter({ [KEYS.coreLog]: 'ALT' }));
    await expect(importAll(ziel.store, { format:'was-anderes' })).rejects.toThrow();
    await expect(importAll(ziel.store, null)).rejects.toThrow();
    await expect(importAll(ziel.store, { format:'trainingsplanRad-backup', version:99, data:{} })).rejects.toThrow();
    await expect(importAll(ziel.store, { format:'trainingsplanRad-backup', version:1, data:{ fremd:'x' } })).rejects.toThrow();
    expect(await ziel.store.get(KEYS.coreLog)).toBe('ALT');
  });

  it('nimmt eine Sicherung ohne Versionsfeld an', async () => {
    const ziel = createRepos(memoryAdapter({}));
    const k = await importAll(ziel.store, { format:'trainingsplanRad-backup', data:{ [KEYS.coreLog]: '[]' } });
    expect(k).toEqual([KEYS.coreLog]);
  });

  it('benennt die Datei nach dem Tag', () => {
    expect(exportFilename(new Date(2026, 7, 29))).toBe('trainingsplan-sicherung-2026-08-29.json');
  });
});
