/* Analyse in zwei Schritten: erst die Liste, dann die Auswertung.

   Vorher rechnete ein Knopf den ganzen Zeitraum durch und lud dabei fuer jede
   Fahrt die Streams nach - bei vier Wochen ein Dutzend Abfragen fuer Zahlen,
   von denen man meist eine sehen wollte. Jetzt kostet die Liste eine Abfrage,
   und die teure Auswertung laeuft erst, wenn man eine Fahrt antippt.

   Bewusst ohne Timer-, Wake-Lock- oder Sprachabhaengigkeit: der Analyseteil
   ist der einzige, der ohne diese Faehigkeiten funktioniert. */

import { useEffect, useState } from 'preact/hooks';
import { plan, thresholds, startDate, apiKey, coreLog, today } from '../../../state/store.js';
import { fetchActivities, fetchStreams } from '../../../data/icu.js';
import { ladeWetter, stundenIndex, windBilanz, richtungKurz } from '../../../data/wetter.js';
import { zoneSeconds, hrBands } from '../../../domain/zones.js';
import { isoDayLocal, toMidnight, weekNumberFor, WEEKDAY_NAMES } from '../../../domain/week.js';
import { anCompareDay, anWeekTotals, anBuildReport, anFmtMin, anPct, anIsRide } from '../../../domain/analysis.js';
import { RouteMap } from '../../components/RouteMap.jsx';
import { gotoTab } from '../../../App.jsx';
import './analyse.css';

const SYMBOL = {
  ride: 'M15.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm5.8-10 2.4-2.4.8.8a5.9 5.9 0 0 0 3.9 1.6V8.8a4.3 4.3 0 0 1-2.8-1.2l-1.9-1.9a1.9 1.9 0 0 0-2.7 0L7.7 8.2a1.9 1.9 0 0 0 0 2.7L10.5 14v5H12v-6.2l-1.2-2.3zM19 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
  kraft: 'M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z'
};

function ZonenBalken({ z }){
  const p = plan.value;
  if(!z || !z._total) return null;
  return (
    <>
      <div class="zbar">
        {p.zoneKeys.filter(k => (z[k] || 0) / z._total >= 0.01)
          .map(k => <span key={k} style={'width:' + (z[k] / z._total * 100).toFixed(1) + '%;background:' + p.zoneColor[k]}></span>)}
      </div>
      <div class="zleg">
        {p.zoneKeys.filter(k => (z[k] || 0) / z._total >= 0.02)
          .map(k => p.zoneLabel[k] + ' ' + anPct(z[k], z._total) + '%').join(' · ')}
      </div>
    </>
  );
}

/* ---------- Liste ---------- */

