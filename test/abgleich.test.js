/* Der Abgleich von Aufzeichnung und Plan - bis zum 29.08.2026 die groesste
   ungetestete Flaeche des Projekts, und zugleich die, die alle Urteile der App
   erzeugt: "Zusatz", "zu kurz", "zu hart fuer einen Grundlagentag".

   Der erste Lauf hat gleich einen Fehler gefunden: estimateRounds las
   EXERCISES.length, eine Modulvariable aus der Einzeldatei-Fassung, die es in
   diesem Modul nie gab. Die Funktion warf also einen ReferenceError, sobald
   sie lief - und sie lief genau dann, wenn jemand den Rumpfzirkel auf der Uhr
   statt mit dem App-Timer aufzeichnete. Der letzte Test unten haelt das fest.

   Gebaut wird gegen den ausgelieferten Plan und den echten Planbeginn, damit
   die Wochentage stimmen: Woche 1 beginnt am Samstag, dem 15.08.2026. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createPlan } from '../src/domain/plan.js';
import { toMidnight, dayFromIso } from '../src/domain/week.js';
import * as D from '../src/domain/day.js';
import {
  isRide, isStrength, localDay, recordingNote, fmtMin, pct, downgrade,
  estimateRounds, compareDay, weekTotals, buildReport, tagesGruppen,
  DUR_TOL_SHORT
} from '../src/domain/analysis.js';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);
const START = toMidnight(dayFromIso('2026-08-15'));   // Samstag, Woche 1
const TH = { ftp: 212, lthr: 163, hrmax: 187 };

/* Die Wochentage der ersten Trainingswoche. Der Plan haengt daran, welcher
   Tag welche Vorgabe traegt - deshalb hier namentlich statt als Offset. */
const SA = dayFromIso('2026-08-15');   // lange Ausfahrt
const SO = dayFromIso('2026-08-16');   // Rumpf + Beinblock
const MO = dayFromIso('2026-08-17');   // Ruhetag
const DI = dayFromIso('2026-08-18');   // Arbeitsweg
const MI = dayFromIso('2026-08-19');   // Rumpf verkuerzt + Fahrt
const DO = dayFromIso('2026-08-20');   // Qualitaetstag

function fahrt(min, extra){
  return Object.assign({
    id: 'a1', type: 'Ride', name: 'Ausfahrt',
    moving_time: min * 60, elapsed_time: min * 60,
    distance: min * 350, average_heartrate: 130, has_heartrate: true
  }, extra || {});
}

function kraft(min){
  return { id: 'k1', type: 'WeightTraining', name: 'Rumpf',
           moving_time: min * 60, elapsed_time: min * 60 };
}

/* Zonenzeiten in Sekunden, wie zoneSeconds sie liefert. */
function zonen(teile){
  const z = Object.assign({ unter:0, z1:0, z2:0, z3:0, z4:0, z5:0 }, teile);
  z._total = z.unter + z.z1 + z.z2 + z.z3 + z.z4 + z.z5;
  z._method = 'zeitgewichtet';
  z._takt = 1;
  z._samples = z._total;
  return z;
}

const tag = (datum, acts, zonesById, core, leg) =>
  compareDay(plan, TH, datum, START, acts || [], zonesById || null, core || [], leg || []);

const texte = row => row.notes.map(n => n.text).join(' ');

describe('Aktivitaetsarten erkennen', () => {
  it('erkennt Radfahrten an den ueblichen Typnamen', () => {
    ['Ride', 'VirtualRide', 'GravelRide', 'EBikeRide', 'Cycling'].forEach(t => {
      expect(isRide(t)).toBe(true);
    });
    expect(isRide('Run')).toBe(false);
    expect(isRide('')).toBe(false);
    expect(isRide(null)).toBe(false);
  });

  it('erkennt Krafteinheiten', () => {
    expect(isStrength('WeightTraining')).toBe(true);
    expect(isStrength('Workout')).toBe(true);
    expect(isStrength('Run')).toBe(false);
  });

  it('schneidet den Tag aus dem Zeitstempel', () => {
    expect(localDay('2026-08-15T09:12:00')).toBe('2026-08-15');
    expect(localDay(null)).toBe('');
  });
});

