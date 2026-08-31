/* Alle Zeichen der App an einer Stelle.

   Die Pfaddaten lagen in sieben Dateien verstreut, und drei davon trugen
   dieselben: der Schluessel fuer "Training" stand woertlich gleich in
   NavDrawer, in NavigationBar und noch einmal als SYMBOL.kraft in der
   Analyseliste. Wer eines geaendert haette, haette zwei uebersehen - und im
   Bundle lag er dreimal.

   Die Pfade sind auf ein 24er-Raster gezeichnet, wie Material Symbols. Sie
   erben ihre Farbe ueber currentColor und tragen kein eigenes Fuellen mit,
   damit sie in beiden Themes stimmen, ohne dass hier ein Farbwert steht.

   aria-hidden ist die Vorgabe: ein Zeichen steht in dieser App immer neben
   oder in einem Bedienelement, das seine eigene Beschriftung hat. Wo es
   allein steht, bekommt es mit `titel` eine.

   Bewusst keine Icon-Bibliothek: gebraucht werden fuenfundzwanzig Zeichen, und
   das kleinste taugliche Paket waere groesser als alle zusammen. */

/* Das Rad, einmal gezeichnet: es steht allein fuer die Grundlagenfahrt und
   verkleinert unter dem Kennzeichen der drei uebrigen Fahrten.

   Die Verkleinerung raeumt die obere linke Ecke frei, ohne dass das Rad aus
   dem Raster faellt: 0,81 von 24 sind 19,4, um 4,6 nach rechts unten
   geschoben liegt es wieder an der rechten unteren Kante. */
const RAD = 'M15.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm5.8-10 2.4-2.4.8.8a5.9 5.9 0 0 0 3.9 1.6V8.8a4.3 4.3 0 0 1-2.8-1.2l-1.9-1.9a1.9 1.9 0 0 0-2.7 0L7.7 8.2a1.9 1.9 0 0 0 0 2.7L10.5 14v5H12v-6.2l-1.2-2.3zM19 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z';
const RAD_KLEIN = 'translate(4.6 4.6) scale(0.81)';

