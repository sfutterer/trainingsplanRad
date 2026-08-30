/* Top App Bar, Material 3.

   Links das Hamburgermenue, in der Mitte der Titel, rechts die Glocke mit dem
   Tagesueberblick und daneben das Profilbild. Die Hauptziele bleiben unten, wo
   der Daumen ist - oben stehen nur Dinge, die man selten und bewusst antippt.

   Das Profilbild steht ganz aussen rechts, wo es in jeder App steht. Die Stelle
   ist so eingeuebt, dass sie hier nichts erklaeren muss: wer wissen will,
   wessen Daten er vor sich hat, sieht als Erstes dorthin. */

import { vibrate } from '../../platform/index.js';
import { Icon } from './Icon.jsx';
import { Avatar } from './Avatar.jsx';

export function AppBar({ titel, onMenu, onGlocke, glockeAktiv, onProfil, profil, erhoben }){
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
      {/* Der Name gehoert in die Beschriftung und nicht nur ins Bild: fuer eine
          Sprachausgabe ist ein Kreis mit einem Foto sonst nichts weiter als
          "Schaltflaeche". */}
      <button class="iconbtn profilbtn"
        aria-label={profil ? 'Profil: ' + profil.name : 'Anmelden'}
        onClick={() => { vibrate(8); onProfil(); }}>
        <Avatar profil={profil} />
      </button>
    </header>
  );
}
