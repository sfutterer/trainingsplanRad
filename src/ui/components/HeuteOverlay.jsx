/* Die Glocke: was heute ansteht und was liegengeblieben ist.

   Bewusst knapp - wer mehr wissen will, ist zwei Antipper vom Plan entfernt.
   Als Bottom Sheet, weil die Greifzone unten liegt.

   Zwei Zustaende, und der zweite ist der aeltere:

     Liegen Meldungen an, zeigt das Sheet sie - was heute ansteht, ein rotes
     Wellness-Gate, ein verpasster Tag. Beim Schliessen sind sie weg. Das ist
     der uebliche Umgang mit einer Glocke: die Zahl daran ist eine Frage, und
     das Oeffnen ist die Antwort. Bliebe die Meldung stehen, muesste man sie ein
     zweites Mal wegtippen.

     Liegt nichts an - weil man heute schon nachgesehen hat -, steht hier
     weiterhin der Tagesueberblick. Eine Glocke, die auf Tippen nichts tut,
     waere ein kaputter Knopf; und die Frage "was ist heute?" hat man auch dann,
     wenn die Antwort keine Neuigkeit ist.

   Geloescht wird beim Schliessen und nicht beim Oeffnen. Wer das Sheet aus
   Versehen antippt und sofort wieder zumacht, hat die Meldung zwar gesehen -
   aber wer waehrend des Lesens die Zurueck-Geste macht, soll nicht mitten im
   Satz die Liste unter sich wegschrumpfen sehen. */

import { useEffect, useRef } from 'preact/hooks';
import { plan, thresholds, startDate, today } from '../../state/store.js';
import { meldungen, meldungenGelesen } from '../../state/meldungen.js';
import { buildDayInfo } from '../../domain/day.js';
import { WEEKDAY_NAMES, dayFromIso } from '../../domain/week.js';
import { Sheet } from './Sheet.jsx';

/* Woher die Meldung kommt, in einem Wort. Der Titel darunter sagt, was sie
   heisst - zusammen ergeben sie die Zeile, die man ueberfliegt. */
const ART = {
  training: 'Heute',
  gate:     'Wellness-Gate',
  ziel:     'Verpasst'
};

/* Immer der ausgeschriebene Tag, auch bei der heutigen Meldung. "heute" waere
   kuerzer, stuende dort aber neben der Art "Heute" - zweimal dasselbe Wort in
   einer Zeile. */
function datumText(iso){
  const d = dayFromIso(iso);
  return WEEKDAY_NAMES[d.getDay()] + ', ' + d.toLocaleDateString('de-DE');
}

function Nachricht({ m }){
  return (
    <article class={'nachricht ' + m.ton}>
      <div class="nachricht-kopf">
        <span class="nachricht-art">{ART[m.art] || 'Hinweis'}</span>
        <span class="nachricht-tag">{datumText(m.tag)}</span>
      </div>
      <h3 class="nachricht-titel">{m.titel}</h3>
      {/* Eine Zeile bleibt ein Absatz. Eine Aufzaehlung mit genau einem Punkt
          sieht aus, als fehlte etwas. */}
      {m.zeilen.length === 1
        ? <p class="nachricht-text">{m.zeilen[0]}</p>
        : m.zeilen.length > 1
          ? <ul class="nachricht-text">{m.zeilen.map((z, i) => <li key={i}>{z}</li>)}</ul>
          : null}
    </article>
  );
}

/* Der Tagesueberblick wie vor der Glockenerweiterung. */
function Tagesueberblick(){
  const info = buildDayInfo(plan.value, thresholds.value, today.value, startDate.value);
  const d = today.value;

  return (
    <>
      <div class="heute-kopf">
        <span>{WEEKDAY_NAMES[d.getDay()]}, {d.toLocaleDateString('de-DE')}</span>
        <span>Woche {info.week}{info.winter ? '' : ' / ' + plan.value.weekCount}</span>
      </div>
      <h3 class={'type-' + info.type}>{info.title}</h3>
      <p class="heute-detail">{info.detail}</p>
      {info.wellness && <p class="heute-regel">{plan.value.texts.wellnessRule}</p>}
    </>
  );
}

export function HeuteOverlay({ onClose, onZumPlan }){
  const liste = meldungen.value;

  /* Was gezeigt wurde, wird gesammelt und nicht einmal beim Oeffnen
     abgeschrieben: die Meldungen koennen nachtroepfeln, wenn intervals.icu
     langsam antwortet und man die Glocke sofort antippt. Ohne dieses Sammeln
     bliebe genau die nachgereichte Meldung ungelesen stehen. */
  const gezeigt = useRef([]);
  useEffect(() => {
    for(const m of liste) if(!gezeigt.current.includes(m.id)) gezeigt.current.push(m.id);
  });
  useEffect(() => () => { meldungenGelesen(gezeigt.current); }, []);

  return (
    <Sheet onClose={onClose} label={liste.length ? 'Neue Meldungen' : 'Was heute ansteht'}>
      {liste.length
        ? <div class="nachrichten">
            {liste.map(m => <Nachricht key={m.id} m={m} />)}
            <p class="hint">Beim Schließen werden diese Meldungen gelöscht.</p>
          </div>
        : <Tagesueberblick />}
      <div class="buttons">
        <button class="btn" onClick={onZumPlan}>Zum Plan</button>
        <button class="btn secondary" onClick={onClose}>Schließen</button>
      </div>
    </Sheet>
  );
}
