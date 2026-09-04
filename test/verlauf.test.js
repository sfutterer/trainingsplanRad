/* Die Verlaufsansicht behauptet Richtungen, und Richtungen steuern Training.
   Genau dafuer sind synthetische Reihen da: eine steigende Reihe MUSS steigend
   heissen, eine flache flach, und - der Fall, der hier am meisten zaehlt - eine
   zu kurze oder zu duenne Reihe muss schweigen statt zu raten.

   Der Ausreisserfall steht doppelt drin, einmal fuer die Steigung und einmal
   fuer den Effizienzfaktor: der Median paarweiser Steigungen ist der einzige
   Grund, warum eine Hitzeausfahrt die Aussage ueber acht Wochen nicht kippt. */

import { describe, it, expect } from 'vitest';
import { VERLAUF, theilSen, trendAus, zweiPunktVergleich, wochenNummer,
         effizienzFenster, effizienzSerie, entkopplungSerie,
         testSerie, umfangSerie, zonenAusAktivitaet, zonenSerie, rumpfSerie,
         verlaufBericht } from '../src/domain/verlauf.js';
import { tagNr, kurzTag, tagPlus } from '../src/domain/week.js';
import { zahl } from '../src/domain/zahlen.js';

const AB = '2026-08-15';

function reihe(n, start, schritt, abstand){
  const out = [];
  for(let i = 0; i < n; i++){
    out.push({ t: tagNr(AB) + i * (abstand == null ? 7 : abstand), v: start + i * schritt });
  }
  return out;
}

/* Eine Fahrt, wie sie von intervals.icu kommt. Standard ist eine vergleichbare
   Z2-Ausfahrt: 90 min, 30 km, Puls 120 bei LTHR 160. */
function fahrt(tag, extra){
  return Object.assign({
    id: 'a' + tag, start_date_local: tag + 'T09:00:00', type: 'Ride', name: 'Ausfahrt',
    moving_time: 90 * 60, elapsed_time: 90 * 60, distance: 30000,
    average_heartrate: 120, has_heartrate: true
  }, extra || {});
}


const TH = { ftp: 200, lthr: 160, hrmax: 185 };

describe('Kalender und Zahlen', () => {
  it('rechnet Tage und Wochen auf dem ISO-String', () => {
    expect(tagNr('2026-08-16') - tagNr('2026-08-15')).toBe(1);
    expect(tagNr('kaputt')).toBe(null);
    expect(wochenNummer('2026-08-15', AB)).toBe(1);
    expect(wochenNummer('2026-08-21', AB)).toBe(1);
    expect(wochenNummer('2026-08-22', AB)).toBe(2);
    expect(wochenNummer('2026-09-19', AB)).toBe(6);
  });
  it('schreibt Zahlen mit Komma', () => {
    expect(zahl(1.2345, 2)).toBe('1,23');
    expect(zahl(NaN, 1)).toBe('–');
    expect(kurzTag('2026-09-19')).toBe('19.09.');
  });
});

describe('theilSen', () => {
  it('findet die Steigung einer geraden Reihe', () => {
    const ts = theilSen(reihe(6, 100, 7));          // 7 je Woche = 1 je Tag
    expect(ts.proTag).toBeCloseTo(1, 6);
    expect(ts.n).toBe(6);
    expect(ts.tage).toBe(35);
  });
  it('liefert nichts fuer einen einzelnen Punkt', () => {
    expect(theilSen([{ t: 1, v: 1 }])).toBe(null);
    expect(theilSen(null)).toBe(null);
  });
  it('liefert nichts, wenn alle Punkte auf demselben Tag liegen', () => {
    expect(theilSen([{ t: 5, v: 1 }, { t: 5, v: 9 }])).toBe(null);
  });
  it('laesst Fehlwerte aus', () => {
    const ts = theilSen([{ t: 0, v: 1 }, { t: 7, v: null }, { t: 14, v: 3 }]);
    expect(ts.n).toBe(2);
  });
});

