/* Das Wellness-Gate war die einzige Bewertungslogik ohne Test - und die
   einzige, die eine ganze Woche umsteuern kann. Reine Rechenregeln ohne
   Seiteneffekte, also billig zu pruefen.

   Die Faelle sind so gewaehlt, dass sie die Fehler treffen, die vorher drin
   waren: der Schlafvergleich lief ueber die Position im Abruf statt ueber das
   Datum, und der Schnitt waere mit einem groesseren Abrufzeitraum
   mitgewachsen. */

import { describe, it, expect } from 'vitest';
import { WELL, wellnessAvg, wellnessGate, wellnessSerie, gewichtTrend,
         abnehmHinweis, wellnessMassnahmen, verfassungAus, tagPlus } from '../src/domain/analysis.js';

/* Ruhige Grundlinie: Ruhepuls 50, HRV 60, 7 h Schlaf, 80 kg. */
function tage(n, ab){
  const out = [];
  for(let i = 0; i < n; i++){
    out.push({ id: tagPlus(ab, i), restingHR: 50, hrv: 60, sleepSecs: 7 * 3600, weight: 80 });
  }
  return out;
}
const AB = '2026-08-01';
const letzter = rows => rows[rows.length - 1];

describe('wellnessAvg', () => {
  it('braucht drei Werte', () => {
    expect(wellnessAvg([{ x: 1 }, { x: 2 }], 'x')).toBe(null);
    expect(wellnessAvg([{ x: 1 }, { x: 2 }, { x: 3 }], 'x')).toBe(2);
  });
  it('laesst Nullen und Fehlwerte aus', () => {
    expect(wellnessAvg([{ x: 0 }, { x: 2 }, { x: 4 }, { x: null }, { x: 6 }], 'x')).toBe(4);
  });
});

describe('wellnessGate', () => {
  it('bleibt gruen auf ruhiger Grundlinie', () => {
    const r = tage(8, AB);
    const g = wellnessGate(r, letzter(r).id);
    expect(g.rot).toBe(false);
    expect(g.gruende).toEqual([]);
  });

  it('wird rot bei Ruhepuls ueber Schnitt plus 5', () => {
    const r = tage(8, AB);
    letzter(r).restingHR = 50 + WELL.rhrPlus + 1;
    const g = wellnessGate(r, letzter(r).id);
    expect(g.rot).toBe(true);
    expect(g.rhrHoch).toBe(true);
    expect(g.gruende[0]).toContain('Ruhepuls 56');
  });

  it('bleibt gruen bei Ruhepuls genau auf der Schwelle', () => {
    const r = tage(8, AB);
    letzter(r).restingHR = 50 + WELL.rhrPlus;
    expect(wellnessGate(r, letzter(r).id).rot).toBe(false);
  });

  it('wird rot bei HRV unter 85 Prozent des Schnitts', () => {
    const r = tage(8, AB);
    letzter(r).hrv = 60 * WELL.hrvAnteil - 1;
    const g = wellnessGate(r, letzter(r).id);
    expect(g.hrvNiedrig).toBe(true);
  });

  it('braucht zwei kurze Naechte, eine reicht nicht', () => {
    const r = tage(8, AB);
    letzter(r).sleepSecs = 5 * 3600;
    expect(wellnessGate(r, letzter(r).id).rot).toBe(false);
    r[r.length - 2].sleepSecs = 5 * 3600;
    const g = wellnessGate(r, letzter(r).id);
    expect(g.rot).toBe(true);
    expect(g.kurzeNaechte).toBe(2);
  });

  /* Der Fehler, den die alte Fassung hatte: sie nahm die letzten beiden
     Zeilen des Abrufs statt der beiden Naechte vor dem bewerteten Tag. */
  it('nimmt die Naechte des bewerteten Tages, nicht die letzten zwei Zeilen', () => {
    const r = tage(8, AB);
    r[6].sleepSecs = 5 * 3600;
    r[7].sleepSecs = 5 * 3600;
    /* Bewertet wird der vorletzte Tag - davor liegt nur eine kurze Nacht. */
    expect(wellnessGate(r, r[6].id).rot).toBe(false);
    expect(wellnessGate(r, r[7].id).rot).toBe(true);
  });

  it('mittelt nur ueber die sieben Tage davor, auch bei laengerem Abruf', () => {
    /* 21 Tage, die aeltesten mit deutlich hoeherem Ruhepuls. Waere das Fenster
       offen, zoege der alte Block den Schnitt hoch und der heutige Wert
       bliebe unauffaellig. */
    const r = tage(21, AB);
    for(let i = 0; i < 13; i++) r[i].restingHR = 70;
    letzter(r).restingHR = 56;
    const g = wellnessGate(r, letzter(r).id);
    expect(Math.round(g.rhrAvg)).toBe(50);
    expect(g.rot).toBe(true);
  });

  it('faellt ohne heutigen Datensatz auf den neuesten zurueck, streng aber nicht', () => {
    const r = tage(8, AB);
    const morgen = tagPlus(letzter(r).id, 1);
    expect(wellnessGate(r, morgen)).not.toBe(null);
    expect(wellnessGate(r, morgen, true)).toBe(null);
  });

  it('schweigt, wenn dem Tag alle drei Werte fehlen', () => {
    const r = tage(8, AB);
    Object.assign(letzter(r), { restingHR: 0, hrv: 0, sleepSecs: 0 });
    expect(wellnessGate(r, letzter(r).id)).toBe(null);
  });

  it('schweigt ohne Daten', () => {
    expect(wellnessGate([], '2026-08-08')).toBe(null);
    expect(wellnessGate(null, '2026-08-08')).toBe(null);
  });
});

