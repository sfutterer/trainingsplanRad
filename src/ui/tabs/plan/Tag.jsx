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

   Seit dem 03.09.2026 ist die Tageskarte kein Block mehr, sondern so viele
   Abschnitte, wie der Tag Einheiten hat. Der Anlass war ein uebersehener
   Mittwoch: die Karte hiess "Rad – kurzes Z2 (Arbeitsweg) + Rumpf", und der
   Zirkel stand als dritte von drei Ablaufzeilen unter den Kennzahlen der
   Fahrt. Zugeklappt war von ihm nur das Wort "Rumpf" im Titel zu sehen.

   Jetzt traegt jede Einheit ihren eigenen Kopf mit Zeichen, Titel und
   Tageszeit, ihre eigenen Kennzahlen, ihren eigenen Ablauf und ihren eigenen
   Timerknopf - und die zugeklappte Zeile zaehlt sie einzeln auf, statt eine
   einzige Kennzahl zu zeigen. Ein Tag mit zwei Einheiten sieht damit auch
   zugeklappt anders aus als einer mit einer.

   Das Wellness-Gate haengt weiter an einem einzigen Abruf: die Serie kommt von
   oben als Eigenschaft herein, damit nicht jede sichtbare Tageskarte ihre
   eigene Anfrage stellt. */

import { useEffect } from 'preact/hooks';
import { plan, apiKey, today } from '../../../state/store.js';
import { isoDayLocal, toMidnight, WEEKDAY_NAMES } from '../../../domain/week.js';
import { wellnessMassnahmen } from '../../../domain/wellness.js';
import { wellness, ladeWellness } from '../../../state/wellness.js';
import { gotoTab } from '../../../state/navigation.js';
import { Einheitssymbol } from '../../components/Einheitssymbol.jsx';

/* Ein Abruf fuer die ganze Woche - und seit der Glocke einer fuer die ganze App.

   Die Ampel steht auf zwei Karten (Mittwoch und Donnerstag), gerechnet wird sie
   aber nur einmal, fuer heute. Der Abruf selbst liegt in state/wellness.js:
   dort holt ihn auch die Glocke ab, und zwei Stellen mit je eigenem useEffect
   haetten zwei Abfragen fuer dieselbe Antwort ausgeloest. */
export function useWellness(){
  const key = apiKey.value;
  const heuteIso = isoDayLocal(toMidnight(today.value));

  /* Anstossen genuegt: laeuft der Abruf fuer diesen Schluessel und diesen Tag
     schon, gibt ladeWellness die laufende Zusage zurueck. */
  useEffect(() => { ladeWellness(); }, [key, heuteIso]);

  return wellness.value;
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

/* Ab hier ist ein Wert kein Wert mehr, sondern ein Satz - und darf umbrechen.
   Siehe die Regel zu .kennzahl dd.lang in plan.css. */
const LANGER_WERT = 20;

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
          <dd class={String(k.wert).length > LANGER_WERT ? 'lang' : undefined}>{k.wert}</dd>
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

/* Was der Testanlauf an diesem Tag ersetzt.

   Ein Tausch, den man nicht sieht, ist von einem Fehler nicht zu
   unterscheiden: wer am Donnerstag 2 x 6 min liest, wo bis gestern 5 x 5 min
   stand, soll nicht raten muessen, ob die App sich vertan hat. */
function Ersatzhinweis({ ersetzt }){
  if(!ersetzt) return null;
  return (
    <div class="daynote gelb">
      <b>{ersetzt.grund}:</b> Diese Einheit tritt an die Stelle von „{ersetzt.titel}“.
    </div>
  );
}

/* Die Go/No-Go-Liste am Testmorgen.

   Eigene Liste und kein weiterer Absatz zwischen den Hinweisen: die vier
   Punkte werden abgehakt, nicht gelesen, und ein Fliesstext mit vier
   Bedingungen darin laesst sich am Testmorgen nicht abhaken. */
function Checkliste({ liste }){
  if(!liste || !liste.punkte || !liste.punkte.length) return null;
  return (
    <div class="checkliste">
      <div class="listhead">{liste.titel}</div>
      <ul>{liste.punkte.map((p, i) => <li key={i}>{p}</li>)}</ul>
      {liste.note && <p class="hint">{liste.note}</p>}
    </div>
  );
}

/* Die wichtigste Kennzahl einer Einheit. Die erste ist es immer: day.js setzt
   sie bewusst an den Anfang - Dauer, sonst Umfang. */
function ersteKennzahl(traeger){
  const k = traeger && traeger.kennzahlen && traeger.kennzahlen[0];
  return k ? k.wert : '';
}

/* Die Zeichen des Tages, ohne Wiederholung.

   Ein Sonntag traegt Zirkel und Beinblock, beide sind Rumpf - zwei gleiche
   Zeichen nebeneinander behaupten einen Unterschied, den es nicht gibt. */
export function tagesArten(info){
  const raus = [];
  for(const e of info.einheiten || []){
    if(raus.indexOf(e.art) < 0) raus.push(e.art);
  }
  return raus.length ? raus : [info.art];
}

/* Eine Einheit in der zugeklappten Zeile: Zeichen, Titel und die eine Zahl
   oder Tageszeit, die man daran erkennt. */
function Einheitszeile({ e }){
  const rechts = [e.zeit, ersteKennzahl(e)].filter(Boolean).join(' · ');
  return (
    <span class="tageinheit">
      <Einheitssymbol art={e.art} klasse="tagminisym" />
      <span class="tageinheit-titel">{e.titel}</span>
      {rechts && <span class="tageinheit-wert">{rechts}</span>}
    </span>
  );
}

function tagUndMonat(d){
  return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' });
}

/* Der Kopf einer Tageskarte, zwei Zeilen: oben wann, unten was.

   Bewusst nur <span> und kein <div>: in der Wochenansicht steckt derselbe Kopf
   in einem <button>, und dessen Inhaltsmodell laesst nur Phrasenelemente zu.
   Das Layout macht display:flex, nicht das Element. */
export function Tageskopf({ datum, info, istHeute, mitKurz }){
  const einheiten = info.einheiten || [];
  const mehrere = !info.vorStart && einheiten.length > 1;
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
        {/* Das Zeichen der Einheitsart steht vor dem Titel, nicht statt seiner:
            es beantwortet die Frage aus zwei Metern, der Titel die genaue.
            Vor Planbeginn bleibt es weg - dort gibt es keine Einheit.

            Traegt der Tag mehrere Arten, stehen sie alle da: ein Rad allein
            vor "Rad – kurzes Z2 (Arbeitsweg) + Rumpf" liess den Zirkel auch
            im Zeichen verschwinden. */}
        <span class="daysymtitel">
          {!info.vorStart && tagesArten(info).map(a =>
            <Einheitssymbol art={a} klasse="daysym" key={a} />)}
          <span class="daytitle">{info.vorStart ? 'Vor Planbeginn' : info.title}</span>
        </span>
        {mitKurz && !mehrere && !info.vorStart &&
          <span class="tagkurz">{ersteKennzahl(info.einheiten && info.einheiten[0])}</span>}
      </span>
      {/* Zugeklappt und mit mehr als einer Einheit: jede bekommt ihre Zeile.
          Eine einzelne Kennzahl rechts oben haette weiterhin nur die erste
          Einheit gezeigt - und der uebersehene Zirkel stuende wieder nirgends. */}
      {mitKurz && mehrere && (
        <span class="tageinheiten">
          {einheiten.map((e, i) => <Einheitszeile e={e} key={i} />)}
        </span>
      )}
    </>
  );
}