function Liste({ acts, laedt, fehler, onWaehlen, onNeuLaden, range, setRange }){
  const gruppen = {};
  for(const a of acts){
    const tag = String(a.start_date_local).slice(0, 10);
    (gruppen[tag] = gruppen[tag] || []).push(a);
  }
  const tage = Object.keys(gruppen).sort().reverse();

  return (
    <>
      <div class="card">
        <div class="field"><span>Zeitraum</span>
          <select value={range} onChange={e => setRange(e.currentTarget.value)}>
            <option value="14">Letzte 14 Tage</option>
            <option value="28">Letzte 4 Wochen</option>
            <option value="56">Letzte 8 Wochen</option>
            <option value="all">Ganzer Plan</option>
          </select></div>
        <button class="btn block" style="margin-top:12px" disabled={laedt} onClick={onNeuLaden}>
          {laedt ? 'Lädt …' : 'Aktualisieren'}
        </button>
        {fehler && <div class="meldung fehler"><b>{fehler}</b></div>}
      </div>

      {!laedt && !fehler && acts.length === 0 && (
        <div class="card"><p class="hint">Im gewählten Zeitraum liegt keine Aufzeichnung vor.</p></div>
      )}

      <div class="card" style="padding:4px 0">
        <div class="trliste">
          {tage.map(tag => {
            const d = toMidnight(new Date(tag));
            return (
              <div key={tag}>
                <div class="trtag">{WEEKDAY_NAMES[d.getDay()]}, {d.toLocaleDateString('de-DE')}</div>
                {gruppen[tag].map(a => {
                  const rad = anIsRide(a.type);
                  const min = Math.round((a.moving_time || a.elapsed_time || 0) / 60);
                  const km = a.distance ? (a.distance / 1000).toFixed(1) + ' km' : null;
                  return (
                    <button class="treintrag" key={a.id} onClick={() => onWaehlen(a)}>
                      <span class="trsymbol">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d={rad ? SYMBOL.ride : SYMBOL.kraft} /></svg>
                      </span>
                      <span class="trtext">
                        <span class="trname">{a.name || a.type}</span>
                        <span class="trmeta">
                          {min} min{km ? ' · ' + km : ''}{a.average_heartrate ? ' · ⌀ ' + a.average_heartrate + ' bpm' : ''}
                        </span>
                      </span>
                      <span class="trpfeil">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M9.29 6.71 13.17 10.6 9.29 14.5l1.42 1.41L16 10.6 10.71 5.3z" /></svg>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ---------- Auswertung einer Fahrt ---------- */

function Detail({ act, onZurueck }){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const [zustand, setZustand] = useState({ phase: 'laedt' });

  useEffect(() => {
    let weg = false;
    (async () => {
      const key = apiKey.value;
      const erg = { zonen: null, latlng: null, wetter: null, wind: null, hinweise: [] };
      try {
        const rad = anIsRide(act.type);
        if(rad){
          const streams = await fetchStreams(key, act.id, 'heartrate,time,latlng,altitude');
          const hol = t => (streams || []).find(s => s.type === t);
          const hr = hol('heartrate'), tm = hol('time'), ll = hol('latlng');

          if(hr && Array.isArray(hr.data)){
            const wk = Math.max(weekNumberFor(new Date(act.start_date_local), start), 1);
            erg.zonen = zoneSeconds(hrBands(p, th, wk), hr.data,
              tm && Array.isArray(tm.data) ? tm.data : null,
              act.icu_recording_time || act.elapsed_time || act.moving_time || 0);
          }

          if(ll && Array.isArray(ll.data) && ll.data.length > 1){
            /* Auf hoechstens 1200 Punkte ausduennen: die Linie sieht identisch
               aus, die Karte bleibt fluessig. */
            const roh = ll.data.filter(pt => Array.isArray(pt) && pt.length === 2 && pt[0] != null);
            const schritt = Math.max(1, Math.floor(roh.length / 1200));
            erg.latlng = roh.filter((_, i) => i % schritt === 0);
          } else {
            erg.hinweise.push('Kein GPS-Stream zu dieser Fahrt. Entweder ohne Aufzeichnung gefahren, oder das Konto liefert latlng nicht über die API.');
          }

          if(erg.latlng && erg.latlng.length > 1){
            try {
              const mitte = erg.latlng[Math.floor(erg.latlng.length / 2)];
              const h = await ladeWetter(mitte[0], mitte[1], act.start_date_local);
              const i = stundenIndex(h, act.start_date_local);
              erg.wetter = {
                temp: h.temperature_2m[i], gefuehlt: h.apparent_temperature[i],
                wind: h.wind_speed_10m[i], boe: h.wind_gusts_10m[i],
                richtung: h.wind_direction_10m[i], regen: h.precipitation[i],
                feuchte: h.relative_humidity_2m[i]
              };
              erg.wind = windBilanz(erg.latlng, h, i);
            } catch(e){ erg.hinweise.push('Wetterdaten nicht abrufbar: ' + e.message); }
          }
        }
        if(weg) return;
        setZustand({ phase: 'fertig', ...erg });
      } catch(e){
        if(!weg) setZustand({ phase: 'fehler', text: e.message });
      }
    })();
    return () => { weg = true; };
  }, [act.id]);

  const datum = toMidnight(new Date(act.start_date_local));
  const zonesById = zustand.zonen ? { [act.id]: zustand.zonen } : null;
  const logs = coreLog.value.filter(e => e && e.day === isoDayLocal(datum));
  const row = anCompareDay(p, th, datum, start, [act], zonesById,
    logs.filter(e => e.kind !== 'leg'), logs.filter(e => e.kind === 'leg'));

  return (
    <>
      <div class="detailkopf">
        <button class="zurueck" aria-label="Zurück zur Liste" onClick={onZurueck}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" /></svg>
        </button>
        <h2>{act.name || act.type}</h2>
      </div>

      <div class="card">
        <div class="row"><span>{WEEKDAY_NAMES[datum.getDay()]}, {datum.toLocaleDateString('de-DE')}</span>
          <b>Woche {row.week}</b></div>
        <div class="row"><span>Aufgezeichnet</span>
          <b>{anFmtMin(act.moving_time || act.elapsed_time || 0)}
            {act.distance ? ' · ' + (act.distance / 1000).toFixed(1) + ' km' : ''}
            {act.average_heartrate ? ' · ⌀ ' + act.average_heartrate + ' bpm' : ''}</b></div>
        <div class="row"><span>Geplant</span><b>{row.plan.title}</b></div>
        <ZonenBalken z={zustand.zonen} />
        {row.notes.map((n, i) => <div class={'annote ' + (n.kind || '')} key={i}>{n.text}</div>)}
      </div>

      {zustand.phase === 'laedt' && <div class="card"><p class="hint">Streckendaten und Wetter werden geladen …</p></div>}
      {zustand.phase === 'fehler' && <div class="card"><div class="meldung fehler"><b>{zustand.text}</b></div></div>}

      {zustand.phase === 'fertig' && (
        <>
          <div class="card">
            <div class="row"><span>Strecke</span>
              <b>{zustand.latlng ? zustand.latlng.length + ' Punkte' : 'keine GPS-Daten'}</b></div>
            <RouteMap latlng={zustand.latlng} windAus={zustand.wetter && zustand.wetter.richtung} />
          </div>

          {zustand.wetter && (
            <div class="card">
              <div class="row"><span>Wetter zur Startzeit</span><b>Open-Meteo</b></div>
              <div class="wetterraster">
                <div class="wetterfeld"><b>{Math.round(zustand.wetter.temp)} °C</b>
                  <span>gefühlt {Math.round(zustand.wetter.gefuehlt)} °C</span></div>
                <div class="wetterfeld"><b>{Math.round(zustand.wetter.wind)} km/h</b>
                  <span>aus {richtungKurz(zustand.wetter.richtung)}, Böen {Math.round(zustand.wetter.boe)}</span></div>
                <div class="wetterfeld"><b>{zustand.wetter.regen.toFixed(1)} mm</b><span>Niederschlag</span></div>
                <div class="wetterfeld"><b>{Math.round(zustand.wetter.feuchte)} %</b><span>Luftfeuchte</span></div>
              </div>

              {zustand.wind && (
                <>
                  <div class="row" style="margin-top:14px"><span>Wind zur Fahrtrichtung</span>
                    <b>{zustand.wind.gegenProzent} % gegen</b></div>
                  <div class="zbar">
                    <span style={'width:' + zustand.wind.gegenProzent + '%;background:var(--z5)'}></span>
                    <span style={'width:' + zustand.wind.querProzent + '%;background:var(--z3)'}></span>
                    <span style={'width:' + zustand.wind.rueckProzent + '%;background:var(--z2)'}></span>
                  </div>
                  <div class="zleg">
                    Gegen {zustand.wind.gegenProzent} % · quer {zustand.wind.querProzent} % ·
                    Rücken {zustand.wind.rueckProzent} % · {zustand.wind.streckeKm.toFixed(1)} km gewertet
                  </div>
                  <p class="hint">
                    Anteil der gefahrenen Strecke je Windlage, aus Fahrtrichtung und Windrichtung
                    abschnittsweise gerechnet. Ein hoher Gegenwindanteil erklärt einen Puls, der
                    über der Geschwindigkeit liegt – und einen Drift, der sonst nach Ermüdung aussieht.
                  </p>
                </>
              )}
            </div>
          )}

          {zustand.hinweise.map((h, i) => (
            <div class="card" key={i}><p class="hint">{h}</p></div>
          ))}
        </>
      )}
    </>
  );
}

/* ---------- Rahmen ---------- */

export function AnalyseTab(){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const [range, setRange] = useState('28');
  const [acts, setActs] = useState([]);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [gewaehlt, setGewaehlt] = useState(null);
  const [wochen, setWochen] = useState(null);

  function vonDatum(){
    const to = toMidnight(today.value);
    if(range === 'all' && start) return toMidnight(start);
    const d = new Date(to);
    d.setDate(d.getDate() - (parseInt(range, 10) - 1));
    return d;
  }

  async function laden(){
    const key = apiKey.value;
    if(!key){ setFehler('Kein API-Key hinterlegt. Einzutragen unter Einstellungen → Zugänge.'); return; }
    setLaedt(true); setFehler(null);
    try {
      const from = vonDatum(), to = toMidnight(today.value);
      const a = await fetchActivities(key, isoDayLocal(from), isoDayLocal(to));
      a.sort((x, y) => (x.start_date_local < y.start_date_local ? 1 : -1));
      setActs(a);
      /* Wochensummen ohne Streams - eine Abfrage, kein Nachladen. */
      setWochen(anWeekTotals(anBuildReport(p, th, start, from, to, a, null, coreLog.value)));
    } catch(e){ setFehler(e.message); }
    finally { setLaedt(false); }
  }

  useEffect(() => { if(apiKey.value) laden(); }, [range]);

  if(!apiKey.value){
    return (
      <div class="card">
        <div class="row"><span>Verbindung</span><b>nicht verbunden</b></div>
        <p class="hint" style="margin-top:6px">
          Ohne API-Key kann die App keine Aktivitäten laden. Der Schlüssel wird unter
          Einstellungen eingetragen – dort steht auch, wo man ihn findet.
        </p>
        <button class="btn block" style="margin-top:12px"
          onClick={() => gotoTab('einstellungen', true)}>Zu den Einstellungen</button>
      </div>
    );
  }

  if(gewaehlt) return <Detail act={gewaehlt} onZurueck={() => setGewaehlt(null)} />;

  return (
    <>
      <Liste acts={acts} laedt={laedt} fehler={fehler} range={range} setRange={setRange}
        onWaehlen={setGewaehlt} onNeuLaden={laden} />

      {wochen && wochen.length > 0 && (
        <div class="card">
          <div class="row"><span>Wochensummen</span><b>ohne Wochentage</b></div>
          {wochen.map(w => {
            const ist = Math.round(w.istSec / 60);
            const diff = w.sollMin ? Math.round((ist - w.sollMin) / w.sollMin * 100) : null;
            return (
              <div class="listrow" key={w.week}>
                <span>Woche {w.week}</span>
                <span>{ist} min{w.sollMin ? ' / ' + w.sollMin + ' min (' + (diff >= 0 ? '+' : '') + diff + ' %)' : ''}</span>
              </div>
            );
          })}
          <p class="hint">Z2-Summe pro Woche ist die Kennzahl, die zählt – Zielgröße 300–400 min.</p>
        </div>
      )}
    </>
  );
}
