/* Zustand als Signals.

   Signals statt Context: der Timer aktualisiert die Sekundenanzeige viermal
   pro Sekunde. Mit Signals wird genau der Textknoten ausgetauscht, ohne dass
   ein Komponentenbaum neu berechnet und verglichen wird. Bei einer App, die
   waehrend des Trainings minutenlang laeuft, ist das der Unterschied. */

import { signal, computed } from '@preact/signals';
import { localStorageAdapter, createRepos, KEYS } from '../data/storage.js';
import { loadPlan, parsePlan, PlanError } from '../data/planSource.js';
import { toMidnight, isoDayLocal, weekNumberFor } from '../domain/week.js';
import * as platform from '../platform/index.js';

export const store = createRepos(localStorageAdapter());

/* --- Kern --- */
export const plan        = signal(null);   // normalisiertes Modell
export const planJson    = signal(null);   // Rohfassung, fuer den Export
export const planSource  = signal('default');
export const planError   = signal(null);
export const startDate   = signal(null);
export const thresholds  = signal({ ftp:null, lthr:null, hrmax:null });
export const apiKey      = signal('');
export const coreLog     = signal([]);
export const testLog     = signal([]);
export const interimLog  = signal([]);
export const settings    = signal({ voice:true, keepAwake:true, showIllu:true });
export const tab         = signal('heute');
export const ready       = signal(false);

/* Der Tag wechselt, waehrend die App offen ist - eine PWA laeuft ueber Nacht
   weiter. Ein Signal statt new Date() an dreissig Stellen. */
export const today = signal(toMidnight(new Date()));

export const week = computed(() => {
  if(!startDate.value) return 1;
  return Math.max(weekNumberFor(today.value, startDate.value), 1);
});

export async function boot(){
  /* Plan zuerst: ohne ihn zeigt die App nichts an. */
  try {
    const r = await loadPlan(store);
    plan.value = r.plan;
    planJson.value = r.json;
    planSource.value = r.source;
  } catch(e){
    planError.value = e instanceof PlanError ? e : new PlanError(e.message, []);
    ready.value = true;
    return;
  }

  let sd = await store.startDate();
  if(!sd){
    /* Vorgabe: eine Woche vor heute, also Woche 1 gerade abgeschlossen. */
    const d = toMidnight(new Date());
    d.setDate(d.getDate() - 7);
    sd = isoDayLocal(d);
    await store.setStartDate(sd);
  }
  startDate.value = toMidnight(new Date(sd));

  thresholds.value = await store.thresholds();
  apiKey.value     = await store.apiKey();
  coreLog.value    = await store.coreLog();
  testLog.value    = await store.testLog();
  interimLog.value = await store.interimLog();
  settings.value   = Object.assign({ voice:true, keepAwake:true, showIllu:true }, await store.settings());

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

export async function setSettings(patch){
  settings.value = Object.assign({}, settings.value, patch);
  await store.setSettings(settings.value);
  if('keepAwake' in patch) platform.setKeepAwake(settings.value.keepAwake);
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

/* --- Eigener Plan --- */

export async function applyPlanOverride(json){
  /* Wirft, wenn die Datei nicht taugt - der laufende Plan bleibt dann stehen. */
  const modell = parsePlan(json, 'importierter Plan');
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

export { KEYS, PlanError };
