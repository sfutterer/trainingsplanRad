/* Analyse in drei Stufen: Liste, Auswertung eines Tages, Verlauf ueber Wochen.

   Vorher rechnete ein Knopf den ganzen Zeitraum durch und lud dabei fuer jede
   Fahrt die Streams nach - bei vier Wochen ein Dutzend Abfragen fuer Zahlen,
   von denen man meist eine sehen wollte. Jetzt kostet die Liste eine Abfrage,
   und die teure Auswertung laeuft erst, wenn man einen Tag antippt.

   Der Tag und nicht die Fahrt ist seit dem 03.09.2026 die Einheit der
   Auswertung. Der Plan macht seine Vorgabe je Tag; wer sie auf zwei Fahrten
   verteilt, weil der Arbeitsweg zweimal anfaellt, bekam sie zweimal gegen
   dasselbe Soll gerechnet - Hinweg "kuerzer", Rueckweg "kuerzer", zusammen
   genau richtig. compareDay nahm immer schon alle Aktivitaeten eines Tages;
   nur bekam es aus dieser Ansicht immer nur eine davon.

   Der Verlauf ist die dritte Stufe und bewusst kein eigener Tab: er beantwortet
   dieselbe Frage wie die Liste, nur ueber Wochen statt ueber Tage, und er lebt
   von genau derselben Abfrage. Ein eigener Tab haette sie ein zweites Mal
   gestellt. Umgeschaltet wird oben, die Liste bleibt der Einstieg.

   Bewusst ohne Timer-, Wake-Lock- oder Sprachabhaengigkeit: der Analyseteil
   ist der einzige, der ohne diese Faehigkeiten funktioniert. */

import { useEffect, useState } from 'preact/hooks';
import { plan, thresholds, startDate, apiKey, coreLog, testLog, interimLog,
         today, varianten } from '../../../state/store.js';
import { fetchActivities } from '../../../data/icu.js';
import { streckenFazit } from '../../../domain/fazit.js';
import { isoDayLocal, toMidnight, WEEKDAY_NAMES } from '../../../domain/week.js';
import { compareDay, weekTotals, buildReport, fmtMin, pct,
         tagesGruppen } from '../../../domain/analysis.js';
import { T } from '../../../domain/texte.js';
import { verlaufBericht } from '../../../domain/verlauf.js';
import { artDerAktivitaet } from '../../../domain/einheiten.js';
import { useTagesauswertung } from './useTagesauswertung.js';
import { zahl } from '../../../domain/zahlen.js';
import { IndikatorKarte, TrendZeile, Verlaufsgraph } from '../../components/Verlaufsgraph.jsx';
import { RouteMap, StreckenLegende } from '../../components/RouteMap.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { zonenFarbe } from '../../components/Zonenliste.jsx';
import { Icon } from '../../components/Icon.jsx';
import { Einheitssymbol, einheitsLabel } from '../../components/Einheitssymbol.jsx';
import { Auswahlfeld } from '../../components/Feld.jsx';
import { Auswertung, Fazit, WetterLeiste } from './Auswertung.jsx';
import { gotoTab } from '../../../state/navigation.js';
import './analyse.css';

/* Einmal statt zweimal: dieselbe Liste stand in der Einheiten- und in der
   Verlaufsansicht woertlich da. */
const ZEITRAEUME = [
  { id: '14',  label: 'Letzte 14 Tage' },
  { id: '28',  label: 'Letzte 4 Wochen' },
  { id: '56',  label: 'Letzte 8 Wochen' },
  { id: 'all', label: 'Ganzer Plan' }
];

const ANSICHTEN = [
  { id: 'liste',   label: 'Einheiten' },
  { id: 'verlauf', label: 'Verlauf' }
];

function ZonenBalken({ z }){
  const p = plan.value;
  if(!z || !z._total) return null;
  return (
    <>
      <div class="zbar">
        {p.zoneKeys.filter(k => (z[k] || 0) / z._total >= 0.01)
          .map(k => <span key={k} style={'width:' + (z[k] / z._total * 100).toFixed(1) + '%;background:' + zonenFarbe(k)}></span>)}
      </div>
      <div class="zleg">
        {p.zoneKeys.filter(k => (z[k] || 0) / z._total >= 0.02)
          .map(k => p.zoneLabel[k] + ' ' + pct(z[k], z._total) + '%').join(' · ')}
      </div>
    </>
  );
}

