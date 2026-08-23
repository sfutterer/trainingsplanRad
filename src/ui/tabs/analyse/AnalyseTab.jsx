/* Abgleich mit intervals.icu.

   Bewusst ohne Abhaengigkeit auf Timer, Wake Lock oder Sprachausgabe. Das ist
   nicht nur sauberer Schnitt: es ist der einzige Teil der App, der ohne diese
   Faehigkeiten funktioniert - und damit der einzige, der sich spaeter als
   eigenstaendige Oberflaeche ausliefern liesse. */

import { useState } from 'preact/hooks';
import { plan, thresholds, startDate, apiKey, coreLog, setApiKey, today } from '../../../state/store.js';
import { fetchActivities, fetchStreams } from '../../../data/icu.js';
import { zoneSeconds, hrBands } from '../../../domain/zones.js';
import { isoDayLocal, toMidnight, weekNumberFor } from '../../../domain/week.js';
import { anBuildReport, anWeekTotals, anFmtMin, anPct, anIsRide } from '../../../domain/analysis.js';
import './analyse.css';

function ZonenBalken({ z }){
  const p = plan.value;
  if(!z || !z._total) return null;
  const teile = p.zoneKeys.filter(k => (z[k] || 0) / z._total >= 0.01);
  return (
    <>
      <div class="zbar">
        {teile.map(k => <span key={k} style={'width:' + (z[k] / z._total * 100).toFixed(1) + '%;background:' + p.zoneColor[k]}></span>)}
      </div>
      <div class="zleg">
        {p.zoneKeys.filter(k => (z[k] || 0) / z._total >= 0.02)
          .map(k => p.zoneLabel[k] + ' ' + anPct(z[k], z._total) + '%').join(' · ')}
      </div>
    </>
  );
}

const BADGE = { ok:'ok', dev:'dev', miss:'miss', extra:'extra' };

function TagesZeile({ row, wochenmodus }){
  const t = row.target;
  const datum = row.date.toLocaleDateString('de-DE', { weekday:'short', day:'2-digit', month:'2-digit' });

  const soll = [];
  if(t.sport === 'optional') soll.push('optional ' + t.minutes + ' min ' + t.zone.toUpperCase());
  else if(t.minutes) soll.push(t.minutes + ' min' + (t.sport === 'core' ? ' Zirkel' : ''));
  if(t.zone && t.sport === 'ride') soll.push(t.zone.toUpperCase());
  if(t.test) soll.push('Schwellentest');
  if(t.rideMinutes) soll.push('Rad mind. ' + t.rideMinutes + ' min');
  if(t.legRounds) soll.push('Beinblock ' + t.legRounds + ' Runden');
  if(t.sport === 'rest') soll.push('kein Training');

  return (
    <div class={'card antag ' + (wochenmodus ? '' : BADGE[row.status] || '')}>
      <div class="anhead">
        <span>{datum} · Woche {row.week}</span>
        <span class="anbadge">{wochenmodus ? 'Tagesbewertung aus' : row.badge}</span>
      </div>
      <div class="antitle">{row.plan.title}</div>
      {soll.length > 0 && <div class="ansoll">Soll: {soll.join(' · ')}</div>}
      {row.acts.map((a, i) => (
        <div class="anist" key={i}>
          {a.name || a.type}: {anFmtMin(a.moving_time || a.elapsed_time || 0)}
          {a.distance ? ' · ' + (a.distance / 1000).toFixed(1) + ' km' : ''}
          {a.average_heartrate ? ' · ⌀ ' + a.average_heartrate + ' bpm' : ''}
        </div>
      ))}
      <ZonenBalken z={row.zones} />
      {row.notes.map((n, i) => <div class={'annote ' + (n.kind || '')} key={i}>{n.text}</div>)}
    </div>
  );
}

