/* Die Blaetterleiste ueber Wochen- und Monatsansicht.

   Stand zweimal woertlich da - einmal in PlanTab, einmal in Monatsansicht.
   Beide bauen dieselben fuenf Elemente in derselben Reihenfolge, und der
   einzige Unterschied ist, was "eine weiter" bedeutet und was in der Mitte
   steht.

   Der unsichtbare Zwilling des Heute-Knopfs rechts ist der Grund, warum das
   ueberhaupt eine eigene Datei verdient: er spiegelt die Breite, damit der
   Titel mittig bleibt und die Karte beim Blaettern nicht springt. Diese
   Begruendung stand bisher nur in plan.css, waehrend das Markup dazu an zwei
   Stellen lag - wer eine davon anfasste, konnte die andere nicht sehen.

   Die Karte drumherum gehoert bewusst nicht dazu: in der Wochenansicht steht
   die Leiste allein in einer Karte, in der Monatsansicht teilt sie sich eine
   mit dem Raster. */

export function KalenderNavi({ titel, unter, zurueckLabel, vorLabel,
                              onZurueck, onVor, onHeute, heuteVersteckt }){
  return (
    <div class="kalnavi">
      <div class={'kalnavi-heute' + (heuteVersteckt ? ' leer' : '')}>
        <button class="btn tonal heute-sprung" type="button" onClick={onHeute}>Heute</button>
      </div>
      <button class="iconbtn" type="button" aria-label={zurueckLabel}
        onClick={onZurueck}><span aria-hidden="true">‹</span></button>
      <div class="kalnavi-titel">
        <b>{titel}</b>
        {unter ? <span>{unter}</span> : null}
      </div>
      <button class="iconbtn" type="button" aria-label={vorLabel}
        onClick={onVor}><span aria-hidden="true">›</span></button>
      {/* Nur fuer die Breite. visibility:hidden nimmt ihn aus Tabreihenfolge
          und Vorlesebaum, die beiden Attribute sagen es zusaetzlich. */}
      <div class="kalnavi-heute spiegel" aria-hidden="true">
        <button class="btn tonal heute-sprung" type="button" tabIndex={-1}>Heute</button>
      </div>
    </div>
  );
}
