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

/* Die Zahl an der Glocke.

   Ueber neun wird nicht weitergezaehlt: die genaue Menge aendert nichts an dem,
   was man tut - man tippt drauf -, und eine zweistellige Zahl sprengt den
   Kreis. Die Beschriftung nennt sie trotzdem vollstaendig, dort kostet sie
   keinen Platz. */
function Meldungszahl({ anzahl }){
  if(!anzahl) return null;
  return <span class="glockenzahl" aria-hidden="true">{anzahl > 9 ? '9+' : anzahl}</span>;
}

function glockenLabel(anzahl){
  if(!anzahl) return 'Was heute ansteht';
  return anzahl === 1 ? 'Eine neue Meldung' : anzahl + ' neue Meldungen';
}

export function AppBar({ titel, onMenu, onGlocke, glockeAktiv, meldungen, onProfil, profil, erhoben }){
  return (
    <header class={'appbar' + (erhoben ? ' erhoben' : '')}>
      <button class="iconbtn" aria-label="Menü öffnen" onClick={() => { vibrate(8); onMenu(); }}>
        <Icon name="menue" />
      </button>
      <h1 class="appbar-titel">{titel}</h1>
      {/* Die Zahl liegt im Knopf und nicht daneben: sie gehoert zu ihm, und ein
          eigenes Element neben der Taste haette entweder die Trefferflaeche
          zerteilt oder die Leiste breiter gemacht. */}
      <button class={'iconbtn glocke' + (glockeAktiv ? ' an' : '') + (meldungen ? ' meldet' : '')}
        aria-label={glockenLabel(meldungen)}
        onClick={() => { vibrate(8); onGlocke(); }}>
        <Icon name="glocke" />
        <Meldungszahl anzahl={meldungen} />
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
