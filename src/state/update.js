/* Die Umschaltung auf eine neue Fassung.

   Der Service Worker laeuft mit registerType 'prompt' (vite.config.js): eine
   neue Fassung wird vollstaendig installiert und wartet dann. Sie uebernimmt
   erst, wenn sie die Nachricht SKIP_WAITING bekommt - oder wenn alle Fenster
   der App geschlossen waren.

   Genau das war der Fehler bis zum 22.11.2026: der Knopf im Update-Banner
   rief location.reload(). Ein Reload gibt den Client aber nicht frei - die
   neue Seite wird sofort wieder vom alten, aktiven Worker bedient. Der
   wartende Worker wartete weiter, die App zeigte nach dem Neuladen denselben
   Stand, und das Banner kam beim naechsten Start erneut. Wer die App nicht
   zufaellig einmal ganz schloss, blieb beliebig lange auf einer alten
   Fassung - ohne Hinweis darauf, dass der Knopf nichts bewirkt hat.

   `registerSW` gibt die Funktion zurueck, die es richtig macht: sie schickt
   SKIP_WAITING, wartet auf den Wechsel (controllerchange) und laedt erst dann
   neu. Ihr Rueckgabewert wurde bisher weggeworfen; hier wird er aufgehoben.

   Ohne Service Worker - im Entwicklungsserver und bei file:// - bleibt der
   Reload die richtige Handlung, deshalb der Ersatzweg. */

let anwenden = null;

export function setUpdater(fn){
  anwenden = typeof fn === 'function' ? fn : null;
}

export async function updateAnwenden(){
  if(!anwenden){
    location.reload();
    return;
  }
  try {
    /* true heisst: nach dem Wechsel neu laden. Die Funktion kehrt dabei
       normalerweise nicht zurueck, die Seite ist dann schon unterwegs. */
    await anwenden(true);
  } catch {
    /* Schlaegt der Wechsel fehl, ist ein Reload immer noch besser als ein
       Knopf, der sichtbar nichts tut. */
    location.reload();
  }
}
