/* Zonen, Schwellenwerte und die Erhebung der Uebergangszeit.

   Standen frueher unter den Tageskarten. Das war die falsche Stelle: der Plan
   beantwortet "was mache ich heute", diese Seite beantwortet "mit welchen
   Zahlen rechne ich". Das eine schaut man taeglich an, das andere alle paar
   Wochen. */

import { useState } from 'preact/hooks';
import { plan, thresholds, startDate, week, testLog, interimLog,
         setThresholds, addTestEntry, addInterimEntry } from '../../../state/store.js';
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

function SchwellenKarte(){
  const th = thresholds.value;
  const [f, setF] = useState({ ftp: th.ftp || '', lthr: th.lthr || '', hrmax: th.hrmax || '' });

  const num = v => { const n = parseInt(v, 10); return isFinite(n) && n > 0 ? n : null; };
  const geaendert = num(f.ftp) !== th.ftp || num(f.lthr) !== th.lthr || num(f.hrmax) !== th.hrmax;

  async function alsTest(){
    const w20 = parseInt(prompt('Ø-Watt der 20 min?') || '', 10);
    const w5  = parseInt(prompt('Ø-Watt der 5 min? (optional)') || '', 10);
    const kg  = parseFloat(String(prompt('Gewicht am Testtag in kg? (optional)') || '').replace(',', '.'));
    const bed = prompt('Bedingungen? Temperatur, Wind, Strecke, Rad, Reifendruck (optional)') || '';
    const heute = toMidnight(new Date());
    let ftp = num(f.ftp);
    if(isFinite(w20) && w20 > 0 && !ftp){
      ftp = Math.round(w20 * 0.95);
      setF({ ...f, ftp });
      await setThresholds({ ftp, lthr: num(f.lthr), hrmax: num(f.hrmax) });
    }
    await addTestEntry({
      day: isoDayLocal(heute),
      week: weekNumberFor(heute, startDate.value),
      w20: isFinite(w20) && w20 > 0 ? w20 : null,
      w5:  isFinite(w5)  && w5  > 0 ? w5  : null,
      ftp, lthr: num(f.lthr),
      weight: isFinite(kg) && kg > 0 ? kg : null,
      conditions: bed
    });
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