describe('trendAus', () => {
  it('erkennt eine steigende Reihe', () => {
    const t = trendAus(reihe(6, 100, 5), { einheit: 'W', nachkomma: 1, besser: 'hoch' });
    expect(t.belastbar).toBe(true);
    expect(t.richtung).toBe('steigt');
    expect(t.urteil).toBe('besser');
    expect(t.proWoche).toBeCloseTo(5, 6);
    expect(t.aussage).toContain('steigt um 5,0 W je Woche');
  });

  it('erkennt eine fallende Reihe und bewertet sie nach der Blickrichtung', () => {
    const punkte = reihe(6, 10, -0.5);
    expect(trendAus(punkte, { besser: 'hoch' }).urteil).toBe('schlechter');
    expect(trendAus(punkte, { besser: 'niedrig' }).urteil).toBe('besser');
    expect(trendAus(punkte, { besser: 'niedrig' }).richtung).toBe('faellt');
  });

  it('nennt eine flache Reihe unveraendert', () => {
    const t = trendAus(reihe(6, 100, 0.2), { flachProzent: 1, besser: 'hoch' });
    expect(t.belastbar).toBe(true);
    expect(t.richtung).toBe('unveraendert');
    expect(t.urteil).toBe('gleich');
    expect(t.aussage).toContain('unverändert');
  });

  it('haelt an der absoluten Rauschgrenze, wo Prozente unsinnig waeren', () => {
    /* Entkopplung: 0,1 Prozentpunkte je Woche sind Rauschen, waeren aber bei
       einem Median von 3 % ueber drei Prozent relative Aenderung. */
    const punkte = reihe(6, 3, 0.1);
    expect(trendAus(punkte, { flachAbsolut: 0.2 }).richtung).toBe('unveraendert');
    expect(trendAus(punkte, { flachProzent: 1 }).richtung).toBe('steigt');
  });

  it('schweigt bei zu wenigen Punkten und sagt, ab wann nicht mehr', () => {
    const t = trendAus(reihe(3, 100, 5), {});
    expect(t.belastbar).toBe(false);
    expect(t.richtung).toBe(null);
    expect(t.grund).toContain('3 Messpunkte von 4');
    expect(t.grund).toContain('Ab 4 Punkten über 3 Wochen');
  });

  it('schweigt bei zu kurzem Zeitraum, auch wenn genug Punkte da sind', () => {
    const t = trendAus(reihe(8, 100, 1, 1), {});   // acht Punkte, aber nur eine Woche
    expect(t.n).toBe(8);
    expect(t.belastbar).toBe(false);
    expect(t.grund).toContain('deckt erst 1,0 Wochen ab');
  });

  it('kippt nicht wegen eines einzelnen Ausreissers', () => {
    const punkte = reihe(8, 100, 5);
    punkte[7].v = 40;                               // eine katastrophale Fahrt am Ende
    const t = trendAus(punkte, { besser: 'hoch' });
    expect(t.richtung).toBe('steigt');
    expect(t.proWoche).toBeCloseTo(5, 6);
  });

  it('faellt ohne Blickrichtung kein Urteil', () => {
    expect(trendAus(reihe(6, 100, 5), {}).urteil).toBe('offen');
  });

  it('vergleicht zwei Punkte, nennt es aber nicht Trend', () => {
    const v = zweiPunktVergleich([{ t: 0, v: 200 }, { t: 56, v: 215 }], 'W', 0);
    expect(v.delta).toBe(15);
    expect(v.text).toContain('200 → 215 W');
    expect(v.text).toContain('+7,5 %');
    expect(zweiPunktVergleich([{ t: 0, v: 1 }], 'W', 0)).toBe(null);
  });
});

