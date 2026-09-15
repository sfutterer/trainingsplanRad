/* Gleichmaessige Zeit, Drift, Median, Toleranzband - und der Arbeitsweg vom
   15.09.2026, an dem alle vier zusammenkamen.

   Die Fahrt: Dienstag, verlaengerter Hinweg, 84 min, 30,2 km, Trekkingrad
   ohne Leistungsmesser. Ø 132 bpm, Median 133, Drittel 130,7 / 133,9 /
   132,7 bpm bei 21,1 / … / 20,7 km/h, Drift rund 3,4 %. LTHR 163 von Hand,
   Z2 endet bei 135. Gemeldet wurden 38 % ueber Z2 und "zu hart gefahren".

   Die Streams gibt intervals.icu fuer diese Fahrt nicht ueber die Schnittstelle
   heraus, mit der die Tests gebaut wurden. Nachgebaut ist sie deshalb aus
   den Zahlen oben: dieselben Drittelwerte, alle sieben Minuten eine Ampel mit
   Anfahrt und dem Pulsbuckel danach. Das trifft Median, Drift und Zonenanteil
   der echten Fahrt auf wenige Einheiten - und genau diese drei entscheiden. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createPlan } from '../src/domain/plan.js';
import { toMidnight, dayFromIso } from '../src/domain/week.js';
import { zoneSeconds, zonenBaender } from '../src/domain/zones.js';
import { steadyMaske, maskenSekunden, driftAus, pulsMedian, lthrBestaetigt,
         STEADY, GRENZBAND_BPM } from '../src/domain/steady.js';
import { compareDay, istPendel } from '../src/domain/analysis.js';
import { streckenFazit } from '../src/domain/fazit.js';
import { artDerAktivitaet } from '../src/domain/einheiten.js';
import { AUSBELASTET_RPE } from '../src/domain/test.js';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);
const START = toMidnight(dayFromIso('2026-08-15'));

/* Sekundentakt, Tempo in m/s wie velocity_smooth. */
function strom(sek, kmh, hf){
  const zeit = [], tempo = [], puls = [];
  for(let t = 0; t < sek; t++){
    zeit.push(t);
    tempo.push((typeof kmh === 'function' ? kmh(t) : kmh) / 3.6);
    puls.push(typeof hf === 'function' ? hf(t) : hf);
  }
  return { zeit, tempo, puls };
}

describe('Gleichmaessig gefahrene Zeit', () => {
  it('nimmt nur Abschnitte ab 120 s ueber 15 km/h', () => {
    /* 100 s schnell, 20 s Ampel, 300 s schnell. */
    const s = strom(420, t => (t < 100 ? 22 : t < 120 ? 0 : 22), 130);
    const m = steadyMaske(s.zeit, s.tempo);
    expect(m.slice(0, 100).some(Boolean)).toBe(false);
    expect(m.slice(120).every(Boolean)).toBe(true);
    expect(maskenSekunden(s.zeit, m)).toBe(300);
  });

  it('zaehlt genau 15 km/h nicht als gleichmaessig', () => {
    const s = strom(600, STEADY.minKmh, 130);
    expect(steadyMaske(s.zeit, s.tempo).some(Boolean)).toBe(false);
  });

  it('trennt an einer Aufzeichnungspause', () => {
    const s = strom(200, 22, 130);
    for(let i = 100; i < 200; i++) s.zeit[i] += 600;
    const m = steadyMaske(s.zeit, s.tempo);
    expect(m.some(Boolean)).toBe(false);
  });

  it('liefert ohne Tempostrom keine Maske - dann wird nicht gefiltert', () => {
    const s = strom(600, 22, 130);
    expect(steadyMaske(s.zeit, null)).toBe(null);
    expect(steadyMaske(s.zeit, s.tempo.map(() => 0))).toBe(null);
  });

  it('zaehlt Zonen nur ueber die Maske', () => {
    const bands = [{ key: 'z2', min: 0, max: 135 }, { key: 'z3', min: 135, max: 999 }];
    /* Die Ampelphase traegt den hohen Puls. */
    const s = strom(600, t => (t < 60 ? 5 : 22), t => (t < 60 ? 145 : 130));
    const m = steadyMaske(s.zeit, s.tempo);
    const voll = zoneSeconds(bands, s.puls, s.zeit, 600);
    const steady = zoneSeconds(bands, s.puls, s.zeit, 600, { maske: m });
    expect(voll.z3).toBe(60);
    expect(steady.z3).toBe(0);
    expect(steady._total).toBe(540);
  });
});