describe('Formatierung', () => {
  it('schreibt unter einer Stunde Minuten, darueber Stunden', () => {
    expect(fmtMin(45 * 60)).toBe('45 min');
    expect(fmtMin(59 * 60)).toBe('59 min');
    expect(fmtMin(60 * 60)).toBe('1:00 h');
    expect(fmtMin(95 * 60)).toBe('1:35 h');
  });

  it('rechnet Prozent und vertraegt die Null im Nenner', () => {
    expect(pct(50, 200)).toBe(25);
    expect(pct(1, 0)).toBe(0);
  });
});

describe('Herabstufen', () => {
  it('setzt Status und Badge zusammen', () => {
    const row = { status: 'ok', badge: 'erfüllt' };
    downgrade(row, 'zu hart');
    expect(row).toEqual({ status: 'dev', badge: 'zu hart' });
  });

  /* Eine ausgefallene Einheit darf nicht zu einer bloss abweichenden werden -
     sonst verschwindet der schwerere Befund hinter dem leichteren. */
  it('laesst eine ausgefallene Einheit ausgefallen', () => {
    const row = { status: 'miss', badge: 'ausgefallen' };
    downgrade(row, 'zu hart');
    expect(row).toEqual({ status: 'miss', badge: 'ausgefallen' });
  });
});

describe('Ruhetag', () => {
  it('ist ohne Aufzeichnung in Ordnung', () => {
    const row = tag(MO);
    expect(row.status).toBe('ok');
    expect(row.badge).toBe('Ruhetag');
    expect(row.notes).toEqual([]);
  });

  it('meldet eine Fahrt am Ruhetag als Zusatz, ohne sie zu tadeln', () => {
    const row = tag(MO, [fahrt(40)]);
    expect(row.status).toBe('extra');
    expect(row.badge).toBe('Zusatz');
    expect(texte(row)).toContain('40 min gefahren');
  });
});

describe('Radeinheit mit messbarem Soll', () => {
  const soll = plan.weeks[0].tage.sa.minutes;   // 120 min in Woche 1

  it('meldet eine ausgefallene Fahrt', () => {
    const row = tag(SA);
    expect(row.status).toBe('miss');
    expect(row.badge).toBe('ausgefallen');
  });

  it('nimmt die geplante Dauer als erfuellt an', () => {
    const row = tag(SA, [fahrt(soll)]);
    expect(row.status).toBe('ok');
    expect(row.badge).toBe('erfüllt');
  });

  /* Die Toleranz ist bewusst unsymmetrisch: zu kurz fehlt Umfang, zu lang ist
     normal. Genau an der Grenze darf noch nichts kippen. */
  it('haelt die Untergrenze der Dauertoleranz ein', () => {
    const knapp = Math.ceil(soll * (1 - DUR_TOL_SHORT));
    expect(tag(SA, [fahrt(knapp)]).status).toBe('ok');
    expect(tag(SA, [fahrt(Math.floor(soll * (1 - DUR_TOL_SHORT) - 1))]).status).toBe('dev');
  });

  it('wertet eine laengere Fahrt weiter als eingehalten', () => {
    const row = tag(SA, [fahrt(Math.round(soll * 1.5))]);
    expect(row.status).toBe('ok');
    expect(row.badge).toBe('erfüllt');
    expect(texte(row)).toContain('länger als geplant');
    expect(texte(row)).toContain('Planprogression');
  });

  it('zaehlt mehrere Fahrten eines Tages zusammen', () => {
    const row = tag(SA, [fahrt(soll / 2), Object.assign(fahrt(soll / 2), { id: 'a2' })]);
    expect(Math.round(row.rideSec / 60)).toBe(soll);
    expect(row.status).toBe('ok');
  });

  /* Die Gegenprobe zum Umbau der Analyse: einzeln bewertet waeren beide
     Haelften "kuerzer", zusammen sind sie genau richtig. Die Ansicht hat bis
     zum 03.09.2026 genau diesen Fehler gemacht - sie gab compareDay immer nur
     eine Aufzeichnung, obwohl die Funktion alle nimmt. */
  it('haelt jede Haelfte fuer sich fuer zu kurz', () => {
    const halb = tag(SA, [fahrt(soll / 2)]);
    expect(halb.status).toBe('dev');
    expect(halb.badge).toBe('kürzer');
  });
});

