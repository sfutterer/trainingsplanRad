/* Zonen, Schwellenwerte und die Erhebung der Uebergangszeit.

   Standen frueher unter den Tageskarten. Das war die falsche Stelle: der Plan
   beantwortet "was mache ich heute", diese Seite beantwortet "mit welchen
   Zahlen rechne ich". Das eine schaut man taeglich an, das andere alle paar
   Wochen. */

import { useState } from 'preact/hooks';
import { plan, thresholds, startDate, week, testLog, interimLog, apiKey,
         setThresholds, addTestEntry, addInterimEntry } from '../../../state/store.js';
import { fetchWellness, putWellness } from '../../../data/icu.js';
import { isoDayLocal, toMidnight, weekNumberFor } from '../../../domain/week.js';
import { hrBands, bandRange, wattText, usesCoggan, zoneBand } from '../../../domain/zones.js';
import '../plan/plan.css';

function ZonenKarte(){
  const p = plan.value, th = thresholds.value, w = week.value;
  const bands = hrBands(p, th, w).filter(b => b.key !== 'unter');
  const coggan = usesCoggan(p, th, w);
  return (
    <div class="card">
      <div class="row"><span>Zonenmodell</span><b>
        {coggan ? 'Coggan, % LTHR (' + th.lthr + ' bpm)' + (th.ftp > 0 ? ' · Watt aus FTP ' + th.ftp + ' W' : '')
                : 'Übergangsbänder, Arbeitsannahme'}
      </b></div>
      {bands.map(b => (
        <div class="row zonerow" key={b.key}>
          <span><i class="dot" style={'background:' + b.color}></i>{b.label}</span>
          <b>{bandRange(b)}{wattText(p, th, b.key) ? ' · ' + wattText(p, th, b.key) : ''}</b>
        </div>
      ))}
      <p class="hint">{coggan ? p.texts.zoneNoteCoggan : p.texts.zoneNoteTransition}</p>
    </div>
  );
}

/* Zwei Verlaeufe, kein W/kg.

   W/kg waere die naheliegende Zahl und ist hier die falsche: waehrend einer
   Abnehmphase bewegen sich Zaehler und Nenner gleichzeitig, ein steigender
   Quotient sagt dann nichts darueber, ob der Motor groesser geworden ist.
   Getrennt gezeichnet beantworten die beiden Linien genau das - und eine
   flache FTP-Linie ueber einer fallenden Gewichtslinie ist kein Stillstand,
   sondern gehaltene Leistung bei weniger Energie.

   Beide auf einer gemeinsamen Prozentachse, nicht jede auf ihren eigenen
   Bereich normiert. Eigene Bereiche waren der erste Entwurf und machten aus
   einem Watt Unterschied zwischen zwei Tests einen Ausschlag ueber die halbe
   Bildhoehe - Messrauschen, gezeichnet wie Fortschritt. Auf einer gemeinsamen
   Achse bleibt flach, was flach ist, und die beiden Linien werden ueberhaupt
   erst vergleichbar. */
const VERLAUF_MIN_SPANNE = 4;   // Prozent, damit Rauschen nicht das Bild fuellt

function Verlauf({ eintraege }){
  const punkte = eintraege.slice().sort((a, b) => (a.day < b.day ? -1 : 1));

  const reihe = feld => {
    const roh = punkte.map(e => (e[feld] > 0 ? e[feld] : null));
    const echte = roh.filter(x => x !== null);
    if(echte.length < 2) return null;
    const erster = echte[0];
    const werte = [];
    roh.forEach((x, i) => {
      if(x === null) return;
      werte.push({ i, pz: (x - erster) / erster * 100 });
    });
    return { werte, erster, letzter: echte[echte.length - 1] };
  };

  const ftp = reihe('ftp'), kg = reihe('weight');
  if(!ftp && !kg) return null;

  const alle = [].concat(ftp ? ftp.werte : [], kg ? kg.werte : []).map(w => Math.abs(w.pz));
  const spanne = Math.max(VERLAUF_MIN_SPANNE, ...alle);
  const x = i => (punkte.length > 1 ? i / (punkte.length - 1) * 96 + 2 : 50);
  const y = pz => 19 - pz / spanne * 15;

  const zeichne = (l, farbe) => l && (
    <>
      <polyline points={l.werte.map(w => x(w.i) + ',' + y(w.pz)).join(' ')}
        fill="none" stroke={farbe} stroke-width="1.5" vector-effect="non-scaling-stroke" />
      {l.werte.map((w, k) => <circle key={k} cx={x(w.i)} cy={y(w.pz)} r="1.6" fill={farbe} />)}
    </>
  );

  const delta = (l, einheit, s) => {
    if(!l) return null;
    const d = l.letzter - l.erster;
    const z = (Math.round(Math.abs(d) * (s || 1)) / (s || 1)).toString().replace('.', ',');
    const pz = Math.round(Math.abs(d / l.erster * 100) * 10) / 10;
    return (d >= 0 ? '+' : '−') + z + ' ' + einheit +
           ' (' + (d >= 0 ? '+' : '−') + String(pz).replace('.', ',') + ' %)';
  };

  return (
    <>
      <div class="listhead">Verlauf</div>
      <svg class="verlauf" viewBox="0 0 100 38" aria-hidden="true">
        <line x1="0" y1="19" x2="100" y2="19" stroke="var(--outline)"
          stroke-width="1" stroke-dasharray="2 2" vector-effect="non-scaling-stroke" />
        {zeichne(kg, 'var(--z1)')}
        {zeichne(ftp, 'var(--z4)')}
      </svg>
      <div class="verlaufleg">
        {ftp && <span><i style="background:var(--z4)"></i>FTP {delta(ftp, 'W')}</span>}
        {kg && <span><i style="background:var(--z1)"></i>Gewicht {delta(kg, 'kg', 10)}</span>}
      </div>
      <p class="hint">
        Änderung gegenüber dem ersten Test, beide Linien auf derselben Achse. Bewusst
        getrennt statt als W/kg: sinkt das Gewicht gewollt, sagt ein steigender Quotient
        nichts über die Form. Eine flache FTP-Linie bei fallendem Gewicht ist gehaltene
        Leistung bei weniger Energie – kein Stillstand.
      </p>
    </>
  );
}

