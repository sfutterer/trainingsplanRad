/* Die Messwertliste - was gilt, und seit wann.

   Vorher waren das zwei Speicher und eine Vorrangregel mit Zeitstempeln: die
   drei geltenden Zahlen in einem Objekt, die Tests daneben, und
   schwellenAusTest entschied bei jedem Speichern neu, ob ein Testwert eine
   Eingabe von Hand ueberschreiben darf. Die Faelle, die diese Regel absichern
   musste, stehen hier wieder - sie fallen jetzt aus der Reihenfolge der
   Liste, ohne dass jemand sie vergleicht.

   Der Fall, der es noetig gemacht hat, ist der vom September 2026: der Test
   vom 10.09. ergab als Ø-Puls 152 bpm, Coggan daraus legt Z2 auf 103-126 bpm,
   und eine Grundlagenfahrt mit 132 bpm liegt darin in Z3. Die Schwellen-HF
   wurde deshalb am 12.09. von Hand auf 163 gesetzt. Ein zwei Tage spaeter
   berichtigter Testeintrag darf die 152 nicht still zurueckholen. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createPlan } from '../src/domain/plan.js';
import * as M from '../src/domain/messwerte.js';
import { quelleVon } from '../src/domain/zones.js';

const plan = createPlan(JSON.parse(
  fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8')));

const test = (day, ftp, lthr, mehr) => ({ day, art:'test', ftp, lthr, ...(mehr || {}) });
const hand = (day, werte) => ({ day, art:'hand', ...werte });

describe('Geltende Schwellenwerte', () => {
  it('nimmt je Feld den juengsten Eintrag, der es nennt', () => {
    const s = M.geltendeSchwellen([
      test('2026-09-10', 192, 152),
      hand('2026-09-12', { lthr: 163, hrmax: 180 }),
      test('2026-10-22', 223, 166)
    ]);
    expect([s.ftp, s.lthr, s.hrmax]).toEqual([223, 166, 180]);
    expect(quelleVon(s, 'ftp')).toMatchObject({ art:'test', tag:'2026-10-22' });
    /* Die HFmax misst kein Schwellentest - sie bleibt beim eingetragenen
       Wert, auch wenn danach zwei Tests kamen. */
    expect(quelleVon(s, 'hrmax')).toMatchObject({ art:'hand', tag:'2026-09-12' });
  });

  it('haelt die spaetere Eingabe gegen ein Nachspeichern desselben Tests', () => {
    const liste = [test('2026-09-10', 192, 152), hand('2026-09-12', { lthr: 163 })];
    /* Der Test wird berichtigt - derselbe Tag, derselbe Schluessel. */
    const berichtigt = liste
      .filter(e => e.id !== M.messwertId('2026-09-10', 'test'))
      .concat([test('2026-09-10', 193, 152)]);
    const s = M.geltendeSchwellen(berichtigt);
    expect(s.lthr).toBe(163);
    expect(s.ftp).toBe(193);
    expect(quelleVon(s, 'lthr').art).toBe('hand');
  });

  it('laesst einen spaeteren Test gegen eine Eingabe gewinnen', () => {
    const s = M.geltendeSchwellen([
      test('2026-09-10', 192, 152),
      hand('2026-09-12', { lthr: 163 }),
      test('2026-10-22', 223, 166)
    ]);
    expect(s.lthr).toBe(166);
    expect(quelleVon(s, 'lthr')).toMatchObject({ art:'test', tag:'2026-10-22' });
  });

  /* Am selben Tag gilt der Eintrag als der spaetere: gemessen wurde
     vormittags, eingetragen abends. */
  it('zaehlt eine Eingabe am Testtag als die spaetere', () => {
    const s = M.geltendeSchwellen([
      test('2026-09-10', 192, 152),
      hand('2026-09-10', { lthr: 163 })
    ]);
    expect(s.lthr).toBe(163);
  });

  it('kennt ohne Eintraege keinen Wert', () => {
    const s = M.geltendeSchwellen([]);
    expect([s.ftp, s.lthr, s.hrmax]).toEqual([null, null, null]);
    expect(quelleVon(s, 'ftp')).toBe(null);
  });

  /* Ein geloeschter Eintrag gibt den Wert zurueck, den es davor gab - und
     keinen Rest seiner selbst. Genau das konnte die alte Fassung nicht: dort
     wurde ueberschrieben, der vorige Wert war weg. */
  it('faellt nach dem Loeschen auf den vorigen Wert zurueck', () => {
    const liste = [test('2026-09-10', 192, 152), test('2026-10-22', 223, 166)];
    const ohne = liste.filter(e => e.day !== '2026-10-22');
    expect(M.geltendeSchwellen(ohne).ftp).toBe(192);
  });
});

