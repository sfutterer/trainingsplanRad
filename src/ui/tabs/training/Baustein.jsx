/* Das gemeinsame Geruest der vier Trainingsbausteine.

   Vorher hatte jeder Baustein seinen eigenen Bauplan: der Rumpf begann mit dem
   Ring, Beweglichkeit und Koordination mit einer Infokarte und versteckten
   ihren Start am Ende der letzten Karte, der Beinblock hatte gar keinen. Die
   Hinweise standen mal oben, mal unten, mal beides. Wer zwischen den Segmenten
   wechselte, musste jedes Mal neu suchen, wo die Bedienung liegt.

   Deshalb dieselbe Reihenfolge fuer alle vier - und zwar erzwungen ueber
   Steckplaetze und nicht ueber Absprache:

     1  Kopf          Name, Dauer/Rhythmus, genau ein Status
     2  Buehne        Ring oder Dosis, Bild, Tastenreihe
     3  Inhalt        Uebungsliste, Protokoll, Raster
     4  Hinweise      alle Saetze aus dem Plan, gesammelt
     5  Schluss       Regeln und Einstellungen, immer zuletzt

   Ein Baustein darf Steckplaetze leer lassen (der Rumpf hat kein Protokoll,
   die Beweglichkeit keine Einstellungen), aber er kann sie nicht umsortieren.
   Genau das war der Fehler der alten Fassung.

   Zwei Regeln stecken in den Steckplaetzen selbst: der Status ist einer und
   nicht drei - was mehr ist, ist ein Hinweis und gehoert nach unten. Und
   Regeln und Einstellungen stehen zuletzt, weil man sie einmal setzt und
   danach nicht mehr ansieht; die Freischaltregel der Koordination stand
   bisher mitten im Weg. */


export function Baustein({ titel, meta, status, buehne, hinweise, schluss, children }){
  const saetze = (hinweise || []).filter(Boolean);
  return (
    <>
      {/* Der Kopf ist eine Zeile und keine Karte: er steht ueber der Buehne und
          jeder Pixel, den er nimmt, fehlt dem Ring und dem Uebungsbild. Als
          Karte mit Status darin schob er die Tastenreihe hinter die
          Navigationsleiste - deshalb traegt er nur noch Name und Dauer, und
          der Status steht unter der Buehne. */}
      <div class="bausteinkopf">
        <span>{titel}</span><b>{meta}</b>
      </div>

      {buehne}
      {status}
      {children}

      {saetze.length ? (
        <div class="card">
          <div class="row"><span>Hinweise</span><b>aus dem Plan</b></div>
          {saetze.map((t, i) => <p class="hint" key={i}>{t}</p>)}
        </div>
      ) : null}

      {schluss}
    </>
  );
}

/* Eine Zeilenform fuer alle vier Uebungslisten.

   Vorher gab es drei: einzeilig mit Ziel rechts im Zirkel, zweizeilig mit
   Dosierung und Fokus bei Beweglichkeit und Koordination, ein Raster mit
   Eingabefeldern im Beinblock. Die Dosierung ist in allen vier Bausteinen die
   eigentliche Anweisung - sie steht deshalb ueberall an derselben Stelle,
   unter dem Namen und in der Textfarbe.

   Das Eingaberaster des Beinblocks bleibt, aber als Protokoll unter der Liste
   und nicht als Ersatz fuer sie. */
export function Uebungsliste({ uebungen, aktiv, onOpen }){
  return (
    <div class="exlist koerperliste">
      {uebungen.map((ex, i) => (
        <button class={'exrow' + (aktiv === i ? ' aktiv' : '')} key={ex.key || ex.name}
          onClick={() => onOpen(i)}>
          <span class="exname">
            {i + 1}. {ex.name}
            <small><b>{ex.dosis}</b>{ex.fokus ? ' · ' + ex.fokus : ''}</small>
          </span>
          <span class="ziel">{ex.rechts || '›'}</span>
        </button>
      ))}
    </div>
  );
}
