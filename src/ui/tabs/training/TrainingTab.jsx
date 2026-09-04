/* Sammelbereich fuer alles, was ohne Rad stattfindet: Rumpf, Beine,
   Beweglichkeit, Koordination.

   Vier Segmente flach nebeneinander statt zweier gestaffelter Leisten. Eine
   zweite Ebene ("Kraft" mit Unterauswahl, "Mobilitaet" mit Unterauswahl) waere
   ein Tipp mehr fuer jeden Wechsel und wuerde verbergen, dass es vier
   gleichrangige Bausteine sind. Die vier Etiketten passen in eine Zeile,
   sobald die Schrift mitskaliert - die Regeln dafuer stehen in training.css.

   Alle vier Bausteine folgen demselben Geruest aus Baustein.jsx: Kopf, Buehne,
   Inhalt, Hinweise, Schluss. Vorher hatte jeder seinen eigenen Bauplan - der
   Start lag mal oben, mal am Ende der letzten Karte, mal gar nicht, und die
   Hinweise standen an vier verschiedenen Stellen.

   Alle vier bleiben montiert und werden nur ausgeblendet. Das ist kein Detail:
   die Timer haengen an den Bausteinen, und ein ausgehaengter Baustein nimmt
   seine laufende Uhr mit. Genau das passierte bisher bei Beweglichkeit und
   Koordination - der Rumpfzirkel lief beim Umschalten weiter, ihre Haltezeit
   wurde stillschweigend verworfen. Preact haelt den Zustand der versteckten
   Baeume, das Zeichnen kostet nichts, solange ihre Uhren stillstehen.

   Der Rumpf-Timer lebt weiterhin in dieser Datei: er ist der Timer dieses
   einen Bausteins, so wie der Beinblock und die beiden Koerperbloecke ihren
   eigenen mitbringen. Alle melden sich unter eigenem Namen bei timerState an,
   damit mehrere gleichzeitig laufen koennen.

   Beweglichkeit und Koordination schreiben bewusst nichts ins Protokoll -
   coreLog bleibt den beiden Kraftteilen vorbehalten, so wie es der Plan
   vorgibt. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { plan, week, settings, coreLog, saveCoreLog, today, startDate } from '../../../state/store.js';
import { laufendeTimer } from '../../../state/timerState.js';
import { buildCircuitSequence } from '../../../domain/timer/sequences.js';
import { coreRoundsForDay, coreWorkSeconds, coreRestSeconds, coreMinutes,
         repShort } from '../../../domain/core.js';
import { isoDayLocal, weekNumberFor } from '../../../domain/week.js';
import { ExerciseDialog } from '../../components/ExerciseDialog.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Zahlenfeld } from '../../components/Feld.jsx';
import { Baustein, Uebungsliste } from './Baustein.jsx';
import { Buehne } from '../../components/Buehne.jsx';
/* Uhr, Countdown-Piepser und Abmeldung teilt sich der Zirkel mit den uebrigen
   Timern - siehe useTimerBasis.js. */
import { useTimerBasis } from '../../components/useTimerBasis.js';
import { Beinblock } from './Beinblock.jsx';
import { Beweglichkeit } from './Beweglichkeit.jsx';
import { Koordination } from './Koordination.jsx';
import { speak, beep, vibrate, cancelSpeech } from '../../../platform/index.js';
import '../../components/timer.css';
import './training.css';

const FARBE = { work:'var(--work)', rest:'var(--rest)', roundrest:'var(--rest)', prep:'var(--prep)', done:'var(--work)' };

const SEGMENTE = [
  { id: 'core',         label: 'Rumpf' },
  { id: 'leg',          label: 'Beine' },
  { id: 'mobility',     label: 'Beweglichkeit' },
  { id: 'coordination', label: 'Koordination' }
];