const ICONS = {
  /* Bereiche - dieselben in der unteren Leiste und im Drawer. */
  plan: 'M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 7v10H5V9h14zM7 11h5v5H7v-5z',
  training: 'M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z',
  intervalle: 'M15 1H9v2h6V1zm-3 21a9 9 0 0 0 7.03-14.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A9 9 0 1 0 12 22zm0-2a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm1-11h-2v6h2V9z',
  analyse: 'M5 21h2V9H5v12zm6 0h2V3h-2v18zm6 0h2v-8h-2v8z',
  zonen: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13h-1.5v6l5.25 3.15.75-1.23-4.5-2.67z',
  about: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z',
  einstellungen: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z',

  /* Rahmen */
  menue: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  glocke: 'M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  schliessen: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  hilfe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26A1.96 1.96 0 0 0 12 7a2 2 0 0 0-2 2H8a4 4 0 1 1 8 0c0 .88-.36 1.68-.93 2.25z',
  weiter: 'M9.29 6.71 13.17 10.6 9.29 14.5l1.42 1.41L16 10.6 10.71 5.3z',
  zurueck: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z',
  /* Steht fuer "kein Profilbild" - ohne Anmeldung und wenn das Bild von
     Google nicht laedt. */
  person: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-3.34 0-10 1.67-10 5v3h20v-3c0-3.33-6.66-5-10-5z',

  /* Analyse */
  temperatur: 'M15 13V5a3 3 0 0 0-6 0v8a5 5 0 1 0 6 0zm-3-9c.6 0 1 .4 1 1v9.6a3 3 0 1 1-2 0V5c0-.6.4-1 1-1z',
  feuchte: 'M12 2.7C12 2.7 6 9.4 6 14a6 6 0 0 0 12 0c0-4.6-6-11.3-6-11.3zm0 17.3a4 4 0 0 1-4-4c0-2.6 2.7-6.4 4-8.1 1.3 1.7 4 5.5 4 8.1a4 4 0 0 1-4 4z',
  regen: 'M17.7 8.5A6 6 0 0 0 6.3 7.2 4.5 4.5 0 0 0 7 16h10.4a3.8 3.8 0 0 0 .3-7.5zM8.4 17.6l-1.2 3.1 1.4.5 1.2-3.1zm3.6 0-1.2 3.1 1.4.5 1.2-3.1zm3.6 0-1.2 3.1 1.4.5 1.2-3.1z',

  /* Die Einheitsarten - je Art ein eigenes Zeichen, siehe Einheitssymbol.jsx.

     Drei davon sind Radfahrten und tragen deshalb dasselbe Rad wie die
     Grundlagenfahrt. Die erste Fassung hatte fuer sie nur das Kennzeichen
     gezeichnet - Balken fuer die Intervalle, Berge fuer die lange Ausfahrt,
     Ring fuer den Test -, und damit sah man den Einheiten nicht mehr an, dass
     ueberhaupt gefahren wird. Das Rad ist die Gemeinsamkeit; unterschieden
     wird durch ein Kennzeichen in der freien oberen linken Ecke.

     Das Rad steht dafuer als eigene Konstante und wird verkleinert eingesetzt,
     statt drei Mal abgeschrieben zu werden: eine Aenderung an der Zeichnung
     erreicht sonst nur eine der vier Fahrten. Der Platz oben links ist im Rad
     ohnehin leer - Rahmen und Sattel steigen nach rechts -, das Kennzeichen
     ueberdeckt also nichts.

     Fuer Rumpf und Kraft steht 'training' weiter oben; Ruhetag, lockerer Tag
     und Fremdes stehen darunter und sind keine Fahrten. */
  rad: RAD,
  /* Intervalle: hohe und niedrige Balken, Belastung und Pause. Bewusst nicht
     die Stoppuhr aus der unteren Leiste - die steht dort fuer den Bereich
     Intervalle, also fuer ein Werkzeug, nicht fuer eine Einheit. */
  radIntervalle: [
    { d:'M0.4 5.6h2.4v4.8H0.4zM4 0.8h2.4v9.6H4zM7.6 5.6H10v4.8H7.6z' },
    { d: RAD, transform: RAD_KLEIN }
  ],
  /* Lange Ausfahrt: zwei Gipfel - die Runde, fuer die man den Tag braucht. */
  radLang: [
    { d:'M0 10.4h10.4L7 3.4 4.7 7.1 3.2 5.1 0 10.4z' },
    { d: RAD, transform: RAD_KLEIN }
  ],
  /* Schwellentest: Ring und Scheibe - die Fahrt, an der gemessen wird. */
  radTest: [
    { d:'M5.2 0.2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0-4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z' },
    { d: RAD, transform: RAD_KLEIN }
  ],
  /* Ruhetag */
  mond: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z',
  /* Frei oder locker: halb Ruhetag, halb Fahrt. */
  halbmond: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-15a7 7 0 0 1 0 14z',
  /* Alles, was der Plan nicht kennt - ein Lauf, eine Schwimmeinheit. */
  blitz: 'M13 2 4 14h6l-1 8 9-12h-6l1-8z',

  /* Platzhalter, wenn ein Uebungsbild fehlt */
  bild: 'M21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zm-2 0H5v14h14V5zM7 17l3.5-4.5 2.5 3 3.5-4.5L19 17H7z'
};

/* Ein Zeichen ist entweder eine Bahn oder eine Liste aus Bahnen mit
   Verschiebung. Die Liste gibt es erst, seit drei Zeichen dasselbe Rad tragen -
   fuer die uebrigen zweiundzwanzig bleibt die Zeichenkette, damit nicht jedes
   Zeichen die Form des einen Sonderfalls annehmen muss. */
export function Icon({ name, titel, klasse }){
  const d = ICONS[name];
  if(!d) return null;
  const bahnen = Array.isArray(d) ? d : [{ d }];
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" class={klasse}
      role={titel ? 'img' : undefined} aria-label={titel}
      aria-hidden={titel ? undefined : 'true'}>
      {bahnen.map((b, i) => <path key={i} d={b.d} transform={b.transform} />)}
    </svg>
  );
}
