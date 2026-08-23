/* Alles, was eingestellt wird: Zugaenge, Darstellung, Planbeginn, der Plan
   selbst, Sicherung und Diagnose.

   Zusammengezogen an einen Ort, weil verstreute Einstellungen genau dann nicht
   gefunden werden, wenn man sie braucht. Der wichtigste Knopf hier ist die
   Sicherung: core-session-log und interim-log existieren nur in diesem einen
   Browserprofil. Kein Backend heisst auch: keine andere Kopie. */

import { useState } from 'preact/hooks';
import { plan, planJson, planSource, settings, setSettings, apiKey, setApiKey,
         startDate, setStartDate, store, applyPlanOverride, resetPlanToDefault,
         coreLog, testLog, interimLog, PLAN_START_DEFAULT } from '../../../state/store.js';
import { THEMES } from '../../../state/theme.js';
import { isoDayLocal, toMidnight, WEEKDAY_NAMES } from '../../../domain/week.js';
import { exportAll, importAll, exportFilename } from '../../../data/exportImport.js';
import { downloadJson, requestPersistentStorage } from '../../../platform/index.js';
import { probeCapabilities } from '../../../data/icu.js';
import { PLAN_SCHEMA_VERSION } from '../../../data/planSource.js';

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


/* ---- Zugaenge ----
   Der Schluessel bleibt auf dem Geraet und geht nur an intervals.icu. Weitere
   Dienste bekommen hier eigene Zeilen - die Karte ist dafuer angelegt. */
function ZugangsKarte(){
  const [key, setKey] = useState(apiKey.value);
  const [gespeichert, setGespeichert] = useState(false);
  const geaendert = key.trim() !== apiKey.value;

  async function speichern(){
    await setApiKey(key.trim());
    setGespeichert(true);
    setTimeout(() => setGespeichert(false), 2500);
  }

  return (
    <div class="card">
      <div class="row"><span>intervals.icu</span>
        <b>{apiKey.value ? 'verbunden' : 'kein Schlüssel'}</b></div>
      <div class="field"><span style="flex:1">
        <input type="password" placeholder="API-Key" value={key} autocomplete="off"
          autocapitalize="off" spellcheck={false} style="width:100%"
          onInput={e => setKey(e.currentTarget.value)} /></span></div>
      <div class="buttons" style="margin-top:10px">
        <button class="btn" disabled={!geaendert} onClick={speichern}>Speichern</button>
        {apiKey.value && <button class="btn secondary" onClick={() => { setKey(''); setApiKey(''); }}>Entfernen</button>}
      </div>
      {gespeichert && <div class="meldung ok"><b>Schlüssel gespeichert.</b></div>}
      <p class="hint">
        Zu finden auf intervals.icu unter Settings → Developer Settings. Er wird nur hier auf dem
        Gerät abgelegt und ausschließlich an intervals.icu geschickt.
      </p>
    </div>
  );
}

/* ---- Darstellung ---- */
function DarstellungsKarte(){
  const aktuell = settings.value.theme || 'system';
  return (
    <div class="card">
      <div class="row"><span>Erscheinungsbild</span>
        <b>{THEMES.find(t => t.id === aktuell)?.label}</b></div>
      <div class="segmented" role="group" aria-label="Erscheinungsbild">
        {THEMES.map(t => (
          <button key={t.id} class={'segbtn' + (aktuell === t.id ? ' an' : '')}
            aria-pressed={aktuell === t.id ? 'true' : 'false'}
            onClick={() => setSettings({ theme: t.id })}>{t.label}</button>
        ))}
      </div>
      <p class="hint">
        „System“ folgt der Android-Einstellung und wechselt mit ihr – auch mitten in einer Einheit,
        wenn dein Gerät nachts automatisch umschaltet. Hell und Dunkel bleiben fest.
      </p>
    </div>
  );
}

/* ---- Planbeginn ----
   Die Trainingswoche beginnt samstags. Liegt der Startpunkt auf einem anderen
   Wochentag, rutscht jeder Samstag in die vorherige Woche - und damit bekommt
   die lange Ausfahrt die Dauer der Vorwoche. Das faellt sonst nicht auf. */
