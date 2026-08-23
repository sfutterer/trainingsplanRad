/* Gleichheitsnachweis gegen die Einzeldatei-Fassung (Tag: vor-umbau).

   Die Pruefsummen stammen aus einem Abzug, der im Browser gegen den alten
   Stand und in Node gegen diese Module erzeugt wurde - identisches Startdatum,
   18 Wochen, alle sieben Tage je Woche, beide Zonenmodelle. Aendert sich hier
   eine Zahl oder ein Satz, faellt der Test. Das ist der Zweck: der Umbau darf
   die Anzeige nicht anfassen.

   Nachgezogen am 23.08.2026: Z2 der Uebergangsfassung reicht jetzt wie im
   Trainingsplan bis 142 statt bis 135, Z3 beginnt entsprechend bei 142. Die
   Abzuege unterscheiden sich gegenueber dem alten Stand ausschliesslich in
   diesen beiden Zahlen und den daraus erzeugten Texten. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createPlan } from '../src/domain/plan.js';
import { planValidate } from '../src/domain/schema.js';
import * as W from '../src/domain/week.js';
import * as Z from '../src/domain/zones.js';
import * as C from '../src/domain/core.js';
import * as D from '../src/domain/day.js';

const json = JSON.parse(fs.readFileSync(new URL('../public/plan.json', import.meta.url), 'utf8'));
const plan = createPlan(json);
const start = W.toMidnight(new Date('2026-08-15'));
const sha = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex').slice(0, 16);
const j = v => JSON.stringify(v);

function dumpWeeks(th){
  const out = [];
  for(let w = 1; w <= 18; w++){
    out.push('WEEK ' + w + ' idx=' + W.weekIndex(plan, w) + ' phase=' + W.phaseOf(plan, w)
      + ' recovery=' + W.isRecoveryWeek(plan, w) + ' winter=' + W.isWinterBlock(plan, w)
      + ' test=' + W.isTestWeek(plan, w) + ' coreRounds=' + C.coreRounds(plan, w)
      + ' coreWork=' + C.coreWorkSeconds(plan, w) + ' coreRest=' + C.coreRestSeconds(plan, w)
      + ' legRounds=' + C.legRounds(plan, w)
      + ' coreMinFull=' + C.coreMinutes(plan, w, C.coreRounds(plan, w))
      + ' coreMinWed=' + C.coreMinutes(plan, w, plan.circuit.wednesdayRounds)
      + ' thursday=' + j(D.thursdayPlan(plan, w)) + ' saturday=' + j(D.saturdayBlocks(plan, w))
      + ' legDose=' + j(C.legDose(plan, w)) + ' bands=' + j(Z.hrBands(plan, th, w)));
  }
  return out.join('\n');
}

function dumpDays(th){
  const out = [];
  for(let d = 0; d < 18 * 7; d++){
    const date = new Date(start); date.setDate(date.getDate() + d);
    const info = D.buildDayInfo(plan, th, date, start);
    out.push('DAY ' + W.isoDayLocal(date) + ' | ' + info.type + ' | ' + info.title
      + ' | ' + info.detail + ' | target=' + j(info.target));
  }
  return out.join('\n');
}

function dumpReps(){
  const out = [];
  plan.circuit.exercises.forEach((ex, i) => {
    [20, 25, 30, 35, 40, 45].forEach(s => {
      out.push('REP ' + i + ' ' + s + ' | ' + C.repShort(ex, s) + ' | ' + C.repLong(ex, s));
    });
  });
  return out.join('\n');
}

describe('plan.json', () => {
  it('wird ohne Beanstandung angenommen', () => {
    expect(planValidate(json)).toEqual([]);
  });

  it('meldet eine Zonenluecke mit Feldnamen', () => {
    const k = structuredClone(json);
    k.heartRateZones.transitionBands[3].min = 140;
    expect(planValidate(k)[0]).toContain('transitionBands[3].min');
  });

  it('meldet eine verschobene Wochennummer', () => {
    const k = structuredClone(json);
    k.weeks[3].week = 99;
    expect(planValidate(k)[0]).toContain('lückenlos ab 1');
  });

  it('lehnt eine fremde Schemafassung ab', () => {
    const k = structuredClone(json);
    k.schemaVersion = 2;
    expect(planValidate(k)[0]).toContain('diese App liest Fassung 1');
  });
});

describe('Uebergangsbaender (ohne Testwerte)', () => {
  const th = Z.NO_THRESHOLDS;
  it('Wochenangaben unveraendert', () => {
    expect({ hash: sha(dumpWeeks(th)), len: dumpWeeks(th).length })
      .toEqual({ hash: 'f2d67a5f210db4ae', len: 14119 });
  });
  it('Tageskarten unveraendert', () => {
    expect({ hash: sha(dumpDays(th)), len: dumpDays(th).length })
      .toEqual({ hash: 'cc350b5e06fa622c', len: 43550 });
  });
  it('Wiederholungsziele unveraendert', () => {
    expect({ hash: sha(dumpReps()), len: dumpReps().length })
      .toEqual({ hash: 'bb75759020e9f4fb', len: 5165 });
  });
});

describe('Coggan-Pfad (FTP 212, LTHR 163)', () => {
  const th = { ftp: 212, lthr: 163, hrmax: 187 };
  it('Zonen und Tagestexte unveraendert', () => {
    const out = [];
    for(let w = 1; w <= 18; w++){
      out.push('ZB ' + w + ' ' + j(Z.hrBands(plan, th, w)) + ' coggan=' + Z.usesCoggan(plan, th, w)
        + ' z2=' + Z.zoneText(plan, th, 'z2', w) + ' span=' + Z.zoneSpan(plan, th, 'z1', 'z2', w)
        + ' watt=' + ['z1','z2','z3','z4','z5'].map(k => k + ':' + Z.wattText(plan, th, k)).join(',')
        + ' target=' + Z.targetText(plan, th, 'z2', w) + ' cad=' + Z.cadenceText(plan, 'z2', w));
    }
    for(let d = 0; d < 18 * 7; d++){
      const date = new Date(start); date.setDate(date.getDate() + d);
      out.push('D ' + W.isoDayLocal(date) + '|' + D.buildDayInfo(plan, th, date, start).detail);
    }
    const t = out.join('\n');
    expect({ hash: sha(t), len: t.length }).toEqual({ hash: '2e1d91d772534831', len: 38551 });
  });
});

describe('Kennzahlen aus dem Trainingsplan-Dokument', () => {
  it('Wochenumfaenge Rad stimmen mit Abschnitt 2 ueberein', () => {
    const soll = [266, 326, 359, 255, 373, 393, 403, 253, 410, 430, 435, 270, 392, 413, 418, 270];
    const ist = [];
    for(let w = 1; w <= 16; w++){
      const week = plan.weeks[W.weekIndex(plan, w)];
      ist.push(week.tuesdayMinutes + week.wednesdayMinutes + D.thursdayPlan(plan, w).minutes
             + week.saturdayMinutes + week.sundayOptionalMinutes);
    }
    expect(ist).toEqual(soll);
  });

  it('Z3-Bloecke am Samstag nur in Woche 6, 10 und 14', () => {
    const mit = [];
    for(let w = 1; w <= 16; w++) if(D.saturdayBlocks(plan, w)) mit.push(w);
    expect(mit).toEqual([6, 10, 14]);
  });

  it('Schwellentest in Woche 4, 12 und 16', () => {
    expect(W.testWeeks(plan)).toEqual([4, 12, 16]);
  });

  it('Z2 der Uebergangsfassung ist 128 bis 142 bpm', () => {
    const b = Z.zoneBand(plan, Z.NO_THRESHOLDS, 'z2', 2);
    expect([b.min, b.max]).toEqual([128, 142]);
  });
});

describe('Beinblock-Protokoll', () => {
  const dose = { squat:[8,10], split:[6,6], calf:[10,10], extra:null };
  const leer = { plannedRounds: 2, exercises: [] };
  const teil = { plannedRounds: 2, exercises: [
    { key:'squat', target:8,  reps:[10, 9] },
    { key:'split', target:6,  reps:[6, null] },
    { key:'calf',  target:10, reps:[12, 12] }
  ]};

  it('zaehlt ohne Eintraege null volle Runden', () => {
    /* every() auf einer leeren Liste liefert true - ohne die Pruefung haette
       ein Tag ohne jeden Eintrag alle Runden als vollstaendig gemeldet. */
    expect(C.legDoneRounds(leer)).toBe(0);
    expect(C.legDoneRounds(null)).toBe(0);
  });

  it('zaehlt nur Runden, in denen jede Uebung steht', () => {
    expect(C.legDoneRounds(teil)).toBe(1);
  });

  it('zaehlt Saetze unter dem Ziel als Abbruch', () => {
    expect(C.legAborts(teil)).toBe(0);
    const schwach = structuredClone(teil);
    schwach.exercises[0].reps = [6, 5];
    expect(C.legAborts(schwach)).toBe(2);
  });

  it('zieht die Dosierung in Erholungswochen auf den unteren Rand', () => {
    const w3 = C.legDose(plan, 3), w4 = C.legDose(plan, 4);
    expect(w4.squat[0]).toBe(w4.squat[1]);
    expect(w4.squat[0]).toBe(w3.squat[0]);
  });
});

describe('Beinblock im Wochenplan', () => {
  it('kuerzt am Mittwoch den Zirkel, nicht den Beinblock', () => {
    /* Woche 5 hat drei Zirkelrunden, der Mittwoch trotzdem zwei. Die Dosis des
       Beinblocks haengt dagegen nur an der Woche: wer ihn ausserhalb des Plans
       faehrt, faehrt dieselben Runden wie am Sonntag. */
    expect(C.coreRoundsForDay(plan, 5, 3)).toBe(2);
    expect(C.coreRoundsForDay(plan, 5, 0)).toBe(3);
    expect(C.legRounds(plan, 5)).toBe(2);
  });
});
