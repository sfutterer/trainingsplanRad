/* Ein Messwert: anlegen, ändern, löschen.

   Die eine Stelle, an der FTP, LTHR und HFmax in die App kommen. Bis zum
   31.10.2026 waren es zwei, und sie hatten nichts miteinander zu tun: im
   Testbereich ein Formular, das aus Ø-Watt und Ø-Puls die beiden Werte
   rechnete und Kadenz, RPE, Gewicht und Bedingungen mitschrieb, unter Zonen
   drei Zahlenfelder, die dieselben Werte einfach überschrieben. Dieselbe
   Größe auf zwei Wegen erfasst, von denen einer alles mitnimmt und der andere
   nichts - und keiner von beiden sagte, seit wann der Wert gilt.

   Jetzt ein Formular mit zwei Arten. Die Entscheidung oben ist keine
   Spielart, sondern die Frage, was der Wert ist:

     Schwellentest       gemessen, unter dem Protokoll des Plans. Eingegeben
                         werden Ø-Watt und Ø-Puls der zwanzig Minuten, die
                         FTP fällt daraus (× 0,95), die LTHR ist der Puls.
                         Kadenz, RPE, Gewicht und Bedingungen gehören dazu -
                         ohne sie sind zwei Tests nicht vergleichbar.
     Direkt eingetragen  eine Zahl von woanders: die eFTP von intervals.icu,
                         eine Korrektur, eine HFmax - die misst kein
                         Schwellentest.

   Das Datum ist das erste Feld und nicht das letzte. Es entscheidet, welcher
   Wert gilt (der jüngste), und es ist beim Nachtragen fast nie heute. Es
   steht vorbelegt auf dem letzten Testtermin, der nicht in der Zukunft liegt.

   „Aus der Aufzeichnung holen" nimmt dem Abtippen die Arbeit ab: die Fahrt
   dieses Tages bei intervals.icu, darin das stärkste 20-Minuten-Fenster, und
   das Gewicht aus der Wellness. Ohne Schlüssel bleibt der Knopf tot - das
   Eintippen ist kein Notbehelf, sondern der Regelweg für alle ohne Konto. */

import { useState } from 'preact/hooks';
import { plan, apiKey, startDate, saveMesswert, deleteMesswert } from '../../state/store.js';
import { bestaetige } from '../../state/dialog.js';
import { ART_TEST, ART_HAND, messwertId } from '../../domain/messwerte.js';
import { testWerte, baueTestEintrag, bestesFenster, laengsteFahrt,
         AUSBELASTET_RPE, FTP_FAKTOR } from '../../domain/test.js';
import { isRide } from '../../domain/analysis.js';
import { fetchActivities, fetchStreams, fetchGewicht, zahlenStrom } from '../../data/icu.js';
import { weekNumberFor, dayFromIso, datumText, isoDayLocal, toMidnight } from '../../domain/week.js';
import { zahl } from '../../domain/zahlen.js';
import { Sheet } from './Sheet.jsx';
import { Segmented } from './Segmented.jsx';
import { Zahlenfeld, Textfeld, Datumsfeld } from './Feld.jsx';

const ARTEN = [
  { id: ART_TEST, label: 'Schwellentest' },
  { id: ART_HAND, label: 'Direkt eingetragen' }
];

/* Die zwanzig Minuten des Schwellentests - die Fensterbreite, nach der in der
   Aufzeichnung gesucht wird. Sie steht in plan.json am Testablauf; hier liegt
   nur der Rückfall, falls die Datei den Schritt einmal anders benennt. */
const TESTFENSTER_SEK = 20 * 60;

function testdauerSekunden(p){
  const steps = (p.thresholdTest && p.thresholdTest.steps) || [];
  const haupt = steps.filter(s => s.type === 'work')
    .sort((a, b) => (b.minutes || 0) - (a.minutes || 0))[0];
  return haupt && haupt.minutes > 0 ? haupt.minutes * 60 : TESTFENSTER_SEK;
}

function ausEintrag(e, vorgabe){
  if(!e){
    return { day: vorgabe.day, art: vorgabe.art || ART_TEST,
             w20:null, hr20:null, kadenz:null, rpe:null, kg:null, bed:'',
             ftp:null, lthr:null, hrmax:null, note:'' };
  }
  return {
    day: e.day, art: e.art,
    w20: e.w20 ?? null,
    /* Eintraege von vor dem 10.09.2026 kennen hr20 nicht - dort ist die LTHR
       der Ø-Puls. */
    hr20: e.hr20 ?? e.lthr ?? null,
    kadenz: e.kadenz ?? null, rpe: e.rpe ?? null,
    kg: e.weight ?? null, bed: e.conditions || '',
    ftp: e.ftp ?? null, lthr: e.lthr ?? null, hrmax: e.hrmax ?? null,
    note: e.note || ''
  };
}