/* Eine Einheit als eigener Abschnitt der Tageskarte.

   Der Kopf steht nur da, wo der Tag mehr als eine traegt: bei einer einzigen
   sagte er dasselbe wie die Kopfzeile der Karte darueber, zwei Zeilen weiter
   oben und in derselben Schrift. */
function Einheitsabschnitt({ e, mitKopf }){
  return (
    <div class={'einheit' + (mitKopf ? ' mitkopf' : '')}>
      {mitKopf && (
        <div class="einheit-kopf">
          <Einheitssymbol art={e.art} klasse="einheitsym" />
          <span class="einheit-titel">{e.titel}</span>
          {e.zeit && <span class="einheit-zeit">{e.zeit}</span>}
        </div>
      )}
      <Kennzahlen liste={e.kennzahlen} />
      <Abschnitte liste={e.bloecke} geordnet klasse="ablauf" />
      {e.hinweise.map((h, i) => <p class="hint" key={i}>{h}</p>)}
      {/* Der Knopf haengt an seiner Einheit und nicht mehr am Tag: der
          Rumpf-Timer steht unter dem Zirkel, nicht unter der Fahrt. */}
      {e.timer && <button class="btn tonal tagbtn" type="button"
        onClick={() => gotoTab(e.timer.ziel, true)}>{e.timer.label}</button>}
    </div>
  );
}

export function Tagesinhalt({ info, istHeute, serie }){
  /* Ein Datum vor dem Beginn der Woche 1 bekommt keinen Trainingsinhalt.
     buildDayInfo klemmt dort auf Woche 1 und lieferte sonst einen
     vollstaendigen Tag fuer einen Zeitraum, in dem nicht trainiert wurde. */
  if(info.vorStart){
    return <p class="hint">Der Plan beginnt erst später. Für diesen Tag gibt es keine Vorgabe.</p>;
  }

  const einheiten = info.einheiten || [];
  const mehrere = einheiten.length > 1;

  return (
    <>
      <Ersatzhinweis ersetzt={info.ersetzt} />

      {/* Die Zahl steht ueber den Abschnitten und nicht als Fussnote darunter:
          sie ist das Erste, was man vom Tag wissen muss. */}
      {mehrere && <div class="einheitenzahl">{einheiten.length} Einheiten an diesem Tag</div>}

      {einheiten.map((e, i) => <Einheitsabschnitt e={e} mitKopf={mehrere} key={i} />)}

      <Checkliste liste={info.checkliste} />
      {(info.tagHinweise || []).map((h, i) => <p class="hint" key={i}>{h}</p>)}

      {info.zusatz && info.zusatz.length > 0 && (
        <div class="zusatz">
          <div class="listhead">Nebenher</div>
          <Abschnitte liste={info.zusatz} klasse="ablauf schmal" />
        </div>
      )}

      <WellnessAmpel info={info} istHeute={istHeute} serie={serie} />
      {istHeute && <AbnehmHinweis serie={serie} />}
    </>
  );
}
