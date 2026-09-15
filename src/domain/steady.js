/* Die gleichmaessig gefahrene Zeit einer Aufzeichnung - und was sich nur auf
   ihr sinnvoll rechnen laesst: Zonenanteile nach Puls, der Drift aus Puls und
   Tempo, der Median des Pulses.

   Anlass war die Pendelfahrt vom 15.09.2026: 84 min, Trekkingrad ohne
   Leistungsmesser, Ø 132 bpm, Median 133, p90 139. Die App meldete 38 % der
   Zeit ueber Z2 und daraus "zu hart gefahren". Gerechnet war das richtig, die
   Aussage trug nicht - aus vier Gruenden, von denen drei hier stehen:

     Stop-and-go.  Nach jeder Ampel steigt der Puls fuer ein bis zwei Minuten
                   um 8 bis 12 Schlaege, ohne dass aerob eine Z3-Belastung
                   vorliegt. Das fuellt das Band knapp ueber der Z2-Grenze.
                   Der Trainingsplan filtert deshalb fuer die Driftanalyse:
                   nur Segmente ab 120 s durchgehend ueber 15 km/h. Fuer die
                   Zonenanteile gilt dieselbe Logik.
     Drift.        Die zweite Kontrollinstanz fuer Z2. intervals.icu rechnet
                   ihn nur mit Leistung - auf dem Trekkingrad bleibt das Feld
                   leer, und die Gegeninstanz fiel stillschweigend aus. Hier
                   wird er deshalb selbst gerechnet, aus Tempo je Schlag.
     Grenzlage.    Z2 endete bei 135, der Median lag bei 133. Eine Kennzahl,
                   die bei drei Schlaegen Verschiebung von wenigen Prozent auf
                   ueber die Haelfte springt, misst die Lage der Grenze und
                   nicht die Fahrt.

   Der vierte - es fehlt die primaere Steuergroesse Leistung - steht in
   analysis.js, weil er nichts zu rechnen hat.

   Rein: kein DOM, kein fetch, keine Uhr. */

import { quelleVon } from './zones.js';
import { AUSBELASTET_RPE } from './test.js';

/* Die Filterregel aus dem Methodenhinweis des Trainingsplans. */
export const STEADY = { minKmh: 15, minSek: 120 };

/* Ab wann ein Abstand zwischen zwei Messwerten eine Luecke ist - eine
   Aufzeichnungspause, kein Takt. Garmin zeichnet im intelligenten Modus mit
   bis zu 17 s Abstand auf; dreissig Sekunden trennen beides sicher. */
const LUECKE_SEK = 30;

/* Drift erst ab einer halben Stunde gleichmaessiger Zeit, Drittel erst ab
   15 min je Drittel - "Drittel mit unter 15 min Steady-Zeit nicht
   ueberinterpretieren", sagt der Plan. */
export const DRIFT = { minSek: 30 * 60, drittelMinSek: 45 * 60 };

/* Plus/minus so viele Schlaege um die Z2/Z3-Grenze, solange die LTHR nicht aus
   einem ausbelasteten Test stammt. */
export const GRENZBAND_BPM = 3;

function dtAn(zeit, i){
  const next = i + 1 < zeit.length ? zeit[i + 1] - zeit[i] : 1;
  if(!(next > 0)) return 0;
  return next > 60 ? 60 : next;
}

/* Welche Messwerte in einem gleichmaessig gefahrenen Segment liegen.

   Ein Segment ist eine ununterbrochene Folge von Messwerten ueber minKmh; es
   zaehlt, wenn es mindestens minSek dauert. Ohne Zeit- oder Tempostrom gibt
   es keine Maske - dann laesst sich nicht filtern, und der Aufrufer rechnet
   wie bisher ueber die ganze Fahrt. */
export function steadyMaske(zeit, tempoMs, opts){
  const o = Object.assign({}, STEADY, opts);
  const n = Array.isArray(zeit) ? zeit.length : 0;
  if(n < 2 || !Array.isArray(tempoMs) || tempoMs.length !== n) return null;
  if(!tempoMs.some(v => Number.isFinite(v) && v > 0)) return null;

  const maske = new Array(n).fill(false);
  let anfang = -1, dauer = 0;
  const schliessen = ende => {
    if(anfang >= 0 && dauer >= o.minSek){
      for(let k = anfang; k <= ende; k++) maske[k] = true;
    }
    anfang = -1; dauer = 0;
  };

  /* Verglichen in m/s: 15 km/h / 3,6 * 3,6 ist in Gleitkomma nicht 15. */
  const grenze = o.minKmh / 3.6;
  for(let i = 0; i < n; i++){
    const v = tempoMs[i];
    const schnell = Number.isFinite(v) && v > grenze;
    if(!schnell){ schliessen(i - 1); continue; }
    if(anfang >= 0 && zeit[i] - zeit[i - 1] > LUECKE_SEK) schliessen(i - 1);
    if(anfang < 0) anfang = i;
    /* Eine Pause vor dem naechsten Messwert ist keine gefahrene Zeit - sonst
       truege die Luecke ein zu kurzes Segment ueber die 120 s. */
    const dt = i + 1 < n ? zeit[i + 1] - zeit[i] : 1;
    dauer += dt > 0 && dt <= LUECKE_SEK ? dt : 0;
  }
  schliessen(n - 1);
  return maske;
}

