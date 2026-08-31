/* Was alle Overlays dieser App gleich machen.

   Zwei Bauarten gibt es, und sie sehen nichts wie einander: das Bottom Sheet
   faehrt von unten herein und traegt oben den Griff (Uebungsanleitung,
   Tagesueberblick, Profil, Rueckfrage), der Navigation Drawer faehrt von
   links herein und traegt eine Liste. Was sie mit dem Nutzer verhandeln, ist
   aber Wort fuer Wort dasselbe:

     Escape schliesst.
     Der Fokus faehrt beim Oeffnen hinein und beim Schliessen dorthin zurueck,
     wo er herkam; dazwischen laeuft Tab im Kreis und nicht in die Seite
     dahinter.
     Die Zurueck-Geste schliesst das oberste Overlay, statt zu navigieren.

   Verteilt stand das bisher auf drei Stellen und zwei Dateien: die
   Fokusverwaltung nur im Sheet, Escape zweimal - einmal dort, einmal im
   Drawer -, und die Anmeldung des Drawers zur Zurueck-Geste sogar im Rahmen,
   weil er als einziges Overlay dort geoeffnet wird. Der Drawer hatte deshalb
   keine Fokusfalle: wer ihn mit der Tastatur oeffnete, lief mit Tab hinter
   ihm durch die Seite - dieselbe Luecke, die im Sheet laengst geschlossen
   war.

   Der Aufrufer bringt zwei Dinge mit: ob er offen ist und welcher Knoten sein
   Inneres traegt. Alles Uebrige - Aussehen, Richtung, Schleier, die
   Wischgeste des Sheets - bleibt bei ihm. Das ist der Unterschied zwischen
   den Bauarten und nicht ihre Gemeinsamkeit. */

import { useEffect, useRef } from 'preact/hooks';
import { overlayOffen } from '../../state/overlays.js';

const FOKUSSIERBAR =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), ' +
  'textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/* Zurueck kommt der Aufruf zum Schliessen als Ref.

   onClose ist an jeder Aufrufstelle eine frisch gebaute Pfeilfunktion und
   damit bei jeder Neuzeichnung eine andere. Stuende sie in der
   Abhaengigkeitsliste, liefe der ganze Effekt bei laufendem Timer viermal je
   Sekunde neu an - der Fokus spraenge dabei staendig zurueck an den Anfang.
   Ueber das Ref bleibt der Aufruf aktuell, ohne den Effekt anzufassen, und
   der Aufrufer nimmt dasselbe Ref fuer seine eigenen Handgriffe. */
export function useOverlay(offen, onClose, box){
  const schliessen = useRef(onClose);
  schliessen.current = onClose;
  const herkunft = useRef(null);

  useEffect(() => {
    if(!offen) return undefined;

    herkunft.current = document.activeElement;

    const el = box.current;
    if(el){
      const erstes = el.querySelector(FOKUSSIERBAR);
      (erstes || el).focus({ preventScroll: true });
    }

    function aufTaste(e){
      if(e.key === 'Escape'){ schliessen.current(); return; }
      if(e.key !== 'Tab' || !box.current) return;
      const ziele = [...box.current.querySelectorAll(FOKUSSIERBAR)];
      if(!ziele.length){ e.preventDefault(); return; }
      const erstes = ziele[0], letztes = ziele[ziele.length - 1];
      /* Der Fokus kann auch ausserhalb stehen - etwa direkt nach dem Oeffnen,
         wenn das Overlay selbst ihn traegt. Dann faengt Tab ihn hier ein. */
      if(!box.current.contains(document.activeElement)){
        e.preventDefault(); (e.shiftKey ? letztes : erstes).focus();
      } else if(e.shiftKey && document.activeElement === erstes){
        e.preventDefault(); letztes.focus();
      } else if(!e.shiftKey && document.activeElement === letztes){
        e.preventDefault(); erstes.focus();
      }
    }

    document.addEventListener('keydown', aufTaste);
    /* Solange dieses Overlay offen ist, gehoert die Zurueck-Geste ihm. */
    const abmelden = overlayOffen(() => schliessen.current());

    return () => {
      document.removeEventListener('keydown', aufTaste);
      abmelden();
      /* Zurueck zur Herkunft, solange es sie noch gibt. Sie kann verschwunden
         sein - der Knopf, der das Overlay geoeffnet hat, steht nach einem
         Bereichswechsel nicht mehr unbedingt da -, und ein focus() auf einen
         ausgehaengten Knoten setzt den Fokus auf den Seitenanfang zurueck. */
      const ziel = herkunft.current;
      if(ziel && ziel.isConnected && typeof ziel.focus === 'function'){
        ziel.focus({ preventScroll: true });
      }
    };
  }, [offen, box]);

  return schliessen;
}
