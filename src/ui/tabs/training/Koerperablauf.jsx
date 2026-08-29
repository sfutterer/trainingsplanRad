/* Gefuehrter Ablauf fuer Beweglichkeit und Koordination.

   Eine Datei fuer beide Bloecke: sie beschreiben ihre Uebungen gleich (Name,
   Dosierung, Fokus, Bild, Schritte), und zwei getrennte Ablaeufe nebeneinander
   waeren bei jeder Aenderung auseinandergelaufen - dasselbe Argument, mit dem
   schon der Uebungsdialog und die Planpruefung nur einmal existieren.

   Die Uhr laeuft nur an den zeitdosierten Uebungen. Welche das sind, sagt die
   Dosierung im Plan (siehe domain/koerper.js); "10 Wdh. je Seite" bekommt
   weiterhin keinen Ring, weil daneben eine Uhr nichts zu tun haette.

   Kein Zirkel: die Uhr schaltet nie in die naechste Uebung. Sie zaehlt die
   Saetze einer Uebung ab und haelt dann an - weiter geht es erst auf Weiter.
   Zwischen zwei Saetzen haelt sie ebenfalls an, weil der Plan keine Satzpause
   nennt: eine erfundene Zahl waere hier schlechter als ein Tipp auf den Ring.

   Bedienung und Farben folgen dem Rumpfzirkel: derselbe Ring, dieselbe
   Anordnung Zurueck/Start/Weiter, dieselben Toene. Wer den Zirkel kennt, muss
   hier nichts Neues lernen.

   Bewusst ohne Protokoll - der Plan sieht fuer diese beiden Bloecke keine
   Aufzeichnung vor, daran aendert der Timer nichts. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { settings } from '../../../state/store.js';
import { meldeTimer } from '../../../state/timerState.js';
import { createTimer } from '../../../domain/timer/engine.js';
import { buildHoldSequence } from '../../../domain/timer/sequences.js';
import { zeitDosis } from '../../../domain/koerper.js';
import { ProgressRing } from '../../components/ProgressRing.jsx';
import { Uebungsbild } from './Uebungsbild.jsx';
import { speak, primeSpeech, beep, vibrate, ensureWakeLock, cancelSpeech } from '../../../platform/index.js';

/* Satz und Seite in einer Zeile - beides nur, wenn es mehr als eines gibt.
   "Satz 1 / 1" waere eine Zahl, die nichts entscheidet. */
function satzText(step){
  if(!step || step.type !== 'hold') return '';
  const teile = [];
  if(step.saetze > 1) teile.push('Satz ' + step.satz + ' / ' + step.saetze);
  if(step.seite) teile.push('Seite ' + step.seite + ' / ' + step.seiten);
  return teile.join(' · ');
}

