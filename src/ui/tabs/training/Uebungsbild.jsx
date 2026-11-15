/* Uebungsvideo (frueher: Uebungsbild) mit Platzhalter.

   Seit dem 15.11.2026 traegt jede Uebung in plan.json die Kennung eines
   deutschsprachigen YouTube-Videos statt eines Bildes. Die Komponente heisst
   weiter Uebungsbild und nimmt weiter `src`: alle Stellen, die eine Uebung
   zeigen - Buehne, Dialog, Ablauf -, reichen dasselbe Feld durch und muessen
   nicht wissen, ob dort ein Video oder (in einem alten eigenen Plan) ein Bild
   steht.

   Ein Video wird nicht sofort eingebettet. Zuerst steht nur das Vorschaubild
   mit einem Abspielzeichen da; der Player wird erst beim Antippen geladen,
   ueber youtube-nocookie.com. Zwei Gruende: ein Trainingsbildschirm mit acht
   eingebetteten Playern laedt Sekunden und Megabytes, und erst das Antippen
   ist die Entscheidung, Daten an YouTube zu schicken (siehe "Über die App").

   Wer `onClick` mitgibt, bekommt den Tipp selbst - die Buehne oeffnet damit
   den Uebungsdialog, und dort laeuft das Video in voller Breite. Ohne
   `onClick` spielt das Video an Ort und Stelle.

   Faellt das Vorschaubild aus (offline), steht eine neutrale Kachel mit dem
   Uebungsnamen da statt eines kaputten Bildsymbols. */

import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../../components/Icon.jsx';

/* Eine YouTube-Kennung ist elf Zeichen aus Buchstaben, Ziffern, - und _.
   Ein Bildpfad enthaelt immer einen Punkt oder Schraegstrich. */
export function istVideo(src){
  return typeof src === 'string' && /^[A-Za-z0-9_-]{11}$/.test(src);
}

export function videoLink(id){
  return 'https://www.youtube.com/watch?v=' + id;
}

export function Uebungsbild({ src, name, klasse = '', onClick }){
  const [fehlt, setFehlt] = useState(false);
  const [spielt, setSpielt] = useState(false);

  /* Beim gefuehrten Ablauf wechselt nur die Quelle, die Komponente bleibt
     stehen. Ohne diesen Ruecksetzer bliebe der Platzhalter oder der Player
     der einen Uebung fuer alle folgenden stehen. */
  useEffect(() => { setFehlt(false); setSpielt(false); }, [src]);

  const klassen = ('exbild ' + klasse).trim();

  if(!src || fehlt){
    return (
      <div class={klassen + ' exbild-leer'} onClick={onClick}
        role={onClick ? 'button' : 'img'} aria-label={'Vorschau nicht verfügbar: ' + name}>
        <Icon name="bild" />
        <span>{name}</span>
        <small>{istVideo(src) ? 'Video braucht Internet' : 'Bild folgt'}</small>
      </div>
    );
  }

  if(istVideo(src)){
    if(spielt){
      return (
        <div class={klassen + ' exvideo'}>
          <iframe
            src={'https://www.youtube-nocookie.com/embed/' + src +
                 '?autoplay=1&rel=0&modestbranding=1&playsinline=1&hl=de&cc_lang_pref=de'}
            title={'Video: ' + name} loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen referrerpolicy="strict-origin-when-cross-origin" />
        </div>
      );
    }
    const tippen = onClick || (() => setSpielt(true));
    return (
      <button type="button" class={klassen + ' exvideo-vorschau'} onClick={tippen}
        aria-label={'Video abspielen: ' + name}>
        <img src={'https://i.ytimg.com/vi/' + src + '/hqdefault.jpg'} alt="" loading="lazy"
          referrerpolicy="no-referrer" onError={() => setFehlt(true)} />
        <span class="play" aria-hidden="true">▶</span>
      </button>
    );
  }

  return (
    <img class={klassen} src={src} alt={name} loading="lazy"
      onClick={onClick} onError={() => setFehlt(true)} />
  );
}
