/* Die Saetze, mit denen die App eine Einheit bewertet.

   Standen bis zum 29.08.2026 mitten im Verzweigungsbaum von analysis.js -
   siebzehn Zeilen ueber 140 Zeichen, die laengste 244, durchgehend als
   row.notes.push({kind:'bad', text:'…langer deutscher Satz…'}). Der
   Kontrollfluss verschwand zwischen den Texten: man sah nicht mehr, welche
   Faelle es gibt, weil zwischen zwei if-Zweigen jeweils drei Zeilen Prosa
   standen.

   Hier stehen sie als benannte Funktionen. Der Gewinn ist doppelt: der Rumpf
   von vergleicheTag liest sich wieder als Fallunterscheidung, und die Saetze
   stehen beieinander, wo man sie als Ganzes redigieren kann - vorher war der
   Ton ueber vierhundert Zeilen verstreut.

   Nicht zu verwechseln mit plan.texts: das sind die Saetze aus dem
   Trainingsplan. Diese hier sind die Bewertung der App und gehoeren deshalb
   in den Code, genau wie die Schwellen in analysis.js.

   Rein: kein DOM, keine Uhr. */

import { FTP_FAKTOR } from './test.js';

export const T = {

  /* ---- Ruhetag und optionale Fahrten ---- */

  ruhetagGefahren: dauer =>
    'Ruhetag, trotzdem ' + dauer + ' gefahren. Einmal ist kein Problem, regelmäßig '
    + 'frisst es die Erholung, die den Donnerstag trägt.',

  optionaleFahrt: (ist, km, sollMin) => sollMin
    ? 'Optionale Fahrt: ' + ist + ' min' + km + ' gefahren, vorgesehen sind ' + sollMin + ' min Z1.'
    : 'Nicht eingeplante Fahrt: ' + ist + ' min' + km + '.',

  lockerZuHart: hart =>
    hart + ' % der Zeit über Z2. Für eine locker gemeinte Fahrt zu hart – sie soll '
    + 'Erholung bringen, nicht kosten.',

  lockerPasst: locker =>
    locker + ' % locker (bis Z2). Passt für eine Erholungsfahrt.',

  /* ---- Rumpfzirkel ---- */

  rumpfNichtErfasst:
    'Keine Krafteinheit gefunden. Rumpftraining landet nur in intervals.icu, wenn du es '
    + 'auf der Uhr als Aktivität aufzeichnest – oder du nutzt den Rumpf-Timer der App, '
    + 'der protokolliert von selbst.',

  rumpfKomplett: soll => 'Alle ' + soll + ' Runden komplett durchgezogen.',

  rumpfTeilweise: (voll, soll, fertig, letzte) =>
    'Rumpf-Timer: ' + voll + ' von ' + soll + ' Runden'
    + (fertig ? '' : ' – Einheit vorzeitig beendet')
    + (letzte ? ', zuletzt ' + letzte.name + ' in Runde ' + letzte.round : '') + '.',

  rumpfUebersprungen: (anzahl, liste) =>
    anzahl + (anzahl === 1 ? ' Satz' : ' Sätze') + ' vorzeitig weitergedrückt: ' + liste + '.',

  rumpfMehrfach: anzahl =>
    anzahl + ' Einheiten an diesem Tag protokolliert, bewertet ist die letzte.',

  rumpfOhneSchaetzung: min =>
    'Krafteinheit aufgezeichnet: ' + min + ' min. Die Dauer passt zu keiner Rundenzahl '
    + 'dieses Zirkels, daher keine Schätzung.',

  rumpfGeschaetztOk: (min, est, soll) =>
    'Krafteinheit aufgezeichnet: ' + min + ' min, geschätzt etwa ' + est + ' von ' + soll + ' Runden.',

  rumpfGeschaetztKurz: (min, est, soll, sollMin) =>
    'Krafteinheit aufgezeichnet: ' + min + ' min, geschätzt etwa ' + est + ' von ' + soll
    + ' Runden – geplant waren ' + sollMin + ' min. Geschätzt aus der Dauer, weil '
    + 'intervals.icu keine Sätze speichert.',

  /* ---- Beinblock ---- */

  beineNichtProtokolliert:
    'Beinblock nicht protokolliert. Er steht im Rumpf-Tab unter „Beinblock“ – ohne Eintrag '
    + 'ist er die einzige Trainingskomponente ohne jede Erfassung.',

  beineKomplett: (voll, soll, saetze) =>
    'Beinblock: ' + voll + ' von ' + soll + ' Runden komplett, ' + saetze + ' Sätze.',

  beineTeilweise: (voll, soll, saetze) =>
    'Beinblock: ' + voll + ' von ' + soll + ' Runden komplett (' + saetze + ' Sätze protokolliert).',

  beineOhneWerte: 'Beinblock angelegt, aber keine Wiederholungen eingetragen.',

  beineUnterZiel: (anzahl, liste) =>
    anzahl + (anzahl === 1 ? ' Satz' : ' Sätze') + ' unter dem Wiederholungsziel: ' + liste
    + '. Im ersten Block zählt Bewegungsqualität, nicht Maximalkraft – das ist eine '
    + 'Beobachtung, kein Fehler.',

  /* ---- Arbeitsweg ---- */

  pendelZuHart: ueber =>
    ueber + ' % der Zeit über Z2. Auf dem Arbeitsweg heißt das meist Zeitdruck – der '
    + 'Ankunftspuffer von 15 min ist Teil des Trainings, nicht Komfort.',

  pendelPasst: (inZ2, ueber) =>
    inZ2 + ' % in Z2, ' + ueber + ' % darüber. Passt für den Arbeitsweg.',

  mittwochFehlt: soll =>
    'Keine Fahrt an diesem Tag. Vorgesehen sind mindestens ' + soll + ' min Z2 auf dem '
    + 'Arbeitsweg. Ersatzlos streichen ist in Ordnung – der Mittwoch ist der kleinste '
    + 'Beitrag der Woche.',

  mittwochKurz: (ist, soll) =>
    ist + ' min gefahren, Untergrenze sind ' + soll + ' min.',

  mittwochToleranz: (ist, soll) =>
    ist + ' min gefahren statt ' + soll + ' min – innerhalb der Toleranz, gilt als eingehalten.',

  mittwochErfuellt: (ist, soll) =>
    ist + ' min gefahren, Untergrenze ' + soll + ' min – erfüllt. Länger ist kein Planverstoß.',

  /* ---- Radeinheit mit messbarem Soll ---- */

  testFehlt:
    'Kein Test gefunden. Ein verschobener Test ist kein Problem – ein Test unter '
    + 'schlechten Bedingungen verzerrt die Zonen für acht Wochen.',

  fahrtFehlt: 'Keine Fahrt an diesem Tag gefunden.',

  dauerKurz: pct => pct + ' % kürzer als geplant.',

  dauerLang: (pct, deutlich) =>
    pct + ' % länger als geplant – gilt als eingehalten.'
    + (deutlich ? ' Dauerhaft deutlich mehr Umfang gehört in die Planprogression, '
                + 'nicht in einzelne Fahrten.' : ''),

  /* Der Faktor kommt aus test.js und steht nicht noch einmal als Ziffernfolge
     im Satz: er stand bis zum 04.09.2026 an vier Stellen im Code, und drei
     davon haetten eine Aenderung nicht mitbekommen.

     Der Verweis auf den Tab „Heute" ist mit weg - den Tab gibt es seit dem
     Umbau nicht mehr. Die Schwellenwerte stehen unter „Zonen", der Test hat
     seinen eigenen Bereich mit einer Ergebnisansicht. */
  testtag:
    'Testtag: Ø-Watt der 20 min notieren, FTP = Ø-Watt × '
    + String(FTP_FAKTOR).replace('.', ',') + ', LTHR = Ø-Puls der 20 min. '
    + 'Beides im Bereich „Schwellentest“ unter „Ergebnis“ eintragen und in '
    + 'intervals.icu übernehmen, danach Power Zones und HR Zones auf Coggan.',

  /* ---- Die Fahrten eines Tages nacheinander ----

     Der Tag bleibt die Einheit, in der der Plan seine Vorgabe macht - aber die
     Summe des Tages entsteht in einer Reihenfolge, und die gehoert dazugesagt.
     Wer zweimal denselben Arbeitsweg faehrt, will lesen, dass die Vorgabe schon
     nach dem Hinweg stand und der Rueckweg den Tag darueber hinaus getragen
     hat. Bis zum 04.09.2026 stand dort eine einzige Zahl fuer beide Fahrten
     zusammen, und die las sich als "alles gut". */

  fahrtLaufstand: (nr, ist, kum, soll, minimum) => {
    const kopf = nr + '. Fahrt: ' + ist + ' min.';
    if(!soll) return kopf;
    const bezug = minimum ? 'min Untergrenze' : 'min Tagesvorgabe';
    if(kum < soll) return kopf + ' Damit stehen ' + kum + ' von ' + soll + ' ' + bezug
      + ' – es fehlen noch ' + (soll - kum) + ' min.';
    if(kum > soll) return kopf + ' Damit stehen ' + kum + ' von ' + soll + ' ' + bezug
      + ' – ' + (kum - soll) + ' min darüber.';
    return kopf + ' Damit stehen ' + kum + ' von ' + soll + ' ' + bezug + '.';
  },

  /* Die Ueberschreitung haengt an der Fahrt, die sie ausloest - nicht am Tag.
     "80 min gegen 40 min" sagt nicht, welche der beiden Fahrten den Tag
     darueber getragen hat; genau das ist aber die Frage, wenn man den naechsten
     Mittwoch anders einteilen will. */
  fahrtUeberZiel: (mehrere, kum, soll, minimum) =>
    (mehrere ? 'Diese Fahrt trägt den Tag über das Ziel: '
             : 'Der Tag liegt über dem Ziel: ')
    + kum + ' min gegen ' + soll + ' min ' + (minimum ? 'Untergrenze' : 'Vorgabe')
    + ' (+' + Math.round((kum - soll) / soll * 100) + ' %).'
    + (minimum
      ? ' Kein Planverstoß – aber die Minuten zählen gegen den Wochendeckel, und '
        + 'die Grundlage kommt aus der Wochensumme, nicht aus einzelnen langen Tagen.'
      : ''),

  umfangFazit: (kum, soll) =>
    'Die Einheit passt zum Plan, der Umfang liegt aber deutlich darüber: '
    + kum + ' min gegen ' + soll + ' min.',

  /* ---- Wochenumfang ---- */

  deckelUeberschritten: (ist, plan, cap) =>
    ist + ' min gefahren, der Deckel liegt bei ' + cap + ' min (Plan ' + plan + ' min). '
    + 'In der Folgewoche kürzen, nicht kompensieren.',

  deckelHinweis: cap =>
    'Obergrenze dieser Woche: ' + cap + ' min.',

  /* ---- Zonen ---- */

  z2ZuHart: (ueber, sehrHart, erlaubt) =>
    ueber + ' % der Zeit über Z2'
    + (sehrHart >= 5 ? ' (davon ' + sehrHart + ' % in Z4/Z5)' : '')
    + ', vorgesehen sind hier rund ' + erlaubt + ' %. Das ist eine Grundlagenfahrt – '
    + 'zu hart gefahren kostet sie die Erholung für den Qualitätstag.',

  z2ZuLocker: unten =>
    unten + ' % der Zeit unter Z2. Für eine Grundlagenfahrt zu locker – der Reiz kommt aus Z2.',

  z2Passt: (anteil, basis) =>
    anteil + ' % in Z2, ' + basis + ' % in Z1–Z2. Passt.',

  z3Block: (ist, soll) =>
    'Z3-Blockzeit: ' + ist + ' min erreicht, geplant waren rund ' + soll + ' min.',

  hartErreicht: (hart, ziel, zone, soll, ablauf) =>
    hart + ' min hart gefahren (davon ' + ziel + ' min in ' + zone + '), geplant '
    + soll + ' min als ' + ablauf + '.',

  hartKurz: (hart, ziel, zone, soll, ablauf) =>
    'Nur ' + hart + ' min hart gefahren (davon ' + ziel + ' min in ' + zone + '), geplant '
    + 'waren ' + soll + ' min als ' + ablauf + '. Intervalle abgebrochen oder Zone nicht erreicht?',

  /* ---- Aufzeichnung ---- */

  aufzeichnungAnnahme:
    'Kein Zeit-Stream und keine Aufzeichnungsdauer verfügbar – Zonenzeiten mit einer '
    + 'Sekunde je Messwert gerechnet. Die Anteile stimmen, die absoluten Minuten können '
    + 'deutlich zu niedrig sein.',

  aufzeichnungSkaliert: (takt, samples) =>
    'Kein Zeit-Stream vorhanden – Zonenzeiten gleichmäßig auf ⌀ ' + takt
    + ' s je Messwert skaliert (' + samples + ' Messwerte).',

  aufzeichnungGrob: (takt, samples) =>
    'Aufzeichnung im ⌀ ' + takt + '-Sekunden-Takt (' + samples + ' Messwerte), '
    + 'zeitgewichtet ausgewertet.'
};
