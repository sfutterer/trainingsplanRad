/* Die Auswertung einer Fahrt nach Abschnitten.

   Anlass ist die Samstagsausfahrt vom 19.09.2026 (Woche 6, Blockwoche):
   Decoupling im Z2-Teil -1,2 %, zwei Bloecke mit 172 und 171 W - und die
   Auswertung meldete "zu hart", weil sie jede Sekunde ueber 144 W zaehlte.

   Die Fahrt hier ist nachgebaut, nicht aufgezeichnet: dieselben Runden, wie
   intervals.icu sie fuer diese Aktivitaet liefert (Block 1 ab 7346 s mit
   722 s und 172 W, Block 2 ab 8595 s mit 725 s und 171 W, 11230 s gesamt),
   dazwischen Z2 um 131 W mit kurzen Spitzen, Kuppen und drei Ampelhalten. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createPlan } from '../src/domain/plan.js';
import { toMidnight, dayFromIso } from '../src/domain/week.js';
import { compareDay } from '../src/domain/analysis.js';
import { fahrtAbschnitte, abschnittsRahmen, abschnittsAuswertung, entkopplung, ABSCHNITT }
  from '../src/domain/abschnitte.js';
import * as Z from '../src/domain/zones.js';
import { planValidate } from '../src/domain/schema.js';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);
const START = toMidnight(dayFromIso('2026-08-15'));
const TH = { ftp: 192, lthr: 163, hrmax: 180 };
const SA_W6 = dayFromIso('2026-09-19');   // Woche 6, Bloecke 2 x 12 min
const SA_W8 = dayFromIso('2026-10-03');   // Woche 8, reines Z2

const RUNDEN_1909 = [
  { start_time: 0,    end_time: 4167,  elapsed_time: 4167, moving_time: 3844, average_watts: 130 },
  { start_time: 4167, end_time: 4371,  elapsed_time: 204,  moving_time: 204,  average_watts: 107 },
  { start_time: 4371, end_time: 7346,  elapsed_time: 2975, moving_time: 2903, average_watts: 126 },
  { start_time: 7346, end_time: 8068,  elapsed_time: 722,  moving_time: 722,  average_watts: 172 },
  { start_time: 8068, end_time: 8595,  elapsed_time: 527,  moving_time: 527,  average_watts: 134 },
  { start_time: 8595, end_time: 9320,  elapsed_time: 725,  moving_time: 725,  average_watts: 171 },
  { start_time: 9320, end_time: 11230, elapsed_time: 1910, moving_time: 1894, average_watts: 132 }
];

/* Eine Fahrt im Sekundentakt. opt verschiebt einzelne Groessen:
     z2Watt      Grundlast im Z2-Teil
     block       Leistung in den Bloecken, [b1, b2]
     hfDrift     Pulsanstieg ueber die Fahrt in bpm (bei gleicher Leistung)
     kadenz      Kadenz im Z2-Teil
     spitzen     alle 5 min 3 s mit dieser Leistung - Antritt, Schotter
     kuppen      alle 20 min 60 s mit dieser Leistung */
function fahrt(opt){
  const o = Object.assign({ z2Watt: 131, block: [172, 171], hfDrift: 0, kadenz: 81,
                            spitzen: 250, kuppen: 165, dauer: 11230 }, opt);
  const zeit = [], watt = [], puls = [], tempo = [], kadenz = [];
  for(let s = 0; s < o.dauer; s++){
    let w = o.z2Watt, k = o.kadenz, v = 21 / 3.6;
    const inB1 = s >= 7346 && s < 8068, inB2 = s >= 8595 && s < 9320;
    if(inB1) { w = o.block[0]; k = 88; }
    else if(inB2) { w = o.block[1]; k = 87; }
    else {
      if(s % 300 < 3) w = o.spitzen;
      if(s % 1200 >= 600 && s % 1200 < 660) w = o.kuppen;
    }
    /* drei Ampelhalte zu je 60 s */
    if([1800, 3600, 5400].some(a => s >= a && s < a + 60)){ w = 0; v = 0; k = 0; }
    zeit.push(s); watt.push(w); kadenz.push(k); tempo.push(v);
    puls.push(128 + o.hfDrift * s / o.dauer + (inB1 || inB2 ? 10 : 0));
  }
  return { zeit, watt, puls, tempoMs: tempo, kadenz };
}