describe('Effizienzfaktor', () => {
  it('leitet das Pulsfenster aus der LTHR ab, ersatzweise aus der HFmax', () => {
    expect(effizienzFenster(TH)).toEqual({ min: 96, max: 136, quelle: 'LTHR 160 bpm' });
    expect(effizienzFenster({ hrmax: 185 }).quelle).toContain('HFmax');
    expect(effizienzFenster({})).toBe(null);
  });

  it('wertet nur vergleichbare Fahrten und begruendet jede Aussortierung', () => {
    const acts = [
      fahrt('2026-08-15'),
      fahrt('2026-08-22'),
      fahrt('2026-08-29', { moving_time: 20 * 60, elapsed_time: 20 * 60 }),   // zu kurz
      fahrt('2026-09-05', { average_heartrate: 150 }),                        // ueber dem Fenster
      fahrt('2026-09-12', { average_heartrate: 0, has_heartrate: false }),     // ohne Puls
      fahrt('2026-09-19', { type: 'WeightTraining' })                          // kein Rad
    ];
    const s = effizienzSerie(acts, TH);
    expect(s.punkte.length).toBe(2);
    expect(s.einheit).toBe('km/h/bpm');
    expect(s.bilanz).toContain('Gewertet 2 von 5 Fahrten');
    expect(s.bilanz).toContain('1 zu kurz');
    expect(s.bilanz).toContain('1 außerhalb des Pulsfensters');
    expect(s.regel).toContain('ab 45 min');
    expect(s.regel).toContain('96 und 136 bpm');
  });

  it('erkennt eine steigende Effizienz ueber acht Wochen', () => {
    const acts = [];
    for(let i = 0; i < 8; i++){
      /* Gleicher Puls, jede Woche einen Kilometer weiter in derselben Zeit. */
      acts.push(fahrt(tagPlus(AB, i * 7), { distance: (30 + i) * 1000 }));
    }
    const s = effizienzSerie(acts, TH);
    expect(s.punkte.length).toBe(8);
    expect(s.trend.belastbar).toBe(true);
    expect(s.trend.richtung).toBe('steigt');
    expect(s.trend.urteil).toBe('besser');
  });

  it('kippt nicht wegen einer einzelnen Hitzeausfahrt', () => {
    const acts = [];
    for(let i = 0; i < 8; i++) acts.push(fahrt(tagPlus(AB, i * 7), { distance: (30 + i) * 1000 }));
    acts[7].distance = 20000;
    const s = effizienzSerie(acts, TH);
    expect(s.trend.richtung).toBe('steigt');
  });

  it('rechnet in Watt je Schlag, sobald genug Fahrten Watt haben', () => {
    const acts = [];
    for(let i = 0; i < 6; i++){
      acts.push(fahrt(tagPlus(AB, i * 7), { icu_weighted_avg_watts: 150 + i * 2 }));
    }
    const s = effizienzSerie(acts, TH);
    expect(s.einheit).toBe('W/bpm');
    expect(s.punkte[0].v).toBeCloseTo(150 / 120, 6);
  });

  it('mischt die Einheiten nicht: Fahrten ohne Watt fallen aus der Wattreihe', () => {
    const acts = [];
    for(let i = 0; i < 5; i++) acts.push(fahrt(tagPlus(AB, i * 7), { icu_weighted_avg_watts: 150 }));
    acts.push(fahrt(tagPlus(AB, 35)));
    const s = effizienzSerie(acts, TH);
    expect(s.einheit).toBe('W/bpm');
    expect(s.punkte.length).toBe(5);
    expect(s.bilanz).toContain('1 ohne Wattwert');
  });

  it('behauptet ohne LTHR und HFmax gar nichts', () => {
    const acts = [];
    for(let i = 0; i < 8; i++) acts.push(fahrt(tagPlus(AB, i * 7), { distance: (30 + i) * 1000 }));
    const s = effizienzSerie(acts, {});
    expect(s.trend.belastbar).toBe(false);
    expect(s.trend.grund).toContain('lässt sich Z2 nicht abgrenzen');
  });

  it('meldet zu heterogene Fahrten', () => {
    const acts = [
      fahrt(tagPlus(AB, 0)),
      fahrt(tagPlus(AB, 7), { moving_time: 300 * 60, elapsed_time: 300 * 60 }),
      fahrt(tagPlus(AB, 14)),
      fahrt(tagPlus(AB, 21))
    ];
    const s = effizienzSerie(acts, TH);
    expect(s.heterogen).toBe(true);
    expect(s.hinweis).toContain('wenig vergleichbar');
  });
});

