/* Das gemeinsame Geruest der Trainingsbausteine.

   Vorher hatte jeder Baustein seinen eigenen Bauplan: der Rumpf begann mit dem
   Ring, Beweglichkeit und Koordination mit einer Infokarte und versteckten
   ihren Start am Ende der letzten Karte, der Beinblock hatte gar keinen. Die
   Hinweise standen mal oben, mal unten, mal beides. Wer zwischen den Segmenten
   wechselte, musste jedes Mal neu suchen, wo die Bedienung liegt.

   Deshalb dieselbe Reihenfolge fuer alle - und zwar erzwungen ueber
   Steckplaetze und nicht ueber Absprache:

     1  Kopf          Name, Dauer/Rhythmus, genau ein Status
     2  Buehne        Ring oder Dosis, Bild, Tastenreihe
     3  Inhalt        Uebungsliste, Protokoll, Raster
     4  Hinweise      die Regeln, die waehrend der Einheit gelten
     5  Schluss       Regeln und Einstellungen, immer zuletzt

   Ein Baustein darf Steckplaetze leer lassen (der Rumpf hat kein Protokoll,
   die Beweglichkeit keine Einstellungen, der neutrale Timer keine Hinweise aus
   dem Plan), aber er kann sie nicht umsortieren. Genau das war der Fehler der
   alten Fassung.

   Der Kopf bleibt leer, wo ueber dem Baustein schon die Segmentleiste seinen
   Namen traegt - also im ganzen Trainingsbereich. Dort stand er als zweite
   Nennung zwischen Wochenleiste und Buehne und nahm dem Ring und der
   Tastenreihe 52 px, die auf einem 375er Geraet fehlten: die Tasten rutschten
   unter die Navigationsleiste. Im Intervall- und im Testbereich bleibt er,
   denn dort nennt ihn sonst niemand - er traegt den Namen der heutigen
   Einheit.

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
          jeder Pixel, den er nimmt, fehlt dem Ring und der Tastenreihe. Als
          Karte mit Status darin schob er die Tastenreihe hinter die
          Navigationsleiste - deshalb traegt er nur noch Name und Dauer, und
          der Status steht unter der Buehne. Ohne `titel` faellt er ganz weg,
          samt seinem Abzug an der Hoehe der Buehne. */}
      {titel ? (
        <div class="bausteinkopf">
          <span>{titel}</span><b>{meta}</b>
        </div>
      ) : null}

      {buehne}
      {status}
      {children}

      {/* Hinweise sind Zeilen, keine Karte mehr. Die Karte hatte eine
          Kopfzeile ("Hinweise · aus dem Plan"), die nichts sagte, was die
          Saetze darunter nicht schon sagen, und einen Rahmen, der sie zu
          einem eigenen Abschnitt machte - bei der Kraft waren es damit
          sechzehn Absaetze Regeltext unter dem Ablauf.

          Was hier steht, ist jetzt eine Auswahl und keine Sammlung: nur
          Regeln, die waehrend der Einheit gelten. Alles, was erklaert, wann
          man trainiert oder was nicht protokolliert wird, steht im
          Trainingsplan und nicht auf dem Bildschirm, auf den man zwischen
          zwei Saetzen schaut. */}
      {saetze.length ? (
        <div class="merkzeilen">
          {saetze.map((t, i) => <p key={i}>{t}</p>)}
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
