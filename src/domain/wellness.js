/* Wellness: Ruhepuls, HRV, Schlaf und Gewicht.

   Lag bis zum 29.08.2026 in der zweiten Haelfte von analysis.js. Die beiden
   Haelften riefen einander nie auf - die eine gleicht Aufzeichnungen mit dem
   Plan ab, die andere liest die Werte der Uhr -, und der Testaufbau wusste das
   laengst: test/wellness.test.js pruefte nur diese Haelfte. 741 Zeilen fuer
   zwei Gegenstaende waren einer zu viel.

   Ruhepuls, HRV und Schlaf lagen ueber die API ohnehin vor, wurden in Fassung 1
   aber nirgends verwendet. Bei dieser Aufbaurate die wichtigste Sicherung.
   Reine Regeln: die Daten kommen von aussen, hier wird nur gerechnet.

   Die Schwellen stehen wie die Toleranzen in analysis.js bewusst hier und
   nicht in plan.json - sie sind Bewertungspolitik der App, nicht
   Trainingsplan. Das gilt auch fuer die Massnahmentexte weiter unten: welcher
   Donnerstag wie heruntergestuft wird, haengt an der Bewertung, nicht am
   Plandokument.

   Rein: kein DOM, kein fetch, keine Uhr. */

import { tagNr, tagPlus } from './week.js';
import { median } from './zahlen.js';

export const WELL = {
  rhrPlus: 5,                 // bpm ueber dem Schnitt
  hrvAnteil: 0.85,            // Anteil des Schnitts
  schlafKurzSec: 6 * 3600,
  fenster: 7,                 // Tage, aus denen der Schnitt kommt
  /* Abnehmen und Aufbauen ziehen gegeneinander. Ueber dieser Rate je Woche
     fehlt die Energie fuer genau die Anpassung, die der Plan aufbauen will -
     und das zeigt sich zuerst in den drei Werten darueber. Faustwert aus der
     Trainingslehre, nicht aus dem Plandokument. */
  abnehmProzentProWoche: 0.7,
  gewichtMinPunkte: 5,
  gewichtMinTage: 5
};


/* Nur Zeilen mit Datum. intervals.icu fuehrt das Datum als id; ohne sie laesst
   sich weder "gestern" noch ein Schnitt bilden, und dann lieber gar keine
   Aussage als eine falsch verankerte. */
function wellnessZeilen(data){
  return (Array.isArray(data) ? data : [])
    .filter(r => r && tagNr(r.id) !== null)
    .sort((a, b) => tagNr(a.id) - tagNr(b.id));
}

