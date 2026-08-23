/* Aus der geprueften JSON ein Modell machen.

   Die Einzeldatei-Fassung hat die Werte in zwei Dutzend Modulvariablen
   geschrieben. Das funktionierte, war aber nicht testbar: jede Funktion hing
   an globalem Zustand. Hier entsteht stattdessen ein Objekt, das
   weitergereicht wird - dieselben Zahlen, nur greifbar.

   Rein: kein DOM, kein fetch, keine Uhr. */

/* Nach oben offene Zonen stehen in der Datei als null; intern 999, weil die
   Bandsuche mit Zahlen vergleicht. */
const OPEN_TOP = 999;

export function createPlan(json){
  const weeks = json.weeks;

  const phaseNames = Object.assign({}, json.phaseNames);
  phaseNames[json.winterBlock.phase] = json.winterBlock.name;

  const hrTransition = json.heartRateZones.transitionBands.map(b => ({
    key: b.key, label: b.label,
    min: b.min, max: b.max === null ? OPEN_TOP : b.max,
    color: b.color
  }));

  const powerZones = {};
  for(const k of Object.keys(json.powerZones)){
    powerZones[k] = [json.powerZones[k].minFactor, json.powerZones[k].maxFactor];
  }

  /* Analyse und Anzeige brauchen dieselben Schluessel, Namen und Farben wie
     die Baender. Frueher standen sie ein zweites Mal im Code und liefen bei
     jeder Zonenkorrektur auseinander. */
  const zoneKeys  = hrTransition.map(b => b.key);
  const zoneLabel = {};
  const zoneColor = {};
  for(const b of hrTransition){ zoneLabel[b.key] = b.label; zoneColor[b.key] = b.color; }

  return {
    raw: json,
    weekCount: weeks.length,
    recoveryEveryNthWeek: json.recoveryEveryNthWeek,
    phaseNames,
    weeks,
    winterBlock: json.winterBlock,

    hrTransition,
    cogganBands: json.heartRateZones.cogganBands,
    cogganFromWeek: json.heartRateZones.cogganFromWeek,
    powerZones,
    zoneKeys, zoneLabel, zoneColor,

    cadence: json.cadenceTargets,
    speed: json.speedEstimate,
    saturdayRide: json.saturdayRide,
    fridayOptional: json.fridayOptional,

    interval: json.intervalTimer,
    thresholdTest: json.thresholdTest,

    circuit: {
      prepSeconds: json.coreCircuit.prepSeconds,
      roundRestSeconds: json.coreCircuit.roundRestSeconds,
      wednesdayRounds: json.coreCircuit.wednesdayRounds,
      exercises: json.coreCircuit.exercises.map(ex => ({
        name: ex.name, mode: ex.mode, tempo: ex.tempoSeconds,
        alternating: !!ex.alternating, img: ex.image, steps: ex.steps, goal: ex.goal
      }))
    },

    legs: {
      restBetweenExercisesSeconds: json.legBlock.restBetweenExercisesSeconds,
      restBetweenRoundsSeconds: json.legBlock.restBetweenRoundsSeconds,
      durationHint: json.legBlock.durationHint,
      shortList: json.legBlock.shortList,
      doseByPhase: json.legBlock.doseByPhase,
      exercises: json.legBlock.exercises.map(ex => ({
        key: ex.key, name: ex.name, perSide: !!ex.perSide, img: ex.image,
        steps: ex.steps, why: ex.why, progression: ex.progression, goal: ex.goal
      }))
    },

    texts: json.texts
  };
}