export function Koerperablauf({ uebungen, hint, timerId, mengeText, onOpen }){
  const s = settings.value;
  /* -1 heisst: kein Ablauf, nur die Liste. */
  const [schritt, setSchritt] = useState(-1);
  const [, tickState] = useState(0);
  const timerRef = useRef(null);
  if(!timerRef.current) timerRef.current = createTimer();
  const timer = timerRef.current;

  const laufend = schritt >= 0 && schritt < uebungen.length;
  const aktuelle = laufend ? uebungen[schritt] : null;
  const letzte = schritt === uebungen.length - 1;
  const zeit = aktuelle ? zeitDosis(aktuelle.dosage) : null;

  /* Die Ansagen brauchen die naechste Uebung, die Abonnenten haengen aber nur
     an der Stimme. Ueber ein Ref bleiben sie aktuell, ohne bei jedem Schritt
     neu angemeldet zu werden. */
  const naechsteRef = useRef(null);
  naechsteRef.current = laufend && !letzte ? uebungen[schritt + 1] : null;

  useEffect(() => {
    const ab = [];
    ab.push(timer.on('step', ({ step, index }) => {
      tickState(x => x + 1);
      if(step.type === 'hold'){
        if(index === 0){
          beep(880, 180);
          speak(step.label + '. ' + step.duration + ' Sekunden'
                + (step.seite ? ', erste Seite' : '') + '. Los!', s.voice);
        } else {
          /* Satzwechsel: anhalten statt durchlaufen. Die Engine hat den
             Schritt schon betreten, die Restzeit steht damit auf voller
             Dauer - ein Tipp auf den Ring loest sie aus. */
          timer.pause();
          meldeTimer(timerId, false);
          beep(440, 180);
          vibrate(40);
          speak((step.seite ? 'Seite wechseln.' : 'Kurz sammeln.')
                + (step.saetze > 1 ? ' Satz ' + step.satz + ' von ' + step.saetze + '.' : '')
                + ' Weiter, wenn du bereit bist.', s.voice);
        }
      } else if(step.type === 'done'){
        beep(880, 300); beep(1046, 300, 200);
        vibrate([60, 40, 60]);
        const n = naechsteRef.current;
        speak('Übung geschafft.' + (n ? ' Weiter drücken für: ' + n.name + '.' : ' Der Ablauf ist durch.'), s.voice);
        meldeTimer(timerId, false);
      }
    }));
    ab.push(timer.on('tick', ({ secondsLeft, sekundenwechsel }) => {
      tickState(x => x + 1);
      if(sekundenwechsel && secondsLeft <= 3 && secondsLeft > 0) beep(500, 120);
    }));
    return () => { ab.forEach(f => f()); };
  }, [s.voice, timerId]);

  /* Jede Uebung bringt ihre eigene Folge mit. Beim Wechsel wird die alte
     verworfen - eine halb gelaufene Uebung setzt nicht heimlich fort, wenn man
     spaeter zurueckblaettert. */
  useEffect(() => {
    timer.reset(aktuelle && zeit ? buildHoldSequence(aktuelle) : []);
    meldeTimer(timerId, false);
    tickState(x => x + 1);
  }, [schritt, aktuelle && aktuelle.key]);

  useEffect(() => () => { timer.reset(); meldeTimer(timerId, false); }, [timerId]);

  function starten(){
    if(!zeit) return;
    primeSpeech();
    ensureWakeLock();
    if(!timer.running && (timer.index === -1 || (timer.step && timer.step.type === 'done'))){
      timer.load(buildHoldSequence(aktuelle));
    }
    timer.toggle();
    meldeTimer(timerId, timer.running);
    tickState(x => x + 1);
  }

  /* Blaettern hält immer auch die Ansage an: sonst spricht die App noch über
     die Übung, die man gerade verlassen hat. */
  function blaettern(ziel){
    cancelSpeech();
    setSchritt(ziel);
  }

  const step = timer.step;
  const laeuft = timer.running;
  const sec = timer.secondsLeft();

  const phase = !step ? 'Bereit'
    : step.type === 'done' ? 'Fertig'
    : laeuft ? 'Halten' : 'Pause';

  return (
    <div class="card">
      {laufend ? (
        <>
          <div class="row"><span>Geführter Ablauf</span><b>Übung {schritt + 1} von {uebungen.length}</b></div>
          <div class="ablaufbalken" aria-hidden="true">
            {uebungen.map((ex, i) => <span key={ex.key} class={i <= schritt ? 'an' : ''}></span>)}
          </div>

          {zeit && (
            <div class="ablaufring">
              <ProgressRing
                fraction={timer.fraction()}
                color={step && step.type !== 'done' ? 'var(--work)' : 'var(--prep)'}
                phase={phase}
                time={step ? (step.type === 'done' ? '0' : String(sec)) : String(zeit.sekunden)}
                exercise={step ? step.label : 'Tippen zum Starten'}
                meta={step ? satzText(step) : aktuelle.dosage}
                onTap={starten}
              />
            </div>
          )}

          <Uebungsbild src={aktuelle.img} name={aktuelle.name} klasse="ablaufbild"
            onClick={() => onOpen(schritt)} />

          <h3 class="ablaufname">{aktuelle.name}</h3>
          <div class="dosisgross">{aktuelle.dosage}<small>{aktuelle.focus}</small></div>
          <ol class="ablaufschritte">{aktuelle.steps.map((t, i) => <li key={i}>{t}</li>)}</ol>

          {/* Zeitdosiert liegt die grosse Taste auf Start/Pause wie im Zirkel,
              und die Taste daneben rueckt eine Uebung weiter - nie die Uhr.
              Ohne Uhr bleibt Weiter die Haupttaste, weil es dann die einzige
              Bewegung im Ablauf ist.

              Die angehaltene Uhr laeuft auf "Fortsetzen" weiter und nicht auf
              "Weiter": Weiter heisst in beiden Fassungen dasselbe, naemlich
              naechste Uebung. Im Zirkel tragen beide Tasten dieselbe
              Aufschrift - hier stehen sie direkt nebeneinander und meinten
              Verschiedenes. */}
          {zeit ? (
            <>
              <div class="controls">
                <button class="btn secondary" onClick={() => blaettern(schritt - 1)}
                  disabled={schritt === 0}>Zurück</button>
                <button class="btn gross" onClick={starten}>
                  {laeuft ? 'Pause' : (step && step.type !== 'done' ? 'Fortsetzen' : 'Start')}</button>
                <button class="btn secondary" onClick={() => blaettern(letzte ? -1 : schritt + 1)}>
                  {letzte ? 'Fertig' : 'Weiter'}</button>
              </div>
              <button class="btn secondary block ablaufende"
                onClick={() => blaettern(-1)}>Ablauf beenden</button>
            </>
          ) : (
            <div class="controls">
              <button class="btn secondary" onClick={() => blaettern(schritt - 1)}
                disabled={schritt === 0}>Zurück</button>
              <button class="btn gross" onClick={() => blaettern(letzte ? -1 : schritt + 1)}>
                {letzte ? 'Fertig' : 'Weiter'}</button>
              <button class="btn secondary" onClick={() => blaettern(-1)}>Beenden</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div class="row"><span>Übungen</span><b>{mengeText}</b></div>
          {/* Der Hinweis auf die Uhr steht in der Zeile und nicht erst im
              Ablauf: sonst überrascht es, dass die eine Übung einen Ring
              bekommt und die nächste nicht. */}
          <div class="exlist koerperliste" style="margin-top:8px">
            {uebungen.map((ex, i) => (
              <button class="exrow" key={ex.key} onClick={() => onOpen(i)}>
                <span class="exname">
                  {i + 1}. {ex.name}
                  <small><b>{ex.dosage}</b> · {ex.focus}</small>
                </span>
                <span class="ziel">{zeitDosis(ex.dosage) ? 'Timer ›' : '›'}</span>
              </button>
            ))}
          </div>
          <button class="btn tonal block" style="margin-top:14px"
            onClick={() => setSchritt(0)}>Geführten Ablauf starten</button>
        </>
      )}
      <p class="hint">{hint}</p>
    </div>
  );
}
