/* Gefuehrter Ablauf fuer Beweglichkeit und Koordination.

   Eine Datei fuer beide Bloecke: sie beschreiben ihre Uebungen gleich (Name,
   Dosierung, Fokus, Bild, Schritte), und zwei getrennte Ablaeufe nebeneinander
   waeren bei jeder Aenderung auseinandergelaufen - dasselbe Argument, mit dem
   schon der Uebungsdialog und die Planpruefung nur einmal existieren.

   Die Uhr laeuft nur an den zeitdosierten Uebungen. Welche das sind, sagt die
   Dosierung im Plan (siehe domain/koerper.js); "10 Wdh. je Seite" bekommt
   weiterhin keinen Ring, weil daneben eine Uhr nichts zu tun haette. An deren
   Stelle tritt die Dosierung selbst auf der Buehne, und die Haupttaste heisst
   "Erledigt" statt "Start" - die Bedienung bleibt damit an derselben Stelle,
   ohne eine Zeit zu versprechen, die der Plan nicht vorgibt.

   Kein Zirkel: die Uhr schaltet nie in die naechste Uebung. Sie zaehlt die
   Saetze einer Uebung ab und haelt dann an - weiter geht es erst auf Weiter.
   Zwischen zwei Saetzen haelt sie ebenfalls an, weil der Plan keine Satzpause
   nennt: eine erfundene Zahl waere hier schlechter als ein Tipp auf den Ring.

   Die Buehne steht oben, auch bevor der Ablauf laeuft. Vorher lag der Start
   als Knopf unter der Uebungsliste - man musste erst an fuenf Zeilen vorbei,
   um ihn zu finden, waehrend der Rumpfzirkel oben startete. Jetzt liegt der
   Start in allen vier Bausteinen am selben Fleck.

   Bewusst ohne Protokoll - der Plan sieht fuer diese beiden Bloecke keine
   Aufzeichnung vor, daran aendert der Timer nichts. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { settings } from '../../../state/store.js';
import { buildHoldSequence } from '../../../domain/timer/sequences.js';
import { zeitDosis } from '../../../domain/koerper.js';
import { Uebungsliste } from './Baustein.jsx';
import { Buehne } from '../../components/Buehne.jsx';
/* Uhr, Countdown-Piepser und Abmeldung teilt sich dieser Ablauf mit den
   uebrigen Timern - siehe useTimerBasis.js. */
import { useTimerBasis } from '../../components/useTimerBasis.js';
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

/* Buehne und Liste kommen getrennt zurueck: der Baustein steckt die eine in
   den Buehnen-Platz und die andere in den Inhalt, damit die Reihenfolge fuer
   alle vier gleich bleibt. */
