import { useEffect, useState } from 'preact/hooks';
import { plan, thresholds, startDate, today, week, apiKey,
         testLog, interimLog, setThresholds,
         addTestEntry, addInterimEntry } from '../../../state/store.js';
import { buildDayInfo, formatDate } from '../../../domain/day.js';
import { isoDayLocal, toMidnight, phaseName, isWinterBlock, isRecoveryWeek,
         isTestWeek, testWeeks, testDateFor, weekNumberFor } from '../../../domain/week.js';
import { hrBands, bandRange, wattText, usesCoggan, zoneBand } from '../../../domain/zones.js';
import { fetchWellness } from '../../../data/icu.js';
import { wellnessGate } from '../../../domain/analysis.js';
import { gotoTab } from '../../../App.jsx';
import './heute.css';

function naechsterTest(p, heute, start){
  for(const w of testWeeks(p)){
    const d = testDateFor(p, w, start);
    const tage = Math.round((d - toMidnight(heute)) / 86400000);
    if(tage < 0) continue;
    if(tage === 0) return 'Heute ist Schwellentest (Woche ' + w + '). Danach FTP und LTHR unten eintragen.';
    if(tage <= 14) return 'Nächster Schwellentest: ' + d.toLocaleDateString('de-DE') +
      ' (Woche ' + w + '), in ' + tage + (tage === 1 ? ' Tag' : ' Tagen') + '.';
    return null;
  }
  return null;
}

function StatusKarte(){
  const p = plan.value, w = week.value, start = startDate.value, th = thresholds.value;
  const winter = isWinterBlock(p, w);

  const hinweise = [];
  if(winter) hinweise.push(p.winterBlock.note);
  if(isTestWeek(p, w)) hinweise.push('Testwoche: der Donnerstag ist Schwellentest, kein Intervalltag.');
  const tn = naechsterTest(p, today.value, start);
  if(tn && !isTestWeek(p, w)) hinweise.push(tn);
  if(w >= p.cogganFromWeek && !(th.lthr > 0)){
    hinweise.push('Ab Woche ' + p.cogganFromWeek + ' rechnet der Plan mit Coggan-Zonen aus der LTHR. ' +
      'Solange kein Testwert eingetragen ist, laufen die Übergangsbänder weiter – die Zonenauswertung ist dann nur eine Näherung.');
  }

  return (
    <div class="card">
      <div class="row"><span>Trainingswoche</span><b>Woche {w}{winter ? '' : ' / ' + p.weekCount}</b></div>
      <div class="row"><span>Phase</span><b>
        {winter ? p.winterBlock.name : 'Phase ' + p.weeks[Math.min(w, p.weekCount) - 1].phase + ' · ' + phaseName(p, w)}
        {isRecoveryWeek(p, w) && !winter ? ' · Erholungswoche' : ''}
      </b></div>
      <div class="row"><span>Pulszonen</span><b>
        {usesCoggan(p, th, w) ? 'Coggan aus LTHR ' + th.lthr + ' bpm' : 'Übergangsbänder (bis zum Test)'}
      </b></div>
      <div class="row"><span>Beginn Woche 1</span><b>{start.toLocaleDateString('de-DE')}</b></div>
      {hinweise.map((h, i) => <p class="hint" key={i}>{h}</p>)}
    </div>
  );
}

function WellnessAmpel({ info }){
  const [gate, setGate] = useState(null);
  const key = apiKey.value;

  useEffect(() => {
    if(!info.wellness || !key) return;
    let abgebrochen = false;
    const to = toMidnight(new Date());
    const from = new Date(to); from.setDate(from.getDate() - 7);
    fetchWellness(key, isoDayLocal(from), isoDayLocal(to))
      .then(d => { if(!abgebrochen) setGate(wellnessGate(d, isoDayLocal(to))); })
      .catch(() => {});
    return () => { abgebrochen = true; };
  }, [info.wellness, key]);

  if(!info.wellness) return null;
  if(!gate) return <div class="daynote">{plan.value.texts.wellnessRule}</div>;

  if(gate.rot){
    return <div class="daynote rot">
      <b>Wellness-Gate rot:</b> {gate.gruende.join(' · ')}. Donnerstag wird 60 min Z2,
      Samstag ohne Blöcke. Zwei rote Tage hintereinander → die ganze Woche als Erholungswoche fahren.
    </div>;
  }
  const h = gate.heute;
  return <div class="daynote gruen">
    <b>Wellness-Gate grün.</b>{' '}
    {h.restingHR > 0 ? 'Ruhepuls ' + h.restingHR + ' bpm' + (gate.rhrAvg ? ' (Schnitt ' + Math.round(gate.rhrAvg) + ')' : '') : ''}
    {h.hrv > 0 ? ' · HRV ' + Math.round(h.hrv) : ''}
    {h.sleepSecs > 0 ? ' · Schlaf ' + (h.sleepSecs / 3600).toFixed(1).replace('.', ',') + ' h' : ''}
    . Der Qualitätstag kann wie geplant laufen.
  </div>;
}

function Tageskarten(){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const karten = [];
  for(let i = 0; i < 7; i++){
    const d = new Date(today.value);
    d.setDate(d.getDate() + i);
    const info = buildDayInfo(p, th, d, start);
    karten.push(
      <div class={'card day type-' + info.type + (i === 0 ? ' heute' : '')} key={i}>
        <div class="dayline">
          <span>{formatDate(d)}</span>
          <span>{i === 0 ? <b class="badge">HEUTE</b> : 'Woche ' + info.week}</span>
        </div>
        <div class="daytitle">{info.title}</div>
        <div class="daydetail">{info.detail}</div>
        <WellnessAmpel info={info} />
        {info.showTimerBtn && <button class="btn tonal" style="margin-top:12px"
          onClick={() => gotoTab('rumpf', true)}>Rumpf-Timer öffnen</button>}
        {info.showIntervalBtn && <button class="btn tonal" style="margin-top:12px"
          onClick={() => gotoTab('intervalle', true)}>Intervall-Timer öffnen</button>}
      </div>
    );
  }
  return <>{karten}</>;
}

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

export function HeuteTab(){
  return (
    <>
      <h1 class="title">Heute</h1>
      <StatusKarte />
      <Tageskarten />
      <ZonenKarte />
      <SchwellenKarte />
      <ErhebungsKarte />
    </>
  );
}
