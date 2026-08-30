/* Pruefung von plan.json.

   Uebernommen aus der Einzeldatei-Fassung, in der Sache unveraendert: die
   Meldungen nennen das beanstandete Feld im Klartext. Wer den Plan bearbeitet,
   soll die Stelle finden, ohne den Code zu lesen.

   Beweglichkeit und Koordination werden mit demselben Helfer geprueft wie der
   Kraftteil, obwohl sie inhaltlich neben dem Radplan stehen: die Uebungen haben
   dieselbe Gestalt (Schluessel, Name, Bild, Schritte, Ziel), und eine zweite
   Pruefroutine daneben wuerde bei jeder Aenderung auseinanderlaufen.

   Rein: kein DOM, kein fetch. Das Laden steht in data/planSource.js. */

export const PLAN_SCHEMA_VERSION = 1;

const PV_ZONE_KEYS = ['unter','z1','z2','z3','z4','z5'];

function pvNum(err, wert, feld, opt){
  opt = opt || {};
  if(typeof wert !== 'number' || !isFinite(wert)){
    err.push(feld + ' fehlt oder ist keine Zahl.');
    return false;
  }
  if(opt.min != null && wert < opt.min){
    err.push(feld + ' ist ' + wert + ', erlaubt ist mindestens ' + opt.min + '.');
    return false;
  }
  if(opt.int && Math.round(wert) !== wert){
    err.push(feld + ' muss eine ganze Zahl sein, ist aber ' + wert + '.');
    return false;
  }
  return true;
}

function pvStr(err, wert, feld){
  if(typeof wert !== 'string' || !wert.trim()){
    err.push(feld + ' fehlt oder ist kein Text.');
    return false;
  }
  return true;
}

function pvArr(err, wert, feld, minLen){
  minLen = minLen || 1;
  if(!Array.isArray(wert) || wert.length < minLen){
    err.push(feld + ' fehlt oder enthält weniger als ' + minLen + ' Einträge.');
    return false;
  }
  return true;
}

function pvObj(err, wert, feld){
  if(!wert || typeof wert !== 'object' || Array.isArray(wert)){
    err.push(feld + ' fehlt oder ist kein Objekt.');
    return false;
  }
  return true;
}

/* Pulsbaender muessen lueckenlos aufsteigen: die Obergrenze der einen Zone ist die
   Untergrenze der naechsten. Sonst faellt ein Messwert in kein Band und
   verschwindet stillschweigend aus der Zonenauswertung. */
function pvBands(err, bands, feld, minKey, maxKey){
  if(!pvArr(err, bands, feld, 2)) return;
  let prev = 0;
  bands.forEach((b, i) => {
    const f = feld + '[' + i + ']';
    if(!pvObj(err, b, f)) return;
    pvStr(err, b.key, f + '.key');
    pvStr(err, b.label, f + '.label');
    const lo = b[minKey], hi = b[maxKey];
    if(!pvNum(err, lo, f + '.' + minKey, {min:0})) return;
    const offen = hi === null;
    if(!offen && !pvNum(err, hi, f + '.' + maxKey, {min:0})) return;
    if(!offen && !(hi > lo)){
      err.push(f + '.' + maxKey + ' (' + hi + ') muss größer sein als ' + minKey + ' (' + lo + ').');
    }
    if(offen && i !== bands.length - 1){
      err.push(f + '.' + maxKey + ' darf nur in der obersten Zone offen (null) sein.');
    }
    if(lo !== prev){
      err.push(f + '.' + minKey + ' ist ' + lo + ', muss aber lückenlos an die Zone darunter anschließen (' + prev + ').');
    }
    prev = offen ? lo : hi;
  });
  const letzte = bands[bands.length - 1];
  if(letzte && letzte[maxKey] !== null){
    err.push(feld + ': die oberste Zone muss nach oben offen sein (' + maxKey + ': null).');
  }
  const da = bands.map(b => b && b.key);
  PV_ZONE_KEYS.forEach(k => {
    if(da.indexOf(k) < 0) err.push(feld + ': die Zone "' + k + '" fehlt.');
  });
}

