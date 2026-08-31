/* Die Meldungen der Glocke.

   Die eigentliche Frage ist nicht, ob der Text stimmt, sondern ob eine Meldung
   genau einmal erscheint. "Einmal taeglich" haengt allein daran, dass die
   Kennung stabil ist: dieselbe Lage am selben Tag muss dieselbe Kennung
   ergeben, ein neuer Tag eine neue. Waere sie es nicht, kaeme die Meldung von
   heute Morgen nach jedem Neustart zurueck - und ein Filter ueber gelesene
   Kennungen faenge sie nie.

   Gebaut wird gegen den ausgelieferten Plan und den echten Planbeginn, damit
   die Wochentage stimmen: Woche 1 beginnt am Samstag, dem 15.08.2026. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createPlan } from '../src/domain/plan.js';
import { dayFromIso, tagPlus } from '../src/domain/week.js';
import { buildReport } from '../src/domain/analysis.js';
import { trainingsMeldung, gateMeldung, zielMeldungen, baueMeldungen,
         offeneMeldungen, RUECKSCHAU_TAGE } from '../src/domain/meldungen.js';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);
const START = dayFromIso('2026-08-15');   // Samstag, Woche 1
const TH = { ftp: 212, lthr: 163, hrmax: 187 };

const SA = dayFromIso('2026-08-15');   // lange Ausfahrt
const MO = dayFromIso('2026-08-17');   // Ruhetag
const MI = dayFromIso('2026-08-19');   // Gate: Vorschau
const DO = dayFromIso('2026-08-20');   // Gate: Entscheidung

/* Ein rotes Gate von Hand, so wie wellnessSerie es liefert. */
function serieRot(tag, zweiRot){
  return {
    heute: { rot: true, gruende: ['Ruhepuls 58 bpm, 7-Tage-Schnitt 50'], heute: { id: tag } },
    gestern: null, zweiRot: !!zweiRot, abnehmen: null
  };
}

describe('trainingsMeldung', () => {
  it('nennt Titel und Eckwerte des Tages', () => {
    const m = trainingsMeldung(plan, TH, SA, START);
    expect(m.art).toBe('training');
    expect(m.ton).toBe('info');
    expect(m.titel).toBeTruthy();
    expect(m.zeilen.length).toBeGreaterThan(0);
  });

  it('traegt Tag und Art in der Kennung - sie ist der Zaehler fuer einmal taeglich', () => {
    expect(trainingsMeldung(plan, TH, SA, START).id).toBe('training:2026-08-15');
    expect(trainingsMeldung(plan, TH, MO, START).id).toBe('training:2026-08-17');
  });

  it('bleibt bei zweimaligem Bauen dieselbe Meldung', () => {
    const a = trainingsMeldung(plan, TH, DO, START);
    const b = trainingsMeldung(plan, TH, dayFromIso('2026-08-20'), START);
    expect(a.id).toBe(b.id);
    expect(a.titel).toBe(b.titel);
  });

  it('schweigt vor dem Planbeginn - dort gibt es keine Vorgabe', () => {
    expect(trainingsMeldung(plan, TH, dayFromIso('2026-08-10'), START)).toBe(null);
  });

  it('meldet auch den Ruhetag: die Frage lautet, was ansteht, nicht was wehtut', () => {
    expect(trainingsMeldung(plan, TH, MO, START)).not.toBe(null);
  });
});

describe('gateMeldung', () => {
  it('bleibt still, solange das Gate gruen ist oder fehlt', () => {
    expect(gateMeldung(null, plan, TH, DO, START)).toBe(null);
    const gruen = { heute: { rot: false, gruende: [], heute: { id: '2026-08-20' } }, zweiRot: false };
    expect(gateMeldung(gruen, plan, TH, DO, START)).toBe(null);
  });

  it('nennt am Donnerstag die Gruende und die Massnahmen', () => {
    const m = gateMeldung(serieRot('2026-08-20'), plan, TH, DO, START);
    expect(m.id).toBe('gate:2026-08-20');
    expect(m.ton).toBe('warn');
    expect(m.zeilen[0]).toContain('Ruhepuls');
    expect(m.zeilen.length).toBeGreaterThan(1);
  });

  it('sagt am Mittwoch dazu, dass der Wert von morgen frueh entscheidet', () => {
    const m = gateMeldung(serieRot('2026-08-19'), plan, TH, MI, START);
    expect(m.titel).toContain('Stand heute');
    expect(m.zeilen.join(' ')).toContain('morgen früh');
  });

  it('nennt an einem Tag ohne Gate-Rolle nur die Gruende', () => {
    /* Am Montag entscheidet nichts ueber den Donnerstag. Ein erhoehter
       Ruhepuls ist trotzdem eine Nachricht - "Donnerstag wird 60 min Z2"
       waere dort eine Anweisung ins Blaue. */
    const m = gateMeldung(serieRot('2026-08-17'), plan, TH, MO, START);
    expect(m.zeilen).toHaveLength(1);
    expect(m.titel).toBe('Wellness-Gate rot');
  });

  it('zieht den zweiten roten Tag in die Massnahmen', () => {
    const m = gateMeldung(serieRot('2026-08-20', true), plan, TH, DO, START);
    expect(m.zeilen.join(' ')).toContain('Erholungswoche fahren');
  });
});

