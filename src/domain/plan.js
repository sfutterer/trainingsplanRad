/* Aus der geprueften JSON ein Modell machen.

   Die Einzeldatei-Fassung hat die Werte in zwei Dutzend Modulvariablen
   geschrieben. Das funktionierte, war aber nicht testbar: jede Funktion hing
   an globalem Zustand. Hier entsteht stattdessen ein Objekt, das
   weitergereicht wird - dieselben Zahlen, nur greifbar.

   Beweglichkeit und Koordination kommen hier als mobility und coordination an.
   Sie werden wie der Kraftteil umbenannt (image/video wird img), damit jede
   Uebungsanzeige dieselben Feldnamen liest und nicht danach unterscheiden muss,
   aus welchem Block eine Uebung stammt.

   Seit dem 15.11.2026 traegt die Datei zwei Plaene: den laufenden Plan 1 und
   unter `folgeplan` seinen Nachfolger (Plan 2, ab 07.12.2026, Woche Montag bis
   Sonntag). Beide werden hier zu je einem Modell, die einander kennen
   (`folge`, `vorgaenger`). Welcher an einem Tag gilt, entscheidet planAm in
   week.js - nie der Aufrufer.

   Rein: kein DOM, kein fetch, keine Uhr. */

import { dayFromIso } from './week.js';

/* Nach oben offene Zonen stehen in der Datei als null; intern 999, weil die
   Bandsuche mit Zahlen vergleicht. */
const OPEN_TOP = 999;

/* Seit dem 15.11.2026 traegt eine Uebung ein Video und kein Bild mehr:
   "video" ist die Kennung eines deutschsprachigen YouTube-Videos. Das Feld
   heisst im Modell weiter img - jede Anzeige liest es von dort, und
   Uebungsbild.jsx unterscheidet selbst, ob eine Videokennung oder ein
   Bildpfad dasteht. Ein eigener Plan aus der Zeit davor traegt noch "image"
   und bleibt damit gueltig. */
function medium(ex){
  return ex.video || ex.image || null;
}

function bodyExercises(list){
  return list.map(ex => ({
    key: ex.key, name: ex.name, dosage: ex.dosage, focus: ex.focus,
    img: medium(ex), steps: ex.steps, goal: ex.goal
  }));
}

/* Was beide Plaene gleich lesen: Zonen, Kadenz, Timer, Test, Koerperbloecke,
   Texte. Plan 2 erbt jeden dieser Abschnitte von Plan 1, solange er ihn nicht
   selbst nennt - siehe folgeplanJson. */
function basisModell(json){
  const hrTransition = json.heartRateZones.transitionBands.map(b => ({
    key: b.key, label: b.label,
    min: b.min, max: b.max === null ? OPEN_TOP : b.max
  }));

  const powerZones = {};
  for(const k of Object.keys(json.powerZones)){
    powerZones[k] = [json.powerZones[k].minFactor, json.powerZones[k].maxFactor];
  }

  /* Analyse und Anzeige brauchen dieselben Schluessel und Namen wie die
     Baender. Die Farbe steht bewusst nicht dabei - sie ist Darstellung und
     steht nur in theme.css (zonenFarbe in ui/components/Zonenliste.jsx). */
  const zoneKeys  = hrTransition.map(b => b.key);
  const zoneLabel = {};
  for(const b of hrTransition) zoneLabel[b.key] = b.label;

  return {
    hrTransition,
    cogganBands: json.heartRateZones.cogganBands,
    cogganFromWeek: json.heartRateZones.cogganFromWeek,
    powerZones,
    arbeitsFtp: json.arbeits_ftp || null,
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
        alternating: !!ex.alternating, img: medium(ex), steps: ex.steps, goal: ex.goal,
        stufenleiter: ex.stufenleiter || null
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
        key: ex.key, name: ex.name, perSide: !!ex.perSide, img: medium(ex),
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
       Begruendung - deshalb der Abschnitt so, wie er in der Datei steht. */
    bone: json.boneStimulus || null,

    texts: json.texts
  };
}

export function createPlan(json){
  const weeks = json.weeks;

  const phaseNames = Object.assign({}, json.phaseNames);
  phaseNames[json.winterBlock.phase] = json.winterBlock.name;

  const p1 = Object.assign(basisModell(json), {
    raw: json,
    format: 1,
    kennung: 'p1',
    /* Wie der Plan sich selbst nennt ("Fassung 13"). */
    name: json.planName,
    weekCount: weeks.length,
    recoveryWeeks: json.recoveryWeeks.slice(),
    volumeCapPercent: json.weeklyVolumeCapPercent,
    phaseNames,
    weeks,
    winterBlock: json.winterBlock,
    folge: null,
    vorgaenger: null
  });

  if(json.folgeplan){
    const p2 = createFolgeplan(json, json.folgeplan);
    p1.folge = p2;
    p2.vorgaenger = p1;
  }
  return p1;
}

/* ---- Plan 2 ---- */

