/* Die Wiederholungen eines Intervalltages und die Nachsteuerung des Zielbands.

   Anlass ist der Donnerstag vom 24.09.2026 (Woche 6, 5 x 4 min, Vorgabe
   222-237 W). Der Trainingsplan protokolliert ihn so:

     Wdh.  Ø W    Ø HF letzte 60 s
     1     222    - (Spitze 152)
     2     230    153
     3     234    159
     4     239    160
     5     268    168 (Max 173)

   Zwei Befunde, aus denen Fassung 11 entstanden ist: das Pulskriterium
   (>= 163 bpm in der letzten Minute) bleibt bis 239 W unerreicht, und die
   fuenfte Wiederholung war ein Maximalversuch und gehoert deshalb nicht in
   die Bewertung. Die App soll aus genau diesen Zahlen "naechstes Mal +5 W"
   ableiten - und nicht "-5 W", weil der Puls in Wdh. 5 ueber der LTHR lag.

   Die Fahrt ist nachgebaut, nicht aufgezeichnet: dieselben Zeiten und
   Leistungen, wie sie der Plan nennt. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createPlan } from '../src/domain/plan.js';
import { toMidnight, dayFromIso } from '../src/domain/week.js';
import { compareDay } from '../src/domain/analysis.js';
import { buildDayInfo } from '../src/domain/day.js';
import { wiederholungsRahmen, wiederholungsAuswertung, nachsteuerung, NACHSTEUER }
  from '../src/domain/wiederholungen.js';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);
const START = toMidnight(dayFromIso('2026-08-15'));
const TH = { ftp: 192, lthr: 163, hrmax: 180 };
const DO_W6 = dayFromIso('2026-09-24');   // 5 x 4 min, Vorgabe 222–237 W
const DO_W8 = dayFromIso('2026-10-08');   // 5 x 4 min, Vorgabe 240–250 W

const WARM = 15 * 60;
const WORK = 4 * 60;
const REST = 4 * 60;

/* Der Ablauf des 24.09.: Einfahren, fuenf Wiederholungen mit Pause, Ausrollen.
   `watt` und `hf` je Wiederholung, `hf` ist der Wert der letzten Minute - die
   Minuten davor liegen 8 bpm darunter, so wie ein Puls in ein Intervall
   hineinsteigt. */
function einheit(o){
  const w = o.watt, h = o.hf;
  const zeit = [], watt = [], puls = [], tempo = [];
  const schieb = (sek, wert, hf) => {
    for(let i = 0; i < sek; i++){
      zeit.push(zeit.length); watt.push(wert); puls.push(hf); tempo.push(28 / 3.6);
    }
  };
  schieb(WARM, 120, 120);
  for(let r = 0; r < w.length; r++){
    for(let s = 0; s < WORK; s++){
      const letzte = s >= WORK - 60;
      zeit.push(zeit.length); watt.push(w[r]); tempo.push(34 / 3.6);
      puls.push(h[r] == null ? 0 : (letzte ? h[r] : h[r] - 8));
    }
    if(r < w.length - 1) schieb(REST, 95, 130);
  }
  schieb(12 * 60, 110, 118);
  return { zeit, watt, puls, tempoMs: tempo };
}

/* Die Runden, wie intervals.icu sie liefert: Einfahren, Belastung, Pause, …
   Nur die Belastungsrunden haben die Solldauer und genug Leistung. */
function runden(w){
  const out = [{ start_time: 0, end_time: WARM, moving_time: WARM, average_watts: 120 }];
  let t = WARM;
  for(let r = 0; r < w.length; r++){
    out.push({ start_time: t, end_time: t + WORK, moving_time: WORK, average_watts: w[r] });
    t += WORK;
    if(r < w.length - 1){
      out.push({ start_time: t, end_time: t + REST, moving_time: REST, average_watts: 95 });
      t += REST;
    }
  }
  out.push({ start_time: t, end_time: t + 720, moving_time: 720, average_watts: 110 });
  return out;
}

const W2409 = { watt: [222, 230, 234, 239, 268], hf: [null, 153, 159, 160, 168] };

function rahmen(datum){
  return wiederholungsRahmen(buildDayInfo(plan, TH, datum || DO_W6, START).target, TH);
}

function auswertung(o, datum){
  const w = Object.assign({}, W2409, o);
  return wiederholungsAuswertung(rahmen(datum), einheit(w), runden(w.watt));
}

