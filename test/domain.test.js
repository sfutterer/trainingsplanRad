/* Gleichheitsnachweis gegen die Einzeldatei-Fassung (Tag: vor-umbau).

   Die Pruefsummen stammen aus einem Abzug, der im Browser gegen den alten
   Stand und in Node gegen diese Module erzeugt wurde - identisches Startdatum,
   18 Wochen, alle sieben Tage je Woche, beide Zonenmodelle. Aendert sich hier
   eine Zahl oder ein Satz, faellt der Test. Das ist der Zweck: der Umbau darf
   die Anzeige nicht anfassen.

   Nachgezogen am 23.08.2026: Z2 der Uebergangsfassung reicht jetzt wie im
   Trainingsplan bis 142 statt bis 135, Z3 beginnt entsprechend bei 142. Die
   Abzuege unterscheiden sich gegenueber dem alten Stand ausschliesslich in
   diesen beiden Zahlen und den daraus erzeugten Texten.

   Nachgezogen am 29.08.2026: die Zonenfarbe ist aus dem Modell verschwunden.
   Sie stand als Hexwert in plan.json und noch einmal als Token in theme.css,
   beide wurden benutzt - dieselbe Zone hatte je nach Anzeige eine andere
   Farbe, und die Fassung aus plan.json folgte dem Dunkelmodus nicht.

   Dass sich sonst nichts geaendert hat, laesst sich hier ausrechnen und nicht
   nur behaupten: beide Abzuege sind um genau 1944 Zeichen kuerzer, und das
   sind 18 Wochen mal 6 Baender mal die 18 Zeichen von ,"color":"#xxxxxx".
   Die beiden Abzuege ohne Baender - Tageskarten und Wiederholungsziele -
   haben ihre Pruefsumme unveraendert behalten.

   Neu gesetzt am 30.08.2026 auf Fassung 3 des Trainingsplans. Der
   Gleichheitsnachweis gegen die Einzeldatei-Fassung ist damit zu Ende: der
   Plan selbst hat sich geaendert - 2:1-Rhythmus ab Woche 5, neue
   Phasengrenzen, Tests in Woche 4, 10 und 16, zweite Beineinheit am Dienstag,
   Erhaltungsreiz am Mittwoch. Was die Pruefsummen ab hier sichern, ist nicht
   mehr die Gleichheit mit dem alten Stand, sondern dass eine kuenftige
   Codeaenderung die Zahlen der Fassung 3 nicht anfasst. Die Kennzahlen weiter
   unten pruefen dieselben Zahlen gegen das Dokument und sind die Stelle, an
   der ein Fehler benannt wird; die Pruefsumme sagt nur, dass sich etwas
   geaendert hat. Die Wiederholungsziele des Zirkels sind unveraendert - ihre
   Pruefsumme steht deshalb noch auf dem alten Wert.

   Neu gesetzt am 01.09.2026: der Testanlauf ersetzt die Tage, fuer die er
   gilt, statt nur einen Satz darunter zu haengen. Betroffen sind genau
   fuenfzehn Tage - fuenf je Testtermin, dreimal dieselben Abstaende: der
   Donnerstag der Vorwoche, der Freitag danach, der Sonntag, der Dienstag und
   der Mittwoch vor dem Test. Alle uebrigen 111 Tage sind Zeichen fuer Zeichen
   dieselben geblieben; die Wochenangaben und die Wiederholungsziele haben
   ihre Pruefsumme unveraendert behalten, weil der Anlauf an einem Datum
   haengt und nicht an der Woche.

   Nachgezogen am 01.09.2026: wo die Anstrengung die Steuergroesse ist, steht
   kein Pulsband mehr. Betrifft den Anlauf, die Oeffner am Vortag und den
   Schwellentest selbst. Der Trainingsplan fuehrt Z4 als "im Plan nicht
   angesteuert", und beim Test waere das Band zirkulaer - er erzeugt die
   LTHR, aus der es spaeter gerechnet wird. Die Zonenschluessel bleiben an den
   Schritten: sie tragen die Ringfarbe des Timers und den Sollwert der
   Auswertung, nur nicht mehr die Vorgabe auf der Karte.

   Neu gesetzt am 04.09.2026 auf Fassung 4 des Trainingsplans: der
   5-min-All-out entfaellt aus dem Schwellentest, die Pause davor sinkt von 10
   auf 5 min, der Test dauert 55 statt 65 min. Betroffen sind genau neun der
   126 Tage, und sie liessen sich vor dem Neusetzen einzeln benennen: die drei
   Testtage (Text, Dauer, harte Zeit 25 -> 20 min) und die sechs
   Anlauftage, deren Sollwert den Ablauftext dazubekommen hat. Die uebrigen
   117 Tage sind Zeichen fuer Zeichen dieselben geblieben.

   Der Ablauftext im Sollwert ist keine Kosmetik: die VO2max-Variante der
   Woche 5 hat ungleiche Bloecke - 5 min maximal, dann viermal 4 min -, und
   "5x 5 min" waere dort die falsche Begruendung. Die Wochenangaben haben
   ihre Laenge behalten und nur ihre Pruefsumme geaendert: 65 und 55 sind
   gleich viele Zeichen. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createPlan } from '../src/domain/plan.js';
import { planValidate } from '../src/domain/schema.js';
import * as W from '../src/domain/week.js';
import * as Z from '../src/domain/zones.js';
import * as C from '../src/domain/core.js';
import * as D from '../src/domain/day.js';
import * as S from '../src/domain/timer/sequences.js';

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
      + ' legRounds=' + C.legRounds(plan, w) + ' tueLegRounds=' + C.tuesdayLegRounds(plan, w)
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
    k.schemaVersion = 3;
    expect(planValidate(k)[0]).toContain('diese App liest Fassung 2');
  });

  /* Fassung 2 kannte recoveryEveryNthWeek und keine recoveryWeeks. Ein solcher
     Plan darf nicht halb durchlaufen: die Erholungswochen entschieden ueber
     Beinblock-Dosierung und Samstagsbloecke, und ohne die Liste stuenden dort
     stillschweigend andere Zahlen. */
  it('lehnt einen Plan der Fassung 2 ab', () => {
    const k = structuredClone(json);
    k.schemaVersion = 1;
    expect(planValidate(k)[0]).toContain('diese App liest Fassung 2');
  });

  it('meldet eine Erholungswoche jenseits des Planendes', () => {
    const k = structuredClone(json);
    k.recoveryWeeks = [4, 7, 10, 13, 99];
    expect(planValidate(k).join(' ')).toContain('nur 16 Wochen');
  });

  it('meldet eine unsortierte Erholungswochenliste', () => {
    const k = structuredClone(json);
    k.recoveryWeeks = [4, 10, 7, 13, 16];
    expect(planValidate(k).join(' ')).toContain('aufsteigen');
  });

  /* Der Erhaltungsreiz haengt an der Mittwochsfahrt. Steht er in einer Woche
     ohne Fahrt, gibt es nichts, woran er haengen koennte - und die Karte
     zeigte ihn trotzdem an. */
  it('meldet einen Erhaltungsreiz ohne Mittwochsfahrt', () => {
    const k = structuredClone(json);
    k.weeks[0].wednesdayExtra = structuredClone(k.weeks[10].wednesdayExtra);
    expect(planValidate(k).join(' ')).toContain('wednesdayExtra');
  });

  it('verlangt volle Dosis in der ersten Muskelkater-Stufe', () => {
    const k = structuredClone(json);
    k.legBlock.sorenessLevels[0].dose = 'low';
    expect(planValidate(k).join(' ')).toContain('Voreinstellung');
  });

  /* Ein Tippfehler in einem optionalen Feld fiel vorher stillschweigend durch,
     und die App rechnete mit dem Standardwert weiter. */
  it('meldet einen unbekannten Schluessel der obersten Ebene', () => {
    const k = structuredClone(json);
    k.saturdayRid = k.saturdayRide;
    expect(planValidate(k).join(' ')).toContain('saturdayRid');
  });

  it('laesst den Dokumentationsblock stehen', () => {
    expect(json.documentation).toBeTypeOf('object');
    expect(planValidate(json)).toEqual([]);
  });
});

