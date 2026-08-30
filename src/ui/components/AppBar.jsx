/* Top App Bar, Material 3.

   Links das Hamburgermenue, in der Mitte der Titel, rechts die Glocke mit dem
   Tagesueberblick. Die Hauptziele bleiben unten, wo der Daumen ist - oben
   stehen nur Dinge, die man selten und bewusst antippt. */

import { vibrate } from '../../platform/index.js';
import { Icon } from './Icon.jsx';

export function AppBar({ titel, onMenu, onGlocke, glockeAktiv, erhoben }){
  return (
    <header class={'appbar' + (erhoben ? ' erhoben' : '')}>
      <button class="iconbtn" aria-label="Menü öffnen" onClick={() => { vibrate(8); onMenu(); }}>
        <Icon name="menue" />
      </button>
      <h1 class="appbar-titel">{titel}</h1>
      <button class={'iconbtn' + (glockeAktiv ? ' an' : '')} aria-label="Was heute ansteht"
        onClick={() => { vibrate(8); onGlocke(); }}>
        <Icon name="glocke" />
      </button>
    </header>
  );
}