describe('Schluessel und Reihenfolge', () => {
  it('haelt Test und Eintrag desselben Tages auseinander', () => {
    expect(M.messwertId('2026-09-10', 'test')).not.toBe(M.messwertId('2026-09-10', 'hand'));
    const liste = M.sortiere([hand('2026-09-10', { lthr: 163 }), test('2026-09-10', 192, 152)]);
    expect(liste.map(e => e.art)).toEqual(['test', 'hand']);
  });

  it('haelt einen Eintrag ohne Datum fuer den aeltesten', () => {
    const liste = M.sortiere([test('2026-09-10', 192, 152), hand(null, { hrmax: 180 })]);
    expect(liste[0].day).toBe(null);
    expect(M.geltendeSchwellen(liste).ftp).toBe(192);
  });

  /* Alteintraege aus der Zeit vor der Liste tragen weder Art noch Schluessel.
     Etwas anderes als Tests stand in diesem Speicher nie. */
  it('nimmt einen Eintrag ohne Art als Test', () => {
    const e = M.normalisiere({ day:'2026-09-10', ftp:192, lthr:152 });
    expect(e.art).toBe('test');
    expect(e.id).toBe('2026-09-10/test');
    expect(M.istTest(e)).toBe(true);
  });
});

describe('Uebernahme des alten Schwellenspeichers', () => {
  const alt = { ftp:192, lthr:163, hrmax:180,
    quellen: { ftp:{ art:'test', tag:'2026-09-10' },
               lthr:{ art:'hand', seit:'2026-09-12T18:04:00.000Z' },
               hrmax:{ art:'hand', seit:'2026-09-12T18:04:00.000Z' } } };

  it('macht aus den Werten von Hand einen Eintrag mit Datum', () => {
    const liste = M.uebernimmSchwellen([test('2026-09-10', 192, 152)], alt);
    expect(liste).toHaveLength(2);
    const neu = liste[liste.length - 1];
    expect(neu.art).toBe('hand');
    expect(neu.day).toBe('2026-09-12');
    expect([neu.lthr, neu.hrmax]).toEqual([163, 180]);
    /* Die gemessene FTP steht schon als Test in der Liste und wird nicht
       zweimal uebernommen - der Eintrag traegt sie nicht. */
    expect(neu.ftp).toBe(null);
    expect(M.geltendeSchwellen(liste)).toMatchObject({ ftp:192, lthr:163, hrmax:180 });
  });

  /* Der alte Speicher bleibt stehen. Liefe die Uebernahme bei jedem Start
     erneut durch, kaeme ein geloeschter Wert zurueck. */
  it('aendert beim zweiten Mal nichts mehr', () => {
    const einmal = M.uebernimmSchwellen([test('2026-09-10', 192, 152)], alt);
    const zweimal = M.uebernimmSchwellen(einmal, alt);
    expect(zweimal).toHaveLength(einmal.length);
  });

  it('nimmt einen Wert ohne Herkunftsvermerk ohne Datum auf', () => {
    const liste = M.uebernimmSchwellen([], { ftp:200, lthr:160, hrmax:null, quellen:{} });
    expect(liste).toHaveLength(1);
    expect(liste[0].day).toBe(null);
    expect(liste[0].id).toBe('bestand/hand');
    expect(M.geltendeSchwellen(liste)).toMatchObject({ ftp:200, lthr:160 });
  });

  it('laesst eine leere Liste leer, wenn nichts dastand', () => {
    expect(M.uebernimmSchwellen([], { ftp:null, lthr:null, hrmax:null, quellen:{} })).toEqual([]);
    expect(M.uebernimmSchwellen([], null)).toEqual([]);
  });
});