describe('Uebergangsbaender (ohne Testwerte)', () => {
  const th = Z.NO_THRESHOLDS;
  it('Wochenangaben unveraendert', () => {
    expect({ hash: sha(dumpWeeks(th)), len: dumpWeeks(th).length })
      .toEqual({ hash: 'e4e9efdba6397a64', len: 12261 });
  });
  it('Tageskarten unveraendert', () => {
    expect({ hash: sha(dumpDays(th)), len: dumpDays(th).length })
      .toEqual({ hash: 'b5b959710c288bdf', len: 47956 });
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
    expect({ hash: sha(t), len: t.length }).toEqual({ hash: 'a2fa0bf48f7746aa', len: 40941 });
  });
});

describe('Kennzahlen aus dem Trainingsplan-Dokument', () => {
  /* Die Zeile "Soll" aus Abschnitt 2 der Fassung 3. Sie wird gerechnet und
     nicht gepflegt - stuende sie zusaetzlich in plan.json, waere sie die
     zweite Zahl fuer dieselbe Sache. */
  it('Wochenumfaenge Rad stimmen mit Abschnitt 2 ueberein', () => {
    /* Fassung 4: der Test dauert 55 statt 65 min (Wochen 4, 10, 16), und der
       Donnerstag der Woche 5 rechnet mit der VO2max-Variante - 65 statt 63. */
    const soll = [266, 326, 359, 245, 375, 393, 253, 398, 408, 260, 430, 445, 265, 412, 428, 265];
    const ist = [];
    for(let w = 1; w <= 16; w++) ist.push(D.weekPlanMinutes(plan, w));
    expect(ist).toEqual(soll);
  });

  /* Die Zeile "Max (+10 %)" derselben Tabelle. */
  it('Umfangsdeckel stimmt mit Abschnitt 2 ueberein', () => {
    const max = [293, 359, 395, 270, 413, 432, 278, 438, 449, 286, 473, 490, 292, 453, 471, 292];
    const ist = [];
    for(let w = 1; w <= 16; w++) ist.push(D.weekCapMinutes(plan, w));
    expect(ist).toEqual(max);
  });

  it('Erholungswochen sind 4, 7, 10, 13 und 16', () => {
    const rec = [];
    for(let w = 1; w <= 16; w++) if(W.isRecoveryWeek(plan, w)) rec.push(w);
    expect(rec).toEqual([4, 7, 10, 13, 16]);
  });

  /* Die alte Formel week % 4 === 0 haette im Winterblock weitergezaehlt und
     dort beliebige Wochen als Erholung ausgewiesen. */
  it('kennt nach dem Planende keine Erholungswochen mehr', () => {
    expect(W.isRecoveryWeek(plan, 20)).toBe(false);
    expect(W.isRecoveryWeek(plan, 24)).toBe(false);
  });

  it('Phasengrenzen sind 1-4, 5-10, 11-13 und 14-16', () => {
    const phasen = [];
    for(let w = 1; w <= 16; w++) phasen.push(W.phaseOf(plan, w));
    expect(phasen).toEqual([1,1,1,1, 2,2,2,2,2,2, 3,3,3, 4,4,4]);
  });

  it('Z3-Bloecke am Samstag nur in Woche 6, 9 und 12', () => {
    const mit = [];
    for(let w = 1; w <= 16; w++) if(D.saturdayBlocks(plan, w)) mit.push(w);
    expect(mit).toEqual([6, 9, 12]);
  });

  it('Schwellentest in Woche 4, 10 und 16', () => {
    expect(W.testWeeks(plan)).toEqual([4, 10, 16]);
  });

  it('zweite Beineinheit am Dienstag nur in Woche 11, 12, 14 und 15', () => {
    const mit = [];
    for(let w = 1; w <= 16; w++) if(C.tuesdayLegRounds(plan, w)) mit.push(w);
    expect(mit).toEqual([11, 12, 14, 15]);
    /* Phase 3 traegt die zweite Einheit, Phase 4 nur noch die Erhaltungsdosis. */
    expect([C.tuesdayLegRounds(plan, 11), C.tuesdayLegRounds(plan, 14)]).toEqual([2, 1]);
  });

  it('Erhaltungsreiz am Mittwoch nur in Woche 11 und 12', () => {
    const mit = [];
    for(let w = 1; w <= 16; w++){
      if(plan.weeks[W.weekIndex(plan, w)].wednesdayExtra) mit.push(w);
    }
    expect(mit).toEqual([11, 12]);
  });

  it('Z2 der Uebergangsfassung ist 128 bis 142 bpm', () => {
    const b = Z.zoneBand(plan, Z.NO_THRESHOLDS, 'z2', 2);
    expect([b.min, b.max]).toEqual([128, 142]);
  });

  /* Die Farbe einer Zone ist Darstellung und steht in theme.css, nicht im
     Plan. Stuende sie wieder in plan.json, haette dieselbe Zone erneut zwei
     Farben - und die aus der Datei folgte dem Dunkelmodus nicht. Deshalb hier
     als Test und nicht nur als Kommentar. */
  it('fuehrt keine Farben im Zonenmodell', () => {
    const felder = Z.hrBands(plan, { ftp: 212, lthr: 163, hrmax: 187 }, 8)
      .concat(Z.hrBands(plan, Z.NO_THRESHOLDS, 1))
      .flatMap(b => Object.keys(b));
    expect([...new Set(felder)].sort()).toEqual(['key', 'label', 'max', 'min']);

    const roh = json.heartRateZones;
    expect(roh.transitionBands.concat(roh.cogganBands).some(b => 'color' in b)).toBe(false);
  });
});

