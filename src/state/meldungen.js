/* Die Meldungen hinter der Glocke: sammeln, merken, loeschen.

   Die Regeln stehen in domain/meldungen.js, hier steht nur, woher die Daten
   kommen und was mit einer verworfenen Meldung geschieht. Verworfen wird sie
   von Hand - weggewischt oder ueber "Alle verwerfen"; das blosse Ansehen
   loescht nichts.

   Geloescht wird ueber die Kennung, nicht ueber die Meldung selbst. Der Grund
   steht in domain/meldungen.js: die Liste entsteht bei jedem Start neu aus
   Plan, Wellness und Aufzeichnungen. Wuerde nur die Anzeige geleert, staende
   dieselbe Meldung nach dem naechsten Start wieder da - "einmal taeglich"
   waere dann "bei jedem Start". Gespeichert wird deshalb, was weg ist, und
   nicht, was da ist.

   Ohne intervals.icu-Schluessel bleibt die Tagesmeldung uebrig. Weder das Gate
   noch ein verpasstes Ziel liesse sich dann feststellen - und eine Glocke, die
   behauptet, alles sei erfuellt, weil sie nichts weiss, waere schlimmer als
   eine, die schweigt. */

import { signal, computed } from '@preact/signals';
import { store, plan, thresholds, startDate, today, apiKey, coreLog,
         varianten } from './store.js';
import { fetchActivities } from '../data/icu.js';
import { isoDayLocal, toMidnight, addDays } from '../domain/week.js';
import { buildReport } from '../domain/analysis.js';
import { baueMeldungen, offeneMeldungen, RUECKSCHAU_TAGE } from '../domain/meldungen.js';
import { GELESEN_MAX } from '../data/storage.js';
import { ladeWellness, wellness } from './wellness.js';

export const meldungen = signal([]);
export const meldungsZahl = computed(() => meldungen.value.length);

/* Einmal aus dem Speicher geholt und danach hier gefuehrt. Ein Profilwechsel
   laedt die Seite neu, der Zwischenspeicher kann also nicht zum falschen
   Bestand gehoeren. */
let gelesen = null;

async function gelesenListe(){
  if(!gelesen) gelesen = await store.gelesen();
  return gelesen;
}

/* Die Rueckschau ohne heute: der laufende Tag ist noch nicht vorbei, eine
   fehlende Fahrt um zehn Uhr morgens ist keine verpasste Vorgabe. */
async function rueckschau(key, heute){
  const bis = addDays(heute, -1);
  const von = addDays(heute, -RUECKSCHAU_TAGE);
  const acts = await fetchActivities(key, isoDayLocal(von), isoDayLocal(bis));
  /* Ohne zonesById bleibt die Zonenpruefung aussen vor - sie braeuchte je Fahrt
     einen eigenen Abruf der Streams. Was hier zaehlt, ist "ausgefallen" und
     "zu kurz", und das steht in Dauer und Anwesenheit. Wie hart eine Fahrt war,
     beantwortet die Analyse, wenn man sie oeffnet. */
  return buildReport(plan.value, thresholds.value, startDate.value,
                     von, bis, acts, null, coreLog.value, varianten.value);
}

export async function ladeMeldungen(){
  const p = plan.value;
  if(!p || !startDate.value) return;

  const heute = toMidnight(today.value);
  const th = thresholds.value;
  const key = apiKey.value;

  /* Wellness und Aktivitaeten nebeneinander: es sind zwei unabhaengige
     Abfragen, und die Glocke soll nach dem Start dastehen und nicht nach der
     Summe zweier Wartezeiten. Faellt eine aus, entstehen eben weniger
     Meldungen. */
  const [alt, serie, rows] = await Promise.all([
    gelesenListe(),
    key ? ladeWellness() : Promise.resolve(null),
    key ? rueckschau(key, heute).catch(() => null) : Promise.resolve(null)
  ]);

  const alle = baueMeldungen({ plan: p, th, heute, startDate: startDate.value,
                               serie: serie || wellness.value, rows,
                               wahlen: varianten.value });
  meldungen.value = offeneMeldungen(alle, alt);
}

/* Verworfen heisst weg - erst aus der Anzeige, dann aus dem Speicher. */
export async function meldungenVerwerfen(ids){
  const neu = (ids || []).filter(Boolean);
  if(!neu.length) return;

  const alt = await gelesenListe();
  const weg = new Set(alt);
  gelesen = alt.concat(neu.filter(id => !weg.has(id))).slice(-GELESEN_MAX);
  meldungen.value = offeneMeldungen(meldungen.value, gelesen);
  await store.setGelesen(gelesen);
}
