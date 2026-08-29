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
   schaltet er nie von selbst: das bleibt der Weiter-Taste vorbehalten. */

import { plan } from '../../../state/store.js';
import { Koerperablauf } from './Koerperablauf.jsx';

export function Beweglichkeit({ onOpen }){
  const m = plan.value.mobility;

  return (
    <>
      <div class="card">
        <div class="row"><span>Beweglichkeit</span><b>{m.durationHint} · täglich</b></div>
        {/* Der Hinweis steht hervorgehoben, weil er die eine Sache benennt, die
            bei Radfahrern den groessten Unterschied macht. */}
        <p class="merksatz">{m.note}</p>
        <p class="hint">{m.placement}</p>
      </div>

      <Koerperablauf uebungen={m.exercises} hint={m.scope} timerId="beweglichkeit"
        mengeText={m.exercises.length + ' in Folge'} onOpen={onOpen} />
    </>
  );
}