function StartdatumKarte(){
  const aktuell = startDate.value;
  const [datum, setDatum] = useState(isoDayLocal(aktuell));
  const gewaehlt = toMidnight(new Date(datum));
  const geaendert = datum !== isoDayLocal(aktuell);
  const wochentag = gewaehlt.getDay();
  const passt = wochentag === 6;

  return (
    <div class="card">
      <div class="row"><span>Beginn Woche 1</span>
        <b>{aktuell.toLocaleDateString('de-DE')} · {WEEKDAY_NAMES[aktuell.getDay()]}</b></div>
      <div class="field"><span>Startdatum</span>
        <input type="date" value={datum} onInput={e => setDatum(e.currentTarget.value)} /></div>
      <div class="buttons" style="margin-top:10px">
        <button class="btn" disabled={!geaendert} onClick={() => setStartDate(gewaehlt)}>Übernehmen</button>
        {isoDayLocal(aktuell) !== PLAN_START_DEFAULT && (
          <button class="btn secondary" onClick={() => { setDatum(PLAN_START_DEFAULT); setStartDate(new Date(PLAN_START_DEFAULT)); }}>
            Auf {new Date(PLAN_START_DEFAULT).toLocaleDateString('de-DE')} setzen
          </button>
        )}
      </div>
      {!passt && (
        <div class="meldung fehler">
          <b>{WEEKDAY_NAMES[wochentag]} als Wochenbeginn verschiebt den Samstag.</b>
          <ul>
            <li>Die Trainingswoche beginnt laut Plan am Samstag.</li>
            <li>Liegt der Start auf einem anderen Tag, zählt jeder Samstag zur vorherigen Woche –
                die lange Ausfahrt bekommt dann durchgehend die Dauer der Vorwoche.</li>
          </ul>
        </div>
      )}
      <p class="hint">
        Aus dem Startdatum ergibt sich jede Wochennummer und damit jede Vorgabe. Standard ist der{' '}
        {new Date(PLAN_START_DEFAULT).toLocaleDateString('de-DE')} – der Samstag, an dem Woche 1 begonnen hat.
      </p>
    </div>
  );
}

function PlanKarte(){
  const [meldung, setMeldung] = useState(null);
  const eigen = planSource.value === 'override';

  function importieren(){
    datei(async (text, name) => {
      let json;
      try { json = JSON.parse(text); }
      catch(e){ return setMeldung({ art:'fehler', titel:'Die Datei ist kein gültiges JSON.', zeilen:[String(e.message)] }); }
      try {
        await applyPlanOverride(json);
        setMeldung({ art:'ok', titel:'Plan übernommen: ' + name, zeilen:[] });
      } catch(e){
        /* Der laufende Plan bleibt stehen - eine halb uebernommene Aenderung
           waere schlimmer als gar keine. */
        setMeldung({ art:'fehler', titel: e.titel || 'Der Plan ist nicht verwendbar.',
                     zeilen: (e.zeilen || [e.message]).concat(['Der bisherige Plan läuft unverändert weiter.']) });
      }
    });
  }

  async function zuruecksetzen(){
    if(!confirm('Eigenen Plan verwerfen und wieder den Default aus dem Repo verwenden?')) return;
    await resetPlanToDefault();
    setMeldung({ art:'ok', titel:'Wieder auf dem Default aus dem Repo.', zeilen:[] });
  }

  return (
    <div class="card">
      <div class="row"><span>Aktiver Plan</span><b>{eigen ? 'eigener Plan' : 'Default aus dem Repo'}</b></div>
      <div class="row"><span>Name</span><b>{plan.value.raw.planName || '–'}</b></div>
      <div class="row"><span>Wochen</span><b>{plan.value.weekCount}</b></div>
      <div class="row"><span>Schemafassung</span><b>{PLAN_SCHEMA_VERSION}</b></div>

      <div class="buttons" style="margin-top:14px">
        <button class="btn" onClick={() => downloadJson('plan.json', planJson.value)}>Plan exportieren</button>
        <button class="btn secondary" onClick={importieren}>Plan importieren</button>
      </div>
      {eigen && <button class="btn secondary block" style="margin-top:10px" onClick={zuruecksetzen}>
        Auf Default zurücksetzen
      </button>}

      {meldung && (
        <div class={'meldung ' + meldung.art}>
          <b>{meldung.titel}</b>
          {meldung.zeilen.length > 0 && <ul>{meldung.zeilen.map((z, i) => <li key={i}>{z}</li>)}</ul>}
        </div>
      )}

      <p class="hint">
        Der Plan im Repo ist der Default. Ein importierter Plan wird auf dem Gerät gespeichert und
        gilt ab sofort – der Default bleibt jederzeit über den Knopf oben erreichbar. Beim Import
        wird geprüft: passt etwas nicht, bleibt der laufende Plan stehen und die Meldung nennt das
        Feld.
      </p>
    </div>
  );
}

