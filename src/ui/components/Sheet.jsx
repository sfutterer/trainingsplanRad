/* Bottom Sheet - auf Android das uebliche Muster fuer Detailinhalte, und die
   Greifzone liegt unten. Vier Stellen zeigen eines: die Uebungsanleitung, der
   Tagesueberblick hinter der Glocke, das Profil und die Rueckfragen.

   Bisher hatte jede ihre eigene Fassung, und keine kuemmerte sich um den
   Fokus. Das war die Luecke, die ExerciseDialog selbst benannt hat: Escape
   schloss zwar, aber der Fokus blieb beim Oeffnen auf dem Knopf dahinter, Tab
   lief aus dem Sheet in die Seite darunter, und beim Schliessen landete er am
   Seitenanfang statt dort, wo man hergekommen war.

   Escape, Fokusfalle, Fokusrueckgabe und die Zurueck-Geste liegen inzwischen
   in useOverlay.js - das Sheet teilt sie sich mit dem Navigation Drawer, denn
   sie sind keine Eigenheit dieser Bauart. Hier bleibt, was nur das Sheet hat:
   der Klick daneben und die Wischgeste.

   Der Strich oben ist naemlich kein Zierstueck, er verspricht eine Geste.
   Bisher hielt er das Versprechen nicht: das Sheet liess sich nicht
   wegwischen, und der Knopf am Ende der Anleitung steht bei langem Inhalt
   unter dem Falz - praktisch war es nicht zu schliessen. Jetzt zieht es mit
   dem Finger mit, der Schleier dahinter hellt dabei auf, und losgelassen
   entscheidet Weg oder Tempo: kurz gezogen faehrt es zurueck, weit oder
   schnell gezogen faehrt es hinaus.

   Der Drawer bekommt die Geste bewusst nicht: er traegt keinen Griff und
   verspricht damit auch nichts. */

import { useEffect, useRef } from 'preact/hooks';
import { useOverlay } from './useOverlay.js';
import { bewegungsarm } from '../../platform/index.js';

/* Ab hier ist die Bewegung ein Zug und kein Tipper. Kleiner waere jeder
   Wackler beim Antippen schon ein halbes Wegwischen.

   Ausgefuehrt, weil die Meldungskarte der Glocke dieselbe Zahl braucht: die
   Hand macht zwischen den Achsen keinen Unterschied, und zwei Zahlen, die
   zusammenbleiben muessen, sind besser eine. */
export const ZUG_ERKANNT = 8;
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

export function Sheet({ onClose, label, labelledBy, children }){
  const box = useRef(null);
  const zug = useRef(null);
  const ausfahrt = useRef(null);

  const schliessen = useOverlay(true, onClose, box);

  /* Die Ausfahrt laeuft ueber eine Zeitschaltung, und die muss weg, wenn das
     Sheet auf anderem Weg verschwindet - sonst schliesst sie hinterher ein
     Sheet, das es nicht mehr gibt. */
  useEffect(() => () => { if(ausfahrt.current) clearTimeout(ausfahrt.current); }, []);

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
      if(dy < ZUG_ERKANNT){ if(dy < -ZUG_ERKANNT) zug.current = null; return; }
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

    if(bewegungsarm()){ schliessen.current(); return; }

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
