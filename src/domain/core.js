/* Rumpf-Zirkel und Beinblock.

   Der Zirkel laeuft gegen die Uhr, der Beinblock gegen Wiederholungen. Das ist
   kein Zufall: eine Kniebeuge mit 3 s Absenken laesst sich nicht gegen einen
   Timer fahren, ohne genau das Tempo zu verlieren, das den Reiz ausmacht. */

import { weekIndex, phaseOf, isRecoveryWeek } from './week.js';

export function coreWorkSeconds(plan, week){ return plan.weeks[weekIndex(plan, week)].coreWorkSeconds; }
export function coreRestSeconds(plan, week){ return plan.weeks[weekIndex(plan, week)].coreRestSeconds; }
export function coreRounds(plan, week){     return plan.weeks[weekIndex(plan, week)].coreRounds; }
export function legRounds(plan, week){      return plan.weeks[weekIndex(plan, week)].legRounds; }

/* Die zweite Beineinheit am Dienstagabend, ab Woche 11.

   Sie steht je Woche in der Datei und nicht als Phasenregel im Code: der Grund
   fuer ihre Lage ist der Abstand zum Qualitaetstag, und der haengt daran, was
   am Donnerstag steht - nicht an der Phasennummer. In Phase 3 ist der
   Donnerstag selbst eine Z2-Einheit, damit faellt der Konflikt weg; in Phase 4
   kehrt er zurueck, deshalb dort nur die Erhaltungsdosis.

   0 heisst: an diesem Dienstag steht keine an. */
export function tuesdayLegRounds(plan, week){
  return plan.weeks[weekIndex(plan, week)].tuesdayLegRounds || 0;
}

/* Gesamtdauer des Zirkels in Minuten, damit Plan und App dieselbe Zahl nennen. */
export function coreMinutes(plan, week, rounds){
  const work = coreWorkSeconds(plan, week);
  const rest = coreRestSeconds(plan, week);
  const n = rounds || coreRounds(plan, week);
  const ex = plan.circuit.exercises.length;
  const total = n * (ex * work + (ex - 1) * rest)
              + (n - 1) * plan.circuit.roundRestSeconds
              + plan.circuit.prepSeconds;
  return Math.round(total / 60);
}

/* Sonntag volle Rundenzahl, Mittwoch fest zwei. An anderen Tagen gilt der
   Sonntagswert - dann hat jemand den Timer ausserhalb des Plans geoeffnet. */
export function coreRoundsForDay(plan, week, dow){
  return dow === 3 ? plan.circuit.wednesdayRounds : coreRounds(plan, week);
}

/* Am Dienstag gilt die zweite Einheit, sofern die Woche eine vorsieht. An
   allen uebrigen Tagen der Sonntagswert - wie beim Zirkel: wer den Block
   ausserhalb des Plans oeffnet, bekommt die Dosis des Tages, an dem er
   vorgesehen ist. */
export function legRoundsForDay(plan, week, dow){
  const di = dow === 2 ? tuesdayLegRounds(plan, week) : 0;
  return di > 0 ? di : legRounds(plan, week);
}

/* Zeit bleibt die Uhr des Zirkels, aber dynamische Uebungen bekommen ein
   Wiederholungsziel: Zeitfenster geteilt durch Tempo. So gibt es eine
   Orientierung, ohne dass man mit nassen Haenden am Bildschirm zaehlt. */
export function repTarget(ex, workSec){
  if(ex.mode !== 'reps') return null;
  let reps = Math.floor(workSec / ex.tempo);
  if(ex.alternating){
    if(reps % 2 !== 0) reps -= 1;      // gerade Zahl, damit beide Seiten gleich oft drankommen
    reps = Math.max(reps, 2);
  } else {
    reps = Math.max(reps, 1);
  }
  return { reps, perSide: ex.alternating ? reps / 2 : null, tempo: ex.tempo };
}

export function repShort(ex, workSec){
  const t = repTarget(ex, workSec);
  if(!t) return workSec + ' s halten';
  return t.perSide ? `${t.reps} Wdh. · ${t.perSide}/Seite` : `${t.reps} Wdh.`;
}

