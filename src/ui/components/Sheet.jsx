/* Bottom Sheet mit Fokusverwaltung.

   Auf Android das uebliche Muster fuer Detailinhalte, und die Greifzone liegt
   unten. Drei Stellen zeigen eines: die Uebungsanleitung, der Tagesueberblick
   hinter der Glocke und die Rueckfragen.

   Bisher hatte jede ihre eigene Fassung, und keine kuemmerte sich um den
   Fokus. Das war die Luecke, die ExerciseDialog selbst benannt hat: Escape
   schloss zwar, aber der Fokus blieb beim Oeffnen auf dem Knopf dahinter, Tab
   lief aus dem Sheet in die Seite darunter, und beim Schliessen landete er am
   Seitenanfang statt dort, wo man hergekommen war. Wer mit Tastatur oder
   Screenreader bedient, verlor damit jedes Mal die Stelle.

   Drei Dinge macht diese Datei deshalb, und sie gehoeren zusammen:

     1  Beim Oeffnen faehrt der Fokus in das Sheet - auf das erste
        fokussierbare Element, sonst auf das Sheet selbst.
     2  Tab und Shift+Tab laufen im Kreis: hinter dem letzten Element kommt
        wieder das erste. Der Rest der Seite ist waehrenddessen inert.
     3  Beim Schliessen geht der Fokus dorthin zurueck, wo er herkam.

   Escape und der Klick daneben schliessen wie bisher. */

import { useEffect, useRef } from 'preact/hooks';

const FOKUSSIERBAR =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), ' +
  'textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function Sheet({ onClose, label, labelledBy, children }){
  const box = useRef(null);
  const herkunft = useRef(null);

  useEffect(() => {
    herkunft.current = document.activeElement;

    const el = box.current;
    if(el){
      const erstes = el.querySelector(FOKUSSIERBAR);
      (erstes || el).focus({ preventScroll: true });
    }

    function aufTaste(e){
      if(e.key === 'Escape'){ onClose(); return; }
      if(e.key !== 'Tab' || !box.current) return;
      const ziele = [...box.current.querySelectorAll(FOKUSSIERBAR)];
      if(!ziele.length){ e.preventDefault(); return; }
      const erstes = ziele[0], letztes = ziele[ziele.length - 1];
      /* Der Fokus kann auch ausserhalb stehen - etwa direkt nach dem Oeffnen,
         wenn das Sheet selbst ihn traegt. Dann faengt Tab ihn hier ein. */
      if(!box.current.contains(document.activeElement)){
        e.preventDefault(); (e.shiftKey ? letztes : erstes).focus();
      } else if(e.shiftKey && document.activeElement === erstes){
        e.preventDefault(); letztes.focus();
      } else if(!e.shiftKey && document.activeElement === letztes){
        e.preventDefault(); erstes.focus();
      }
    }

    document.addEventListener('keydown', aufTaste);
    return () => {
      document.removeEventListener('keydown', aufTaste);
      /* Nur zurueckgeben, wenn der Fokus noch im Sheet steht: hat der Nutzer
         inzwischen woanders hingeklickt, waere ein Sprung zurueck ein Ruck,
         den niemand ausgeloest hat. */
      const ziel = herkunft.current;
      if(ziel && ziel.isConnected && typeof ziel.focus === 'function'){
        ziel.focus({ preventScroll: true });
      }
    };
  }, [onClose]);

  return (
    <div class="dialog" onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div class="sheet" role="dialog" aria-modal="true" tabIndex={-1} ref={box}
        aria-label={label} aria-labelledby={labelledBy}>
        <div class="grip"></div>
        {children}
      </div>
    </div>
  );
}
