/* Bottom Sheet mit Fokusverwaltung, Wischgeste und Zurueck-Geste.

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

   Dazu kommen die beiden Gesten, mit denen ein Sheet tatsaechlich zugeht - der
   Knopf am Ende der Anleitung steht bei langem Inhalt unter dem Falz und war
   praktisch nicht zu finden:

     Der Strich oben ist kein Zierstueck, er verspricht eine Geste. Bisher
     hielt er das Versprechen nicht: das Sheet liess sich nicht wegwischen.
     Jetzt zieht es mit dem Finger mit, der Schleier dahinter hellt dabei auf,
     und losgelassen entscheidet Weg oder Tempo - kurz gezogen faehrt es
     zurueck, weit oder schnell gezogen faehrt es hinaus.

     Die Zurueck-Geste schliesst das Sheet, statt in einen anderen Bereich zu
     springen. Dafuer meldet es sich in state/overlays.js an; der Rahmen fragt
     dort nach, bevor er navigiert.

   Escape und der Klick daneben schliessen wie bisher. */

import { useEffect, useRef } from 'preact/hooks';
import { overlayOffen } from '../../state/overlays.js';

const FOKUSSIERBAR =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), ' +
  'textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/* Ab hier ist die Bewegung ein Zug und kein Tipper. Kleiner waere jeder
   Wackler beim Antippen schon ein halbes Wegwischen. */
const ERKANNT = 8;
/* Losgelassen wird geschlossen, wenn das Sheet weit genug unten steht - oder
   wenn es schnell genug unterwegs war. Das kurze, schnelle Wischen ist die
   haeufigere der beiden Bewegungen und darf nicht an einem Wegmass scheitern. */
const SCHWELLE = 96;
const SCHNELL = 0.6;
/* Dauer der Ausfahrt. Lang genug, dass man sie sieht, kurz genug, dass niemand
   auf sie wartet. */
const AUSFAHRT = 200;
/* Deckkraft des Schleiers bei ruhendem Sheet - dieselbe Zahl wie der
   Ausgangswert von --schleier in timer.css. */
const SCHLEIER = 0.55;

