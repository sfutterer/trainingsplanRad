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
import { isoDayLocal, toMidnight, WEEKDAY_NAMES } from '../../../domain/week.js';
import { exportAll, importAll, exportFilename } from '../../../data/exportImport.js';
import { downloadJson, requestPersistentStorage } from '../../../platform/index.js';
import { probeCapabilities } from '../../../data/icu.js';
import { PLAN_SCHEMA_VERSION } from '../../../data/planSource.js';
import { Gruppe, Zeile, Schalter } from '../../components/SettingsList.jsx';

function datei(onText){
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'application/json,.json';
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = () => onText(String(r.result), f.name);
    r.readAsText(f);
  };
  inp.click();
}

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
  const s = settings.value;
  const eigen = planSource.value === 'override';
  const sd = startDate.value;
  const sdPasst = sd.getDay() === 6;

  /* --- Plan --- */
  function planImportieren(){
    datei(async (text, name) => {
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
    datei(async (text, name) => {
      let json;
      try { json = JSON.parse(text); }
      catch(e){ return setMeldung({ art:'fehler', titel:'Die Datei ist kein gültiges JSON.', zeilen:[] }); }
      if(!confirm('Sicherung einspielen? Alle jetzigen Daten auf diesem Gerät werden überschrieben.')) return;
      try {
        const k = await importAll(store.store, json);
        setMeldung({ art:'ok', titel:'Eingespielt: ' + k.length + ' Einträge aus ' + name, zeilen:['Die App lädt jetzt neu.'] });
        setTimeout(() => location.reload(), 900);
      } catch(e){ setMeldung({ art:'fehler', titel: e.message, zeilen:[] }); }
    });
  }

  async function appZuruecksetzen(){
    if(!confirm('Zwischenspeicher der App leeren und neu laden? Deine Trainingsdaten bleiben erhalten.')) return;
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
        <div class={'meldung ' + meldung.art} style="margin:8px 16px 16px">
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
          <div class="segmented" style="flex:1;margin:0">
            {THEMES.map(t => (
              <button key={t.id} class={'segbtn' + ((s.theme || 'system') === t.id ? ' an' : '')}
                onClick={() => setSettings({ theme: t.id })}>{t.label}</button>
            ))}
          </div>
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
          onClick={() => {
            const v = prompt('Startdatum (JJJJ-MM-TT)', isoDayLocal(sd));
            if(v && /^\d{4}-\d{2}-\d{2}$/.test(v)) setStartDate(new Date(v));
          }} />
        {!sdPasst && (
          <div class="szeile-eingabe">
            <button class="btn block" onClick={() => setStartDate(new Date(PLAN_START_DEFAULT))}>
              Auf {new Date(PLAN_START_DEFAULT).toLocaleDateString('de-DE')} setzen (Samstag)
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
            if(!confirm('Eigenen Plan verwerfen und wieder den Default aus dem Repo verwenden?')) return;
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
        <Zeile titel="App zurücksetzen" wert="Zwischenspeicher leeren und neu laden"
          hilfe={<p>Für den Fall, dass nach einem Update etwas hängt. Trainingsdaten werden nicht angefasst.</p>}
          onClick={appZuruecksetzen} />
      </Gruppe>
    </>
  );
}

/* Beantwortet zwei Fragen, die in keiner Dokumentation stehen: kommt der
   latlng-Stream ueber die API durch, und stehen Wetterfelder an der Aktivitaet?
   Beides entscheidet, ob Karte und Windauswertung ohne Abo funktionieren. */
function DiagnoseZeile(){
  const [offen, setOffen] = useState(false);
  const [id, setId] = useState('');
  const [erg, setErg] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const key = apiKey.value;

  async function pruefen(){
    setLaeuft(true); setErg(null);
    try { setErg(await probeCapabilities(key, id.trim())); }
    finally { setLaeuft(false); }
  }

  return (
    <>
      <Zeile titel="Verfügbare Daten prüfen"
        wert={key ? 'welche Streams und Wetterfelder dein Konto liefert' : 'erst den intervals.icu-Schlüssel eintragen'}
        disabled={!key}
        onClick={() => setOffen(o => !o)} />
      {offen && (
        <>
          <div class="szeile-eingabe">
            <input type="text" placeholder="Aktivitäts-ID, z. B. i12345678" value={id}
              onInput={e => setId(e.currentTarget.value)} />
            <button class="btn" disabled={!id.trim() || laeuft} onClick={pruefen}>
              {laeuft ? 'Prüft …' : 'Prüfen'}
            </button>
          </div>
          {erg && (
            <div class="shilfe">
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
            </div>
          )}
        </>
      )}
    </>
  );
}
