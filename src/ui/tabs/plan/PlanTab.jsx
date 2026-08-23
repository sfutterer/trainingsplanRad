import { useEffect, useState } from 'preact/hooks';
import { plan, thresholds, startDate, today, week, apiKey } from '../../../state/store.js';
import { buildDayInfo, formatDate } from '../../../domain/day.js';
import { isoDayLocal, toMidnight, phaseName, isWinterBlock, isRecoveryWeek,
         isTestWeek, testWeeks, testDateFor } from '../../../domain/week.js';
import { usesCoggan } from '../../../domain/zones.js';

import { fetchWellness } from '../../../data/icu.js';
import { wellnessGate } from '../../../domain/analysis.js';
import { gotoTab } from '../../../App.jsx';
import './plan.css';

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




export function PlanTab(){
  return (
    <>
      <StatusKarte />
      <Tageskarten />
    </>
  );
}
