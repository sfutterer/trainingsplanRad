/* Beweglichkeitsflow: fuenf Uebungen, taeglich, 5 bis 6 Minuten.

   Bewusst ohne Runden, Phasen und Saetze: der Flow haengt an keiner Woche und
   an keiner Phase, die Dosierung steht fertig in der Plandatei. Ein
   Runden-Timer wie im Rumpfzirkel waere hier eine Erfindung der App, die im
   Plan keine Entsprechung hat.

   Die Dosierung steht in der Zeile selbst und nicht erst im Bottom Sheet: sie
   ist die eigentliche Anweisung, und wer sie erst aufklappen muss, macht die
   Uebung nach Gefuehl.

   Der gefuehrte Ablauf liegt in Koerperablauf.jsx, gemeinsam mit dem der
   Koordination. Er zaehlt genau dort Sekunden, wo der Plan Sekunden vorgibt -
   von den fuenf Uebungen ist das nur die tiefe Kniebeuge mit 60 s; neben
   "10 Wdh. je Seite" haette eine Uhr nichts zu tun. In die naechste Uebung
   schaltet er nie von selbst: das bleibt der Weiter-Taste vorbehalten.

   Der Merksatz ist der eine Status dieses Bausteins und steht deshalb im Kopf.
   Alles Weitere aus dem Plan ist ein Hinweis und steht unten - dieselbe
   Aufteilung wie in den anderen drei Bausteinen. */

import { plan } from '../../../state/store.js';
import { Baustein } from './Baustein.jsx';
import { useKoerperablauf } from './Koerperablauf.jsx';

export function Beweglichkeit({ onOpen }){
  const m = plan.value.mobility;

  const { buehne, liste } = useKoerperablauf({
    uebungen: m.exercises, timerId: 'beweglichkeit',
    label: 'Beweglichkeit', segment: 'mobility', onOpen
  });

  return (
    <Baustein
      titel="Beweglichkeit"
      meta={m.durationHint + ' · täglich'}
      status={<p class="merksatz">{m.note}</p>}
      buehne={buehne}
      hinweise={[m.placement, m.scope]}>
      {liste}
    </Baustein>
  );
}
