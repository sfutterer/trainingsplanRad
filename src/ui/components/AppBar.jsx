/* Top App Bar, Material 3.

   Links das Hamburgermenue, in der Mitte der Titel, rechts die Glocke mit dem
   Tagesueberblick. Die Hauptziele bleiben unten, wo der Daumen ist - oben
   stehen nur Dinge, die man selten und bewusst antippt. */

import { vibrate } from '../../platform/index.js';

export function AppBar({ titel, onMenu, onGlocke, glockeAktiv, erhoben }){
  return (
    <header class={'appbar' + (erhoben ? ' erhoben' : '')}>
      <button class="iconbtn" aria-label="Menü öffnen" onClick={() => { vibrate(8); onMenu(); }}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </button>
      <h1 class="appbar-titel">{titel}</h1>
      <button class={'iconbtn' + (glockeAktiv ? ' an' : '')} aria-label="Was heute ansteht"
        onClick={() => { vibrate(8); onGlocke(); }}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
      </button>
    </header>
  );
}
