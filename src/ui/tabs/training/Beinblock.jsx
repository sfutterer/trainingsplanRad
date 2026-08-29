/* Beinblock: Wiederholungen zaehlen, Pausen laufen lassen.

   Bisher war dies der einzige der vier Bausteine ohne jede Bedienung - eine
   Karte mit einem Raster, sonst nichts. Die Pausen standen als Fliesstext
   daneben ("Pause 30 s zwischen den Uebungen, 60 s zwischen den Runden"),
   obwohl beide Zahlen im Plan stehen und genau das sind, was eine Uhr zaehlen
   kann.

   Der gefuehrte Ablauf zaehlt deshalb die Pausen und nicht die Saetze. Das ist
   keine Sparmassnahme: eine Kniebeuge mit 3 s Absenken laesst sich nicht gegen
   eine Uhr fahren, ohne genau das Tempo zu verlieren, das den Reiz ausmacht.
   Der Satz endet, wenn er zu Ende ist - deshalb "Erledigt" auf der Haupttaste
   und nicht "Start".

   Die Wiederholungszahl wird auf der Buehne quittiert und landet im selben
   Protokoll wie bisher. Das Raster darunter bleibt: es ist die einzige Stelle,
   an der sich ein Satz nachtragen oder korrigieren laesst, und es zeigt die
   ganze Runde auf einmal.

   Weitergeschaltet wird nach der Pause von selbst - anders als bei
   Beweglichkeit und Koordination, wo die naechste Uebung eine Entscheidung
   ist. Hier steht die Reihenfolge im Plan fest, und wer nach 30 s Pause noch
   einen Knopf suchen muss, verliert die Pause. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { plan, week, settings, coreLog, saveCoreLog, today } from '../../../state/store.js';
import { meldeTimer } from '../../../state/timerState.js';
import { createTimer } from '../../../domain/timer/engine.js';
import { buildLegRestSequence } from '../../../domain/timer/sequences.js';
import { legDose, legRounds, legRepText, legRepMin, legDoneRounds, legAborts } from '../../../domain/core.js';
import { isoDayLocal } from '../../../domain/week.js';
import { Baustein, Buehne } from './Baustein.jsx';
import { speak, primeSpeech, beep, vibrate, ensureWakeLock, cancelSpeech } from '../../../platform/index.js';

export function Beinblock({ eintrag, onOpen }){
  const p = plan.value, w = week.value;
  const s = settings.value;
  const dose = legDose(p, w);
  const rounds = legRounds(p, w);
  const uebungen = p.legs.exercises;
  const tag = isoDayLocal(today.value);
  const zellen = rounds * uebungen.length;

  /* -1 heisst: kein Ablauf, nur Raster und Protokoll. */
  const [zelle, setZelle] = useState(-1);
  const [pauseLaeuft, setPauseLaeuft] = useState(false);
  const [wert, setWert] = useState(0);
  const [, tickState] = useState(0);
  const timerRef = useRef(null);
  if(!timerRef.current) timerRef.current = createTimer();
  const timer = timerRef.current;

  const laufend = zelle >= 0 && zelle < zellen;
  const runde = laufend ? Math.floor(zelle / uebungen.length) + 1 : 0;
  const exIndex = laufend ? zelle % uebungen.length : 0;
  const aktuelle = uebungen[exIndex];
  const letzte = zelle === zellen - 1;
  /* Nach der letzten Uebung einer Runde die laengere Rundenpause. */
  const rundenwechsel = laufend && exIndex === uebungen.length - 1;
  const pauseSek = rundenwechsel ? p.legs.restBetweenRoundsSeconds : p.legs.restBetweenExercisesSeconds;

  function setzen(i, r, v){
    const liste = coreLog.value.slice();
    let e = liste.find(x => x && x.kind === 'leg' && x.day === tag);
    if(!e){
      e = { kind:'leg', id:'leg-' + tag, day: tag, week: w, plannedRounds: rounds,
            exercises: uebungen.map(ex => ({ key: ex.key, name: ex.name,
              target: legRepMin(ex, dose), reps: [] })) };
      liste.push(e);
    }
    e.plannedRounds = rounds;
    const ex = e.exercises[i];
    while(ex.reps.length < r) ex.reps.push(null);
    ex.reps[r - 1] = v > 0 ? v : null;
    saveCoreLog(liste);
  }

  /* Die Ansage braucht die naechste Uebung, die Abonnenten haengen aber nur an
     der Stimme. Ueber ein Ref bleiben sie aktuell, ohne bei jeder Zelle neu
     angemeldet zu werden. */
  const naechsteRef = useRef(null);
  naechsteRef.current = laufend && !letzte ? uebungen[(zelle + 1) % uebungen.length] : null;

  useEffect(() => {
    const ab = [];
    ab.push(timer.on('step', ({ step }) => {
      tickState(x => x + 1);
      if(step.type === 'rest'){
        beep(440, 180);
        const n = naechsteRef.current;
        speak('Pause.' + (n ? ' Nächste Übung: ' + n.name + '.' : ''), s.voice);
      } else if(step.type === 'done'){
        beep(880, 220);
        vibrate(40);
        setPauseLaeuft(false);
        meldeTimer('beinblock', false);
        setZelle(z => z + 1);
      }
    }));
    ab.push(timer.on('tick', ({ secondsLeft, sekundenwechsel }) => {
      tickState(x => x + 1);
      if(!sekundenwechsel) return;
      if(secondsLeft <= 3 && secondsLeft > 0) beep(500, 120);
      meldeTimer('beinblock', true, { label:'Beinblock', segment:'leg', sek: secondsLeft });
    }));
    return () => { ab.forEach(f => f()); };
  }, [s.voice]);

  /* Jede Zelle beginnt mit dem Wiederholungsziel im Feld - schon
     Protokolliertes sticht es, damit ein zweiter Durchgang durch dieselbe
     Zelle nicht die eigene Zahl ueberschreibt. */
  useEffect(() => {
    if(!laufend) return;
    const vorhanden = eintrag && eintrag.exercises[exIndex]
      ? eintrag.exercises[exIndex].reps[runde - 1] : null;
    setWert(vorhanden > 0 ? vorhanden : legRepMin(aktuelle, dose));
  }, [zelle]);

  useEffect(() => () => { timer.reset(); meldeTimer('beinblock', false); }, []);

  function beenden(){
    cancelSpeech();
    timer.reset([]);
    setPauseLaeuft(false);
    meldeTimer('beinblock', false);
    setZelle(-1);
  }

  function starten(){
    primeSpeech();
    ensureWakeLock();
    setZelle(0);
  }

  /* Satz quittiert: Zahl ins Protokoll, dann laeuft die Pause. Nach dem
     letzten Satz gibt es nichts mehr zu pausieren. */
  function erledigt(){
    setzen(exIndex, runde, wert);
    if(letzte){
      beep(880, 300); beep(1046, 300, 200);
      vibrate([60, 40, 60]);
      speak('Beinblock geschafft. Gut gemacht!', s.voice);
      beenden();
      return;
    }
    primeSpeech();
    ensureWakeLock();
    timer.load(buildLegRestSequence(pauseSek, rundenwechsel ? 'Rundenpause' : 'Pause'));
    timer.start();
    setPauseLaeuft(true);
    meldeTimer('beinblock', true, { label:'Beinblock', segment:'leg', sek: pauseSek });
    tickState(x => x + 1);
  }

  function pauseTaste(){
    timer.toggle();
    meldeTimer('beinblock', timer.running, { label:'Beinblock', segment:'leg', sek: timer.secondsLeft() });
    tickState(x => x + 1);
  }

  /* Blaettern haelt immer auch Uhr und Ansage an - sonst laeuft die Pause der
     Zelle weiter, die man gerade verlassen hat. */
  function blaettern(ziel){
    cancelSpeech();
    timer.reset([]);
    setPauseLaeuft(false);
    meldeTimer('beinblock', false);
    setZelle(ziel < 0 || ziel >= zellen ? -1 : ziel);
  }

  const voll = legDoneRounds(eintrag);
  const ab = legAborts(eintrag);
  const laeuft = timer.running;
  const sec = timer.secondsLeft();
  const naechste = naechsteRef.current;

  const buehne = !laufend ? (
    <Buehne
      dosis={{ phase:'Bereit', wert: rounds + ' Runden',
               exercise: uebungen.map(e => e.name).join(' · '),
               meta: 'Pause ' + p.legs.restBetweenExercisesSeconds + ' s · Rundenpause '
                     + p.legs.restBetweenRoundsSeconds + ' s' }}
      haupt={{ label:'Ablauf starten', onClick: starten }}
      zurueck={{ disabled: true }} weiter={{ disabled: true }} />
  ) : pauseLaeuft ? (
    <Buehne
      ring={{ fraction: timer.fraction(), color:'var(--rest)',
              phase: rundenwechsel ? 'Rundenpause' : 'Pause',
              time: String(sec),
              exercise: naechste ? naechste.name : 'Fertig',
              meta: 'Runde ' + (rundenwechsel ? runde + 1 : runde) + ' / ' + rounds }}
      bild={naechste ? { src: naechste.img, name: naechste.name, vorschau: true,
              cap: <b>{naechste.name}</b>,
              onClick: () => onOpen((zelle + 1) % uebungen.length) } : null}
      zurueck={{ onClick: () => blaettern(zelle - 1), disabled: zelle === 0 }}
      haupt={{ label: laeuft ? 'Pause' : 'Fortsetzen', onClick: pauseTaste }}
      weiter={{ onClick: () => blaettern(zelle + 1) }}
      ende={{ label:'Ablauf beenden', onClick: beenden }} />
  ) : (
    <Buehne
      dosis={{ phase:'Runde ' + runde + ' / ' + rounds,
               wert: legRepText(aktuelle, dose), exercise: aktuelle.name,
               meta: p.texts.legTempoPlain,
               kinder: <Wdhfeld wert={wert} setWert={setWert} /> }}
      bild={{ src: aktuelle.img, name: aktuelle.name,
              cap: <b>{aktuelle.name}</b>, onClick: () => onOpen(exIndex) }}
      zurueck={{ onClick: () => blaettern(zelle - 1), disabled: zelle === 0 }}
      haupt={{ label:'Erledigt', onClick: erledigt }}
      weiter={{ label: letzte ? 'Fertig' : 'Weiter', onClick: () => blaettern(zelle + 1) }}
      ende={{ label:'Ablauf beenden', onClick: beenden }} />
  );

  return (
    <Baustein
      titel="Beinblock"
      meta={rounds + ' Runden · ' + p.legs.durationHint}
      status={
        <p class={'tagchip' + (rounds > 0 && voll >= rounds ? ' an' : '')}>
          {voll} / {rounds} volle Runden protokolliert
          {ab ? ' · ' + ab + (ab === 1 ? ' Satz' : ' Sätze') + ' unter dem Ziel' : ''}
        </p>
      }
      buehne={buehne}
      hinweise={[
        'Pause ' + p.legs.restBetweenExercisesSeconds + ' s zwischen den Übungen, '
          + p.legs.restBetweenRoundsSeconds + ' s zwischen den Runden. ' + p.texts.legTempoPlain,
        dose.extra,
        p.texts.legAbortSigns,
        p.texts.legProgression
      ]}>

      {/* Das Raster ist Uebungsliste und Protokoll in einem: dieselbe Zeile
          traegt Name, Dosierung und die Zahlen des Tages. Eine zweite Liste
          darueber haette dieselben vier Namen ein zweites Mal genannt. */}
      <div class="card">
        <div class="row"><span>Protokoll</span><b>heute</b></div>
        <div class="leggrid" style={'--runden:' + rounds}>
          <div class="leghead"><span>Übung</span><span>Ziel</span>
            {Array.from({ length: rounds }, (_, i) => <span key={i}>R{i + 1}</span>)}</div>
          {uebungen.map((ex, i) => (
            <div class="legrow" key={ex.key}>
              <button class="legname" onClick={() => onOpen(i)}>{ex.name} ›</button>
              <span class="legziel">{legRepText(ex, dose)}</span>
              {Array.from({ length: rounds }, (_, r) => {
                const v = eintrag && eintrag.exercises[i] ? eintrag.exercises[i].reps[r] : null;
                const hier = laufend && i === exIndex && r === runde - 1;
                return <input key={r} type="number" inputmode="numeric" min="0" max="60"
                  class={hier ? 'aktiv' : ''}
                  placeholder={String(legRepMin(ex, dose))} value={v > 0 ? v : ''}
                  onChange={e => setzen(i, r + 1, parseInt(e.currentTarget.value, 10) || 0)} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </Baustein>
  );
}

/* Die Wiederholungszahl wird auf dem Boden liegend quittiert, oft mit nassen
   Haenden. Deshalb zwei grosse Tasten neben dem Feld - die Systemtastatur zu
   oeffnen, um von 10 auf 9 zu gehen, ist der laengere Weg. */
function Wdhfeld({ wert, setWert }){
  const setz = v => setWert(Math.max(0, Math.min(60, v)));
  return (
    <div class="wdhfeld">
      <button class="btn secondary" onClick={() => setz(wert - 1)} aria-label="Eine weniger">−</button>
      <input type="number" inputmode="numeric" min="0" max="60" value={wert}
        onInput={e => setz(parseInt(e.currentTarget.value, 10) || 0)} />
      <button class="btn secondary" onClick={() => setz(wert + 1)} aria-label="Eine mehr">+</button>
      <small>Wdh.</small>
    </div>
  );
}