describe('Drift aus Tempo je Schlag', () => {
  it('ist bei gleichem Puls und gleichem Tempo null', () => {
    const s = strom(3600, 22, 130);
    const d = driftAus(s.zeit, s.puls, s.tempo, steadyMaske(s.zeit, s.tempo));
    expect(d.prozent).toBeCloseTo(0, 6);
  });

  it('steigt, wenn spaeter mehr Puls fuer dasselbe Tempo noetig ist', () => {
    const s = strom(3600, 22, t => 125 + t / 3600 * 10);
    const d = driftAus(s.zeit, s.puls, s.tempo, steadyMaske(s.zeit, s.tempo));
    expect(d.prozent).toBeGreaterThan(4);
    /* Drittel ab 45 min, und es gilt der groessere Wert. */
    expect(d.drittel).not.toBe(null);
    expect(d.prozent).toBe(Math.max(d.haelften, d.drittel));
  });

  it('nimmt unter 45 min nur Haelften und unter 30 min gar nichts', () => {
    const kurz = strom(40 * 60, 22, 130);
    expect(driftAus(kurz.zeit, kurz.puls, kurz.tempo, steadyMaske(kurz.zeit, kurz.tempo)).drittel).toBe(null);
    const zuKurz = strom(25 * 60, 22, 130);
    expect(driftAus(zuKurz.zeit, zuKurz.puls, zuKurz.tempo, steadyMaske(zuKurz.zeit, zuKurz.tempo))).toBe(null);
  });
});

describe('Median und bestaetigte LTHR', () => {
  it('rechnet den Median zeitgewichtet', () => {
    expect(pulsMedian([120, 130, 140], [0, 1, 11])).toBe(130);
    expect(pulsMedian([], [])).toBe(null);
  });

  it('bestaetigt nur eine LTHR aus einem ausbelasteten Test', () => {
    const test = tag => ({ lthr: 163, quellen: { lthr: { art: 'test', tag } } });
    expect(AUSBELASTET_RPE).toBe(9);
    expect(lthrBestaetigt({ lthr: 163, quellen: { lthr: { art: 'hand', seit: '2026-09-12T18:04' } } },
      [{ day: '2026-09-10', rpe: 10 }])).toBe(false);
    expect(lthrBestaetigt(test('2026-09-10'), [{ day: '2026-09-10', rpe: 8 }])).toBe(false);
    expect(lthrBestaetigt(test('2026-09-10'), [{ day: '2026-09-10', rpe: 9 }])).toBe(true);
    expect(lthrBestaetigt({ lthr: 163 }, [])).toBe(false);
  });
});

/* ---- Der Arbeitsweg vom 15.09.2026 ---- */

const TH = { ftp: 192, lthr: 163, hrmax: 180,
             quellen: { lthr: { art: 'hand', seit: '2026-09-12T18:04' } } };
const TESTS = [{ day: '2026-09-10', rpe: 8, lthr: 152 }];
const DI = dayFromIso('2026-09-15');

