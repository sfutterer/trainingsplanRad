/* Analyse in zwei Schritten: erst die Liste, dann die Auswertung.

   Vorher rechnete ein Knopf den ganzen Zeitraum durch und lud dabei fuer jede
   Fahrt die Streams nach - bei vier Wochen ein Dutzend Abfragen fuer Zahlen,
   von denen man meist eine sehen wollte. Jetzt kostet die Liste eine Abfrage,
   und die teure Auswertung laeuft erst, wenn man eine Fahrt antippt.

   Bewusst ohne Timer-, Wake-Lock- oder Sprachabhaengigkeit: der Analyseteil
   ist der einzige, der ohne diese Faehigkeiten funktioniert. */

import { useEffect, useState } from 'preact/hooks';
import { plan, thresholds, startDate, apiKey, coreLog, today, store } from '../../../state/store.js';
import { fetchActivities, fetchStreams, spurMitHoehe, fetchWellness } from '../../../data/icu.js';
import { ladeWetter, stundenIndex, windZurZeit } from '../../../data/wetter.js';
import { ladeWege, untergrundCode, untergrundAusCode } from '../../../data/osm.js';
import { baueAbschnitte, zeichenGruppen, streckenBilanz, untergrundAn,
         setzeUntergrund } from '../../../domain/strecke.js';
import { streckenFazit } from '../../../domain/fazit.js';
import { melde } from '../../../state/snackbar.js';
import { zoneSeconds, hrBands } from '../../../domain/zones.js';
import { isoDayLocal, toMidnight, weekNumberFor, WEEKDAY_NAMES } from '../../../domain/week.js';
import { anCompareDay, anWeekTotals, anBuildReport, anFmtMin, anPct, anIsRide,
         verfassungAus } from '../../../domain/analysis.js';
import { RouteMap, StreckenLegende } from '../../components/RouteMap.jsx';
import { Auswertung, Fazit, WetterLeiste, ein } from './Auswertung.jsx';
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

/* Mehr Punkte braucht weder die Auswertung noch die Karte: bei 2000 Punkten
   liegen auf einem 150-m-Abschnitt noch ein Dutzend Messwerte, und die Linie
   sieht aus wie die Aufzeichnung. */
const MAX_PUNKTE = 2000;

function duenne(spur, max){
  const grenze = max || MAX_PUNKTE;
  if(spur.length <= grenze) return spur;
  const schritt = Math.ceil(spur.length / grenze);
  const raus = spur.filter((_, i) => i % schritt === 0);
  if(raus[raus.length - 1] !== spur[spur.length - 1]) raus.push(spur[spur.length - 1]);
  return raus;
}

/* Zwei Abrufe, die nichts voneinander wissen - also nebeneinander. Faellt einer
   aus, laeuft die Auswertung mit dem anderen weiter: ohne Wetter fehlt der
   Wind, ohne Overpass der Untergrund, und beides steht dann auch so da. */
function sicher(p){
  return p.then(v => ({ wert: v }), e => ({ fehler: e.message }));
}

