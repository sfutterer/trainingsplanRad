/* Die Snackbar selbst. Sitzt ueber der Navigationsleiste, damit sie nichts
   verdeckt, was man antippen will, und traegt ein Kreuz - eine Meldung, die man
   gelesen hat, soll man wegwischen koennen, statt auf sie zu warten. */

import { meldung, meldungWeg } from '../../state/snackbar.js';
import { Icon } from './Icon.jsx';

export function Snackbar(){
  const m = meldung.value;
  if(!m) return null;
  return (
    <div class="snackbar" role="status" aria-live="polite" key={m.nr}>
      <span>{m.text}</span>
      <button class="snackzu" aria-label="Meldung schließen" onClick={meldungWeg}>
        <Icon name="schliessen" />
      </button>
    </div>
  );
}
