/* Der Schwellentest als Vorgang.

   Geprueft wird die Lage-Rechnung, nicht die Anzeige: welcher Termin gerade
   gilt, wo im Anlauf man steht und welcher Ablauf sich abspielen laesst. Das
   ist die Stelle, an der ein Fehler am spaetesten auffiele - eine Zeitleiste,
   die den Testtag an der falschen Stelle zeigt, sieht richtig aus, bis man
   danebensteht.

   Gebaut wird gegen den ausgelieferten Plan und einen echten Planbeginn, damit
   die Wochentage stimmen: Woche 1 beginnt am Samstag, dem 15.08.2026. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createPlan } from '../src/domain/plan.js';
import * as W from '../src/domain/week.js';
import {
  testTermine, aktuellerTermin, anlaufTage, testPhase, testAblaeufe,
  vorgewaehlterAblauf, testWerte, terminSchluessel, FTP_FAKTOR
} from '../src/domain/test.js';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);
const START = W.dayFromIso('2026-08-15');

const testTag = w => W.testDateFor(plan, w, START);

describe('Testtermine', () => {
  it('leitet sie aus den Testwochen ab', () => {
    const t = testTermine(plan, START);
    expect(t.map(x => x.week)).toEqual(W.testWeeks(plan));
    /* Der Termin ist der Donnerstag seiner Woche - kein zweites Datum daneben. */
    for(const x of t) expect(x.datum.getDay()).toBe(4);
  });

  it('bleibt ohne Startdatum leer statt zu raten', () => {
    expect(testTermine(plan, null)).toEqual([]);
    expect(aktuellerTermin(plan, START, null)).toBe(null);
  });
});

describe('Welcher Termin gerade gilt', () => {
  const erster = testTag(4), zweiter = testTag(10);

  it('nimmt den naechsten, der noch nicht vorbei ist', () => {
    expect(aktuellerTermin(plan, START, START).datum.getTime()).toBe(erster.getTime());
    expect(aktuellerTermin(plan, W.addDays(erster, -1), START).datum.getTime()).toBe(erster.getTime());
    expect(aktuellerTermin(plan, erster, START).datum.getTime()).toBe(erster.getTime());
  });

  /* Der Tag danach zaehlt noch dazu: dort steht ein Anlaufschritt, und dort
     wird das Ergebnis eingetragen. Erst am uebernaechsten Tag rueckt der Blick
     auf den kommenden Termin. */
  it('haelt den Termin einen Tag lang fest und geht dann weiter', () => {
    expect(aktuellerTermin(plan, W.addDays(erster, 1), START).datum.getTime()).toBe(erster.getTime());
    expect(aktuellerTermin(plan, W.addDays(erster, 2), START).datum.getTime()).toBe(zweiter.getTime());
  });

  it('bleibt nach dem letzten Termin bei diesem stehen', () => {
    const letzter = testTag(W.testWeeks(plan)[W.testWeeks(plan).length - 1]);
    const spaet = W.addDays(letzter, 40);
    expect(aktuellerTermin(plan, spaet, START).datum.getTime()).toBe(letzter.getTime());
    expect(testPhase(plan, aktuellerTermin(plan, spaet, START), spaet)).toBe('vorbei');
  });
});

describe('Phase', () => {
  const t = { datum: testTag(4) };

  it('benennt heute, danach und den Anlauf', () => {
    expect(testPhase(plan, t, t.datum)).toBe('heute');
    expect(testPhase(plan, t, W.addDays(t.datum, 1))).toBe('danach');
    expect(testPhase(plan, t, W.addDays(t.datum, -1))).toBe('anlauf');
    expect(testPhase(plan, t, W.addDays(t.datum, -plan.testTaper.leadDays))).toBe('anlauf');
    expect(testPhase(plan, t, W.addDays(t.datum, -plan.testTaper.leadDays - 1))).toBe('fern');
  });

  it('sagt ohne Termin nichts anderes als "keiner"', () => {
    expect(testPhase(plan, null, START)).toBe('keiner');
  });
});