describe('Was die letzte Messung geaendert hat', () => {
  const liste = [test('2026-09-10', 192, 163), test('2026-10-22', 223, 166)];

  it('nennt die Felder mit ihrem Unterschied', () => {
    const k = M.konsequenz(plan, liste, 12);
    expect(k.eintrag.day).toBe('2026-10-22');
    expect(k.felder).toEqual([
      { feld:'ftp', von:192, auf:223, diff:31 },
      { feld:'lthr', von:163, auf:166, diff:3 }
    ]);
  });

  /* Die Zahl allein sagt wenig - erst die Folge macht sie lesbar. */
  it('rechnet die Folgen in Baendern aus', () => {
    const k = M.konsequenz(plan, liste, 12);
    const z2 = k.folgen.find(f => f.titel === 'Z2 in Watt');
    expect(z2).toEqual({ titel:'Z2 in Watt', von:'106–144 W', auf:'123–167 W' });
    const phase4 = k.folgen.find(f => /Phase 4/.test(f.titel));
    expect(phase4.auf).toBe('201–212 W');
  });

  it('schweigt ueber Felder, die sich nicht geaendert haben', () => {
    const k = M.konsequenz(plan, [test('2026-09-10', 192, 163), hand('2026-10-01', { hrmax: 180 })], 12);
    expect(k.felder.map(f => f.feld)).toEqual(['hrmax']);
    expect(k.folgen).toEqual([]);
  });

  it('sagt, ab wann eine frische LTHR die Pulsbaender traegt', () => {
    const frueh = M.konsequenz(plan, [test('2026-09-10', 192, 163)], 4);
    expect(frueh.pulsAbWoche).toBe(plan.cogganFromWeek);
    const spaet = M.konsequenz(plan, liste, 12);
    expect(spaet.pulsAbWoche).toBe(null);
  });

  it('kennt ohne Eintrag keine Konsequenz', () => {
    expect(M.konsequenz(plan, [], 12)).toBe(null);
  });
});

describe('Verlauf und Vorbelegung', () => {
  it('zeichnet die Aenderung gegen den ersten Wert', () => {
    const r = M.reihe([test('2026-09-10', 192, 163), test('2026-10-22', 223, 166)], 'ftp', 'W', 0);
    expect([r.erster, r.letzter]).toEqual([192, 223]);
    expect(r.punkte[0].v).toBe(0);
    expect(Math.round(r.punkte[1].v)).toBe(16);
    expect(r.punkte[1].zusatz).toBe('223 W');
  });

  /* Eine Linie aus einem Punkt ist keine. */
  it('zeichnet nichts bei einem einzigen Wert', () => {
    expect(M.reihe([test('2026-09-10', 192, 163)], 'ftp', 'W', 0)).toBe(null);
  });

  it('nimmt auch eingetragene Werte in den Verlauf', () => {
    const r = M.reihe([test('2026-09-10', 192, 163), hand('2026-10-01', { ftp: 215 })], 'ftp', 'W', 0);
    expect(r.punkte).toHaveLength(2);
    expect(r.letzter).toBe(215);
  });

  it('belegt mit dem letzten vergangenen Testtermin vor', () => {
    const termine = ['2026-09-10', '2026-10-22', '2026-12-03'];
    expect(M.vorbelegtesDatum(termine, '2026-10-31')).toBe('2026-10-22');
    expect(M.vorbelegtesDatum(termine, '2026-12-03')).toBe('2026-12-03');
    /* Vor dem ersten Termin gibt es nichts Vergangenes - dann heute. */
    expect(M.vorbelegtesDatum(termine, '2026-08-20')).toBe('2026-08-20');
    expect(M.vorbelegtesDatum([], '2026-08-20')).toBe('2026-08-20');
  });
});
