/* Uebungsbild mit Platzhalter.

   Die Bilder der neun Uebungen zu Beweglichkeit und Koordination liegen noch
   nicht im Ordner assets, die Pfade stehen aber schon im Plan. Ohne Fallback
   zeigte der Browser das kaputte Bildsymbol, und die Zeile daneben spraenge in
   der Hoehe, sobald das Bild spaeter doch geladen wird.

   Deshalb faengt onError den Fehlschlag ab und setzt an dieselbe Stelle eine
   neutrale Kachel im Bildformat, die den Uebungsnamen traegt. Sobald die
   .webp-Datei abgelegt wird, laedt das Bild und der Platzhalter erscheint nie
   wieder - ohne Codeaenderung.

   Verworfen: eine Liste der vorhandenen Dateien im Code. Sie muesste bei jeder
   neuen Datei gepflegt werden und waere genau dann falsch, wenn niemand daran
   denkt. Der Ladefehler ist die verlaessliche Quelle.

   Die Datei liegt beim Training-Tab, wird aber auch vom ExerciseDialog
   benutzt - der Dialog zeigt dieselben Uebungsbilder und braucht denselben
   Fallback. */

import { useEffect, useState } from 'preact/hooks';

export function Uebungsbild({ src, name, klasse = '', onClick }){
  const [fehlt, setFehlt] = useState(false);

  /* Beim geführten Ablauf wechselt nur die Quelle, die Komponente bleibt
     stehen. Ohne diesen Rücksetzer bliebe der Platzhalter der einen Übung für
     alle folgenden stehen. */
  useEffect(() => { setFehlt(false); }, [src]);

  const klassen = ('exbild ' + klasse).trim();

  if(!src || fehlt){
    return (
      <div class={klassen + ' exbild-leer'} onClick={onClick}
        role={onClick ? 'button' : 'img'} aria-label={'Bild fehlt noch: ' + name}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zm-2 0H5v14h14V5zM7 17l3.5-4.5 2.5 3 3.5-4.5L19 17H7z" />
        </svg>
        <span>{name}</span>
        <small>Bild folgt</small>
      </div>
    );
  }

  return (
    <img class={klassen} src={src} alt={name} loading="lazy"
      onClick={onClick} onError={() => setFehlt(true)} />
  );
}
