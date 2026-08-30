/* Einstellungen im Listenstil.

   Gruppen mit Ueberschrift, eine Zeile je Sache, der aktuelle Wert unter dem
   Titel. Erklaerungen liegen hinter dem Fragezeichen, statt jede Zeile mit
   einem Absatz zu begleiten - beim zehnten Mal liest den niemand mehr, aber
   er verdreifacht die Seitenlaenge. */

import { useState } from 'preact/hooks';
import { plan, planJson, planSource, settings, setSettings, apiKey, setApiKey,
         mapKey, setMapKey, startDate, setStartDate, store, applyPlanOverride,
         resetPlanToDefault, coreLog, testLog, interimLog, PLAN_START_DEFAULT } from '../../../state/store.js';
import { THEMES } from '../../../state/theme.js';
import { isoDayLocal, toMidnight, dayFromIso, WEEKDAY_NAMES } from '../../../domain/week.js';
import { exportAll, importAll, exportFilename, benenne } from '../../../data/exportImport.js';
import { downloadJson, waehleDatei, requestPersistentStorage } from '../../../platform/index.js';
import { bestaetige } from '../../../state/dialog.js';
import { probeCapabilities, probeWellness } from '../../../data/icu.js';
import { KARTENSTILE, KARTENSTIL_DEFAULT, kartenstil } from '../../../state/kartenstile.js';
import { PLAN_SCHEMA_VERSION } from '../../../data/planSource.js';
import { Gruppe, Zeile, Schalter } from '../../components/SettingsList.jsx';
import { Segmented } from '../../components/Segmented.jsx';

/* Ein Schluesselfeld klappt unter seiner Zeile auf. Kein eigener Bildschirm:
   man traegt ihn genau einmal ein. */
function SchluesselZeile({ titel, wert, platzhalter, hilfe, onSave }){
  const [offen, setOffen] = useState(false);
  const [text, setText] = useState(wert || '');
  return (
    <>
      <Zeile titel={titel}
        wert={wert ? '••••••••' + wert.slice(-4) : 'nicht hinterlegt'}
        hilfe={hilfe}
        onClick={() => { setText(wert || ''); setOffen(o => !o); }} />
      {offen && (
        <div class="szeile-eingabe">
          <input type="password" placeholder={platzhalter} value={text} autocomplete="off"
            autocapitalize="off" spellcheck={false}
            onInput={e => setText(e.currentTarget.value)} />
          <button class="btn" onClick={() => { onSave(text.trim()); setOffen(false); }}>Sichern</button>
          {wert && <button class="btn secondary" onClick={() => { onSave(''); setText(''); setOffen(false); }}>Löschen</button>}
        </div>
      )}
    </>
  );
}

const HILFE_ICU = (
  <>
    <p>Ohne diesen Schlüssel kann die App keine Aktivitäten laden – die Analyse bleibt leer.</p>
    <ol>
      <li>Auf <a href="https://intervals.icu" target="_blank" rel="noreferrer">intervals.icu</a> anmelden.</li>
      <li>Oben rechts aufs Profilbild, dann <b>Settings</b>.</li>
      <li>Ganz unten der Abschnitt <b>Developer Settings</b>.</li>
      <li><b>API Key</b> kopieren und hier einsetzen.</li>
    </ol>
    <p>Der Schlüssel bleibt auf diesem Gerät und wird ausschließlich an intervals.icu geschickt.</p>
  </>
);

const HILFE_KARTE = (
  <>
    <p>Für die Streckenkarte in der Analyse. Ohne Schlüssel zeigt die App OpenStreetMap –
       das funktioniert, hat aber keine Radwege hervorgehoben.</p>
    <ol>
      <li>Bei <a href="https://www.thunderforest.com/pricing/" target="_blank" rel="noreferrer">thunderforest.com</a> ein Konto anlegen – der <b>Hobby Project</b>-Tarif ist kostenlos.</li>
      <li>Nach der Anmeldung im <b>Dashboard</b> steht der <b>API Key</b>.</li>
      <li>Hier einsetzen. Danach zeigt die Analyse OpenCycleMap mit Radwegen und Höhenlinien.</li>
    </ol>
    <p>Kostenlos bis 150.000 Kacheln im Monat – für einen einzelnen Nutzer weit mehr als nötig.</p>
    <p>Der Anbieter sieht dabei, welche Kartenausschnitte du abrufst, also grob, wo du fährst.</p>
  </>
);