describe('zielMeldungen', () => {
  /* Die lange Ausfahrt am Samstag, einmal ohne jede Aufzeichnung. */
  const ohneFahrt = () => buildReport(plan, TH, START, SA, SA, [], null, []);

  it('meldet einen ausgefallenen Tag', () => {
    const m = zielMeldungen(ohneFahrt());
    expect(m).toHaveLength(1);
    expect(m[0].id).toBe('ziel:2026-08-15');
    expect(m[0].ton).toBe('warn');
    expect(m[0].zeilen.length).toBeGreaterThan(0);
  });

  it('schweigt zu einem erfuellten Tag', () => {
    const soll = ohneFahrt()[0].plan.target.minutes;
    const fahrt = { id: 'a1', type: 'Ride', start_date_local: '2026-08-15T09:00:00',
                    moving_time: soll * 60, elapsed_time: soll * 60, distance: soll * 350 };
    const rows = buildReport(plan, TH, START, SA, SA, [fahrt], null, []);
    expect(zielMeldungen(rows)).toEqual([]);
  });

  it('laesst Tage vor dem Planbeginn aus', () => {
    const vor = dayFromIso('2026-08-08');
    const rows = buildReport(plan, TH, START, vor, vor, [], null, []);
    expect(zielMeldungen(rows)).toEqual([]);
  });

  it('stellt den juengsten Tag nach oben', () => {
    const m = zielMeldungen(buildReport(plan, TH, START, SA, DO, [], null, []));
    expect(m.length).toBeGreaterThan(1);
    expect(m[0].tag > m[m.length - 1].tag).toBe(true);
  });

  it('gibt je Tag genau eine Meldung', () => {
    const m = zielMeldungen(buildReport(plan, TH, START, SA, DO, [], null, []));
    expect(new Set(m.map(x => x.id)).size).toBe(m.length);
  });
});

describe('baueMeldungen', () => {
  const rows = () => buildReport(plan, TH, START, SA, SA, [], null, []);

  it('stellt das rote Gate voran und die Tagesmeldung ans Ende', () => {
    const liste = baueMeldungen({ plan, th: TH, heute: DO, startDate: START,
                                  serie: serieRot('2026-08-20'), rows: rows() });
    expect(liste[0].art).toBe('gate');
    expect(liste[liste.length - 1].art).toBe('training');
  });

  it('kommt ohne Wellness und ohne Aufzeichnungen aus', () => {
    const liste = baueMeldungen({ plan, th: TH, heute: DO, startDate: START,
                                  serie: null, rows: null });
    expect(liste.map(m => m.art)).toEqual(['training']);
  });

  it('ergibt zweimal hintereinander dieselben Kennungen', () => {
    const eins = baueMeldungen({ plan, th: TH, heute: DO, startDate: START,
                                 serie: serieRot('2026-08-20'), rows: rows() });
    const zwei = baueMeldungen({ plan, th: TH, heute: DO, startDate: START,
                                 serie: serieRot('2026-08-20'), rows: rows() });
    expect(eins.map(m => m.id)).toEqual(zwei.map(m => m.id));
  });
});

describe('offeneMeldungen', () => {
  const liste = [{ id: 'training:2026-08-20' }, { id: 'gate:2026-08-20' }];

  it('laesst weg, was gelesen wurde', () => {
    expect(offeneMeldungen(liste, ['gate:2026-08-20']).map(m => m.id))
      .toEqual(['training:2026-08-20']);
  });

  it('haelt die Meldung des naechsten Tages nicht zurueck', () => {
    const morgen = [{ id: 'training:' + tagPlus('2026-08-20', 1) }];
    expect(offeneMeldungen(morgen, ['training:2026-08-20'])).toHaveLength(1);
  });

  it('vertraegt leere Eingaben', () => {
    expect(offeneMeldungen(null, null)).toEqual([]);
    expect(offeneMeldungen(liste, null)).toHaveLength(2);
  });
});

describe('Rueckschau', () => {
  it('reicht ueber eine Woche - so weit denkt der Plan', () => {
    expect(RUECKSCHAU_TAGE).toBe(7);
  });
});