describe('Beinblock-Protokoll', () => {
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

  it('gibt am Dienstag die zweite Einheit, sonst die Sonntagsdosis', () => {
    expect(C.legRoundsForDay(plan, 11, 2)).toBe(2);   // Dienstag, zweite Einheit
    expect(C.legRoundsForDay(plan, 11, 0)).toBe(3);   // Sonntag, voller Block
    /* Ohne zweite Einheit gilt auch am Dienstag der Sonntagswert - wer den
       Block ausserhalb des Plans oeffnet, bekommt eine Dosis und keine Null. */
    expect(C.legRoundsForDay(plan, 5, 2)).toBe(2);
  });
});

describe('Muskelkater-Regel', () => {
  const stufen = () => C.sorenessLevels(plan).map(l => l.key);

  it('faehrt ohne Angabe die volle Spanne', () => {
    const voll = C.legDose(plan, 11);
    expect(voll.squat[0]).not.toBe(voll.squat[1]);
  });

  it('zieht bei leichtem Kater auf den unteren Rand', () => {
    const voll = C.legDose(plan, 11);
    const leicht = C.legDose(plan, 11, stufen()[1]);
    expect(leicht.squat).toEqual([voll.squat[0], voll.squat[0]]);
    expect(leicht.calf).toEqual([voll.calf[0], voll.calf[0]]);
  });

  it('laesst den Block bei ausgepraegtem Kater entfallen', () => {
    expect(C.legSkipped(plan, stufen()[2])).toBe(true);
    expect(C.legSkipped(plan, stufen()[0])).toBe(false);
  });

  /* Eine unbekannte Stufe darf nicht in die reduzierte Dosis fallen: ein alter
     Protokolleintrag mit einem geloeschten Schluessel wuerde sonst still die
     Wiederholungszahl senken. */
  it('faellt bei unbekanntem Schluessel auf die erste Stufe zurueck', () => {
    expect(C.sorenessLevel(plan, 'gibtesnicht').key).toBe(stufen()[0]);
    expect(C.legDose(plan, 11, 'gibtesnicht')).toEqual(C.legDose(plan, 11));
  });
});

