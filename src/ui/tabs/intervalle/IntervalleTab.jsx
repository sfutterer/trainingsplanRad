import { useEffect, useRef, useState } from 'preact/hooks';
import { plan, thresholds, week, settings } from '../../../state/store.js';
import { timerLaeuft } from '../../../state/timerState.js';
import { createTimer } from '../../../domain/timer/engine.js';
import { buildIntervalSequence, buildTestSequence, intervalDefaults,
         totalSeconds, remainingAfter } from '../../../domain/timer/sequences.js';
import { hrBands, bandRange, usesCoggan, zoneText, wattText, cadenceText } from '../../../domain/zones.js';
import { isRecoveryWeek } from '../../../domain/week.js';
import { ProgressRing } from '../../components/ProgressRing.jsx';
import { speak, primeSpeech, beep, vibrate, ensureWakeLock, cancelSpeech } from '../../../platform/index.js';
import '../../components/timer.css';

function klok(sec){
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}
function dauer(sec){
  const m = Math.round(sec / 60);
  return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min';
}

export function IntervalleTab(){
  const p = plan.value, th = thresholds.value, w = week.value;
  const s = settings.value;
  const vorgabe = intervalDefaults(p, w);

  const [cfg, setCfg] = useState(() => vorgabe.mode === 'intervals'
    ? { warmMin: vorgabe.warmMin, workMin: vorgabe.workMin, restMin: vorgabe.restMin,
        coolMin: vorgabe.coolMin, reps: vorgabe.reps, zoneKey: vorgabe.zoneKey }
    : null);
  const [, tickState] = useState(0);
  const timerRef = useRef(null);
  const flags = useRef({ half:false, minute:false, zehn:false });

  if(!timerRef.current) timerRef.current = createTimer();
  const timer = timerRef.current;

  const testmodus = vorgabe.mode === 'test';
  const nurZ2 = vorgabe.mode === 'z2';

  function sequenz(){
    return testmodus ? buildTestSequence(p, th, w) : buildIntervalSequence(p, th, w, cfg);
  }

  useEffect(() => {
    const ab = [];
    ab.push(timer.on('step', ({ step }) => {
      flags.current = { half:false, minute:false, zehn:false };
      tickState(x => x + 1);
      if(step.type === 'work'){ beep(880, 180); vibrate(40); speak(step.label + '. Los!', s.voice); }
      else if(step.type === 'rest'){ beep(440, 180); speak('Erholung. Locker rollen.', s.voice); }
      else if(step.type === 'warm'){ speak('Einfahren. Locker und gleichmäßig.', s.voice); }
      else if(step.type === 'cool'){ beep(440, 180); speak('Jetzt locker ausrollen.', s.voice); }
      else if(step.type === 'done'){
        beep(880, 300); beep(1046, 300, 200); vibrate([60, 40, 60]);
        speak('Einheit abgeschlossen. Stark gemacht!', s.voice);
        timerLaeuft.value = false;
      }
    }));
    ab.push(timer.on('tick', ({ step, secondsLeft, sekundenwechsel }) => {
      tickState(x => x + 1);
      if(sekundenwechsel && secondsLeft <= 3 && secondsLeft > 0) beep(500, 120);
      const f = flags.current;
      /* Auf Unterschreiten pruefen, nicht auf Gleichheit: mit einer aus der Uhr
         gerechneten Restzeit kann der Wert springen und eine Ansage sonst
         ersatzlos verschlucken. Die Flags halten sie einmalig. */
      if(step.type === 'work'){
        const half = Math.floor(step.duration / 2);
        if(!f.half && step.duration >= 120 && secondsLeft <= half){
          f.half = true; speak('Halbzeit. Tempo halten!', s.voice); beep(660, 150);
        }
        if(!f.minute && step.duration > 90 && secondsLeft <= 60){
          f.minute = true; speak('Noch eine Minute.', s.voice);
        }
      }
      if(step.type === 'rest' && !f.minute && step.duration > 90 && secondsLeft <= 30){
        f.minute = true; speak('Noch 30 Sekunden Erholung. Bereit machen.', s.voice);
      }
      if(!f.zehn && (step.type === 'rest' || step.type === 'prep' || step.type === 'warm') && secondsLeft <= 10){
        f.zehn = true;
        const naechster = timer.sequence[timer.index + 1];
        if(naechster && naechster.type === 'work') speak('Gleich ' + naechster.label + '.', s.voice);
      }
      if((step.type === 'warm' || step.type === 'cool') && !f.minute && step.duration > 120 && secondsLeft <= 60){
        f.minute = true; speak('Noch eine Minute.', s.voice);
      }
    }));
    return () => { ab.forEach(f => f()); timer.reset(); timerLaeuft.value = false; };
  }, [s.voice]);

  function starten(){
    primeSpeech(); ensureWakeLock();
    if(!timer.running && (timer.index === -1 || (timer.step && timer.step.type === 'done'))){
      timer.load(sequenz());
    }
    timer.toggle();
    timerLaeuft.value = timer.running;
    tickState(x => x + 1);
  }
  function zuruecksetzen(){ cancelSpeech(); timer.reset(); timerLaeuft.value = false; tickState(x => x + 1); }
  function weiter(){ timer.skip(); timerLaeuft.value = timer.running; tickState(x => x + 1); }

  const vorschau = timer.sequence.length ? timer.sequence : sequenz();
  const step = timer.step;
  const sec = timer.secondsLeft();

  const phase = !step ? 'Bereit'
    : step.type === 'work' ? (testmodus ? 'Test' : cfg && cfg.zoneKey === 'z5' ? 'VO2max'
        : cfg && cfg.zoneKey === 'z4' ? 'Schwelle' : 'Tempo')
    : step.type === 'warm' ? 'Einfahren'
    : step.type === 'rest' ? 'Erholung'
    : step.type === 'cool' ? 'Ausrollen'
    : step.type === 'done' ? 'Fertig' : 'Bereit';

  const farbe = !step ? 'var(--prep)'
    : step.type === 'work' ? (step.zone && step.zone.key === 'z5' ? 'var(--hard)' : 'var(--rest)')
    : step.type === 'warm' ? 'var(--work)' : 'var(--prep)';

  const kadenz = cfg ? cadenceText(p, cfg.zoneKey, w) : null;

  return (
    <>
      <h1 class="title">Intervalle</h1>

      <div class="card">
        {testmodus ? (
          <>
            <div class="row"><span>Woche {w}</span><b>Schwellentest</b></div>
            <p class="hint" style="margin-top:6px">{p.texts.thresholdTestSummary}</p>
          </>
        ) : nurZ2 ? (
          <>
            <div class="row"><span>Woche {w}</span><b>Grundlagentag statt Intervallen</b></div>
            <p class="hint" style="margin-top:6px">
              {vorgabe.plan.minutes} min {zoneText(p, th, 'z2', w)} am Stück. {p.texts.thursdayNoTimer}
            </p>
          </>
        ) : (
          <>
            <div class="row"><span>Woche {w}</span><b>{vorgabe.plan.title.replace('Rad – ', '')}</b></div>
            <div class="row"><span>Vorgabe</span><b>
              {cfg.reps}× {cfg.workMin} min {zoneText(p, th, cfg.zoneKey, w)}
              {wattText(p, th, cfg.zoneKey) ? ' · ' + wattText(p, th, cfg.zoneKey) : ''}
            </b></div>
            {vorgabe.plan.power && <div class="row"><span>Leistung</span><b>{vorgabe.plan.power}</b></div>}
            {kadenz && <div class="row"><span>Trittfrequenz</span><b>{kadenz}</b></div>}
            <p class="hint" style="margin-top:6px">
              {p.texts.intervalRollingStart}
              {isRecoveryWeek(p, w) ? ' ' + p.texts.intervalRecoveryWeek : ''}
            </p>
          </>
        )}
        <div class="row" style="margin-top:10px"><span>Gesamtdauer</span><b>{dauer(totalSeconds(vorschau))}</b></div>
      </div>

      <ProgressRing
        fraction={timer.fraction()}
        color={farbe}
        phase={phase}
        time={step ? (step.type === 'done' ? '0:00' : klok(sec)) : klok(vorschau[1] ? vorschau[1].duration : 0)}
        exercise={step ? step.label : 'Tippen zum Starten'}
        meta={step && step.type !== 'done' ? 'noch ' + dauer(remainingAfter(timer.sequence, timer.index) + sec) : ''}
        zone={step ? step.zone : (vorschau[1] && vorschau[1].zone)}
        onTap={starten}
      />

      <div class="controls">
        <button class="btn secondary" onClick={zuruecksetzen}>Reset</button>
        <button class="btn gross" onClick={starten}>{timer.running ? 'Pause' : (step && step.type !== 'done' ? 'Weiter' : 'Start')}</button>
        <button class="btn secondary" onClick={weiter}>Weiter</button>
      </div>

      <div class="card">
        <div class="seglist">
          {vorschau.map((s2, i) => {
            if(s2.type === 'done' || s2.type === 'prep') return null;
            const farbe2 = s2.type === 'work' ? (s2.zone && s2.zone.key === 'z5' ? 'var(--hard)' : 'var(--rest)')
                         : s2.type === 'warm' ? 'var(--work)' : 'var(--prep)';
            return (
              <div class={'seg' + (i === timer.index ? ' aktiv' : (timer.index > i ? ' fertig' : ''))} key={i}>
                <span><i class="dot" style={'background:' + farbe2}></i>{s2.label}</span>
                <span class="dur">{klok(s2.duration)} · {(s2.zone && s2.zone.label ? s2.zone.label.split(' · ')[0] : '')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!testmodus && !nurZ2 && (
        <div class="card">
          <div class="row"><span>Einstellungen</span><b>anpassbar</b></div>
          <div class="field"><span>Einfahren (Min.)</span>
            <input type="number" inputmode="numeric" value={cfg.warmMin}
              onInput={e => setCfg({ ...cfg, warmMin: parseFloat(e.currentTarget.value) || 0 })} /></div>
          <div class="field"><span>Intervall (Min.)</span>
            <input type="number" inputmode="decimal" step="0.5" value={cfg.workMin}
              onInput={e => setCfg({ ...cfg, workMin: parseFloat(e.currentTarget.value) || cfg.workMin })} /></div>
          <div class="field"><span>Erholung (Min.)</span>
            <input type="number" inputmode="decimal" step="0.5" value={cfg.restMin}
              onInput={e => setCfg({ ...cfg, restMin: parseFloat(e.currentTarget.value) || cfg.restMin })} /></div>
          <div class="field"><span>Wiederholungen</span>
            <input type="number" inputmode="numeric" value={cfg.reps}
              onInput={e => setCfg({ ...cfg, reps: parseInt(e.currentTarget.value, 10) || cfg.reps })} /></div>
          <div class="field"><span>Ausrollen (Min.)</span>
            <input type="number" inputmode="numeric" value={cfg.coolMin}
              onInput={e => setCfg({ ...cfg, coolMin: parseFloat(e.currentTarget.value) || 0 })} /></div>
        </div>
      )}
      {testmodus && <p class="hint">Der Testablauf steht fest und lässt sich nicht verstellen – ein Test, der sich anpassen lässt, ist kein Vergleichsmaßstab mehr.</p>}

      <div class="card">
        <div class="row"><span>Pulszonen Woche {w}</span>
          <b>{usesCoggan(p, th, w) ? 'Coggan aus LTHR' : 'Übergangsbänder'}</b></div>
        {hrBands(p, th, w).filter(b => b.key !== 'unter').map(b => (
          <div class="row" key={b.key}><span><i class="dot" style={'background:' + b.color}></i>{b.label}</span>
            <b>{bandRange(b)}</b></div>
        ))}
      </div>
    </>
  );
}
