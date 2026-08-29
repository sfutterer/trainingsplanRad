/* Laeuft gerade ein Timer? Braucht die App an drei Stellen: der Update-Hinweis
   haelt sich zurueck, der Wake Lock haengt daran, und der Trainings-Tab zeigt
   einen Ruecksprungstreifen fuer jeden Timer, der in einem anderen Baustein
   laeuft.

   Seit Beweglichkeit und Koordination einen eigenen Timer haben, koennen
   mehrere gleichzeitig laufen: der Rumpfzirkel laeuft weiter, waehrend im
   Beweglichkeitsflow eine Haltezeit zaehlt. Ein einzelnes Boolean haette der
   zweite Timer beim Anhalten ueberschrieben und den laufenden Zirkel als
   gestoppt gemeldet - genau der Grund, aus dem der Flow bisher ohne Uhr
   auskam. Deshalb meldet sich jeder Timer unter eigenem Namen an.

   Neben dem Laufzustand steht die Restzeit im Eintrag, damit der Streifen sie
   zeigen kann, ohne an die Uhr des fremden Bausteins zu kommen. Sie wird nur
   beim Sekundenwechsel gemeldet, nicht bei jedem Takt - vier Signalschreibvorgaenge
   pro Sekunde waeren vier Neuzeichnungen fuer dieselbe Ziffer. */

import { signal, computed } from '@preact/signals';

const laufende = signal({});

/* Ohne den Vergleich schriebe jede Meldung ein neues Objekt ins Signal und
   loeste eine Neuzeichnung aus, obwohl sich nichts geaendert hat. */
export function meldeTimer(id, laeuft, info){
  const alt = laufende.value[id];
  const neu = {
    laeuft: !!laeuft,
    label:   info && info.label   != null ? info.label   : (alt ? alt.label   : id),
    segment: info && info.segment != null ? info.segment : (alt ? alt.segment : null),
    sek:     info && info.sek     != null ? info.sek     : (alt ? alt.sek     : null)
  };
  if(alt && alt.laeuft === neu.laeuft && alt.label === neu.label
        && alt.segment === neu.segment && alt.sek === neu.sek) return;
  laufende.value = { ...laufende.value, [id]: neu };
}

export const timerLaeuft = computed(() =>
  Object.keys(laufende.value).some(id => laufende.value[id].laeuft));

/* Wer laeuft gerade, mit Etikett und Restzeit. Der Trainings-Tab blendet
   daraus die Streifen, die nicht zum sichtbaren Baustein gehoeren. */
export const laufendeTimer = computed(() =>
  Object.keys(laufende.value)
    .filter(id => laufende.value[id].laeuft)
    .map(id => ({ id, ...laufende.value[id] })));