function SicherungsKarte(){
  const [meldung, setMeldung] = useState(null);

  async function sichern(){
    const daten = await exportAll(store.store);
    downloadJson(exportFilename(new Date()), daten);
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
        setMeldung({ art:'ok', titel:'Eingespielt: ' + k.length + ' Einträge aus ' + name,
                     zeilen:['Die App lädt jetzt neu.'] });
        setTimeout(() => location.reload(), 900);
      } catch(e){
        setMeldung({ art:'fehler', titel: e.message, zeilen:[] });
      }
    });
  }

  return (
    <div class="card">
      <div class="row"><span>Daten auf diesem Gerät</span><b>
        {coreLog.value.length} Protokolle · {testLog.value.length} Tests · {interimLog.value.length} Erhebungen
      </b></div>
      <div class="buttons" style="margin-top:12px">
        <button class="btn" onClick={sichern}>Sicherung herunterladen</button>
        <button class="btn secondary" onClick={zurueckspielen}>Sicherung einspielen</button>
      </div>
      {meldung && (
        <div class={'meldung ' + meldung.art}>
          <b>{meldung.titel}</b>
          {meldung.zeilen.length > 0 && <ul>{meldung.zeilen.map((z, i) => <li key={i}>{z}</li>)}</ul>}
        </div>
      )}
      <p class="hint">
        Trainingsprotokolle, Testhistorie, Erhebungen, Schwellenwerte und Startdatum liegen nur in
        diesem Browserprofil. Ein „Browserdaten löschen“, ein Gerätewechsel oder ein Neuinstallieren
        der App – und sie sind weg. Die Sicherung ist die einzige Kopie, die es gibt.
      </p>
    </div>
  );
}

function DiagnoseKarte(){
  const [id, setId] = useState('');
  const [erg, setErg] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const key = apiKey.value;

  async function pruefen(){
    if(!key || !id.trim()) return;
    setLaeuft(true); setErg(null);
    try { setErg(await probeCapabilities(key, id.trim())); }
    finally { setLaeuft(false); }
  }

  return (
    <div class="card">
      <div class="row"><span>intervals.icu prüfen</span><b>{key ? 'Key vorhanden' : 'kein Key'}</b></div>
      <div class="field"><span>Aktivitäts-ID</span>
        <input type="text" placeholder="z. B. i12345678" value={id}
          onInput={e => setId(e.currentTarget.value)} /></div>
      <button class="btn block" style="margin-top:12px" disabled={!key || !id.trim() || laeuft} onClick={pruefen}>
        {laeuft ? 'Wird geprüft …' : 'Verfügbare Daten prüfen'}
      </button>

      {erg && (
        <div class="meldung ok">
          <b>Streams</b>
          <ul>
            {Object.keys(erg.streams).length === 0
              ? <li>keiner zurückgekommen</li>
              : Object.entries(erg.streams).map(([k, n]) => <li key={k}>{k}: {n} Messwerte</li>)}
          </ul>
          <b>Wetterfelder an der Aktivität</b>
          <ul>
            {erg.weatherFields.length === 0
              ? <li>keine – vermutlich Supporter-Funktion oder nicht befüllt</li>
              : erg.weatherFields.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
          {erg.error && <p class="hint warn">{erg.error}</p>}
        </div>
      )}

      <p class="hint">
        Beantwortet zwei Fragen, die in keiner Dokumentation stehen: Kommt <code>latlng</code> über
        die API durch – dann lässt sich die Route selbst auswerten. Und stehen Wetterfelder an der
        Aktivität – dann spart das die Anbindung an einen Wetterdienst.
      </p>
    </div>
  );
}

function VerhaltensKarte(){
  const s = settings.value;
  const [reset, setReset] = useState(false);

  async function appZuruecksetzen(){
    if(!confirm('Zwischenspeicher der App leeren und neu laden? Deine Trainingsdaten bleiben erhalten.')) return;
    setReset(true);
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch(e){}
    location.reload();
  }

  return (
    <div class="card">
      <div class="row"><span>Verhalten</span><b>während des Trainings</b></div>
      <div class="field"><span>Sprachansage</span>
        <input type="checkbox" checked={s.voice} onChange={e => setSettings({ voice: e.currentTarget.checked })} /></div>
      <div class="field"><span>Bildschirm anlassen</span>
        <input type="checkbox" checked={s.keepAwake} onChange={e => setSettings({ keepAwake: e.currentTarget.checked })} /></div>
      <div class="field"><span>Übungsbild im Timer</span>
        <input type="checkbox" checked={s.showIllu} onChange={e => setSettings({ showIllu: e.currentTarget.checked })} /></div>

      <div class="buttons" style="margin-top:14px">
        <button class="btn secondary" onClick={() => requestPersistentStorage()
          .then(ok => alert(ok ? 'Der Browser hält die Daten jetzt dauerhaft.' : 'Der Browser hat das abgelehnt – die Sicherung bleibt wichtig.'))}>
          Speicher dauerhaft anfordern
        </button>
        <button class="btn secondary" disabled={reset} onClick={appZuruecksetzen}>App zurücksetzen</button>
      </div>
      <p class="hint">
        „App zurücksetzen“ leert nur den Zwischenspeicher und lädt neu – für den Fall, dass nach
        einem Update etwas hängt. Trainingsdaten werden dabei nicht angefasst.
      </p>
    </div>
  );
}

export function EinstellungenTab(){
  return (
    <>
      <h1 class="title">Einstellungen</h1>
      <ZugangsKarte />
      <DarstellungsKarte />
      <StartdatumKarte />
      <PlanKarte />
      <SicherungsKarte />
      <DiagnoseKarte />
      <VerhaltensKarte />
    </>
  );
}