describe('Testanlauf', () => {
  const testTag = W.testDateFor(plan, 4, start);

  it('legt jeden Anlaufschritt auf seinen Tag', () => {
    for(const s of plan.testTaper.steps){
      const d = W.addDays(testTag, s.offsetDays);
      const info = D.buildDayInfo(plan, Z.NO_THRESHOLDS, d, start);
      expect(info.hinweise.join(' ')).toContain(s.text);
    }
  });

  it('kuendigt den Test ab dem Vorlauf an, davor nicht', () => {
    const drin = D.testTaperFor(plan, W.addDays(testTag, -plan.testTaper.leadDays), start);
    const draussen = D.testTaperFor(plan, W.addDays(testTag, -plan.testTaper.leadDays - 1), start);
    expect(drin && drin.week).toBe(4);
    expect(draussen).toBe(null);
  });

  it('haengt die Go/No-Go-Liste an den Testtag und an keinen anderen', () => {
    const test = D.buildDayInfo(plan, Z.NO_THRESHOLDS, testTag, start);
    const vortag = D.buildDayInfo(plan, Z.NO_THRESHOLDS, W.addDays(testTag, -1), start);
    expect(test.checkliste.punkte).toEqual(plan.testTaper.goNoGo);
    expect(vortag.checkliste).toBeUndefined();
  });

  /* Der Kern der Sache: ein Anlaufschritt mit eigener Einheit muss den Tag
     ersetzen und nicht kommentieren. Vorher stand am Donnerstag der Vorwoche
     weiter die Qualitaetseinheit, die laut Plan ausfaellt - in der Karte, im
     Timer und im Sollwert. */
  it('ersetzt den geplanten Tag, wo der Schritt eine eigene Einheit traegt', () => {
    for(const s of plan.testTaper.steps){
      const d = W.addDays(testTag, s.offsetDays);
      const info = D.buildDayInfo(plan, Z.NO_THRESHOLDS, d, start);
      if(!s.session){
        expect(info.ersetzt).toBeUndefined();
        continue;
      }
      expect(info.title).toBe(s.session.title);
      expect(info.ersetzt.titel).toBeTypeOf('string');
      expect(info.ersetzt.titel).not.toBe(info.title);
    }
  });

  /* Der Anlauf am Donnerstag der Vorwoche: zwei mal sechs Minuten statt
     fuenf mal fuenf, und der Sollwert gerechnet aus den Schritten.

     Der Knopf fuehrt seit dem 03.09.2026 in den Testbereich und nicht mehr in
     den Intervalltimer: der Anlauf gehoert zum Test, und die Wattzahl, auf die
     er hinausfaellt, wird gleich dort notiert. */
  it('rechnet den Sollwert aus den Schritten der Anlaufeinheit', () => {
    const anlaufTag = W.addDays(testTag, -7);
    const info = D.buildDayInfo(plan, Z.NO_THRESHOLDS, anlaufTag, start);
    const geplant = D.thursdayPlan(plan, 3);

    expect(geplant.reps).toBe(5);
    expect(info.target).toEqual({ sport:'ride', zone:'z4', minutes:43,
                                 hardMinutes:12, reps:2, repMinutes:6,
                                 ablauf:'2× 6 min' });
    expect(info.showTestBtn).toBe(true);
    expect(info.showIntervalBtn).toBe(false);
  });

  /* Die beiden Bloecke sind Probe und Korrektur, keine Wiederholungen. Als
     "2x Testtempo" zusammengezogen waere der Unterschied verschwunden, auf
     den es ankommt - und mit ihm die Entscheidung in der Pause. */
  it('haelt Probe und Korrektur als zwei Bloecke auseinander', () => {
    const info = D.buildDayInfo(plan, Z.NO_THRESHOLDS, W.addDays(testTag, -7), start);
    const labels = info.bloecke.map(b => b.label);
    expect(labels).toEqual(['Einfahren', 'Block 1 – Tempo suchen',
                            'Pause – Entscheidung', 'Block 2 – korrigiertes Tempo',
                            'Ausrollen']);
    expect(info.bloecke[2].hinweis).toContain('+15 W');
    expect(info.bloecke[2].hinweis).toContain('−15 W');
    expect(info.bloecke[1].hinweis).toContain('3–5 Worte');
  });

  /* Der Mittwoch davor traegt Oeffner und ausdruecklich keinen Zirkel. Ein
     stehengebliebener Rumpf-Timer waere die Einladung, ihn doch zu machen. */
  it('nimmt dem Mittwoch vor dem Test den Rumpf-Zirkel', () => {
    const info = D.buildDayInfo(plan, Z.NO_THRESHOLDS, W.addDays(testTag, -1), start);
    expect(info.target.sport).toBe('ride');
    expect(info.showTimerBtn).toBeFalsy();
    expect(info.hinweise.join(' ')).toContain('Kein Rumpf-Zirkel');
  });

  /* Der Sonntag verliert den Beinblock, der Freitag die optionale Fahrt. */
  it('streicht Beinblock und lockere Fahrt im Anlauf', () => {
    const sonntag = D.buildDayInfo(plan, Z.NO_THRESHOLDS, W.addDays(testTag, -4), start);
    const freitag = D.buildDayInfo(plan, Z.NO_THRESHOLDS, W.addDays(testTag, -6), start);
    expect(sonntag.target.legRounds).toBe(0);
    expect(sonntag.showLegBlock).toBeFalsy();
    expect(freitag.target).toEqual({ sport:'rest' });
  });

  /* Das Wellness-Gate haengt am Wochentag, nicht an der Einheit - sonst
     verloere ausgerechnet der Mittwoch vor dem Test seine Vorschau. */
  it('behaelt das Wellness-Gate der ersetzten Tage', () => {
    const mittwoch = D.buildDayInfo(plan, Z.NO_THRESHOLDS, W.addDays(testTag, -1), start);
    const donnerstag = D.buildDayInfo(plan, Z.NO_THRESHOLDS, W.addDays(testTag, -7), start);
    expect(mittwoch.wellness.rolle).toBe('vorschau');
    expect(donnerstag.wellness.rolle).toBe('entscheidung');
  });

  /* Derselbe Anlauf gilt fuer die Retests - abgeleitet aus den Testwochen und
     nicht ein zweites Mal hingeschrieben. */
  it('gilt vor jedem Testtermin', () => {
    for(const w of W.testWeeks(plan)){
      const info = D.buildDayInfo(plan, Z.NO_THRESHOLDS,
        W.addDays(W.testDateFor(plan, w, start), -7), start);
      expect(info.title).toBe('Rad – Anlauf im Testtempo');
    }
    expect(W.testWeeks(plan)).toEqual([4, 10, 16]);
  });
});

