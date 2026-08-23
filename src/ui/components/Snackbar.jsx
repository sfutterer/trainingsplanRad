/* Die Snackbar selbst. Sitzt ueber der Navigationsleiste, damit sie nichts
   verdeckt, was man antippen will, und traegt ein Kreuz - eine Meldung, die man
   gelesen hat, soll man wegwischen koennen, statt auf sie zu warten. */

import { meldung, meldungWeg } from '../../state/snackbar.js';

export function Snackbar(){
  const m = meldung.value;
  if(!m) return null;
  return (
    <div class="snackbar" role="status" aria-live="polite" key={m.nr}>
      <span>{m.text}</span>
      <button class="snackzu" aria-label="Meldung schließen" onClick={meldungWeg}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  );
}