export function AnalyseTab(){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const [key, setKey] = useState(apiKey.value);
  const [range, setRange] = useState('14');
  const [mitZonen, setMitZonen] = useState(true);
  const [wochenmodus, setWochenmodus] = useState(false);
  const [status, setStatus] = useState(null);
  const [rows, setRows] = useState(null);
  const [meta, setMeta] = useState(null);
  const [laeuft, setLaeuft] = useState(false);

  function vonDatum(){
    const to = toMidnight(today.value);
    if(range === 'all' && start) return toMidnight(start);
    const d = new Date(to);
    d.setDate(d.getDate() - (parseInt(range, 10) - 1));
    return d;
  }

  async function laden(){
    if(!key.trim()) return setStatus({ art:'fehler', text:'Erst den API-Key eintragen und speichern.' });
    setLaeuft(true); setRows(null);
    const from = vonDatum(), to = toMidnight(today.value);
    try {
      setStatus({ art:'', text:'Aktivitäten werden geladen …' });
      const acts = await fetchActivities(key.trim(), isoDayLocal(from), isoDayLocal(to));

      let zonesById = null;
      if(mitZonen){
        const rides = acts.filter(a => anIsRide(a.type) && a.has_heartrate !== false);
        zonesById = {};
        let n = 0;
        for(const a of rides){
          n += 1;
          setStatus({ art:'', text:'Pulszonen ' + n + ' / ' + rides.length + ' …' });
          try {
            const streams = await fetchStreams(key.trim(), a.id, 'heartrate,time');
            const hr = (streams || []).find(s => s.type === 'heartrate');
            const tm = (streams || []).find(s => s.type === 'time');
            if(hr && Array.isArray(hr.data)){
              /* Baender der Woche, in der die Fahrt lag - nicht der aktuellen.
                 Sonst wuerden alte Fahrten mit Zonen bewertet, die es damals
                 nicht gab. */
              const wk = Math.max(weekNumberFor(new Date(a.start_date_local), start), 1);
              zonesById[a.id] = zoneSeconds(hrBands(p, th, wk), hr.data,
                tm && Array.isArray(tm.data) ? tm.data : null,
                a.icu_recording_time || a.elapsed_time || a.moving_time || 0);
            }
          } catch(e){ /* eine fehlende Streamabfrage kippt den Bericht nicht */ }
        }
      }

      const r = anBuildReport(p, th, start, from, to, acts, zonesById, coreLog.value);
      setRows(r);
      setMeta({ count: acts.length, label: from.toLocaleDateString('de-DE') + ' – ' + to.toLocaleDateString('de-DE') });
      setStatus({ art:'ok', text:'Fertig. ' + acts.length + ' Aktivitäten ausgewertet.' });
    } catch(e){
      setStatus({ art:'fehler', text: e.message });
    } finally { setLaeuft(false); }
  }

  const sichtbar = rows ? rows.filter(r => r.acts.length > 0 || r.coreSessions.length > 0 || r.legSessions.length > 0) : [];
  const geplant = rows ? rows.filter(r => r.target.sport === 'ride') : [];
  const sollMin = rows ? rows.reduce((n, r) => n + (r.plannedMinutes || 0), 0) : 0;
  const istMin = rows ? Math.round(rows.reduce((n, r) => n + (r.plannedRideSec || 0), 0) / 60) : 0;
  const optMin = rows ? Math.round(rows.reduce((n, r) => n + (r.optionalRideSec || 0), 0) / 60) : 0;

  return (
    <>
      <h1 class="title">Analyse</h1>

      <div class="card">
        <div class="row"><span>Verbindung</span><b>{apiKey.value ? 'Key gespeichert' : 'nicht verbunden'}</b></div>
        <div class="field"><span style="flex:1">
          <input type="password" placeholder="intervals.icu API-Key" value={key} autocomplete="off"
            autocapitalize="off" spellcheck={false} style="width:100%"
            onInput={e => setKey(e.currentTarget.value)} /></span></div>
        <button class="btn block" style="margin-top:10px" onClick={() => setApiKey(key.trim())}>Key speichern</button>
        <p class="hint">
          Der Key steht auf intervals.icu unter Settings → Developer Settings. Er bleibt auf diesem
          Gerät und geht nur an intervals.icu.
        </p>
      </div>

      <div class="card">
        <div class="field"><span>Zeitraum</span>
          <select value={range} onChange={e => setRange(e.currentTarget.value)}>
            <option value="7">Letzte 7 Tage</option>
            <option value="14">Letzte 14 Tage</option>
            <option value="28">Letzte 4 Wochen</option>
            <option value="all">Ganzer Plan ab Startdatum</option>
          </select></div>
        <div class="field"><span>Pulszonen aus Streams</span>
          <input type="checkbox" checked={mitZonen} onChange={e => setMitZonen(e.currentTarget.checked)} /></div>
        <div class="field"><span>Getauschte Tage: nur Wochensummen</span>
          <input type="checkbox" checked={wochenmodus} onChange={e => setWochenmodus(e.currentTarget.checked)} /></div>
        <button class="btn block" style="margin-top:12px" disabled={laeuft} onClick={laden}>
          {laeuft ? 'Lädt …' : 'Aktivitäten laden & vergleichen'}
        </button>
        {status && <p class={'hint ' + (status.art === 'fehler' ? 'warn' : status.art === 'ok' ? 'good' : '')}>{status.text}</p>}
        <p class="hint">
          Gerechnet wird mit den Bändern der Woche, in der die Fahrt lag – bis zum Test die
          Übergangsbänder, danach Coggan aus der LTHR. Ältere Fahrten werden also neu gerechnet.
        </p>
      </div>

      {rows && (
        <div class="card">
          <div class="row"><span>Zeitraum</span><b>{meta.label}</b></div>
          <div class="chips">
            <div class="chip"><b>{geplant.filter(r => r.status === 'ok').length} / {geplant.length}</b>Radeinheiten wie geplant</div>
            <div class="chip"><b>{geplant.filter(r => r.status === 'miss').length}</b>ausgefallen</div>
            <div class="chip"><b>{istMin} min</b>auf Planeinheiten, geplant {sollMin}</div>
            <div class="chip"><b>{optMin} min</b>optional, getrennt gezählt</div>
          </div>
        </div>
      )}

      {rows && wochenmodus && (
        <div class="card">
          <div class="row"><span>Wochensummen</span><b>Bewertung ohne Wochentage</b></div>
          {anWeekTotals(rows).map(w2 => {
            const ist = Math.round(w2.istSec / 60);
            const diff = w2.sollMin ? Math.round((ist - w2.sollMin) / w2.sollMin * 100) : null;
            return (
              <div class="listrow" key={w2.week}>
                <span>Woche {w2.week}</span>
                <span>{ist} min{w2.sollMin ? ' / ' + w2.sollMin + ' min (' + (diff >= 0 ? '+' : '') + diff + ' %)' : ''}
                  {w2.z2Sec ? ' · Z2 ' + Math.round(w2.z2Sec / 60) + ' min' : ''}
                  {w2.hardSec ? ' · hart ' + Math.round(w2.hardSec / 60) + ' min' : ''}</span>
              </div>
            );
          })}
          <p class="hint">Z2-Summe pro Woche ist die Kennzahl, die zählt – Zielgröße 300–400 min.
            Verschobene Einheiten sind keine Planverstöße.</p>
        </div>
      )}

      {rows && sichtbar.length === 0 && (
        <div class="card"><p class="hint">Im gewählten Zeitraum liegt keine Aufzeichnung vor –
          weder in intervals.icu noch im eigenen Protokoll.</p></div>
      )}

      {sichtbar.slice().reverse().map((row, i) => <TagesZeile row={row} wochenmodus={wochenmodus} key={i} />)}
    </>
  );
}
