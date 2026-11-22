/* Krafttraining mit Saetzen - der Baustein "Kraft" in Plan 2.

   Zwei Programme: Montag Rumpf + Oberkoerper als Supersaetze, Donnerstagabend
   Beine in einzelnen Saetzen mit voller Pause. Der Ablauf kommt aus kraft.js;
   hier wird er gefuehrt:

     Satz     Uebung, Satz x von n, Ziel. Eingabe: Wiederholungen (bei
              Stuetzuebungen Sekunden, beim Koffertragen Meter) und Gewicht.
              Die Taste heisst "Erledigt": der Satz endet, wenn er zu Ende
              ist, nicht nach einer Uhr.
     Pause    laeuft danach von selbst - nach jedem Satz der Beine, im
              Supersatz nach dem Paar. Zwischen A1 und A2 wird gewechselt,
              nicht gewartet.

   Ins Protokoll (coreLog, kind 'kraft') geht je Satz der Wert und das
   Gewicht. Das ist, was die doppelte Progression braucht - erst mehr
   Wiederholungen, dann mehr Gewicht - und was intervals.icu von einer
   Krafteinheit nicht weiss.

   Was hier bewusst nicht mehr steht: die Hinweise aus dem Plan und die
   Stufenleitern. Beides waren Karten unter dem Ablauf - sechzehn Absaetze
   Regeltext und vier Auswahlfelder, die man einmal setzt und danach nicht
   mehr ansieht. Die Regeln stehen im Trainingsplan und, wo sie zur Bewegung
   gehoeren (Langhantel ohne Rack), in den Schritten der Uebung selbst; die
   Stufe stellt man dort um, wo sie gilt - im Uebungsdialog. Die Stufe bleibt
   ein Stand, keine Vorgabe: sie wird gespeichert und gilt auch im
   Rumpfzirkel am Mittwoch. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { plan, week, settings, coreLog, saveCoreLog, today, stufen,
         startDate } from '../../../state/store.js';
import { kraftWahl, kraftLaeuft } from '../../../state/navigation.js';
import { buildLegRestSequence } from '../../../domain/timer/sequences.js';
import { kraftDosis, kraftAblauf, kraftUebungen, satzZiel, zielZahl, einheitKurz,
         kraftEintragId, kraftSaetzeErledigt, letztesGewicht, stufeText } from '../../../domain/kraft.js';
import { isoDayLocal, planAm, weekNumberFor, WEEKDAY_SHORT } from '../../../domain/week.js';
import { Baustein, Uebungsliste } from './Baustein.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Buehne } from '../../components/Buehne.jsx';
import { useTimerBasis } from '../../components/useTimerBasis.js';
import { speak, primeSpeech, beep, vibrate, ensureWakeLock, cancelSpeech } from '../../../platform/index.js';

/* Ohne Krafteinheit in der gezeigten Woche (Uebergang) stehen diese zur
   Wahl - die drei Einheiten einer normalen Belastungswoche. */
const STANDARD = ['oberkoerper', 'beineModerat', 'beine'];

/* `woche` kommt aus trainingsWoche (day.js): die Woche, die der
   Trainingsbereich gerade zeigt. Zur Wahl stehen die Krafteinheiten dieser
   Woche, mit ihrem Wochentag - seit Fassung 2 sind das in Belastungswochen
   drei (Mo Rumpf + Oberkoerper, Di Beine moderat, Do Beine schwer), in
   Erholungswochen zwei, in Testwochen keine. */