/* Wo die Anstrengung steuert, darf kein Pulsband als Vorgabe dastehen.

   Der Trainingsplan fuehrt Z4 als "im Plan nicht angesteuert", und beim
   Schwellentest waere ein Band zirkulaer: der Ø-Puls der 20 min ist die LTHR,
   aus der die Baender danach erst gerechnet werden. Bis dahin stehen sie im
   Dokument ausdruecklich als Arbeitsannahme aus einer ungeprueften HFmax. */
describe('Anstrengung statt Pulsband', () => {
  const testTag = W.testDateFor(plan, 4, start);
  const bpm = /\d+\s*(–|-)\s*\d+\s*bpm|über \d+ bpm/;

  /* Der Sollwert behaelt seinen Zonenschluessel: die Auswertung muss die
     harten Minuten weiterhin einordnen koennen. Nur angezeigt wird er nicht. */
  function zielzeilen(info){
    return info.bloecke.filter(b => /Block|maximal|all-out|Zügig|Testtempo/.test(b.label))
                       .map(b => b.wert);
  }

  it('nennt auf der Anlaufkarte eine Steuergroesse und kein Band', () => {
    const info = D.buildDayInfo(plan, Z.NO_THRESHOLDS, W.addDays(testTag, -7), start);
    const kz = info.kennzahlen.find(k => k.label === 'Steuergröße');
    expect(kz.wert).toContain('20 min haltbar');
    expect(info.kennzahlen.some(k => k.label === 'Zielzone')).toBe(false);
    zielzeilen(info).forEach(w => expect(w).not.toMatch(bpm));
    expect(info.target.zone).toBe('z4');
  });

  it('nennt auf der Testkarte eine Steuergroesse und kein Band', () => {
    const info = D.buildDayInfo(plan, Z.NO_THRESHOLDS, testTag, start);
    expect(info.kennzahlen.some(k => k.label === 'Zielzone')).toBe(false);
    expect(info.kennzahlen.find(k => k.label === 'Steuergröße').wert)
      .toBe(plan.thresholdTest.steering);
    zielzeilen(info).forEach(w => expect(w).not.toMatch(bpm));
  });

  /* Einfahren und Ausrollen behalten ihr Band: Z1 ist eine Obergrenze, die
     man einhalten kann und soll. */
  it('laesst Einfahren und Ausrollen bei ihrem Band', () => {
    const info = D.buildDayInfo(plan, Z.NO_THRESHOLDS, testTag, start);
    const rand = info.bloecke.filter(b => /Einfahren|Ausrollen|Locker rollen/.test(b.label));
    expect(rand.length).toBeGreaterThan(0);
    rand.forEach(b => expect(b.wert).toMatch(bpm));
  });

  /* Auf dem Rad liest man die eine Zeile unter der Uhr. Dort darf keine Zahl
     stehen, die nicht angesteuert werden soll - die Farbe bleibt. */
  it('zeigt die Anstrengung auch im Timer und behaelt die Ringfarbe', () => {
    const seq = S.buildTestSequence(plan, Z.NO_THRESHOLDS, 4);
    const zwanzig = seq.find(x => x.label === '20 min gleichmäßig maximal');
    expect(zwanzig.zone.label).toBe('gleichmäßig maximal');
    expect(zwanzig.zone.cls).toBe('z4');
    seq.filter(x => x.type === 'work').forEach(x => expect(x.zone.label).not.toMatch(bpm));
  });
});