function pvThursday(err, t, feld, zonen){
  if(!pvObj(err, t, feld)) return;
  pvStr(err, t.title, feld + '.title');
  if(zonen.indexOf(t.zone) < 0){
    err.push(feld + '.zone ist "' + t.zone + '" – erlaubt sind ' + zonen.join(', ') + '.');
  }
  if(t.kind === 'intervals'){
    pvNum(err, t.reps, feld + '.reps', {min:1, int:true});
    pvNum(err, t.workMinutes, feld + '.workMinutes', {min:0});
    pvNum(err, t.restMinutes, feld + '.restMinutes', {min:0});
    if(t.power != null && typeof t.power !== 'string'){
      err.push(feld + '.power muss ein Text oder null sein.');
    }
  } else if(t.kind === 'z2' || t.kind === 'test'){
    pvNum(err, t.minutes, feld + '.minutes', {min:0});
  } else {
    err.push(feld + '.kind ist "' + t.kind + '" – erlaubt sind "intervals", "z2" und "test".');
  }
}

function pvBlocks(err, b, feld){
  if(b === null || b === undefined) return;
  if(!pvObj(err, b, feld)) return;
  pvNum(err, b.reps, feld + '.reps', {min:1, int:true});
  pvNum(err, b.minutes, feld + '.minutes', {min:1});
  pvNum(err, b.restMinutes, feld + '.restMinutes', {min:0});
}

/* Beweglichkeit und Koordination: gleiche Uebungsgestalt wie im Kraftteil, nur
   ohne Dosierung je Phase - die Dosierung steht als Text an der Uebung, weil
   diese Bloecke an keiner Trainingswoche haengen. Die Schluessel muessen trotzdem
   eindeutig sein, sonst ueberschreiben sich zwei Uebungen in jeder Liste, die
   nach key sucht. */
function pvBodyBlock(err, b, feld){
  if(!pvObj(err, b, feld)) return;
  pvStr(err, b.durationHint, feld + '.durationHint');
  pvStr(err, b.placement, feld + '.placement');
  pvStr(err, b.scope, feld + '.scope');
  const keys = [];
  if(!pvArr(err, b.exercises, feld + '.exercises', 1)) return;
  b.exercises.forEach((ex, i) => {
    const f = feld + '.exercises[' + i + ']';
    if(!pvObj(err, ex, f)) return;
    pvStr(err, ex.key, f + '.key');
    pvStr(err, ex.name, f + '.name');
    pvStr(err, ex.dosage, f + '.dosage');
    pvStr(err, ex.focus, f + '.focus');
    pvStr(err, ex.image, f + '.image');
    pvStr(err, ex.goal, f + '.goal');
    if(pvArr(err, ex.steps, f + '.steps', 1)){
      ex.steps.forEach((s, k) => pvStr(err, s, f + '.steps[' + k + ']'));
    }
    if(keys.indexOf(ex.key) >= 0) err.push(f + '.key "' + ex.key + '" kommt doppelt vor.');
    keys.push(ex.key);
  });
}

/* Pflichttexte. Ein fehlender Textbaustein wuerde sonst als "undefined" in einer
   Tageskarte landen - unauffaellig genug, um lange uebersehen zu werden. */
const PV_TEXT_KEYS = ['wellnessRule','mondayRest','tuesdayCommute','wednesdayMinimum',
  'wednesdayEasyDefault','wednesdayEasyPhase3','wednesdayNoRide','thursdayTest',
  'thursdayBaseDay','thursdayNoTimer','thursdayIntervalTail','saturdayRecovery','saturdayPureZ2',
  'sundayLegOrder','sundayRideFirst','legNoTimer','legTempo','legTempoPlain',
  'legPerSideNote','legAbortSigns',
  'legProgression','legWednesdayNote','coreAbortRule','zoneNoteTransition',
  'zoneNoteCoggan','thresholdTestSummary','intervalRollingStart','intervalRecoveryWeek',
  'elevationShort','cadencePyramid','mobilityScope'];

/* Die Schluessel der obersten Ebene, die es geben darf.

   documentation steht mit in der Liste: die App liest den Block nicht, aber er
   gehoert in die Datei, und ohne diesen Eintrag waere er ein Verstoss. */
const PV_TOP_KEYS = [
  'schemaVersion', 'planName', 'documentation',
  'recoveryEveryNthWeek', 'phaseNames', 'weeks', 'winterBlock',
  'heartRateZones', 'powerZones', 'cadenceTargets', 'speedEstimate',
  'saturdayRide', 'fridayOptional', 'intervalTimer', 'thresholdTest',
  'coreCircuit', 'legBlock', 'mobilityFlow', 'coordination', 'texts'
];