describe('Rahmen aus dem Plan', () => {
  it('nimmt den Donnerstag mit Zielband', () => {
    const r = rahmen(DO_W8);
    expect(r).toMatchObject({ reps: 5, workSek: 240, lthr: 163 });
    expect(r.band.text).toBe('240–250 W');
  });

  it('nimmt keinen Grundlagentag und keinen Test', () => {
    expect(rahmen(dayFromIso('2026-12-10'))).toBe(null);   // Woche 13, reines Z2
    expect(rahmen(dayFromIso('2026-09-03'))).toBe(null);   // Woche 4, Schwellentest
  });

  /* Die Phase 1 gibt keine Leistung vor. Ein Hinweis auf 5 W mehr waere dort
     eine Vorgabe, die der Trainingsplan gerade nicht macht. */
  it('nimmt keinen Intervalltag ohne Zielband', () => {
    expect(rahmen(dayFromIso('2026-08-20'))).toBe(null);   // Woche 1, ohne power
  });

  it('ohne LTHR gibt es keine Schwelle, aber einen Rahmen', () => {
    const r = wiederholungsRahmen(
      buildDayInfo(plan, { ftp: 192, lthr: null }, DO_W8, START).target, { ftp: 192, lthr: null });
    expect(r.lthr).toBe(null);
  });
});

describe('Der Donnerstag vom 24.09.2026', () => {
  const a = auswertung();

  it('findet fuenf Wiederholungen aus den Runden', () => {
    expect(a.quelle).toBe('runden');
    expect(a.wdh.map(w => w.nr)).toEqual([1, 2, 3, 4, 5]);
    expect(a.wdh.map(w => Math.round(w.watt))).toEqual([222, 230, 234, 239, 268]);
  });

  it('liest den Puls der letzten 60 s und nicht den der ganzen Wiederholung', () => {
    expect(a.wdh.map(w => Math.round(w.hfEnde))).toEqual([0, 153, 159, 160, 168]);
    /* Ueber die ganzen vier Minuten sind es 154 statt 160 bpm - die Minuten,
       in denen der Puls noch steigt, ziehen das Mittel unter die Schwelle.
       Genau deshalb nennt der Plan die letzte Minute und nicht das Intervall. */
    expect(Math.round(a.wdh[3].hf)).toBe(154);
  });

  it('erkennt die fuenfte Wiederholung als Maximalversuch', () => {
    expect(a.hinweis.maximalversuch).toBe(5);
    expect(a.hinweis.bewertet).toEqual([3, 4]);
  });

  /* Der Befund, der Fassung 11 ausgeloest hat. */
  it('empfiehlt +5 W: Band gehalten, Pulskriterium verfehlt', () => {
    expect(a.hinweis.richtung).toBe('plus');
    expect(a.hinweis.grund).toBe('pulsTief');
    expect(a.hinweis.schritt).toBe(NACHSTEUER.schrittWatt);
    expect(a.hinweis.neu).toEqual({ min: 227, max: 242 });
  });

  it('findet die Wiederholungen auch ohne Runden', () => {
    const b = wiederholungsAuswertung(rahmen(), einheit(W2409), null);
    expect(b.quelle).toBe('fenster');
    expect(b.wdh.length).toBe(5);
    expect(b.hinweis.richtung).toBe('plus');
  });
});