export function maskenSekunden(zeit, maske){
  if(!maske) return 0;
  let s = 0;
  for(let i = 0; i < maske.length; i++) if(maske[i]) s += dtAn(zeit, i);
  return s;
}

/* Drift aus Tempo je Schlag, ueber die gleichmaessige Zeit.

   EF = Ø-Tempo / Ø-Puls je Abschnitt, Drift = Abfall des EF vom ersten zum
   letzten Abschnitt in Prozent - positiv heisst: spaeter mehr Puls fuer
   dasselbe Tempo. Haelften immer, Drittel ab 45 min; gilt der groessere der
   beiden Werte. Der Plan verlangt beides, weil Drittel zeigen, was die
   Zweiteilung verdeckt - und eine Unterdrueckung der Warnung soll sich auf
   den ungnaedigeren Wert stuetzen, nicht auf den bequemeren.

   Aufgeteilt wird nach gleichmaessiger Zeit und nicht nach Uhrzeit: ein
   Drittel mit zehn Ampeln haette sonst kaum Gewicht, stuende aber gleich. */
export function driftAus(zeit, puls, tempoMs, maske){
  const n = Array.isArray(zeit) ? zeit.length : 0;
  if(n < 2 || !maske || !Array.isArray(puls) || puls.length !== n
     || !Array.isArray(tempoMs) || tempoMs.length !== n) return null;

  const punkte = [];
  let summe = 0;
  for(let i = 0; i < n; i++){
    if(!maske[i]) continue;
    const hf = puls[i], v = tempoMs[i];
    if(!(hf > 0) || !Number.isFinite(v)) continue;
    const dt = dtAn(zeit, i);
    if(!dt) continue;
    punkte.push({ t: summe, dt, hf, kmh: v * 3.6 });
    summe += dt;
  }
  if(summe < DRIFT.minSek) return null;

  const teile = anzahl => {
    const acc = Array.from({ length: anzahl }, () => ({ sek: 0, hf: 0, kmh: 0 }));
    for(const p of punkte){
      const k = Math.min(anzahl - 1, Math.floor(p.t / summe * anzahl));
      acc[k].sek += p.dt; acc[k].hf += p.hf * p.dt; acc[k].kmh += p.kmh * p.dt;
    }
    return acc.map(a => ({ sek: a.sek, hf: a.hf / a.sek, kmh: a.kmh / a.sek,
                           ef: (a.kmh / a.sek) / (a.hf / a.sek) }));
  };
  const abfall = t => (t[0].ef - t[t.length - 1].ef) / t[0].ef * 100;

  const haelften = teile(2);
  const drittel = summe >= DRIFT.drittelMinSek ? teile(3) : null;
  const wHaelften = abfall(haelften);
  const wDrittel = drittel ? abfall(drittel) : null;
  return {
    prozent: wDrittel === null ? wHaelften : Math.max(wHaelften, wDrittel),
    haelften: wHaelften, drittel: wDrittel,
    abschnitte: drittel || haelften, steadySek: summe
  };
}

/* Zeitgewichteter Median des Pulses ueber die ganze Fahrt. */
export function pulsMedian(puls, zeit){
  const n = Array.isArray(puls) ? puls.length : 0;
  const mitZeit = Array.isArray(zeit) && zeit.length === n;
  const w = [];
  let summe = 0;
  for(let i = 0; i < n; i++){
    if(!(puls[i] > 0)) continue;
    const dt = mitZeit ? dtAn(zeit, i) : 1;
    if(!dt) continue;
    w.push([puls[i], dt]);
    summe += dt;
  }
  if(!summe) return null;
  w.sort((a, b) => a[0] - b[0]);
  let kum = 0;
  for(const [hf, dt] of w){
    kum += dt;
    if(kum >= summe / 2) return hf;
  }
  return w[w.length - 1][0];
}

/* Ist die LTHR durch einen ausbelasteten Test gedeckt?

   Nur wenn sie aus einem Test stammt und dieser Test mit RPE ab 9 gefahren
   wurde. Eine von Hand gesetzte LTHR ist eine Annahme, ein Test bei RPE 7-8
   misst die Bereitschaft, an die Schwelle heranzugehen - beides kann richtig
   sein, ist aber nicht bestaetigt. */
export function lthrBestaetigt(th, testLog){
  const q = quelleVon(th, 'lthr');
  if(!q || q.art !== 'test' || !q.tag) return false;
  const e = (testLog || []).filter(x => x && x.day === q.tag).pop();
  return !!(e && e.rpe >= AUSBELASTET_RPE);
}
