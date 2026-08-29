/* Sammelbereich fuer alles, was ohne Rad stattfindet: Rumpf, Beine,
   Beweglichkeit, Koordination.

   Vier Segmente flach nebeneinander statt zweier gestaffelter Leisten. Eine
   zweite Ebene ("Kraft" mit Unterauswahl, "Mobilitaet" mit Unterauswahl) waere
   ein Tipp mehr fuer jeden Wechsel und wuerde verbergen, dass es vier
   gleichrangige Bausteine sind. Die vier Etiketten passen in eine Zeile,
   sobald die Schrift mitskaliert - die Regeln dafuer stehen in training.css.

   Der Rumpf-Timer lebt weiterhin in dieser Datei und nicht in den Segmenten:
   er laeuft weiter, waehrend im Beinblock gezaehlt oder die Beweglichkeit
   durchgegangen wird. Ein Timer je Segment wuerde beim Umschalten
   zurueckgesetzt.

   Beweglichkeit und Koordination schreiben bewusst nichts ins Protokoll -
   coreLog bleibt den beiden Kraftteilen vorbehalten, so wie es der Plan
   vorgibt. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { plan, week, settings, coreLog, saveCoreLog, today, startDate } from '../../../state/store.js';
import { timerLaeuft } from '../../../state/timerState.js';
import { createTimer } from '../../../domain/timer/engine.js';
import { buildCircuitSequence } from '../../../domain/timer/sequences.js';
import { coreRoundsForDay, coreWorkSeconds, coreRestSeconds, coreMinutes,
         repShort, legDose, legRounds, legRepText, legRepMin,
         legDoneRounds, legAborts } from '../../../domain/core.js';
import { isoDayLocal, weekNumberFor } from '../../../domain/week.js';
import { ProgressRing } from '../../components/ProgressRing.jsx';
import { ExerciseDialog } from '../../components/ExerciseDialog.jsx';
import { Uebungsbild } from './Uebungsbild.jsx';
import { Beweglichkeit } from './Beweglichkeit.jsx';
import { Koordination } from './Koordination.jsx';
import { speak, primeSpeech, beep, vibrate, ensureWakeLock, cancelSpeech } from '../../../platform/index.js';
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

  const [cfg, setCfg] = useState(() => ({
    workSec: coreWorkSeconds(p, w),
    restSec: coreRestSeconds(p, w),
    roundRestSec: p.circuit.roundRestSeconds,
    rounds: coreRoundsForDay(p, w, dow)
  }));
  const [, tickState] = useState(0);
  const [dialogEx, setDialogEx] = useState(null);
  const [segment, setSegment] = useState('core');
  const timerRef = useRef(null);
  const logRef = useRef(null);

  if(!timerRef.current) timerRef.current = createTimer();
  const timer = timerRef.current;

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
      tickState(x => x + 1);
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
        timerLaeuft.value = false;
        vibrate([60, 40, 60]);
        /* Der Zirkel ist das Aufwaermen des Beinblocks - wer ihn beendet, will
           dorthin. An jedem Tag gleich: welcher Tag wofuer vorgesehen ist,
           weiss der Nutzer selbst. */
        setSegment('leg');
      }
    }));
    ab.push(timer.on('tick', ({ secondsLeft, sekundenwechsel }) => {
      tickState(x => x + 1);
      if(sekundenwechsel && secondsLeft <= 3 && secondsLeft > 0) beep(500, 120);
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
    return () => { ab.forEach(f => f()); timer.reset(); timerLaeuft.value = false; };
  }, [s.voice]);

  function starten(){
    primeSpeech();
    ensureWakeLock();
    if(!timer.running && (timer.index === -1 || (timer.step && timer.step.type === 'done'))){
      timer.load(buildCircuitSequence(p, cfg));
      logStart();
    }
    timer.toggle();
    timerLaeuft.value = timer.running;
    tickState(x => x + 1);
  }
  function zuruecksetzen(){
    cancelSpeech();
    const l = logRef.current;
    if(l){
      if(l.sets === 0) saveCoreLog(coreLog.value.filter(e => e.id !== l.id));
      else { l.finished = false; persist(); }
      logRef.current = null;
    }
    timer.reset(buildCircuitSequence(p, cfg));
    timer.reset();
    timerLaeuft.value = false;
    tickState(x => x + 1);
  }
  function weiter(){ timer.skip(); timerLaeuft.value = timer.running; tickState(x => x + 1); }

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

  return (
    <>
      {/* Vier Segmente an jedem Tag, in derselben Form. Nur die Namen der
          Bausteine: Rundenzahl und Fortschritt stehen in den Karten darunter
          und im Ring, im Umschalter waeren sie ein zweites Mal dasselbe. Wann
          welcher Baustein ansteht, sagt der Plan - die App versperrt keinen
          Tag. */}
      <div class="segmented vier" role="tablist" aria-label="Trainingsbausteine">
        {SEGMENTE.map(seg => (
          <button key={seg.id} class={'segbtn' + (segment === seg.id ? ' an' : '')}
            role="tab" aria-selected={segment === seg.id ? 'true' : 'false'}
            onClick={() => setSegment(seg.id)}>{seg.label}</button>
        ))}
      </div>

      {/* Der Zirkel laeuft weiter, waehrend in den anderen Segmenten gelesen
          oder gezaehlt wird. Ohne diesen Streifen liefe er unsichtbar - man
          hoert ihn nur noch. */}
      {segment !== 'core' && step && step.type !== 'done' && (
        <button class="laufstreifen" onClick={() => setSegment('core')}>
          <span>Zirkel {laeuft ? 'läuft' : 'pausiert'} ›</span><b>{sec} s</b>
        </button>
      )}

      {segment === 'core' && <>
      {/* Ring, Bild und Bedienung sind eine Einheit: was zur laufenden Uebung
          gehoert, muss ohne Scrollen sichtbar sein. Die Hoehe des Blocks ist
          in timer.css auf den Platz zwischen den Leisten begrenzt. */}
      <div class="uebungsblock">
        <ProgressRing
          fraction={timer.fraction()}
          color={FARBE[step ? step.type : 'prep'] || 'var(--prep)'}
          phase={phase}
          time={step ? (step.type === 'done' ? '0' : String(sec)) : String(cfg.workSec)}
          exercise={step ? step.label : 'Tippen zum Starten'}
          meta={step && step.round ? 'Runde ' + step.round + ' / ' + cfg.rounds : ''}
          onTap={starten}
        />

        {bild && (
          <div class={'illu' + (vorschau ? ' vorschau' : '')}>
            <Uebungsbild src={bild.img} name={bild.name} onClick={() => setDialogEx({ kind:'core', i: bildIndex })} />
            <div class="cap">
              {vorschau ? <span class="tag">Als Nächstes</span> : null}
              <b>{bild.name}</b>{bild.steps && bild.steps[0] ? ' · ' + bild.steps[0] : ''}
            </div>
          </div>
        )}

        <div class="controls">
          <button class="btn secondary" onClick={zuruecksetzen}>Reset</button>
          <button class="btn gross" onClick={starten}>{laeuft ? 'Pause' : (step && step.type !== 'done' ? 'Weiter' : 'Start')}</button>
          <button class="btn secondary" onClick={weiter}>Weiter</button>
        </div>
      </div>

      <div class="card">
        <div class="row"><span>Zirkel</span><b>{cfg.rounds} Runden · ca. {coreMinutes(p, w, cfg.rounds)} min</b></div>
        <div class="exlist" style="margin-top:8px">
          {p.circuit.exercises.map((ex, i) => (
            <button class={'exrow' + (aktiveUebung === i ? ' aktiv' : '')} key={i}
              onClick={() => setDialogEx({ kind:'core', i })}>
              <span>{i + 1}. {ex.name}</span>
              <span class="ziel">{repShort(ex, cfg.workSec)} ›</span>
            </button>
          ))}
        </div>
        <p class="hint">{p.texts.coreAbortRule}</p>
      </div>

      <div class="card">
        <div class="row"><span>Einstellungen</span><b>Woche {w}, {dow === 3 ? 'Mittwoch (verkürzt)' : dow === 0 ? 'Sonntag (voll)' : 'heute'}</b></div>
        <div class="field"><span>Belastung (Sek.)</span>
          <input type="number" inputmode="numeric" value={cfg.workSec}
            onInput={e => setCfg({ ...cfg, workSec: parseInt(e.currentTarget.value, 10) || cfg.workSec })} /></div>
        <div class="field"><span>Pause (Sek.)</span>
          <input type="number" inputmode="numeric" value={cfg.restSec}
            onInput={e => setCfg({ ...cfg, restSec: parseInt(e.currentTarget.value, 10) || cfg.restSec })} /></div>
        <div class="field"><span>Rundenpause (Sek.)</span>
          <input type="number" inputmode="numeric" value={cfg.roundRestSec}
            onInput={e => setCfg({ ...cfg, roundRestSec: parseInt(e.currentTarget.value, 10) || cfg.roundRestSec })} /></div>
        <div class="field"><span>Runden</span>
          <input type="number" inputmode="numeric" value={cfg.rounds}
            onInput={e => setCfg({ ...cfg, rounds: parseInt(e.currentTarget.value, 10) || cfg.rounds })} /></div>
      </div>
      </>}

      {segment === 'leg' &&
        <Beinblock eintrag={legEintrag} onOpen={i => setDialogEx({ kind:'leg', i })} />}

      {segment === 'mobility' &&
        <Beweglichkeit onOpen={i => setDialogEx({ kind:'mobility', i })} />}

      {segment === 'coordination' &&
        <Koordination onOpen={i => setDialogEx({ kind:'coordination', i })} />}

      {dialogEx && <ExerciseDialog spec={dialogEx} workSec={cfg.workSec} onClose={() => setDialogEx(null)} />}
    </>
  );
}

