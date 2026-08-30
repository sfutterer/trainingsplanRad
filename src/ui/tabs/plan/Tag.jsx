/* Der Inhalt eines einzelnen Trainingstages.

   Einmal geschrieben, von der Wochen- und der Monatsansicht benutzt. Vorher
   stand die Tagesdarstellung mitten in PlanTab und war an die Schleife ueber
   sieben Tage ab heute gebunden; sobald es zwei Ansichten auf denselben Tag
   gibt, muss sie eigenstaendig sein.

   Gezeigt wird die Struktur aus buildDayInfo, nicht mehr das Feld `detail`.
   Der Fliesstext trug Dauer, Zone, Wattbereich, Wiederholungen und die
   Ausfuehrungshinweise in einem einzigen Absatz - auf einem Handy vier bis
   sechs Zeilen, in denen die Zahl, die man vor dem Losfahren braucht, irgendwo
   in der Mitte steht. Jetzt stehen die Eckwerte oben als Paare, der Ablauf
   darunter als je eigene Zeile. `detail` bleibt in day.js erhalten, wird hier
   aber nicht mehr gelesen.

   Das Wellness-Gate haengt weiter an einem einzigen Abruf: die Serie kommt von
   oben als Eigenschaft herein, damit nicht jede sichtbare Tageskarte ihre
   eigene Anfrage stellt. */

import { useEffect, useState } from 'preact/hooks';
import { plan, apiKey, today } from '../../../state/store.js';
import { isoDayLocal, toMidnight, WEEKDAY_NAMES } from '../../../domain/week.js';
import { fetchWellness } from '../../../data/icu.js';
import { wellnessSerie, wellnessMassnahmen } from '../../../domain/wellness.js';
import { gotoTab } from '../../../state/navigation.js';

/* Ein Abruf fuer die ganze Woche.

   Die Ampel steht auf zwei Karten (Mittwoch und Donnerstag), gerechnet wird sie
   aber nur einmal - fuer heute. Zwei Komponenten mit je eigenem useEffect
   haetten zwei Abfragen fuer dieselbe Antwort ausgeloest.

   Drei Wochen statt einer: das Gate nimmt sich daraus die letzten sieben Tage,
   der Gewichtstrend braucht mehr Punkte, um eine Gerade zu tragen. */
const WELLNESS_TAGE = 21;

export function useWellness(){
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

/* Die Eckwerte als Schluessel-Wert-Paare. Ein <dl> und keine Tabelle: es sind
   Begriff und Wert, keine zwei Dimensionen - und ein Raster aus zwei Spalten
   faellt auf einem schmalen Geraet ohne Zutun auf eine zurueck. */
function Kennzahlen({ liste }){
  if(!liste || !liste.length) return null;
  return (
    <dl class="kennzahlen">
      {liste.map((k, i) => (
        <div class="kennzahl" key={i}>
          <dt>{k.label}</dt>
          <dd>{k.wert}</dd>
        </div>
      ))}
    </dl>
  );
}

/* Der Ablauf als geordnete Liste - die Reihenfolge ist Teil der Aussage, ein
   Ausrollen vor der Belastung waere etwas anderes. Die Zusatzbloecke daneben
   sind ungeordnet, sie stehen nebeneinander und nicht nacheinander. */
function Abschnitte({ liste, geordnet, klasse }){
  if(!liste || !liste.length) return null;
  const inhalt = liste.map((b, i) => (
    <li key={i}>
      <span class="abschnitt-kopf">
        <span class="abschnitt-label">{b.label}</span>
        <span class="abschnitt-wert">{b.wert}</span>
      </span>
      {b.hinweis && <span class="abschnitt-hinweis">{b.hinweis}</span>}
    </li>
  ));
  return geordnet ? <ol class={klasse}>{inhalt}</ol> : <ul class={klasse}>{inhalt}</ul>;
}

/* Die wichtigste Kennzahl fuer die zugeklappte Zeile. Die erste ist es immer:
   day.js setzt sie bewusst an den Anfang - Dauer, sonst Umfang. */
function ersteKennzahl(info){
  const k = info.kennzahlen && info.kennzahlen[0];
  return k ? k.wert : '';
}

function tagUndMonat(d){
  return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' });
}

/* Der Kopf einer Tageskarte, zwei Zeilen: oben wann, unten was.

   Bewusst nur <span> und kein <div>: in der Wochenansicht steckt derselbe Kopf
   in einem <button>, und dessen Inhaltsmodell laesst nur Phrasenelemente zu.
   Das Layout macht display:flex, nicht das Element. */
export function Tageskopf({ datum, info, istHeute, mitKurz }){
  return (
    <>
      <span class="dayzeile-oben">
        <span class="tagname">{WEEKDAY_NAMES[datum.getDay()]}, {tagUndMonat(datum)}</span>
        <span class="tagmarke">
          {istHeute ? <b class="badge">HEUTE</b>
            : info.vorStart ? '' : 'Woche ' + info.week}
        </span>
      </span>
      <span class="dayzeile-unten">
        <span class="daytitle">{info.vorStart ? 'Vor Planbeginn' : info.title}</span>
        {mitKurz && !info.vorStart && <span class="tagkurz">{ersteKennzahl(info)}</span>}
      </span>
    </>
  );
}

export function Tagesinhalt({ info, istHeute, serie }){
  /* Ein Datum vor dem Beginn der Woche 1 bekommt keinen Trainingsinhalt.
     buildDayInfo klemmt dort auf Woche 1 und lieferte sonst einen
     vollstaendigen Tag fuer einen Zeitraum, in dem nicht trainiert wurde. */
  if(info.vorStart){
    return <p class="hint">Der Plan beginnt erst später. Für diesen Tag gibt es keine Vorgabe.</p>;
  }

  return (
    <>
      <Kennzahlen liste={info.kennzahlen} />
      <Abschnitte liste={info.bloecke} geordnet klasse="ablauf" />
      {(info.hinweise || []).map((h, i) => <p class="hint" key={i}>{h}</p>)}

      {info.zusatz && info.zusatz.length > 0 && (
        <div class="zusatz">
          <div class="listhead">Nebenher</div>
          <Abschnitte liste={info.zusatz} klasse="ablauf schmal" />
        </div>
      )}

      <WellnessAmpel info={info} istHeute={istHeute} serie={serie} />
      {istHeute && <AbnehmHinweis serie={serie} />}

      {/* Der Rumpf-Timer liegt im Sammelbereich Training. Vorher stand hier
          'rumpf' - eine Kennung, die es nie gab; gotoTab verwirft Unbekanntes
          stillschweigend, der Knopf tat also nichts. */}
      {info.showTimerBtn && <button class="btn tonal tagbtn" type="button"
        onClick={() => gotoTab('training', true)}>Rumpf-Timer öffnen</button>}
      {info.showIntervalBtn && <button class="btn tonal tagbtn" type="button"
        onClick={() => gotoTab('intervalle', true)}>Intervall-Timer öffnen</button>}
    </>
  );
}