describe('Aerobe Entkopplung', () => {
  it('nimmt nur lange Fahrten und liest den Wert von intervals.icu', () => {
    const acts = [
      fahrt(tagPlus(AB, 0), { moving_time: 180 * 60, decoupling: 6 }),
      fahrt(tagPlus(AB, 7), { moving_time: 180 * 60, decoupling: 5.4 }),
      fahrt(tagPlus(AB, 14), { moving_time: 180 * 60, decoupling: 4.6 }),
      fahrt(tagPlus(AB, 21), { moving_time: 180 * 60, decoupling: 4 }),
      /* 60 min ist keine lange Fahrt - auf der entkoppelt auch bei
         schlechter Grundlage kaum etwas, der Wert gehoert nicht in die Reihe. */
      fahrt(tagPlus(AB, 24), { moving_time: 60 * 60, elapsed_time: 60 * 60, decoupling: 20 })
    ];
    const s = entkopplungSerie(acts);
    expect(s.punkte.length).toBe(4);
    expect(s.trend.belastbar).toBe(true);
    expect(s.trend.richtung).toBe('faellt');
    expect(s.trend.urteil).toBe('besser');
  });

  it('sagt es, wenn intervals.icu das Feld nicht liefert', () => {
    const s = entkopplungSerie([fahrt(tagPlus(AB, 0), { moving_time: 180 * 60 })]);
    expect(s.punkte.length).toBe(0);
    expect(s.fehltFeld).toBe(true);
    expect(s.trend.grund).toContain('keinen Decoupling-Wert');
  });

  it('ordnet das Niveau ein', () => {
    const gut = entkopplungSerie([fahrt(tagPlus(AB, 0), { moving_time: 180 * 60, decoupling: 3 })]);
    expect(gut.hinweis).toContain('trägt diese Dauer');
    const schlecht = entkopplungSerie([fahrt(tagPlus(AB, 0), { moving_time: 180 * 60, decoupling: 9 })]);
    expect(schlecht.hinweis).toContain('über 5 %');
  });
});

describe('Schwellentests und Zwischenkontrollen', () => {
  const tests = [
    { day: '2026-09-10', week: 4, ftp: 200, lthr: 158, w20: 211 },
    { day: '2026-11-05', week: 12, ftp: 212, lthr: 160, w20: 223 },
    { day: '2026-12-03', week: 16, ftp: 221, lthr: 161, w20: 233 }
  ];

  it('macht aus drei Tests einen Trend, aus zwei nur einen Vergleich', () => {
    const s = testSerie(tests, []);
    expect(s.ftp.trend.belastbar).toBe(true);
    expect(s.ftp.trend.richtung).toBe('steigt');
    expect(s.ftp.trend.urteil).toBe('besser');

    const zwei = testSerie(tests.slice(0, 2), []);
    expect(zwei.ftp.trend.belastbar).toBe(false);
    expect(zwei.ftp.vergleich.text).toContain('200 → 212 W');
  });

  it('laesst Testtermine ohne Wert aus', () => {
    const s = testSerie(tests.concat([{ day: '2027-01-07', week: 20, ftp: null, lthr: 0 }]), []);
    expect(s.ftp.punkte.length).toBe(3);
    expect(s.anzahl).toBe(4);
  });

  it('faellt ueber den Sprechtest-Puls kein Urteil', () => {
    const interim = [];
    for(let i = 0; i < 6; i++){
      interim.push({ day: tagPlus(AB, i * 7), week: i + 1, talkHr: 130 + i });
    }
    const s = testSerie([], interim);
    expect(s.sprechtest.trend.belastbar).toBe(true);
    expect(s.sprechtest.trend.urteil).toBe('offen');
  });

  /* Die Notiz erklaert den Wert und muss deshalb dort ankommen, wo der Wert
     angesehen wird: am Punkt der Kurve. Sie stand vorher nur auf der
     Eingabekarte, und dort nur in den letzten vier Eintraegen - also gerade
     nicht bei dem alten Ausreisser, zu dem man sie sucht. */
  it('haengt die Notiz an den Punkt des Sprechtests', () => {
    const s = testSerie([], [
      { day: tagPlus(AB, 0), week: 1, talkHr: 132, note: 'Knie' },
      { day: tagPlus(AB, 7), week: 2, talkHr: 148 }
    ]);
    expect(s.sprechtest.punkte.map(p => p.zusatz)).toEqual(['Knie', null]);
  });

  /* Das RPE je Einheit ist am 04.09.2026 entfallen - ohne Auftrag im
     Trainingsplan und mit einer Reihe, die Z2-Fahrten und Intervalltage in
     eine Kurve warf. Alte Eintraege tragen den Schluessel weiter; gerechnet
     wird nichts mehr daraus. */
  it('rechnet aus dem RPE alter Eintraege keine Reihe mehr', () => {
    const s = testSerie([], [{ day: tagPlus(AB, 0), week: 1, talkHr: 132, rpe: 7 }]);
    expect(s.rpe).toBe(undefined);
  });

  it('schweigt ohne jeden Eintrag', () => {
    const s = testSerie([], []);
    expect(s.anzahl).toBe(0);
    expect(s.ftp.punkte).toEqual([]);
    expect(s.ftp.trend.belastbar).toBe(false);
  });
});

