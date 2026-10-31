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
import * as W from '../src/domain/week.js';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);
const START = toMidnight(dayFromIso('2026-08-15'));
const TH = { ftp: 192, lthr: 163, hrmax: 180 };
/* Die Messwerte seit dem Retest am 22.10.2026. TH bleibt daneben stehen: die
   gefahrenen Tage dieser Datei sind gegen 192 W gefahren, und ihre Bewertung
   muss gegen den Wert rechnen, der an ihnen galt. */
const TH12 = { ftp: 223, lthr: 166, hrmax: 180 };
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
  /* Z2 haengt an der eingetragenen FTP und wandert mit jedem Test: 106-144 W
     aus der ersten Messung, 123-167 W aus dem Retest. Bis Fassung 11 nannte
     der Trainingsplan die 106-144 W als feste Zahl "unabhaengig von der FTP";
     gerechnet hat die App es immer schon so. */
  it('Z2 folgt der eingetragenen FTP', () => {
    expect(Z.z2WattBand(plan, TH)).toEqual({ min: 106, max: 144 });
    expect(Z.z2WattBand(plan, TH12)).toEqual({ min: 123, max: 167 });
  });

  /* Die Bloecke vom 19.09. sind gegen 165-181 W aus der Arbeits-FTP 206 W
     gefahren. Seit Fassung 11 steht die Arbeits-FTP bei 215 W - das Band der
     Woche 6 steht deshalb als festes zielwatt in plan.json, sonst faellt die
     gefahrene Einheit nachtraeglich durch ein Band, das es an diesem Tag nicht
     gab. Die Wochen 9 und 12 rechnen weiter aus dem Prozentsatz. */
  it('die Samstagsbloecke der Woche 6 bleiben bei 165-181 W', () => {
    const b = Z.blockWattBand(plan, TH, W.saturdayBlockData(plan, 6));
    expect([b.min, b.max, b.quelle]).toEqual([165, 181, 'plan']);
    expect(b.herkunft).toContain('Arbeits-FTP 206 W');
  });

  /* Woche 9 ist aus demselben Grund eingefroren wie Woche 6, nur eine
     Fassung spaeter: sie wurde gegen 172-189 W aus der Arbeits-FTP 215 W
     gefahren. Ohne das feste Band waere sie mit dem Retest still auf
     178-196 W gewandert - 80-88 % der neuen FTP 223 W. */
  it('die Samstagsbloecke der Woche 9 bleiben bei 172-189 W', () => {
    const b = Z.blockWattBand(plan, TH12, W.saturdayBlockData(plan, 9));
    expect([b.min, b.max, b.quelle]).toEqual([172, 189, 'plan']);
    expect(b.herkunft).toContain('Arbeits-FTP 215 W');
  });

  /* Woche 12 steht noch aus und traegt deshalb kein festes Band: sie rechnet
     gegen die heute eingetragene FTP. */
  it('die Samstagsbloecke der Woche 12 rechnen gegen die eingetragene FTP', () => {
    const b = Z.blockWattBand(plan, TH12, W.saturdayBlockData(plan, 12));
    expect([b.min, b.max, b.quelle]).toEqual([178, 196, 'prozent']);
    expect(b.herkunft).toBe('80–88 % der FTP 223 W');
  });

  it('die Do-Intervalle ab Woche 8 stehen fest bei 240-250 W', () => {
    const b = Z.zielband(plan, TH, W.thursdayData(plan, 8));
    expect([b.min, b.max, b.text, b.quelle]).toEqual([240, 250, '240–250 W', 'plan']);
    expect(b.herkunft).toContain('112–116 % der Arbeits-FTP 215 W');
  });

  it('Woche 7 fest bei 196 W, Phase 4 gerechnet bei 201-212 W', () => {
    const w7 = Z.zielband(plan, TH12, W.thursdayData(plan, 7));
    expect([w7.min, w7.max, w7.text]).toEqual([196, 196, '196 W']);
    const w15 = Z.zielband(plan, TH12, W.thursdayData(plan, 15));
    expect([w15.min, w15.max, w15.quelle]).toEqual([201, 212, 'prozent']);
    expect(w15.herkunft).toBe('90–95 % der FTP 223 W');
  });

  /* Der Erhaltungsreiz der Wochen 11 und 12 steht als Band in der Datei und
     nicht als Prozentsatz: er wird ueber das Pulskriterium in 5-W-Schritten
     nachgesteuert, und ein nachgesteuerter Wert ist keine runde Prozentzahl
     mehr. Mit dem Retest ist er von 240-250 auf 250-260 W gegangen - von Hand,
     nicht gerechnet. */
  it('der Erhaltungsreiz der Wochen 11 und 12 steht bei 250-260 W', () => {
    for(const nr of [11, 12]){
      const schritte = W.thursdayData(plan, nr).steps.filter(x => x.type === 'work');
      expect(schritte.length).toBe(3);
      for(const st of schritte){
        const b = Z.zielband(plan, TH12, st);
        expect([b.min, b.max, b.quelle]).toEqual([250, 260, 'plan']);
        expect(b.herkunft).toContain('FTP 223 W');
      }
    }
  });

  /* Die VO2max-Variante der Woche 5 ist derselbe Tag in zweiter Form - ihre
     vier Wiederholungen tragen deshalb dasselbe Band. Nur der Maximalversuch
     bleibt ohne: er ist der Messwert, und eine Obergrenze daran waere eine
     Vorgabe fuer eine Messung. */
  it('die Wiederholungen der Woche-5-Variante tragen das Band des Tages', () => {
    const v = W.thursdayData(plan, 5).variante;
    const arbeit = v.steps.filter(s => s.type === 'work');
    expect(arbeit.map(s => s.effort || Z.zielband(plan, TH, s).text))
      .toEqual(['alles geben', '222–237 W', '222–237 W', '222–237 W', '222–237 W']);
  });

  /* Seit Fassung 12 steht keine arbeits_ftp mehr in der ausgelieferten Datei:
     jeder Prozentsatz rechnet gegen die eingetragene FTP. Der Weg bleibt
     trotzdem offen - ein eigener oder gehobener Plan darf das Feld mitbringen,
     und dann gilt es wieder fuer die Zielwatt und nur fuer sie. */
  it('ohne arbeits_ftp rechnet jeder Prozentsatz gegen die eingetragene FTP', () => {
    expect(json.arbeits_ftp).toBeUndefined();
    expect(Z.arbeitsFtp(plan, TH12)).toMatchObject({ watt: 223, quelle: 'test' });
    const b = Z.prozentBand(plan, TH12, '108–115 % FTP');
    expect(b.text).toBe('241–256 W');
    expect(b.herkunft).toBe('108–115 % der FTP 223 W');
    expect(Z.prozentBand(plan, { ftp: null }, '108–115 % FTP')).toBe(null);
  });

  it('mit arbeits_ftp gilt sie weiter fuer die Zielwatt, nicht fuer die Zonen', () => {
    const mit = createPlan(Object.assign(structuredClone(json), {
      arbeits_ftp: { watt: 215, seit: '2026-09-24', herkunft: 'Pulskriterium' }
    }));
    expect(Z.arbeitsFtp(mit, TH12)).toMatchObject({ watt: 215, quelle: 'arbeit' });
    expect(Z.prozentBand(mit, TH12, '90–95 % FTP').text).toBe('194–204 W');
    expect(Z.z2WattBand(mit, TH12)).toEqual({ min: 123, max: 167 });
  });

  it('die Samstagskarte der Woche 6 nennt das Blockziel und seine Grundlage', () => {
    const txt = JSON.stringify(D_info(SA_W6));
    expect(txt).toContain('165–181 W · 85–90 rpm');
    expect(txt).toContain('80–88 % der Arbeits-FTP 206 W');
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
    k.arbeits_ftp = { watt: 215, seit: '2026-09-24' };
    expect(planValidate(k).join(' ')).toContain('arbeits_ftp.herkunft');
    k.arbeits_ftp.herkunft = 'Pulskriterium Do 17.09./24.09.';
    expect(planValidate(k)).toEqual([]);
    expect(planValidate(json)).toEqual([]);
  });

  it('beanstandet ein zielwatt ohne Herkunft und ein verdrehtes Band', () => {
    const ohneHerkunft = structuredClone(json);
    delete ohneHerkunft.weeks[7].tage.do.zielwatt.herkunft;
    expect(planValidate(ohneHerkunft).join(' ')).toContain('.do.zielwatt.herkunft');
    const verdreht = structuredClone(json);
    verdreht.weeks[7].tage.do.zielwatt.max = 200;
    expect(planValidate(verdreht).join(' ')).toContain('min 240 liegt über max 200');
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
    expect(t).toContain("(Ziel 165–181 W, 80–88 % der Arbeits-FTP 206 W (bis 24.09.2026))");
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
