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
  vorgewaehlterAblauf, testWerte, terminSchluessel, tempoBloecke, testZiel,
  vo2maxTermin, vo2maxBezug, VO2MAX_GRENZE, FTP_FAKTOR,
  sprechtestBezug, SPRECHTEST_ABSTAND, AUSBELASTET_RPE
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
    const w = testWerte({ w20: 240, hr20: 165, kadenz: 88, gewicht: 84.5 });
    expect(w.ftp).toBe(Math.round(240 * FTP_FAKTOR));
    expect(w.lthr).toBe(165);
    expect(w.kadenz).toBe(88);
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
    const w = testWerte({ w20: 0, hr20: null, kadenz: undefined, gewicht: 0 });
    expect(w).toEqual({ w20:null, kadenz:null, rpe:null, ausbelastet:null,
                        hr20:null, weight:null, ftp:null, lthr:null, wkg:null });
  });

  /* Das RPE ist das einzige Feld, das etwas ueber die Guete des Messwerts
     sagt: unter 9 wurde nicht ausbelastet, und dann ist die FTP eher zu
     niedrig. Ohne Angabe wird nichts behauptet - "nicht ausbelastet" waere
     ein Urteil ueber eine Zahl, die niemand eingetragen hat. */
  it('urteilt ueber die Ausbelastung erst ab einem eingetragenen RPE', () => {
    expect(testWerte({ w20: 240, rpe: AUSBELASTET_RPE }).ausbelastet).toBe(true);
    expect(testWerte({ w20: 240, rpe: AUSBELASTET_RPE - 1 }).ausbelastet).toBe(false);
    expect(testWerte({ w20: 240 }).ausbelastet).toBe(null);
    expect(testWerte({ w20: 240, rpe: 0 }).ausbelastet).toBe(null);
  });
});

/* Der Sprechtest gegen die Z2-Obergrenze - Punkt 6 der Checkliste nach jedem
   Test. Der heikle Teil ist der Zeitraum: vor dem Test galten andere Baender,
   und ein Schnitt ueber beide Zeitraeume vergleicht Werte aus zwei
   Zonenmodellen gegen das neuere von ihnen. */
describe('Sprechtest gegen die Z2-Obergrenze', () => {
  const z2 = { min: 128, max: 142 };
  const erhebung = (tag, hr) => ({ day: tag, talkHr: hr });

  it('zaehlt nur die Erhebungen seit dem letzten Test', () => {
    /* Der alte Wert von 120 stammt aus der Zeit der Uebergangsbaender. Zaehlte
       er mit, ruecke der Schnitt auf 132 und die Baender stuenden als zu weit
       da - obwohl beide neuen Erhebungen sauber im Band liegen. */
    const log = [erhebung('2026-09-01', 120), erhebung('2026-09-12', 138),
                 erhebung('2026-09-19', 140)];
    const b = sprechtestBezug(log, [{ day:'2026-09-10' }], z2);
    expect(b.anzahl).toBe(2);
    expect(b.schnitt).toBe(139);
    expect(b.seit).toBe('2026-09-10');
    expect(b.zuHoch).toBe(false);
    expect(sprechtestBezug(log, [], z2).zuHoch).toBe(true);
  });

  it('nimmt ohne Test alles - dann gibt es nur ein Zonenmodell', () => {
    const log = [erhebung('2026-09-01', 120), erhebung('2026-09-08', 124)];
    const b = sprechtestBezug(log, [], z2);
    expect(b.anzahl).toBe(2);
    expect(b.seit).toBe(null);
    /* 122 liegt mehr als sechs bpm unter 142 - die Baender liegen oben zu weit. */
    expect(b.zuHoch).toBe(true);
  });

  it('meldet erst ab dem Abstand aus dem Plan', () => {
    const knapp = sprechtestBezug([erhebung('2026-09-12', z2.max - SPRECHTEST_ABSTAND)],
                                  [], z2);
    expect(knapp.zuHoch).toBe(false);
    const drunter = sprechtestBezug([erhebung('2026-09-12', z2.max - SPRECHTEST_ABSTAND - 1)],
                                    [], z2);
    expect(drunter.zuHoch).toBe(true);
  });

  it('schweigt ohne Werte und ohne Band', () => {
    expect(sprechtestBezug([], [], z2)).toBe(null);
    expect(sprechtestBezug([erhebung('2026-09-12', 130)], [], null)).toBe(null);
    /* Eine Erhebung ohne Sprechtest-Puls - nur RPE oder nur Notiz - zaehlt nicht. */
    expect(sprechtestBezug([{ day:'2026-09-12', rpe: 5 }], [], z2)).toBe(null);
  });
});

/* Die VO2max-Referenz.

   Seit Fassung 4 entsteht sie nicht mehr am Testtag, sondern eine Woche
   spaeter als erste Wiederholung der ersten Intervalleinheit. Sie gehoert
   trotzdem zum Test - nur dessen FTP kann sie pruefen -, und genau diese
   Zuordnung wird hier geprueft: nicht der Termin, der gerade ansteht, sondern
   der letzte davor. */
