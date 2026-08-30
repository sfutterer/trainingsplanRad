/* Rueckfragen, die den Nutzer nicht mit einem Systemfenster anspringen.

   Ersetzt confirm() an fuenf Stellen: Sicherung einspielen, eigenen Plan
   verwerfen, Zwischenspeicher leeren, Gewicht nach intervals.icu schreiben.
   Die folgenreichste davon - "alle Daten auf diesem Geraet werden
   ueberschrieben" - sah bisher aus wie eine Browsermeldung und nicht wie eine
   Frage dieser App. Ein Systemdialog laesst sich weder gestalten noch
   uebersetzen noch mit einer Warnfarbe versehen, und auf Android steht er
   oben, waehrend die ganze App fuer den Daumen unten gebaut ist.

   Dieselbe Bauart wie die Snackbar: ein Signal, eine Funktion zum Auslesen,
   ein einziger Dialog im Rahmen. Der Aufrufer merkt davon nichts - er
   schreibt weiterhin eine Zeile, nur mit await:

     if(!await bestaetige({ titel: '…', text: '…' })) return;

   Eine Frage zur Zeit. Zwei gleichzeitig gibt es in dieser App nicht, und
   waere eine da, gehoerte sie hinter die erste und nicht darueber. */

import { signal } from '@preact/signals';

export const frage = signal(null);

export function bestaetige({ titel, text, jaLabel, neinLabel, gefahr }){
  /* Steht schon eine Frage, wird sie verneint statt verdraengt: eine
     unbeantwortete Zusage darf nicht als Ja durchgehen. */
  if(frage.value) frage.value.aufloesen(false);
  return new Promise(aufloesen => {
    frage.value = {
      titel, text,
      jaLabel: jaLabel || 'Ja',
      neinLabel: neinLabel || 'Abbrechen',
      gefahr: !!gefahr,
      aufloesen
    };
  });
}

export function antworte(ja){
  const f = frage.value;
  if(!f) return;
  frage.value = null;
  f.aufloesen(ja);
}
