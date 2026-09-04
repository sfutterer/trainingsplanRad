/* Snackbar: eine kurze Meldung unten, die von selbst wieder geht.

   Fuer alles, was schiefgeht, ohne die Anzeige zu entwerten: Wetter nicht
   abrufbar, Untergrund nicht abrufbar, Zeitgrenze gerissen. Vorher standen
   solche Saetze als Karten unter der Auswertung - dauerhaft, obwohl sie eine
   Momentaufnahme sind, und weit unterhalb dessen, was man gerade ansieht.

   Eine Meldung zur Zeit: eine neue ersetzt die alte, statt sich anzustellen.
   Genau wie bei der Sprachausgabe - was vor zehn Sekunden schieflief, ist
   nicht mehr die Nachricht. */

import { signal } from '@preact/signals';

export const meldung = signal(null);   // { text, nr }

const MELDUNG_MS = 6000;

let uhr = null, nr = 0;

export function melde(text, ms){
  if(!text) return;
  clearTimeout(uhr);
  meldung.value = { text: String(text), nr: ++nr };
  uhr = setTimeout(() => { meldung.value = null; }, ms || MELDUNG_MS);
}

export function meldungWeg(){
  clearTimeout(uhr);
  meldung.value = null;
}
