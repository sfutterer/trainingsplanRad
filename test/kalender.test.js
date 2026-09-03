/* Die Kalenderhelfer der Plan-Ansicht.

   Reine Rechnungen auf Datumsobjekten, also billig zu pruefen - und die Stelle,
   an der ein Fehler am spaetesten auffaellt: ein Raster, das im Februar eine
   Zeile zu viel hat, oder eine Trainingswoche, die um einen Tag verrutscht,
   sieht auf den ersten Blick richtig aus.

   Die Faelle sind so gewaehlt, dass sie die Fallen treffen: Monatsende bei
   addMonths, ein Monat, der genau auf die erste Spalte faellt, ein Datum vor
   dem Planbeginn (negative Abstaende) und die Sommerzeitumstellung.

   Die Struktur aus buildDayInfo wird gegen die ausgelieferte plan.json
   geprueft, aber nur auf Form und nicht auf Wortlaut - der Wortlaut haengt an
   den Pruefsummen in domain.test.js. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createPlan } from '../src/domain/plan.js';
import {
  toMidnight, isoDayLocal, addDays, dayOffset, dayFromIso,
  trainingWeekStart, trainingWeekDays, startOfMonth, addMonths, monthLabel,
  monthGrid, weekdayColumns, WEEKDAY_SHORT
} from '../src/domain/week.js';
import { buildDayInfo, isCoordinationDay, thursdayPlan } from '../src/domain/day.js';
import { NO_THRESHOLDS } from '../src/domain/zones.js';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);

/* Derselbe Beginn wie im Gleichheitsnachweis: ein Samstag. */
const START = toMidnight(new Date(2026, 7, 15));
const iso = d => isoDayLocal(d);

