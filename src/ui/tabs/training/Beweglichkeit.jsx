/* Beweglichkeitsflow: fuenf Uebungen, taeglich, 5 bis 6 Minuten.

   Bewusst ohne Runden, Phasen und Saetze: der Flow haengt an keiner Woche und
   an keiner Phase, die Dosierung steht fertig in der Plandatei. Ein
   Runden-Timer wie im Rumpfzirkel waere hier eine Erfindung der App, die im
   Plan keine Entsprechung hat.

   Die Dosierung steht in der Zeile selbst und nicht erst im Bottom Sheet: sie
   ist die eigentliche Anweisung, und wer sie erst aufklappen muss, macht die
   Uebung nach Gefuehl.

   Der gefuehrte Ablauf schaltet nur weiter, er zaehlt keine Sekunden. Zwei
   Gruende: vier der fuenf Uebungen sind in Wiederholungen dosiert ("10 Wdh. je
   Seite"), daneben ist eine Uhr sinnlos - und der Rumpfzirkel darf waehrend
   des Flows weiterlaufen. Eine zweite Instanz der Timer-Engine wuerde das
   gemeinsame Signal timerLaeuft ueberschreiben und den laufenden Zirkel als
   gestoppt melden. Verworfen wurde deshalb die Variante, die einzige
   zeitdosierte Uebung (60 s) an die Engine zu haengen: ein Countdown fuer eine
   von fuenf Uebungen rechtfertigt weder den zweiten Timer noch die
   Verwechslungsgefahr mit dem Zirkel. */

import { useState } from 'preact/hooks';
import { plan } from '../../../state/store.js';
import { Uebungsbild } from './Uebungsbild.jsx';

export function Beweglichkeit({ onOpen }){
  const m = plan.value.mobility;
  const uebungen = m.exercises;
  /* -1 heisst: kein Ablauf, nur die Liste. */
  const [schritt, setSchritt] = useState(-1);

  const laufend = schritt >= 0 && schritt < uebungen.length;
  const aktuelle = laufend ? uebungen[schritt] : null;
  const letzte = schritt === uebungen.length - 1;

  return (
    <>
      <div class="card">
        <div class="row"><span>Beweglichkeit</span><b>{m.durationHint} · täglich</b></div>
        {/* Der Hinweis steht hervorgehoben, weil er die eine Sache benennt, die
            bei Radfahrern den groessten Unterschied macht. */}
        <p class="merksatz">{m.note}</p>
        <p class="hint">{m.placement}</p>
      </div>

      <div class="card">
        {laufend ? (
          <>
            <div class="row"><span>Geführter Ablauf</span><b>Übung {schritt + 1} von {uebungen.length}</b></div>
            <div class="ablaufbalken" aria-hidden="true">
              {uebungen.map((ex, i) => <span key={ex.key} class={i <= schritt ? 'an' : ''}></span>)}
            </div>

            <Uebungsbild src={aktuelle.img} name={aktuelle.name} klasse="ablaufbild"
              onClick={() => onOpen(schritt)} />

            <h3 class="ablaufname">{aktuelle.name}</h3>
            <div class="dosisgross">{aktuelle.dosage}<small>{aktuelle.focus}</small></div>
            <ol class="ablaufschritte">{aktuelle.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>

            <div class="controls">
              <button class="btn secondary" onClick={() => setSchritt(schritt - 1)}
                disabled={schritt === 0}>Zurück</button>
              <button class="btn gross" onClick={() => setSchritt(letzte ? -1 : schritt + 1)}>
                {letzte ? 'Fertig' : 'Weiter'}</button>
              <button class="btn secondary" onClick={() => setSchritt(-1)}>Beenden</button>
            </div>
          </>
        ) : (
          <>
            <div class="row"><span>Übungen</span><b>{uebungen.length} in Folge</b></div>
            <div class="exlist koerperliste" style="margin-top:8px">
              {uebungen.map((ex, i) => (
                <button class="exrow" key={ex.key} onClick={() => onOpen(i)}>
                  <span class="exname">
                    {i + 1}. {ex.name}
                    <small><b>{ex.dosage}</b> · {ex.focus}</small>
                  </span>
                  <span class="ziel">›</span>
                </button>
              ))}
            </div>
            <button class="btn tonal block" style="margin-top:14px"
              onClick={() => setSchritt(0)}>Geführten Ablauf starten</button>
          </>
        )}
        <p class="hint">{m.scope}</p>
      </div>
    </>
  );
}