/* Die gewaehlte Variante muss auch im Timer gelten.

   Sonst zaehlte er am 17.09. fuenf gleiche Intervalle, waehrend die Tageskarte
   fuenf Minuten maximal und danach vier Intervalle nennt - und der
   Maximalversuch, um den es an diesem Tag geht, fiele als fuenftes Intervall
   aus. */
describe('Intervalltimer mit Variante', () => {
  const woche5Do = W.thursdayDateFor(plan, 5, start);
  const iso = W.isoDayLocal(woche5Do);

  it('bleibt ohne Wahl bei den fuenf gleichen Intervallen', () => {
    const v = S.intervalDefaults(plan, 5, start, woche5Do, {});
    expect(v.mode).toBe('intervals');
    expect(v.reps).toBe(5);
    expect(v.workMin).toBe(4);
  });

  it('zaehlt mit Wahl die Schrittfolge der Variante', () => {
    const v = S.intervalDefaults(plan, 5, start, woche5Do, { [iso]: 'vo2max-referenz' });
    expect(v.mode).toBe('steps');
    expect(v.variante.id).toBe('vo2max-referenz');
    const seq = S.buildStepSequence(plan, Z.NO_THRESHOLDS, 5, v.steps);
    const arbeit = seq.filter(x => x.type === 'work');
    expect(arbeit.length).toBe(5);
    expect(arbeit[0].duration).toBe(5 * 60);
    expect(arbeit[1].duration).toBe(4 * 60);
    expect(S.totalSeconds(seq)).toBe(65 * 60 + plan.interval.prepSeconds);
  });

  it('laesst die uebrigen Donnerstage unberuehrt', () => {
    const wahlen = { [iso]: 'vo2max-referenz' };
    expect(S.intervalDefaults(plan, 6, start, W.thursdayDateFor(plan, 6, start), wahlen).mode)
      .toBe('intervals');
  });
});