/* Die Gruppierung, aus der die Analyseliste ihre Tage nimmt.

   Sie steht in der Domaene und nicht in der Anzeige, weil der Tag die Einheit
   der Bewertung ist: eine Liste, die anders einteilt als compareDay, oeffnet
   eine Auswertung ueber etwas anderes, als sie zeigt. */
describe('Tagesgruppen', () => {
  const a = (id, iso) => ({ id, start_date_local: iso, type: 'Ride', moving_time: 600 });

  it('fasst einen Tag zusammen und stellt den juengsten nach oben', () => {
    const g = tagesGruppen([
      a('a', '2026-08-19T17:40:00'),
      a('b', '2026-08-20T07:10:00'),
      a('c', '2026-08-19T07:05:00')
    ]);
    expect(g.map(x => x.tag)).toEqual(['2026-08-20', '2026-08-19']);
    /* Innerhalb des Tages in der Reihenfolge, in der gefahren wurde - der
       Hinweg vor dem Rueckweg. */
    expect(g[1].acts.map(x => x.id)).toEqual(['c', 'a']);
  });

  it('laesst Aufzeichnungen ohne Datum weg, statt einen Tag zu erfinden', () => {
    expect(tagesGruppen([{ id:'x' }, null]).length).toBe(0);
    expect(tagesGruppen(null)).toEqual([]);
  });
});

describe('Zonen einer Grundlagenfahrt', () => {
  const soll = plan.weeks[0].tage.sa.minutes;

  it('bestaetigt eine sauber gefahrene Z2-Einheit', () => {
    const row = tag(SA, [fahrt(soll)], { a1: zonen({ z1: 1200, z2: 6000 }) });
    expect(row.status).toBe('ok');
    expect(texte(row)).toContain('Passt.');
  });

  it('stuft eine zu harte Grundlagenfahrt herab', () => {
    const row = tag(SA, [fahrt(soll)], { a1: zonen({ z2: 3600, z3: 2400, z4: 1200 }) });
    expect(row.status).toBe('dev');
    expect(row.badge).toBe('zu hart');
    expect(texte(row)).toContain('Grundlagenfahrt');
  });

  it('meldet eine zu lockere Fahrt, ohne sie hart zu tadeln', () => {
    const row = tag(SA, [fahrt(soll)], { a1: zonen({ unter: 3000, z1: 3000, z2: 1200 }) });
    expect(row.badge).toBe('zu locker');
    expect(texte(row)).toContain('der Reiz kommt aus Z2');
  });

  /* Unter fuenf Minuten Aufzeichnung sagt die Zonenverteilung nichts - dann
     soll die App auch nichts behaupten. */
  it('bewertet Zonen erst ab fuenf Minuten Aufzeichnung', () => {
    const row = tag(SA, [fahrt(soll)], { a1: zonen({ z4: 200 }) });
    expect(row.status).toBe('ok');
    expect(texte(row)).not.toContain('über Z2');
  });
});

describe('Qualitaetstag mit Intervallen', () => {
  it('erkennt erreichte Intervallzeit', () => {
    const row = tag(DO, [fahrt(60)], { a1: zonen({ z1: 1800, z2: 600, z3: 1500 }) });
    expect(texte(row)).toContain('min hart gefahren');
    expect(row.status).toBe('ok');
  });

  it('meldet zu kurze Intervalle', () => {
    const row = tag(DO, [fahrt(60)], { a1: zonen({ z1: 3300, z3: 120 }) });
    expect(row.badge).toBe('Intervalle kurz');
    expect(texte(row)).toContain('abgebrochen oder Zone nicht erreicht');
  });
});