function pendelStrom(){
  const N = 84 * 60;
  const hfDrittel = [130.7, 133.9, 132.7], kmhDrittel = [21.1, 20.9, 20.7];
  return strom(N, t => {
    const d = Math.min(2, Math.floor(t / N * 3));
    const z = t % 420;
    if(z < 15) return 0;
    if(z < 25) return 8;
    if(z < 45) return 13;
    return kmhDrittel[d] + 1.2 * Math.sin(t / 37);
  }, t => {
    const d = Math.min(2, Math.floor(t / N * 3));
    const z = t % 420;
    const buckel = z >= 25 && z < 100 ? 9 * Math.sin(Math.PI * (z - 25) / 75) : 0;
    return Math.round(hfDrittel[d] + 2.5 * Math.sin(t / 23) + 1.5 * Math.sin(t / 7.3) + buckel);
  });
}

/* Genau das, was useTagesauswertung je Fahrt ohne Leistung zusammentraegt. */
function zonenWieDieAnsicht(s, th, tests, woche){
  const { quelle, bands } = zonenBaender(plan, th, woche, false);
  const z = zoneSeconds(bands, s.puls, s.zeit, s.zeit.length);
  z._quelle = quelle;
  z._wattAusgefallen = woche >= plan.cogganFromWeek;
  const maske = steadyMaske(s.zeit, s.tempo);
  z._steady = zoneSeconds(bands, s.puls, s.zeit, s.zeit.length, { maske });
  z._drift = driftAus(s.zeit, s.puls, s.tempo, maske);
  z._hfMedian = pulsMedian(s.puls, s.zeit);
  z._z2Grenze = bands.find(b => b.key === 'z2').max;
  z._lthrBestaetigt = lthrBestaetigt(th, tests);
  return z;
}

const PENDEL = {
  id: 'i186828088', type: 'Ride', name: 'Bruchsal Gravel/Offroad-Radfahren',
  start_date_local: '2026-09-15T07:03:01', moving_time: 5060, elapsed_time: 5278,
  distance: 30169.64, average_heartrate: 132, has_heartrate: true,
  commute: true, sub_type: 'COMMUTE', decoupling: null,
  icu_hr_zone_times: [57, 3431, 1587, 0, 0]
};