/* Die Abschnitte, die Plan 2 von Plan 1 erbt, solange er sie nicht selbst
   nennt. Die Texte werden zusammengelegt statt ersetzt: Plan 2 braucht einige
   eigene Saetze, die meisten aus Plan 1 gelten weiter. */
export const ERBTEILE = ['heartRateZones', 'powerZones', 'cadenceTargets', 'speedEstimate',
  'saturdayRide', 'fridayOptional', 'intervalTimer', 'thresholdTest', 'testTaper',
  'coreCircuit', 'legBlock', 'mobilityFlow', 'coordination', 'boneStimulus', 'arbeits_ftp'];

export function folgeplanJson(json1, f){
  const m = {};
  for(const k of ERBTEILE){
    const v = f[k] !== undefined ? f[k] : json1[k];
    if(v !== undefined) m[k] = v;
  }
  m.texts = Object.assign({}, json1.texts, f.texts || {});
  return m;
}

/* Eine Schrittfolge mit Wiederholungsgruppen in eine flache Liste.

   Ohne die Gruppen stuenden die Kurzintervalle 30/15 als 78 Einzelschritte
   in der Datei - je Woche. Eine Gruppe ist
     { "wiederhole": n, "steps": [...], "zwischen": [...] }
   "zwischen" steht zwischen zwei Durchgaengen, nicht nach dem letzten: nach
   dem letzten Sprint kommt keine Sprintpause, sondern der Hauptteil.

   Wiederholte Schritte bekommen rep/reps, wie sie in Plan 1 von Hand
   dastanden, und Belastungsschritte ihren Zaehler im Namen ("Sprint 3 / 6").
   Eine innere Gruppe zaehlt selbst; die aeussere fasst ihre Schritte nicht
   noch einmal an. Die Pause zwischen zwei Serien bleibt ungezaehlt, sonst
   fasste die Tageskarte sie als "3× Serienpause" zusammen. */
export function schritteAusrollen(liste){
  const out = [];
  for(const s of (liste || [])){
    if(s && s.wiederhole > 0){
      const n = s.wiederhole;
      const direkt = (s.steps || []).some(x => x && !x.wiederhole && x.type === 'work');
      for(let i = 1; i <= n; i++){
        out.push(...schritteAusrollen(s.steps).map(x => zaehle(x, i, n)));
        if(i < n && s.zwischen){
          const z = schritteAusrollen(s.zwischen);
          out.push(...(direkt ? z.map(x => zaehle(x, i, n)) : z));
        }
      }
    } else if(s){
      out.push({ ...s });
    }
  }
  return out;
}

function zaehle(x, i, n){
  if(x.rep != null || n < 2) return x;
  const y = { ...x, rep: i, reps: n };
  if(x.type === 'work'){
    y.label = x.label + ' ' + i + ' / ' + n;
    y.short = (x.short || x.label) + ' ' + i + '/' + n;
  }
  return y;
}

function einheitAusrollen(e){
  return e && Array.isArray(e.steps) ? { ...e, steps: schritteAusrollen(e.steps) } : { ...e };
}

function tageAusrollen(tage){
  const out = {};
  for(const k of Object.keys(tage || {})){
    out[k] = (tage[k] || []).map(einheitAusrollen);
  }
  return out;
}

function createFolgeplan(json1, f){
  const merged = folgeplanJson(json1, f);
  const weeks = f.weeks.map(w => ({ ...w, tage: tageAusrollen(w.tage) }));

  const phaseNames = {};
  for(const b of f.bloecke) phaseNames[String(b.nr)] = b.name;

  const sondertage = {};
  for(const iso of Object.keys(f.sondertage || {})){
    const t = f.sondertage[iso];
    sondertage[iso] = { ...t, einheiten: (t.einheiten || []).map(einheitAusrollen) };
  }

  const kraft = f.kraft || null;

  return Object.assign(basisModell(merged), {
    raw: f,
    format: 2,
    kennung: 'p2',
    name: f.planName,
    start: dayFromIso(f.start),
    gueltigAb: dayFromIso(f.gueltigAb || f.start),
    weekCount: weeks.length,
    recoveryWeeks: f.recoveryWeeks.slice(),
    testWeekList: f.testWeeks.slice(),
    volumeCapPercent: f.weeklyVolumeCapPercent,
    phaseNames,
    bloecke: f.bloecke,
    weeks,
    fortschreibung: f.fortschreibung,
    sondertage,
    kraft: kraft && {
      ...kraft,
      uebungen: kraft.uebungen.map(ex => ({ ...ex, img: medium(ex) }))
    },
    /* Fuer alles, was in Plan 1 nach dem Ende auf den Winterblock schaut: in
       Plan 2 steht dort der Rahmen der noch nicht ausgearbeiteten Bloecke. */
    winterBlock: { phase: null, name: 'Rahmen', note: f.fortschreibung.hinweis },
    folge: null,
    vorgaenger: null
  });
}
