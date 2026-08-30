/* Zahlen: Median und die deutsche Schreibweise.

   Beide standen mehrfach da. median() war in analysis.js und verlauf.js
   zeichengleich einkopiert - zwei Robustheitsmasse, die auseinanderlaufen
   koennen, ohne dass es jemand merkt.

   Beim Formatieren war es schlimmer: es gab zwei Funktionen namens ein(), in
   fazit.js und in Auswertung.jsx, beide "eine Stelle hinter dem Komma, deutsch
   geschrieben" - aber die eine schrieb 20 als "20" und die andere als "20,0".
   Gleicher Name, gleicher Zweck, verschiedenes Ergebnis, und die zweite wurde
   sogar exportiert. Jetzt gibt es zahl(v, nk), und wer eine Nachkommastelle
   will, schreibt zahl(v, 1).

   Rein: kein DOM, keine Uhr. */

export function median(v){
  const s = v.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/* Nicht darstellbare Werte werden zum Gedankenstrich und nicht zu "NaN":
   eine Kennzahl ohne Datengrundlage ist keine Zahl, und "NaN" liest sich wie
   ein Fehler der App statt wie eine fehlende Messung. */
export function zahl(v, nk){
  const n = nk == null ? 2 : nk;
  if(!Number.isFinite(v)) return '–';
  return (Math.round(v * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n).replace('.', ',');
}