export function EinstellungenTab(){
  const [meldung, setMeldung] = useState(null);
  const [datumOffen, setDatumOffen] = useState(false);
  const s = settings.value;
  const eigen = planSource.value === 'override';
  const sd = startDate.value;
  const sdPasst = sd.getDay() === 6;

  /* --- Plan --- */
  function planImportieren(){
    waehleDatei(async (text, name) => {
      let json;
      try { json = JSON.parse(text); }
      catch(e){ return setMeldung({ art:'fehler', titel:'Die Datei ist kein gültiges JSON.', zeilen:[String(e.message)] }); }
      try {
        await applyPlanOverride(json);
        setMeldung({ art:'ok', titel:'Plan übernommen: ' + name, zeilen:[] });
      } catch(e){
        setMeldung({ art:'fehler', titel: e.titel || 'Der Plan ist nicht verwendbar.',
                     zeilen: (e.zeilen || [e.message]).concat(['Der bisherige Plan läuft unverändert weiter.']) });
      }
    });
  }

  /* --- Sicherung --- */
  async function sichern(){
    downloadJson(exportFilename(new Date()), await exportAll(store.store));
    setMeldung({ art:'ok', titel:'Sicherung heruntergeladen.', zeilen:[] });
  }
  function zurueckspielen(){
    waehleDatei(async (text, name) => {
      let json;
      try { json = JSON.parse(text); }
      catch(e){ return setMeldung({ art:'fehler', titel:'Die Datei ist kein gültiges JSON.', zeilen:[] }); }
      const ja = await bestaetige({
        titel: 'Sicherung einspielen?',
        text: 'Alle jetzigen Daten auf diesem Gerät werden überschrieben – Trainingsprotokolle, '
            + 'Testhistorie, Erhebungen, Zugänge und der Plan. Was in der Datei fehlt, wird gelöscht.',
        jaLabel: 'Einspielen', gefahr: true
      });
      if(!ja) return;
      try {
        const r = await importAll(store.store, json);
        const zeilen = [];
        if(r.geraeumt.length) zeilen.push('Geleert, weil nicht in der Sicherung: ' + r.geraeumt.map(benenne).join(', ') + '.');
        zeilen.push('Die App lädt jetzt neu.');
        setMeldung({ art:'ok', titel:'Eingespielt: ' + r.uebernommen.length + ' Einträge aus ' + name, zeilen });
        setTimeout(() => location.reload(), 900);
      } catch(e){ setMeldung({ art:'fehler', titel: e.titel || e.message, zeilen: e.zeilen || [] }); }
    });
  }

  async function appZuruecksetzen(){
    const ja = await bestaetige({
      titel: 'Zwischenspeicher leeren?',
      text: 'Die App lädt danach neu. Deine Trainingsdaten bleiben erhalten – geleert wird nur, '
          + 'was der Browser zwischengespeichert hat.',
      jaLabel: 'Leeren und neu laden'
    });
    if(!ja) return;
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch(e){}
    location.reload();
  }

  return (
    <>
      {meldung && (
        <div class={'meldung frei ' + meldung.art}>
          <b>{meldung.titel}</b>
          {meldung.zeilen.length > 0 && <ul>{meldung.zeilen.map((z, i) => <li key={i}>{z}</li>)}</ul>}
        </div>
      )}

      <Gruppe titel="Zugänge">
        <SchluesselZeile titel="intervals.icu" wert={apiKey.value} platzhalter="API-Key"
          hilfe={HILFE_ICU} onSave={setApiKey} />
        <SchluesselZeile titel="Kartenkacheln (Thunderforest)" wert={mapKey.value} platzhalter="API-Key"
          hilfe={HILFE_KARTE} onSave={setMapKey} />
      </Gruppe>

      <Gruppe titel="Darstellung">
        <Zeile titel="Erscheinungsbild"
          wert={THEMES.find(t => t.id === (s.theme || 'system'))?.label}
          hilfe={<p>„System“ folgt der Android-Einstellung und wechselt mit ihr. Hell und Dunkel bleiben fest.</p>} />
        {/* Unter der Zeile statt daneben: drei Beschriftungen passen neben
            einem Titel nicht auf einen Handybildschirm. */}
        <div class="szeile-eingabe">
          <Segmented ziele={THEMES} aktiv={s.theme || 'system'} rolle="radio"
            label="Erscheinungsbild" onWaehlen={id => setSettings({ theme: id })} />
        </div>
        <Zeile titel="Kartenstil"
          wert={mapKey.value
            ? kartenstil(s.mapStyle || KARTENSTIL_DEFAULT).hinweis
            : 'OpenStreetMap – erst den Thunderforest-Schlüssel eintragen'}
          disabled={!mapKey.value}
          hilfe={
            <>
              <p><b>Ruhig</b> (Atlas) zeigt Straßen und Orte. <b>Rad</b> ist die OpenCycleMap:
                 dieselbe Karte plus Radroutennetz und Höhenlinien – gut zum Planen, aber so
                 voll, dass die eigene Spur darin untergeht. <b>Gelände</b> (Landscape) betont
                 Höhen und Bewuchs.</p>
              <p>Ohne Schlüssel zeichnet die App OpenStreetMap, unabhängig von dieser Wahl.</p>
            </>
          } />
        <div class="szeile-eingabe">
          <Segmented rolle="radio" label="Kartenstil"
            ziele={KARTENSTILE.map(k => ({ ...k, disabled: !mapKey.value }))}
            aktiv={s.mapStyle || KARTENSTIL_DEFAULT}
            onWaehlen={id => setSettings({ mapStyle: id })} />
        </div>
      </Gruppe>

      <Gruppe titel="Training">
        <Zeile titel="Beginn Woche 1"
          wert={sd.toLocaleDateString('de-DE') + ' · ' + WEEKDAY_NAMES[sd.getDay()] + (sdPasst ? '' : ' — verschiebt den Samstag')}
          hilfe={
            <>
              <p>Aus dem Startdatum ergibt sich jede Wochennummer und damit jede Vorgabe.</p>
              <p>Die Trainingswoche beginnt <b>samstags</b>. Liegt der Start auf einem anderen Tag,
                 zählt jeder Samstag zur vorherigen Woche – die lange Ausfahrt bekommt dann
                 durchgehend die Dauer der Vorwoche, und man sieht es nirgends.</p>
            </>
          }
          onClick={() => setDatumOffen(o => !o)} />
        {/* Ein Datumsfeld statt prompt(): der Systemdialog liess sich nur
            abtippen, pruefte nichts, und ein Tippfehler fiel still durch die
            Regex. Der Kalender des Geraets kann kein ungueltiges Datum
            liefern - die Pruefung entfaellt damit ersatzlos. */}
        {datumOffen && (
          <div class="szeile-eingabe">
            <input type="date" value={isoDayLocal(sd)} aria-label="Beginn der ersten Trainingswoche"
              onChange={e => {
                const v = e.currentTarget.value;
                if(v) setStartDate(dayFromIso(v));
              }} />
            <button class="btn secondary" onClick={() => setDatumOffen(false)}>Fertig</button>
          </div>
        )}
        {!sdPasst && (
          <div class="szeile-eingabe">
            <button class="btn block" onClick={() => setStartDate(dayFromIso(PLAN_START_DEFAULT))}>
              Auf {dayFromIso(PLAN_START_DEFAULT).toLocaleDateString('de-DE')} setzen (Samstag)
            </button>
          </div>
        )}
        <Schalter titel="Sprachansage" an={s.voice} onChange={v => setSettings({ voice: v })}
          wert={s.voice ? 'an' : 'aus'}
          hilfe={<p>Sagt Übung, Wiederholungsziel und Phasenwechsel an. Das Handy darf dafür nicht stumm sein.</p>} />
        <Schalter titel="Bildschirm anlassen" an={s.keepAwake} onChange={v => setSettings({ keepAwake: v })}
          wert={s.keepAwake ? 'an' : 'aus'}
          hilfe={<p>Hält den Bildschirm während einer laufenden Einheit wach. Ohne das sperrt Android mitten im Satz.</p>} />
        <Schalter titel="Übungsbild im Timer" an={s.showIllu} onChange={v => setSettings({ showIllu: v })}
          wert={s.showIllu ? 'an' : 'aus'} />
      </Gruppe>

      <Gruppe titel="Trainingsplan">
        <Zeile titel="Aktiver Plan"
          wert={(eigen ? 'eigener Plan' : 'Default aus dem Repo') + ' · ' + plan.value.weekCount + ' Wochen · Fassung ' + PLAN_SCHEMA_VERSION}
          hilfe={
            <>
              <p>Der Plan im Repo ist der Default. Ein importierter Plan wird auf dem Gerät gespeichert
                 und gilt ab sofort.</p>
              <p>Beim Import wird geprüft: passt etwas nicht, bleibt der laufende Plan stehen und die
                 Meldung nennt das beanstandete Feld.</p>
            </>
          } />
        <Zeile titel="Plan exportieren" wert="als plan.json sichern"
          onClick={() => downloadJson('plan.json', planJson.value)} />
        <Zeile titel="Plan importieren" wert="eigene plan.json einspielen" onClick={planImportieren} />
        {eigen && <Zeile titel="Auf Default zurücksetzen" wert="eigenen Plan verwerfen"
          onClick={async () => {
            const ja = await bestaetige({
              titel: 'Eigenen Plan verwerfen?',
              text: 'Danach gilt wieder der Plan aus dem Repo. Deine Trainingsdaten bleiben erhalten.',
              jaLabel: 'Verwerfen', gefahr: true
            });
            if(!ja) return;
            await resetPlanToDefault();
            setMeldung({ art:'ok', titel:'Wieder auf dem Default aus dem Repo.', zeilen:[] });
          }} />}
      </Gruppe>

      <Gruppe titel="Daten">
        <Zeile titel="Sicherung herunterladen"
          wert={coreLog.value.length + ' Protokolle · ' + testLog.value.length + ' Tests · ' + interimLog.value.length + ' Erhebungen'}
          hilfe={
            <>
              <p>Trainingsprotokolle, Testhistorie, Erhebungen, Schwellenwerte und Startdatum liegen
                 nur im Speicher dieses einen Browserprofils.</p>
              <p>Ein „Browserdaten löschen“, ein Gerätewechsel oder ein Neuinstallieren der App – und
                 sie sind weg. Diese Datei ist die einzige Kopie, die es gibt.</p>
            </>
          }
          onClick={sichern} />
        <Zeile titel="Sicherung einspielen" wert="überschreibt alle Daten auf diesem Gerät"
          onClick={zurueckspielen} />
        <Zeile titel="Speicher dauerhaft anfordern" wert="schützt vor automatischem Aufräumen"
          hilfe={<p>Bittet den Browser, die Daten bei Platzmangel nicht zu löschen. Kein Ersatz für die Sicherung.</p>}
          onClick={() => requestPersistentStorage().then(ok =>
            setMeldung({ art: ok ? 'ok' : 'fehler',
              titel: ok ? 'Der Browser hält die Daten jetzt dauerhaft.' : 'Der Browser hat das abgelehnt – die Sicherung bleibt wichtig.', zeilen:[] }))} />
      </Gruppe>

      <Gruppe titel="Diagnose">
        <DiagnoseZeile />
        <WellnessZeile />
        <Zeile titel="App zurücksetzen" wert="Zwischenspeicher leeren und neu laden"
          hilfe={<p>Für den Fall, dass nach einem Update etwas hängt. Trainingsdaten werden nicht angefasst.</p>}
          onClick={appZuruecksetzen} />
      </Gruppe>
    </>
  );
}

