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
import { Icon } from '../../components/Icon.jsx';

export function Uebungsbild({ src, name, klasse = '', onClick }){
  const [fehlt, setFehlt] = useState(false);

  /* Beim gefuehrten Ablauf wechselt nur die Quelle, die Komponente bleibt
     stehen. Ohne diesen Ruecksetzer bliebe der Platzhalter der einen Uebung fuer
     alle folgenden stehen. */
  useEffect(() => { setFehlt(false); }, [src]);

  const klassen = ('exbild ' + klasse).trim();

  if(!src || fehlt){
    return (
      <div class={klassen + ' exbild-leer'} onClick={onClick}
        role={onClick ? 'button' : 'img'} aria-label={'Bild fehlt noch: ' + name}>
        <Icon name="bild" />
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