/* ---- Beinblock: Wiederholungen zaehlen, kein Timer ---- */
function Beinblock({ eintrag, onOpen }){
  const p = plan.value, w = week.value;
  const dose = legDose(p, w);
  const rounds = legRounds(p, w);
  const tag = isoDayLocal(today.value);

  function setzen(exIndex, runde, wert){
    const liste = coreLog.value.slice();
    let e = liste.find(x => x && x.kind === 'leg' && x.day === tag);
    if(!e){
      e = { kind:'leg', id:'leg-' + tag, day: tag, week: w, plannedRounds: rounds,
            exercises: p.legs.exercises.map(ex => ({ key: ex.key, name: ex.name,
              target: legRepMin(ex, dose), reps: [] })) };
      liste.push(e);
    }
    e.plannedRounds = rounds;
    const ex = e.exercises[exIndex];
    while(ex.reps.length < runde) ex.reps.push(null);
    ex.reps[runde - 1] = wert > 0 ? wert : null;
    saveCoreLog(liste);
  }

  const voll = legDoneRounds(eintrag);
  const ab = legAborts(eintrag);

  return (
    <div class="card">
      <div class="row"><span>Beinblock</span><b>{rounds} Runden</b></div>
      <p class="hint" style="margin-top:2px">
        Pause {p.legs.restBetweenExercisesSeconds} s zwischen den Übungen,{' '}
        {p.legs.restBetweenRoundsSeconds} s zwischen den Runden. {p.texts.legTempoPlain}
      </p>

      <div class="leggrid" style={'--runden:' + rounds}>
        <div class="leghead"><span>Übung</span><span>Ziel</span>
          {Array.from({ length: rounds }, (_, i) => <span key={i}>R{i + 1}</span>)}</div>
        {p.legs.exercises.map((ex, i) => (
          <div class="legrow" key={ex.key}>
            <button class="legname" onClick={() => onOpen(i)}>{ex.name} ›</button>
            <span class="legziel">{legRepText(ex, dose)}</span>
            {Array.from({ length: rounds }, (_, r) => {
              const v = eintrag && eintrag.exercises[i] ? eintrag.exercises[i].reps[r] : null;
              return <input key={r} type="number" inputmode="numeric" min="0" max="60"
                placeholder={String(legRepMin(ex, dose))} value={v > 0 ? v : ''}
                onChange={e => setzen(i, r + 1, parseInt(e.currentTarget.value, 10) || 0)} />;
            })}
          </div>
        ))}
      </div>

      <div class="legsum">
        <b>{voll} / {rounds}</b> volle Runden protokolliert
        {ab ? ' · ' + ab + (ab === 1 ? ' Satz' : ' Sätze') + ' unter dem Wiederholungsziel' : ''}
        {dose.extra ? <><br />{dose.extra}</> : null}
      </div>

      <p class="hint">{p.texts.legAbortSigns}</p>
      <p class="hint">{p.texts.legProgression}</p>
    </div>
  );
}