export function wellnessAvg(rows, feld){
  const v = (rows || []).map(r => r && r[feld]).filter(x => x > 0);
  if(v.length < 3) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/* Das Gate fuer einen Tag.

   streng entscheidet, was passiert, wenn fuer den gefragten Tag keine Zeile da
   ist. Morgens um sieben steht der heutige Datensatz oft noch nicht - dafuer
   faellt die Bewertung auf die neueste vorhandene Zeile zurueck. Fuer "gestern"
   und fuer eine zurueckliegende Fahrt darf sie das nicht, sonst wandert der
   heutige Wert auf einen fremden Tag. */
export function wellnessGate(data, todayIso, streng){
  const rows = wellnessZeilen(data);
  if(!rows.length) return null;

  const heute = rows.find(r => r.id === todayIso) || (streng ? null : rows[rows.length - 1]);
  if(!heute) return null;

  const heuteNr = tagNr(heute.id);
  /* Der Schnitt kommt aus den sieben Tagen davor - nicht aus allem, was der
     Abruf hergibt. Das Fenster darf sich nicht mit der Fensterbreite des
     Aufrufers aendern. */
  const rest = rows.filter(r => tagNr(r.id) < heuteNr).slice(-WELL.fenster);
  const rhrAvg = wellnessAvg(rest, 'restingHR');
  const hrvAvg = wellnessAvg(rest, 'hrv');

  const gestern = rows.find(r => tagNr(r.id) === heuteNr - 1) || null;
  const kurz = s => s > 0 && s < WELL.schlafKurzSec;
  const kurzeNaechte = (kurz(heute.sleepSecs) ? 1 : 0) + (gestern && kurz(gestern.sleepSecs) ? 1 : 0);

  const rhrHoch = heute.restingHR > 0 && rhrAvg > 0 && heute.restingHR > rhrAvg + WELL.rhrPlus;
  const hrvNiedrig = heute.hrv > 0 && hrvAvg > 0 && heute.hrv < hrvAvg * WELL.hrvAnteil;

  const gruende = [];
  if(rhrHoch){
    gruende.push('Ruhepuls ' + Math.round(heute.restingHR) + ' bpm, ' + WELL.fenster +
      '-Tage-Schnitt ' + Math.round(rhrAvg) + ' bpm');
  }
  if(hrvNiedrig){
    gruende.push('HRV ' + Math.round(heute.hrv) + ', ' + WELL.fenster +
      '-Tage-Schnitt ' + Math.round(hrvAvg));
  }
  /* Zwei kurze Naechte hintereinander, nicht eine - und beide ueber das Datum
     bestimmt, nicht ueber die Position im Abruf. */
  if(kurzeNaechte === 2) gruende.push('zwei Nächte unter 6 h Schlaf');

  const fehlt = !(heute.restingHR > 0) && !(heute.hrv > 0) && !(heute.sleepSecs > 0);
  if(fehlt) return null;

  return { rot: gruende.length > 0, gruende, heute, rhrAvg, hrvAvg,
           rhrHoch, hrvNiedrig, kurzeNaechte };
}

/* Steigung des Gewichts in kg je Woche.

   Nicht erster gegen letzter Wert: Tagesgewicht ist ueberwiegend Wasser und
   Glykogen, zwei Einzelwerte tragen die Aussage nicht.

   Und auch keine Ausgleichsgerade, obwohl sie naeher laege. Bei ihr haben die
   Punkte am Rand des Fensters die groesste Hebelwirkung - und der juengste
   Punkt ist immer ein Rand. Ein einzelner schwerer Tag nach einer langen
   Ausfahrt kippt damit die Aussage ueber drei Wochen. Der Median aller
   paarweisen Steigungen (Theil-Sen) haelt das aus: erst wenn rund ein Viertel
   der Werte danebenliegt, wandert er ueberhaupt. Bei hoechstens drei Wochen
   Fenster sind das ein paar hundert Paare, das faellt nicht auf. */

export function gewichtTrend(data){
  const punkte = wellnessZeilen(data)
    .filter(r => r.weight > 0)
    .map(r => ({ t: tagNr(r.id), kg: r.weight }));
  if(punkte.length < WELL.gewichtMinPunkte) return null;

  const tage = punkte[punkte.length - 1].t - punkte[0].t;
  if(tage < WELL.gewichtMinTage) return null;

  const steigungen = [];
  for(let i = 0; i < punkte.length; i++){
    for(let j = i + 1; j < punkte.length; j++){
      const dt = punkte[j].t - punkte[i].t;
      if(dt > 0) steigungen.push((punkte[j].kg - punkte[i].kg) / dt);
    }
  }
  if(!steigungen.length) return null;

  /* Auch der Bezugswert als Median: ein Ausreisser darf weder die Steigung
     noch die Prozentangabe verschieben. */
  const schnitt = median(punkte.map(p => p.kg));
  if(!(schnitt > 0)) return null;

  const proWoche = median(steigungen) * 7;
  return { punkte: punkte.length, tage, schnitt, proWoche,
           prozentProWoche: proWoche / schnitt * 100 };
}

/* Bewusst kein Grund fuer ein rotes Gate.

   Das Gate entscheidet ueber den heutigen Qualitaetstag. Eine zu schnelle
   Abnahme ist eine Aussage ueber Wochen - haenge man sie in dieselbe Liste,
   stuende das Gate waehrend einer Diaet wochenlang auf rot, und ein Warnlicht,
   das immer leuchtet, liest niemand mehr. Deshalb eigener Hinweis. */
export function abnehmHinweis(data){
  const t = gewichtTrend(data);
  if(!t) return null;
  const rate = -t.prozentProWoche;
  if(!(rate >= WELL.abnehmProzentProWoche)) return null;
  const kg = (Math.round(Math.abs(t.proWoche) * 10) / 10).toString().replace('.', ',');
  const pz = (Math.round(rate * 10) / 10).toString().replace('.', ',');
  return {
    ...t, rate,
    text: 'Gewicht −' + kg + ' kg je Woche (' + pz + ' % über ' + t.tage + ' Tage). ' +
      'Über ' + String(WELL.abnehmProzentProWoche).replace('.', ',') +
      ' % je Woche fehlt im Aufbau die Energie für die Anpassung – und es drückt zuerst ' +
      'auf genau die Werte, die das Gate liest.'
  };
}

/* Heute, gestern und der Gewichtstrend in einem Durchgang - ein Abruf, drei
   Aussagen. Die Zwei-Tage-Regel steht im Trainingsplan (Abschnitt 4.10) und
   brauchte bisher nur deshalb keine Daten, weil sie niemand ausgewertet hat. */
export function wellnessSerie(data, todayIso){
  const heute = wellnessGate(data, todayIso);
  /* Gestern relativ zu der Zeile, die tatsaechlich als "heute" gilt - sonst
     zaehlt bei fehlendem Tagesdatensatz der falsche Vortag. */
  const gestern = heute ? wellnessGate(data, tagPlus(heute.heute.id, -1), true) : null;
  return {
    heute, gestern,
    zweiRot: !!(heute && heute.rot && gestern && gestern.rot),
    abnehmen: abnehmHinweis(data)
  };
}

/* Was ein rotes Gate konkret heisst - abhaengig davon, was der Donnerstag
   ueberhaupt vorsieht.

   Vorher stand hier ein fester Satz: "Donnerstag wird 60 min Z2". An einem
   Testdonnerstag ist der falsch (ein Test wird verschoben, nicht
   heruntergestuft - ein Wert von einem roten Tag bestimmt danach jede Zone),
   und an einem Z2-Donnerstag ist er eine Nullaenderung. */
export function wellnessMassnahmen(donnerstag, zweiRot){
  const m = [];
  if(donnerstag === 'test'){
    m.push('Den Schwellentest heute nicht fahren. Ein Wert von einem roten Tag fällt zu niedrig aus ' +
      'und bestimmt danach jede Zone – lieber ein bis zwei Tage später testen, notfalls in der Folgewoche.');
  } else if(donnerstag === 'z2'){
    m.push('Der Donnerstag ist ohnehin Z2 – herunterstufen lässt sich da nichts. ' +
      'Stattdessen die Dauer kürzen und den Samstag ohne Blöcke fahren.');
  } else {
    m.push('Donnerstag wird 60 min Z2, Samstag ohne Blöcke.');
  }
  m.push(zweiRot
    ? 'Zweiter roter Tag in Folge – die ganze Woche als Erholungswoche fahren, unabhängig von der Wochennummer.'
    : 'Zwei rote Tage hintereinander → die ganze Woche als Erholungswoche.');
  return m;
}

/* Die Verfassung am Tag einer Fahrt, aufbereitet fuer das Fazit.

   Absichtlich schon als Urteil und nicht als Rohwert: die Schwellen gehoeren
   an eine Stelle. Saehe das Fazit die Zahlen selbst, koennten Gate und Fazit
   denselben Tag verschieden bewerten. */
export function verfassungAus(data, tagIso){
  const g = wellnessGate(data, tagIso, true);
  if(!g) return null;
  return {
    rhrHoch: g.rhrHoch, hrvNiedrig: g.hrvNiedrig, kurzeNaechte: g.kurzeNaechte,
    rot: g.rot,
    restingHR: g.heute.restingHR || 0, rhrAvg: g.rhrAvg,
    hrv: g.heute.hrv || 0, hrvAvg: g.hrvAvg,
    sleepSecs: g.heute.sleepSecs || 0
  };
}