export function Kraftblock({ woche, onOpen }){
  const p = woche ? woche.plan : plan.value;
  const w = woche ? Math.max(woche.week, 1) : week.value;
  const s = settings.value;
  const tag = isoDayLocal(today.value);

  const geplant = woche ? woche.kraft : [];
  const angebot = geplant.length
    ? geplant.map(k => ({ id: k.programm, datum: k.datum, einheit: k.einheit }))
    : STANDARD.filter(k => p.kraft.programme[k]).map(k => ({ id: k, datum: null, einheit: null }));
  const heuteGeplant = angebot.find(a => a.datum && isoDayLocal(a.datum) === tag);
  /* Die Wahl liegt in kraftWahl - die Tageskarte setzt sie beim Sprung mit.
     Steht das gewaehlte Programm nicht in dieser Woche, gilt das von heute,
     sonst das erste der Woche. */
  const gewaehlt = angebot.find(a => a.id === kraftWahl.value) || heuteGeplant || angebot[0];
  const prog = gewaehlt.id;

  const einheit = gewaehlt.einheit;
  const dosis = kraftDosis(p, w, prog, einheit);
  const ablauf = kraftAblauf(dosis);
  const uebungen = kraftUebungen(dosis);

  const id = kraftEintragId(prog, tag);
  const eintrag = coreLog.value.find(e => e && e.id === id) || null;

  /* -1: kein Ablauf, nur Liste und Protokoll. */
  const [idx, setIdx] = useState(-1);
  const [pauseLaeuft, setPauseLaeuft] = useState(false);
  const [wert, setWert] = useState(0);
  const [gewicht, setGewicht] = useState(0);

  const { timer, zeichnen, melden } =
    useTimerBasis({ kennung: 'kraft', label: 'Kraft', segment: 'leg' });

  /* Laeuft ein Ablauf, bleibt die Woche im Trainingsbereich stehen. */
  useEffect(() => {
    kraftLaeuft.value = idx >= 0;
    return () => { kraftLaeuft.value = false; };
  }, [idx]);

  const laufend = idx >= 0 && idx < ablauf.length;
  const satz = laufend ? ablauf[idx] : null;
  const naechster = laufend && idx + 1 < ablauf.length ? ablauf[idx + 1] : null;
  const letzter = laufend && idx === ablauf.length - 1;

  const naechsterRef = useRef(null);
  naechsterRef.current = naechster;

  function satzDaten(i){
    const st = ablauf[i];
    if(!eintrag || !st) return null;
    return eintrag.saetze.find(x => x.uebung === st.key && x.satz === st.satz) || null;
  }

  function speichern(st, v, kg){
    const liste = coreLog.value.slice();
    let e = liste.find(x => x && x.id === id);
    if(!e){
      e = { kind:'kraft', id, day: tag, programm: prog, phase: dosis.phase,
            week: Math.max(weekNumberFor(today.value, planAm(p, today.value, startDate.value).start), 1),
            geplanteSaetze: ablauf.length, saetze: [], finished: false };
      liste.push(e);
    }
    e.geplanteSaetze = ablauf.length;
    const alt = e.saetze.findIndex(x => x.uebung === st.key && x.satz === st.satz);
    const neu = { uebung: st.key, name: st.name, satz: st.satz, wert: v > 0 ? v : null,
                  einheit: st.einheit, gewicht: kg > 0 ? kg : null };
    if(st.stufenleiter){
      const t = stufeText(p, st.stufenleiter, stufen.value);
      if(t) neu.stufe = t.index + 1;
    }
    if(alt >= 0) e.saetze[alt] = neu; else e.saetze.push(neu);
    e.finished = kraftSaetzeErledigt(e) >= ablauf.length;
    saveCoreLog(liste);
  }

  useEffect(() => {
    const ab = [];
    ab.push(timer.on('step', ({ step }) => {
      zeichnen();
      if(step.type === 'rest'){
        beep(440, 180);
        const n = naechsterRef.current;
        speak('Pause.' + (n ? ' Als Nächstes: ' + n.name + ', Satz ' + n.satz + '.' : ''), s.voice);
      } else if(step.type === 'done'){
        beep(880, 220);
        vibrate(40);
        setPauseLaeuft(false);
        melden(false);
        setIdx(i => i + 1);
      }
    }));
    return () => { ab.forEach(f => f()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.voice]);

  /* Jeder Satz beginnt mit dem Ziel im Feld, das Gewicht mit dem letzten
     Satz dieser Uebung - heute oder an einem frueheren Tag. Schon
     Protokolliertes sticht beides. */
  useEffect(() => {
    if(!laufend) return;
    const da = satzDaten(idx);
    setWert(da && da.wert > 0 ? da.wert : zielZahl(satz));
    const heuteKg = eintrag ? (eintrag.saetze.filter(x => x.uebung === satz.key && x.gewicht > 0).pop() || {}).gewicht : null;
    setGewicht(da && da.gewicht > 0 ? da.gewicht : (heuteKg || letztesGewicht(coreLog.value, satz.key, tag) || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, prog]);

  function beenden(){
    cancelSpeech();
    timer.reset([]);
    setPauseLaeuft(false);
    melden(false);
    setIdx(-1);
  }
  function starten(){
    primeSpeech();
    ensureWakeLock();
    setIdx(0);
    const erster = ablauf[0];
    if(erster) speak(erster.name + '. Satz 1. Ziel ' + satzZiel(erster) + '.', s.voice);
  }
  function erledigt(){
    speichern(satz, wert, gewicht);
    if(letzter){
      beep(880, 300); beep(1046, 300, 200);
      vibrate([60, 40, 60]);
      speak('Krafteinheit geschafft. Gut gemacht!', s.voice);
      beenden();
      return;
    }
    if(!(satz.pauseNach > 0)){
      /* Im Supersatz geht es ohne Pause zur zweiten Uebung des Paars. */
      const n = ablauf[idx + 1];
      speak('Weiter: ' + n.name + '.', s.voice);
      setIdx(idx + 1);
      return;
    }
    primeSpeech();
    ensureWakeLock();
    timer.load(buildLegRestSequence(satz.pauseNach, 'Pause'));
    timer.start();
    setPauseLaeuft(true);
    melden(true, satz.pauseNach);
    zeichnen();
  }
  function pauseTaste(){
    timer.toggle();
    melden(timer.running);
    zeichnen();
  }
  function blaettern(ziel){
    cancelSpeech();
    timer.reset([]);
    setPauseLaeuft(false);
    melden(false);
    setIdx(ziel < 0 || ziel >= ablauf.length ? -1 : ziel);
  }
  function waehlen(k){
    if(laufend) return;
    kraftWahl.value = k;
  }

  /* Das Uebungsvideo steht im Ablauf nicht mehr unter der Buehne. Es war dort
     doppelt im Weg: wer gerade einen Satz drueckt, sieht es nicht an, und auf
     einem 375er Geraet schob es die Tastenreihe unter die Navigationsleiste -
     ausgerechnet "Erledigt" war abgeschnitten. Erreichbar bleibt es ueber die
     Uebungsliste und den Uebungsdialog, also vor und nach dem Satz. */
  /* Zwei Zeilen statt sechzehn Absaetze: die Tankregel der laufenden Phase
     und der eine Satz, der ohne Rack die Notbremse ist. Der Rest -
     Rueckenregeln, Progression, Muskelkater, Gewicht ergaenzen - steht im
     Trainingsplan; zwischen zwei Saetzen liest ihn niemand. Was zur Bewegung
     selbst gehoert, steht in den Schritten der Uebung. */
  const merkzeilen = [
    dosis.phaseInfo ? dosis.phaseInfo.text : null,
    ...((p.kraft.regeln || {}).beimSatz || [])
  ];

  const erledigtAnzahl = kraftSaetzeErledigt(eintrag);
  const offenDialog = key => onOpen({ kind:'kraft', key,
    dosis: (() => { const u = uebungen.find(x => x.key === key); return u ? satzZiel(u) : ''; })() });
  const stufeVon = st => (st && st.stufenleiter ? stufeText(p, st.stufenleiter, stufen.value) : null);
  const gewichtsfeld = satz && satz.gewicht;

  const buehne = !laufend ? (
    <Buehne
      dosis={{ phase: dosis.phaseInfo ? dosis.phaseInfo.name : 'Bereit',
               wert: ablauf.length + ' Sätze',
               exercise: uebungen.map(u => u.name).join(' · '),
               meta: 'Pause ' + (dosis.pauseText || dosis.pauseSek + ' s') +
                     (dosis.gruppen.some(g => g.paar) ? ' nach jedem Paar' : ' zwischen den Sätzen') }}
      haupt={{ label:'Ablauf starten', onClick: starten, disabled: !ablauf.length }}
      zurueck={{ disabled: true }} weiter={{ disabled: true }} />
  ) : pauseLaeuft ? (
    <Buehne
      ring={{ fraction: timer.fraction(), color:'var(--rest)', phase:'Pause',
              time: String(timer.secondsLeft()),
              exercise: naechster ? naechster.name : 'Fertig',
              meta: naechster ? 'Satz ' + naechster.satz + ' / ' + naechster.saetze : '' }}
      zurueck={{ onClick: () => blaettern(idx), disabled: false, label:'Zurück' }}
      haupt={{ label: timer.running ? 'Pause' : 'Fortsetzen', onClick: pauseTaste }}
      weiter={{ onClick: () => blaettern(idx + 1), label:'Überspringen' }}
      ende={{ label:'Ablauf beenden', onClick: beenden }} />
  ) : (
    <Buehne
      dosis={{ phase: 'Satz ' + satz.satz + ' / ' + satz.saetze +
                      (satz.paar ? ' · Paar ' + satz.paar + satz.paarIndex : ''),
               wert: satzZiel(satz), exercise: satz.name,
               meta: stufeVon(satz) ? 'Stufe: ' + stufeVon(satz).text
                     : dosis.phaseInfo ? dosis.phaseInfo.text : '',
               kinder: <Satzfeld wert={wert} setWert={setWert} einheit={einheitKurz(satz)}
                         gewicht={gewichtsfeld ? gewicht : null} setGewicht={setGewicht} /> }}
      zurueck={{ onClick: () => blaettern(idx - 1), disabled: idx === 0 }}
      haupt={{ label:'Erledigt', onClick: erledigt }}
      weiter={{ label: letzter ? 'Fertig' : 'Weiter', onClick: () => blaettern(idx + 1) }}
      ende={{ label:'Ablauf beenden', onClick: beenden }} />
  );


  return (
    <Baustein
      status={
        <p class={'tagchip' + (ablauf.length && erledigtAnzahl >= ablauf.length ? ' an' : '')}>
          {gewaehlt.datum ? WEEKDAY_SHORT[gewaehlt.datum.getDay()] + ' ' + gewaehlt.datum.getDate() + '.' + (gewaehlt.datum.getMonth() + 1) + '.' : 'Woche ' + w} · {dosis.phaseInfo ? dosis.phaseInfo.name : dosis.phase}{dosis.reduziert ? ' · Erholungswoche' : ''} · {erledigtAnzahl} / {ablauf.length} Sätze heute protokolliert
        </p>
      }
      buehne={buehne}
      hinweise={merkzeilen}>

      {angebot.length > 1 || !geplant.length ? (
        <Segmented rolle="radio" label="Krafteinheit der Woche" klasse="katerwahl"
          ziele={angebot.map(a => ({ id: a.id, disabled: laufend,
            label: (a.datum ? WEEKDAY_SHORT[a.datum.getDay()] + ' · ' : '') + p.kraft.programme[a.id].titel }))}
          aktiv={prog} onWaehlen={waehlen} />
      ) : null}
      {!geplant.length && woche ? (
        <p class="hint">{woche.test
          ? 'Testwoche: Montag nur Rumpf-Zirkel, die Beineinheiten entfallen.'
          : 'In dieser Woche steht keine Krafteinheit im Plan.'}</p>
      ) : null}

      {dosis.aufwaermen ? (
        <div class="card">
          <div class="row"><span>Aufwärmen</span><b>5 min</b></div>
          <p class="hint">{dosis.aufwaermen}</p>
          <Uebungsliste
            uebungen={dosis.aufwaermUebungen.map(u => ({ key: u.key, name: u.name, dosis: 'Aufwärmen' }))}
            aktiv={null}
            onOpen={i => onOpen({ kind:'kraft', key: dosis.aufwaermUebungen[i].key, dosis:'Aufwärmen' })} />
        </div>
      ) : null}

      <div class="card">
        <div class="row"><span>Übungen</span><b>{ablauf.length} Sätze</b></div>
        <Uebungsliste
          uebungen={uebungen.map(u => {
            const g = dosis.gruppen.find(x => x.uebungen.includes(u));
            const st = stufeVon(u);
            return { key: u.key, name: u.name,
                     dosis: (u.saetzeText && !dosis.reduziert ? u.saetzeText : g.runden) + ' × ' + satzZiel(u),
                     fokus: [g.paar ? 'Supersatz ' + g.paar : null, st ? 'Stufe ' + (st.index + 1) + ': ' + st.text : null]
                              .filter(Boolean).join(' · ') || null };
          })}
          aktiv={satz ? uebungen.findIndex(u => u.key === satz.key) : null}
          onOpen={i => offenDialog(uebungen[i].key)} />
      </div>

      <div class="card">
        <div class="row"><span>Protokoll</span><b>heute</b></div>
        {uebungen.map(u => {
          const saetze = eintrag ? eintrag.saetze.filter(x => x.uebung === u.key) : [];
          return (
            <div class="row" key={u.key}>
              <span>{u.name}</span>
              <b>{saetze.length
                ? saetze.slice().sort((a, b) => a.satz - b.satz)
                    .map(x => (x.wert || '–') + (u.einheit === 's' ? ' s' : u.einheit === 'm' ? ' m' : '') +
                              (x.gewicht ? ' × ' + String(x.gewicht).replace('.', ',') + ' kg' : '')).join(' · ')
                : '–'}</b>
            </div>
          );
        })}
      </div>
    </Baustein>
  );
}

/* Wert und Gewicht eines Satzes, mit grossen Tasten - auf dem Boden oder an
   der Bank tippt man nicht in eine Systemtastatur. */
function Satzfeld({ wert, setWert, einheit, gewicht, setGewicht }){
  const setz = v => setWert(Math.max(0, Math.min(999, v)));
  const setzKg = v => setGewicht(Math.max(0, Math.round(v * 2) / 2));
  return (
    <>
      <div class="wdhfeld">
        <button class="btn secondary" onClick={() => setz(wert - 1)} aria-label="Eins weniger">−</button>
        <input type="number" inputmode="numeric" min="0" value={wert}
          onInput={e => setz(parseInt(e.currentTarget.value, 10) || 0)} />
        <button class="btn secondary" onClick={() => setz(wert + 1)} aria-label="Eins mehr">+</button>
        <small>{einheit}</small>
      </div>
      {gewicht != null ? (
        <div class="wdhfeld">
          <button class="btn secondary" onClick={() => setzKg(gewicht - 1)} aria-label="Ein Kilo weniger">−</button>
          <input type="number" inputmode="decimal" min="0" step="0.5" value={gewicht}
            onInput={e => setzKg(parseFloat(String(e.currentTarget.value).replace(',', '.')) || 0)} />
          <button class="btn secondary" onClick={() => setzKg(gewicht + 1)} aria-label="Ein Kilo mehr">+</button>
          <small>kg</small>
        </div>
      ) : null}
    </>
  );
}
