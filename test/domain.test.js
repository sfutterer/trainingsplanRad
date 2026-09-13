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
   gleich viele Zeichen.

   Neu gesetzt am 04.09.2026: die Mittwochskarte nennt die Beinblock-Regel mit
   den Worten des Plans. texts.legWednesdayNote stand seit jeher in
   plan.json, wurde von der Pruefung als Pflicht erzwungen und von nichts
   gelesen - der Code baute daneben eine kuerzere Fassung nach ("Kein
   Beinblock."), die den zweiten Satz der Regel unterschlug: ein ausgefallener
   Sonntag wird nicht auf den Mittwoch nachgeholt.

   Betroffen sind genau 15 der 126 Tage, und sie liessen sich vor dem
   Neusetzen einzeln benennen: alle Mittwoche ausser den dreien, die der
   Testanlauf ohnehin durch die Oeffner ersetzt (09.09., 21.10., 02.12.).
   Kein einziger Sollwert hat sich geaendert - der Vergleich lief ueber
   dieselbe Ausgabe mit und ohne die Aenderung.

   Neu gesetzt am 09.09.2026 auf Fassung 5 des Trainingsplans: der
   Erhaltungsreiz der Phase 3 wird von 6 x 30 s am Mittwoch zu 3 x 3 min bei
   108-115 % FTP, eingebettet in die Z2-Einheit am Donnerstag.

   Betroffen sind genau acht der 126 Tage, und sie liessen sich vor dem
   Neusetzen einzeln benennen:

   - 29.10. und 05.11., die Donnerstage der Wochen 11 und 12: aus einer
     Grundlagenfahrt wird eine Schrittfolge mit eingebettetem Reiz. Sie
     tragen jetzt einen Sollwert mit harter Zeit (9 min) und einen Knopf in
     den Intervalltimer.
   - 28.10. und 04.11., die Mittwoche derselben Wochen: der Reiz ist weg,
     die Fahrt bleibt bei 60 min.
   - 11.11. und 12.11., Mittwoch und Donnerstag der Erholungswoche 13: nur
     die beiden Plantexte, die die Verlegung nennen. Die Woche selbst
     bleibt reizfrei, das ist Absicht.
   - 10.12. und 17.12., die beiden Z2-Donnerstage des Winterblocks: derselbe
     Plantext. Er behauptete dort schon vorher etwas ueber Phase 3, in der
     der Winterblock gar nicht liegt.

   Die uebrigen 118 Tage sind Zeichen fuer Zeichen dieselben geblieben, die
   Wochenangaben aendern sich in genau zwei Zeilen (Woche 11 und 12, deren
   thursday jetzt die Schritte statt dreier Zahlen traegt). Kein
   Wochenumfang und kein Umfangsdeckel hat sich geaendert - die 15 min des
   Reizes liegen innerhalb der 70 bzw. 75 min, und genau das prueft die
   Kennzahl "Wochenumfaenge Rad" weiter unten unveraendert nach.

   Neu gesetzt am 13.09.2026: die Hoehenmeter am Samstag steigen. Bis dahin
   stand ab Woche 5 jeden Samstag fest "50–100 hm" - der Einstieg aus dem
   Dokument, und die eigenstaendige Progression danach kam nie an. Jetzt steht
   der Wert je Woche in plan.json unter sa.hoehenmeter.

   Betroffen sind genau 14 der 126 Tage, und sie liessen sich vor dem
   Neusetzen einzeln benennen: die Samstage der Wochen 5 bis 18, vom 12.09.
   bis zum 12.12., in beiden Zonenpfaden. Der Vergleich lief ueber dieselbe
   Ausgabe vor und nach der Aenderung; ersetzt man in der neuen jedes
   "ca. N hm" durch "50–100 hm", ist sie Zeichen fuer Zeichen die alte. Die
   Samstage der Wochen 1 bis 4 stehen weiter auf "flach", die
   Wochenangaben und die Wiederholungsziele haben ihre Pruefsumme behalten.
   Beide Abzuege sind um genau 9 Zeichen laenger: "ca. 80 hm" ist so lang wie
   "50–100 hm", jeder dreistellige Wert eine Stelle mehr - und dreistellig
   sind die Samstage der Wochen 8, 9, 11, 12 und 14 bis 18.

   Neu gesetzt am selben Tag: aus dem Punktwert wird ein Band. "ca. 225 hm"
   trifft keine Strecke, die es gibt; die Baender sind 100 hm breit und
   steigen je Belastungswoche um 50 hm. Betroffen sind dieselben 14 Samstage
   und nur ihr Wert - ersetzt man in beiden Ausgaben den Hoehenmeterwert durch
   dasselbe Zeichen, sind sie gleich. Die Laenge waechst um 5 Zeichen je
   Abzug: "150–250 hm" ist eine Stelle laenger als ein zweistelliges
   "ca. 80 hm" und so lang wie ein dreistelliges - zweistellig waren die
   Wochen 5, 6, 7, 10 und 13. */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createPlan } from '../src/domain/plan.js';
import { planValidate, PV_TEXT_KEYS } from '../src/domain/schema.js';
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

/* Der Abzug einer Tageskarte.

   Bis zum 04.09.2026 stand hier info.detail - das Satzband, das buildDayInfo
   neben der Struktur ein zweites Mal erzeugte. Es war der einzige Grund, aus
   dem das Satzband ueberhaupt noch existierte: in der Oberflaeche hatte es
   nur noch einen Leser.

   Jetzt die Struktur selbst, und die ist der staerkere Nachweis: sie traegt
   jede Zahl, die im Satzband stand, und zusaetzlich, an welcher Einheit sie
   haengt, zu welcher Tageszeit, mit welchem Timer und unter welchem Hinweis.
   Ein Fehler, der im Satzband nur die Wortstellung verschoben haette, faellt
   hier als verschobene Einheit auf. */