describe('Anlauf als Zeitleiste', () => {
  const termin = { datum: testTag(4), week: 4 };

  it('legt jeden Schritt auf sein Datum und den Testtag dazwischen', () => {
    const tage = anlaufTage(plan, termin, START);
    expect(tage.length).toBe(plan.testTaper.steps.length + 1);
    /* Aufsteigend nach Abstand, und der Testtag steht mitten drin - nicht am
       Ende, wo der Plan noch einen Schritt fuer den Tag danach kennt. */
    const offsets = tage.map(z => z.offset);
    expect(offsets).toEqual(offsets.slice().sort((a, b) => a - b));
    const test = tage.find(z => z.test);
    expect(test.offset).toBe(0);
    expect(tage.indexOf(test)).toBeLessThan(tage.length - 1);
    for(const z of tage){
      expect(W.dayOffset(z.datum, termin.datum)).toBe(z.offset);
    }
  });

  it('markiert heute und was zurueckliegt', () => {
    const heute = W.addDays(termin.datum, -2);
    const tage = anlaufTage(plan, termin, heute);
    const jetzt = tage.filter(z => z.heute);
    expect(jetzt.length).toBe(1);
    expect(jetzt[0].offset).toBe(-2);
    expect(tage.filter(z => z.vergangen).every(z => z.offset < -2)).toBe(true);
    expect(tage.find(z => z.offset === 0).vergangen).toBe(false);
  });
});

describe('Ablaeufe im Testbereich', () => {
  const termin = { datum: testTag(4), week: 4, titel: 'Schwellentest' };

  it('nimmt den Test und jede Anlaufeinheit mit Schrittfolge', () => {
    const a = testAblaeufe(plan, termin, START);
    expect(a.some(x => x.id === 'test')).toBe(true);
    /* Genau die Schritte des Anlaufs, die eine Schrittfolge tragen - der
       Ruhetag und der Zirkel haben im Timer nichts zu zaehlen. */
    const mitSchritten = plan.testTaper.steps.filter(s => s.session && s.session.kind === 'steps');
    expect(a.length).toBe(mitSchritten.length + 1);
    for(const x of a) expect(Array.isArray(x.steps) && x.steps.length).toBeTruthy();
  });

  it('erkennt den Tempotest an seiner Steuergroesse', () => {
    const a = testAblaeufe(plan, termin, START);
    const tempo = a.filter(x => x.tempo);
    expect(tempo.length).toBe(1);
    expect(tempo[0].steering).toContain('20 min haltbar');
    /* Die Oeffner am Vortag sind kein Tempotest - aus ihnen faellt keine
       Zielleistung. */
    expect(a.find(x => /Öffner/.test(x.titel)).tempo).toBe(false);
  });

  it('waehlt den Ablauf des heutigen Tages vor, sonst den Test', () => {
    const tempoTag = W.addDays(termin.datum, -7);
    expect(vorgewaehlterAblauf(testAblaeufe(plan, termin, tempoTag))).toBe('anlauf-7');
    expect(vorgewaehlterAblauf(testAblaeufe(plan, termin, termin.datum))).toBe('test');
    expect(vorgewaehlterAblauf(testAblaeufe(plan, termin, START))).toBe('test');
  });
});

describe('Werte aus dem Test', () => {
  it('rechnet FTP aus den 20-min-Watt und nimmt die LTHR wie gemessen', () => {
    const w = testWerte({ w20: 240, hr20: 165, w5: 300, gewicht: 84.5 });
    expect(w.ftp).toBe(Math.round(240 * FTP_FAKTOR));
    expect(w.lthr).toBe(165);
    expect(w.wkg).toBe(Math.round(240 * FTP_FAKTOR / 84.5 * 100) / 100);
  });

  /* Ohne Leistungsmesser traegt der Puls allein die Baender - dann muss die
     LTHR trotzdem herauskommen und die FTP leer bleiben, statt aus einer
     fehlenden Zahl eine Null zu rechnen. */
  it('liefert die LTHR auch ohne Wattwerte', () => {
    const w = testWerte({ hr20: 162 });
    expect(w.lthr).toBe(162);
    expect(w.ftp).toBe(null);
    expect(w.wkg).toBe(null);
  });

  it('nimmt Null und Unsinn als "nicht gemessen"', () => {
    const w = testWerte({ w20: 0, hr20: null, w5: undefined, gewicht: 0 });
    expect(w).toEqual({ w20:null, w5:null, hr20:null, weight:null, ftp:null, lthr:null, wkg:null });
  });
});

describe('Schluessel der Notizen', () => {
  /* Das Datum und nicht die Wochennummer: verschiebt sich der Planbeginn,
     verschiebt sich die Woche mit, das gefahrene Datum aber nicht. */
  it('ist das Datum des Termins', () => {
    expect(terminSchluessel({ datum: W.dayFromIso('2026-09-10') })).toBe('2026-09-10');
    expect(terminSchluessel(null)).toBe(null);
  });
});