describe('Wochenumfang Soll gegen Ist', () => {
  function wochen(n, istMin, sollMin){
    const out = [];
    for(let i = 0; i < n; i++){
      out.push({ week: i + 1, sollMin: sollMin, istSec: (istMin + i * 10) * 60,
                 optSec: 0, z2Sec: 0, hardSec: 0, tage: 4 });
    }
    return out;
  }

  it('rechnet die Steigung je Woche aus den Wochennummern', () => {
    const s = umfangSerie(wochen(6, 200, 220));
    expect(s.punkte.length).toBe(6);
    expect(s.trend.belastbar).toBe(true);
    expect(s.trend.proWoche).toBeCloseTo(10, 6);
    expect(s.trend.richtung).toBe('steigt');
  });

  it('zaehlt die Wochen im Rahmen von 15 Prozent', () => {
    const s = umfangSerie(wochen(6, 200, 220));
    expect(s.konsistenz.wochen).toBe(6);
    expect(s.konsistenz.imRahmen).toBeGreaterThan(0);
  });

  it('sagt ohne Ist-Zeiten, dass nur das Soll dasteht', () => {
    const roh = wochen(6, 0, 220).map(w => Object.assign(w, { istSec: 0 }));
    const s = umfangSerie(roh);
    expect(s.wochenMitDaten).toBe(0);
    expect(s.trend.belastbar).toBe(false);
    expect(s.hinweis).toContain('ohne intervals.icu');
    expect(s.sollPunkte.length).toBe(6);
  });

  it('kommt mit gar keinen Wochen zurecht', () => {
    const s = umfangSerie(null);
    expect(s.punkte).toEqual([]);
    expect(s.trend.belastbar).toBe(false);
  });
});

