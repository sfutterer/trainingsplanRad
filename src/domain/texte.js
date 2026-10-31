/* Die Saetze, mit denen die App eine Einheit bewertet.

   Standen bis zum 29.08.2026 mitten im Verzweigungsbaum von analysis.js.
   Hier stehen sie als benannte Funktionen: der Rumpf von vergleicheTag liest
   sich als Fallunterscheidung, und die Saetze stehen beieinander, wo man sie
   als Ganzes redigieren kann.

   Seit dem 31.10.2026 knapp und neutral. Bis dahin trugen viele Saetze
   Deutungen des Gefahrenen ("Zeitdruck pruefen", "die Zonengrenze lag zu
   tief", "Intervalle abgebrochen?") und Ratschlaege, die aus der
   Plandiskussion stammten. Ein Satz nennt jetzt Messwert, Vorgabe und - wo
   die App eine Regel anwendet - die Regel. Warum es so kam, weiss nur der
   Fahrer.

   Nicht zu verwechseln mit plan.texts: das sind die Saetze aus dem
   Trainingsplan. Diese hier sind die Bewertung der App und gehoeren deshalb
   in den Code, genau wie die Schwellen in analysis.js.

   Rein: kein DOM, keine Uhr. */

import { FTP_FAKTOR } from './test.js';
import { zahl } from './zahlen.js';

const vz = v => (v > 0 ? '+' : '') + zahl(v, 1);

/* Was gegen eine Haerte-Bewertung spricht, als Liste mit Zahlen. */
function einschraenkungen(vorbehalte, ohneLeistung){
  const g = (vorbehalte || []).map(v => {
    if(v.art === 'drift'){
      return (v.icu ? 'Entkopplung ' : 'Drift aus Puls und Tempo ') + vz(v.wert) + ' % (Grenze 5 %)';
    }
    if(v.art === 'grenze'){
      return 'Median ' + Math.round(v.median) + ' bpm im Toleranzband ±' + v.band
        + ' bpm um die Z2-Grenze ' + v.grenze + ' bpm, LTHR nicht aus ausbelastetem Test';
    }
    if(v.art === 'ampeln'){
      return 'nur ' + v.steadyMin + ' min gleichmäßig gefahren';
    }
    return null;
  }).filter(Boolean);
  if(ohneLeistung) g.push('keine Leistungsdaten, gewertet nach Puls');
  return g.length ? ': ' + g.join('; ') + '.' : '.';
}