describe('Intervalltimer im Anlauf', () => {
  const testTag = W.testDateFor(plan, 4, start);

  it('zaehlt den Anlauf und nicht die Intervalle, die ausfallen', () => {
    const v = S.intervalDefaults(plan, 3, start);
    expect(v.mode).toBe('steps');
    const seq = S.buildStepSequence(plan, Z.NO_THRESHOLDS, 3, v.steps);
    const arbeit = seq.filter(x => x.type === 'work');
    expect(arbeit.length).toBe(2);
    expect(arbeit[0].duration).toBe(6 * 60);
    expect(S.totalSeconds(seq)).toBe(43 * 60 + plan.interval.prepSeconds);
  });

  /* Ohne Startdatum kennt der Aufrufer den Kalender nicht. Dann lieber die
     geplante Einheit als eine falsch datierte Ersatzeinheit. */
  it('bleibt ohne Startdatum bei der Wochenvorgabe', () => {
    expect(S.intervalDefaults(plan, 3).mode).toBe('intervals');
  });

  it('laesst den Schwellentest selbst unberuehrt', () => {
    expect(S.intervalDefaults(plan, 4, start).mode).toBe('test');
    expect(W.isoDayLocal(testTag)).toBe('2026-09-10');
  });

  /* Am Mittwoch vor dem Test zaehlt der Timer die Oeffner. Ohne das fuehrte
     der Knopf auf der Mittwochskarte in den Test von morgen. */
  it('zeigt am Mittwoch vor dem Test die Oeffner und nicht den Test', () => {
    const mittwoch = W.addDays(testTag, -1);
    const v = S.intervalDefaults(plan, 4, start, mittwoch);
    expect(v.mode).toBe('steps');
    expect(v.anlauf.session.title).toBe('Rad – Öffner vor dem Test');
    expect(v.steps.filter(x => x.type === 'work').length).toBe(3);
  });

  /* An jedem anderen Tag bleibt es beim Donnerstag der Woche. */
  it('bleibt an gewoehnlichen Tagen beim Donnerstag der Woche', () => {
    const montag = W.addDays(testTag, -3);
    expect(S.intervalDefaults(plan, 4, start, montag).mode).toBe('test');
  });
});
