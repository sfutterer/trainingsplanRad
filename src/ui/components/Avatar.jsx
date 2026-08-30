/* Das Profilbild, in zwei Groessen und mit zwei Ruecklagen.

   Die Ruecklagen sind der Grund, warum das eine eigene Datei ist und kein
   <img> an drei Stellen:

     1  Ohne Anmeldung gibt es kein Bild. Dann steht dort die Silhouette - und
        nicht ein leerer Kreis, den man fuer einen Ladefehler haelt.
     2  Das Bild kommt von googleusercontent.com. Offline laedt es nicht, und
        Google raeumt die Adressen nach einiger Zeit ab. Dann stehen die
        Anfangsbuchstaben da, wie in jeder anderen App auch.

   Der zweite Fall ist der haeufigere: diese App wird unterwegs benutzt, und
   unterwegs ist oft kein Netz. Ein Profilbild, das dann als kaputtes
   Bildsymbol in der Leiste sitzt, saehe nach einem Fehler der App aus.

   referrerpolicy ist keine Kosmetik: googleusercontent liefert das Bild nicht
   aus, wenn der Browser die Herkunftsseite mitschickt. Ohne das Attribut
   bleibt der Kreis leer, und zwar nur in der gebauten App, nicht im
   Entwicklungsserver. */

import { useState, useEffect, useRef } from 'preact/hooks';
import { initialen } from '../../state/auth.js';
import { Icon } from './Icon.jsx';

export function Avatar({ profil, gross }){
  const [kaputt, setKaputt] = useState(false);
  const bildRef = useRef(null);
  const bild = profil && profil.bild;

  useEffect(() => {
    /* Ein neues Bild bekommt seine eigene Chance - sonst bliebe nach einem
       Profilwechsel die Absage des vorigen stehen. */
    setKaputt(false);

    /* Und der Fall, der onError allein nicht abfaengt: hat der Browser diese
       Adresse in dieser Sitzung schon einmal vergeblich geholt, beantwortet er
       sie aus dem Cache - der Fehler steht dann fest, bevor Preact den
       Zuhoerer anhaengen kann, und das Ereignis kommt nie an.

       Genau so sah man es: in der Leiste standen die Anfangsbuchstaben, im
       Sheet daneben ein leerer Kreis, weil dessen Bild dasselbe war und
       zweimal geladen wurde. complete mit naturalWidth 0 heisst "fertig und
       nichts dabei herausgekommen" - der uebliche Weg, das nachzufragen. */
    const el = bildRef.current;
    if(el && el.complete && el.naturalWidth === 0) setKaputt(true);
  }, [bild]);

  const klasse = 'avatar' + (gross ? ' gross' : '');

  if(!profil) return <span class={klasse + ' leer'}><Icon name="person" /></span>;
  if(bild && !kaputt){
    return (
      <img class={klasse} src={bild} alt="" referrerpolicy="no-referrer"
        ref={bildRef} onError={() => setKaputt(true)} />
    );
  }
  return <span class={klasse + ' initialen'}>{initialen(profil)}</span>;
}