export function useKoerperablauf({ uebungen, timerId, label, segment, onOpen }){
  const s = settings.value;
  /* -1 heisst: kein Ablauf, nur die Liste. */
  const [schritt, setSchritt] = useState(-1);
  const { timer, zeichnen, melden, starten: basisStart } =
    useTimerBasis({ kennung: timerId, label, segment });

  const laufend = schritt >= 0 && schritt < uebungen.length;
  const aktuelle = laufend ? uebungen[schritt] : uebungen[0];
  const letzte = schritt === uebungen.length - 1;
  const zeit = laufend ? zeitDosis(aktuelle.dosage) : null;

  /* Die Ansagen brauchen die naechste Uebung, die Abonnenten haengen aber nur
     an der Stimme. Ueber ein Ref bleiben sie aktuell, ohne bei jedem Schritt
     neu angemeldet zu werden. */
  const naechsteRef = useRef(null);
  naechsteRef.current = laufend && !letzte ? uebungen[schritt + 1] : null;

  useEffect(() => {
    const ab = [];
    ab.push(timer.on('step', ({ step, index }) => {
      zeichnen();
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
          melden(false);
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
        melden(false);
      }
    }));
    return () => { ab.forEach(f => f()); };
    /* timer, melden und zeichnen stehen bewusst nicht in der Liste: sie sind
       fuer die Lebensdauer der Komponente dieselben. In der Liste waere der
       Linter zufrieden, ohne dass sich etwas aendert - nur laesst sich dann
       nicht mehr lesen, dass die Anmeldung an der Stimme haengt und am Namen
       des Timers. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.voice, timerId]);

  /* Jede Uebung bringt ihre eigene Folge mit. Beim Wechsel wird die alte
     verworfen - eine halb gelaufene Uebung setzt nicht heimlich fort, wenn man
     spaeter zurueckblaettert.

     Der Schluessel der laufenden Uebung steht als eigene Variable in der Liste
     und nicht als Ausdruck darin: ein zusammengesetzter Ausdruck laesst sich
     nicht mehr statisch pruefen, und beim Lesen sieht man nicht auf einen
     Blick, worauf der Effekt reagiert. */
  const laufendeUebung = laufend ? aktuelle.key : null;
  useEffect(() => {
    timer.reset(laufend && zeit ? buildHoldSequence(aktuelle) : []);
    melden(false);
    zeichnen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schritt, laufendeUebung]);

  function starten(){
    if(!zeit) return;
    basisStart(() => buildHoldSequence(aktuelle));
  }

  /* Blaettern haelt immer auch die Ansage an: sonst spricht die App noch ueber
     die Uebung, die man gerade verlassen hat. */
  function blaettern(ziel){
    cancelSpeech();
    setSchritt(ziel);
  }

  function beginnen(){
    primeSpeech();
    ensureWakeLock();
    setSchritt(0);
  }

  const step = timer.step;
  const laeuft = timer.running;
  const sec = timer.secondsLeft();

  const phase = !step ? 'Bereit'
    : step.type === 'done' ? 'Fertig'
    : laeuft ? 'Halten' : 'Pause';

  const zurueck = { onClick: () => blaettern(schritt - 1), disabled: !laufend || schritt === 0 };
  const weiter  = { label: letzte ? 'Fertig' : 'Weiter',
                    onClick: () => blaettern(letzte ? -1 : schritt + 1), disabled: !laufend };
  const ende    = laufend ? { label:'Ablauf beenden', onClick: () => blaettern(-1) } : null;

  /* Drei Zustaende, eine Anordnung. Bereit zeigt die erste Uebung, damit die
     Buehne nicht leer steht und man vor dem Start sieht, was kommt.

     Die angehaltene Uhr laeuft auf "Fortsetzen" weiter und nicht auf "Weiter":
     Weiter heisst in allen vier Bausteinen dasselbe, naemlich naechste Uebung. */
  const buehne = !laufend ? (
    <Buehne
      dosis={{ phase:'Bereit', wert: uebungen.length + ' Übungen',
               exercise: uebungen[0].name, meta: 'Als Erstes · ' + uebungen[0].dosage }}
      haupt={{ label:'Ablauf starten', onClick: beginnen }}
      zurueck={{ disabled: true }} weiter={{ disabled: true }} />
  ) : zeit ? (
    <Buehne
      ring={{ fraction: timer.fraction(),
              color: step && step.type !== 'done' ? 'var(--work)' : 'var(--prep)',
              phase,
              time: step ? (step.type === 'done' ? '0' : String(sec)) : String(zeit.sekunden),
              exercise: step ? step.label : aktuelle.name,
              meta: step ? satzText(step) : aktuelle.dosage }}
      bild={{ src: aktuelle.img, name: aktuelle.name,
              cap: <b>{aktuelle.name}</b>, onClick: () => onOpen(schritt) }}
      zurueck={zurueck}
      haupt={{ label: laeuft ? 'Pause' : (step && step.type !== 'done' ? 'Fortsetzen' : 'Start'),
               onClick: starten }}
      weiter={weiter} ende={ende} />
  ) : (
    <Buehne
      dosis={{ phase:'Übung ' + (schritt + 1) + ' / ' + uebungen.length,
               wert: aktuelle.dosage, exercise: aktuelle.name, meta: aktuelle.focus }}
      bild={{ src: aktuelle.img, name: aktuelle.name,
              cap: <b>{aktuelle.name}</b>, onClick: () => onOpen(schritt) }}
      zurueck={zurueck}
      haupt={{ label:'Erledigt', onClick: () => blaettern(letzte ? -1 : schritt + 1) }}
      weiter={weiter} ende={ende} />
  );

  /* Die Liste bleibt waehrend des Ablaufs stehen und markiert die laufende
     Uebung, statt zu verschwinden. Der frueher noetige Fortschrittsbalken
     entfaellt damit: die markierte Zeile sagt dasselbe und zeigt zusaetzlich,
     was noch kommt. */
  const liste = (
    <div class="card">
      <div class="row"><span>Übungen</span>
        <b>{laufend ? 'Übung ' + (schritt + 1) + ' von ' + uebungen.length
                    : uebungen.length + ' in Folge'}</b></div>
      <Uebungsliste
        uebungen={uebungen.map(ex => ({
          key: ex.key, name: ex.name, dosis: ex.dosage, fokus: ex.focus,
          rechts: zeitDosis(ex.dosage) ? 'Timer ›' : '›'
        }))}
        aktiv={laufend ? schritt : null}
        onOpen={onOpen} />

      {laufend ? (
        <ol class="ablaufschritte">{aktuelle.steps.map((t, i) => <li key={i}>{t}</li>)}</ol>
      ) : null}
    </div>
  );

  return { buehne, liste };
}
