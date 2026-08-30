/* Aus der geprueften JSON ein Modell machen.

   Die Einzeldatei-Fassung hat die Werte in zwei Dutzend Modulvariablen
   geschrieben. Das funktionierte, war aber nicht testbar: jede Funktion hing
   an globalem Zustand. Hier entsteht stattdessen ein Objekt, das
   weitergereicht wird - dieselben Zahlen, nur greifbar.

   Beweglichkeit und Koordination kommen hier als mobility und coordination an.
   Sie werden wie der Kraftteil umbenannt (image wird img), damit jede
   Uebungsanzeige dieselben Feldnamen liest und nicht danach unterscheiden muss,
   aus welchem Block eine Uebung stammt.

   Rein: kein DOM, kein fetch, keine Uhr. */

/* Nach oben offene Zonen stehen in der Datei als null; intern 999, weil die
   Bandsuche mit Zahlen vergleicht. */
const OPEN_TOP = 999;

function bodyExercises(list){
  return list.map(ex => ({
    key: ex.key, name: ex.name, dosage: ex.dosage, focus: ex.focus,
    img: ex.image, steps: ex.steps, goal: ex.goal
  }));
}

export function createPlan(json){
  const weeks = json.weeks;

  const phaseNames = Object.assign({}, json.phaseNames);
  phaseNames[json.winterBlock.phase] = json.winterBlock.name;

  const hrTransition = json.heartRateZones.transitionBands.map(b => ({
    key: b.key, label: b.label,
    min: b.min, max: b.max === null ? OPEN_TOP : b.max
  }));

  const powerZones = {};
  for(const k of Object.keys(json.powerZones)){
    powerZones[k] = [json.powerZones[k].minFactor, json.powerZones[k].maxFactor];
  }

  /* Analyse und Anzeige brauchen dieselben Schluessel und Namen wie die
     Baender. Frueher standen sie ein zweites Mal im Code und liefen bei jeder
     Zonenkorrektur auseinander.

     Die Farbe steht bewusst nicht mehr dabei. Sie lag als Hexwert in
     plan.json und noch einmal als Token in theme.css - beide wurden benutzt,
     also hatte dieselbe Zone je nach Anzeige eine andere Farbe, und die
     Fassung aus plan.json folgte dem Dunkelmodus nicht. Welche Farbe eine
     Zone traegt, ist Darstellung und keine Trainingsvorgabe; sie steht jetzt
     nur noch in theme.css, nachgeschlagen in ui/zonenfarbe.js. */
  const zoneKeys  = hrTransition.map(b => b.key);
  const zoneLabel = {};
  for(const b of hrTransition) zoneLabel[b.key] = b.label;

  return {
    raw: json,
    weekCount: weeks.length,
    recoveryWeeks: json.recoveryWeeks.slice(),
    volumeCapPercent: json.weeklyVolumeCapPercent,
    phaseNames,
    weeks,
    winterBlock: json.winterBlock,

    hrTransition,
    cogganBands: json.heartRateZones.cogganBands,
    cogganFromWeek: json.heartRateZones.cogganFromWeek,
    powerZones,
    zoneKeys, zoneLabel,

    cadence: json.cadenceTargets,
    speed: json.speedEstimate,
    saturdayRide: json.saturdayRide,
    fridayOptional: json.fridayOptional,

    interval: json.intervalTimer,
    thresholdTest: json.thresholdTest,
    testTaper: json.testTaper,

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
      sorenessNote: json.legBlock.sorenessNote,
      sorenessWarning: json.legBlock.sorenessWarning,
      sorenessLevels: json.legBlock.sorenessLevels,
      exercises: json.legBlock.exercises.map(ex => ({
        key: ex.key, name: ex.name, perSide: !!ex.perSide, img: ex.image,
        steps: ex.steps, why: ex.why, progression: ex.progression, goal: ex.goal
      }))
    },

    mobility: {
      durationHint: json.mobilityFlow.durationHint,
      placement: json.mobilityFlow.placement,
      scope: json.mobilityFlow.scope,
      note: json.mobilityFlow.note,
      exercises: bodyExercises(json.mobilityFlow.exercises)
    },

    coordination: {
      everyNthDay: json.coordination.everyNthDay,
      durationHint: json.coordination.durationHint,
      placement: json.coordination.placement,
      scope: json.coordination.scope,
      progression: json.coordination.progression,
      exercises: bodyExercises(json.coordination.exercises)
    },

    /* Der Knochenreiz ist keine Uebungsliste, sondern eine einzige Vorgabe mit
       Begruendung - deshalb keine Umbenennung wie bei den drei Bloecken
       darueber, sondern der Abschnitt so, wie er in der Datei steht. */
    bone: json.boneStimulus || null,

    texts: json.texts
  };
}