export function Messwertsheet({ eintrag, vorgabe, onClose }){
  const p = plan.value;
  const [f, setF] = useState(() => ausEintrag(eintrag, vorgabe || {}));
  const [meldung, setMeldung] = useState(null);
  const [laedt, setLaedt] = useState(false);

  const setze = patch => setF(x => ({ ...x, ...patch }));
  const istTest = f.art === ART_TEST;
  const werte = testWerte({ w20:f.w20, hr20:f.hr20, kadenz:f.kadenz, rpe:f.rpe, gewicht:f.kg });

  /* Gerechnet beim Test, getippt beim Direkteintrag - angezeigt wird in
     beiden Fällen dasselbe: was dieser Eintrag an Werten trägt. */
  const zeigeFtp  = istTest ? werte.ftp  : f.ftp;
  const zeigeLthr = istTest ? werte.lthr : f.lthr;

  const bereit = !!f.day && (istTest
    ? (werte.ftp != null || werte.lthr != null)
    : (f.ftp > 0 || f.lthr > 0 || f.hrmax > 0));

  async function holen(){
    const key = apiKey.value;
    if(!key || !f.day) return;
    setLaedt(true);
    setMeldung(null);
    try {
      const fahrt = laengsteFahrt(await fetchActivities(key, f.day, f.day), isRide);
      if(!fahrt) throw new Error('Für den ' + datumText(dayFromIso(f.day)) +
        ' liegt keine Radaufzeichnung vor.');
      const streams = await fetchStreams(key, fahrt.id, 'watts,heartrate,cadence,time');
      const fenster = bestesFenster({
        watts:  zahlenStrom(streams, 'watts'),
        puls:   zahlenStrom(streams, 'heartrate'),
        kadenz: zahlenStrom(streams, 'cadence'),
        zeit:   zahlenStrom(streams, 'time'),
        sekunden: testdauerSekunden(p)
      });
      const kg = await fetchGewicht(key, f.day).catch(() => null);
      if(!fenster && !kg) throw new Error('„' + (fahrt.name || fahrt.type) +
        '" enthält keine Leistungsdaten.');
      setze({
        ...(fenster ? { w20: fenster.watt, hr20: fenster.puls ?? f.hr20,
                        kadenz: fenster.kadenz ?? f.kadenz } : {}),
        ...(kg ? { kg } : {})
      });
      setMeldung({ art:'ok', text: fenster
        ? 'Stärkste ' + Math.round(fenster.fensterSekunden / 60) + ' Minuten aus „'
          + (fahrt.name || fahrt.type) + '" übernommen' + (kg ? ', dazu das Gewicht.' : '.')
          + ' Bitte gegen die Aufzeichnung prüfen – gesucht wurde das stärkste Fenster,'
          + ' nicht der markierte Testabschnitt.'
        : 'Gewicht übernommen; Leistungsdaten enthält die Fahrt nicht.' });
    } catch(e){
      setMeldung({ art:'fehler', text: e.message });
    } finally {
      setLaedt(false);
    }
  }

  async function speichern(){
    if(!bereit) return;
    const woche = weekNumberFor(dayFromIso(f.day), startDate.value);
    const neu = istTest
      ? baueTestEintrag({ tagIso: f.day, week: woche, werte,
                          ftp: werte.ftp, lthr: werte.lthr, bedingungen: f.bed, plan: p })
      : { day: f.day, week: woche, art: ART_HAND,
          ftp: f.ftp, lthr: f.lthr, hrmax: f.hrmax, note: f.note.trim() };

    /* Wandert ein Eintrag auf einen anderen Tag oder wechselt die Art, ändert
       sich sein Schlüssel - der alte muss weg, sonst steht er doppelt da. */
    const neueId = messwertId(f.day, f.art);
    if(eintrag && eintrag.id !== neueId) await deleteMesswert(eintrag.id);
    await saveMesswert({ ...neu, art: f.art });
    onClose();
  }

  async function loeschen(){
    if(!eintrag) return;
    const ja = await bestaetige({
      titel: 'Messwert löschen?',
      text: datumText(dayFromIso(eintrag.day)) + ' – '
        + (eintrag.art === ART_TEST ? 'Schwellentest' : 'eingetragener Wert')
        + '. Danach gilt wieder, was davor galt.',
      jaLabel: 'Löschen', gefahr: true
    });
    if(!ja) return;
    await deleteMesswert(eintrag.id);
    onClose();
  }

  const heute = isoDayLocal(toMidnight(new Date()));

  return (
    <Sheet onClose={onClose} labelledBy="messwert-titel">
      <h3 id="messwert-titel">{eintrag ? 'Messwert ändern' : 'Neuer Messwert'}</h3>

      {/* Erst wann, dann was: das Datum entscheidet, welcher Wert gilt. */}
      <Datumsfeld titel="Datum" wert={f.day} max={heute} onWert={v => setze({ day: v })} />
      <Segmented ziele={ARTEN} aktiv={f.art} rolle="radio" label="Art des Messwerts"
        onWaehlen={id => setze({ art: id })} />

      <div class="ergebnis">
        <div class="ergwert"><b>{zeigeFtp != null ? zeigeFtp + ' W' : '–'}</b><span>FTP</span></div>
        <div class="ergwert"><b>{zeigeLthr != null ? zeigeLthr + ' bpm' : '–'}</b><span>LTHR</span></div>
        {istTest
          ? <div class="ergwert"><b>{werte.wkg != null ? zahl(werte.wkg, 2) : '–'}</b><span>W/kg</span></div>
          : <div class="ergwert"><b>{f.hrmax > 0 ? f.hrmax + ' bpm' : '–'}</b><span>HFmax</span></div>}
      </div>

      {istTest ? (
        <>
          <button class="btn block secondary" type="button" disabled={!apiKey.value || !f.day || laedt}
            onClick={holen}>{laedt ? 'Wird gesucht …' : 'Aus der Aufzeichnung holen'}</button>
          <Zahlenfeld titel="Ø-Watt der 20 min" wert={f.w20} min={1}
            onWert={v => setze({ w20: v })} />
          <Zahlenfeld titel="Ø-Puls der 20 min (bpm)" wert={f.hr20} min={1}
            onWert={v => setze({ hr20: v })} />
          <Zahlenfeld titel="Ø-Kadenz der 20 min (U/min)" wert={f.kadenz} min={1}
            onWert={v => setze({ kadenz: v })} />
          {/* Das einzige Feld, das etwas über die Güte des Messwerts sagt. */}
          <Zahlenfeld titel="RPE der letzten 5 min (1–10)" wert={f.rpe} min={1} max={10}
            onWert={v => setze({ rpe: v })} />
          <Zahlenfeld titel="Gewicht (kg)" wert={f.kg} min={1} dezimal schritt="0.1"
            onWert={v => setze({ kg: v })} />
          <Textfeld titel="Bedingungen" wert={f.bed} onWert={v => setze({ bed: v })}
            platzhalter="Temperatur, Wind, Strecke, Rad" />
          {werte.ausbelastet === false && (
            <p class="hint warn">
              RPE unter {AUSBELASTET_RPE}: nicht ausbelastet, die FTP fällt dann eher zu niedrig aus.
            </p>
          )}
          <p class="hint">
            FTP = Ø-Watt × {String(FTP_FAKTOR).replace('.', ',')}, LTHR = Ø-Puls der 20 min.
          </p>
        </>
      ) : (
        <>
          <Zahlenfeld titel="FTP (W)" wert={f.ftp} min={1} onWert={v => setze({ ftp: v })} />
          <Zahlenfeld titel="LTHR (bpm)" wert={f.lthr} min={1} onWert={v => setze({ lthr: v })} />
          <Zahlenfeld titel="HFmax (bpm)" wert={f.hrmax} min={1} onWert={v => setze({ hrmax: v })} />
          <Textfeld titel="Woher" wert={f.note} onWert={v => setze({ note: v })}
            platzhalter="eFTP, Garmin, Korrektur" />
          <p class="hint">
            Nur ausfüllen, was sich ändert. Leere Felder behalten den geltenden Wert.
          </p>
        </>
      )}

      {meldung && <div class={'meldung ' + meldung.art}><b>{meldung.text}</b></div>}

      <div class="buttons">
        <button class="btn" disabled={!bereit} onClick={speichern}>
          {eintrag ? 'Ändern' : 'Speichern'}</button>
        <button class="btn secondary" onClick={onClose}>Abbrechen</button>
      </div>
      {eintrag && (
        <button class="btn block secondary gefahr" type="button" onClick={loeschen}>
          Messwert löschen
        </button>
      )}
    </Sheet>
  );
}