function rahmenW6(){ return abschnittsRahmen(plan, TH, 6, true); }

function aktivitaet(){
  return { id: 'i188195818', type: 'GravelRide', name: 'Bruchsal Gravel',
           start_date_local: '2026-09-19T10:34:57', moving_time: 10814, elapsed_time: 11230,
           distance: 62914, average_heartrate: 131 };
}

/* Die Zonen, wie der Hook sie baut, samt _abschnitte. */
function zonenMit(a){
  return { i188195818: { z1: 1000, z2: 7000, z3: 2000, z4: 300, z5: 200, _total: 10500,
                         _quelle: 'watt', _method: 'zeitgewichtet', _takt: 1, _samples: 11230,
                         _abschnitte: a } };
}

function tag(a, datum){
  return compareDay(plan, TH, datum || SA_W6, START, [aktivitaet()], zonenMit(a), [], []);
}

const texte = row => row.notes.map(n => n.text).join('\n');

describe('Bezugswerte aus plan.json', () => {
  it('Z2 haengt an der Test-FTP, nicht an der Arbeits-FTP', () => {
    expect(Z.z2WattBand(plan, TH)).toEqual({ min: 106, max: 144 });
  });

  it('die Samstagsbloecke haengen an der Arbeits-FTP: 165-181 W', () => {
    const b = Z.blockWattBand(plan, TH);
    expect([b.min, b.max]).toEqual([165, 181]);
    expect(b.ftp).toMatchObject({ watt: 206, quelle: 'arbeit' });
  });

  it('die Do-Intervalle ebenso: 222-237 W, mit Herkunft', () => {
    expect(Z.prozentWatt(plan, TH, '108–115 % FTP')).toBe('222–237 W');
    expect(Z.mitZielwatt(plan, TH, '108–115 % FTP'))
      .toBe('108–115 % FTP = 222–237 W aus Arbeits-FTP 206 W');
    expect(Z.prozentWatt(plan, TH, '90–95 % FTP')).toBe('185–196 W');
    expect(Z.prozentWatt(plan, TH, 'ca. 95 % FTP')).toBe('196 W');
  });

  it('ohne arbeits_ftp gilt die Test-FTP - alte Zahlen statt keiner', () => {
    const ohne = createPlan(Object.assign(structuredClone(json), { arbeits_ftp: undefined }));
    expect(Z.arbeitsFtp(ohne, TH)).toMatchObject({ watt: 192, quelle: 'test' });
    expect(Z.mitZielwatt(ohne, TH, '108–115 % FTP')).toBe('108–115 % FTP = 207–221 W aus Test-FTP 192 W');
    expect(Z.mitZielwatt(ohne, { ftp: null }, '108–115 % FTP')).toBe('108–115 % FTP');
  });

  it('die Samstagskarte der Woche 6 nennt das Blockziel und seine Grundlage', () => {
    const txt = JSON.stringify(D_info(SA_W6));
    expect(txt).toContain('165–181 W · 80–88 % Arbeits-FTP 206 W · 85–90 rpm');
  });

  it('Kadenz Z2: 80-85 rpm auf dem Cube, 85-90 rpm auf dem Trekkingrad', () => {
    expect(Z.cadenceText(plan, 'z2', 6)).toBe('80–85 rpm');
    expect(Z.cadenceTextTrekking(plan, 'z2', 6)).toBe('85–90 rpm');
    const di = JSON.stringify(D_info(dayFromIso('2026-09-22')));
    expect(di).toContain('85–90 rpm');
    expect(di).not.toContain('80–85 rpm');
  });

  it('beanstandet eine arbeits_ftp ohne Herkunft', () => {
    const k = structuredClone(json);
    delete k.arbeits_ftp.herkunft;
    expect(planValidate(k).join(' ')).toContain('arbeits_ftp.herkunft');
    expect(planValidate(json)).toEqual([]);
  });
});

import * as D from '../src/domain/day.js';
function D_info(datum){ return D.buildDayInfo(plan, TH, datum, START); }

