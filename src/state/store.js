/* Zustand als Signals.

   Signals statt Context: der Timer aktualisiert die Sekundenanzeige viermal
   pro Sekunde. Mit Signals wird genau der Textknoten ausgetauscht, ohne dass
   ein Komponentenbaum neu berechnet und verglichen wird. Bei einer App, die
   waehrend des Trainings minutenlang laeuft, ist das der Unterschied. */

import { signal, computed } from '@preact/signals';
import { createRepos, KEYS } from '../data/storage.js';
import { loadPlan, parsePlan, PlanError } from '../data/planSource.js';
import { toMidnight, isoDayLocal, weekNumberFor } from '../domain/week.js';
import * as platform from '../platform/index.js';
import { theme } from './theme.js';
import { initAuth, profilSpeicher } from './auth.js';

/* Nicht mehr direkt auf localStorage, sondern auf den Profiladapter: er stellt
   jedem Schluessel den Praefix des angemeldeten Profils voran. Fuer alles
   darunter aendert sich nichts - createRepos und jeder Aufrufer sehen
   weiterhin "core-session-log". */
export const store = createRepos(profilSpeicher);

/* --- Kern --- */
export const plan        = signal(null);   // normalisiertes Modell
export const planJson    = signal(null);   // Rohfassung, fuer den Export
export const planSource  = signal('default');
export const planError   = signal(null);
export const startDate   = signal(null);
export const thresholds  = signal({ ftp:null, lthr:null, hrmax:null });
export const apiKey      = signal('');
export const mapKey      = signal('');   // Thunderforest, fuer OpenCycleMap
export const coreLog     = signal([]);
export const testLog     = signal([]);
export const interimLog  = signal([]);
/* Was zu einem Testtermin notiert wurde, bevor er stattfand - vor allem die
   Zielleistung aus dem Tempotest. Schluessel ist das Datum des Tests. */
export const testPrep    = signal({});
/* Welche Variante an einem Tag gilt: ISO-Tag auf Kennung, 'regel' fuer die
   ausdrueckliche Abwahl, kein Eintrag fuer unentschieden. */
export const varianten   = signal({});
/* Die Voreinstellungen stehen einmal da und nicht zweimal.

   Bis hierher trug das Signal eine Fassung ohne `theme` und boot() eine
   zweite mit - wer die App vor dem Ende von boot() ansah, bekam ein
   undefiniertes Thema. Zwei Voreinstellungen fuer dieselbe Sache laufen
   auseinander, und diese beiden waren es schon. */
const SETTINGS_DEFAULT = Object.freeze({
  voice: true, keepAwake: true, showIllu: true, theme: 'system', mapStyle: 'atlas'
});

export const settings    = signal({ ...SETTINGS_DEFAULT });
export const tab         = signal('plan');
export const ready       = signal(false);

/* Der Tag wechselt, waehrend die App offen ist - eine PWA laeuft ueber Nacht
   weiter. Ein Signal statt new Date() an dreissig Stellen. */
export const today = signal(toMidnight(new Date()));

/* Beginn der ersten Trainingswoche. Fester Tag statt "eine Woche vor heute":
   der Plan haengt an einem echten Datum, nicht an dem Tag, an dem die App
   zufaellig zum ersten Mal geoeffnet wird. Die Trainingswoche beginnt samstags. */
export const PLAN_START_DEFAULT = '2026-08-15';

export const week = computed(() => {
  if(!startDate.value) return 1;
  return Math.max(weekNumberFor(today.value, startDate.value), 1);
});

export async function boot(){
  /* Ganz zuerst, noch vor dem Plan: erst wenn feststeht, welches Profil aktiv
     ist, zeigt der Speicher auf den richtigen Bestand. Ein eigener Plan
     gehoert dem Profil wie alles andere auch - laedt man ihn vorher, bekommt
     jedes Profil den Plan dessen, der zuletzt einen importiert hat. */
  await initAuth();

  /* Plan zuerst: ohne ihn zeigt die App nichts an. */
  try {
    const r = await loadPlan(store);
    plan.value = r.plan;
    planJson.value = r.json;
    planSource.value = r.source;

    /* Wurde ein eigener Plan auf die neue Fassung gehoben, wandert die
       gehobene Datei einmal in den Speicher zurueck.

       Ohne das laege dort dauerhaft die alte Fassung, und die Migration
       muesste sie bei jedem Start erneut heben - eine Migration, die nie
       fertig wird, ist eine, die man nicht mehr entfernen kann. Fuer den
       Default aus dem Repo gilt das nicht: er wird bei jedem Start neu
       geholt und gehoert nicht dem Geraet. */
    if(r.source === 'override' && r.gehoben) await store.setPlanOverride(r.json);
  } catch(e){
    planError.value = e instanceof PlanError ? e : new PlanError(e.message, []);
    ready.value = true;
    return;
  }

  let sd = await store.startDate();
  if(!sd){
    sd = PLAN_START_DEFAULT;
    await store.setStartDate(sd);
  }
  startDate.value = toMidnight(new Date(sd));

  thresholds.value = await store.thresholds();
  apiKey.value     = await store.apiKey();
  mapKey.value     = await store.mapKey();
  coreLog.value    = await store.coreLog();
  testLog.value    = await store.testLog();
  interimLog.value = await store.interimLog();
  testPrep.value   = await store.testPrep();
  varianten.value  = await store.varianten();
  settings.value   = Object.assign({}, SETTINGS_DEFAULT, await store.settings());
  theme.value      = settings.value.theme;

  platform.setKeepAwake(settings.value.keepAwake);
  platform.requestPersistentStorage();
  ready.value = true;

  /* Tageswechsel bemerken, ohne zu pollen. */
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'visible'){
      const t = toMidnight(new Date());
      if(t.getTime() !== today.value.getTime()) today.value = t;
    }
  });
}