describe('Arbeitsweg am Dienstag', () => {
  it('nimmt eine laengere Fahrt hin und bewertet die Intensitaet', () => {
    const row = tag(DI, [fahrt(90)], { a1: zonen({ z1: 1800, z2: 3600 }) });
    expect(row.status).toBe('ok');
    expect(texte(row)).toContain('Passt für den Arbeitsweg');
  });

  it('stuft den Arbeitsweg bei Zeitdruck herab', () => {
    const row = tag(DI, [fahrt(60)], { a1: zonen({ z2: 1200, z3: 1800, z4: 600 }) });
    expect(row.badge).toBe('zu hart');
    expect(texte(row)).toContain('Zeitdruck');
  });
});

describe('Rumpftag', () => {
  it('meldet eine fehlende Krafteinheit', () => {
    const row = tag(SO);
    expect(row.status).toBe('dev');
    expect(row.badge).toBe('nicht erfasst');
    expect(texte(row)).toContain('Keine Krafteinheit gefunden');
  });

  it('bestaetigt einen vollstaendigen Zirkel aus dem eigenen Protokoll', () => {
    const log = [{ kind:'core', day:'2026-08-16', plannedRounds: 2, exCount: 8,
                   sets: 16, finished: true }];
    const row = tag(SO, [], null, log);
    expect(row.badge).toBe('erledigt');
    expect(texte(row)).toContain('Alle 2 Runden komplett');
  });

  it('meldet einen abgebrochenen Zirkel mit der letzten Uebung', () => {
    const log = [{ kind:'core', day:'2026-08-16', plannedRounds: 2, exCount: 8,
                   sets: 9, finished: false,
                   lastExercise: { name: 'Bird Dog', round: 2 } }];
    const row = tag(SO, [], null, log);
    expect(row.status).toBe('dev');
    expect(row.badge).toBe('1/2 Runden');
    expect(texte(row)).toContain('zuletzt Bird Dog in Runde 2');
  });

  /* Das eigene Protokoll ist genauer als die Dauer der Uhr und hat Vorrang -
     sonst stuenden zwei Bewertungen derselben Einheit nebeneinander. */
  it('zieht das eigene Protokoll der Garmin-Dauer vor', () => {
    const log = [{ kind:'core', day:'2026-08-16', plannedRounds: 2, exCount: 8,
                   sets: 16, finished: true }];
    const row = tag(SO, [kraft(30)], null, log);
    expect(texte(row)).toContain('Alle 2 Runden komplett');
    expect(texte(row)).not.toContain('geschätzt');
  });
});

describe('Beinblock', () => {
  const voll = { kind:'leg', day:'2026-08-16', plannedRounds: 2, exercises: [
    { key:'squat', name:'Kniebeuge', target: 8,  reps:[8, 8] },
    { key:'split', name:'Split Squat', target: 6, reps:[6, 6] },
    { key:'calf',  name:'Wadenheben', target: 10, reps:[10, 10] }
  ]};

  it('meldet einen fehlenden Beinblock am Sonntag', () => {
    expect(texte(tag(SO))).toContain('Beinblock nicht protokolliert');
  });

  it('bestaetigt vollstaendige Runden', () => {
    const row = tag(SO, [], null, [], [voll]);
    expect(texte(row)).toContain('Beinblock: 2 von 2 Runden komplett');
  });

  it('nennt Saetze unter dem Ziel, ohne sie als Fehler zu werten', () => {
    const knapp = structuredClone(voll);
    knapp.exercises[0].reps = [5, 8];
    const row = tag(SO, [], null, [], [knapp]);
    expect(texte(row)).toContain('unter dem Wiederholungsziel: Kniebeuge');
    expect(texte(row)).toContain('kein Fehler');
  });

  /* Am Mittwoch steht kein Beinblock an - dann darf auch keiner angemahnt
     werden. */
  it('verlangt am Mittwoch keinen Beinblock', () => {
    expect(texte(tag(MI))).not.toContain('Beinblock');
  });
});