describe('Zerlegung der Fahrt vom 19.09.', () => {
  const r = rahmenW6();
  const a = abschnittsAuswertung(r, fahrt(), RUNDEN_1909);

  it('nimmt die Bloecke aus den Runden', () => {
    expect(a.blockQuelle).toBe('runden');
    expect(a.bloecke.length).toBe(2);
    expect(Math.round(a.bloecke[0].watt)).toBe(172);
    expect(Math.round(a.bloecke[1].watt)).toBe(171);
    expect(Math.round(a.bloecke[0].sek / 60)).toBe(12);
  });

  it('die ganze Fahrt als eine Runde ist kein Block', () => {
    /* 4167 s mit 130 W: zu lang und zu schwach. */
    expect(a.bloecke.every(b => b.sek < ABSCHNITT.rundeMaxSek + 1)).toBe(true);
  });

  it('nimmt Stillstand heraus, Einfahren und Ausrollen aus der Bewertung', () => {
    expect(a.stillSek).toBe(180);
    expect(a.einfahrenSek).toBe(15 * 60);
    expect(a.ausrollenSek).toBe(10 * 60);
    expect(a.bewegtSek).toBe(11230 - 180);
  });

  it('eine Blockpause von 8 min nach dem ersten Block, keine nach dem letzten', () => {
    expect(a.pausen.length).toBe(1);
    expect(a.pausen[0].sek).toBe(8 * 60);
  });

  it('zaehlt die Zeit ueber Z2 geglaettet: Antritte fallen weg, Kuppen bleiben', () => {
    /* 3 s mit 250 W heben das 30-s-Mittel um 12 W auf 143 W - kein
       Ueberschreiten. Die Kuppen mit 60 s bei 165 W zaehlen dagegen. */
    const roh = fahrt().watt.filter((w, s) => w > 144 && (s < 7346 || s >= 9320)).length;
    expect(a.z2.ueberSek).toBeLessThan(roh);
    expect(a.z2.ueberSek).toBeGreaterThan(0);
    expect(a.z2.ueberSek / a.z2.sek).toBeLessThan(ABSCHNITT.ueberZ2Anteil);
  });

  it('rechnet das Decoupling nur ueber den Z2-Teil vor dem ersten Block', () => {
    expect(a.entkopplung).not.toBeNull();
    /* Minute 15 bis 7346 s, ohne Ampeln - die Bloecke mit +10 bpm liegen
       danach und duerfen den Wert nicht verschieben. */
    expect(a.driftSek).toBe(7346 - 900 - 180);
    expect(Math.abs(a.entkopplung.prozent)).toBeLessThan(1);
  });

  it('ohne Runden: die zwei staerksten 12-min-Fenster der zweiten Haelfte', () => {
    const b = abschnittsAuswertung(r, fahrt(), null);
    expect(b.blockQuelle).toBe('fenster');
    expect(b.bloecke.length).toBe(2);
    /* Die Fenster liegen auf der Bewegungszeit; die Bloecke beginnen dort
       180 s frueher als in der Aufzeichnung. */
    expect(Math.abs(b.bloecke[0].von - (7346 - 180))).toBeLessThan(60);
    expect(Math.abs(b.bloecke[1].von - (8595 - 180))).toBeLessThan(60);
    expect(b.bloecke[0].watt).toBeGreaterThan(165);
  });

  it('kennt ausserhalb einer Blockwoche keine Bloecke, auch mit Runden', () => {
    const b = abschnittsAuswertung(abschnittsRahmen(plan, TH, 8, true), fahrt(), RUNDEN_1909);
    expect(b.bloecke).toEqual([]);
    expect(b.bloeckeSoll).toBeNull();
  });

  it('bleibt ohne Leistungsstrom leer', () => {
    expect(fahrtAbschnitte({ zeit: [1, 2, 3], watt: null })).toBeNull();
  });
});

describe('Urteil ueber die Fahrt vom 19.09.', () => {
  const a = abschnittsAuswertung(rahmenW6(), fahrt(), RUNDEN_1909);
  const row = tag(a);
  const t = texte(row);

  it('ist nicht zu hart', () => {
    expect(row.badge).not.toBe('zu hart');
    expect(row.notes.some(n => n.kind === 'bad')).toBe(false);
  });

  it('weist Z2-Anteil und Bloecke getrennt aus', () => {
    expect(t).toMatch(/Z2-Anteil: \d+ min, davon \d+ min über Z2/);
    expect(t).toMatch(/Geplante Blöcke: 2 × 12 min, Ø 17[12] W/);
    expect(t).toContain("(Ziel 165–181 W, 80–88 % der Arbeits-FTP 206 W)");
  });

  it('zeigt keine Z3-Summe ueber die ganze Fahrt mehr', () => {
    expect(t).not.toContain('Z3-Blockzeit');
    expect(t).not.toMatch(/% der Zeit über Z2/);
  });

  it('Kadenz 81 rpm im Z2-Anteil ist kein Fehler', () => {
    expect(row.notes.find(n => /Ø-Kadenz im Z2-Anteil/.test(n.text)).kind).toBe('good');
  });
});

