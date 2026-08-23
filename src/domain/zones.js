/* Puls- und Leistungszonen.

   Bis zur Testwoche gelten die Uebergangsbaender aus plan.json, danach Coggan
   aus der LTHR - aber nur, wenn der Test tatsaechlich gelaufen ist. Ohne LTHR
   laufen die Uebergangsbaender weiter, sonst rechnete die App mit Zonen, die
   es nicht gibt.

   thresholds ist immer {ftp, lthr, hrmax} mit null fuer "noch nicht gemessen". */

import { weekIndex } from './week.js';

export const NO_THRESHOLDS = { ftp: null, lthr: null, hrmax: null };

export function hasLthr(th){ return !!(th && th.lthr > 0); }
export function hasFtp(th){  return !!(th && th.ftp  > 0); }

export function cogganHrBands(plan, lthr){
  const r = f => Math.round(lthr * f);
  return plan.cogganBands.map(b => ({
    key: b.key, label: b.label,
    min: r(b.minFactor),
    max: b.maxFactor === null ? 999 : r(b.maxFactor),
    color: b.color
  }));
}

export function usesCoggan(plan, th, week){
  return week >= plan.cogganFromWeek && hasLthr(th);
}

export function hrBands(plan, th, week){
  return usesCoggan(plan, th, week) ? cogganHrBands(plan, th.lthr) : plan.hrTransition;
}

export function zoneBand(plan, th, key, week){
  return hrBands(plan, th, week).find(b => b.key === key) || null;
}

export function bandRange(b){
  if(!b) return '';
  if(b.max >= 999) return 'über ' + b.min + ' bpm';
  return b.min + '–' + b.max + ' bpm';
}

/* "Z2 128-142 bpm" - eine Stelle, an der die Zahlen stehen. Vorher waren die
   bpm-Werte in ein Dutzend Textbausteine einkopiert und liefen bei jeder
   Zonenkorrektur auseinander. */
export function zoneText(plan, th, key, week){
  const b = zoneBand(plan, th, key, week);
  return b ? key.toUpperCase() + ' ' + bandRange(b) : key.toUpperCase();
}

export function zoneSpan(plan, th, from, to, week){
  const a = zoneBand(plan, th, from, week), b = zoneBand(plan, th, to, week);
  if(!a || !b) return from.toUpperCase() + '–' + to.toUpperCase();
  return from.toUpperCase() + '–' + to.toUpperCase() + ' ' + a.min + '–' + b.max + ' bpm';
}

/* Ohne FTP null - die Anzeige laesst den Wattteil dann weg. */
export function wattText(plan, th, key){
  const z = plan.powerZones[key];
  if(!hasFtp(th) || !z) return null;
  return Math.round(th.ftp * z[0]) + '–' + Math.round(th.ftp * z[1]) + ' W';
}

export function targetText(plan, th, key, week){
  const w = wattText(plan, th, key);
  return w ? zoneText(plan, th, key, week) + ' · ' + w : zoneText(plan, th, key, week);
}

/* Trittfrequenz erst ab dem Sensor - vorher gibt es keine Messung, und
   manuelles Zaehlen ist ausdruecklich kein Bestandteil des Plans. */
export function cadenceText(plan, key, week){
  if(week < plan.cadence.fromWeek) return null;
  return plan.cadence.byZone[key] || null;
}

export function withCadence(plan, text, key, week){
  const c = cadenceText(plan, key, week);
  return c ? text + ' · ' + c : text;
}

/* Geschwindigkeit und Distanz sind Schaetzungen aus einem angenommenen
   Schnitt. Sobald Leistungsdaten vorliegen, sind sie ohne Aussagewert. */
export function showsDistance(plan, week){
  return week <= plan.speed.showUntilWeek;
}

export function estimateSpeed(plan, week){
  return Math.min(plan.speed.baseKmh + plan.speed.perWeekKmh * (week - 1), plan.speed.maxKmh);
}

export function estimateDistance(plan, minutes, week){
  return Math.round((minutes / 60) * estimateSpeed(plan, week));
}

export function distanceSuffix(plan, minutes, week){
  return showsDistance(plan, week) ? ', ca. ' + estimateDistance(plan, minutes, week) + ' km' : '';
}

/* Zonenzeit aus dem Puls-Stream.

   Ein Sample ist NICHT eine Sekunde: Garmin zeichnet variabel auf, in echten
   Daten liegen die Abstaende zwischen 1 und 17 s bei einem Mittel von gut 4 s.
   Jedes Sample gilt bis zum naechsten, gewichtet mit dem Zeitdelta. Ohne
   time-Stream bleibt eine Sekunde je Sample als Notnagel, dann stimmen zwar
   die Anteile, aber nicht die absoluten Minuten. */
export function zoneSeconds(bands, hrData, timeData, recordedSec){
  const out = {};
  for(const b of bands) out[b.key] = 0;
  let counted = 0;
  const n = hrData.length;
  const hasTime = Array.isArray(timeData) && timeData.length === n && n > 1;

  /* Takt der Aufzeichnung bestimmen, nicht annehmen. Die Uhr kann pro Sekunde
     aufzeichnen oder im intelligenten Modus mit schwankenden Abstaenden, und
     neue Sensoren koennen das erneut aendern. Der Median ist robust gegen
     einzelne Pausen. */
  let takt = null;
  if(hasTime){
    const d = [];
    for(let i = 1; i < n; i++){
      const dt = timeData[i] - timeData[i - 1];
      if(dt > 0 && dt <= 60) d.push(dt);
    }
    if(d.length){
      d.sort((a, b) => a - b);
      takt = d[Math.floor(d.length / 2)];
    }
  }

  /* Ohne Zeit-Stream aus der Aufzeichnungsdauer skalieren. Gleichmaessig statt
     exakt, trifft die Gesamtzeit aber und ist allem vorzuziehen, was still
     eine Sekunde je Messwert annimmt. */
  let fallbackDt = 1;
  let method = hasTime ? 'zeitgewichtet' : 'annahme';
  if(!hasTime && recordedSec > 0 && n > 0){
    const q = recordedSec / n;
    if(q > 0.2 && q < 60){ fallbackDt = q; method = 'skaliert'; takt = q; }
  }

  for(let i = 0; i < n; i++){
    const v = hrData[i];
    if(v == null || isNaN(v)) continue;
    let dt = fallbackDt;
    if(hasTime){
      const next = i + 1 < n ? timeData[i + 1] : null;
      dt = next == null ? (takt || 1) : next - timeData[i];
      /* Pausen und Luecken nicht als Zonenzeit durchschlagen lassen. */
      if(!(dt > 0)) dt = 0;
      if(dt > 60) dt = 60;
    }
    const band = bands.find(b => v >= b.min && v < b.max);
    if(band){ out[band.key] += dt; counted += dt; }
  }
  out._total = counted;
  out._method = method;
  out._takt = takt;
  out._samples = n;
  return out;
}