export function repLong(ex, workSec){
  const t = repTarget(ex, workSec);
  if(!t) return `Statisch halten: ${workSec} s ruhig und ohne Wackeln.`;
  return t.perSide
    ? `Ziel: ${t.reps} Wiederholungen in ${workSec} s – abwechselnd, also ${t.perSide} pro Seite. Ca. ${t.tempo} s pro Wiederholung; bei jeder Wiederholung die Seite wechseln.`
    : `Ziel: ${t.reps} Wiederholungen in ${workSec} s, ca. ${t.tempo} s pro Wiederholung. Tempo wichtiger als Anzahl.`;
}

/* ---- Beinblock ---- */

/* ---- Muskelkater ----

   Drei Stufen, weil Muskelkater in den ersten Wochen der Regelfall ist und
   nicht die Ausnahme: er kommt vom exzentrischen Absenken im Beinblock, einem
   Reiz, den das Radfahren praktisch nicht kennt. Ohne Regel dafuer gibt es nur
   zwei schlechte Antworten - voll durchziehen oder ganz ausfallen lassen.

   Die Stufen stehen in plan.json, damit die Zuordnung Stufe -> Dosis eine
   Planentscheidung bleibt und keine im Code versteckte. */
export function sorenessLevels(plan){
  return plan.legs.sorenessLevels || [];
}

export function sorenessLevel(plan, key){
  const list = sorenessLevels(plan);
  return list.find(l => l.key === key) || list[0] || null;
}

export function legSkipped(plan, key){
  const lv = sorenessLevel(plan, key);
  return !!lv && lv.dose === 'skip';
}

/* In Erholungswochen gilt der untere Rand der laufenden Phase - deshalb steht
   in plan.json eine Spanne und keine feste Zahl. Bei leichtem Muskelkater
   gilt derselbe untere Rand, aus einem anderen Grund und mit demselben
   Ergebnis: volle Runden, kleinere Zahl. */
export function legDose(plan, week, soreness){
  const phase = Math.min(phaseOf(plan, week), 4);
  const base = plan.legs.doseByPhase[String(phase)] || plan.legs.doseByPhase['4'];
  const lv = soreness === undefined ? null : sorenessLevel(plan, soreness);
  const untererRand = isRecoveryWeek(plan, week) || (lv && lv.dose !== 'full');
  if(!untererRand) return base;
  const low = span => [span[0], span[0]];
  return {
    squat: low(base.squat), split: low(base.split), calf: low(base.calf),
    extra: base.extra
  };
}

/* "1 Runde", nicht "1 Runden". Die Erhaltungsdosis am Dienstag der Phase 4 ist
   die erste Stelle im Plan, an der die Rundenzahl ueberhaupt eins sein kann. */
export function rundenText(n){
  return n + (n === 1 ? ' Runde' : ' Runden');
}

export function legRepText(ex, dose){
  const span = dose[ex.key];
  const n = span[0] === span[1] ? String(span[0]) : span[0] + '–' + span[1];
  return ex.perSide ? n + ' je Seite' : n + ' Wdh.';
}

export function legRepMin(ex, dose){
  return dose[ex.key][0];
}

/* Eine Runde gilt als voll, wenn zu jeder Uebung eine Wiederholungszahl steht.

   Die Pruefung auf eine leere Uebungsliste ist nicht kosmetisch: every() auf
   einem leeren Array liefert true, ein Tag ohne jeden Eintrag haette sonst
   alle Runden als vollstaendig gemeldet. */
export function legDoneRounds(entry){
  if(!entry || !entry.exercises || !entry.exercises.length) return 0;
  let n = 0;
  for(let r = 0; r < (entry.plannedRounds || 0); r++){
    if(entry.exercises.every(e => e.reps[r] > 0)) n += 1;
  }
  return n;
}

/* Weniger als das Ziel ist kein Fehler, sondern die Zahl, die spaeter zeigt,
   wann es zu viel war. */
export function legAborts(entry){
  if(!entry) return 0;
  return entry.exercises.reduce((n, e) =>
    n + e.reps.filter(v => v != null && v > 0 && v < e.target).length, 0);
}
