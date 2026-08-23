import { useEffect, useState } from 'preact/hooks';
import { plan, thresholds, startDate, today, week, apiKey } from '../../../state/store.js';
import { buildDayInfo, formatDate } from '../../../domain/day.js';
import { isoDayLocal, toMidnight, phaseName, isWinterBlock, isRecoveryWeek,
         isTestWeek, testWeeks, testDateFor } from '../../../domain/week.js';
import { usesCoggan } from '../../../domain/zones.js';

import { fetchWellness } from '../../../data/icu.js';
import { wellnessSerie, wellnessMassnahmen } from '../../../domain/analysis.js';
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

/* Ein Abruf fuer die ganze Woche.

   Die Ampel steht auf zwei Karten (Mittwoch und Donnerstag), gerechnet wird sie
   aber nur einmal - fuer heute. Zwei Komponenten mit je eigenem useEffect
   haetten zwei Abfragen fuer dieselbe Antwort ausgeloest.

   Drei Wochen statt einer: das Gate nimmt sich daraus die letzten sieben Tage,
   der Gewichtstrend braucht mehr Punkte, um eine Gerade zu tragen. */
const WELLNESS_TAGE = 21;

function useWellness(){
  const [serie, setSerie] = useState(null);
  const key = apiKey.value;
  const heuteIso = isoDayLocal(toMidnight(today.value));

  useEffect(() => {
    if(!key) return undefined;
    let abgebrochen = false;
    const bis = toMidnight(new Date(heuteIso));
    const von = new Date(bis); von.setDate(von.getDate() - (WELLNESS_TAGE - 1));
    fetchWellness(key, isoDayLocal(von), heuteIso)
      .then(d => { if(!abgebrochen) setSerie(wellnessSerie(d, heuteIso)); })
      .catch(() => {});
    return () => { abgebrochen = true; };
  }, [key, heuteIso]);

  return serie;
}

function Werteleiste({ gate }){
  const h = gate.heute;
  const teile = [];
  if(h.restingHR > 0){
    teile.push('Ruhepuls ' + Math.round(h.restingHR) + ' bpm' +
      (gate.rhrAvg ? ' (Schnitt ' + Math.round(gate.rhrAvg) + ')' : ''));
  }
  if(h.hrv > 0){
    teile.push('HRV ' + Math.round(h.hrv) + (gate.hrvAvg ? ' (Schnitt ' + Math.round(gate.hrvAvg) + ')' : ''));
  }
  if(h.sleepSecs > 0) teile.push('Schlaf ' + (h.sleepSecs / 3600).toFixed(1).replace('.', ',') + ' h');
  return <>{teile.join(' · ')}</>;
}

/* Die Ampel gilt fuer heute, also steht sie auch nur auf der heutigen Karte.

   Vorher hing sie an jedem Donnerstag im Sieben-Tage-Fenster - am Montag also
   an einer Karte, die drei Tage in der Zukunft liegt, mit den Werten von
   Montag. Auf kuenftigen Karten bleibt deshalb nur die Regel als Erinnerung,
   ohne Zahlen. */
function WellnessAmpel({ info, istHeute, serie }){
  if(!info.wellness) return null;
  const regel = <div class="daynote">{plan.value.texts.wellnessRule}</div>;
  if(!istHeute || !apiKey.value) return regel;
  if(!serie || !serie.heute) return regel;

  const gate = serie.heute;
  const vorschau = info.wellness.rolle === 'vorschau';

  if(gate.rot){
    const mass = wellnessMassnahmen(info.wellness.donnerstag, serie.zweiRot);
    return (
      <div class="daynote rot">
        <b>Wellness-Gate rot{vorschau ? ' (Stand heute)' : ''}:</b> {gate.gruende.join(' · ')}.
        {vorschau && ' Entscheidend ist der Wert morgen früh – bleibt es dabei:'}
        <ul>{mass.map((m, i) => <li key={i}>{m}</li>)}</ul>
      </div>
    );
  }

  return (
    <div class="daynote gruen">
      <b>Wellness-Gate grün{vorschau ? ' (Stand heute)' : ''}.</b>{' '}
      <Werteleiste gate={gate} />.{' '}
      {vorschau
        ? 'Wenn es morgen früh so bleibt, kann der Qualitätstag wie geplant laufen.'
        : 'Der Qualitätstag kann wie geplant laufen.'}
    </div>
  );
}

/* Eigener Kasten, nicht in der Ampel.

   Eine zu schnelle Abnahme ist keine Aussage ueber heute, sondern ueber die
   letzten Wochen. In den Gruenden des Gates stuende sie waehrend einer Diaet
   dauerhaft - und ein Gate, das nie gruen wird, beantwortet keine Frage mehr. */
function AbnehmHinweis({ serie }){
  if(!serie || !serie.abnehmen) return null;
  return <div class="daynote gelb"><b>Gewichtstrend:</b> {serie.abnehmen.text}</div>;
}

function Tageskarten(){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const serie = useWellness();
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
        <WellnessAmpel info={info} istHeute={i === 0} serie={serie} />
        {i === 0 && <AbnehmHinweis serie={serie} />}
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
