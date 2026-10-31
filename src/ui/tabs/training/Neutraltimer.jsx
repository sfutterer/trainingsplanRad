/* Der neutrale Timer: Uebung und Pause im Wechsel, ohne Ende.

   Der eine Baustein ohne Bezug zum Plan. Die vier anderen zaehlen, was in
   plan.json steht - Runden, Saetze, Haltezeiten, Wiederholungen. Hier steht
   nichts davon: man waehlt eine Minute oder 30 Sekunden, drueckt Start, und
   die Uhr wechselt zwischen Uebung und 30 s Pause, bis man sie anhaelt. Fuer
   alles, was nicht im Plan steht und trotzdem getaktet werden soll.

   Deshalb "neutral" und deshalb ein eigenes Segment: in einen der geplanten
   Bausteine eingebaut waere er eine frei verstellbare Vorgabe neben einer, die
   aus der Plandatei kommt - und damit genau die Verwechslung, die der
   Rumpfzirkel mit seinen Eingabefeldern schon knapp vermeidet.

   Zwei Dauern zur Wahl und keine Eingabefelder: ein Zahlenfeld wie im Zirkel
   waere hier mehr Bedienung fuer eine Entscheidung, die aus zwei Werten
   besteht. Die Pause ist fest - sie ist nicht die Groesse, um die es geht, und
   eine dritte Stellschraube macht aus einer Uhr eine Einstellseite.

   Die Ansagen tragen die ganze Bedienung: "Beginne mit Übung" und "Pause", je
   zu Beginn des Abschnitts. Dieser Timer laeuft typischerweise, waehrend
   niemand auf den Bildschirm sieht - der Ring ist die Kontrolle, gesagt wird,
   was gilt.

   Kein Protokoll: aufgezeichnet wird, was der Plan vorsieht. Eine Uhr ohne
   Uebung hat nichts zu berichten. */

import { useEffect, useState } from 'preact/hooks';
import { settings } from '../../../state/store.js';
import { buildNeutralSequence } from '../../../domain/timer/sequences.js';
import { Baustein } from './Baustein.jsx';
import { Buehne } from '../../components/Buehne.jsx';
import { Segmented } from '../../components/Segmented.jsx';
/* Uhr, Countdown-Piepser und Abmeldung teilt sich dieser Timer mit den
   uebrigen - siehe useTimerBasis.js. Nur `endlos` ist hier neu. */
import { useTimerBasis } from '../../components/useTimerBasis.js';
import { speak, beep, cancelSpeech } from '../../../platform/index.js';

const PAUSE_SEK = 30;
const DAUERN = [{ sek: 60, label: '1 Minute' }, { sek: 30, label: '30 Sekunden' }];

export function Neutraltimer(){
  const s = settings.value;
  const [workSec, setWorkSec] = useState(DAUERN[0].sek);
  /* Geschaffte Durchgaenge. Nur fuer die Anzeige - ohne Rundenzahl waere der
     Ring die einzige Rueckmeldung, und der sieht nach dem fuenften Wechsel
     genauso aus wie nach dem ersten. */
  const [runden, setRunden] = useState(0);

  const { timer, zeichnen, melden, starten: basisStart } =
    useTimerBasis({ kennung: 'neutral', label: 'Timer', segment: 'neutral', endlos: true });

  useEffect(() => {
    const ab = [];
    ab.push(timer.on('step', ({ step }) => {
      zeichnen();
      if(step.type === 'work'){
        beep(880, 180);
        speak('Beginne mit Übung', s.voice);
      } else {
        beep(440, 180);
        speak('Pause', s.voice);
      }
    }));
    /* Beim Verlassen einer Uebung zaehlt der Durchgang - auch wenn man ihn mit
       Weiter abgekuerzt hat: die Entscheidung, dass es reicht, ist eine
       Entscheidung und kein Fehler. Nur das Abbrechen zaehlt nicht mit, es
       meldet `abandoned`. */
    ab.push(timer.on('leave', ({ step, abandoned }) => {
      if(step && step.type === 'work' && !abandoned) setRunden(n => n + 1);
    }));
    return () => { ab.forEach(f => f()); };
    /* Nur die Stimme steht in der Liste: timer und zeichnen sind fuer die
       Lebensdauer der Komponente dieselben - dieselbe Begruendung wie in den
       uebrigen Anbindungen. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.voice]);

  function starten(){
    basisStart(() => {
      setRunden(0);
      return buildNeutralSequence({ workSec, restSec: PAUSE_SEK });
    });
  }
  function abbrechen(){
    cancelSpeech();
    timer.reset();
    setRunden(0);
    melden(false);
    zeichnen();
  }
  function weiter(){
    timer.skip();
    melden(timer.running);
    zeichnen();
  }
  function zurueck(){
    cancelSpeech();
    timer.back();
    melden(false);
    zeichnen();
  }

  const step = timer.step;
  const laeuft = timer.running;
  const sec = timer.secondsLeft();
  /* Eine geladene Folge, ob laufend oder angehalten. Solange eine steht, ist
     die Dauer gesperrt: die Folge wird beim Start gebaut, eine Aenderung
     danach gaelte erst nach dem Abbrechen - und ein Knopf, der nichts tut, ist
     schlimmer als ein gesperrter. */
  const aktiv = timer.index >= 0;

  const phase = !step ? 'Bereit' : step.type === 'work' ? 'Belastung' : 'Pause';
  const meta = !step ? 'Pause ' + PAUSE_SEK + ' s dazwischen'
    : step.type === 'work' ? 'Durchgang ' + (runden + 1)
    : runden + ' geschafft · ' + PAUSE_SEK + ' s Pause';

  return (
    <Baustein
      titel="Timer"
      meta={workSec + ' s · Pause ' + PAUSE_SEK + ' s'}
      status={<p class="tagchip">Neutral · ohne Bezug zum Plan</p>}
      buehne={
        <Buehne
          ring={{ fraction: timer.fraction(),
                  color: !step ? 'var(--prep)'
                       : step.type === 'work' ? 'var(--work)' : 'var(--rest)',
                  phase,
                  time: String(step ? sec : workSec),
                  exercise: step ? step.label : 'Übung',
                  meta }}
          zurueck={{ onClick: zurueck, disabled: !step || timer.index <= 0 }}
          haupt={{ label: laeuft ? 'Pause' : (step ? 'Fortsetzen' : 'Start'),
                   onClick: starten }}
          weiter={{ onClick: weiter, disabled: !step }}
          ende={step ? { label:'Abbrechen', onClick: abbrechen } : null} />
      }>

      <div class="card">
        <div class="row"><span>Dauer der Übung</span><b>{aktiv ? 'läuft' : 'zur Wahl'}</b></div>
        <Segmented
          ziele={DAUERN.map(d => ({ id: String(d.sek), label: d.label, disabled: aktiv }))}
          aktiv={String(workSec)}
          onWaehlen={id => setWorkSec(Number(id))}
          rolle="radio" label="Dauer der Übung" />
        <p class="hint">
          Nach dem Start wechseln sich Übung und {PAUSE_SEK} s Pause ab, bis du
          abbrichst. Zu jedem Abschnitt kommt die Ansage – „Beginne mit Übung“
          oder „Pause“.
        </p>
        {aktiv ? (
          <p class="hint">Die Dauer gilt für den laufenden Wechsel. Zum Ändern erst abbrechen.</p>
        ) : null}
      </div>
    </Baustein>
  );
}