describe('Arbeitsweg vom 15.09.2026', () => {
  const s = pendelStrom();
  const zonen = zonenWieDieAnsicht(s, TH, TESTS, 5);

  it('bildet die Fahrt nach, wie sie gemessen wurde', () => {
    expect(zonen._z2Grenze).toBe(135);
    expect(zonen._hfMedian).toBe(133);
    expect(Math.abs(zonen._hfMedian - zonen._z2Grenze)).toBeLessThanOrEqual(GRENZBAND_BPM);
    expect(zonen._drift.prozent).toBeGreaterThan(2);
    expect(zonen._drift.prozent).toBeLessThanOrEqual(5);
    const ueber = (zonen.z3 + zonen.z4 + zonen.z5) / zonen._total;
    expect(ueber).toBeGreaterThan(0.25);
    expect(zonen._steady._total).toBeLessThan(zonen._total);
  });

  it('steht in der Liste als Grundlage und nicht als Intervalle', () => {
    expect(istPendel(PENDEL)).toBe(true);
    expect(artDerAktivitaet(PENDEL)).toBe('z2');
    /* Dieselbe Fahrt ohne den Pendelvermerk waere ueber die Zonenschwelle
       gefallen - der Vermerk ist, was sie davor bewahrt. */
    expect(artDerAktivitaet({ ...PENDEL, commute: false, sub_type: null })).toBe('intervalle');
  });

  it('wird nicht mehr als "zu hart gefahren" bewertet', () => {
    const row = compareDay(plan, TH, DI, START, [PENDEL], { [PENDEL.id]: zonen }, [], []);
    expect(row.badge).not.toBe('zu hart');
    expect(row.status).toBe('ok');
    expect(row.notes.filter(n => n.kind === 'bad')).toEqual([]);
  });

  it('gibt stattdessen einen Pruefhinweis mit den Gruenden dagegen', () => {
    const row = compareDay(plan, TH, DI, START, [PENDEL], { [PENDEL.id]: zonen }, [], []);
    const text = row.fahrten[0].notes.map(n => n.text).join(' ');
    expect(text).toContain('Anteil über Z2 erhöht');
    expect(text).toContain('Zeitdruck oder Ankunftspuffer prüfen');
    expect(text).toContain('Drift aus Puls und Tempo');
    expect(text).toContain('keine Leistungsdaten');
    expect(text).toContain('Toleranzband');
    /* Worauf sich der Anteil stuetzt, steht dabei. */
    expect(text).toMatch(/Zonenanteile über \d+ von 8\d min gleichmäßig gefahrener Zeit/);
    expect(row.pruefHinweis).toBeTruthy();
  });

  it('kennzeichnet das Fazit als vorlaeufig und urteilt nicht', () => {
    const row = compareDay(plan, TH, DI, START, [PENDEL], { [PENDEL.id]: zonen }, [], []);
    const f = streckenFazit(row, null, null, null);
    expect(f.vorlaeufig).toBe(true);
    expect(f.urteil).toBe('erklaert');
    expect(f.satz).toContain('Kein Befund');
    expect(f.satz).not.toContain('Zu hart');
  });

  it('nimmt das Toleranzband weg, sobald ein ausbelasteter Test die LTHR traegt', () => {
    const th = { ...TH, quellen: { lthr: { art: 'test', tag: '2026-09-10' } } };
    const z = zonenWieDieAnsicht(s, th, [{ day: '2026-09-10', rpe: 9 }], 5);
    const row = compareDay(plan, th, DI, START, [PENDEL], { [PENDEL.id]: z }, [], []);
    const text = row.fahrten[0].notes.map(n => n.text).join(' ');
    expect(text).not.toContain('Toleranzband');
    expect(text).toContain('Drift aus Puls und Tempo');
  });
});

/* Dieselbe Rechnung auf einer Grundlagenfahrt, die keine Pendelfahrt ist. */
describe('Grundlagenfahrt ohne Leistung', () => {
  /* Ein Samstag ab Woche 5 ohne geplante Bloecke - an Blocktagen prueft die
     Zaehlung die Dosis, und dort gilt keine Gegeninstanz. */
  const idx = plan.weeks.findIndex((w, i) => i >= 4 && !w.tage.sa.bloecke);
  const SA = new Date(START); SA.setDate(SA.getDate() + idx * 7);
  const woche = idx + 1;
  const t = { id: 'x', type: 'Ride', start_date_local: '2026-09-19T09:00:00',
              moving_time: 84 * 60, elapsed_time: 84 * 60, distance: 30000 };

  it('unterdrueckt "zu hart" bei flachem Drift und nennt den Anteil als Information', () => {
    const s = pendelStrom();
    const z = zonenWieDieAnsicht(s, TH, TESTS, woche);
    const row = compareDay(plan, TH, SA, START, [t], { x: z }, [], []);
    expect(row.target.hardMinutes).toBeFalsy();
    expect(row.badge).not.toBe('zu hart');
    expect(row.fahrten[0].notes.map(n => n.text).join(' ')).toContain('Kein Befund „zu hart“');
    expect(row.vorlaeufig).toBe(true);
  });

  it('bleibt bei "zu hart", wenn der Puls wirklich wegdriftet und weit ueber der Grenze liegt', () => {
    const N = 84 * 60;
    const s = strom(N, 22, t => Math.round(140 + t / N * 14));
    const z = zonenWieDieAnsicht(s, TH, TESTS, woche);
    const row = compareDay(plan, TH, SA, START, [t], { x: z }, [], []);
    expect(z._drift.prozent).toBeGreaterThan(5);
    expect(row.badge).toBe('zu hart');
    expect(streckenFazit(row, null, null, null).vorlaeufig).toBe(true);
  });
});
