/* Der Intervall-Timer: der einzige Timer, der auf dem Rad bedient wird.

   Drei Betriebsarten, die der Plan vorgibt und die man hier nicht waehlt:
   Intervalle mit einstellbaren Zeiten, der Schwellentest mit festem Ablauf,
   und in Phase 3 gar keiner - dort ist der Donnerstag ein Grundlagentag, und
   ein Timer haette nichts zu zaehlen. Der Testablauf laesst sich bewusst nicht
   verstellen: ein Test, der sich anpassen laesst, ist kein Vergleichsmassstab
   mehr.

   Die Uhr samt Ansagen liegt seit dem 03.09.2026 in useSchrittTimer.js: der
   Testbereich spielt dieselben Schrittfolgen ab, und zwei Fassungen derselben
   Ansagen waeren zwei Gelegenheiten, sie auseinanderlaufen zu lassen. Hier
   bleibt, was diesen Bereich ausmacht - die drei Betriebsarten, die
   Einstellkarte und die Ablaufvorschau.

   Die Tastenreihe kommt aus Buehne.jsx und nicht mehr aus dieser Datei. Sie
   war bis zum 29.08.2026 die einzige Stelle, an der die Regel "links Zurueck,
   Mitte Haupthandlung, rechts Weiter" gebrochen war: links stand "Reset".
   Ausgerechnet hier, wo man die Tasten mit Handschuhen und ohne Hinsehen
   trifft - und das Zuruecksetzen mitten in einem Intervall ist das Letzte, was
   man dabei will. Es steht jetzt als Beenden unter dem Block, wie in den
   anderen vier Timern.

   Der Bereichstitel steht in der AppBar. Diese Datei hatte ihn zusaetzlich als
   <h1> und war damit die einzige mit zwei Ueberschriften im Dokument; sichtbar
   war das nicht, weil eine CSS-Regel den zweiten versteckte.

   Der Aufbau kommt aus Baustein.jsx, wie in den vier Trainingsbausteinen:
   Kopf, Buehne, Status, Inhalt, Hinweise, Schluss. Vorher stand hier eine
   Karte mit bis zu fuenf Zeilen und einem Hinweisabsatz ueber dem Ring -
   ueber 200 px, die auf einem 375er Geraet dem Ring und der Tastenreihe
   fehlten. Der Kopf traegt jetzt Name und Gesamtdauer, alles Weitere steht
   unter der Buehne: waehrend der Einheit schaut man auf die Uhr, die Vorgabe
   liest man einmal vorher.

   In Phase 3 gibt es keine Buehne. Der Donnerstag ist dort ein
   Grundlagentag - eine Uhr haette nichts zu zaehlen, und die Folge, die sie
   zaehlen sollte, gab es auch nie: der Aufbau der Vorschau lief in diesen
   Wochen in einen Fehler, weil ohne Intervalle auch keine Einstellungen
   dastehen, aus denen sich eine Folge bauen liesse. */

import { useEffect, useState } from 'preact/hooks';
import { plan, thresholds, week, settings, startDate, today } from '../../../state/store.js';
import { buildIntervalSequence, buildTestSequence, buildStepSequence, intervalDefaults,
         totalSeconds, remainingAfter } from '../../../domain/timer/sequences.js';
import { hrBands, usesCoggan, zoneText, wattText, cadenceText } from '../../../domain/zones.js';
import { isRecoveryWeek } from '../../../domain/week.js';
import { Buehne } from '../../components/Buehne.jsx';
/* Dasselbe Geruest wie in den vier Trainingsbausteinen - aus demselben Grund,
   aus dem die Buehne dort ausgezogen ist: eine Form, die nur einer der fuenf
   Timer kennt, halten die anderen vier nicht ein. */
