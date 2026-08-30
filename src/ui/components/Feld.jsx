/* Die Eingabezeile: Beschriftung links, Feld rechts.

   Stand siebzehnmal von Hand da - fuenfmal im Intervall-Timer, sechsmal bei den
   Zonen, viermal im Rumpfzirkel, zweimal in der Analyse. Jedes Mal mit
   derselben parseInt-Zeile daneben, und jedes Mal mit der Beschriftung als
   <span>, der mit dem Feld nichts zu tun hatte.

   Das war der eigentliche Schaden: die App hatte neunzehn Eingabefelder und
   keine einzige <label>-Verknuepfung. Wer vorlesen laesst, hoerte "Bearbeiten,
   Zahl" - ohne zu erfahren, ob das die Belastung, die Pause oder die Runden
   sind. Hier haengt die Beschriftung ueber id/for am Feld, und ein Tipp auf
   den Text setzt den Fokus hinein, was die Trefferflaeche nebenbei verdoppelt.

   Der Rohtext lebt waehrend der Eingabe im Feld und nicht beim Aufrufer. Das
   ist kein Detail: "1." und "" sind gueltige Zwischenstaende, die keine Zahl
   ergeben. Schriebe der Aufrufer sie als geparste Zahl zurueck, verschwaende
   das Komma unter den Fingern - genau der Fall bei den halben Minuten des
   Intervall-Timers. Beim Verlassen des Feldes gilt wieder der Wert des
   Aufrufers, ein unfertiger Rest verschwindet damit von selbst. */

import { useId, useState } from 'preact/hooks';

/* onWert bekommt eine Zahl oder null - null heisst "Feld leer". Was daraus
   folgt, entscheidet der Aufrufer: der Timer behaelt seinen alten Wert, die
   Schwellenwerte duerfen wirklich leer sein. */
export function Zahlenfeld({ titel, wert, onWert, min, max, dezimal, schritt }){
  const id = useId();
  const [roh, setRoh] = useState(null);
  const text = roh != null ? roh : (wert == null || wert === '' ? '' : String(wert));

  function eingabe(v){
    setRoh(v);
    const s = v.trim().replace(',', '.');
    if(s === ''){ onWert(null); return; }
    const n = dezimal ? parseFloat(s) : parseInt(s, 10);
    if(!Number.isFinite(n)) return;
    if(min != null && n < min) return;
    if(max != null && n > max) return;
    onWert(n);
  }

  return (
    <div class="field">
      <label for={id}>{titel}</label>
      <input id={id} type="number" value={text}
        inputmode={dezimal ? 'decimal' : 'numeric'}
        min={min} max={max} step={schritt}
        onInput={e => eingabe(e.currentTarget.value)}
        onBlur={() => setRoh(null)} />
    </div>
  );
}

export function Textfeld({ titel, wert, onWert, platzhalter }){
  const id = useId();
  return (
    <div class="field">
      <label for={id}>{titel}</label>
      <input id={id} type="text" value={wert} placeholder={platzhalter}
        onInput={e => onWert(e.currentTarget.value)} />
    </div>
  );
}

/* Dieselbe Zeilenform mit einer Auswahl statt eines Feldes. Die Optionen
   kommen als {id, label} herein, damit der Aufrufer keine <option> baut - das
   war die Stelle, an der die vier Zeitraeume in der Analyse zweimal woertlich
   dastanden. */
export function Auswahlfeld({ titel, wert, onWert, optionen }){
  const id = useId();
  return (
    <div class="field">
      <label for={id}>{titel}</label>
      <select id={id} value={wert} onChange={e => onWert(e.currentTarget.value)}>
        {optionen.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );
}