describe('Mittwoch: Rumpf und Fahrt am selben Tag', () => {
  const soll = plan.weeks[0].tage.mi.minutes;

  it('meldet die fehlende Fahrt nur, wenn eine geplant war', () => {
    const row = tag(MI);
    if(soll) expect(texte(row)).toContain('Keine Fahrt an diesem Tag');
    else expect(texte(row)).not.toContain('Keine Fahrt an diesem Tag');
  });

  it('behandelt die Solldauer als Untergrenze', () => {
    if(!soll) return;
    const row = tag(MI, [fahrt(soll * 2)]);
    expect(texte(row)).toContain('Länger ist kein Planverstoß');
  });
});

/* Die Fahrten eines Tages nacheinander.

   Der Anlass: ein Mittwoch mit zwei Arbeitswegen, die einzeln schon ueber der
   Untergrenze lagen. Die Analyse rechnete beide zu einer Zahl zusammen, fand
   sie ueber der Untergrenze und meldete "erfuellt" - der Tag stand beim
   Dreifachen der Vorgabe, und nichts davon war zu lesen. Bewertet wird
   weiterhin der Tag; die Reihenfolge, in der seine Summe entsteht, steht
   seitdem daneben. */
describe('Fahrten eines Tages nacheinander', () => {
  const MI2 = dayFromIso('2026-08-26');            // Woche 2: Untergrenze 40 min
  const soll = plan.weeks[1].tage.mi.minutes;

  const zwei = (min1, min2, z1, z2) => tag(MI2, [
    Object.assign(fahrt(min1), { id: 'h' }),
    Object.assign(fahrt(min2), { id: 'r' })
  ], z1 || z2 ? { h: z1, r: z2 } : null);

  it('nimmt die Woche mit einer Untergrenze am Mittwoch', () => {
    expect(soll).toBe(40);
  });

  it('haelt die Fahrten in der Reihenfolge, in der gefahren wurde', () => {
    const row = zwei(55, 60);
    expect(row.fahrten.map(f => f.act.id)).toEqual(['h', 'r']);
    expect(row.fahrten.map(f => f.nr)).toEqual([1, 2]);
  });

  /* Der Kern: die zweite Fahrt wird nicht fuer sich bewertet, sondern auf dem
     Stand, den die erste hinterlassen hat. */
  it('rechnet die zweite Fahrt auf den Stand der ersten', () => {
    const row = zwei(55, 60);
    const erste = row.fahrten[0].notes.map(n => n.text).join(' ');
    const zweite = row.fahrten[1].notes.map(n => n.text).join(' ');
    expect(erste).toContain('1. Fahrt: 55 min');
    expect(erste).toContain('55 von 40 min Untergrenze');
    expect(zweite).toContain('2. Fahrt: 60 min');
    expect(zweite).toContain('115 von 40 min Untergrenze');
    expect(zweite).toContain('75 min darüber');
  });

  /* Die Ueberschreitung haengt an der Fahrt, die sie ausloest - sonst sagt der
     Tag zwar, dass er zu lang wurde, aber nicht, wodurch. */
  it('haengt die Ueberschreitung an die ausloesende Fahrt', () => {
    const row = zwei(30, 60);
    expect(row.fahrten[0].notes.map(n => n.text).join(' '))
      .not.toContain('über das Ziel');
    expect(row.fahrten[1].notes.map(n => n.text).join(' '))
      .toContain('Diese Fahrt trägt den Tag über das Ziel: 90 min gegen 40 min');
    expect(row.umfangUeber).toEqual({ kum: 90, soll: 40, minimum: true });
  });

  it('schweigt, solange der Tag innerhalb der Toleranz bleibt', () => {
    const row = zwei(25, 25);
    expect(texte(row)).not.toContain('über das Ziel');
    expect(row.umfangUeber).toBe(undefined);
  });

  /* Eine einzelne Fahrt braucht keinen Laufstand: "1. Fahrt: 50 min. Damit
     stehen 50 von 40 min" ist derselbe Satz zweimal. */
  it('laesst den Laufstand bei einer einzigen Fahrt weg', () => {
    const row = tag(MI2, [fahrt(50)]);
    expect(texte(row)).not.toContain('1. Fahrt');
  });

  /* Gemittelt ueber beide Fahrten verschwindet ein gehetzter Rueckweg hinter
     einem ruhigen Hinweg: 15 min in Z4 sind in 110 min Gesamtzeit 14 % und
     damit unauffaellig - in den 20 min, in denen sie gefahren wurden, sind sie
     75 %. */
  it('bewertet die Intensitaet je Fahrt statt ueber den Tag gemittelt', () => {
    const row = zwei(90, 20, zonen({ z2: 5400 }), zonen({ z2: 300, z4: 900 }));
    expect(row.badge).toBe('zu hart');
    expect(row.fahrten[0].notes.map(n => n.text).join(' ')).toContain('Passt für den Arbeitsweg');
    expect(row.fahrten[1].notes.map(n => n.text).join(' ')).toContain('Zeitdruck');
  });

  /* row.notes bleibt die flache Liste: das Fazit sucht darin die schweren
     Befunde, die Meldungen ebenso. Die Anzeige liest row.tagNotes und die
     Notizen je Fahrt - sonst stuende jeder Satz zweimal auf der Seite. */
  it('fuehrt Tages- und Fahrtnotizen getrennt und flach zusammen', () => {
    const row = zwei(55, 60);
    const fahrtNotizen = row.fahrten.reduce((n, f) => n + f.notes.length, 0);
    expect(row.notes.length).toBe(row.tagNotes.length + fahrtNotizen);
    expect(row.tagNotes.map(n => n.text).join(' ')).not.toContain('1. Fahrt');
    expect(texte(row)).toContain('1. Fahrt');
  });
});

