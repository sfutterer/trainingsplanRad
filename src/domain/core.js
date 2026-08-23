/* Rumpf-Zirkel und Beinblock.

   Der Zirkel laeuft gegen die Uhr, der Beinblock gegen Wiederholungen. Das ist
   kein Zufall: eine Kniebeuge mit 3 s Absenken laesst sich nicht gegen einen
   Timer fahren, ohne genau das Tempo zu verlieren, das den Reiz ausmacht. */

import { weekIndex, phaseOf, isRecoveryWeek } from './week.js';

export function coreWorkSeconds(plan, week){ return plan.weeks[weekIndex(plan, week)].coreWorkSeconds; }
export function coreRestSeconds(plan, week){ return plan.weeks[weekIndex(plan, week)].coreRestSeconds; }
export function coreRounds(plan, week){     return plan.weeks[weekIndex(plan, week)].coreRounds; }
export function legRounds(plan, week){      return plan.weeks[weekIndex(plan, week)].legRounds; }

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

/* Woraus die Krafteinheit eines Tages besteht.

   Wie viele Teile ein Tag hat, ist eine Planregel und keine Frage des Layouts.
   Bisher stand sie zweimal im Code: hier als Rundenzahl des Zirkels, in der
   Anzeige noch einmal als eigene Abfrage auf den Wochentag. Zwei Haelften
   derselben Regel an zwei Orten laufen frueher oder spaeter auseinander. */
export function strengthParts(plan, week, dow){
  const teile = [{ key:'core', rounds: coreRoundsForDay(plan, week, dow), verkuerzt: dow === 3 }];
  if(dow !== 3) teile.push({ key:'leg', rounds: legRounds(plan, week) });
  return teile;
}

export function hasLegBlock(plan, week, dow){
  return strengthParts(plan, week, dow).some(t => t.key === 'leg');
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

/* In Erholungswochen gilt der untere Rand der laufenden Phase - deshalb steht
   in plan.json eine Spanne und keine feste Zahl. */
export function legDose(plan, week){
  const phase = Math.min(phaseOf(plan, week), 4);
  const base = plan.legs.doseByPhase[String(phase)] || plan.legs.doseByPhase['4'];
  if(!isRecoveryWeek(plan, week)) return base;
  const low = span => [span[0], span[0]];
  return {
    squat: low(base.squat), split: low(base.split), calf: low(base.calf),
    extra: base.extra
  };
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
