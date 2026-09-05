/* Die Glocke: was heute ansteht und was liegengeblieben ist.

   Bewusst knapp - wer mehr wissen will, ist zwei Antipper vom Plan entfernt.
   Als Bottom Sheet, weil die Greifzone unten liegt.

   Zwei Zustaende, und der zweite ist der aeltere:

     Liegen Meldungen an, zeigt das Sheet sie - was heute ansteht, ein rotes
     Wellness-Gate, ein verpasster Tag.

     Liegt nichts an - weil man alles weggewischt hat -, steht hier weiterhin
     der Tagesueberblick. Eine Glocke, die auf Tippen nichts tut, waere ein
     kaputter Knopf; und die Frage "was ist heute?" hat man auch dann, wenn die
     Antwort keine Neuigkeit ist.

   Weg ist eine Meldung erst, wenn man sie wegwischt - einzeln nach links, oder
   alle zusammen ueber den Knopf darunter. Das Schliessen selbst laesst sie
   stehen.

   Vorher verwarf das Schliessen alles, was gezeigt worden war - der uebliche
   Umgang mit einer Glocke, hier aber mit einem Haken: die Meldungen dieser App
   sind keine Benachrichtigungen, die man wegtippt, sondern drei Saetze, die
   eine Entscheidung verlangen. Wer das Sheet aus Versehen antippte, wer noch
   einmal nachsehen wollte, was da stand, oder wer mitten im Lesen die
   Zurueck-Geste machte, hatte danach nichts mehr und keinen Weg zurueck. Jetzt
   entscheidet die Hand und nicht das Zumachen. */

import { useEffect, useRef } from 'preact/hooks';
import { plan, thresholds, startDate, today } from '../../state/store.js';
import { meldungen, meldungenVerwerfen } from '../../state/meldungen.js';
import { buildDayInfo } from '../../domain/day.js';
import { tagUndDatum, dayFromIso } from '../../domain/week.js';
import { Sheet, ZUG_ERKANNT } from './Sheet.jsx';
import { bewegungsarm } from '../../platform/index.js';

/* Woher die Meldung kommt, in einem Wort. Der Titel darunter sagt, was sie
   heisst - zusammen ergeben sie die Zeile, die man ueberfliegt. */
const ART = {
  training: 'Heute',
  gate:     'Wellness-Gate',
  ziel:     'Verpasst'
};

/* Losgelassen wird verworfen, wenn die Karte weit genug links steht - oder
   wenn sie schnell genug unterwegs war. Das Wegmass als Anteil der Breite,
   damit die Geste auf dem Telefon dieselbe ist wie auf dem breiten Sheet. */
const SCHWELLE = 0.35;
const SCHNELL = 0.6;
/* Dauer der Ausfahrt. Lang genug, dass man sieht, wohin die Meldung geht,
   kurz genug, dass niemand auf sie wartet. */
const AUSFAHRT = 180;

/* Immer der ausgeschriebene Tag, auch bei der heutigen Meldung. "heute" waere
   kuerzer, stuende dort aber neben der Art "Heute" - zweimal dasselbe Wort in
   einer Zeile. */
function datumText(iso){
  return tagUndDatum(dayFromIso(iso));
}

/* Eine Meldung und die Geste, die sie loswird.

   Nur nach links: nach rechts liegt nichts, und beide Richtungen zu nehmen
   hiesse nur, dass man eine Karte auch in die falsche Richtung versehentlich
   loswird. Senkrecht gehoert die Bewegung dem Scrollen und dem Sheet - erkannt
   wird deshalb erst, was eindeutig quer laeuft, und ab da bleibt die Geste
   hier und geht das Sheet nichts mehr an. */