import { Baustein } from '../training/Baustein.jsx';
import { Zonenliste } from '../../components/Zonenliste.jsx';
import { Zahlenfeld } from '../../components/Feld.jsx';
import { useSchrittTimer } from '../../components/useSchrittTimer.js';
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
  const vorgabe = intervalDefaults(p, w, startDate.value, today.value);

  const ausVorgabe = () => (vorgabe.mode === 'intervals'
    ? { warmMin: vorgabe.warmMin, workMin: vorgabe.workMin, restMin: vorgabe.restMin,
        coolMin: vorgabe.coolMin, reps: vorgabe.reps, zoneKey: vorgabe.zoneKey }
    : null);
  const [cfg, setCfg] = useState(ausVorgabe);

  const testmodus = vorgabe.mode === 'test';
  const nurZ2 = vorgabe.mode === 'z2';
  /* Der Anlauf zum Schwellentest laeuft wie der Test selbst als feste Folge
     aus der Datei: er ist die Probe auf den Test, und eine Probe mit anderen
     Zahlen probt etwas anderes. Deshalb steht auch hier keine Einstellkarte. */
  const anlauf = vorgabe.mode === 'steps' ? vorgabe.anlauf : null;

  function sequenz(){
    if(nurZ2) return [];
    if(anlauf) return buildStepSequence(p, th, w, vorgabe.steps);
    return testmodus ? buildTestSequence(p, th, w) : buildIntervalSequence(p, th, w, cfg);
  }

  const uhr = useSchrittTimer({ kennung: 'intervalle', voice: s.voice, sequenz });
  const timer = uhr.timer;

  /* Wie im Trainings-Tab: die Vorgabe haengt an der Woche, und die kann
     wechseln, waehrend die App offen ist. Nicht waehrend eine Uhr laeuft -
     mitten in einer Einheit die Wiederholungszahl zu tauschen waere schlimmer
     als der veraltete Wert. */
  useEffect(() => {
    if(timer.running) return;
    setCfg(ausVorgabe());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w]);

  const vorschau = timer.sequence.length ? timer.sequence : sequenz();
  const step = timer.step;
  const sec = timer.secondsLeft();

  /* Die Beschriftung des Rings kommt aus der Zone des laufenden Schritts und
     nur ersatzweise aus den Einstellungen: eine feste Folge hat keine. */
  const wz = step && step.zone ? step.zone.key : (cfg ? cfg.zoneKey : null);
  const phase = !step ? 'Bereit'
    : step.type === 'work' ? (testmodus ? 'Test' : wz === 'z5' ? 'VO2max'
        : wz === 'z4' ? 'Schwelle' : 'Tempo')
    : step.type === 'warm' ? 'Einfahren'
    : step.type === 'rest' ? 'Erholung'
    : step.type === 'cool' ? 'Ausrollen'
    : step.type === 'done' ? 'Fertig' : 'Bereit';

  const farbe = !step ? 'var(--prep)'
    : step.type === 'work' ? (step.zone && step.zone.key === 'z5' ? 'var(--hard)' : 'var(--rest)')
    : step.type === 'warm' ? 'var(--work)' : 'var(--prep)';

  const kadenz = cfg ? cadenceText(p, cfg.zoneKey, w) : null;
  const watt = cfg ? wattText(p, th, cfg.zoneKey) : null;

  /* Kopf, Status und Hinweise der drei Betriebsarten an einer Stelle - im
     Baugeruest darunter unterscheiden sie sich nur noch darin, ob es eine
     Buehne und Einstellungen gibt. */
  const titel = testmodus ? 'Schwellentest'
    : anlauf ? anlauf.session.title.replace('Rad – ', '')
    : nurZ2 ? 'Grundlagentag'
    : vorgabe.plan.title.replace('Rad – ', '');

  const kopfmeta = nurZ2 ? vorgabe.plan.minutes + ' min' : dauer(totalSeconds(vorschau));

  const status = testmodus ? 'Woche ' + w + ' · Schwellentest statt Intervallen'
    : anlauf ? 'Woche ' + w + ' · Testanlauf statt der Qualitätseinheit'
    : nurZ2 ? 'Woche ' + w + ' · ' + vorgabe.plan.minutes + ' min ' + zoneText(p, th, 'z2', w) + ' am Stück'
    : 'Woche ' + w + ' · ' + cfg.reps + '× ' + cfg.workMin + ' min ' + zoneText(p, th, cfg.zoneKey, w);

  const hinweise = testmodus ? [p.texts.thresholdTestSummary]
    : anlauf ? [anlauf.taper.step.text, anlauf.session.note].filter(Boolean)
    : nurZ2 ? [p.texts.thursdayNoTimer]
    : [p.texts.intervalRollingStart + (isRecoveryWeek(p, w) ? ' ' + p.texts.intervalRecoveryWeek : '')];

  return (
    <Baustein
      titel={titel}
      meta={kopfmeta}
      status={<p class="tagchip">{status}</p>}
      buehne={nurZ2 ? null : (
        <Buehne
          ring={{
            fraction: timer.fraction(),
            color: farbe,
            phase,
            time: step ? (step.type === 'done' ? '0:00' : klok(sec)) : klok(vorschau[1] ? vorschau[1].duration : 0),
            exercise: step ? step.label : 'Tippen zum Starten',
            meta: step && step.type !== 'done'
              ? 'noch ' + dauer(remainingAfter(timer.sequence, timer.index) + sec) : '',
            zone: step ? step.zone : (vorschau[1] && vorschau[1].zone)
          }}
          zurueck={{ onClick: uhr.zurueck, disabled: !step || timer.index <= 0 }}
          haupt={{ label: timer.running ? 'Pause'
                          : (step && step.type !== 'done' ? 'Fortsetzen' : 'Start'),
                   onClick: uhr.starten }}
          weiter={{ onClick: uhr.weiter, disabled: !step || step.type === 'done' }}
          ende={step ? { label: 'Einheit beenden', onClick: uhr.beenden } : null} />
      )}
      hinweise={hinweise}
      schluss={
        testmodus
          ? <p class="hint">Der Testablauf steht fest und lässt sich nicht verstellen – ein Test, der sich anpassen lässt, ist kein Vergleichsmaßstab mehr.</p>
          : anlauf
          ? <p class="hint">Der Anlauf steht fest und lässt sich nicht verstellen – er ist die Probe auf den Test am {anlauf.taper.date.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' })}, und eine Probe mit anderen Zahlen probt etwas anderes.</p>
          : nurZ2 ? null : (
          <div class="card">
            <div class="row"><span>Einstellungen</span><b>anpassbar</b></div>
            {/* Einfahren und Ausrollen duerfen auf null: wer schon warm ist,
                faehrt sofort los. Intervall, Erholung und Wiederholungen nicht -
                ein Intervall ueber null Minuten ist kein Intervall. */}
            <Zahlenfeld titel="Einfahren (Min.)" wert={cfg.warmMin} min={0} dezimal
              onWert={v => setCfg({ ...cfg, warmMin: v ?? 0 })} />
            <Zahlenfeld titel="Intervall (Min.)" wert={cfg.workMin} min={0.5} schritt="0.5" dezimal
              onWert={v => setCfg({ ...cfg, workMin: v ?? cfg.workMin })} />
            <Zahlenfeld titel="Erholung (Min.)" wert={cfg.restMin} min={0.5} schritt="0.5" dezimal
              onWert={v => setCfg({ ...cfg, restMin: v ?? cfg.restMin })} />
            <Zahlenfeld titel="Wiederholungen" wert={cfg.reps} min={1}
              onWert={v => setCfg({ ...cfg, reps: v ?? cfg.reps })} />
            <Zahlenfeld titel="Ausrollen (Min.)" wert={cfg.coolMin} min={0} dezimal
              onWert={v => setCfg({ ...cfg, coolMin: v ?? 0 })} />
          </div>
        )
      }>

      {/* Vorgabe und Ablauf in einer Karte: beides beantwortet dieselbe Frage,
          und getrennt stuenden zwei Kartenraender zwischen der Zahl und der
          Folge, die sie erzeugt. */}
      {!nurZ2 && (
        <div class="card">
          {cfg && (
            <>
              <div class="row"><span>Vorgabe</span><b>
                {cfg.reps}× {cfg.workMin} min {zoneText(p, th, cfg.zoneKey, w)}
                {watt ? ' · ' + watt : ''}
              </b></div>
              {vorgabe.plan.power && <div class="row"><span>Leistung</span><b>{vorgabe.plan.power}</b></div>}
              {kadenz && <div class="row"><span>Trittfrequenz</span><b>{kadenz}</b></div>}
            </>
          )}
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
      )}

      <div class="card">
        <div class="row"><span>Pulszonen Woche {w}</span>
          <b>{usesCoggan(p, th, w) ? 'Coggan aus LTHR' : 'Übergangsbänder'}</b></div>
        {/* Ohne Wattbereich: die Vorgabe fuer heute steht schon ueber der
            Ablaufliste, hier geht es nur um die Baender. */}
        <Zonenliste bands={hrBands(p, th, w)} plan={p} thresholds={th} />
      </div>
    </Baustein>
  );
}