/* --- Schreibende Aktionen. Signal und Speicher immer zusammen. --- */

export async function setStartDate(date){
  const d = toMidnight(date);
  startDate.value = d;
  await store.setStartDate(isoDayLocal(d));
}

export async function setThresholds(t){
  thresholds.value = t;
  await store.setThresholds(t);
}

export async function setApiKey(k){
  apiKey.value = k;
  await store.setApiKey(k);
}

export async function setMapKey(k){
  mapKey.value = k;
  await store.setMapKey(k);
}

export async function setSettings(patch){
  settings.value = Object.assign({}, settings.value, patch);
  await store.setSettings(settings.value);
  if('keepAwake' in patch) platform.setKeepAwake(settings.value.keepAwake);
  if('theme' in patch) theme.value = settings.value.theme;
}

export async function saveCoreLog(list){
  coreLog.value = list.slice();
  await store.setCoreLog(coreLog.value);
}

export async function addTestEntry(entry){
  testLog.value = testLog.value.concat([entry]);
  await store.setTestLog(testLog.value);
}

export async function addInterimEntry(entry){
  interimLog.value = interimLog.value.concat([entry]);
  await store.setInterimLog(interimLog.value);
}

export async function setVariante(tagIso, kennung){
  if(!tagIso) return;
  varianten.value = { ...varianten.value, [tagIso]: kennung };
  await store.setVarianten(varianten.value);
}

/* Die Notiz zu einem Testtermin ergaenzen, nicht ersetzen: der Tempotest
   traegt die Zielleistung ein, das Go/No-Go am Testmorgen seine Haken. */
export async function setTestPrep(schluessel, patch){
  if(!schluessel) return;
  const alt = testPrep.value[schluessel] || {};
  testPrep.value = { ...testPrep.value, [schluessel]: { ...alt, ...patch } };
  await store.setTestPrep(testPrep.value);
}

/* --- Eigener Plan --- */

export async function applyPlanOverride(roh){
  /* Wirft, wenn die Datei nicht taugt - der laufende Plan bleibt dann stehen. */
  const { plan: modell, json } = parsePlan(roh, 'importierter Plan');
  /* Gespeichert wird die gehobene Fassung, nicht die eingelesene: wer eine
     alte Datei importiert, soll sie nicht bei jedem Start erneut migriert
     bekommen - und der Export soll die Datei liefern, mit der die App
     tatsaechlich rechnet. */
  await store.setPlanOverride(json);
  plan.value = modell;
  planJson.value = json;
  planSource.value = 'override';
}

export async function resetPlanToDefault(){
  await store.clearPlanOverride();
  const r = await loadPlan(store);
  plan.value = r.plan;
  planJson.value = r.json;
  planSource.value = r.source;
}

/* Derselbe Verwurf, aber vom Fehlerbildschirm aus.

   Dort ist boot() in seinem catch-Zweig stehengeblieben: Startdatum,
   Schwellenwerte, Protokolle und Einstellungen sind nie geladen worden.
   resetPlanToDefault allein setzt zwar den Plan, laesst aber startDate auf
   null - die Wochenrechnung lieferte danach vierstellige Wochennummern.

   Deshalb ein vollstaendiger Neustart statt eines zweiten boot()-Laufs: boot
   haengt einen visibilitychange-Zuhoerer an, den ein zweiter Aufruf verdoppeln
   wuerde. Das Neuladen ist ohnehin das, was der Hinweis auf dem Bildschirm
   ankuendigt. */
export async function discardOwnPlanAndReload(){
  await store.clearPlanOverride();
  location.reload();
}

export { KEYS, PlanError, theme };
