/* Der wichtigste Knopf der App hat bis hierher keinen Test gehabt.

   Geprueft wird beides: dass eine Sicherung wirklich jeden Schluessel erfasst
   und unveraendert zurueckkommt, und dass eine beschaedigte Datei nichts
   anfasst. Der zweite Teil ist der wichtigere - ein Import, der "eingespielt"
   meldet und die Historie trotzdem leer laesst, ist schlimmer als eine
   Fehlermeldung. */

import { describe, it, expect } from 'vitest';
import { memoryAdapter, createRepos, KEYS } from '../src/data/storage.js';
import { exportAll, importAll, exportFilename, benenne, EINTRAEGE } from '../src/data/exportImport.js';

function vollerBestand(){
  return {
    [KEYS.startDate]:    '2026-08-15',
    [KEYS.apiKey]:       'icu-abc123',
    [KEYS.mapKey]:       'tf-xyz789',
    [KEYS.coreLog]:      JSON.stringify([{ id:'a', day:'2026-08-20', week:1, rounds:3, sets:24 }]),
    [KEYS.thresholds]:   JSON.stringify({ ftp:230, lthr:160, hrmax:186 }),
    [KEYS.testLog]:      JSON.stringify([{ day:'2026-08-18', week:1, w20:242, ftp:230 }]),
    [KEYS.interimLog]:   JSON.stringify([{ day:'2026-08-19', week:1, talkHr:138, rpe:4, note:'' }]),
    [KEYS.planOverride]: JSON.stringify({ schemaVersion:2, weeks:[] }),
    [KEYS.settings]:     JSON.stringify({ voice:false, keepAwake:true, showIllu:true, theme:'dark', mapStyle:'cycle' }),
    [KEYS.untergrund]:   JSON.stringify({ i123: { asphalt:0.9 } })
  };
}

const sicherung = data => ({ format:'trainingsplanRad-backup', version:1, data });

describe('Sicherung schreiben', () => {
  it('erfasst jeden bekannten Schluessel', async () => {
    const quelle = createRepos(memoryAdapter(vollerBestand()));
    const backup = await exportAll(quelle.store);
    expect(Object.keys(backup.data).sort()).toEqual(Object.values(KEYS).sort());
    expect(backup.format).toBe('trainingsplanRad-backup');
    expect(backup.version).toBe(1);
  });

  it('laesst weg, was gar nicht gespeichert ist', async () => {
    const quelle = createRepos(memoryAdapter({ [KEYS.coreLog]: '[]' }));
    const backup = await exportAll(quelle.store);
    expect(Object.keys(backup.data)).toEqual([KEYS.coreLog]);
  });

  it('benennt die Datei nach dem Tag', () => {
    expect(exportFilename(new Date(2026, 7, 29))).toBe('trainingsplan-sicherung-2026-08-29.json');
    expect(exportFilename(new Date(2026, 0, 5))).toBe('trainingsplan-sicherung-2026-01-05.json');
  });
});

describe('Sicherung einspielen', () => {
  it('kommt nach der JSON-Runde unveraendert zurueck', async () => {
    const bestand = vollerBestand();
    const quelle = createRepos(memoryAdapter(bestand));
    /* Wie im Betrieb: heruntergeladen, wieder eingelesen. */
    const datei = JSON.parse(JSON.stringify(await exportAll(quelle.store)));

    const ziel = createRepos(memoryAdapter({}));
    const r = await importAll(ziel.store, datei);
    expect(r.uebernommen.sort()).toEqual(Object.values(KEYS).sort());
    expect(r.geraeumt).toEqual([]);

    for(const key of Object.values(KEYS)){
      expect(await ziel.store.get(key)).toBe(bestand[key]);
    }
    /* Und ueber die Repos gelesen, nicht nur als Zeichenkette verglichen. */
    expect(await ziel.startDate()).toBe('2026-08-15');
    expect(await ziel.thresholds()).toEqual({ ftp:230, lthr:160, hrmax:186 });
    expect(await ziel.coreLog()).toHaveLength(1);
    expect(await ziel.testLog()).toHaveLength(1);
    expect(await ziel.interimLog()).toHaveLength(1);
    expect(await ziel.settings()).toEqual({ voice:false, keepAwake:true, showIllu:true, theme:'dark', mapStyle:'cycle' });
    expect(await ziel.planOverride()).toEqual({ schemaVersion:2, weeks:[] });
    expect(await ziel.untergrund()).toEqual({ i123: { asphalt:0.9 } });
  });

  it('raeumt, was in der Sicherung fehlt', async () => {
    /* Genau die drei Schluessel koennen im Betrieb geloescht werden und fehlen
       dann in der Datei. Blieben sie stehen, zeigte das Geraet eine Mischung
       aus zwei Staenden - der eigene Plan waere weiter aktiv, obwohl die
       Sicherung den Default-Plan gefahren hat. */
    const quelle = createRepos(memoryAdapter({ [KEYS.coreLog]: '[]', [KEYS.startDate]: '2026-08-15' }));
    const datei = await exportAll(quelle.store);

    const ziel = createRepos(memoryAdapter({
      [KEYS.coreLog]:      JSON.stringify([{ id:'alt' }]),
      [KEYS.startDate]:    '2025-01-01',
      [KEYS.planOverride]: JSON.stringify({ fremder: 'Plan' }),
      [KEYS.apiKey]:       'fremder-schluessel',
      [KEYS.mapKey]:       'fremder-kartenschluessel'
    }));
    const r = await importAll(ziel.store, datei);

    expect(r.uebernommen.sort()).toEqual([KEYS.coreLog, KEYS.startDate].sort());
    expect(r.geraeumt.sort()).toEqual([KEYS.apiKey, KEYS.mapKey, KEYS.planOverride].sort());
    expect(await ziel.store.get(KEYS.planOverride)).toBe(null);
    expect(await ziel.apiKey()).toBe('');
    expect(await ziel.mapKey()).toBe('');
    expect(await ziel.coreLog()).toEqual([]);
    expect(await ziel.startDate()).toBe('2026-08-15');
  });

  it('meldet nur, was tatsaechlich da war', async () => {
    const quelle = createRepos(memoryAdapter({ [KEYS.coreLog]: '[]' }));
    const ziel = createRepos(memoryAdapter({}));
    const r = await importAll(ziel.store, await exportAll(quelle.store));
    expect(r.geraeumt).toEqual([]);
  });

  it('nimmt eine Sicherung ohne Versionsfeld an', async () => {
    const ziel = createRepos(memoryAdapter({}));
    const r = await importAll(ziel.store, { format:'trainingsplanRad-backup', data:{ [KEYS.coreLog]: '[]' } });
    expect(r.uebernommen).toEqual([KEYS.coreLog]);
  });
});

