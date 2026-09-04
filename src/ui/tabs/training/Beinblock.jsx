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
import { buildLegRestSequence } from '../../../domain/timer/sequences.js';
import { legDose, legRoundsForDay, legRepText, legRepMin, legDoneRounds, legAborts,
         sorenessLevels, sorenessLevel, legSkipped, rundenText } from '../../../domain/core.js';
import { isoDayLocal } from '../../../domain/week.js';
import { Baustein } from './Baustein.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Buehne } from '../../components/Buehne.jsx';
/* Uhr, Countdown-Piepser und Abmeldung teilt sich dieser Block mit den
   uebrigen Timern - siehe useTimerBasis.js. */
import { useTimerBasis } from '../../components/useTimerBasis.js';
import { speak, primeSpeech, beep, vibrate, ensureWakeLock, cancelSpeech } from '../../../platform/index.js';

export function Beinblock({ eintrag, onOpen }){
  const p = plan.value, w = week.value;
  const s = settings.value;
  const stufen = sorenessLevels(p);

  /* Der Muskelkater steuert die Dosierung des Tages und nicht nur einen Text.

     Er ist in den ersten Wochen der Regelfall und nicht die Ausnahme: der Reiz
     kommt vom exzentrischen Absenken, das beim Radfahren praktisch nicht
     vorkommt. Ohne diese Abfrage gibt es nur zwei schlechte Antworten - voll
     durchziehen oder ganz ausfallen lassen.

     Die Stufe kommt aus dem Protokoll des Tages, wenn dort schon eine steht:
     wer zwischen zwei Runden den Tab wechselt, soll nicht wieder bei "frei"
     anfangen. */
  const [kater, setKater] = useState(() => (eintrag && eintrag.soreness) || (stufen[0] && stufen[0].key));
  const stufe = sorenessLevel(p, kater);
  const entfaellt = legSkipped(p, kater);

  const dose = legDose(p, w, kater);
  const rounds = legRoundsForDay(p, w, today.value.getDay());
  const uebungen = p.legs.exercises;
  const tag = isoDayLocal(today.value);
  const zellen = rounds * uebungen.length;

  /* -1 heisst: kein Ablauf, nur Raster und Protokoll. */
  const [zelle, setZelle] = useState(-1);
  const [pauseLaeuft, setPauseLaeuft] = useState(false);
  const [wert, setWert] = useState(0);
  const { timer, zeichnen, melden } =
    useTimerBasis({ kennung: 'beinblock', label: 'Beinblock', segment: 'leg' });

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
    /* Die Stufe wandert mit ins Protokoll: eine Runde am unteren Rand ist ohne
       den Grund dafuer spaeter nicht von einer abgebrochenen zu unterscheiden. */
    e.soreness = kater;
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
      zeichnen();
      if(step.type === 'rest'){
        beep(440, 180);
        const n = naechsteRef.current;
        speak('Pause.' + (n ? ' Nächste Übung: ' + n.name + '.' : ''), s.voice);
      } else if(step.type === 'done'){
        beep(880, 220);
        vibrate(40);
        setPauseLaeuft(false);
        melden(false);
        setZelle(z => z + 1);
      }
    }));
    return () => { ab.forEach(f => f()); };
    /* Nur die Stimme steht in der Liste: timer, melden und zeichnen sind fuer
       die Lebensdauer der Komponente dieselben. In der Liste waere der Linter
       zufrieden, ohne dass sich etwas aendert - nur laesst sich dann nicht
       mehr lesen, dass die Anmeldung an der Stimme haengt und an sonst
       nichts. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.voice]);

  /* Jede Zelle beginnt mit dem Wiederholungsziel im Feld - schon
     Protokolliertes sticht es, damit ein zweiter Durchgang durch dieselbe
     Zelle nicht die eigene Zahl ueberschreibt. */
  useEffect(() => {
    if(!laufend) return;
    const vorhanden = eintrag && eintrag.exercises[exIndex]
      ? eintrag.exercises[exIndex].reps[runde - 1] : null;
    setWert(vorhanden > 0 ? vorhanden : legRepMin(aktuelle, dose));
    /* Nur die Zelle: das Feld soll beim Wechsel der Zelle neu gesetzt werden
       und sonst nie. Stuende eintrag mit in der Liste, ueberschriebe jedes
       Speichern ins Protokoll die Zahl, die der Nutzer gerade tippt - genau
       waehrend er sie tippt. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zelle]);

  function beenden(){
    cancelSpeech();
    timer.reset([]);
    setPauseLaeuft(false);
    melden(false);
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
    melden(true, pauseSek);
    zeichnen();
  }

  function pauseTaste(){
    timer.toggle();
    melden(timer.running);
    zeichnen();
  }

  /* Blaettern haelt immer auch Uhr und Ansage an - sonst laeuft die Pause der
     Zelle weiter, die man gerade verlassen hat. */
  function blaettern(ziel){
    cancelSpeech();
    timer.reset([]);
    setPauseLaeuft(false);
    melden(false);
    setZelle(ziel < 0 || ziel >= zellen ? -1 : ziel);
  }

  const voll = legDoneRounds(eintrag);
  const ab = legAborts(eintrag);
  const laeuft = timer.running;
  const sec = timer.secondsLeft();
  const naechste = naechsteRef.current;

  const buehne = entfaellt ? (
    /* Bei ausgepraegtem Muskelkater entfaellt der Block. Die Taste bleibt
       sichtbar und gesperrt statt zu verschwinden: ein Knopf, der weg ist,
       sieht aus wie ein Fehler, ein gesperrter sagt, dass die Entscheidung
       oben getroffen wurde. */
    <Buehne
      dosis={{ phase:'Entfällt heute', wert: stufe.label,
               exercise: stufe.text, meta: p.legs.sorenessWarning }}
      haupt={{ label:'Ablauf starten', onClick: starten, disabled: true }}
      zurueck={{ disabled: true }} weiter={{ disabled: true }} />
  ) : !laufend ? (
    <Buehne
      dosis={{ phase:'Bereit', wert: rundenText(rounds),
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
      meta={entfaellt ? 'entfällt heute' : rundenText(rounds) + ' · ' + p.legs.durationHint}
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
        p.legs.sorenessNote,
        p.legs.sorenessWarning,
        p.texts.legAbortSigns,
        p.texts.legProgression
      ]}>

      {/* Die Abfrage steht vor dem Raster und nicht in den Hinweisen: sie ist
          eine Eingabe, keine Erlaeuterung, und sie aendert die Zahlen, die
          darunter stehen. Waehrend eines laufenden Ablaufs gesperrt - die
          Wiederholungsziele der bereits quittierten Saetze wuerden sonst
          nachtraeglich gegen eine andere Spanne gelesen. */}
      <div class="card">
        <div class="row"><span>Muskelkater in den Oberschenkeln</span><b>heute</b></div>
        <Segmented rolle="radio" label="Muskelkater" klasse="katerwahl"
          ziele={stufen.map(l => ({ id: l.key, label: l.label, disabled: laufend }))}
          aktiv={kater} onWaehlen={setKater} />
        <p class="hint">{stufe ? stufe.text : ''}</p>
      </div>


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
