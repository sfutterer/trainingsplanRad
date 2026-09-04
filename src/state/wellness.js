/* Die Wellness-Serie fuer heute - einmal geholt, von allen gelesen.

   Vorher stellte die Plan-Ansicht diese Abfrage selbst, in einem useEffect
   mitten in Tag.jsx. Solange sie die einzige Leserin war, ging das. Mit der
   Glocke gibt es eine zweite, und zwei useEffects fuer dieselbe Antwort waeren
   zwei Abfragen bei intervals.icu - bei einem Dienst, der mit 429 bremst,
   nicht bloss unschoen.

   Der Zustand haengt an Schluessel und Tag. Wechselt einer von beiden, ist die
   alte Serie falsch und nicht bloss alt: sie verankert den Ruhepuls von heute
   auf einem anderen Datum. Deshalb wird sie dann geleert und nicht behalten.

   Fehler bleiben still. Ohne Wellness fehlt eine Zusatzaussage, die App
   funktioniert weiter - eine Fehlermeldung an der Tageskarte waere lauter als
   der Verlust. */

import { signal } from '@preact/signals';
import { apiKey, today } from './store.js';
import { fetchWellness } from '../data/icu.js';
import { isoDayLocal, toMidnight } from '../domain/week.js';
import { wellnessSerie } from '../domain/wellness.js';

/* Drei Wochen statt einer: das Gate nimmt sich daraus die letzten sieben Tage,
   der Gewichtstrend braucht mehr Punkte, um eine Steigung zu tragen. */
const WELLNESS_TAGE = 21;

export const wellness = signal(null);

let marke = null;      // Schluessel und Tag des laufenden oder fertigen Abrufs
let laufend = null;

export function ladeWellness(){
  const key = apiKey.value;
  const heuteIso = isoDayLocal(toMidnight(today.value));
  const jetzt = key + '|' + heuteIso;

  if(marke === jetzt) return laufend;
  marke = jetzt;
  wellness.value = null;

  if(!key){ laufend = Promise.resolve(null); return laufend; }

  const bis = toMidnight(new Date(heuteIso));
  const von = new Date(bis);
  von.setDate(von.getDate() - (WELLNESS_TAGE - 1));

  laufend = fetchWellness(key, isoDayLocal(von), heuteIso)
    .then(d => {
      const serie = wellnessSerie(d, heuteIso);
      /* Nur uebernehmen, wenn inzwischen kein neuer Abruf gestartet ist -
         sonst ueberschreibt eine langsame Antwort von gestern die von heute. */
      if(marke === jetzt) wellness.value = serie;
      return serie;
    })
    .catch(() => {
      /* Die Marke zuruecknehmen, damit der naechste Aufruf es erneut versucht -
         ein Funkloch beim Start darf die Serie nicht bis zum Tageswechsel
         sperren. */
      if(marke === jetzt) marke = null;
      return null;
    });

  return laufend;
}