describe('Beschaedigte Sicherung', () => {
  const unversehrt = async (datei) => {
    const ziel = createRepos(memoryAdapter(vollerBestand()));
    await expect(importAll(ziel.store, datei)).rejects.toThrow();
    for(const [k, v] of Object.entries(vollerBestand())){
      expect(await ziel.store.get(k)).toBe(v);
    }
  };

  it('weist ein fremdes Format ab', async () => {
    await unversehrt({ format:'was-anderes', data:{} });
    await unversehrt(null);
    await unversehrt('nur Text');
  });

  it('weist eine neuere Fassung ab', async () => {
    await unversehrt({ format:'trainingsplanRad-backup', version:99, data:{ [KEYS.coreLog]: '[]' } });
  });

  it('weist eine Datei ohne data-Objekt ab', async () => {
    await unversehrt({ format:'trainingsplanRad-backup', version:1 });
    await unversehrt({ format:'trainingsplanRad-backup', version:1, data:[] });
  });

  it('weist unbekannte Schluessel ab, statt sie zu ueberspringen', async () => {
    /* Ueberspringen waere hier gefaehrlich: was der Import nicht uebernimmt,
       wuerde er anschliessend raeumen. */
    await unversehrt(sicherung({ [KEYS.coreLog]: '[]', 'core-session-log-alt': '[]' }));
  });

  it('weist Werte ab, die nicht als Text in der Datei stehen', async () => {
    await unversehrt(sicherung({ [KEYS.coreLog]: '[]', [KEYS.thresholds]: { ftp:230 } }));
  });

  it('weist kaputtes JSON ab, statt Erfolg zu melden', async () => {
    /* Der eigentliche Grund fuer diese Datei: createRepos faengt den
       Parse-Fehler ab und liefert eine leere Liste - der Import haette also
       "eingespielt" gemeldet und die Historie waere weg gewesen. */
    await unversehrt(sicherung({ [KEYS.coreLog]: '[{kaputt' }));
  });

  it('weist die falsche Form ab', async () => {
    await unversehrt(sicherung({ [KEYS.coreLog]: '{"kein":"array"}' }));
    await unversehrt(sicherung({ [KEYS.testLog]: '"auch keine Liste"' }));
    await unversehrt(sicherung({ [KEYS.thresholds]: '[1,2,3]' }));
    await unversehrt(sicherung({ [KEYS.settings]: 'null' }));
    await unversehrt(sicherung({ [KEYS.startDate]: '15.08.2026' }));
  });

  it('nennt den beanstandeten Eintrag im Klartext', async () => {
    const ziel = createRepos(memoryAdapter({}));
    try {
      await importAll(ziel.store, sicherung({ [KEYS.coreLog]: '[{kaputt' }));
      throw new Error('haette werfen muessen');
    } catch(e){
      expect(e.titel).toMatch(/beschädigt/);
      expect(e.zeilen.join(' ')).toContain('Trainingsprotokolle');
      expect(e.zeilen.join(' ')).toContain('kein gültiges JSON');
    }
  });

  it('weist eine leere Sicherung ab', async () => {
    await unversehrt(sicherung({}));
  });
});

describe('Schluesseltabelle', () => {
  it('kennt jeden Schluessel mit Klarnamen und Pruefung', () => {
    /* Faellt, sobald KEYS einen Eintrag bekommt, den die Sicherung nicht
       kennt - dann wuerde er beim Einspielen die ganze Datei abweisen. */
    expect(Object.keys(EINTRAEGE).sort()).toEqual(Object.values(KEYS).sort());
    for(const k of Object.values(KEYS)) expect(typeof benenne(k)).toBe('string');
  });
});
