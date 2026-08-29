/* Laeuft gerade ein Timer? Braucht die App an zwei Stellen: der
   Update-Hinweis haelt sich zurueck, und der Wake Lock haengt daran.

   Seit Beweglichkeit und Koordination einen eigenen Timer haben, koennen zwei
   gleichzeitig laufen: der Rumpfzirkel laeuft weiter, waehrend im
   Beweglichkeitsflow eine Haltezeit zaehlt. Ein einzelnes Boolean haette der
   zweite Timer beim Anhalten ueberschrieben und den laufenden Zirkel als
   gestoppt gemeldet - genau der Grund, aus dem der Flow bisher ohne Uhr
   auskam. Deshalb meldet sich jeder Timer unter eigenem Namen an; gefragt wird
   nur, ob ueberhaupt einer laeuft. */

import { signal, computed } from '@preact/signals';

const laufende = signal({});

/* Ohne den Vergleich schriebe jeder Tick ein neues Objekt ins Signal und
   loeste eine Neuzeichnung aus, obwohl sich nichts geaendert hat. */
export function meldeTimer(id, laeuft){
  if(!!laufende.value[id] === !!laeuft) return;
  laufende.value = { ...laufende.value, [id]: !!laeuft };
}

export const timerLaeuft = computed(() =>
  Object.keys(laufende.value).some(id => laufende.value[id]));