describe('Nachsteuerung nach Regel 7', () => {
  const band = { min: 240, max: 250, text: '240–250 W', herkunft: 'Test' };
  const w = (nr, watt, hfEnde) => ({ nr, watt, hfEnde });

  it('haelt das Band, wenn das Kriterium erreicht ist', () => {
    const h = nachsteuerung([w(1, 244, 155), w(2, 245, 162), w(3, 246, 164), w(4, 247, 166)],
                            band, 163);
    expect([h.richtung, h.grund]).toEqual(['halten', 'imBand']);
    expect(h.neu).toBe(null);
  });

  /* Die Wiederholungen 1 und 2 duerfen unter der LTHR bleiben - sonst waere
     jede saubere Serie ein Grund, das Band zu senken. */
  it('senkt nicht, wenn nur die spaeten Wiederholungen darueber liegen', () => {
    const h = nachsteuerung([w(1, 244, 150), w(2, 245, 158), w(3, 246, 164), w(4, 247, 168)],
                            band, 163);
    expect(h.richtung).toBe('halten');
  });

  it('senkt mit Vorbehalt, wenn der Puls ab Wdh. 2 darueber liegt', () => {
    const h = nachsteuerung([w(1, 244, 160), w(2, 245, 166), w(3, 246, 168), w(4, 247, 170)],
                            band, 163);
    expect([h.richtung, h.grund, h.vorbehalt]).toEqual(['minus', 'pulsHoch', true]);
    expect(h.neu).toEqual({ min: 235, max: 245 });
  });

  it('senkt ohne Vorbehalt bei einem Leistungseinbruch ueber 5 %', () => {
    const h = nachsteuerung([w(1, 248, 150), w(2, 247, 155), w(3, 246, 158), w(4, 225, 160)],
                            band, 163);
    expect([h.richtung, h.grund, h.vorbehalt]).toEqual(['minus', 'einbruch', false]);
    expect(Math.round(h.einbruch.schnitt)).toBe(247);
  });

  /* Wer unter dem Band faehrt und die LTHR nicht erreicht, hat kein zu tiefes
     Band, sondern die Vorgabe nicht getroffen. */
  it('hebt nicht, wenn das Band nicht gehalten wurde', () => {
    const h = nachsteuerung([w(1, 215, 148), w(2, 218, 152), w(3, 220, 155), w(4, 222, 158)],
                            band, 163);
    expect([h.richtung, h.grund]).toEqual(['halten', 'bandNichtGehalten']);
  });

  it('haelt ohne Puls in den bewerteten Wiederholungen', () => {
    const h = nachsteuerung([w(1, 244, 150), w(2, 245, 155), w(3, 246, 0), w(4, 247, 0)],
                            band, 163);
    expect([h.richtung, h.grund]).toEqual(['halten', 'ohnePuls']);
  });

  it('ohne LTHR und ohne Band gibt es keinen Hinweis', () => {
    expect(nachsteuerung([w(1, 244, 150), w(2, 245, 155)], band, null).grund).toBe('ohneLthr');
    expect(nachsteuerung([w(1, 244, 150), w(2, 245, 155)], null, 163).grund).toBe('ohneBand');
  });

  it('zaehlt einen Maximalversuch nur am Ende der Serie', () => {
    const mittendrin = nachsteuerung(
      [w(1, 244, 150), w(2, 300, 158), w(3, 246, 155), w(4, 247, 158)], band, 163);
    expect(mittendrin.maximalversuch).toBe(null);
  });
});

describe('Die Auswertung des Tages', () => {
  const aktivitaet = () => ({
    id: 'i999', type: 'Ride', name: 'VO2max', start_date_local: '2026-09-24T17:10:00',
    moving_time: 3780, elapsed_time: 3780
  });

  function tag(a){
    const zonen = { i999: { z1: 900, z2: 600, z3: 400, z4: 700, z5: 1180, _total: 3780,
                            _quelle: 'watt', _wiederholungen: a } };
    return compareDay(plan, TH, DO_W6, START, [aktivitaet()], zonen, [], []);
  }

  const texte = row => row.notes.map(n => n.text).join('\n');

  it('nennt je Wiederholung Ø-Watt und Ø-Puls der letzten 60 s', () => {
    const t = texte(tag(auswertung()));
    expect(t).toContain('Wdh. 2: Ø 230 W, letzte 60 s Ø 153 bpm (unter LTHR 163)');
    expect(t).toContain('Wdh. 5: Ø 268 W, letzte 60 s Ø 168 bpm (≥ LTHR)');
    expect(t).toContain('Wdh. 1: Ø 222 W, ohne Puls.');
  });

  it('gibt den Hinweis fuer das naechste Mal und nennt die Regel', () => {
    const t = texte(tag(auswertung()));
    expect(t).toContain('Nächstes Mal 227–242 W');
    expect(t).toContain('Ausführungsregel 7');
    expect(t).toContain('Wdh. 5 zählt als Maximalversuch');
  });

  /* Die Nachsteuerung ist eine Aussage ueber die Vorgabe, nicht ueber den
     Fahrer: eine Einheit, die das Band gehalten hat, bleibt gut gefahren. */
  it('setzt den Tag nicht herab', () => {
    const row = tag(auswertung());
    expect(row.status).toBe('ok');
    expect(row.badge).toBe('erfüllt');
  });

  it('ohne Wiederholungen bleibt die Bewertung wie bisher', () => {
    const t = texte(tag(null));
    expect(t).toContain('min hart gefahren');
    expect(t).not.toContain('Wiederholungen:');
  });
});