function dumpDays(th){
  const out = [];
  for(let d = 0; d < 18 * 7; d++){
    const date = new Date(start); date.setDate(date.getDate() + d);
    const info = D.buildDayInfo(plan, th, date, start);
    out.push('DAY ' + W.isoDayLocal(date) + ' | ' + info.type + ' | ' + info.art
      + ' | ' + info.title + ' | einheiten=' + j(info.einheiten)
      + ' | zusatz=' + j(info.zusatz) + ' | tagHinweise=' + j(info.tagHinweise)
      + ' | ersetzt=' + j(info.ersetzt || null)
      + ' | target=' + j(info.target));
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

  /* Eine zu neue Fassung wird abgelehnt und nicht geraten. Eine zu alte auch -
     die Migration hebt sie vorher an, und was sie nicht kennt, soll hier
     auflaufen statt halb weitergerechnet zu werden. */
  it('lehnt eine fremde Schemafassung ab', () => {
    const k = structuredClone(json);
    k.schemaVersion = 4;
    expect(planValidate(k)[0]).toContain('diese App liest Fassung 3');
  });

  it('lehnt eine Fassung ab, fuer die es keine Migration gibt', () => {
    const k = structuredClone(json);
    k.schemaVersion = 1;
    expect(planValidate(k)[0]).toContain('diese App liest Fassung 3');
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

  /* Ein an die Mittwochsfahrt gehaengter Reiz braucht eine Mittwochsfahrt.
     Steht er in einer Woche ohne Fahrt, gibt es nichts, woran er haengen
     koennte - und die Karte zeigte ihn trotzdem an.

     Der Reiz steht seit Fassung 5 in keiner Woche mehr; er ist an den
     Donnerstag gewandert. Die Pruefung bleibt: mi.extra ist eine Form, die
     die Datei anbieten darf, und eine Form ohne Pruefung ist eine Falle fuer
     den, der sie das naechste Mal benutzt. Der Reiz wird deshalb hier
     gebaut und nicht mehr aus einer Woche geholt. */
  it('meldet einen Erhaltungsreiz ohne Mittwochsfahrt', () => {
    const k = structuredClone(json);
    k.weeks[0].tage.mi.extra = {
      label:'Erhaltungsreiz', reps:6, workSeconds:30, restSeconds:30,
      effort:'zügig', restEffort:'locker rollen', note:'An die Mittwochsfahrt angehängt.'
    };
    expect(k.weeks[0].tage.mi.minutes).toBe(0);
    expect(planValidate(k).join(' ')).toContain('mi.extra');
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
      .toEqual({ hash: 'e8d1cf03c128d27d', len: 16049 });
  });
  it('Tageskarten unveraendert', () => {
    expect({ hash: sha(dumpDays(th)), len: dumpDays(th).length })
      .toEqual({ hash: 'd0869e04d715eb61', len: 183495 });
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
      const info = D.buildDayInfo(plan, th, date, start);
      out.push('D ' + W.isoDayLocal(date) + '|' + j(info.einheiten) + '|' + j(info.zusatz));
    }
    const t = out.join('\n');
    expect({ hash: sha(t), len: t.length }).toEqual({ hash: '3a3d477def5acc84', len: 164202 });
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

  /* Abschnitt 1, "Hoehenmeter - Einfuehrung", und die Reihen SAT_HM_* in
     Abschnitt 2: flach bis zum Test, ab Woche 5 ein Band von 100 hm, das je
     Belastungswoche um 50 hm steigt. In den Erholungswochen beginnt das Band
     halb so hoch wie in der letzten Belastungswoche; sie zaehlen nicht mit - die naechste
     Belastungswoche setzt auf der letzten auf, nicht auf der Erholung. */
  it('Hoehenmeter am Samstag stimmen mit Abschnitt 2 ueberein', () => {
    const soll = [0, 0, 0, 0, 150, 200, 100, 250, 300, 150, 350, 400, 200, 450, 500, 250];
    const baender = [];
    for(let w = 1; w <= 16; w++) baender.push(W.tagDaten(plan, w, 'sa').hoehenmeter);
    expect(baender.map(b => b.von)).toEqual(soll);
    baender.forEach((b, i) => expect(b.bis - b.von).toBe(i < 4 ? 0 : 100));

    let vorher = null;
    for(let w = 5; w <= 16; w++){
      const b = baender[w - 1];
      if(W.isRecoveryWeek(plan, w)){
        expect(b.von).toBe(vorher.von / 2);
        continue;
      }
      if(vorher !== null) expect(b.von - vorher.von).toBe(50);
      vorher = b;
    }
  });

  it('Samstagskarte nennt die Hoehenmeter der Woche', () => {
    const hm = w => D.buildDayInfo(plan, Z.NO_THRESHOLDS, W.addDays(start, (w - 1) * 7), start)
      .einheiten[0].kennzahlen.find(k => k.label === 'Höhenmeter');
    expect(hm(4).wert).toBe('flach');
    expect(hm(6).wert).toBe('200–300 hm');
    expect(hm(15).wert).toBe('500–600 hm');
  });

  it('Samstagskarte ohne Hoehenmeter im Plan nennt keine', () => {
    const k = structuredClone(json);
    delete k.weeks[4].tage.sa.hoehenmeter;
    expect(planValidate(k)).toEqual([]);
    const info = D.buildDayInfo(createPlan(k), Z.NO_THRESHOLDS, W.addDays(start, 28), start);
    expect(info.einheiten[0].kennzahlen.some(x => x.label === 'Höhenmeter')).toBe(false);
    expect(info.einheiten[0].hinweise).toEqual([]);
  });

  it('beanstandet Hoehenmeter, die kein Band sind', () => {
    const k = structuredClone(json);
    k.weeks[4].tage.sa.hoehenmeter = 200;
    expect(planValidate(k).join(' ')).toContain('tage.sa.hoehenmeter');
    k.weeks[4].tage.sa.hoehenmeter = { von: 300, bis: 200 };
    expect(planValidate(k).join(' ')).toContain('von 300 liegt über bis 200');
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

  /* Fassung 5, Abschnitt 9b: der Erhaltungsreiz haengt am Donnerstag und
     nicht mehr am Mittwoch. Beide Haelften stehen hier, weil eine allein die
     Verlegung nicht nachweist - ein Reiz an beiden Tagen waere die doppelte
     Dosis, ein Reiz an keinem der beiden die reizfreie Phase 3, die Abschnitt
     9b gerade abschafft. */
  it('kein Reiz mehr am Mittwoch', () => {
    const mit = [];
    for(let w = 1; w <= 16; w++){
      if(plan.weeks[W.weekIndex(plan, w)].tage.mi.extra) mit.push(w);
    }
    expect(mit).toEqual([]);
  });

  it('Erhaltungsreiz am Donnerstag der Woche 11 und 12: 3 × 3 min', () => {
    const mit = [];
    for(let w = 1; w <= 16; w++){
      const t = D.thursdayPlan(plan, w);
      if(t.kind === 'steps') mit.push(w);
    }
    expect(mit).toEqual([11, 12]);

    for(const w of mit){
      const t = D.thursdayPlan(plan, w);
      const hart = t.steps.filter(s => s.type === 'work');
      expect(hart.map(s => s.minutes)).toEqual([3, 3, 3]);
      expect(hart.every(s => s.zone === 'z5' && s.effort === '108–115 % FTP')).toBe(true);
      /* Die Pausen dazwischen, nicht danach: 3 x 3 min Belastung und 2 x 3 min
         Pause sind die 15 min, die der Trainingsplan nennt. */
      expect(D.schritteMinuten(t.steps.filter(s => s.type === 'work' || s.type === 'rest')))
        .toBe(15);
    }
    /* Die 15 min liegen innerhalb der Einheit - deshalb bleiben 70 und 75. */
    expect([D.thursdayPlan(plan, 11).minutes, D.thursdayPlan(plan, 12).minutes])
      .toEqual([70, 75]);
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

/* Ein Textbaustein, den die Pruefung als Pflicht erzwingt und den niemand
   liest, ist die schlechteste von drei Moeglichkeiten: er muss gepflegt
   werden, er kann veralten, und niemand merkt es. Am 04.09.2026 traf das auf
   drei der 33 Pflichttexte zu - "Kadenzpyramide" beschrieb eine
   Trainingsanweisung, die kein Nutzer je zu sehen bekam.

   Der Test liest den Quelltext und nicht die Ausgabe: ein Text kann in einem
   Zweig stehen, den der ausgelieferte Plan nie erreicht (thursdayNoTimer gilt
   nur in Phase 3), und waere ueber die Tageskarten allein nicht auffindbar. */
describe('Pflichttexte', () => {
  const quellen = (function sammle(dir, out = []){
    for(const name of fs.readdirSync(dir)){
      const p = dir + '/' + name;
      if(fs.statSync(p).isDirectory()) sammle(p, out);
      else if(/\.jsx?$/.test(name)) out.push(fs.readFileSync(p, 'utf8'));
    }
    return out;
  })(new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
    .filter(t => !t.includes('const PV_TEXT_KEYS'));

  it('jeder Pflichttext hat mindestens einen Leser im Quelltext', () => {
    const ohne = PV_TEXT_KEYS.filter(k =>
      !quellen.some(t => t.includes('texts.' + k) || t.includes('T.' + k)));
    expect(ohne).toEqual([]);
  });

  it('jeder Pflichttext steht in plan.json', () => {
    expect(PV_TEXT_KEYS.filter(k => typeof json.texts[k] !== 'string')).toEqual([]);
  });

  /* Anders herum ebenso: ein Text in der Datei, den die Pruefung nicht kennt,
     faellt bei einem Tippfehler im Schluessel stillschweigend durch. */
  it('kennt keinen Text in plan.json, der nicht Pflicht ist', () => {
    expect(Object.keys(json.texts).filter(k => PV_TEXT_KEYS.indexOf(k) < 0)).toEqual([]);
  });
});

/* Die beiden Mittwochstexte, die bis zum 04.09.2026 keinen Leser hatten.

   Der Test steht hier und nicht nur in den Pruefsummen: die Kadenzpyramide
   haengt als Hinweis an der Einheit, und Hinweise gehen in `detail` nicht
   ein. Ohne diese Zusicherung liesse sie sich wieder abhaengen, ohne dass
   etwas faellt - genau der Zustand, aus dem sie gerade kommt. */
describe('Mittwoch', () => {
  /* Ein Mittwoch mit Fahrt, ausserhalb jedes Testanlaufs: Woche 2 faehrt
     40 min, und der naechste Test liegt in Woche 4. */
  const mittwoch = D.buildDayInfo(plan, Z.NO_THRESHOLDS, W.dayFromIso('2026-08-26'), start);
  /* Und einer ohne Fahrt: Woche 1. Der Zirkel steht dort allein. */
  const ohneFahrt = D.buildDayInfo(plan, Z.NO_THRESHOLDS, W.dayFromIso('2026-08-19'), start);

  it('nennt die Kadenzpyramide an der Fahrt', () => {
    const fahrt = mittwoch.einheiten.find(e => e.art === 'z2');
    expect(fahrt.hinweise).toContain(json.texts.cadencePyramid);
  });

  it('nennt die Beinblock-Regel am Zirkel', () => {
    const zirkel = mittwoch.einheiten.find(e => e.art === 'rumpf');
    expect(zirkel.hinweise).toContain(json.texts.legWednesdayNote);
  });

  /* Der Satz stand vorher zweimal da: als "Kein Beinblock." im Code und als
     laengere Regel in der Datei. Jetzt nur noch aus der Datei - und der Code
     baut ueberhaupt keinen deutschen Satz mehr daneben. */
  it('baut die Regel nicht mehr im Code nach', () => {
    const alleTexte = JSON.stringify(mittwoch.einheiten);
    expect(alleTexte).not.toContain('Kein Beinblock.');
    expect(alleTexte).toContain(json.texts.legWednesdayNote);
  });

  /* Ohne Fahrt steht der Zirkel allein - die Regel haengt an ihm und darf
     dort nicht wegfallen. */
  it('nennt die Beinblock-Regel auch am Mittwoch ohne Fahrt', () => {
    expect(ohneFahrt.einheiten.length).toBe(1);
    expect(ohneFahrt.hinweise).toContain(json.texts.legWednesdayNote);
    expect(ohneFahrt.hinweise).toContain(json.texts.wednesdayNoRide);
  });
});

/* ---- Warum gerade diese Zonen gelten ----

   Die Zonenkarte zeigte bis zum 10.09.2026 nur das Ergebnis. Wer am Testtag
   seine LTHR eintrug, sah die Pulsbaender unveraendert stehen, waehrend die
   Wattzonen aus der frisch gemessenen FTP sofort erschienen - und schloss
   daraus, die Zahlen stuenden fest im Code. Der Grund ist jetzt eine eigene
   Auskunft und wird hier geprueft, nicht nur angezeigt. */
describe('Grund fuer das Zonenmodell', () => {
  const mitTest = { ftp: 212, lthr: 163, hrmax: 187 };
  const ab = plan.cogganFromWeek;

  it('nennt Coggan, sobald LTHR und Woche zusammenkommen', () => {
    const g = Z.zonenGrund(plan, mitTest, ab);
    expect(g).toEqual({ coggan: true, grund: 'coggan', abWoche: null, quelle: null });
    expect(Z.hrBands(plan, mitTest, ab)).not.toBe(plan.hrTransition);
  });

  /* Die Herkunft der LTHR reicht durch: die Baender aendert sie nicht, ihre
     Belastbarkeit schon. */
  it('reicht die Herkunft der LTHR mit durch', () => {
    const gemessen = { ...mitTest, quellen: { lthr: { art:'test', tag:'2026-09-10' } } };
    expect(Z.zonenGrund(plan, gemessen, ab).quelle).toEqual({ art:'test', tag:'2026-09-10' });
    expect(Z.zonenGrund(plan, gemessen, ab - 1).quelle).toEqual({ art:'test', tag:'2026-09-10' });

    const getippt = { ...mitTest, quellen: { lthr: { art:'hand' } } };
    expect(Z.zonenGrund(plan, getippt, ab).quelle).toEqual({ art:'hand' });
    /* Ohne Vermerk bleibt es bei null - geraten wird nicht. */
    expect(Z.zonenGrund(plan, mitTest, ab).quelle).toBe(null);
  });

  /* Der Fall, der die Frage ausgeloest hat: gemessen ist, gerechnet wird
     spaeter. Der Test misst die Baender des Folgeblocks. */
  it('unterscheidet "zu frueh" von "kein Test"', () => {
    const frueh = Z.zonenGrund(plan, mitTest, ab - 1);
    expect(frueh.coggan).toBe(false);
    expect(frueh.grund).toBe('zu-frueh');
    expect(frueh.abWoche).toBe(ab);

    const ohne = Z.zonenGrund(plan, Z.NO_THRESHOLDS, ab + 3);
    expect(ohne.grund).toBe('kein-test');
    /* Ohne Messung gibt es kein Datum zu nennen - es faengt nie von selbst an. */
    expect(ohne.abWoche).toBe(null);
  });

  it('haelt in beiden Faellen die Uebergangsbaender', () => {
    expect(Z.hrBands(plan, mitTest, ab - 1)).toBe(plan.hrTransition);
    expect(Z.hrBands(plan, Z.NO_THRESHOLDS, ab + 3)).toBe(plan.hrTransition);
  });

  /* "Ab Woche 5" beantwortet "wann?" nicht, solange man nachzaehlen muss. */
  it('belegt die Wochennummer mit einem Datum', () => {
    expect(W.weekStartFor(1, start).getTime()).toBe(start.getTime());
    expect(W.weekNumberFor(W.weekStartFor(ab, start), start)).toBe(ab);
    /* Der erste Tag der Woche und nicht irgendeiner darin. */
    expect(W.weekNumberFor(W.addDays(W.weekStartFor(ab, start), -1), start)).toBe(ab - 1);
  });
});

/* ---- Woher ein Schwellenwert kommt ----

   Die App wusste es bis zum 10.09.2026 nicht und behauptete trotzdem etwas:
   die Zonenkarte schrieb "aus Test uebernommen", sobald ueberhaupt eine LTHR
   dastand, auch bei einer von Hand getippten. Beide Wege gelten gleich - was
   zuletzt gesetzt wurde, traegt die Baender -, aber die Anzeige muss sie
   auseinanderhalten koennen. */
describe('Herkunft der Schwellenwerte', () => {
  const leer = { ftp:null, lthr:null, hrmax:null, quellen:{} };
  const TEST_TAG = '2026-09-10';
  /* Zwei Tage nach dem Test von Hand gesetzt - der Fall vom 12.09.2026. */
  const DANACH = '2026-09-12T18:04:00.000Z';
  const DAVOR  = '2026-09-08T07:30:00.000Z';

  it('markiert nach einem Test nur, was der Test misst', () => {
    const vonHand = Z.schwellenVonHand(leer, { ftp:null, lthr:null, hrmax:186 }, DAVOR);
    const nachTest = Z.schwellenAusTest(vonHand, { ftp:219, lthr:168 }, TEST_TAG);

    expect(nachTest.ftp).toBe(219);
    expect(nachTest.lthr).toBe(168);
    expect(Z.quelleVon(nachTest, 'ftp')).toEqual({ art:'test', tag:TEST_TAG });
    expect(Z.quelleVon(nachTest, 'lthr')).toEqual({ art:'test', tag:TEST_TAG });
    /* Die HFmax misst kein Schwellentest - Wert und Vermerk bleiben. */
    expect(nachTest.hrmax).toBe(186);
    expect(Z.quelleVon(nachTest, 'hrmax')).toEqual({ art:'hand', seit:DAVOR });
  });

  /* Ohne aufgezeichneten Puls misst der Test keine LTHR. Der bisherige Wert
     bleibt stehen, samt Herkunft - er ist nicht in diesem Test entstanden. */
  it('laesst einen nicht gemessenen Wert unangetastet', () => {
    const vorher = Z.schwellenVonHand(leer, { ftp:null, lthr:158, hrmax:null }, DAVOR);
    const nachTest = Z.schwellenAusTest(vorher, { ftp:219, lthr:null }, TEST_TAG);

    expect(nachTest.ftp).toBe(219);
    expect(Z.quelleVon(nachTest, 'ftp').art).toBe('test');
    expect(nachTest.lthr).toBe(158);
    expect(Z.quelleVon(nachTest, 'lthr').art).toBe('hand');
  });

  /* Eine Wiederholungsmessung ist eine Messung, auch wenn dieselbe Zahl
     herauskommt - sonst truege der zweite Test den Vermerk des ersten. */
  it('markiert eine Messung auch bei unveraenderter Zahl', () => {
    const ersterTest = Z.schwellenAusTest(leer, { ftp:219, lthr:168 }, TEST_TAG);
    const zweiterTest = Z.schwellenAusTest(ersterTest, { ftp:219, lthr:168 }, '2026-10-22');

    expect(Z.quelleVon(zweiterTest, 'lthr').tag).toBe('2026-10-22');
  });

  /* Wer nur die HFmax nachtraegt, soll damit nicht die gemessene FTP zu einer
     getippten machen. */
  it('markiert von Hand nur, was sich geaendert hat', () => {
    const nachTest = Z.schwellenAusTest(leer, { ftp:219, lthr:168 }, TEST_TAG);
    const mitHfmax = Z.schwellenVonHand(nachTest, { ftp:219, lthr:168, hrmax:186 }, DANACH);

    expect(Z.quelleVon(mitHfmax, 'ftp').art).toBe('test');
    expect(Z.quelleVon(mitHfmax, 'lthr').art).toBe('test');
    expect(Z.quelleVon(mitHfmax, 'hrmax')).toEqual({ art:'hand', seit:DANACH });

    /* Die von Hand korrigierte LTHR gilt und heisst dann auch so. */
    const korrigiert = Z.schwellenVonHand(mitHfmax, { ftp:219, lthr:171, hrmax:186 }, DANACH);
    expect(korrigiert.lthr).toBe(171);
    expect(Z.quelleVon(korrigiert, 'lthr')).toEqual({ art:'hand', seit:DANACH });
    expect(Z.quelleVon(korrigiert, 'ftp').art).toBe('test');
  });

  /* ---- Wer gewinnt, wenn beide denselben Wert setzen ----

     Der Fall, der es noetig gemacht hat: der Test vom 10.09.2026 ergab als
     Ø-Puls 152 bpm. Coggan daraus legt Z2 auf 103-126 bpm, und eine
     Grundlagenfahrt mit 132 bpm liegt darin in Z3 - daher der Fehlalarm zur
     Ausfahrt vom 12.09. Die Schwellen-HF wurde deshalb am 12.09. von Hand auf
     163 gesetzt. Ein zwei Tage spaeter berichtigter Testeintrag haette die 152
     still zurueckgeholt. */
  describe('Eingabe von Hand gegen Messwert', () => {
    const nachTest = Z.schwellenAusTest(leer, { ftp:192, lthr:152 }, TEST_TAG);
    const vonHand = Z.schwellenVonHand(nachTest,
      { ftp:192, lthr:163, hrmax:180 }, DANACH);

    it('haelt die spaetere Eingabe gegen ein Nachspeichern desselben Tests', () => {
      const nochmal = Z.schwellenAusTest(vonHand, { ftp:192, lthr:152 }, TEST_TAG);

      expect(nochmal.lthr).toBe(163);
      expect(Z.quelleVon(nochmal, 'lthr')).toEqual({ art:'hand', seit:DANACH });
      expect(Z.ueberstimmteFelder(vonHand, { ftp:192, lthr:152 }, TEST_TAG)).toContain('lthr');
      /* Die FTP war unveraendert getippt und gilt damit ebenfalls von Hand -
         der Messwert ist derselbe, also aendert sich nichts als der Vermerk. */
      expect(nochmal.ftp).toBe(192);
    });

    it('laesst einen spaeteren Test gewinnen', () => {
      const retest = Z.schwellenAusTest(vonHand, { ftp:205, lthr:166 }, '2026-10-22');

      expect(retest.lthr).toBe(166);
      expect(Z.quelleVon(retest, 'lthr')).toEqual({ art:'test', tag:'2026-10-22' });
      expect(Z.ueberstimmteFelder(vonHand, { ftp:205, lthr:166 }, '2026-10-22')).toEqual([]);
    });

    it('laesst den Test gewinnen, wenn die Eingabe aelter ist', () => {
      const frueh = Z.schwellenVonHand(leer, { ftp:null, lthr:170, hrmax:null }, DAVOR);
      const danach = Z.schwellenAusTest(frueh, { ftp:192, lthr:152 }, TEST_TAG);

      expect(danach.lthr).toBe(152);
      expect(Z.quelleVon(danach, 'lthr').art).toBe('test');
    });

    /* Eine Eingabe am Testtag selbst liegt nach der Fahrt - an diesem Tag
       wurde vormittags gemessen und abends eingetragen. Der Zeitstempel ist
       laenger als der Tag, ISO vergleicht sich richtig. */
    it('zaehlt eine Eingabe am Testtag als die spaetere', () => {
      const amTag = Z.schwellenVonHand(nachTest,
        { ftp:192, lthr:163, hrmax:null }, TEST_TAG + 'T19:00:00.000Z');
      const nochmal = Z.schwellenAusTest(amTag, { ftp:192, lthr:152 }, TEST_TAG);
      expect(nochmal.lthr).toBe(163);
    });

    /* Ohne vermerkten Zeitpunkt - Eingaben von vor dem 12.09.2026 - gewinnt
       der Test wie bisher. Eine Eingabe, von der niemand weiss, wann sie war,
       kann eine Messung nicht ueberstimmen. */
    it('laesst den Test gewinnen, wenn die Eingabe keinen Zeitpunkt traegt', () => {
      const ohneZeit = { ftp:192, lthr:163, hrmax:180, quellen:{ lthr:{ art:'hand' } } };
      expect(Z.handNachTest(ohneZeit, 'lthr', TEST_TAG)).toBe(false);
      expect(Z.schwellenAusTest(ohneZeit, { ftp:192, lthr:152 }, TEST_TAG).lthr).toBe(152);
    });
  });

  it('vergisst die Herkunft eines geleerten Wertes', () => {
    const nachTest = Z.schwellenAusTest(leer, { ftp:219, lthr:168 }, TEST_TAG);
    const ohneFtp = Z.schwellenVonHand(nachTest, { ftp:null, lthr:168, hrmax:null }, DANACH);

    expect(ohneFtp.ftp).toBe(null);
    expect(Z.quelleVon(ohneFtp, 'ftp')).toBe(null);
    expect(Z.quelleVon(ohneFtp, 'lthr').art).toBe('test');
  });
});

/* ---- Zonen aus der Leistung, ab Woche 5 ----

   Bis zum 12.09.2026 rechnete die Auswertung jede Zonenverteilung aus dem
   Pulsstrom, und bis Woche 5 gegen die Uebergangsbaender. Die
   Samstagsausfahrt vom 12.09. bekam dadurch eine Warnung "zu hart": 31 % der
   Zeit ueber Z2 - gemessen gegen ein Z2, das bei 135 bpm endet und laut
   Trainingsplan nur bis zum Testtag galt. Bei 139 W Ø gegen ein Z2 von
   106-144 W und -0,9 % Entkopplung war die Fahrt eine Grundlagenfahrt. */
describe('Leistungsbaender', () => {
  const th = { ftp: 192, lthr: 163, hrmax: 180 };

  it('schliesst die Luecken der Coggan-Definition', () => {
    const b = Z.powerBands(plan, th);
    /* Jedes Band reicht bis zum Beginn des naechsten - sonst faellt ein
       Sample zwischen 105,6 und 107,5 W aus der Gesamtzeit. */
    for(let i = 1; i < b.length; i++) expect(b[i].min).toBe(b[i - 1].max);
    expect(b[0].min).toBe(0);
  });

  it('laesst das oberste Band oben offen', () => {
    const b = Z.powerBands(plan, th);
    const z5 = b[b.length - 1];
    expect(z5.key).toBe('z5');
    /* maxFactor 1,2 ist eine Angabe fuer die Tabelle. Ein Sprint mit 130 %
       FTP gehoert in Z5 und nicht in keine Zone. */
    expect(z5.max).toBeGreaterThan(Math.round(192 * 1.2));
  });

  it('setzt die Grenzen aus FTP und plan.json', () => {
    const b = Z.powerBands(plan, th);
    const z2 = b.find(x => x.key === 'z2');
    /* 56 % von 192 W. Die Obergrenze ist der Beginn von Z3 (76 %). */
    expect(z2.min).toBe(Math.round(192 * 0.56));
    expect(z2.max).toBe(Math.round(192 * 0.76));
    /* Die Ø-Leistung der Fahrt vom 12.09. liegt darin. */
    expect(139).toBeGreaterThanOrEqual(z2.min);
    expect(139).toBeLessThan(z2.max);
  });

  it('bleibt ohne FTP leer statt zu raten', () => {
    expect(Z.powerBands(plan, { ftp: null, lthr: 163 })).toBe(null);
  });
});

describe('Welcher Massstab fuer eine Fahrt gilt', () => {
  const voll = { ftp: 192, lthr: 163, hrmax: 180 };
  const ab = plan.cogganFromWeek;

  it('rechnet ab der Coggan-Woche nach Leistung', () => {
    expect(Z.zonenQuelle(plan, voll, ab, true)).toBe('watt');
    expect(Z.zonenBaender(plan, voll, ab, true).bands)
      .toEqual(Z.powerBands(plan, voll));
  });

  /* Das Trekkingrad hat keinen Leistungsmesser. Seine Fahrten bleiben
     auswertbar - aber gegen die neuen Baender, nicht gegen die alten. */
  it('faellt ohne Leistung auf die Coggan-Pulsbaender zurueck', () => {
    expect(Z.zonenQuelle(plan, voll, ab, false)).toBe('hf-coggan');
    expect(Z.zonenBaender(plan, voll, ab, false).bands)
      .not.toBe(plan.hrTransition);
  });

  it('haelt die Wochen 1 bis 4 bei den Uebergangsbaendern', () => {
    expect(Z.zonenQuelle(plan, voll, ab - 1, true)).toBe('hf-uebergang');
    expect(Z.zonenBaender(plan, voll, ab - 1, true).bands).toBe(plan.hrTransition);
  });

  /* Ohne gemessene Zahlen gibt es nichts Besseres. Die Auswertung sagt das
     dann auch - siehe zonenQuelleNote. */
  it('bleibt ohne Schwellenwerte bei den Uebergangsbaendern', () => {
    expect(Z.zonenQuelle(plan, Z.NO_THRESHOLDS, ab, true)).toBe('hf-uebergang');
    expect(Z.zonenQuelle(plan, { ftp: 192, lthr: null }, ab, false)).toBe('hf-uebergang');
    /* FTP ohne LTHR und mit Leistungsstrom reicht aber. */
    expect(Z.zonenQuelle(plan, { ftp: 192, lthr: null }, ab, true)).toBe('watt');
  });
});

describe('Leistungsstrom erkennen', () => {
  it('verlangt echte Werte und nicht bloss ein Feld', () => {
    expect(Z.hatLeistungsstrom(new Array(200).fill(0))).toBe(false);
    expect(Z.hatLeistungsstrom(new Array(200).fill(null))).toBe(false);
    expect(Z.hatLeistungsstrom(new Array(200).fill(150))).toBe(true);
  });

  it('verwirft einen zu kurzen oder fehlenden Strom', () => {
    expect(Z.hatLeistungsstrom(new Array(10).fill(150))).toBe(false);
    expect(Z.hatLeistungsstrom(null)).toBe(false);
  });

  /* Ein Ausfall auf halber Strecke ist kein Leistungsmesser. */
  it('verwirft einen ueberwiegend leeren Strom', () => {
    const luecken = new Array(200).fill(null);
    for(let i = 0; i < 40; i++) luecken[i] = 150;
    expect(Z.hatLeistungsstrom(luecken)).toBe(false);
    for(let i = 40; i < 80; i++) luecken[i] = 150;
    expect(Z.hatLeistungsstrom(luecken)).toBe(true);
  });
});

describe('Zonenzeit aus der Leistung', () => {
  const th = { ftp: 192, lthr: 163, hrmax: 180 };
  const bands = Z.powerBands(plan, th);
  const zeit = n => Array.from({ length: n }, (_, i) => i);
  const opts = { fensterSek: Z.WATT_FENSTER_SEK, rollenUnter: Z.ROLLEN_WATT };

  /* Der Kern der Sache: roher Leistungsstrom ist kein Intensitaetsmass.
     Wechselt eine gleichmaessig gefahrene Fahrt sekuendlich zwischen Rollen
     und 280 W, liegt der Schnitt bei 140 W - mitten in Z2 -, sample-fuer-
     sample aber kein einziger Wert darin. */
  it('mittelt ueber 30 s, bevor gezaehlt wird', () => {
    const n = 1200;
    const werte = Array.from({ length: n }, (_, i) => (i % 2 ? 280 : 0));

    const roh = Z.zoneSeconds(bands, werte, zeit(n), n, { rollenUnter: Z.ROLLEN_WATT });
    expect(roh.z2 || 0).toBe(0);

    const glatt = Z.zoneSeconds(bands, werte, zeit(n), n, opts);
    expect(glatt.z2 / glatt._total).toBeGreaterThan(0.95);
  });

  it('zaehlt Rollzeit nicht als Zone', () => {
    const n = 1200;
    /* Zehn Minuten treten, zehn Minuten rollen. */
    const werte = Array.from({ length: n }, (_, i) => (i < 600 ? 130 : 0));
    const z = Z.zoneSeconds(bands, werte, zeit(n), n, { rollenUnter: Z.ROLLEN_WATT });

    expect(z._rollen).toBeGreaterThan(500);
    expect(z._total).toBeLessThan(700);
    /* Die Anteile gelten auf die getretene Zeit - sonst waere diese Fahrt zur
       Haelfte "unter Z2", ohne dass zu locker gefahren wurde. */
    expect(z.z2 / z._total).toBeGreaterThan(0.95);
  });

  it('laesst den Pulsstrom unveraendert zaehlen', () => {
    const n = 600;
    const werte = new Array(n).fill(130);
    const ohne = Z.zoneSeconds(plan.hrTransition, werte, zeit(n), n);
    const mitOpts = Z.zoneSeconds(plan.hrTransition, werte, zeit(n), n, null);
    expect(ohne.z2).toBe(mitOpts.z2);
    /* Ohne rollenUnter wird nichts als Rollen weggerechnet. */
    expect(ohne._rollen).toBe(0);
  });

  /* Die Fahrt vom 12.09.2026, nachgebaut: 147 min, Ø 139 W, Ø 132 bpm,
     Entkopplung -0,9 %. Sie bekam 31 % "ueber Z2" - und hier steht, woran das
     lag.

     Der Protokollwert des Tests war ein Ø-Puls von 152 bpm ueber die zwanzig
     Minuten, und genau der landete als LTHR in den Schwellenwerten. Coggan
     aus 152 legt Z2 auf 103-126 bpm; ein Grundlagenpuls von 132 liegt damit
     in Z3. Nicht die Fahrt war zu hart, die Bezugszahl war zu niedrig.

     Mit der Schwellen-HF von 163 reicht Z2 bis 135 und dieselbe Fahrt ist
     eine Grundlagenfahrt. Nach Leistung gemessen ist sie es ohnehin - und das
     ist der Punkt: der Massstab haengt dann nicht mehr an einer einzigen Zahl,
     die man richtig raten muss. */
  const ritt = n => ({
    /* Schneller Tretschlag, den dreissig Sekunden wegmitteln, darunter die
       langsame Welle des Gelaendes, die bleibt. So sieht Strassenleistung
       aus - nicht wie eine Zahl mit Rauschen. */
    watt: Array.from({ length: n }, (_, i) =>
      Math.max(0, Math.round(139 + 90 * Math.sin(i / 1.7) + 60 * Math.sin(i / 3.1)
                             + 12 * Math.sin(i / 600)))),
    /* Ø 132 bpm, p90 bei 136 - die Werte der Fahrt vom 12.09. */
    puls: Array.from({ length: n }, (_, i) =>
      Math.round(132 + 3 * Math.sin(i / 300) + 2 * Math.sin(i / 47)))
  });
  const ueberZ2 = z => (z.z3 + z.z4 + z.z5) / z._total;

  it('zeigt, dass die zu niedrige LTHR den Fehlalarm erzeugt', () => {
    const n = 147 * 60;
    const { puls } = ritt(n);
    const ausTest = Z.zonenBaender(plan, { ftp: 192, lthr: 152 }, 5, false).bands;
    const vonHand = Z.zonenBaender(plan, { ftp: 192, lthr: 163 }, 5, false).bands;

    /* Mit 152 liegt praktisch die ganze Fahrt "ueber Z2" - Z2 endet bei
       126 bpm, gefahren wurden 132. */
    const mit152 = ueberZ2(Z.zoneSeconds(ausTest, puls, zeit(n), n));
    const mit163 = ueberZ2(Z.zoneSeconds(vonHand, puls, zeit(n), n));
    expect(mit152).toBeGreaterThan(0.9);
    expect(mit163).toBeLessThan(mit152 / 3);
  });

  /* Und hier steht, was die Umstellung auf Watt allein NICHT leistet.

     Die Fahrt lag bei 139 W Ø, und Coggan-Z2 endet bei 76 % FTP, also
     146 W. Der Schnitt liegt damit sieben Watt unter der Bandgrenze - das
     ist das obere Ende von Z2, nicht seine Mitte. Eine zweieinhalb Stunden
     lange Fahrt wandert um mehr als sieben Watt, gleichmaessig gefahren und
     ueber dreissig Sekunden gemittelt: ein knappes Drittel der Zeit liegt
     rechnerisch in Z3, und daran aendert kein Massstab etwas.

     Der Leistungsstrom ist der richtige Massstab - er haengt nicht an einer
     einzigen geratenen Pulszahl -, aber die Grenze von 20 % "ueber Z2"
     spricht eine Fahrt am oberen Rand von Z2 weiter schuldig. Was sie
     freispricht, ist die Entkopplung; siehe abgleich.test.js. */
  it('spricht die Ausfahrt nach Leistung nicht allein frei', () => {
    const n = 147 * 60;
    const { watt } = ritt(n);
    const z = Z.zoneSeconds(bands, watt, zeit(n), n, opts);

    /* Der Schwerpunkt liegt in Z2 - die Fahrt ist als Grundlagenfahrt
       erkennbar. */
    expect(z.z2 / z._total).toBeGreaterThan(0.6);
    expect(z.z2).toBeGreaterThan(z.z3 + z.z4 + z.z5);
    /* Und trotzdem reisst sie die 20-Prozent-Grenze. */
    expect(ueberZ2(z)).toBeGreaterThan(0.2);
  });

  /* Eine Fahrt in der Mitte von Z2 - 125 W bei FTP 192, also 65 % - bleibt
     dagegen auch nach Zaehlung klar drin. Die Grenze taugt, nur nicht fuer
     einen Schnitt zwei Prozent unter der Bandkante. */
  it('bestaetigt eine Fahrt in der Mitte von Z2', () => {
    const n = 147 * 60;
    const werte = Array.from({ length: n }, (_, i) =>
      Math.max(0, Math.round(125 + 90 * Math.sin(i / 1.7) + 60 * Math.sin(i / 3.1)
                             + 10 * Math.sin(i / 600))));
    const z = Z.zoneSeconds(bands, werte, zeit(n), n, opts);
    expect(ueberZ2(z)).toBeLessThan(0.05);
  });
});
