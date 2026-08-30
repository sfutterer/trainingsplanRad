/* Der eine Rueckfragedialog der App. Haengt im Rahmen, so wie die Snackbar,
   und zeigt sich, sobald bestaetige() etwas fragt.

   Der bestaetigende Knopf steht links und traegt bei gefaehrlichen Fragen die
   Warnfarbe; Abbrechen steht rechts und ist unbetont. Das ist die Reihenfolge
   der uebrigen Tastenreihen dieser App - die Haupthandlung liegt nicht am
   Zeilenende. */

import { frage, antworte } from '../../state/dialog.js';
import { Sheet } from './Sheet.jsx';

export function Bestaetigung(){
  const f = frage.value;
  if(!f) return null;
  return (
    <Sheet onClose={() => antworte(false)} labelledBy="bestaetigung-titel">
      <h3 id="bestaetigung-titel">{f.titel}</h3>
      {f.text && <p class="hint">{f.text}</p>}
      <div class="buttons">
        <button class={'btn' + (f.gefahr ? ' gefahr' : '')}
          onClick={() => antworte(true)}>{f.jaLabel}</button>
        <button class="btn secondary" onClick={() => antworte(false)}>{f.neinLabel}</button>
      </div>
    </Sheet>
  );
}