describe('Zonenverteilung', () => {
  it('liest die Zonenzeiten der Aktivitaet: erste Zone Z1, zweite Z2, Rest hart', () => {
    expect(zonenAusAktivitaet({ icu_hr_zone_times: [600, 3000, 300, 120, 0] }))
      .toEqual({ z1: 600, z2: 3000, hart: 420, gesamt: 4020 });
    expect(zonenAusAktivitaet({ icu_hr_zone_times: [600, 3000] })).toBe(null);
    expect(zonenAusAktivitaet({})).toBe(null);
  });

  it('summiert je Woche und erkennt den steigenden Z2-Umfang', () => {
    const acts = [], zeilen = [];
    for(let i = 0; i < 6; i++){
      acts.push(fahrt(tagPlus(AB, i * 7), { icu_hr_zone_times: [600, (60 + i * 10) * 60, 600, 0, 0] }));
      zeilen.push({ week: i + 1, sollMin: 220, istSec: 0, z2Sec: 0, hardSec: 0, tage: 3 });
    }
    const s = zonenSerie(acts, zeilen, AB);
    expect(s.mitDaten).toBe(6);
    expect(s.punkte[0].z2Min).toBe(60);
    expect(s.punkte[0].hartMin).toBe(10);
    expect(s.z2Trend.richtung).toBe('steigt');
    expect(s.hartTrend.richtung).toBe('unveraendert');
    expect(s.quellen.icu).toBe(6);
  });

  it('faellt auf die aus den Streams gerechneten Zonen zurueck', () => {
    const zeilen = [{ week: 1, sollMin: 220, istSec: 3600, z2Sec: 3000, hardSec: 600, tage: 2 }];
    const s = zonenSerie([], zeilen, AB);
    expect(s.punkte[0].quelle).toBe('streams');
    expect(s.punkte[0].z2Min).toBe(50);
    expect(s.hinweis).toContain('aus den Pulsstreams dieser App');
  });

  it('sagt es, wenn es gar keine Zonenzeiten gibt', () => {
    const s = zonenSerie([fahrt(tagPlus(AB, 0))],
      [{ week: 1, sollMin: 220, istSec: 3600, z2Sec: 0, hardSec: 0, tage: 1 }], AB);
    expect(s.mitDaten).toBe(0);
    expect(s.hinweis).toContain('Für keine Woche liegen Zonenzeiten vor');
    expect(s.z2Trend.belastbar).toBe(false);
  });
});

describe('Rumpfprotokoll', () => {
  it('zaehlt Rumpf und Beinblock je Woche', () => {
    const log = [];
    for(let i = 0; i < 5; i++){
      log.push({ day: tagPlus(AB, i * 7 + 4), sets: 24, finished: true });
      log.push({ day: tagPlus(AB, i * 7 + 6), sets: 24, finished: true });
      log.push({ day: tagPlus(AB, i * 7 + 6), kind: 'leg', exercises: [] });
    }
    const s = rumpfSerie(log, AB);
    expect(s.punkte.length).toBe(5);
    expect(s.punkte[0].rumpf).toBe(2);
    expect(s.punkte[0].bein).toBe(1);
    expect(s.trend.richtung).toBe('unveraendert');
  });

  it('laesst Eintraege vor dem Planstart aus', () => {
    const s = rumpfSerie([{ day: tagPlus(AB, -14) }, { day: tagPlus(AB, 1) }], AB);
    expect(s.punkte.length).toBe(1);
  });
});

describe('Bericht als Ganzes', () => {
  it('steht auch ohne jede Quelle und schweigt dann ueberall', () => {
    const b = verlaufBericht({});
    expect(b.verbunden).toBe(false);
    expect(b.effizienz.punkte).toEqual([]);
    expect(b.entkopplung.trend.belastbar).toBe(false);
    expect(b.umfang.punkte).toEqual([]);
    expect(b.zonen.punkte).toEqual([]);
    expect(b.rumpf.punkte).toEqual([]);
    expect(b.tests.anzahl).toBe(0);
  });

  it('liefert ohne intervals.icu die lokalen Reihen', () => {
    const b = verlaufBericht({
      acts: [], thresholds: TH, startIso: AB,
      wochen: [1, 2, 3, 4].map(w => ({ week: w, sollMin: 220, istSec: 0, z2Sec: 0, hardSec: 0, tage: 0 })),
      testLog: [{ day: '2026-09-10', week: 4, ftp: 200, lthr: 158 }],
      interimLog: [{ day: tagPlus(AB, 1), week: 1, talkHr: 132 }],
      coreLog: [{ day: tagPlus(AB, 4), sets: 24 }],
      verbunden: false
    });
    expect(b.umfang.sollPunkte.length).toBe(4);
    expect(b.tests.anzahl).toBe(1);
    expect(b.rumpf.punkte.length).toBe(1);
    /* Und trotzdem keine Leistungsaussage - genau darum geht es. */
    expect(b.effizienz.trend.belastbar).toBe(false);
    expect(b.zonen.z2Trend.belastbar).toBe(false);
  });

  it('haelt die Rauschgrenzen an einer Stelle', () => {
    expect(VERLAUF.minPunkte).toBe(4);
    expect(VERLAUF.minWochen).toBe(3);
  });
});