/* Beide Diagnosezeilen haben dasselbe Geruest: eine Zeile, die aufklappt, ein
   Knopf, der eine Abfrage startet, und darunter das Ergebnis. Sie standen
   zweimal ausgeschrieben da und unterschieden sich in genau zwei Dingen -
   welche Abfrage laeuft und wie ihr Ergebnis aussieht. Also zwei
   Steckplaetze und kein zweites Geruest.

   Der Ladezustand gehoert dazu: ohne ihn druecken Ungeduldige zweimal, und
   Overpass wie intervals.icu antworten dann zweimal auf dieselbe Frage. */
function PruefZeile({ titel, wert, hilfe, knopf, bereit = true, pruefe, zeige, kinder }){
  const [offen, setOffen] = useState(false);
  const [erg, setErg] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const key = apiKey.value;

  async function starten(){
    setLaeuft(true); setErg(null);
    try { setErg(await pruefe()); }
    finally { setLaeuft(false); }
  }

  return (
    <>
      <Zeile titel={titel}
        wert={key ? wert : 'erst den intervals.icu-Schlüssel eintragen'}
        hilfe={hilfe} disabled={!key}
        onClick={() => setOffen(o => !o)} />
      {offen && (
        <>
          {kinder}
          <div class="szeile-eingabe">
            <button class="btn block" disabled={laeuft || !bereit} onClick={starten}>
              {laeuft ? 'Prüft …' : knopf}
            </button>
          </div>
          {erg && <div class="shilfe">{zeige(erg)}</div>}
        </>
      )}
    </>
  );
}