export const T = {

  /* ---- Ruhetag und optionale Fahrten ---- */

  ruhetagGefahren: dauer => 'Ruhetag, ' + dauer + ' gefahren.',

  optionaleFahrt: (ist, km, sollMin) => sollMin
    ? 'Optionale Fahrt: ' + ist + ' min' + km + ', vorgesehen ' + sollMin + ' min Z1.'
    : 'Nicht geplante Fahrt: ' + ist + ' min' + km + '.',

  lockerZuHart: hart => hart + ' % über Z2, vorgesehen ist eine lockere Fahrt.',

  lockerPasst: locker => locker + ' % bis Z2.',

  /* ---- Rumpfzirkel ---- */

  rumpfNichtErfasst:
    'Keine Krafteinheit erfasst – weder im Rumpf-Timer noch als Aktivität in intervals.icu.',

  rumpfKomplett: soll => 'Alle ' + soll + ' Runden komplett.',

  rumpfTeilweise: (voll, soll, fertig, letzte) =>
    'Rumpf-Timer: ' + voll + ' von ' + soll + ' Runden'
    + (fertig ? '' : ', vorzeitig beendet')
    + (letzte ? ', zuletzt ' + letzte.name + ' in Runde ' + letzte.round : '') + '.',

  rumpfUebersprungen: (anzahl, liste) =>
    anzahl + (anzahl === 1 ? ' Satz' : ' Sätze') + ' vorzeitig beendet: ' + liste + '.',

  rumpfMehrfach: anzahl =>
    anzahl + ' Einheiten protokolliert, gewertet ist die letzte.',

  rumpfOhneSchaetzung: min =>
    'Krafteinheit: ' + min + ' min. Die Rundenzahl lässt sich aus der Dauer nicht ableiten.',

  rumpfGeschaetztOk: (min, est, soll) =>
    'Krafteinheit: ' + min + ' min, geschätzt ' + est + ' von ' + soll + ' Runden.',

  rumpfGeschaetztKurz: (min, est, soll, sollMin) =>
    'Krafteinheit: ' + min + ' min (geplant ' + sollMin + ' min), geschätzt ' + est + ' von '
    + soll + ' Runden.',

  /* ---- Beinblock ---- */

  beineNichtProtokolliert: 'Beinblock nicht protokolliert.',

  beineKomplett: (voll, soll, saetze) =>
    'Beinblock: ' + voll + ' von ' + soll + ' Runden komplett, ' + saetze + ' Sätze.',

  beineTeilweise: (voll, soll, saetze) =>
    'Beinblock: ' + voll + ' von ' + soll + ' Runden komplett, ' + saetze + ' Sätze protokolliert.',

  beineOhneWerte: 'Beinblock ohne eingetragene Wiederholungen.',

  beineUnterZiel: (anzahl, liste) =>
    anzahl + (anzahl === 1 ? ' Satz' : ' Sätze') + ' unter dem Wiederholungsziel: ' + liste + '.',

  /* ---- Arbeitsweg ---- */

  /* Seit dem 15.09.2026 ein Hinweis und kein Urteil - Begruendung an
     commuteIntensityNotes. */
  pendelUeberZ2: (ueber, vorbehalte, ohneLeistung) =>
    ueber + ' % über Z2. Arbeitsweg, ohne Härte-Bewertung'
    + einschraenkungen(vorbehalte, ohneLeistung),

  /* Dieselbe Lage auf einer Grundlagen- oder Erholungsfahrt: der Anteil ist
     ueber der Vorgabe, aber etwas spricht dagegen, ihn als Befund zu lesen. */
  ueberZ2OhneBefund: (ueber, erlaubt, vorbehalte, ohneLeistung) =>
    ueber + ' % über Z2, vorgesehen rund ' + erlaubt + ' %. Nicht als zu hart gewertet'
    + einschraenkungen(vorbehalte, ohneLeistung),

  steadyBasis: (steady, gesamt, kmh, sek) =>
    'Zonenanteile über ' + steady + ' von ' + gesamt + ' min gleichmäßig gefahrener Zeit '
    + '(Abschnitte ab ' + sek + ' s über ' + kmh + ' km/h).',

  steadyZuKurz: (steady, gesamt, kmh, sek) =>
    'Nur ' + steady + ' von ' + gesamt + ' min gleichmäßig gefahren (Abschnitte ab ' + sek
    + ' s über ' + kmh + ' km/h). Zonenanteile über die ganze Fahrt gerechnet.',

  pruefFazit: ueber => 'Arbeitsweg: ' + ueber + ' % über Z2, ohne Härte-Bewertung.',

  pendelPasst: (inZ2, ueber) => inZ2 + ' % in Z2, ' + ueber + ' % darüber.',

  mittwochFehlt: soll => 'Keine Fahrt. Vorgesehen: mindestens ' + soll + ' min Z2.',

  mittwochKurz: (ist, soll) => ist + ' min gefahren, Untergrenze ' + soll + ' min.',

  mittwochToleranz: (ist, soll) =>
    ist + ' min gefahren, Untergrenze ' + soll + ' min – innerhalb der Toleranz.',

  mittwochErfuellt: (ist, soll) =>
    ist + ' min gefahren, Untergrenze ' + soll + ' min – erfüllt.',

  /* ---- Radeinheit mit messbarem Soll ---- */

  testFehlt: 'Kein Test gefunden.',

  fahrtFehlt: 'Keine Fahrt an diesem Tag gefunden.',

  dauerKurz: pct => pct + ' % kürzer als geplant.',

  dauerLang: pct => pct + ' % länger als geplant.',

  /* Der Faktor kommt aus test.js und steht nicht noch einmal als Ziffernfolge
     im Satz. */
  testtag:
    'Testtag: FTP = Ø-Watt der 20 min × ' + String(FTP_FAKTOR).replace('.', ',')
    + ', LTHR = Ø-Puls der 20 min. Eintragen im Bereich „Schwellentest“.',

  /* ---- Die Fahrten eines Tages nacheinander ----

     Der Tag bleibt die Einheit, in der der Plan seine Vorgabe macht - aber die
     Summe des Tages entsteht in einer Reihenfolge, und die gehoert dazugesagt. */

  fahrtLaufstand: (nr, ist, kum, soll, minimum) => {
    const kopf = nr + '. Fahrt: ' + ist + ' min.';
    if(!soll) return kopf;
    const stand = ' Stand ' + kum + ' von ' + soll + ' min ' + (minimum ? 'Untergrenze' : 'Vorgabe');
    if(kum < soll) return kopf + stand + ', fehlen ' + (soll - kum) + ' min.';
    if(kum > soll) return kopf + stand + ', ' + (kum - soll) + ' min darüber.';
    return kopf + stand + '.';
  },

  /* Die Ueberschreitung haengt an der Fahrt, die sie ausloest - nicht am Tag. */
  fahrtUeberZiel: (mehrere, kum, soll, minimum) =>
    (mehrere ? 'Mit dieser Fahrt über dem Ziel: ' : 'Über dem Ziel: ')
    + kum + ' min gegen ' + soll + ' min ' + (minimum ? 'Untergrenze' : 'Vorgabe')
    + ' (+' + Math.round((kum - soll) / soll * 100) + ' %).',

  umfangFazit: (kum, soll) =>
    'Umfang über der Vorgabe: ' + kum + ' min gegen ' + soll + ' min.',

  /* ---- Wochenumfang ---- */

  deckelUeberschritten: (ist, plan, cap) =>
    ist + ' min gefahren, Deckel ' + cap + ' min (Plan ' + plan + ' min).',

  deckelHinweis: cap => 'Obergrenze dieser Woche: ' + cap + ' min.',

  /* ---- Zonen ---- */

  z2ZuHart: (ueber, sehrHart, erlaubt) =>
    ueber + ' % über Z2'
    + (sehrHart >= 5 ? ' (davon ' + sehrHart + ' % in Z4/Z5)' : '')
    + ', vorgesehen rund ' + erlaubt + ' %.',

  /* Die Entkopplung sticht die Zonenzaehlung. Genannt werden beide Zahlen,
     nicht nur die, die gewinnt. */
  z2EntkopplungSticht: (ueber, erlaubt, ent, grenze) =>
    ueber + ' % über Z2, vorgesehen rund ' + erlaubt + ' %. Entkopplung ' + vz(ent)
    + ' % (Grenze ' + grenze + ' %), deshalb nicht als zu hart gewertet.',

  z2ZuLocker: unten => unten + ' % unter Z2.',

  z2Passt: (anteil, basis) => anteil + ' % in Z2, ' + basis + ' % in Z1–Z2.',

  /* ---- Abschnitte einer Fahrt mit Leistungsmesser (seit 19.09.2026) ----

     Die Zeit ueber Z2 steht getrennt nach Z2-Anteil und geplanten Bloecken -
     eine Summe ueber beide ist die Zahl, die die Fehlwarnung erzeugt hat. */
  z2Anteil: (min, ueberMin, ueberPct, watt, z2Max) =>
    'Z2-Anteil: ' + min + ' min, davon ' + ueberMin + ' min über Z2 (' + ueberPct
    + ' %, über ' + z2Max + ' W, 30-s-geglättet) · Ø ' + Math.round(watt) + ' W.',

  z2Rahmen: (ein, aus) =>
    'Nicht gewertet: ' + ein + ' min Einfahren, ' + aus + ' min Ausrollen, Stillstand.',

  entkopplungZ2: (ent, grenze, min) =>
    'Decoupling Pw:HR im Z2-Anteil ' + vz(ent.prozent) + ' % über ' + min + ' min ('
    + Math.round(ent.erste.watt) + ' → ' + Math.round(ent.zweite.watt) + ' W bei '
    + Math.round(ent.erste.hf) + ' → ' + Math.round(ent.zweite.hf) + ' bpm), Grenze ' + grenze + ' %.',

  entkopplungFehlt: min =>
    'Decoupling nicht berechnet: Z2-Anteil vor dem ersten Block ' + min + ' min oder ohne Puls.',

  z2ZuHartAbschnitt: gruende => 'Über der Z2-Vorgabe: ' + gruende.join('; ') + '.',

  z2OhneBefund: (gruende, ent, grenze) =>
    gruende.join('; ') + '. Decoupling ' + vz(ent) + ' % (Grenze ' + grenze
    + ' %), deshalb nicht als zu hart gewertet.',

  z2UnterBand: (watt, min) =>
    'Ø ' + Math.round(watt) + ' W im Z2-Anteil, unter dem Z2-Band ab ' + min + ' W.',

  bloecke: (n, min, watt, band, quelle) =>
    'Geplante Blöcke: ' + n + ' × ' + min + ' min, Ø ' + Math.round(watt) + ' W (Ziel ' + band.text
    + (band.herkunft ? ', ' + band.herkunft : '') + ')' + (quelle === 'fenster'
      ? ', stärkste ' + min + '-min-Fenster der zweiten Fahrthälfte (keine passenden Runden).'
      : ', aus den Runden der Aufzeichnung.'),

  blockEinzeln: (nr, watt, hf, kadenz) =>
    'Block ' + nr + ': Ø ' + Math.round(watt) + ' W' + (hf ? ', ' + Math.round(hf) + ' bpm' : '')
    + (kadenz ? ', ' + Math.round(kadenz) + ' rpm' : '') + '.',

  blockZuWeich: (nr, watt, min) =>
    'Block ' + nr + ' unter dem Ziel: Ø ' + Math.round(watt) + ' W, Ziel ab ' + min + ' W.',

  blockZuHart: (nr, watt, max) =>
    'Block ' + nr + ' über dem Ziel: Ø ' + Math.round(watt) + ' W, Ziel bis ' + max + ' W.',

  bloeckeFehlen: (reps, min) =>
    'Geplant ' + reps + ' × ' + min + ' min Block, in der Aufzeichnung nicht gefunden.',

  pauseHart: (nr, watt, max) =>
    'Pause nach Block ' + nr + ': Ø ' + Math.round(watt) + ' W, über Z2 (' + max + ' W).',

  kadenzZ2: (ist, ziel) =>
    'Ø-Kadenz im Z2-Anteil ' + Math.round(ist) + ' rpm (Ziel ' + ziel + ').',

  kadenzZ2Niedrig: (ist, ziel) =>
    'Ø-Kadenz im Z2-Anteil ' + Math.round(ist) + ' rpm, unter ' + ziel + '.',

  kadenzBlock: (ist, ziel) =>
    'Ø-Kadenz in den Blöcken ' + Math.round(ist) + ' rpm, Ziel ' + ziel + '.',

  z3Block: (ist, soll) =>
    'Z3-Blockzeit: ' + ist + ' min, geplant rund ' + soll + ' min.',

  hartErreicht: (hart, ziel, zone, soll, ablauf) =>
    hart + ' min hart gefahren (davon ' + ziel + ' min in ' + zone + '), geplant '
    + soll + ' min als ' + ablauf + '.',

  hartKurz: (hart, ziel, zone, soll, ablauf) =>
    hart + ' min hart gefahren (davon ' + ziel + ' min in ' + zone + '), geplant '
    + soll + ' min als ' + ablauf + '.',

  /* ---- Wiederholungen des Donnerstags und die Nachsteuerung (seit 24.09.2026)

     Die Zahlen kommen aus wiederholungen.js; dort steht auch, welche Haelfte
     der Ausfuehrungsregel 7 messbar ist und welche nicht. */
  wdhReihe: (n, soll, band, quelle) =>
    'Wiederholungen: ' + n + ' von ' + soll + ' erkannt, Ziel ' + band.text
    + (band.herkunft ? ' (' + band.herkunft + ')' : '')
    + (quelle === 'fenster'
      ? ', stärkste Fenster der Solldauer (keine passenden Runden).'
      : ', aus den Runden der Aufzeichnung.'),

  wdhEinzeln: (w, lthr) =>
    'Wdh. ' + w.nr + ': Ø ' + Math.round(w.watt) + ' W'
    + (w.hfEnde > 0
      ? ', letzte 60 s Ø ' + Math.round(w.hfEnde) + ' bpm'
        + (lthr ? (w.hfEnde >= lthr ? ' (≥ LTHR)' : ' (unter LTHR ' + lthr + ')') : '')
      : ', ohne Puls')
    + '.',

  /* Die Nachsteuerung nach Ausfuehrungsregel 7: Ergebnis, dann der Befund,
     auf dem es beruht. */
  wdhHinweis: (h, band, lthr) => {
    const neu = h.neu ? h.neu.min + '–' + h.neu.max + ' W' : null;
    const schluss = h.maximalversuch
      ? ' Wdh. ' + h.maximalversuch + ' zählt als Maximalversuch und nicht mit; bewertet: '
        + 'Wdh. ' + h.bewertet.join(' und ') + '.'
      : h.bewertet.length ? ' Bewertet: Wdh. ' + h.bewertet.join(' und ') + '.' : '';
    if(h.grund === 'pulsTief'){
      return 'Nächstes Mal ' + neu + ' (Ausführungsregel 7: +5 W). Band ' + band.text
        + ' gehalten, Puls in den letzten 60 s unter ' + lthr + ' bpm.' + schluss;
    }
    if(h.grund === 'einbruch'){
      return 'Nächstes Mal ' + neu + ' (Ausführungsregel 7: −5 W). Letzte Wiederholung '
        + Math.round(h.einbruch.letzte) + ' W gegen Ø ' + Math.round(h.einbruch.schnitt)
        + ' W davor, mehr als 5 % darunter.' + schluss;
    }
    if(h.grund === 'pulsHoch'){
      return 'Puls ab Wdh. 2 über der LTHR (' + lthr + ' bpm). Ausführungsregel 7: ' + neu
        + ', wenn die Atmung am Limit war, sonst Band ' + band.text + '.' + schluss;
    }
    if(h.grund === 'bandNichtGehalten'){
      return 'Band ' + band.text + ' nicht gehalten, Pulskriterium nicht erreicht. Band unverändert.'
        + schluss;
    }
    if(h.grund === 'imBand'){
      return 'Band ' + band.text + ' unverändert: Pulskriterium erreicht, kein Leistungsabfall.'
        + schluss;
    }
    if(h.grund === 'ohnePuls'){
      return 'Band ' + band.text + ' unverändert: kein Puls in den letzten Wiederholungen.' + schluss;
    }
    if(h.grund === 'ohneLthr'){
      return 'Keine Nachsteuerung: LTHR fehlt.';
    }
    return 'Keine Nachsteuerung: zu wenige bewertbare Wiederholungen.' + schluss;
  },

  /* ---- Aufzeichnung ---- */

  aufzeichnungAnnahme:
    'Ohne Zeitangaben gerechnet (1 s je Messwert): Anteile korrekt, Minuten möglicherweise zu niedrig.',

  aufzeichnungSkaliert: (takt, samples) =>
    'Ohne Zeit-Stream: Zonenzeiten auf ⌀ ' + takt + ' s je Messwert skaliert (' + samples
    + ' Messwerte).',

  aufzeichnungGrob: (takt, samples) =>
    'Aufzeichnung im ⌀ ' + takt + '-s-Takt (' + samples + ' Messwerte), zeitgewichtet.',

  /* ---- Gegen welchen Massstab gezaehlt wurde ---- */

  zonenOhneLeistung:
    'Ohne Leistungsdaten: Zonen aus dem Puls (Coggan-Bänder der LTHR). Bewertung vorläufig, '
    + 'Fahrt nicht im Effizienzfaktor.',

  zonenNochUebergang:
    'Zonen nach den Übergangsbändern gezählt, FTP und LTHR fehlen. Eintragen unter „Zonen“.',

  zonenWattRollen: min =>
    'Zonen aus der Leistung (30 s gemittelt), ohne ' + min + ' min Rollzeit.',

  zonenGemischt:
    'Fahrten dieses Tages teils mit, teils ohne Leistung gezählt. Die Tagesanteile mischen '
    + 'beide; die Angaben je Fahrt sind genauer.'
};