export function TrainingTab(){
  const p = plan.value, w = week.value;
  const dow = today.value.getDay();
  const s = settings.value;

  function vorgabe(){
    return {
      workSec: coreWorkSeconds(p, w),
      restSec: coreRestSeconds(p, w),
      roundRestSec: p.circuit.roundRestSeconds,
      rounds: coreRoundsForDay(p, w, dow)
    };
  }
  const [cfg, setCfg] = useState(vorgabe);
  const [dialogEx, setDialogEx] = useState(null);
  const [segment, setSegment] = useState('core');
  const logRef = useRef(null);

  const { timer, zeichnen, melden, starten: basisStart } =
    useTimerBasis({ kennung: 'zirkel', label: 'Zirkel', segment: 'core' });

  /* Protokoll: der Timer weiss genau, was lief - intervals.icu speichert bei
     Krafteinheiten nur Dauer und Puls, keine Uebung und keinen Satz. */
  function logStart(){
    const now = new Date();
    logRef.current = {
      kind: 'core', id: now.toISOString(), day: isoDayLocal(now),
      week: weekNumberFor(now, startDate.value),
      plannedRounds: cfg.rounds, exCount: p.circuit.exercises.length,
      workSec: cfg.workSec, restSec: cfg.restSec,
      rounds: 0, sets: 0, workSecTotal: 0, finished: false,
      exercises: p.circuit.exercises.map(ex => ({ name: ex.name, sets: 0, heldSec: 0, skips: 0 })),
      skips: [], lastExercise: null
    };
    persist();
  }
  function persist(){
    const l = logRef.current;
    if(!l) return;
    const liste = coreLog.value.slice();
    const i = liste.findIndex(e => e.id === l.id);
    if(i >= 0) liste[i] = l; else liste.push(l);
    saveCoreLog(liste);
  }

  useEffect(() => {
    const ab = [];
    ab.push(timer.on('step', ({ step, index }) => {
      zeichnen();
      const naechste = timer.sequence[index + 1];
      if(step.type === 'prep'){
        const erste = p.circuit.exercises[0];
        speak('Bereit machen. Erste Übung: ' + erste.name, s.voice);
      } else if(step.type === 'work'){
        beep(880, 180);
        /* Die Ansage traegt die Dosierung mit: auf dem Boden liegend liest
           niemand den Bildschirm ab. Der Tempohinweis nur in der ersten Runde -
           danach nervt er. */
        const t = step.reps;
        let ansage = step.label + '.';
        if(t){
          ansage += t.perSide
            ? ` Abwechselnd, ${t.perSide} Wiederholungen pro Seite.`
            : ` Ziel ${t.reps} Wiederholungen.`;
          if(step.round === 1) ansage += ` Etwa ${t.tempo} Sekunden pro Wiederholung, betont langsam.`;
        }
        speak(ansage + ' Los!', s.voice);
      } else if(step.type === 'rest'){
        beep(440, 180);
        speak('Pause.' + (naechste && naechste.type === 'work' ? ' Nächste Übung: ' + naechste.label + '.' : ''), s.voice);
      } else if(step.type === 'roundrest'){
        beep(440, 180);
        speak(`Runde ${step.round} geschafft. Rundenpause.`, s.voice);
      } else if(step.type === 'done'){
        beep(880, 300); beep(1046, 300, 200);
        speak('Training abgeschlossen. Gut gemacht!', s.voice);
        if(logRef.current){ logRef.current.finished = true; persist(); logRef.current = null; }
        melden(false);
        vibrate([60, 40, 60]);
        /* Der Zirkel ist das Aufwaermen des Beinblocks - wer ihn beendet, will
           dorthin. An jedem Tag gleich: welcher Tag wofuer vorgesehen ist,
           weiss der Nutzer selbst. */
        setSegment('leg');
      }
    }));
    ab.push(timer.on('leave', ({ step, restSeconds }) => {
      const l = logRef.current;
      if(!l || !step || step.type !== 'work') return;
      const offen = Math.max(0, restSeconds || 0);
      const gehalten = Math.max(0, step.duration - offen);
      const ex = l.exercises[step.exIndex];
      if(ex){ ex.sets += 1; ex.heldSec += gehalten; if(offen >= 2) ex.skips += 1; }
      l.sets += 1; l.workSecTotal += gehalten; l.rounds = step.round;
      l.lastExercise = { index: step.exIndex, name: step.label, round: step.round };
      if(offen >= 2) l.skips.push({ index: step.exIndex, name: step.label, round: step.round,
                                    heldSec: gehalten, sollSec: step.duration });
      persist();
    }));
    return () => { ab.forEach(f => f()); };
    /* Nur die Stimme steht in der Liste: timer, melden und zeichnen sind fuer
       die Lebensdauer der Komponente dieselben. In der Liste waere der Linter
       zufrieden, ohne dass sich etwas aendert - nur laesst sich dann nicht
       mehr lesen, dass die Anmeldung an der Stimme haengt und an sonst
       nichts. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.voice]);

  /* Die Vorgaben haengen an Woche und Wochentag, und beide koennen sich
     aendern, waehrend die App offen ist - eine PWA laeuft ueber Nacht weiter,
     und genau dafuer gibt es das today-Signal. Ohne diesen Effekt behielte cfg
     die Werte vom Einhaengen: wer die App am Samstagabend offen laesst und am
     Sonntagmorgen den Zirkel startet, bekaeme die Rundenzahl der Vorwoche.

     Nicht waehrend eine Uhr laeuft: mitten im Zirkel die Rundenzahl unter der
     laufenden Folge auszutauschen waere schlimmer als der veraltete Wert. */
  useEffect(() => {
    if(timer.running) return;
    setCfg(vorgabe());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, dow]);

  /* Der Protokolleintrag entsteht genau dann, wenn die Folge neu geladen
     wird - deshalb haengt logStart am Bauen der Folge und nicht am Start:
     Fortsetzen nach einer Pause darf keinen zweiten Eintrag anlegen. */
  function starten(){
    basisStart(() => { logStart(); return buildCircuitSequence(p, cfg); });
  }
  function abbrechen(){
    cancelSpeech();
    const l = logRef.current;
    if(l){
      if(l.sets === 0) saveCoreLog(coreLog.value.filter(e => e.id !== l.id));
      else { l.finished = false; persist(); }
      logRef.current = null;
    }
    timer.reset();
    melden(false);
    zeichnen();
  }
  function weiter(){
    timer.skip();
    melden(timer.running);
    zeichnen();
  }
  /* Zurueck meldet dem Protokoll nichts: die Engine haelt an und blaettert
     stumm, der wiederholte Satz zaehlt einmal. */
  function zurueck(){
    cancelSpeech();
    timer.back();
    melden(false);
    zeichnen();
  }

  const step = timer.step;
  const laeuft = timer.running;
  const sec = timer.secondsLeft();
  const aktiveUebung = step && step.type === 'work' ? step.exIndex : null;

  const legEintrag = coreLog.value.find(e => e && e.kind === 'leg' && e.day === isoDayLocal(today.value)) || null;

  const phase = !step ? 'Bereit'
    : step.type === 'work' ? 'Belastung'
    : step.type === 'rest' ? 'Pause'
    : step.type === 'roundrest' ? 'Rundenpause'
    : step.type === 'done' ? 'Fertig' : 'Bereit';

  /* In der Pause die naechste Uebung zeigen - man richtet sich waehrend der
     Pause schon ein, nicht erst wenn die Ansage kommt. */
  let bildIndex = null, vorschau = false;
  if(s.showIllu && step){
    if(step.type === 'work'){ bildIndex = step.exIndex; }
    else if(step.type === 'prep'){ bildIndex = 0; vorschau = true; }
    else if(step.type === 'rest' || step.type === 'roundrest'){
      const n = timer.sequence[timer.index + 1];
      if(n && n.type === 'work'){ bildIndex = n.exIndex; vorschau = true; }
    }
  }
  const bild = bildIndex == null ? null : p.circuit.exercises[bildIndex];

  const tagText = dow === 3 ? 'Mittwoch – verkürzter Zirkel'
    : dow === 0 ? 'Sonntag – voller Zirkel' : 'kein Zirkeltag laut Plan';

  /* Jeder Timer, der in einem anderen Baustein laeuft, bekommt einen Streifen.
     Ohne ihn liefe er unsichtbar - man hoert ihn nur noch. */
  const fremde = laufendeTimer.value.filter(t => t.segment && t.segment !== segment);

  return (
    <>
      {/* Vier Segmente an jedem Tag, in derselben Form. Nur die Namen der
          Bausteine: Rundenzahl und Fortschritt stehen in den Karten darunter
          und im Ring, im Umschalter waeren sie ein zweites Mal dasselbe. Wann
          welcher Baustein ansteht, sagt der Plan - die App versperrt keinen
          Tag. */}
      <Segmented ziele={SEGMENTE} aktiv={segment} onWaehlen={setSegment}
        klasse="vier" label="Trainingsbausteine" />

      {fremde.map(t => (
        <button key={t.id} class="laufstreifen" onClick={() => setSegment(t.segment)}>
          <span>{t.label} läuft ›</span><b>{t.sek != null ? t.sek + ' s' : ''}</b>
        </button>
      ))}

      <div hidden={segment !== 'core'}>
        <Baustein
          titel="Rumpf"
          meta={cfg.rounds + ' Runden · ca. ' + coreMinutes(p, w, cfg.rounds) + ' min'}
          status={<p class="tagchip">Woche {w} · {tagText}</p>}
          buehne={
            <Buehne
              ring={{ fraction: timer.fraction(),
                      color: FARBE[step ? step.type : 'prep'] || 'var(--prep)',
                      phase,
                      time: step ? (step.type === 'done' ? '0' : String(sec)) : String(cfg.workSec),
                      exercise: step ? step.label : p.circuit.exercises[0].name,
                      meta: step && step.round ? 'Runde ' + step.round + ' / ' + cfg.rounds
                                               : 'Als Erstes · ' + repShort(p.circuit.exercises[0], cfg.workSec) }}
              bild={bild ? { src: bild.img, name: bild.name, vorschau,
                             cap: <b>{bild.name}</b>,
                             onClick: () => setDialogEx({ kind:'core', i: bildIndex }) } : null}
              zurueck={{ onClick: zurueck, disabled: !step || timer.index <= 0 }}
              haupt={{ label: laeuft ? 'Pause' : (step && step.type !== 'done' ? 'Fortsetzen' : 'Start'),
                       onClick: starten }}
              weiter={{ onClick: weiter, disabled: !step || step.type === 'done' }}
              ende={step ? { label:'Abbrechen', onClick: abbrechen } : null} />
          }
          hinweise={[p.texts.coreAbortRule]}
          schluss={
            <div class="card">
              <div class="row"><span>Einstellungen</span><b>Woche {w}</b></div>
              {/* Ein leeres Feld laesst den bisherigen Wert stehen: waehrend
                  des Tippens ist es kurz leer, und eine Belastung von null
                  Sekunden gibt es nicht. */}
              <Zahlenfeld titel="Belastung (Sek.)" wert={cfg.workSec} min={1}
                onWert={v => setCfg({ ...cfg, workSec: v ?? cfg.workSec })} />
              <Zahlenfeld titel="Pause (Sek.)" wert={cfg.restSec} min={0}
                onWert={v => setCfg({ ...cfg, restSec: v ?? cfg.restSec })} />
              <Zahlenfeld titel="Rundenpause (Sek.)" wert={cfg.roundRestSec} min={0}
                onWert={v => setCfg({ ...cfg, roundRestSec: v ?? cfg.roundRestSec })} />
              <Zahlenfeld titel="Runden" wert={cfg.rounds} min={1}
                onWert={v => setCfg({ ...cfg, rounds: v ?? cfg.rounds })} />
            </div>
          }>

          {/* Die Liste bleibt waehrend des Laufs stehen und markiert die
              aktive Uebung - dieselbe Zeilenform wie in den anderen drei
              Bausteinen, mit der Dosierung unter dem Namen. */}
          <div class="card">
            <div class="row"><span>Übungen</span>
              <b>{step && step.round ? 'Runde ' + step.round + ' von ' + cfg.rounds
                                     : p.circuit.exercises.length + ' im Zirkel'}</b></div>
            <Uebungsliste
              uebungen={p.circuit.exercises.map(ex => ({
                key: ex.name, name: ex.name, dosis: repShort(ex, cfg.workSec),
                /* Nur bei Wiederholungen: dort ist das Zeitfenster die zweite
                   Haelfte der Anweisung. Bei "35 s halten" stuende sonst
                   dieselbe Zahl zweimal in einer Zeile. */
                fokus: ex.mode === 'reps' ? 'in ' + cfg.workSec + ' s' : null
              }))}
              aktiv={aktiveUebung}
              onOpen={i => setDialogEx({ kind:'core', i })} />

            {/* Die Schritte der laufenden Uebung unter der Liste - wie im
                gefuehrten Ablauf. Auf dem Boden liegend ist das Bottom Sheet
                ein Tipp zu weit. */}
            {aktiveUebung != null ? (
              <ol class="ablaufschritte">
                {p.circuit.exercises[aktiveUebung].steps.map((t, i) => <li key={i}>{t}</li>)}
              </ol>
            ) : null}
          </div>
        </Baustein>
      </div>

      <div hidden={segment !== 'leg'}>
        <Beinblock eintrag={legEintrag} onOpen={i => setDialogEx({ kind:'leg', i })} />
      </div>

      <div hidden={segment !== 'mobility'}>
        <Beweglichkeit onOpen={i => setDialogEx({ kind:'mobility', i })} />
      </div>

      <div hidden={segment !== 'coordination'}>
        <Koordination onOpen={i => setDialogEx({ kind:'coordination', i })} />
      </div>

      {dialogEx && <ExerciseDialog spec={dialogEx} workSec={cfg.workSec} onClose={() => setDialogEx(null)} />}
    </>
  );
}