function SchwellenKarte(){
  const th = thresholds.value;
  const [f, setF] = useState({ ftp: th.ftp || '', lthr: th.lthr || '', hrmax: th.hrmax || '' });
  const [meldung, setMeldung] = useState(null);

  const num = v => { const n = parseInt(v, 10); return isFinite(n) && n > 0 ? n : null; };
  const geaendert = num(f.ftp) !== th.ftp || num(f.lthr) !== th.lthr || num(f.hrmax) !== th.hrmax;

  /* Das Gewicht steht meist schon in der Wellness - dann muss es niemand
     abtippen und die beiden Quellen koennen nicht auseinanderlaufen. */
  async function gewichtVorschlag(tagIso){
    const key = apiKey.value;
    if(!key) return null;
    try {
      const rows = await fetchWellness(key, tagIso, tagIso);
      const r = (Array.isArray(rows) ? rows : []).find(x => x && x.weight > 0);
      return r ? r.weight : null;
    } catch(e){ return null; }
  }

  async function alsTest(){
    const heute = toMidnight(new Date());
    const tagIso = isoDayLocal(heute);
    const w20 = parseInt(prompt('Ø-Watt der 20 min?') || '', 10);
    const w5  = parseInt(prompt('Ø-Watt der 5 min? (optional)') || '', 10);
    const vor = await gewichtVorschlag(tagIso);
    const kg  = parseFloat(String(prompt(
      'Gewicht am Testtag in kg? (optional)' + (vor ? '\nAus intervals.icu übernommen:' : ''),
      vor ? String(vor) : '') || '').replace(',', '.'));
    const bed = prompt('Bedingungen? Temperatur, Wind, Strecke, Rad, Reifendruck (optional)') || '';
    let ftp = num(f.ftp);
    if(isFinite(w20) && w20 > 0 && !ftp){
      ftp = Math.round(w20 * 0.95);
      setF({ ...f, ftp });
      await setThresholds({ ftp, lthr: num(f.lthr), hrmax: num(f.hrmax) });
    }
    const gewicht = isFinite(kg) && kg > 0 ? kg : null;
    await addTestEntry({
      day: tagIso,
      week: weekNumberFor(heute, startDate.value),
      w20: isFinite(w20) && w20 > 0 ? w20 : null,
      w5:  isFinite(w5)  && w5  > 0 ? w5  : null,
      ftp, lthr: num(f.lthr),
      weight: gewicht,
      conditions: bed
    });

    /* Der einzige Schreibvorgang der App, deshalb mit Rueckfrage - und nur,
       wenn der Wert nicht ohnehin von dort kam. */
    if(gewicht && apiKey.value && gewicht !== vor){
      if(confirm('Gewicht ' + gewicht + ' kg für ' + tagIso + ' auch in die Wellness von intervals.icu schreiben?')){
        try {
          await putWellness(apiKey.value, tagIso, { weight: gewicht });
          setMeldung({ art:'ok', text:'Gewicht nach intervals.icu geschrieben.' });
        } catch(e){
          setMeldung({ art:'fehler', text:'Nicht geschrieben: ' + e.message + ' Der Test ist trotzdem gespeichert.' });
        }
      }
    }
  }

  const hist = testLog.value.slice().sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 4);

  return (
    <div class="card">
      <div class="row"><span>Schwellenwerte</span><b>{th.lthr > 0 ? 'aus Test übernommen' : 'noch kein Test'}</b></div>
      <div class="field"><span>FTP (W)</span>
        <input type="number" inputmode="numeric" value={f.ftp} onInput={e => setF({ ...f, ftp: e.currentTarget.value })} /></div>
      <div class="field"><span>LTHR (bpm)</span>
        <input type="number" inputmode="numeric" value={f.lthr} onInput={e => setF({ ...f, lthr: e.currentTarget.value })} /></div>
      <div class="field"><span>HFmax (bpm)</span>
        <input type="number" inputmode="numeric" value={f.hrmax} onInput={e => setF({ ...f, hrmax: e.currentTarget.value })} /></div>
      <div class="buttons" style="margin-top:12px">
        <button class="btn" disabled={!geaendert}
          onClick={() => setThresholds({ ftp: num(f.ftp), lthr: num(f.lthr), hrmax: num(f.hrmax) })}>Übernehmen</button>
        <button class="btn secondary" onClick={alsTest}>Als Test speichern</button>
      </div>
      <p class="hint">
        FTP = Ø-Watt der 20 min × 0,95, LTHR = Ø-Puls der 20 min. Dieselben Werte gehören in
        intervals.icu unter Settings → Ride, Power Zones und HR Zones auf Coggan, Load Priority
        auf Power, FTP von automatisch auf manuell.
      </p>
      {meldung && <div class={'meldung ' + meldung.art} style="margin-top:10px"><b>{meldung.text}</b></div>}
      {testLog.value.length > 1 && <Verlauf eintraege={testLog.value} />}
      {hist.length > 0 && <>
        <div class="listhead">Testhistorie</div>
        {hist.map((e, i) => (
          <div class="listrow" key={i}>
            <span>{e.day}{e.week ? ' · W' + e.week : ''}</span>
            <span>FTP {e.ftp || '–'} W · LTHR {e.lthr || '–'} bpm{e.w20 ? ' · 20 min ' + e.w20 + ' W' : ''}{e.weight ? ' · ' + e.weight + ' kg' : ''}</span>
          </div>
        ))}
      </>}
    </div>
  );
}

