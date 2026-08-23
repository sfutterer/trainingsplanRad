/* Bausteine fuer eine Einstellungsseite nach Android-Muster.

   Kein Kartenstapel: Android-Einstellungen sind eine durchgehende Liste mit
   Gruppenueberschriften. Jede Zeile traegt einen Titel und darunter den
   aktuellen Wert - nicht eine Erklaerung. Die Begruendung steht hinter dem
   Fragezeichen, wo sie stoert, wenn man sie will, und schweigt, wenn nicht.

   Das ist der eigentliche Unterschied: vorher stand unter jeder Zeile ein
   Absatz Fliesstext. Beim zehnten Mal liest den niemand mehr, aber er
   verlaengert die Seite auf das Dreifache. */

import { useState } from 'preact/hooks';

export function Gruppe({ titel, children }){
  return (
    <section class="sgruppe">
      {titel && <h2 class="sgruppe-titel">{titel}</h2>}
      <div class="sliste">{children}</div>
    </section>
  );
}

export function Zeile({ titel, wert, hilfe, onClick, rechts, disabled }){
  const [offen, setOffen] = useState(false);
  const klickbar = !!onClick && !disabled;
  return (
    <>
      <div class={'szeile' + (klickbar ? ' klickbar' : '') + (disabled ? ' aus' : '')}
           onClick={klickbar ? onClick : undefined}
           role={klickbar ? 'button' : undefined}
           tabIndex={klickbar ? 0 : undefined}
           onKeyDown={klickbar ? (e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); onClick(); } }) : undefined}>
        <div class="szeile-text">
          <div class="szeile-titel">{titel}</div>
          {wert != null && wert !== '' && <div class="szeile-wert">{wert}</div>}
        </div>
        {rechts}
        {hilfe && (
          <button class="hilfebtn" aria-label={'Erklärung zu ' + titel} aria-expanded={offen ? 'true' : 'false'}
            onClick={e => { e.stopPropagation(); setOffen(o => !o); }}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26A1.96 1.96 0 0 0 12 7a2 2 0 0 0-2 2H8a4 4 0 1 1 8 0c0 .88-.36 1.68-.93 2.25z" />
            </svg>
          </button>
        )}
      </div>
      {hilfe && offen && <div class="shilfe">{hilfe}</div>}
    </>
  );
}

export function Schalter({ titel, wert, hilfe, an, onChange }){
  return (
    <Zeile titel={titel} wert={wert} hilfe={hilfe}
      onClick={() => onChange(!an)}
      rechts={
        <span class={'switch' + (an ? ' an' : '')} role="switch" aria-checked={an ? 'true' : 'false'} aria-label={titel}>
          <span class="knopf"></span>
        </span>
      } />
  );
}