const ruhig = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Sheet({ onClose, label, labelledBy, children }){
  const box = useRef(null);
  const herkunft = useRef(null);
  const zug = useRef(null);
  const ausfahrt = useRef(null);

  /* onClose kommt an den meisten Stellen als frisch gebaute Pfeilfunktion und
     ist damit bei jeder Neuzeichnung eine andere. Stuende es in einer
     Abhaengigkeitsliste, liefen Fokus und Anmeldung waehrend eines laufenden
     Timers viermal je Sekunde neu an - der Fokus spraenge dabei staendig
     zurueck an den Anfang des Sheets. Ueber ein Ref bleibt der Aufruf aktuell,
     ohne die Effekte anzufassen. */
  const schliessen = useRef(onClose);
  schliessen.current = onClose;

  useEffect(() => {
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
      if(ausfahrt.current) clearTimeout(ausfahrt.current);
      /* Nur zurueckgeben, wenn der Fokus noch im Sheet steht: hat der Nutzer
         inzwischen woanders hingeklickt, waere ein Sprung zurueck ein Ruck,
         den niemand ausgeloest hat. */
      const ziel = herkunft.current;
      if(ziel && ziel.isConnected && typeof ziel.focus === 'function'){
        ziel.focus({ preventScroll: true });
      }
    };
  }, []);

  /* Solange dieses Sheet offen ist, gehoert die Zurueck-Geste ihm. */
  useEffect(() => overlayOffen(() => schliessen.current()), []);

  /* Das Sheet verschieben und den Schleier dazu aufhellen. Beides von Hand am
     Knoten und nicht ueber den Zustand: waehrend eines Zuges kaeme sonst je
     Bildschirmbild eine Neuzeichnung des ganzen Inhalts. */
  function stelle(dy, weich){
    const el = box.current;
    if(!el) return;
    el.style.transition = weich ? 'transform .22s cubic-bezier(.2, 0, 0, 1)' : 'none';
    el.style.transform = dy > 0 ? 'translateY(' + dy + 'px)' : '';
    const hof = el.parentElement;
    if(hof){
      const hoehe = el.offsetHeight || 1;
      hof.style.setProperty('--schleier', String(Math.max(0, 1 - dy / hoehe) * SCHLEIER));
    }
  }

  function zugBeginn(e){
    if(e.button != null && e.button !== 0) return;
    /* Eingaben behalten ihre eigene Geste: die Zahl in einem Feld zu markieren
       darf das Sheet nicht wegziehen. */
    if(e.target.closest && e.target.closest('input, textarea, select')) return;
    zug.current = { id: e.pointerId, y: e.clientY, t: e.timeStamp, dy: 0,
                    griff: !!(e.target.closest && e.target.closest('.griff')),
                    zieht: false };
  }

  function zugLauf(e){
    const z = zug.current;
    if(!z || e.pointerId !== z.id) return;
    const dy = e.clientY - z.y;
    if(!z.zieht){
      /* Nach oben ist kein Anfang eines Wegwischens - das ist Scrollen. */
      if(dy < ERKANNT){ if(dy < -ERKANNT) zug.current = null; return; }
      /* Aus dem gescrollten Inhalt heraus zieht nur der Griff. Sonst waere
         jedes Zurueckscrollen an den Anfang der Anleitung ein halbes
         Schliessen. */
      if(!z.griff && box.current && box.current.scrollTop > 0){ zug.current = null; return; }
      z.zieht = true;
      /* Ab hier zaehlt der Weg neu, damit das Sheet nicht um die
         Erkennungsschwelle springt. */
      z.y = e.clientY; z.t = e.timeStamp;
      if(box.current && box.current.setPointerCapture){
        try { box.current.setPointerCapture(e.pointerId); } catch(_e) { /* egal */ }
      }
      return;
    }
    z.dy = Math.max(0, e.clientY - z.y);
    stelle(z.dy, false);
  }

  function zugEnde(e){
    const z = zug.current;
    if(!z || e.pointerId !== z.id) return;
    zug.current = null;
    if(!z.zieht) return;

    const tempo = z.dy / Math.max(1, e.timeStamp - z.t);
    if(z.dy < SCHWELLE && tempo < SCHNELL){ stelle(0, true); return; }

    if(ruhig()){ schliessen.current(); return; }

    /* Erst hinausfahren, dann schliessen. Verschwaende das Sheet mitten in der
       Bewegung, saehe die Geste aus wie ein Aussetzer. */
    const el = box.current;
    el.style.transition = 'transform ' + AUSFAHRT + 'ms cubic-bezier(.3, 0, 1, 1)';
    el.style.transform = 'translateY(' + (el.offsetHeight + 40) + 'px)';
    const hof = el.parentElement;
    if(hof){
      hof.style.transition = 'background-color ' + AUSFAHRT + 'ms linear';
      hof.style.setProperty('--schleier', '0');
    }
    ausfahrt.current = setTimeout(() => schliessen.current(), AUSFAHRT);
  }

  /* Nimmt das System die Geste an sich - Anruf, Systemleiste -, faehrt das
     Sheet zurueck. Ein halb weggeschobenes Sheet stehenzulassen waere der
     einzige Zustand, aus dem es keinen Weg zurueck gaebe. */
  function zugAus(){
    if(!zug.current) return;
    const zog = zug.current.zieht;
    zug.current = null;
    if(zog) stelle(0, true);
  }

  return (
    <div class="dialog" onClick={e => { if(e.target === e.currentTarget) schliessen.current(); }}>
      <div class="sheet" role="dialog" aria-modal="true" tabIndex={-1} ref={box}
        aria-label={label} aria-labelledby={labelledBy}
        onPointerDown={zugBeginn} onPointerMove={zugLauf}
        onPointerUp={zugEnde} onPointerCancel={zugAus}>
        {/* Der Griff ist die verlaesslichste Zugstelle: hier zieht das Sheet
            auch dann mit, wenn der Inhalt darunter schon gescrollt ist. Die
            Trefferflaeche ist deshalb hoeher als der Strich, den man sieht. */}
        <div class="griff" aria-hidden="true"><div class="grip"></div></div>
        {children}
      </div>
    </div>
  );
}