function Nachricht({ m, onWeg }){
  const karte = useRef(null);
  const zug = useRef(null);
  const ausfahrt = useRef(null);

  /* Dieselbe Vorsorge wie im Sheet: die Zeitschaltung der Ausfahrt muss weg,
     wenn die Karte auf anderem Weg verschwindet. */
  useEffect(() => () => { if(ausfahrt.current) clearTimeout(ausfahrt.current); }, []);

  /* Von Hand am Knoten und nicht ueber den Zustand: waehrend eines Zuges kaeme
     sonst je Bildschirmbild eine Neuzeichnung der ganzen Liste. */
  function stelle(dx, weich){
    const el = karte.current;
    if(!el) return;
    el.style.transition = weich
      ? 'transform .2s cubic-bezier(.2, 0, 0, 1), opacity .2s linear'
      : 'none';
    el.style.transform = dx < 0 ? 'translateX(' + dx + 'px)' : '';
    el.style.opacity = String(Math.max(0, 1 + dx / (el.offsetWidth || 1)));
  }

  function zugBeginn(e){
    if(e.button != null && e.button !== 0) return;
    zug.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp,
                    dx: 0, zieht: false };
  }

  function zugLauf(e){
    const z = zug.current;
    if(!z || e.pointerId !== z.id) return;
    const dx = e.clientX - z.x;
    const dy = e.clientY - z.y;

    if(!z.zieht){
      /* Senkrecht ueber die Schwelle heisst: das war Scrollen oder der Zug am
         Sheet - diese Karte ist dann raus. */
      if(Math.abs(dy) > ZUG_ERKANNT && Math.abs(dy) >= Math.abs(dx)){ zug.current = null; return; }
      if(dx > -ZUG_ERKANNT) return;
      z.zieht = true;
      /* Ab hier zaehlt der Weg neu, damit die Karte nicht um die
         Erkennungsschwelle springt. */
      z.x = e.clientX; z.t = e.timeStamp;
      if(karte.current && karte.current.setPointerCapture){
        try { karte.current.setPointerCapture(e.pointerId); } catch(_e) { /* egal */ }
      }
    }

    /* Die Geste gehoert jetzt der Karte. Ohne das laese das Sheet dieselbe
       Bewegung als halbes Wegwischen nach unten mit. */
    e.stopPropagation();
    z.dx = Math.min(0, e.clientX - z.x);
    stelle(z.dx, false);
  }

  function zugEnde(e){
    const z = zug.current;
    if(!z || e.pointerId !== z.id) return;
    zug.current = null;
    if(!z.zieht) return;
    e.stopPropagation();

    const el = karte.current;
    const breite = (el && el.offsetWidth) || 1;
    const tempo = -z.dx / Math.max(1, e.timeStamp - z.t);
    if(-z.dx < breite * SCHWELLE && tempo < SCHNELL){ stelle(0, true); return; }

    if(bewegungsarm()){ onWeg(m.id); return; }

    /* Erst hinausfahren, dann verwerfen. Verschwaende die Karte mitten in der
       Bewegung, saehe die Geste aus wie ein Aussetzer. */
    el.style.transition = 'transform ' + AUSFAHRT + 'ms cubic-bezier(.3, 0, 1, 1), '
                        + 'opacity ' + AUSFAHRT + 'ms linear';
    el.style.transform = 'translateX(-' + (breite + 40) + 'px)';
    el.style.opacity = '0';
    ausfahrt.current = setTimeout(() => onWeg(m.id), AUSFAHRT);
  }

  /* Nimmt das System die Geste an sich - Anruf, Systemleiste -, faehrt die
     Karte zurueck. Eine halb weggeschobene Meldung waere der einzige Zustand,
     aus dem es keinen Weg zurueck gaebe. */
  function zugAus(){
    if(!zug.current) return;
    const zog = zug.current.zieht;
    zug.current = null;
    if(zog) stelle(0, true);
  }

  return (
    <article class={'nachricht ' + m.ton} ref={karte}
      onPointerDown={zugBeginn} onPointerMove={zugLauf}
      onPointerUp={zugEnde} onPointerCancel={zugAus}>
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

/* Der Tagesueberblick.

   Er las bis zum 04.09.2026 `info.detail` - das Satzband, das buildDayInfo
   neben der Struktur ein zweites Mal erzeugte, und zwar nur noch fuer diese
   eine Stelle. Zwanzig Erzeugungsstellen in day.js gegen einen Leser hier.

   Jetzt die Einheiten des Tages, jede mit ihrer Tageszeit und ihrer ersten
   Kennzahl. Das ist nicht nur weniger Code, es ist auch die richtige Antwort
   auf die Frage, mit der man die Glocke oeffnet: der Mittwoch traegt eine
   Fahrt und abends den Zirkel, und im Satzband stand der Zirkel als
   Nebensatz am Ende. Genau dieser Fall war schon der Anlass, die Einheiten
   ueberhaupt einzufuehren. */
function Tagesueberblick(){
  const info = buildDayInfo(plan.value, thresholds.value, today.value, startDate.value);
  const d = today.value;

  return (
    <>
      <div class="heute-kopf">
        <span>{tagUndDatum(d)}</span>
        <span>Woche {info.week}{info.winter ? '' : ' / ' + plan.value.weekCount}</span>
      </div>
      <h3 class={'type-' + info.type}>{info.title}</h3>
      <ul class="heute-einheiten">
        {info.einheiten.map((e, i) => (
          <li key={i}>
            <span class="heute-einheit">{e.titel}{e.zeit ? ' · ' + e.zeit : ''}</span>
            {/* Die erste Kennzahl ist die, die man vor dem Losfahren abliest -
                Dauer bei einer Fahrt, Umfang beim Zirkel. Alle waeren hier
                eine Tabelle, und dafuer gibt es die Tageskarte. */}
            {e.kennzahlen[0] &&
              <span class="heute-wert">{e.kennzahlen[0].wert}</span>}
          </li>
        ))}
      </ul>
      {info.wellness && <p class="heute-regel">{plan.value.texts.wellnessRule}</p>}
    </>
  );
}

export function HeuteOverlay({ onClose }){
  const liste = meldungen.value;

  /* Alles weg und zu. Der Knopf ist der Weg fuer die Tastatur und fuer alle,
     die drei Karten nicht einzeln wegziehen moechten - und er ist der Grund,
     dass darunter kein "Schliessen" mehr steht: das Sheet wischt man weg, und
     dann bleiben die Meldungen stehen. */
  function alleVerwerfen(){
    meldungenVerwerfen(liste.map(m => m.id));
    onClose();
  }

  return (
    <Sheet onClose={onClose} label={liste.length ? 'Neue Meldungen' : 'Was heute ansteht'}>
      {liste.length
        ? <div class="nachrichten">
            {liste.map(m => <Nachricht key={m.id} m={m} onWeg={id => meldungenVerwerfen([id])} />)}
            <p class="hint">Nach links wischen verwirft eine Meldung; wird das Sheet
              weggewischt, bleiben sie erhalten.</p>
          </div>
        : <Tagesueberblick />}
      {liste.length > 0 &&
        <div class="buttons">
          <button class="btn secondary" onClick={alleVerwerfen}>Alle verwerfen</button>
        </div>}
    </Sheet>
  );
}