function Detail({ act, onZurueck }){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const [zustand, setZustand] = useState({ phase: 'laedt' });

  useEffect(() => {
    let weg = false;
    setZustand({ phase: 'laedt' });

    (async () => {
      const key = apiKey.value;
      /* Was ausgefallen ist, kommt am Ende der schnellen Runde als eine
         Meldung - nicht drei hintereinander, von denen nur die letzte zu
         sehen waere. */
      const fehlt = [];

      /* Laeuft neben den Streams, nicht dahinter: die Verfassung am Fahrtag
         haengt an nichts, was die Aufzeichnung liefert. */
      const tagIso = isoDayLocal(toMidnight(new Date(act.start_date_local)));
      const wellVon = toMidnight(new Date(tagIso));
      wellVon.setDate(wellVon.getDate() - 8);
      const wellness = sicher(fetchWellness(key, isoDayLocal(wellVon), tagIso));
      const verfassungAus_ = wl => {
        if(wl.wert) return verfassungAus(wl.wert, tagIso);
        fehlt.push('Wellness (' + wl.fehler + ')');
        return null;
      };

      if(!anIsRide(act.type)){
        const wl = await wellness;
        if(weg) return;
        const verfassung = verfassungAus_(wl);
        if(fehlt.length) melde('Nicht abrufbar: ' + fehlt.join(' · '));
        setZustand({ phase: 'fertig', verfassung });
        return;
      }

      /* Ohne die Streams gibt es nichts zu zeichnen - aber die Kopfkarte mit
         Plan und Dauer steht trotzdem. Deshalb Meldung statt Fehlerseite. */
      let streams = null;
      try {
        streams = await fetchStreams(key, act.id, 'heartrate,time,latlng,altitude');
      } catch(e){
        if(weg) return;
        const wl = await wellness;
        melde('Streams nicht abrufbar: ' + e.message);
        setZustand({ phase: 'fertig', verfassung: wl.wert ? verfassungAus(wl.wert, tagIso) : null });
        return;
      }
      if(weg) return;

      const hol = t => (streams || []).find(s => s.type === t);
      const hr = hol('heartrate'), tm = hol('time');
      let zonen = null;
      if(hr && Array.isArray(hr.data)){
        const wk = Math.max(weekNumberFor(new Date(act.start_date_local), start), 1);
        zonen = zoneSeconds(hrBands(p, th, wk), hr.data,
          tm && Array.isArray(tm.data) ? tm.data : null,
          act.icu_recording_time || act.elapsed_time || act.moving_time || 0);
      }

      /* Die Form des latlng-Streams liegt nicht fest - das Umrechnen auf
         Paare steckt deshalb in icu.js, wo auch die Diagnose es nutzt. */
      const spur = duenne(spurMitHoehe(streams));
      if(spur.length < 2){
        const wl = await wellness;
        if(weg) return;
        melde('Kein GPS-Stream zu dieser Fahrt – unter Einstellungen → Diagnose steht, was das Konto liefert.', 9000);
        setZustand({ phase: 'fertig', zonen, verfassung: verfassungAus_(wl) });
        return;
      }
      const latlng = spur.map(x => x.ll);

      /* Die beiden schnellen Abrufe zusammen, der langsame danach: Wetter und
         Wellness antworten in Millisekunden, Overpass braucht Sekunden. Auf den
         wartet die Karte nicht. */
      const mitte = spur[Math.floor(spur.length / 2)].ll;
      const [w, wl] = await Promise.all([
        sicher(ladeWetter(mitte[0], mitte[1], act.start_date_local)),
        wellness
      ]);
      if(weg) return;
      const verfassung = verfassungAus_(wl);

      let wetter = null, wind = null;
      if(w.wert){
        const i = stundenIndex(w.wert, act.start_date_local);
        wetter = {
          temp: w.wert.temperature_2m[i], gefuehlt: w.wert.apparent_temperature[i],
          wind: w.wert.wind_speed_10m[i], boe: w.wert.wind_gusts_10m[i],
          richtung: w.wert.wind_direction_10m[i], regen: w.wert.precipitation[i],
          feuchte: w.wert.relative_humidity_2m[i]
        };
        wind = sek => windZurZeit(w.wert, act.start_date_local, sek);
      } else {
        fehlt.push('Wetter (' + w.fehler + ')');
      }
      if(fehlt.length) melde('Nicht abrufbar: ' + fehlt.join(' · '));

      let abschnitte = baueAbschnitte(spur, { wind });
      setZustand({
        phase: 'fertig', zonen, latlng, wetter, verfassung,
        gruppen: zeichenGruppen(abschnitte), bilanz: streckenBilanz(abschnitte),
        untergrundLaeuft: true
      });

      /* Untergrund zuletzt, und beim zweiten Ansehen aus dem Zwischenspeicher:
         dieselbe Fahrt hat morgen denselben Schotter. */
      const merker = await store.untergrund();
      const schluessel = act.id + ':' + abschnitte.length;
      let quelle = merker[schluessel] ? untergrundAusCode(merker[schluessel]) : null;

      if(!quelle){
        const o = await sicher(ladeWege(latlng));
        if(weg) return;
        if(o.wert){
          quelle = ll => untergrundAn(ll, o.wert);
        } else {
          melde('Untergrund nicht abrufbar: ' + o.fehler);
          setZustand(z => Object.assign({}, z, { untergrundLaeuft: false }));
          return;
        }
      }

      abschnitte = setzeUntergrund(abschnitte, quelle);
      if(weg) return;
      setZustand(z => Object.assign({}, z, {
        gruppen: zeichenGruppen(abschnitte), bilanz: streckenBilanz(abschnitte),
        untergrundLaeuft: false
      }));

      if(!merker[schluessel]){
        merker[schluessel] = untergrundCode(abschnitte);
        store.setUntergrund(merker);
      }
    })();

    return () => { weg = true; };
  }, [act.id]);

  const datum = toMidnight(new Date(act.start_date_local));
  const zonesById = zustand.zonen ? { [act.id]: zustand.zonen } : null;
  const logs = coreLog.value.filter(e => e && e.day === isoDayLocal(datum));
  const row = anCompareDay(p, th, datum, start, [act], zonesById,
    logs.filter(e => e.kind !== 'leg'), logs.filter(e => e.kind === 'leg'));
  /* Erst wenn Strecke und Wetter da sind, ist das Fazit mehr als die halbe
     Wahrheit - vorher steht in der Kopfkarte nichts. */
  const fazit = zustand.phase === 'fertig'
    ? streckenFazit(row, zustand.bilanz, zustand.wetter, zustand.verfassung) : null;

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
        <Fazit fazit={fazit} kompakt />
      </div>

      {zustand.phase === 'laedt' && <div class="card"><p class="hint">Strecke und Wetter werden geladen …</p></div>}

      {zustand.phase === 'fertig' && zustand.latlng && (
        <div class="card">
          <div class="row"><span>Strecke</span>
            <b>{ein(zustand.bilanz ? zustand.bilanz.km : 0)} km</b></div>
          <WetterLeiste wetter={zustand.wetter} />
          <RouteMap latlng={zustand.latlng} gruppen={zustand.gruppen}
            windAus={zustand.wetter && zustand.wetter.richtung} />
          <StreckenLegende bilanz={zustand.bilanz} laeuft={zustand.untergrundLaeuft} />
        </div>
      )}

      {zustand.phase === 'fertig' && (
        <Auswertung bilanz={zustand.bilanz} wetter={zustand.wetter} fazit={fazit} row={row}
          verfassung={zustand.verfassung} />
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
