/* Krafttraining mit Saetzen - der Baustein "Kraft" in Plan 2.

   Zwei Programme: Montag Rumpf + Oberkoerper als Supersaetze, Donnerstagabend
   Beine in einzelnen Saetzen mit voller Pause. Der Ablauf kommt aus kraft.js;
   hier wird er gefuehrt:

     Satz     Uebung, Satz x von n, Ziel, Video. Eingabe: Wiederholungen (bei
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

   Die Stufenleitern (Liegestuetz, Unterarmstuetz, Seitstuetz, Klimmzug)
   stehen darunter zum Einstellen. Die Stufe ist ein Stand, keine Vorgabe:
   sie wird gespeichert und gilt auch im Rumpfzirkel am Mittwoch. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { plan, week, settings, coreLog, saveCoreLog, today, stufen, setStufe,
         startDate } from '../../../state/store.js';
import { kraftWahl } from '../../../state/navigation.js';
import { buildLegRestSequence } from '../../../domain/timer/sequences.js';
import { kraftDosis, kraftAblauf, kraftUebungen, satzZiel, zielZahl, einheitKurz,
         kraftEintragId, kraftSaetzeErledigt, letztesGewicht, stufeText } from '../../../domain/kraft.js';
import { isoDayLocal, tagDaten, planAm, weekNumberFor } from '../../../domain/week.js';
import { Baustein, Uebungsliste } from './Baustein.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Buehne } from '../../components/Buehne.jsx';
import { Auswahlfeld } from '../../components/Feld.jsx';
import { useTimerBasis } from '../../components/useTimerBasis.js';
import { speak, primeSpeech, beep, vibrate, ensureWakeLock, cancelSpeech } from '../../../platform/index.js';

const NAMEN = { oberkoerper: 'Mo · Rumpf + Oberkörper', beine: 'Do · Beine' };
const TAG_KUERZEL = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'];

/* Die Krafteinheit, die heute im Plan steht - fuer die Voreinstellung des
   Programms und fuer eine abweichende Satzzahl aus der Datei. */
function heutigeEinheit(p, w, datum){
  if(!p || p.format !== 2) return null;
  return tagDaten(p, w, TAG_KUERZEL[datum.getDay()]).find(e => e.kind === 'kraft') || null;
}

export function Kraftblock({ onOpen }){
  const p = plan.value, w = week.value;
  const s = settings.value;
  const tag = isoDayLocal(today.value);
  const heute = heutigeEinheit(p, w, today.value);
  /* Montag zuerst, wie die Woche. */
  const programme = Object.keys(p.kraft.programme)
    .sort((a, b) => (a === 'oberkoerper' ? -1 : b === 'oberkoerper' ? 1 : 0));

  const vorwahl = () => kraftWahl.value
    || (heute && heute.programm)
    || (today.value.getDay() === 1 ? 'oberkoerper' : 'beine');
  const [prog, setProg] = useState(vorwahl);

  const einheit = heute && heute.programm === prog ? heute : null;
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

  /* Ein Sprung von der Tageskarte setzt das Programm mit. */
  useEffect(() => {
    if(kraftWahl.value && kraftWahl.value !== prog && idx < 0) setProg(kraftWahl.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kraftWahl.value]);


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
    setProg(k);
  }

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
      bild={naechster && naechster.key ? (() => {
        const ex = uebungen.find(u => u.key === naechster.key);
        return ex && ex.ex ? { src: ex.ex.img, name: ex.name, vorschau: true,
                               cap: <b>{ex.name}</b>, onClick: () => offenDialog(ex.key) } : null;
      })() : null}
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
      bild={(() => {
        const ex = uebungen.find(u => u.key === satz.key);
        return ex && ex.ex ? { src: ex.ex.img, name: ex.name, cap: <b>{ex.name}</b>,
                               onClick: () => offenDialog(ex.key) } : null;
      })()}
      zurueck={{ onClick: () => blaettern(idx - 1), disabled: idx === 0 }}
      haupt={{ label:'Erledigt', onClick: erledigt }}
      weiter={{ label: letzter ? 'Fertig' : 'Weiter', onClick: () => blaettern(idx + 1) }}
      ende={{ label:'Ablauf beenden', onClick: beenden }} />
  );

  const regeln = p.kraft.regeln || {};
  const leitern = Object.keys(p.kraft.stufenleitern || {});

  return (
    <Baustein
      titel={'Kraft – ' + dosis.titel}
      meta={(dosis.dauer || '') + (dosis.reduziert ? ' · Erholungswoche' : '')}
      status={
        <p class={'tagchip' + (ablauf.length && erledigtAnzahl >= ablauf.length ? ' an' : '')}>
          Woche {w} · {dosis.phaseInfo ? dosis.phaseInfo.name : dosis.phase} · {erledigtAnzahl} / {ablauf.length} Sätze protokolliert
        </p>
      }
      buehne={buehne}
      hinweise={[
        ...(dosis.hinweise || []),
        dosis.phaseInfo ? dosis.phaseInfo.name + ': ' + dosis.phaseInfo.text : null,
        regeln.steigerung,
        regeln.gewicht,
        ...((regeln.ruecken || []).map(r => 'Rücken: ' + r))
      ]}
      schluss={
        <div class="card">
          <div class="row"><span>Stufenleitern</span><b>aktuelle Stufe</b></div>
          {leitern.map(k => {
            const l = p.kraft.stufenleitern[k];
            const t = stufeText(p, k, stufen.value);
            return (
              <Auswahlfeld key={k} titel={l.name} wert={String(t.index)}
                onWert={v => setStufe(k, parseInt(v, 10) || 0)}
                optionen={l.stufen.map((x, i) => ({ id: String(i), label: (i + 1) + '. ' + x }))} />
            );
          })}
          {regeln.stufen ? <p class="hint">{regeln.stufen}</p> : null}
        </div>
      }>

      <Segmented rolle="radio" label="Programm" klasse="katerwahl"
        ziele={programme.map(k => ({ id: k, label: NAMEN[k] || p.kraft.programme[k].titel, disabled: laufend }))}
        aktiv={prog} onWaehlen={waehlen} />

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
