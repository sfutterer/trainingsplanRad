/* Meldet eine neue Fassung - aber nicht, solange ein Timer laeuft.

   Der alte Service Worker war stale-while-revalidate und lieferte immer den
   vorletzten Stand aus; die neue Fassung fragt stattdessen. Ein automatischer
   Reload mitten in einem Intervall waere ruinoes.

   Der Knopf schaltet wirklich um. Bis zum 22.11.2026 rief er nur
   location.reload(), und das reicht bei registerType 'prompt' nicht: der
   wartende Service Worker bekam nie die Nachricht, zu uebernehmen, und die
   App zeigte nach dem Neuladen denselben Stand wie davor. */

import { useEffect, useState } from 'preact/hooks';
import { timerLaeuft } from '../../state/timerState.js';
import { updateAnwenden } from '../../state/update.js';

export function UpdateBanner(){
  const [offen, setOffen] = useState(false);

  useEffect(() => {
    const on = () => setOffen(true);
    window.addEventListener('app-update-verfuegbar', on);
    return () => window.removeEventListener('app-update-verfuegbar', on);
  }, []);

  if(!offen || timerLaeuft.value) return null;

  return (
    <div class="banner" role="status">
      <span>Eine neue Fassung der App liegt bereit.</span>
      {/* updateAnwenden statt location.reload(): ein Reload allein laesst den
          alten Service Worker weiterlaufen, und die App zeigt danach denselben
          Stand. Begruendung in state/update.js. */}
      <button class="btn" onClick={() => updateAnwenden()}>Neu laden</button>
      <button class="btn secondary" onClick={() => setOffen(false)}>Später</button>
    </div>
  );
}
