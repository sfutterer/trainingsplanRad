/* Die Blaetterleiste ueber Wochen- und Monatsansicht.

   Stand zweimal woertlich da - einmal in PlanTab, einmal in Monatsansicht.
   Beide bauen dieselben Elemente in derselben Reihenfolge, und der einzige
   Unterschied ist, was "eine weiter" bedeutet und was in der Mitte steht.

   Rechts sass bis zum 05.09.2026 ein unsichtbarer Zwilling des Heute-Knopfs -
   nur dafuer da, die Breite zu spiegeln, damit der Titel mittig bleibt und die
   Karte beim Blaettern nicht springt. Jetzt steht dort der Wechsel zwischen
   Woche und Monat, und der Platz traegt endlich etwas. Die Segmented-Leiste,
   die diesen Wechsel bisher in einer eigenen Zeile darueber anbot, ist damit
   weg: sie kostete mit Rahmen und Abstaenden 74 px ueber der ersten
   Tageskarte, fuer eine Frage, die man selten stellt.

   Der Knopf nennt das Ziel, nicht den Zustand ("Monat", wenn die Woche zu
   sehen ist). Welche Ansicht laeuft, sagt der Titel daneben ohnehin - "Woche
   7" oder "September 2026" -, und zwei Angaben derselben Sache nebeneinander
   waeren eine zuviel.

   Beide Seitenfelder haben dieselbe feste Breite. Sonst rueckte der Titel,
   sobald der Heute-Knopf verschwindet oder der rechte Knopf von "Monat" auf
   "Woche" wechselt.

   Die Karte drumherum gehoert bewusst nicht dazu: in der Wochenansicht steht
   die Leiste allein in einer Karte, in der Monatsansicht teilt sie sich eine
   mit dem Raster. */

export function KalenderNavi({ titel, unter, zurueckLabel, vorLabel,
                              onZurueck, onVor, onHeute, heuteVersteckt,
                              ansichtLabel, onAnsicht }){
  return (
    <div class="kalnavi">
      <div class={'kalnavi-seite' + (heuteVersteckt ? ' leer' : '')}>
        <button class="btn tonal kalnavi-knopf" type="button" onClick={onHeute}>Heute</button>
      </div>
      <button class="iconbtn" type="button" aria-label={zurueckLabel}
        onClick={onZurueck}><span aria-hidden="true">‹</span></button>
      <div class="kalnavi-titel">
        <b>{titel}</b>
        {unter ? <span>{unter}</span> : null}
      </div>
      <button class="iconbtn" type="button" aria-label={vorLabel}
        onClick={onVor}><span aria-hidden="true">›</span></button>
      <div class="kalnavi-seite rechts">
        <button class="btn tonal kalnavi-knopf" type="button"
          onClick={onAnsicht}>{ansichtLabel}</button>
      </div>
    </div>
  );
}
