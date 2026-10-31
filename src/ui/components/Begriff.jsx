/* Ein Begriff, der sich erklären lässt.

   Antippbar, die Erklärung kommt als Sheet. Der Text steht in
   domain/glossar.js - hier ist nur die Bedienung.

   Ein <button> und kein <span> mit onClick: das Ding ist bedienbar, also
   gehört es in die Tabreihenfolge und braucht eine Rolle, die der
   Screenreader kennt. Die gepunktete Linie darunter ist das Versprechen, dass
   ein Tipp etwas tut - ohne sie sieht es aus wie fett gesetzter Text.

   Jeder Begriff hält seinen eigenen Zustand. Zwei gleichzeitig offene Sheets
   gibt es nicht, und ein gemeinsamer Zustand im Elternteil hiesse, dass jede
   Karte ihn durchreichen muss, nur damit ein Wort anklickbar ist. */

import { useState } from 'preact/hooks';
import { begriff } from '../../domain/glossar.js';
import { Sheet } from './Sheet.jsx';

export function Begriff({ id, children }){
  const [offen, setOffen] = useState(false);
  const b = begriff(id);
  /* Einen Begriff, den das Glossar nicht kennt, einfach stehen lassen -
      lieber ein Wort ohne Erklärung als ein Knopf, der ein leeres Sheet
      öffnet. */
  if(!b) return <>{children}</>;

  return (
    <>
      <button type="button" class="begriff" onClick={() => setOffen(true)}>
        {children || b.titel}
      </button>
      {offen && (
        <Sheet onClose={() => setOffen(false)} labelledBy={'begriff-' + id}>
          <h3 id={'begriff-' + id}>{b.titel}</h3>
          <p>{b.text}</p>
          <button class="btn block" onClick={() => setOffen(false)}>Schließen</button>
        </Sheet>
      )}
    </>
  );
}