describe('VO2max-Referenz', () => {
  it('liegt am Tag mit Variante und gehoert zum Test davor', () => {
    const t = vo2maxTermin(plan, START);
    expect(t.week).toBe(5);
    expect(W.isoDayLocal(t.datum)).toBe('2026-09-17');
    expect(t.datum.getDay()).toBe(4);
    expect(W.isoDayLocal(t.test.datum)).toBe(W.isoDayLocal(testTag(4)));
    expect(t.variante.ergebnis).toBe('vo2max5');
  });

  it('bleibt ohne Startdatum leer', () => {
    expect(vo2maxTermin(plan, null)).toBe(null);
  });

  /* Die Gegenprobe des Trainingsplans: ueber 118 % war der Test zu niedrig. */
  it('meldet einen zu niedrigen Test erst oberhalb der Grenze', () => {
    expect(vo2maxBezug(209 * 1.18, 209).zuNiedrig).toBe(false);
    expect(vo2maxBezug(209 * 1.25, 209).zuNiedrig).toBe(true);
    expect(vo2maxBezug(250, 209).prozent).toBe(120);
    expect(VO2MAX_GRENZE).toBe(118);
  });

  it('schweigt, solange eine der beiden Zahlen fehlt', () => {
    expect(vo2maxBezug(250, null)).toBe(null);
    expect(vo2maxBezug(null, 209)).toBe(null);
  });
});

/* Das Ergebnis des Tempotests aus der Aufzeichnung.

   Die Einheit hat eine feste Form - locker, hart, locker, hart, locker -, und
   in ihr sind die beiden Bloecke die beiden staerksten Fenster. Geprueft wird
   der Fall, auf den es ankommt: Block 2 wurde nach unten korrigiert und ist
   damit der schwaechere von beiden. Gesucht ist trotzdem er. */
describe('Tempotest aus der Aufzeichnung', () => {
  const BLOCK = 360;   // 6 min

  /* Eine Fahrt bauen: je Sekunde ein Messwert, Abschnitte als [Sekunden, Watt]. */
  function fahrt(abschnitte, pulsVersatz){
    const watts = [], puls = [], zeit = [];
    let t = 0;
    for(const [sek, w] of abschnitte){
      for(let i = 0; i < sek; i++){
        watts.push(w);
        puls.push(80 + w / 3 + (pulsVersatz || 0));
        zeit.push(t++);
      }
    }
    return { watts, puls, zeit, sekunden: BLOCK };
  }

  const anlauf = () => fahrt([
    [900, 120],   // 15 min Einfahren
    [BLOCK, 230], // Block 1 - zu schwer gefahren
    [BLOCK, 110], // 6 min Pause
    [BLOCK, 215], // Block 2 - korrigiert, schwaecher
    [600, 100]    // 10 min Ausrollen
  ]);

  it('findet beide Bloecke und ordnet sie nach der Zeit', () => {
    const b = tempoBloecke(anlauf());
    expect(b.erster.watt).toBe(230);
    expect(b.zweiter.watt).toBe(215);
    expect(b.erster.vonSek).toBe(900);
    expect(b.zweiter.vonSek).toBe(900 + 2 * BLOCK);
    expect(b.fensterSekunden).toBe(BLOCK);
  });

  /* Der eigentliche Punkt: gesucht ist Block 2, nicht der beste Block. Wer
     nach oben korrigiert hat, bekommt dieselbe Reihenfolge - beide Male
     entscheidet die Zeit. */
  it('nimmt auch bei Korrektur nach oben den spaeteren Block als zweiten', () => {
    const b = tempoBloecke(fahrt([
      [900, 120], [BLOCK, 200], [BLOCK, 110], [BLOCK, 225], [600, 100]
    ]));
    expect(b.erster.watt).toBe(200);
    expect(b.zweiter.watt).toBe(225);
  });

  it('nimmt den Puls desselben Fensters mit', () => {
    const b = tempoBloecke(anlauf());
    expect(b.zweiter.puls).toBe(Math.round(80 + 215 / 3));
  });

  /* Ein Zwei-Sekunden-Takt darf das Fenster nicht halbieren. */
  it('rechnet die Fensterlaenge aus dem Takt der Aufzeichnung', () => {
    const roh = anlauf();
    const jede2 = a => a.filter((_, i) => i % 2 === 0);
    const b = tempoBloecke({ watts: jede2(roh.watts), puls: jede2(roh.puls),
                             zeit: jede2(roh.zeit), sekunden: BLOCK });
    expect(b.zweiter.watt).toBe(215);
    expect(b.fensterSekunden).toBe(BLOCK);
  });

  it('schweigt ohne Leistungsstrom und bei zu kurzer Aufzeichnung', () => {
    expect(tempoBloecke({ watts: null, sekunden: BLOCK })).toBe(null);
    expect(tempoBloecke({ watts: [], sekunden: BLOCK })).toBe(null);
    const kurz = fahrt([[300, 200]]);
    expect(tempoBloecke(kurz)).toBe(null);
    expect(tempoBloecke({ watts: anlauf().watts, sekunden: 0 })).toBe(null);
  });
});

describe('Ziel fuer den Test', () => {
  it('rechnet die FTP, die aus dem gehaltenen Ziel faellt', () => {
    const z = testZiel({ zielWatt: 220, zielPuls: 158 }, { ftp: 200 });
    expect(z.watt).toBe(220);
    expect(z.puls).toBe(158);
    expect(z.ftp).toBe(Math.round(220 * FTP_FAKTOR));
    expect(z.alteFtp).toBe(200);
    expect(z.gegenAlt).toBe(Math.round((209 - 200) / 200 * 100));
  });

  it('bleibt ohne notierte Leistung leer', () => {
    expect(testZiel(null, { ftp: 200 })).toBe(null);
    expect(testZiel({ zielWatt: 0 }, { ftp: 200 })).toBe(null);
  });

  it('kommt ohne bisherige FTP aus', () => {
    const z = testZiel({ zielWatt: 220 }, { ftp: null });
    expect(z.gegenAlt).toBe(null);
    expect(z.puls).toBe(null);
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