describe('Wochensummen', () => {
  it('summiert Soll und Ist ueber die Woche', () => {
    const rows = buildReport(plan, TH, START, SA, DO, [
      Object.assign(fahrt(120), { start_date_local: '2026-08-15T09:00:00' }),
      Object.assign(fahrt(60),  { id:'a2', start_date_local: '2026-08-18T07:00:00' })
    ], null, []);
    const w = weekTotals(rows);
    expect(w).toHaveLength(1);
    expect(w[0].week).toBe(1);
    expect(Math.round(w[0].istSec / 60)).toBe(180);
    expect(w[0].tage).toBe(2);
  });

  /* Der Umfangsdeckel aus Fassung 3. Bis dahin warnte die Analyse nur nach
     unten - zu wenig Umfang war ein Befund, zu viel keiner. Genau das war der
     Fehler: der Ist-Umfang der ersten drei Wochen lag 10 bis 35 % ueber Plan. */
  it('meldet eine Woche ueber dem Umfangsdeckel', () => {
    const FR = dayFromIso('2026-08-21');
    const ueber = D.weekCapMinutes(plan, 1) + 30;
    const rows = buildReport(plan, TH, START, SA, FR, [
      Object.assign(fahrt(ueber), { start_date_local: '2026-08-15T09:00:00' })
    ], null, []);
    const w = weekTotals(rows, plan)[0];
    expect(w.planMin).toBe(D.weekPlanMinutes(plan, 1));
    expect(w.capMin).toBe(D.weekCapMinutes(plan, 1));
    expect(w.ueberDeckel).toBe(true);
  });

  it('schweigt, solange die Woche unter dem Deckel bleibt', () => {
    const FR = dayFromIso('2026-08-21');
    const rows = buildReport(plan, TH, START, SA, FR, [
      Object.assign(fahrt(D.weekPlanMinutes(plan, 1)), { start_date_local: '2026-08-15T09:00:00' })
    ], null, []);
    expect(weekTotals(rows, plan)[0].ueberDeckel).toBe(false);
  });

  /* Eine angebrochene Woche kann den Deckel nicht ueberschreiten, nur
     unterbieten: die Aktivitaeten sind vollstaendig, der Plan dagegen nicht. */
  it('wertet eine unvollstaendig erfasste Woche nicht gegen den Deckel', () => {
    const rows = buildReport(plan, TH, START, SA, SO, [
      Object.assign(fahrt(D.weekCapMinutes(plan, 1) + 60), { start_date_local: '2026-08-15T09:00:00' })
    ], null, []);
    const w = weekTotals(rows, plan)[0];
    expect(w.vollstaendig).toBe(false);
    expect(w.ueberDeckel).toBe(false);
  });

  it('kommt ohne Plan aus und laesst den Deckel dann weg', () => {
    const rows = buildReport(plan, TH, START, SA, SO, [], null, []);
    expect(weekTotals(rows)[0].capMin).toBeUndefined();
  });

  it('ordnet jede Aktivitaet ihrem lokalen Tag zu', () => {
    const rows = buildReport(plan, TH, START, SA, SO, [
      Object.assign(fahrt(120), { start_date_local: '2026-08-15T23:30:00' })
    ], null, []);
    expect(rows[0].rides).toHaveLength(1);
    expect(rows[1].rides).toHaveLength(0);
  });
});