describe('Tagesrechnung', () => {
  it('addDays geht ueber Monats- und Jahresgrenzen', () => {
    expect(iso(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
    expect(iso(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
    expect(iso(addDays(new Date(2026, 0, 1), -1))).toBe('2025-12-31');
  });

  /* Die Nacht der Umstellung hat 23 bzw. 25 Stunden. Mit einem Math.floor auf
     der Millisekundendifferenz waere daraus null statt einem Tag geworden. */
  it('zaehlt auch ueber die Zeitumstellung ganze Tage', () => {
    /* 29.03.2026 und 25.10.2026 sind die Umstellungstage in Mitteleuropa; die
       Naechte davor haben 23 bzw. 25 Stunden. */
    expect(dayOffset(new Date(2026, 2, 29), new Date(2026, 2, 28))).toBe(1);
    expect(dayOffset(new Date(2026, 9, 25), new Date(2026, 9, 24))).toBe(1);
    expect(dayOffset(new Date(2026, 2, 28), new Date(2026, 2, 29))).toBe(-1);
    expect(iso(addDays(new Date(2026, 2, 28), 1))).toBe('2026-03-29');
    expect(iso(addDays(new Date(2026, 9, 24), 1))).toBe('2026-10-25');
  });

  it('dayFromIso liest den lokalen Kalendertag, nicht UTC', () => {
    expect(iso(dayFromIso('2026-08-15'))).toBe('2026-08-15');
    expect(dayFromIso('2026-08-15').getDate()).toBe(15);
  });
});

describe('Trainingswoche', () => {
  it('beginnt am Startdatum und laeuft in Siebenerschritten', () => {
    expect(iso(trainingWeekStart(new Date(2026, 7, 15), START))).toBe('2026-08-15');
    expect(iso(trainingWeekStart(new Date(2026, 7, 21), START))).toBe('2026-08-15');
    expect(iso(trainingWeekStart(new Date(2026, 7, 22), START))).toBe('2026-08-22');
  });

  /* Vor dem Planbeginn ist der Abstand negativ. Ein Math.trunc haette die
     Woche dort auf den falschen Samstag gelegt. */
  it('greift auch vor dem Planbeginn', () => {
    expect(iso(trainingWeekStart(new Date(2026, 7, 14), START))).toBe('2026-08-08');
    expect(iso(trainingWeekStart(new Date(2026, 7, 8), START))).toBe('2026-08-08');
  });

  it('liefert sieben aufeinanderfolgende Tage ab dem Wochenbeginn', () => {
    const tage = trainingWeekDays(new Date(2026, 7, 19), START);
    expect(tage).toHaveLength(7);
    expect(iso(tage[0])).toBe('2026-08-15');
    expect(iso(tage[6])).toBe('2026-08-21');
    expect(tage[0].getDay()).toBe(6);
  });
});

describe('Monatsraster', () => {
  it('addMonths rechnet vom Monatsersten, nicht vom Tag', () => {
    expect(iso(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
    expect(iso(addMonths(new Date(2026, 0, 15), -1))).toBe('2025-12-01');
    expect(iso(startOfMonth(new Date(2026, 7, 29)))).toBe('2026-08-01');
  });

  it('faengt in der Spalte an, die firstDay vorgibt', () => {
    const gitter = monthGrid(new Date(2026, 7, 10), 1);
    expect(gitter[0].getDay()).toBe(1);
    expect(iso(gitter[0])).toBe('2026-07-27');
    expect(gitter.length % 7).toBe(0);
  });

  it('haengt keine leere Zeile an', () => {
    /* Februar 2027 hat 28 Tage und beginnt an einem Montag - genau vier
       Zeilen. Ein fest auf 42 gesetztes Raster haette zwei leere angehaengt. */
    expect(monthGrid(new Date(2027, 1, 1), 1)).toHaveLength(28);
  });

  it('umschliesst den ganzen Monat', () => {
    for(let m = 0; m < 12; m++){
      const gitter = monthGrid(new Date(2028, m, 1), 1);
      const erster = startOfMonth(new Date(2028, m, 1));
      const letzter = addDays(addMonths(erster, 1), -1);
      expect(dayOffset(erster, gitter[0])).toBeGreaterThanOrEqual(0);
      expect(dayOffset(gitter[gitter.length - 1], letzter)).toBeGreaterThanOrEqual(0);
    }
  });

  it('beschriftet die Spalten in derselben Reihenfolge', () => {
    expect(weekdayColumns(1)).toEqual(['Mo','Di','Mi','Do','Fr','Sa','So']);
    expect(weekdayColumns(6)).toEqual(['Sa','So','Mo','Di','Mi','Do','Fr']);
    expect(WEEKDAY_SHORT[monthGrid(new Date(2026, 7, 1), 1)[0].getDay()]).toBe('Mo');
  });

  it('nennt Monat und Jahr auf Deutsch', () => {
    expect(monthLabel(new Date(2026, 7, 1))).toBe('August 2026');
  });
});

describe('Koordinationstage', () => {
  const stub = n => ({ coordination: n == null ? undefined : { everyNthDay: n } });

  it('trifft jeden zweiten Tag ab dem Planbeginn', () => {
    expect(isCoordinationDay(stub(2), START, START)).toBe(true);
    expect(isCoordinationDay(stub(2), addDays(START, 1), START)).toBe(false);
    expect(isCoordinationDay(stub(2), addDays(START, 2), START)).toBe(true);
  });

  /* Sieben ist ungerade: der Zweitagestakt kippt von Woche zu Woche auf die
     anderen Wochentage. Genau deshalb wird durchgezaehlt statt Wochentage
     aufzulisten. */
  it('verschiebt sich um einen Wochentag je Woche', () => {
    expect(isCoordinationDay(stub(2), addDays(START, 7), START)).toBe(false);
    expect(isCoordinationDay(stub(2), addDays(START, 14), START)).toBe(true);
  });

  it('zaehlt auch rueckwaerts richtig', () => {
    expect(isCoordinationDay(stub(2), addDays(START, -2), START)).toBe(true);
    expect(isCoordinationDay(stub(2), addDays(START, -1), START)).toBe(false);
  });

  it('schweigt, wenn der Block im Plan fehlt', () => {
    expect(isCoordinationDay(stub(null), START, START)).toBe(false);
    expect(isCoordinationDay(stub(0), START, START)).toBe(false);
    expect(isCoordinationDay({}, START, START)).toBe(false);
  });
});

/* Die erste Woche, deren Donnerstag Intervalle vorsieht - nicht auf Woche 1
   festgenagelt, weil plan.json die Reihenfolge der Wochen aendern darf. */
function ersteIntervallwoche(){
  for(let w = 1; w <= plan.weekCount; w++){
    if(thursdayPlan(plan, w).kind === 'intervals') return w;
  }
  return null;
}

function tagIn(woche, dow){
  const d = addDays(START, (woche - 1) * 7);
  while(d.getDay() !== dow) d.setDate(d.getDate() + 1);
  return toMidnight(d);
}

describe('Strukturierte Tagesbeschreibung', () => {
  const th = NO_THRESHOLDS;

  it('gibt jedem Tag Kennzahlen, Bloecke und Zusatz', () => {
    for(let i = 0; i < 7; i++){
      const info = buildDayInfo(plan, th, addDays(START, i), START);
      expect(Array.isArray(info.kennzahlen)).toBe(true);
      expect(Array.isArray(info.bloecke)).toBe(true);
      expect(Array.isArray(info.hinweise)).toBe(true);
      expect(Array.isArray(info.zusatz)).toBe(true);
      expect(info.kennzahlen.length).toBeGreaterThan(0);
      for(const b of info.bloecke){
        expect(typeof b.label).toBe('string');
        expect(typeof b.wert).toBe('string');
      }
    }
  });

  it('zerlegt den Intervalltag in Einfahren, Belastung, Pause und Ausrollen', () => {
    const w = ersteIntervallwoche();
    expect(w).not.toBe(null);
    const t = thursdayPlan(plan, w);
    const info = buildDayInfo(plan, th, tagIn(w, 4), START);

    expect(info.type).toBe('interval');
    expect(info.bloecke.map(b => b.label)[0]).toBe('Einfahren');
    expect(info.bloecke[info.bloecke.length - 1].label).toBe('Ausrollen');
    expect(info.bloecke.map(b => b.label)).toContain('Pause');
    expect(info.bloecke.some(b => b.label.startsWith(t.reps + '× '))).toBe(true);

    const labels = info.kennzahlen.map(k => k.label);
    expect(labels).toContain('Dauer');
    expect(labels).toContain('Wiederholungen');
    expect(labels).toContain('Zielzone');
  });

  it('zieht die Oeffnungsintervalle des Schwellentests zu einer Zeile zusammen', () => {
    let testWoche = null;
    for(let w = 1; w <= plan.weekCount; w++){
      if(thursdayPlan(plan, w).kind === 'test'){ testWoche = w; break; }
    }
    expect(testWoche).not.toBe(null);
    const info = buildDayInfo(plan, th, tagIn(testWoche, 4), START);
    const roh = plan.thresholdTest.steps.length;
    expect(info.bloecke.length).toBeLessThan(roh);
    expect(info.bloecke.some(b => /^\d+× /.test(b.label))).toBe(true);
  });

  it('haengt den Mobility-Flow an jeden Tag und die Koordination an jeden zweiten', () => {
    const mit = buildDayInfo(plan, th, START, START);
    const ohne = buildDayInfo(plan, th, addDays(START, 1), START);
    expect(mit.zusatz.map(z => z.label)).toContain('Mobility-Flow');
    expect(ohne.zusatz.map(z => z.label)).toContain('Mobility-Flow');
    expect(mit.zusatz.map(z => z.label)).toContain('Koordination');
    expect(ohne.zusatz.map(z => z.label)).not.toContain('Koordination');
  });

  it('haengt den Knochenreiz an, aber nicht am Tag vor dem Qualitaetstag', () => {
    /* skipWeekdays nennt im ausgelieferten Plan den Mittwoch: der Reiz ist zwar
       ermuedungsfrei, aber der Donnerstag ist der Qualitaetstag. */
    const woche = 2;
    const mittwoch = buildDayInfo(plan, th, tagIn(woche, 3), START);
    const dienstag = buildDayInfo(plan, th, tagIn(woche, 2), START);
    expect(dienstag.zusatz.map(z => z.label)).toContain(plan.bone.label);
    expect(mittwoch.zusatz.map(z => z.label)).not.toContain(plan.bone.label);
  });

  it('kommt ohne mobility, coordination und Knochenreiz aus', () => {
    const kahl = Object.assign({}, plan);
    delete kahl.mobility;
    delete kahl.coordination;
    delete kahl.bone;
    expect(buildDayInfo(kahl, th, START, START).zusatz).toEqual([]);
  });
});

/* Mehrere Einheiten an einem Tag.

   Der Anlass war ein uebersehenes Rumpftraining: der Mittwoch hiess "Rad –
   kurzes Z2 (Arbeitsweg) + Rumpf", und der Zirkel stand als eine von drei
   Ablaufzeilen unter den Kennzahlen der Fahrt. Geprueft wird deshalb beides -
   dass die zweite Einheit eigenstaendig dasteht, und dass die drei Listen des
   Tages nichts verlieren, was in einer Einheit steht. Die zweite Haelfte ist
   die wichtigere: sie ist der Grund, warum es die Listen nur noch abgeleitet
   gibt. */
describe('Einheiten eines Tages', () => {
  const th = NO_THRESHOLDS;

  /* Woche 1 faehrt mittwochs nicht; gesucht ist die erste Woche mit Fahrt. */
  function ersteMittwochsfahrt(){
    for(let w = 1; w <= plan.weekCount; w++){
      if(plan.weeks[w - 1].wednesdayMinutes > 0) return w;
    }
    return null;
  }

  it('teilt den Mittwoch in Fahrt und Zirkel', () => {
    const w = ersteMittwochsfahrt();
    expect(w).not.toBe(null);
    const info = buildDayInfo(plan, th, tagIn(w, 3), START);

    expect(info.einheiten.map(e => e.titel))
      .toEqual(['Rad – kurzes Z2 (Arbeitsweg)', 'Rumpf-Zirkel (verkürzt)']);
    expect(info.einheiten[0].art).toBe('z2');
    expect(info.einheiten[1].art).toBe('rumpf');
    /* Die Tageszeit ist der Unterschied, den man kennen muss: der Zirkel
       findet Stunden nach der Fahrt statt. */
    expect(info.einheiten[1].zeit).toBe('abends');
    /* Und er hat eigene Kennzahlen. Vorher trug der Tag ausschliesslich die
       der Fahrt - Dauer, Zielzone, Trittfrequenz -, und die Rundenzahl des
       Zirkels stand nirgends ausser im Fliesstext eines Ablaufeintrags. */
    expect(info.einheiten[1].kennzahlen.map(k => k.label))
      .toEqual(['Dauer', 'Umfang', 'Takt']);
  });

  it('haengt den Timerknopf an seine Einheit', () => {
    const w = ersteMittwochsfahrt();
    const info = buildDayInfo(plan, th, tagIn(w, 3), START);
    expect(info.einheiten[0].timer).toBe(null);
    expect(info.einheiten[1].timer.ziel).toBe('training');
    expect(info.showTimerBtn).toBe(true);
  });

  it('trennt am Sonntag Zirkel und Beinblock', () => {
    const info = buildDayInfo(plan, th, tagIn(1, 0), START);
    const titel = info.einheiten.map(e => e.titel);
    expect(titel).toContain('Rumpf-Zirkel (voll)');
    expect(titel).toContain('Beinblock');
    expect(info.showLegBtn).toBe(true);
  });

  it('gibt dem Dienstag ab der zweiten Beineinheit eine zweite Einheit', () => {
    let mitBeinen = null, ohneBeine = null;
    for(let w = 1; w <= plan.weekCount; w++){
      const n = plan.weeks[w - 1].tuesdayLegRounds || 0;
      if(n > 0 && mitBeinen === null) mitBeinen = w;
      if(n === 0 && ohneBeine === null) ohneBeine = w;
    }
    expect(mitBeinen).not.toBe(null);
    expect(buildDayInfo(plan, th, tagIn(ohneBeine, 2), START).einheiten.length).toBe(1);
    const zwei = buildDayInfo(plan, th, tagIn(mitBeinen, 2), START).einheiten;
    expect(zwei.length).toBe(2);
    expect(zwei[1].titel).toBe('Beinblock');
    expect(zwei[1].zeit).toBe('abends');
  });

  /* Der eigentliche Schutz: die drei Listen des Tages sind die Summe seiner
     Einheiten und werden nicht daneben gepflegt. Waeren sie es, koennte eine
     Einheit wieder in der einen stehen und in der anderen fehlen. */
  it('haengt Kennzahlen, Bloecke und Hinweise aus den Einheiten zusammen', () => {
    for(let d = 0; d < 18 * 7; d++){
      const info = buildDayInfo(plan, th, addDays(START, d), START);
      const aus = f => info.einheiten.flatMap(e => e[f]);
      expect(info.kennzahlen).toEqual(aus('kennzahlen'));
      expect(info.bloecke).toEqual(aus('bloecke'));
      expect(info.hinweise).toEqual(aus('hinweise').concat(info.tagHinweise));
      expect(info.einheiten.length).toBeGreaterThan(0);
      for(const e of info.einheiten){
        expect(typeof e.titel).toBe('string');
        expect(e.titel.length).toBeGreaterThan(0);
      }
    }
  });
});

/* Vor dem Planbeginn klemmt weekNumberFor auf Woche 1. Das ist gewollt - alle
   uebrigen Felder brauchen eine gueltige Wochennummer -, darf aber nicht dazu
   fuehren, dass ein Datum vor dem Start einen vollstaendigen Trainingstag
   zeigt. Der Kalender laesst sich beliebig weit zurueckblaettern, die alte
   Ansicht mit sieben Tagen ab heute konnte dort nie hinkommen. */
describe('Tage vor dem Planbeginn', () => {
  const plan = createPlan(JSON.parse(fs.readFileSync('public/plan.json', 'utf8')));
  const th = { ftp: 0, lthr: 0, hrmax: 0 };
  const START = dayFromIso('2026-08-15');

  it('markiert den Tag vor dem Beginn als vorStart', () => {
    expect(buildDayInfo(plan, th, addDays(START, -1), START).vorStart).toBe(true);
  });

  it('markiert den Beginn selbst nicht mehr', () => {
    expect(buildDayInfo(plan, th, START, START).vorStart).toBe(false);
  });

  it('markiert auch weit zurueckliegende Daten', () => {
    expect(buildDayInfo(plan, th, addDays(START, -49), START).vorStart).toBe(true);
  });

  it('haelt die Wochennummer trotzdem auf 1, damit nichts undefiniert wird', () => {
    const info = buildDayInfo(plan, th, addDays(START, -49), START);
    expect(info.week).toBe(1);
    expect(info.target).toBeTruthy();
    expect(Array.isArray(info.bloecke)).toBe(true);
  });
});
