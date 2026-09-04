/* Was jede Uhr dieser App gleich macht.

   Fuenf Timer laufen hier: der Rumpfzirkel, der Beinblock, der gefuehrte
   Ablauf von Beweglichkeit und Koordination (eine Anbindung fuer beide) und
   die Schrittfolgen von Intervalltimer und Testbereich (ebenso eine). Vier
   Anbindungen also, und alle vier schrieben bis zum 04.09.2026 denselben
   Rumpf selbst hin:

     die Uhr in einem useRef, damit sie den Neuzeichnungen standhaelt
     einen Zaehler als Zustand, weil die Uhr selbst kein Signal ist
     im tick: neu zeichnen, in den letzten drei Sekunden piepsen
     beim Aushaengen: anhalten und bei timerState abmelden

   Zeichen fuer Zeichen dasselbe, viermal - samt derselben vierzeiligen
   Begruendung, warum der Timer nicht in der Abhaengigkeitsliste steht.

   Was NICHT hier liegt: die Ansagen. Sie sind der eigentliche Unterschied
   zwischen den Timern - der Zirkel sagt Wiederholungen und Tempo an, der
   gefuehrte Ablauf haelt zwischen den Saetzen an, die Schrittfolge zaehlt
   Intervalle. Jeder Aufrufer meldet dafuer seine eigenen Zuhoerer an.

   `label` und `segment` melden die laufende Uhr bei timerState, damit sie in
   einem anderen Baustein als Streifen erscheint. Ohne sie laeuft die Uhr
   still - so wie es Intervalltimer und Testbereich bisher schon taten: die
   beiden liegen in eigenen Bereichen, und ein Streifen im Trainings-Tab
   verwiese auf einen Bildschirm, den man mit einem Tipp gar nicht erreicht. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { createTimer } from '../../domain/timer/engine.js';
import { meldeTimer } from '../../state/timerState.js';
import { beep, primeSpeech, ensureWakeLock } from '../../platform/index.js';

/* Ab hier zaehlt der Piepser die Sekunden herunter. Drei, weil man auf dem
   Rad die letzte Sekunde nicht mehr ablesen kann und die vierte noch nichts
   ankuendigt. */
const COUNTDOWN_AB = 3;

export function useTimerBasis({ kennung, label, segment }){
  const [, neu] = useState(0);
  const ref = useRef(null);
  if(!ref.current) ref.current = createTimer();
  const timer = ref.current;

  const zeichnen = () => neu(x => x + 1);

  /* Der Uhr bei timerState Bescheid geben. `sek` nur, wo es einen Streifen
     gibt - sonst gibt es nichts anzuzeigen. */
  function melden(laeuft, sek){
    meldeTimer(kennung, laeuft,
      label && laeuft ? { label, segment, sek: sek ?? timer.secondsLeft() } : undefined);
  }

  useEffect(() => {
    const ab = timer.on('tick', ({ secondsLeft, sekundenwechsel }) => {
      zeichnen();
      if(!sekundenwechsel) return;
      if(secondsLeft <= COUNTDOWN_AB && secondsLeft > 0) beep(500, 120);
      if(label) meldeTimer(kennung, true, { label, segment, sek: secondsLeft });
    });
    return ab;
    /* Nichts steht in der Liste, und das ist die Aussage: timer lebt in einem
       useRef und ist fuer die Lebensdauer der Komponente derselbe, kennung,
       label und segment kommen als feste Zeichenketten vom Aufrufer. In der
       Liste waere der Linter zufrieden, ohne dass sich etwas aendert - nur
       liesse sich dann nicht mehr lesen, dass diese Anmeldung genau einmal
       geschieht. Dieselbe Begruendung stand bis zum 04.09.2026 viermal. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Anhalten und abmelden nur beim Aushaengen. Stuende es im Aufraeumteil
     eines Effekts mit Abhaengigkeiten, beendete jeder Wechsel der Stimme die
     laufende Einheit - mitten auf dem Rad, ohne dass ein Knopf dafuer
     gedrueckt worden waere. Genau dieser Fehler ist in drei der vier
     Anbindungen einzeln behoben worden. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => { timer.reset(); meldeTimer(kennung, false); }, []);

  /* Starten oder fortsetzen.

     Die Folge kommt als Funktion und wird nur gebaut, wenn tatsaechlich neu
     begonnen wird: eine angehaltene Uhr soll fortsetzen und nicht heimlich
     von vorn anfangen. "Neu" heisst: noch nie gelaufen (index -1) oder schon
     durch (der letzte Schritt ist 'done').

     primeSpeech und ensureWakeLock stehen hier, weil beide eine Nutzergeste
     brauchen - sie duerfen nur aus einem Tastendruck heraus laufen, und
     genau das ist diese Funktion. */
  function starten(bauen){
    primeSpeech();
    ensureWakeLock();
    if(!timer.running && (timer.index === -1 || (timer.step && timer.step.type === 'done'))){
      timer.load(bauen());
    }
    timer.toggle();
    melden(timer.running);
    zeichnen();
  }

  return { timer, zeichnen, melden, starten };
}