function ErhebungsKarte(){
  const p = plan.value, th = thresholds.value, w = week.value;
  const [f, setF] = useState({ talk: '', rpe: '', note: '' });
  const log = interimLog.value;

  const werte = log.map(e => e.talkHr).filter(v => v > 0);
  const schnitt = werte.length ? Math.round(werte.reduce((a, b) => a + b, 0) / werte.length) : null;
  const z2 = zoneBand(p, th, 'z2', w);

  async function eintragen(){
    const talk = parseInt(f.talk, 10), rpe = parseInt(f.rpe, 10);
    if(!(talk > 0) && !(rpe > 0) && !f.note.trim()) return;
    const heute = toMidnight(new Date());
    await addInterimEntry({
      day: isoDayLocal(heute),
      week: weekNumberFor(heute, startDate.value),
      talkHr: talk > 0 ? talk : null,
      rpe: rpe > 0 ? Math.min(rpe, 10) : null,
      note: f.note.trim()
    });
    setF({ talk: '', rpe: '', note: '' });
  }

  return (
    <div class="card">
      <div class="row"><span>Erhebung je Einheit</span>
        <b>{log.length ? log.length + (log.length === 1 ? ' Eintrag' : ' Einträge') : 'noch nichts erfasst'}</b></div>
      <div class="field"><span>Sprechtest-Puls (bpm)</span>
        <input type="number" inputmode="numeric" value={f.talk} onInput={e => setF({ ...f, talk: e.currentTarget.value })} /></div>
      <div class="field"><span>RPE 1–10</span>
        <input type="number" inputmode="numeric" value={f.rpe} onInput={e => setF({ ...f, rpe: e.currentTarget.value })} /></div>
      <div class="field"><span>Notiz</span>
        <input type="text" placeholder="Wind, Knie, Strecke" value={f.note}
          onInput={e => setF({ ...f, note: e.currentTarget.value })} /></div>
      <button class="btn block" style="margin-top:12px" onClick={eintragen}>Eintragen</button>
      <p class="hint">
        Sprechtest: nach Atmung fahren. Sobald ganze Sätze anstrengend werden, Puls ablesen und
        hier notieren – nicht umgekehrt. RPE nach jeder Einheit; das ist der Vergleichsmaßstab für
        später, wenn plötzlich Wattwerte danebenstehen.
      </p>
      {schnitt && z2 && (
        <p class={'hint ' + (schnitt < z2.max - 6 ? 'warn' : 'good')}>
          Ø Sprechtest-Puls {schnitt} bpm, Z2-Obergrenze {z2.max} bpm.{' '}
          {schnitt < z2.max - 6 ? 'Deutlich darunter – Z2 gehört nach unten begrenzt.' : 'Die Bänder passen zur Atmung.'}
        </p>
      )}
      {log.slice(-4).reverse().map((e, i) => (
        <div class="listrow" key={i}>
          <span>{e.day}{e.week ? ' · W' + e.week : ''}</span>
          <span>{e.talkHr ? 'Sprechtest ' + e.talkHr + ' bpm' : '–'}{e.rpe ? ' · RPE ' + e.rpe : ''}{e.note ? ' · ' + e.note : ''}</span>
        </div>
      ))}
    </div>
  );
}

export function ZonenTab(){
  return (
    <>
      <ZonenKarte />
      <SchwellenKarte />
      <ErhebungsKarte />
    </>
  );
}
