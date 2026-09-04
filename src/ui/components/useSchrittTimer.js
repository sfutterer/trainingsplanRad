/* Die Uhr fuer eine feste Schrittfolge - samt Ansagen, Piepsern und Tasten.

   Stand bis zum 03.09.2026 vollstaendig im Intervalle-Tab. Als der Testbereich
   dazukam, hatte er dieselbe Aufgabe: eine Folge aus prep / warm / work / rest
   / cool / done abspielen, dabei sprechen, piepsen und den Wake Lock halten.
   Ein zweites Mal hingeschrieben waeren es zwei Fassungen derselben Ansagen
   geworden, die auseinanderlaufen, sobald jemand einen Satz aendert - und die
   Ansagen sind das Einzige, worauf man sich auf dem Rad verlaesst.

   Was hier liegt und was nicht: hier liegt alles, was fuer jede Schrittfolge
   gleich ist. Was die Folge ist, entscheidet der Aufrufer und gibt sie als
   Funktion herein; wie sie aussieht, entscheidet er auch. Die Uhr selbst kennt
   nur Sequenz, Cursor und Wanduhr - sie steht unveraendert in
   domain/timer/engine.js.

   Die Ansagen pruefen auf Unterschreiten und nicht auf Gleichheit. Die
   Restzeit wird aus der Uhr gerechnet und kann springen; bei einem Vergleich
   auf Gleichheit fiele eine Ansage dann ersatzlos aus - und zwar genau die,
   auf die man gewartet hat. Die Flags halten jede Ansage einmalig, sie werden
   bei jedem Schrittwechsel zurueckgesetzt. */

import { useEffect, useRef } from 'preact/hooks';
import { meldeTimer } from '../../state/timerState.js';
import { speak, beep, vibrate, cancelSpeech } from '../../platform/index.js';
/* Uhr, Countdown-Piepser und Abmeldung teilt sich diese Anbindung mit den
   drei Timern im Trainings-Tab - siehe useTimerBasis.js. Hier bleibt, was
   diese Uhr ausmacht: die Ansagen. */
import { useTimerBasis } from './useTimerBasis.js';

export function useSchrittTimer({ kennung, voice, sequenz }){
  const flags = useRef({ half:false, minute:false, zehn:false });

  /* Die Folge kommt bei jedem Zeichnen neu herein, die Anmeldung an der Uhr
     soll aber nur an der Stimme haengen. Deshalb ueber ein Ref: der Timer
     fragt beim Starten nach der aktuellen Folge, nicht nach der von damals. */
  const bauen = useRef(sequenz);
  bauen.current = sequenz;

  /* Ohne label: diese Uhr meldet keinen Streifen. Intervalltimer und
     Testbereich liegen in eigenen Bereichen, und ein Streifen im
     Trainings-Tab verwiese auf einen Bildschirm, den er nicht oeffnen kann. */
  const basis = useTimerBasis({ kennung });
  const { timer, zeichnen } = basis;

  useEffect(() => {
    const ab = [];
    ab.push(timer.on('step', ({ step, index }) => {
      flags.current = { half:false, minute:false, zehn:false };
      zeichnen();
      const naechster = timer.sequence[index + 1];
      if(step.type === 'prep'){
        speak('Bereit machen. Gleich geht es los mit ' + (naechster ? naechster.label : 'dem Einfahren') + '.', voice);
      }
      else if(step.type === 'work'){
        beep(880, 180); vibrate(40);
        /* Wiederholung und Gesamtzahl mitsagen: auf dem Rad schaut man nicht
           auf den Bildschirm, um zu wissen, die wievielte gerade laeuft. */
        const wo = step.reps > 1 ? 'Intervall ' + step.rep + ' von ' + step.reps : step.label;
        speak(wo + '. Los!', voice);
      }
      else if(step.type === 'rest'){
        beep(440, 180);
        speak('Erholung. Locker rollen in ' + (step.zone && step.zone.key ? step.zone.key.toUpperCase() : 'Zone 1') + '.', voice);
      }
      else if(step.type === 'warm'){ speak('Einfahren. Locker und gleichmäßig, Zone 1 bis 2.', voice); }
      else if(step.type === 'cool'){ beep(440, 180); speak('Alle Intervalle geschafft. Jetzt locker ausrollen.', voice); }
      else if(step.type === 'done'){
        beep(880, 300); beep(1046, 300, 200); vibrate([60, 40, 60]);
        speak('Einheit abgeschlossen. Stark gemacht!', voice);
        meldeTimer(kennung, false);
      }
    }));
    /* Nur die Ansagen: neu zeichnen und der Countdown-Piepser stehen in
       useTimerBasis. */
    ab.push(timer.on('tick', ({ step, secondsLeft }) => {
      const f = flags.current;
      if(step.type === 'work'){
        const half = Math.floor(step.duration / 2);
        if(!f.half && step.duration >= 120 && secondsLeft <= half){
          f.half = true; speak('Halbzeit. Tempo halten!', voice); beep(660, 150);
        }
        if(!f.minute && step.duration > 90 && secondsLeft <= 60){
          f.minute = true; speak('Noch eine Minute.', voice);
        }
      }
      if(step.type === 'rest' && !f.minute && step.duration > 90 && secondsLeft <= 30){
        f.minute = true; speak('Noch 30 Sekunden Erholung. Bereit machen.', voice);
      }
      if(!f.zehn && (step.type === 'rest' || step.type === 'prep' || step.type === 'warm') && secondsLeft <= 10){
        f.zehn = true;
        const naechster = timer.sequence[timer.index + 1];
        if(naechster && naechster.type === 'work') speak('Gleich ' + naechster.label + '.', voice);
      }
      if((step.type === 'warm' || step.type === 'cool') && !f.minute && step.duration > 120 && secondsLeft <= 60){
        f.minute = true; speak('Noch eine Minute.', voice);
      }
    }));
    return () => { ab.forEach(f => f()); };
    /* timer, kennung und zeichnen stehen bewusst nicht in der Liste: die
       ersten beiden sind fuer die Lebensdauer der Komponente dieselben,
       zeichnen setzt nur einen Zaehler. In der Liste waere der Linter
       zufrieden, ohne dass sich etwas aendert - nur laesst sich dann nicht
       mehr lesen, dass die Anmeldung an der Stimme haengt und an sonst
       nichts. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice]);

  const starten = () => basis.starten(() => bauen.current());
  function beenden(){ cancelSpeech(); timer.reset(); meldeTimer(kennung, false); zeichnen(); }
  function weiter(){ timer.skip(); meldeTimer(kennung, timer.running); zeichnen(); }
  /* Zurueck haelt an und blaettert stumm - wie im Rumpfzirkel. Wer im
     Ausrollen merkt, dass er ein Intervall uebersprungen hat, kommt so
     zurueck, ohne die ganze Einheit zu verlieren. */
  function zurueck(){ cancelSpeech(); timer.back(); meldeTimer(kennung, false); zeichnen(); }

  return { timer, starten, beenden, weiter, zurueck, zeichnen };
}