/* Welche Felder befuellt die verknuepfte Uhr tatsaechlich? Ruhepuls, HRV und
   Schlaf entscheiden ueber das Gate, Gewicht ueber den Abnehmhinweis - fehlt
   eins davon, bleibt die Ampel stumm, und ohne diese Zeile sieht man nicht,
   woran es liegt. Braucht keine Aktivitaets-ID. */
function WellnessZeile(){
  const bis = toMidnight(new Date());
  const von = new Date(bis); von.setDate(von.getDate() - 20);

  return (
    <PruefZeile
      titel="Wellness-Felder prüfen"
      wert="was deine Uhr an Ruhepuls, HRV, Schlaf und Gewicht liefert"
      knopf="Letzte 21 Tage prüfen"
      pruefe={() => probeWellness(apiKey.value, isoDayLocal(von), isoDayLocal(bis))}
      zeige={erg => (
        <>
          <p><b>{erg.tage} Tage mit Datensatz</b>{erg.neueste ? ', neuester ' + erg.neueste : ''}</p>
          <ul>
            {erg.felder.length === 0
              ? <li>kein Feld befüllt – dann bleibt das Wellness-Gate stumm</li>
              : erg.felder.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
          <p>Für die Ampel zählen <b>restingHR</b>, <b>hrv</b> und <b>sleepSecs</b>,
             für den Gewichtstrend <b>weight</b>. Alles andere liefert intervals.icu
             nur mit, es wird nicht ausgewertet.</p>
          {erg.error && <p>{erg.error}</p>}
        </>
      )} />
  );
}

/* Beantwortet zwei Fragen, die in keiner Dokumentation stehen: kommt der
   latlng-Stream ueber die API durch, und stehen Wetterfelder an der Aktivitaet?
   Beides entscheidet, ob Karte und Windauswertung ohne Abo funktionieren. */
function DiagnoseZeile(){
  const [id, setId] = useState('');

  return (
    <PruefZeile
      titel="Verfügbare Daten prüfen"
      wert="welche Streams und Wetterfelder dein Konto liefert"
      knopf="Prüfen"
      bereit={!!id.trim()}
      pruefe={() => probeCapabilities(apiKey.value, id.trim())}
      kinder={
        <div class="szeile-eingabe">
          <input type="text" placeholder="Aktivitäts-ID, z. B. i12345678" value={id}
            aria-label="Aktivitäts-ID" onInput={e => setId(e.currentTarget.value)} />
        </div>
      }
      zeige={erg => (
        <>
          <p><b>Streams</b></p>
          <ul>
            {Object.keys(erg.streams).length === 0
              ? <li>keiner zurückgekommen</li>
              : Object.entries(erg.streams).map(([k, n]) => <li key={k}>{k}: {n} Messwerte</li>)}
          </ul>
          <p><b>Spur</b></p>
          <ul>
            <li>{erg.spur == null ? 'nicht geprüft' : erg.spur + ' auswertbare Punkte'}</li>
            {erg.spurForm && <li>{erg.spurForm}</li>}
          </ul>
          <p><b>Wetterfelder an der Aktivität</b></p>
          <ul>
            {erg.weatherFields.length === 0
              ? <li>keine – vermutlich Supporter-Funktion oder nicht befüllt</li>
              : erg.weatherFields.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
          {erg.error && <p>{erg.error}</p>}
        </>
      )} />
  );
}