export function planValidate(p){
  const err = [];
  if(!pvObj(err, p, 'plan.json')) return err;

  if(p.schemaVersion !== PLAN_SCHEMA_VERSION){
    err.push('schemaVersion ist ' + JSON.stringify(p.schemaVersion) +
             ', diese App liest Fassung ' + PLAN_SCHEMA_VERSION + '.');
    return err;
  }

  /* Ein Schluessel zu viel ist fast immer ein Tippfehler in einem, den es
     geben sollte. Vorher fiel er stillschweigend durch: "saturdayBlock" statt
     "saturdayBlocks" wurde verworfen, und die App rechnete mit dem
     Standardwert weiter - genau das, was der Grundsatz "lieber gar keine Zahl
     als eine falsche" ausschliessen soll.

     Gemeldet wird nur die oberste Ebene. Tiefer wuerde die Pruefung zu einem
     zweiten Schema neben diesem hier, und dort faengt die Pflichtfeldpruefung
     einen Tippfehler ohnehin: wer "minutes" falsch schreibt, dem fehlt
     "minutes". */
  for(const k of Object.keys(p)){
    if(PV_TOP_KEYS.indexOf(k) < 0){
      err.push('„' + k + '" kennt diese Fassung der App nicht – Tippfehler? ' +
               'Erlaubt sind: ' + PV_TOP_KEYS.join(', ') + '.');
    }
  }

  pvNum(err, p.recoveryEveryNthWeek, 'recoveryEveryNthWeek', {min:2, int:true});
  pvObj(err, p.phaseNames, 'phaseNames');

  /* Zonen zuerst: die Wochen verweisen mit ihren Zonenschluesseln darauf. */
  if(pvObj(err, p.heartRateZones, 'heartRateZones')){
    pvNum(err, p.heartRateZones.cogganFromWeek, 'heartRateZones.cogganFromWeek', {min:1, int:true});
    pvBands(err, p.heartRateZones.transitionBands, 'heartRateZones.transitionBands', 'min', 'max');
    pvBands(err, p.heartRateZones.cogganBands, 'heartRateZones.cogganBands', 'minFactor', 'maxFactor');
  }

  /* Leistungszonen sind nach Coggan bewusst nicht lueckenlos (Z1 bis 55 %,
     Z2 ab 56 %). Geprueft wird deshalb nur, dass sie aufsteigen. */
  if(pvObj(err, p.powerZones, 'powerZones')){
    let voriges = -1;
    ['z1','z2','z3','z4','z5'].forEach(k => {
      const f = 'powerZones.' + k;
      const z = p.powerZones[k];
      if(!pvObj(err, z, f)) return;
      if(!pvNum(err, z.minFactor, f + '.minFactor', {min:0})) return;
      if(!pvNum(err, z.maxFactor, f + '.maxFactor', {min:0})) return;
      if(!(z.maxFactor > z.minFactor)){
        err.push(f + '.maxFactor (' + z.maxFactor + ') muss größer sein als minFactor (' + z.minFactor + ').');
      }
      if(z.minFactor < voriges){
        err.push(f + '.minFactor (' + z.minFactor + ') liegt unter der Obergrenze der Zone darunter (' + voriges + ').');
      }
      voriges = z.maxFactor;
    });
  }

  const zonen = PV_ZONE_KEYS.slice();

  /* Wochen: fortlaufend ab 1, ohne Luecke, jede mit allen Pflichtfeldern.
     Weil alles zu einer Woche in einem Objekt steht, kann sich nichts
     gegeneinander verschieben - der fruehere Fehlerfall ungleich langer
     Reihen ist damit strukturell ausgeschlossen. */
  if(pvArr(err, p.weeks, 'weeks', 1)){
    p.weeks.forEach((w, i) => {
      const f = 'weeks[' + i + ']';
      if(!pvObj(err, w, f)) return;
      if(w.week !== i + 1){
        err.push(f + '.week ist ' + JSON.stringify(w.week) + ', erwartet ' + (i + 1) +
                 ' – die Wochen müssen lückenlos ab 1 aufsteigen.');
      }
      const name = f + ' (Woche ' + (i + 1) + ')';
      if(pvNum(err, w.phase, name + '.phase', {min:1, int:true})){
        if(p.phaseNames && !p.phaseNames[String(w.phase)]){
          err.push(name + '.phase ist ' + w.phase + ', dazu fehlt ein Eintrag in phaseNames.');
        }
      }
      ['tuesdayMinutes','wednesdayMinutes','saturdayMinutes','sundayOptionalMinutes',
       'coreWorkSeconds','coreRestSeconds'].forEach(k => {
        pvNum(err, w[k], name + '.' + k, {min:0, int:true});
      });
      pvNum(err, w.coreRounds, name + '.coreRounds', {min:1, int:true});
      pvNum(err, w.legRounds, name + '.legRounds', {min:0, int:true});
      pvThursday(err, w.thursday, name + '.thursday', zonen);
      pvBlocks(err, w.saturdayBlocks, name + '.saturdayBlocks');
    });
  }

  if(pvObj(err, p.winterBlock, 'winterBlock')){
    pvNum(err, p.winterBlock.phase, 'winterBlock.phase', {min:1, int:true});
    pvStr(err, p.winterBlock.name, 'winterBlock.name');
    pvStr(err, p.winterBlock.note, 'winterBlock.note');
    pvThursday(err, p.winterBlock.thursday, 'winterBlock.thursday', zonen);
    pvBlocks(err, p.winterBlock.saturdayBlocks, 'winterBlock.saturdayBlocks');
  }

  if(pvObj(err, p.cadenceTargets, 'cadenceTargets')){
    pvNum(err, p.cadenceTargets.fromWeek, 'cadenceTargets.fromWeek', {min:1, int:true});
    pvObj(err, p.cadenceTargets.byZone, 'cadenceTargets.byZone');
  }

  if(pvObj(err, p.speedEstimate, 'speedEstimate')){
    pvNum(err, p.speedEstimate.showUntilWeek, 'speedEstimate.showUntilWeek', {min:0, int:true});
    pvNum(err, p.speedEstimate.baseKmh, 'speedEstimate.baseKmh', {min:1});
    pvNum(err, p.speedEstimate.perWeekKmh, 'speedEstimate.perWeekKmh', {min:0});
    pvNum(err, p.speedEstimate.maxKmh, 'speedEstimate.maxKmh', {min:1});
  }

  if(pvObj(err, p.saturdayRide, 'saturdayRide')){
    pvNum(err, p.saturdayRide.warmupMinutes, 'saturdayRide.warmupMinutes', {min:0});
    pvNum(err, p.saturdayRide.cooldownMinutes, 'saturdayRide.cooldownMinutes', {min:0});
  }

  if(pvObj(err, p.fridayOptional, 'fridayOptional')){
    pvNum(err, p.fridayOptional.minMinutes, 'fridayOptional.minMinutes', {min:0, int:true});
    pvNum(err, p.fridayOptional.maxMinutes, 'fridayOptional.maxMinutes', {min:0, int:true});
    pvNum(err, p.fridayOptional.targetMinutes, 'fridayOptional.targetMinutes', {min:0, int:true});
    if(zonen.indexOf(p.fridayOptional.zone) < 0){
      err.push('fridayOptional.zone ist "' + p.fridayOptional.zone + '" – erlaubt sind ' + zonen.join(', ') + '.');
    }
  }

  if(pvObj(err, p.intervalTimer, 'intervalTimer')){
    pvNum(err, p.intervalTimer.prepSeconds, 'intervalTimer.prepSeconds', {min:0, int:true});
    pvNum(err, p.intervalTimer.warmupMinutes, 'intervalTimer.warmupMinutes', {min:0});
    pvNum(err, p.intervalTimer.cooldownMinutes, 'intervalTimer.cooldownMinutes', {min:0});
  }

  /* Der Schwellentest ist eine feste Schrittfolge. "z12" ist der Einfahrbereich
     Z1-Z2 und deshalb hier zusaetzlich erlaubt. */
  if(pvObj(err, p.thresholdTest, 'thresholdTest') && pvArr(err, p.thresholdTest.steps, 'thresholdTest.steps', 1)){
    p.thresholdTest.steps.forEach((s, i) => {
      const f = 'thresholdTest.steps[' + i + ']';
      if(!pvObj(err, s, f)) return;
      if(['warm','work','rest','cool'].indexOf(s.type) < 0){
        err.push(f + '.type ist "' + s.type + '" – erlaubt sind "warm", "work", "rest" und "cool".');
      }
      pvStr(err, s.label, f + '.label');
      pvStr(err, s.short, f + '.short');
      const hatMin = typeof s.minutes === 'number';
      const hatSek = typeof s.seconds === 'number';
      if(hatMin === hatSek){
        err.push(f + ' braucht genau eine Dauerangabe: entweder "minutes" oder "seconds".');
      } else if(hatMin){
        pvNum(err, s.minutes, f + '.minutes', {min:0});
      } else {
        pvNum(err, s.seconds, f + '.seconds', {min:0, int:true});
      }
      if(zonen.indexOf(s.zone) < 0 && s.zone !== 'z12'){
        err.push(f + '.zone ist "' + s.zone + '" – erlaubt sind ' + zonen.join(', ') + ' und z12.');
      }
    });
  }

  if(pvObj(err, p.coreCircuit, 'coreCircuit')){
    pvNum(err, p.coreCircuit.prepSeconds, 'coreCircuit.prepSeconds', {min:0, int:true});
    pvNum(err, p.coreCircuit.roundRestSeconds, 'coreCircuit.roundRestSeconds', {min:0, int:true});
    pvNum(err, p.coreCircuit.wednesdayRounds, 'coreCircuit.wednesdayRounds', {min:1, int:true});
    if(pvArr(err, p.coreCircuit.exercises, 'coreCircuit.exercises', 1)){
      p.coreCircuit.exercises.forEach((ex, i) => {
        const f = 'coreCircuit.exercises[' + i + ']';
        if(!pvObj(err, ex, f)) return;
        pvStr(err, ex.name, f + '.name');
        pvStr(err, ex.goal, f + '.goal');
        pvStr(err, ex.image, f + '.image');
        pvArr(err, ex.steps, f + '.steps', 1);
        if(ex.mode === 'reps'){
          pvNum(err, ex.tempoSeconds, f + '.tempoSeconds', {min:1, int:true});
        } else if(ex.mode !== 'hold'){
          err.push(f + '.mode ist "' + ex.mode + '" – erlaubt sind "reps" und "hold".');
        }
      });
    }
  }

  if(pvObj(err, p.legBlock, 'legBlock')){
    pvNum(err, p.legBlock.restBetweenExercisesSeconds, 'legBlock.restBetweenExercisesSeconds', {min:0, int:true});
    pvNum(err, p.legBlock.restBetweenRoundsSeconds, 'legBlock.restBetweenRoundsSeconds', {min:0, int:true});
    pvStr(err, p.legBlock.durationHint, 'legBlock.durationHint');
    pvStr(err, p.legBlock.shortList, 'legBlock.shortList');
    const keys = [];
    if(pvArr(err, p.legBlock.exercises, 'legBlock.exercises', 1)){
      p.legBlock.exercises.forEach((ex, i) => {
        const f = 'legBlock.exercises[' + i + ']';
        if(!pvObj(err, ex, f)) return;
        pvStr(err, ex.key, f + '.key');
        pvStr(err, ex.name, f + '.name');
        pvStr(err, ex.why, f + '.why');
        pvStr(err, ex.progression, f + '.progression');
        pvStr(err, ex.goal, f + '.goal');
        pvStr(err, ex.image, f + '.image');
        pvArr(err, ex.steps, f + '.steps', 1);
        if(keys.indexOf(ex.key) >= 0) err.push(f + '.key "' + ex.key + '" kommt doppelt vor.');
        keys.push(ex.key);
      });
    }
    /* Fuer jede Phase muss zu jeder Uebung eine Spanne stehen, sonst zeigt der
       Beinblock in genau einer Phase kein Wiederholungsziel. */
    if(pvObj(err, p.legBlock.doseByPhase, 'legBlock.doseByPhase') && p.phaseNames){
      Object.keys(p.phaseNames).forEach(phase => {
        const f = 'legBlock.doseByPhase["' + phase + '"]';
        const d = p.legBlock.doseByPhase[phase];
        if(!pvObj(err, d, f)) return;
        keys.forEach(k => {
          const s = d[k];
          if(!Array.isArray(s) || s.length !== 2 ||
             typeof s[0] !== 'number' || typeof s[1] !== 'number'){
            err.push(f + '.' + k + ' fehlt oder ist keine Spanne aus zwei Zahlen, z. B. [8, 10].');
          } else if(s[0] > s[1]){
            err.push(f + '.' + k + ': der untere Wert (' + s[0] + ') liegt über dem oberen (' + s[1] + ').');
          }
        });
      });
    }
  }

  pvBodyBlock(err, p.mobilityFlow, 'mobilityFlow');
  if(p.mobilityFlow) pvStr(err, p.mobilityFlow.note, 'mobilityFlow.note');

  pvBodyBlock(err, p.coordination, 'coordination');
  if(p.coordination){
    pvNum(err, p.coordination.everyNthDay, 'coordination.everyNthDay', {min:1, int:true});
    if(pvArr(err, p.coordination.progression, 'coordination.progression', 1)){
      p.coordination.progression.forEach((s, i) => {
        pvStr(err, s, 'coordination.progression[' + i + ']');
      });
    }
  }

  if(pvObj(err, p.texts, 'texts')){
    PV_TEXT_KEYS.forEach(k => pvStr(err, p.texts[k], 'texts.' + k));
  }

  return err;
}