describe('Hinweis zur Aufzeichnung', () => {
  it('schweigt bei sauberem Sekundentakt', () => {
    expect(recordingNote(zonen({ z2: 3600 }))).toBe(null);
  });

  it('benennt einen groben Takt', () => {
    const z = zonen({ z2: 3600 });
    z._takt = 4.2;
    expect(recordingNote(z).text).toContain('4,2-Sekunden-Takt');
  });

  it('warnt, wenn ohne Zeit-Stream geraten wurde', () => {
    const z = zonen({ z2: 3600 });
    z._method = 'annahme';
    expect(recordingNote(z).text).toContain('deutlich zu niedrig');
  });
});

describe('Rundenschaetzung aus der Aufzeichnungsdauer', () => {
  /* Der Zirkel ist deterministisch: n Runden brauchen
     n*(ex*Belastung + (ex-1)*Pause) + (n-1)*Rundenpause + Vorlauf. */
  const ex = plan.circuit.exercises.length;
  const work = 30, rest = 25, rundenPause = plan.circuit.roundRestSeconds;
  const prep = plan.circuit.prepSeconds;
  const dauer = n => n * (ex * work + (ex - 1) * rest) + (n - 1) * rundenPause + prep;

  /* Der Fehler, den dieser Test gefunden hat: hier stand EXERCISES.length -
     eine Variable, die es in diesem Modul nie gab. Jeder Aufruf warf einen
     ReferenceError, und der Aufruf kam genau dann, wenn jemand den Zirkel auf
     der Uhr statt mit dem App-Timer aufzeichnete. */
  it('wirft nicht mehr, sondern rechnet', () => {
    expect(() => estimateRounds(dauer(3), work, rest, rundenPause, prep, ex)).not.toThrow();
  });

  it('trifft die Rundenzahl, aus der die Dauer gebaut wurde', () => {
    [1, 2, 3, 4].forEach(n => {
      expect(estimateRounds(dauer(n), work, rest, rundenPause, prep, ex)).toBe(n);
    });
  });

  /* Genau zwischen zwei Rundenzahlen: von beiden ist die Dauer weiter als eine
     halbe Runde entfernt, also war das etwas anderes als dieser Zirkel. Ein
     beliebiger Zuschlag taugt dafuer nicht - er landet leicht wieder dicht an
     der naechsten Rundenzahl und wird dann zu Recht dieser zugeordnet. */
  it('behauptet nichts, wenn die Dauer zu keiner Rundenzahl passt', () => {
    const mitte = dauer(2) + Math.round((dauer(3) - dauer(2)) / 2);
    expect(estimateRounds(mitte, work, rest, rundenPause, prep, ex)).toBe(null);
  });

  it('behauptet nichts ohne Angaben', () => {
    expect(estimateRounds(0, work, rest, rundenPause, prep, ex)).toBe(null);
    expect(estimateRounds(dauer(2), 0, rest, rundenPause, prep, ex)).toBe(null);
    expect(estimateRounds(dauer(2), work, rest, rundenPause, prep, 0)).toBe(null);
  });

  /* Der Weg, auf dem der Fehler in die Anzeige durchschlug: Krafteinheit auf
     der Uhr, kein Eintrag im App-Protokoll. */
  it('bewertet eine auf der Uhr aufgezeichnete Krafteinheit', () => {
    const row = tag(SO, [kraft(Math.round(dauer(2) / 60))]);
    expect(texte(row)).toMatch(/Krafteinheit aufgezeichnet/);
    expect(row.status).not.toBe('miss');
  });
});