describe('wellnessSerie', () => {
  it('meldet zwei rote Tage in Folge', () => {
    const r = tage(9, AB);
    r[7].restingHR = 58;
    r[8].restingHR = 58;
    const s = wellnessSerie(r, letzter(r).id);
    expect(s.heute.rot).toBe(true);
    expect(s.gestern.rot).toBe(true);
    expect(s.zweiRot).toBe(true);
  });

  it('meldet keine zwei roten Tage bei nur einem', () => {
    const r = tage(9, AB);
    letzter(r).restingHR = 58;
    expect(wellnessSerie(r, letzter(r).id).zweiRot).toBe(false);
  });

  /* Fehlt der Vortag ganz, darf nicht der heutige Datensatz als "gestern"
     durchgehen - sonst zaehlt ein roter Tag doppelt. */
  it('zaehlt einen fehlenden Vortag nicht als zweiten roten Tag', () => {
    const r = tage(9, AB);
    letzter(r).restingHR = 58;
    r.splice(7, 1);
    expect(wellnessSerie(r, letzter(r).id).zweiRot).toBe(false);
  });
});

describe('Gewichtstrend', () => {
  it('braucht genug Punkte ueber genug Tage', () => {
    expect(gewichtTrend(tage(4, AB))).toBe(null);
  });

  it('rechnet eine gleichmaessige Abnahme auf die Woche hoch', () => {
    const r = tage(15, AB);
    r.forEach((d, i) => { d.weight = 80 - i * 0.1; });   // 0,7 kg je Woche
    const t = gewichtTrend(r);
    expect(t.proWoche).toBeCloseTo(-0.7, 5);
    expect(t.punkte).toBe(15);
    expect(t.tage).toBe(14);
  });

  it('warnt erst ueber der Rate, nicht darunter', () => {
    const langsam = tage(15, AB);
    langsam.forEach((d, i) => { d.weight = 80 - i * 0.05; });  // 0,44 % je Woche
    expect(abnehmHinweis(langsam)).toBe(null);

    const schnell = tage(15, AB);
    schnell.forEach((d, i) => { d.weight = 80 - i * 0.15; });  // 1,3 % je Woche
    const h = abnehmHinweis(schnell);
    expect(h.rate).toBeGreaterThan(WELL.abnehmProzentProWoche);
    expect(h.text).toContain('kg je Woche');
  });

  it('warnt nicht bei Zunahme', () => {
    const r = tage(15, AB);
    r.forEach((d, i) => { d.weight = 80 + i * 0.15; });
    expect(abnehmHinweis(r)).toBe(null);
  });

  /* Ein einzelner Wassertag darf die Aussage nicht kippen - genau deshalb
     eine Ausgleichsgerade und kein Vergleich erster gegen letzter Wert. */
  it('haelt einen Ausreisser aus', () => {
    const r = tage(15, AB);
    r.forEach((d, i) => { d.weight = 80 - i * 0.05; });
    letzter(r).weight = 77.5;
    expect(abnehmHinweis(r)).toBe(null);
  });

  it('haelt den Abnehmhinweis aus den Gruenden des Gates heraus', () => {
    const r = tage(15, AB);
    r.forEach((d, i) => { d.weight = 80 - i * 0.2; });
    const s = wellnessSerie(r, letzter(r).id);
    expect(s.abnehmen).not.toBe(null);
    expect(s.heute.rot).toBe(false);
  });
});

describe('Massnahmen bei rotem Gate', () => {
  it('verschiebt den Test, statt ihn herunterzustufen', () => {
    const m = wellnessMassnahmen('test', false).join(' ');
    expect(m).toContain('nicht fahren');
    expect(m).not.toContain('60 min Z2');
  });

  it('stuft einen Z2-Donnerstag nicht auf Z2 herunter', () => {
    const m = wellnessMassnahmen('z2', false).join(' ');
    expect(m).toContain('ohnehin Z2');
    expect(m).not.toContain('Donnerstag wird 60 min Z2');
  });

  it('stuft den Intervalltag herunter', () => {
    expect(wellnessMassnahmen('intervals', false)[0]).toContain('60 min Z2');
  });

  it('macht aus zwei roten Tagen eine Erholungswoche', () => {
    expect(wellnessMassnahmen('intervals', true).join(' ')).toContain('Erholungswoche fahren');
  });
});

describe('Verfassung fuer das Fazit', () => {
  it('gibt die Urteile fertig heraus', () => {
    const r = tage(8, AB);
    letzter(r).restingHR = 58;
    const v = verfassungAus(r, letzter(r).id);
    expect(v.rhrHoch).toBe(true);
    expect(v.rot).toBe(true);
    expect(Math.round(v.rhrAvg)).toBe(50);
  });

  it('schweigt fuer einen Tag ohne Datensatz', () => {
    expect(verfassungAus(tage(8, AB), '2026-09-30')).toBe(null);
  });
});