/* ---------- Liste ---------- */

function eckwerte(acts){
  const min = Math.round(acts.reduce((n, a) => n + (a.moving_time || a.elapsed_time || 0), 0) / 60);
  const km = acts.reduce((n, a) => n + (a.distance || 0), 0) / 1000;
  return min + ' min' + (km >= 0.1 ? ' · ' + km.toFixed(1) + ' km' : '');
}

function Liste({ acts, laedt, fehler, onWaehlen, onNeuLaden, range, setRange }){
  const tage = tagesGruppen(acts);

  return (
    <>
      <div class="card">
        <Auswahlfeld titel="Zeitraum" wert={range} onWert={setRange} optionen={ZEITRAEUME} />
        <button class="btn block" disabled={laedt} onClick={onNeuLaden}>
          {laedt ? 'Lädt …' : 'Aktualisieren'}
        </button>
        {fehler && <div class="meldung fehler"><b>{fehler}</b></div>}
      </div>

      {!laedt && !fehler && acts.length === 0 && (
        <div class="card"><p class="hint">Im gewählten Zeitraum liegt keine Aufzeichnung vor.</p></div>
      )}

      {/* Ein Knopf je Tag und nicht je Aufzeichnung: ausgewertet wird der Tag,
          und ein Knopf, der eine einzelne Fahrt anzutippen verspricht, dann
          aber den ganzen Tag oeffnet, waere eine Luege ueber das Ziel. Die
          Fahrten stehen darin und sind zusammen die Trefferflaeche. */}
      <div class="card liste">
        <div class="trliste">
          {tage.map(({ tag, acts: tagesActs }) => {
            const d = toMidnight(new Date(tag));
            return (
              <button class="trtagknopf" key={tag} onClick={() => onWaehlen(tag)}>
                <span class="trtagkopf">
                  <span class="trtagname">{WEEKDAY_NAMES[d.getDay()]}, {d.toLocaleDateString('de-DE')}</span>
                  <span class="trtagwert">{eckwerte(tagesActs)}</span>
                  <span class="trpfeil"><Icon name="weiter" /></span>
                </span>
                {tagesActs.map(a => {
                  /* Bis hierher gab es zwei Zeichen: Rad und nicht Rad. Die
                     Grundlagenfahrt, der Intervalltag und die lange Ausfahrt
                     sahen damit gleich aus - drei Einheiten, die der Plan
                     auseinanderhaelt. Eingeordnet wird in domain/einheiten.js,
                     benannt wird die Art in der Zeile darunter: ohne den Namen
                     waere die Farbe eine Behauptung, die man erst lernen muss. */
                  const art = artDerAktivitaet(a);
                  const min = Math.round((a.moving_time || a.elapsed_time || 0) / 60);
                  const km = a.distance ? (a.distance / 1000).toFixed(1) + ' km' : null;
                  return (
                    <span class="treintrag" key={a.id}>
                      <Einheitssymbol art={art} klasse="trsym" />
                      <span class="trtext">
                        <span class="trname">{a.name || a.type}</span>
                        <span class="trmeta">
                          {einheitsLabel(art)} · {min} min{km ? ' · ' + km : ''}{a.average_heartrate ? ' · ⌀ ' + a.average_heartrate + ' bpm' : ''}
                        </span>
                      </span>
                    </span>
                  );
                })}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ---------- Auswertung eines Tages ---------- */

/* Eine einzelne Fahrt innerhalb des Tages: Karte, Wetter und Streckenbilanz.

   Je Fahrt eine Karte und nicht eine gemeinsame: zwei Runden in einer Karte
   sind ein Knaeuel, und Hin- und Rueckweg desselben Arbeitswegs laegen
   uebereinander. Die Zahlen des Tages stehen darueber, die dieser Fahrt hier. */
function Fahrtkarte({ f, mehrere }){
  const art = artDerAktivitaet(f.act);
  const min = Math.round((f.act.moving_time || f.act.elapsed_time || 0) / 60);
  return (
    <div class="card">
      <div class="fahrtkopf">
        <Einheitssymbol art={art} klasse="fahrtsym" />
        <span class="fahrtname">{f.act.name || f.act.type}</span>
        <span class="fahrtwert">{min} min · {zahl(f.bilanz ? f.bilanz.km : 0, 1)} km</span>
      </div>
      {/* Die Zonen der einzelnen Fahrt nur, wenn es mehrere gibt - sonst
          stuende derselbe Balken zweimal auf derselben Seite. */}
      {mehrere && <ZonenBalken z={f.zonen} />}
      <WetterLeiste wetter={f.wetter} />
      <RouteMap latlng={f.latlng} gruppen={f.gruppen}
        windAus={f.wetter && f.wetter.richtung} />
      <StreckenLegende bilanz={f.bilanz} laeuft={false} />
    </div>
  );
}

function Tagesanalyse({ tag, acts, onZurueck }){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  /* Das Zusammentragen liegt in useTagesauswertung.js - die Abrufe je Fahrt,
     ihre Reihenfolge und ihre Ausfallbehandlung. Hier bleibt das Zeichnen. */
  const zustand = useTagesauswertung(acts);

  const datum = toMidnight(new Date(tag));
  const logs = coreLog.value.filter(e => e && e.day === tag);
  /* Alle Aufzeichnungen des Tages gegen die Vorgabe des Tages. Genau das war
     der Umbau: vorher stand hier [act], und die Vorgabe wurde je Fahrt einmal
     ganz verlangt. */
  const row = compareDay(p, th, datum, start, acts, zustand.zonenById || null,
    logs.filter(e => e.kind !== 'leg'), logs.filter(e => e.kind === 'leg'),
    varianten.value);

  /* Erst wenn Strecke und Wetter da sind, ist das Fazit mehr als die halbe
     Wahrheit - vorher steht in der Kopfkarte nichts. */
  const fazit = zustand.phase === 'fertig'
    ? streckenFazit(row, zustand.bilanz, zustand.wetter, zustand.verfassung) : null;

  const fahrten = zustand.fahrten || [];
  const gesamtMin = acts.reduce((n, a) => n + (a.moving_time || a.elapsed_time || 0), 0);
  const gesamtKm = acts.reduce((n, a) => n + (a.distance || 0), 0) / 1000;

  return (
    <>
      <div class="detailkopf">
        <button class="zurueck" aria-label="Zurück zur Liste" onClick={onZurueck}>
          <Icon name="zurueck" />
        </button>
        <h2>{WEEKDAY_NAMES[datum.getDay()]}, {datum.toLocaleDateString('de-DE')}</h2>
      </div>

      <div class="card">
        <div class="row"><span>Woche {row.week}</span>
          <b>{acts.length === 1 ? 'eine Aufzeichnung' : acts.length + ' Aufzeichnungen'}</b></div>
        <div class="row"><span>Aufgezeichnet</span>
          <b>{fmtMin(gesamtMin)}{gesamtKm >= 0.1 ? ' · ' + gesamtKm.toFixed(1) + ' km' : ''}</b></div>
        <div class="row"><span>Geplant</span><b>{row.plan.title}</b></div>
        {/* Der Balken zeigt die Zonenzeit des ganzen Tages. compareDay fuehrt
            die Fahrten selbst zusammen und laesst dabei das unzuverlaessigste
            Verfahren gelten - eine Aussage soll nicht besser klingen als ihre
            schlechteste Quelle. */}
        <ZonenBalken z={row.zones} />
        <Fazit fazit={fazit} kompakt />
      </div>

      {/* Was der Tag sonst noch verlangte, steht als Liste daneben: bei zwei
          geplanten Einheiten sagt eine Zeile "Geplant: Rad + Rumpf" nicht,
          welche davon aufgezeichnet wurde. */}
      {row.plan.einheiten && row.plan.einheiten.length > 1 && (
        <div class="card">
          <div class="row"><span>Geplant an diesem Tag</span>
            <b>{row.plan.einheiten.length} Einheiten</b></div>
          {row.plan.einheiten.map((e, i) => (
            <div class="listrow" key={i}>
              <span>{e.titel}{e.zeit ? ' · ' + e.zeit : ''}</span>
              <span>{e.kennzahlen[0] ? e.kennzahlen[0].wert : ''}</span>
            </div>
          ))}
        </div>
      )}

      {zustand.phase === 'laedt' && <div class="card"><p class="hint">Strecke und Wetter werden geladen …</p></div>}

      {fahrten.map(f => <Fahrtkarte f={f} mehrere={fahrten.length > 1} key={f.act.id} />)}

      {zustand.phase === 'fertig' && zustand.untergrundLaeuft && (
        <div class="card"><p class="hint">Der Untergrund wird noch nachgeschlagen …</p></div>
      )}

      {zustand.phase === 'fertig' && (
        <Auswertung bilanz={zustand.bilanz} wetter={zustand.wetter} fazit={fazit} row={row}
          verfassung={zustand.verfassung} fahrten={fahrten.length} />
      )}
    </>
  );
}

/* ---------- Verlauf ueber Wochen ---------- */

function letzterWert(punkte, nk, einheit){
  if(!punkte || !punkte.length) return null;
  return zahl(punkte[punkte.length - 1].v, nk) + (einheit ? ' ' + einheit : '');
}

/* Die Schwellentests bekommen eine eigene Karte statt einer IndikatorKarte:
   FTP in Watt und LTHR in Schlaegen gehoeren nicht auf dieselbe Achse. Sie in
   Prozent gegen den ersten Test umzurechnen waere die Alternative gewesen -
   sie steht schon im Zonen-Tab und beantwortet dort die Frage nach Watt gegen
   Gewicht. Hier zaehlen die absoluten Werte, weil die Zonen daran haengen. */
function TestKarte({ tests }){
  const t = tests;
  const hatWas = t.ftp.punkte.length || t.lthr.punkte.length
    || t.sprechtest.punkte.length || t.rpe.punkte.length;
  if(!hatWas){
    return (
      <div class="card">
        <div class="row"><span>Schwellentests</span><b>noch keiner</b></div>
        <p class="hint">
          Der erste Schwellentest steht in Woche 4 an. Bis dahin gibt es keinen gemessenen
          Anker – im Tab „Zonen“ werden Testergebnis und Sprechtest-Puls eingetragen, danach
          steht hier ihr Verlauf.
        </p>
      </div>
    );
  }
  return (
    <div class="card">
      <div class="row"><span>Schwellentests</span>
        <b>{t.anzahl} {t.anzahl === 1 ? 'Test' : 'Tests'}</b></div>

      {t.ftp.punkte.length > 0 && <>
        <TrendZeile trend={t.ftp.trend} was="FTP" />
        {!t.ftp.trend.belastbar && t.ftp.vergleich &&
          <div class="annote">FTP {t.ftp.vergleich.text} – ein Vergleich zweier Termine, kein Trend.</div>}
        <Verlaufsgraph einheit="W" nachkomma={0}
          reihen={[{ name: 'FTP', farbe: 'var(--z4)', punkte: t.ftp.punkte, trend: t.ftp.trend }]} />
      </>}

      {t.lthr.punkte.length > 0 && <>
        <TrendZeile trend={t.lthr.trend} was="LTHR" />
        <Verlaufsgraph einheit="bpm" nachkomma={0}
          reihen={[{ name: 'LTHR', farbe: 'var(--z5)', punkte: t.lthr.punkte, trend: t.lthr.trend }]} />
      </>}

      {t.sprechtest.punkte.length > 0 && <>
        <div class="vquelle">Zwischenkontrollen · Sprechtest-Puls</div>
        <TrendZeile trend={t.sprechtest.trend} was="Sprechtest-Puls" />
        <Verlaufsgraph einheit="bpm" nachkomma={0}
          reihen={[{ name: 'Sprechtest', farbe: 'var(--z2)', punkte: t.sprechtest.punkte,
                     trend: t.sprechtest.trend }]} />
        <p class="hint">
          Bewusst ohne Urteil: ein steigender Sprechtest-Puls kann heißen, dass die Bänder zu
          eng liegen, und ein fallender kann Müdigkeit sein. Er ist die Gegenprobe zu den
          Zonen, kein Leistungsmaß.
        </p>
      </>}

      {/* Das RPE wurde bis zum 04.09.2026 erhoben, seine Reihe gerechnet - und
          nirgends gezeigt. Der Hinweis unter dem Eingabefeld versprach genau
          diesen Verlauf: das Empfinden als Vergleichsmaßstab für später, wenn
          Wattwerte danebenstehen. Hier steht er. */}
      {t.rpe.punkte.length > 0 && <>
        {/* Eigene Ueberschrift: ohne sie stuende die zweite Kurve unter dem
            Satz zur ersten und saehe aus wie deren Fortsetzung - eine Achse in
            bpm, die andere in RPE-Punkten. */}
        <div class="vquelle">Zwischenkontrollen · RPE</div>
        <TrendZeile trend={t.rpe.trend} was="RPE" />
        <Verlaufsgraph einheit="RPE" nachkomma={1}
          reihen={[{ name: 'RPE', farbe: 'var(--z3)', punkte: t.rpe.punkte,
                     trend: t.rpe.trend }]} />
        <p class="hint">
          Dieselbe Einheit bei sinkendem RPE heißt gewachsene Form – und derselbe RPE bei
          mehr Watt ebenso. Auch das ohne Urteil: ein hoher Wert kann eine harte Einheit
          sein oder ein schlechter Tag, und welches von beidem, sagt erst die Zeile daneben.
        </p>
      </>}

      <p class="hint">{t.regel}</p>
    </div>
  );
}

function Verlaufsansicht({ acts, wochen, verbunden, range, setRange, laedt }){
  const th = thresholds.value, start = startDate.value;
  const b = verlaufBericht({
    acts, thresholds: th, wochen,
    testLog: testLog.value, interimLog: interimLog.value, coreLog: coreLog.value,
    startIso: start ? isoDayLocal(start) : null, verbunden
  });
  const ef = b.effizienz, ent = b.entkopplung, u = b.umfang, z = b.zonen, r = b.rumpf;

  const kern = [ef.trend, ent.trend, b.tests.ftp.trend, u.trend, z.z2Trend];
  const belastbar = kern.filter(x => x && x.belastbar).length;
  const zonenPunkte = z.punkte.filter(p => p.quelle);

  return (
    <>
      <div class="card">
        <div class="row"><span>Leistungsverlauf</span>
          <b>{belastbar} von {kern.length} belastbar</b></div>
        {verbunden && (
          <Auswahlfeld titel="Zeitraum" wert={range} onWert={setRange} optionen={ZEITRAEUME} />
        )}
        <p class="hint">
          {verbunden
            ? 'Quelle sind die Aufzeichnungen von intervals.icu, ergänzt um Testhistorie, ' +
              'Zwischenkontrollen und Rumpfprotokoll dieses Geräts. Je länger der Zeitraum, ' +
              'desto eher trägt eine Aussage – „Ganzer Plan“ liefert die meisten Punkte.'
            : 'Kein Zugang zu intervals.icu hinterlegt. Angezeigt wird, was lokal vorliegt: ' +
              'Testhistorie, Zwischenkontrollen, Rumpfprotokoll und die Sollwerte der Wochen. ' +
              'Effizienzfaktor und Entkopplung brauchen die Aufzeichnungen und bleiben leer.'}
        </p>
        <p class="hint">
          Jede Richtung stammt aus einer Theil-Sen-Steigung, nicht aus dem Vergleich von erstem
          und letztem Wert. Wo zu wenige Punkte oder zu wenige Wochen vorliegen, steht das da –
          statt eines Trends, den die Daten nicht hergeben.
        </p>
        {laedt && <p class="hint">Aktivitäten werden geladen …</p>}
      </div>

      <IndikatorKarte
        titel="Effizienzfaktor"
        wert={letzterWert(ef.punkte, ef.nachkomma, ef.einheit)}
        trend={ef.trend}
        reihen={[{ name: 'EF', farbe: 'var(--z2)', punkte: ef.punkte, trend: ef.trend }]}
        einheit={ef.einheit} nachkomma={ef.nachkomma}
        warnung={ef.hinweis}
        regel={ef.regel + ' ' + ef.bilanz + ' Steigt der Wert über Wochen, wächst die aerobe Basis.'} />

      <IndikatorKarte
        titel="Aerobe Entkopplung"
        wert={letzterWert(ent.punkte, 1, '%')}
        trend={ent.trend}
        reihen={[{ name: 'Pa:Hf', farbe: 'var(--z3)', punkte: ent.punkte, trend: ent.trend }]}
        einheit="%" nachkomma={1}
        hinweis={ent.hinweis}
        regel={ent.regel + ' Sinkende Entkopplung heißt bessere Grundlage.'} />

      <TestKarte tests={b.tests} />

      <IndikatorKarte
        titel="Wochenumfang Soll gegen Ist"
        wert={letzterWert(u.punkte, 0, 'min')}
        trend={u.trend}
        weitere={[{ was: 'Erfüllungsquote', trend: u.quoteTrend }]}
        reihen={[
          { name: 'Ist', farbe: 'var(--primary)', punkte: u.punkte, trend: u.trend },
          { name: 'Soll', farbe: 'var(--outline-2)', punkte: u.sollPunkte }
        ]}
        einheit="min" nachkomma={0}
        hinweis={u.hinweis || (u.konsistenz ? u.konsistenz.text : null)}
        regel={u.regel} />

      <IndikatorKarte
        titel="Zonenverteilung"
        wert={zonenPunkte.length ? zonenPunkte[zonenPunkte.length - 1].zusatz : null}
        trend={z.z2Trend}
        weitere={[{ was: 'Harte Minuten', trend: z.hartTrend },
                  { was: 'Z2-Anteil', trend: z.anteilTrend }]}
        reihen={[
          { name: 'Z2', farbe: 'var(--z2)', punkte: zonenPunkte.map(p => Object.assign({}, p, { v: p.z2Min })), trend: z.z2Trend },
          { name: 'hart', farbe: 'var(--z5)', punkte: zonenPunkte.map(p => Object.assign({}, p, { v: p.hartMin })), trend: z.hartTrend }
        ]}
        einheit="min" nachkomma={0}
        hinweis={z.hinweis}
        regel={z.regel} />

      <IndikatorKarte
        titel="Rumpfeinheiten je Woche"
        wert={r.punkte.length ? r.punkte[r.punkte.length - 1].zusatz : null}
        trend={r.trend}
        reihen={[{ name: 'Rumpf', farbe: 'var(--z1)', punkte: r.punkte, trend: r.trend }]}
        einheit="Einheiten" nachkomma={0}
        regel={r.regel} />
    </>
  );
}

/* ---------- Rahmen ---------- */

export function AnalyseTab(){
  const p = plan.value, th = thresholds.value, start = startDate.value;
  const [ansicht, setAnsicht] = useState('liste');
  const [range, setRange] = useState('28');
  const [acts, setActs] = useState([]);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState(null);
  /* Der gewaehlte Tag als ISO-Datum und nicht die Aktivitaet als Objekt: beim
     Aktualisieren kommen neue Objekte fuer dieselben Aufzeichnungen, und die
     offene Auswertung haette sonst auf einer Fassung gestanden, die es in der
     Liste nicht mehr gibt. */
  const [tag, setTag] = useState(null);
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
      setWochen(weekTotals(buildReport(p, th, start, from, to, a, null,
                                       coreLog.value, varianten.value), p));
    } catch(e){ setFehler(e.message); }
    finally { setLaedt(false); }
  }

  /* Neu laden, wenn der Zeitraum wechselt. laden() steht bewusst nicht in der
     Liste: die Funktion entsteht bei jedem Rendern neu, und mit ihr in der
     Liste liefe die Abfrage in einer Schleife. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if(apiKey.value) laden(); }, [range]);

  const tagesActs = tag
    ? (tagesGruppen(acts).find(g => g.tag === tag) || { acts: [] }).acts : [];
  if(tag && tagesActs.length){
    return <Tagesanalyse tag={tag} acts={tagesActs} onZurueck={() => setTag(null)} />;
  }

  const umschalter = (
    <Segmented ziele={ANSICHTEN} aktiv={ansicht} onWaehlen={setAnsicht}
      klasse="oben" label="Analyseansicht" />
  );

  /* Ohne Aktivitaeten steht der Verlauf trotzdem: die Sollwerte der Wochen
     haengen am Plan, nicht am Zugang. Deshalb hier dieselbe Rechnung wie in
     laden(), nur mit leerer Aktivitaetsliste - sonst waere die Ansicht ohne
     API-Key leer, und das sieht aus wie ein Fehler statt wie ein fehlender
     Zugang. */
  function wochenFuerVerlauf(){
    if(wochen) return wochen;
    if(!p || !start) return [];
    return weekTotals(buildReport(p, th, start, vonDatum(), toMidnight(today.value),
                                  [], null, coreLog.value, varianten.value), p);
  }

  if(ansicht === 'verlauf'){
    return (
      <>
        {umschalter}
        {fehler && <div class="card"><div class="meldung fehler"><b>{fehler}</b></div></div>}
        <Verlaufsansicht acts={acts} wochen={wochenFuerVerlauf()} verbunden={!!apiKey.value}
          range={range} setRange={setRange} laedt={laedt} />
      </>
    );
  }

  if(!apiKey.value){
    return (
      <>
        {umschalter}
        <div class="card">
          <div class="row"><span>Verbindung</span><b>nicht verbunden</b></div>
          <p class="hint">
            Ohne API-Key kann die App keine Aktivitäten laden. Der Schlüssel wird unter
            Einstellungen eingetragen – dort steht auch, wo man ihn findet.
          </p>
          <button class="btn block"
            onClick={() => gotoTab('einstellungen', true)}>Zu den Einstellungen</button>
          <p class="hint">
            Der Verlauf oben zeigt auch ohne Zugang, was lokal vorliegt: Testhistorie,
            Zwischenkontrollen, Rumpfprotokoll und die Sollwerte der Wochen.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {umschalter}
      <Liste acts={acts} laedt={laedt} fehler={fehler} range={range} setRange={setRange}
        onWaehlen={setTag} onNeuLaden={laden} />

      {wochen && wochen.length > 0 && (
        <div class="card">
          <div class="row"><span>Wochensummen</span><b>ohne Wochentage</b></div>
          {wochen.map(w => {
            const ist = Math.round(w.istSec / 60);
            const diff = w.sollMin ? Math.round((ist - w.sollMin) / w.sollMin * 100) : null;
            return (
              <div class="listrow" key={w.week}>
                <span>Woche {w.week}{w.ueberDeckel ? ' · über dem Deckel' : ''}</span>
                <span>{ist} min{w.sollMin ? ' / ' + w.sollMin + ' min (' + (diff >= 0 ? '+' : '') + diff + ' %)' : ''}</span>
              </div>
            );
          })}
          {/* Der Deckel ist seit Fassung 3 die erste Absicherung und ersetzt
              die Ramp-Rate. Er steht nur da, wo er etwas aussagt: bei einer
              vollstaendig erfassten Woche. Eine halbe Woche kann ihn nicht
              ueberschreiten, nur unterbieten. */}
          {wochen.filter(w => w.ueberDeckel).map(w => (
            <p class="hint warn" key={'d' + w.week}>
              Woche {w.week}: {T.deckelUeberschritten(Math.round(w.istSec / 60), w.planMin, w.capMin)}
            </p>
          ))}
          <p class="hint">Z2-Summe pro Woche ist die Kennzahl, die zählt – Zielgröße 300–400 min.</p>
          <p class="hint">{p.texts.volumeCap}</p>
        </div>
      )}
    </>
  );
}