describe('Wann "zu hart" gilt', () => {
  it('Decoupling ueber 5 % - zu hart', () => {
    const a = abschnittsAuswertung(rahmenW6(), fahrt({ hfDrift: 40 }), RUNDEN_1909);
    expect(a.entkopplung.prozent).toBeGreaterThan(5);
    const row = tag(a);
    expect(row.badge).toBe('zu hart');
    expect(texte(row)).toContain('Decoupling +');
  });

  it('Z2-Anteil im Schnitt ueber 144 W, aber Decoupling bis 5 % - keine Warnung', () => {
    const a = abschnittsAuswertung(rahmenW6(), fahrt({ z2Watt: 150 }), RUNDEN_1909);
    expect(a.z2.watt).toBeGreaterThan(144);
    const row = tag(a);
    expect(row.badge).not.toBe('zu hart');
    const n = row.notes.find(x => /Plan-Punkt 28/.test(x.text));
    expect(n.kind).toBe('info');
  });

  it('ohne Puls entscheiden Ø-Leistung und Zeitanteil', () => {
    const f = fahrt({ z2Watt: 150 });
    f.puls = null;
    const a = abschnittsAuswertung(rahmenW6(), f, RUNDEN_1909);
    expect(a.entkopplung).toBeNull();
    expect(tag(a).badge).toBe('zu hart');
  });

  it('ein Block unter 165 W ist ein Hinweis "zu weich", kein "zu hart"', () => {
    const a = abschnittsAuswertung(rahmenW6(), fahrt({ block: [150, 172] }),
      RUNDEN_1909.map(r => r.start_time === 7346 ? Object.assign({}, r, { average_watts: 160 }) : r));
    const row = tag(a);
    expect(texte(row)).toContain('Block 1 zu weich');
    expect(row.badge).not.toBe('zu hart');
  });

  it('ein Block ueber 181 W: "zu hart" nur als Hinweis am Block', () => {
    const a = abschnittsAuswertung(rahmenW6(), fahrt({ block: [172, 195] }), RUNDEN_1909);
    const row = tag(a);
    expect(texte(row)).toContain('Block 2 zu hart');
    expect(row.badge).not.toBe('zu hart');
  });

  it('Kadenz unter 80 rpm im Z2-Anteil ist ein Hinweis', () => {
    const a = abschnittsAuswertung(rahmenW6(), fahrt({ kadenz: 76 }), RUNDEN_1909);
    const n = tag(a).notes.find(x => /Ø-Kadenz im Z2-Anteil/.test(x.text));
    expect(n.kind).toBe('');
    expect(n.text).toContain('unter 80 rpm');
  });

  it('reines Z2 in Woche 8: Decoupling bis zum Ausrollen, keine Bloecke', () => {
    const a = abschnittsAuswertung(abschnittsRahmen(plan, TH, 8, true),
      fahrt({ block: [131, 131] }), null);
    expect(a.driftSek).toBe(11230 - 180 - 900 - 600);
    const row = tag(a, SA_W8);
    expect(row.badge).not.toBe('zu hart');
    expect(texte(row)).not.toContain('Geplante Blöcke');
  });
});

describe('Decoupling', () => {
  it('rechnet (P/HF erste - P/HF zweite) / P/HF erste', () => {
    const p = [];
    for(let i = 0; i < 1800; i++) p.push({ dt: 1, watt: 140, hf: i < 900 ? 130 : 136.5 });
    const e = entkopplung(p);
    expect(e.prozent).toBeCloseTo((140 / 130 - 140 / 136.5) / (140 / 130) * 100, 5);
  });

  it('unter 20 min kein Wert', () => {
    const p = Array.from({ length: 600 }, () => ({ dt: 1, watt: 140, hf: 130 }));
    expect(entkopplung(p)).toBeNull();
  });
});
