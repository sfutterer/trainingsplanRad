/* Meldet eine neue Fassung - aber nicht, solange ein Timer laeuft.

   Der alte Service Worker war stale-while-revalidate und lieferte immer den
   vorletzten Stand aus; die neue Fassung fragt stattdessen. Ein automatischer
   Reload mitten in einem Intervall waere ruinoes. */

import { useEffect, useState } from 'preact/hooks';
import { timerLaeuft } from '../../state/timerState.js';

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
      <span style="flex:1">Eine neue Fassung der App liegt bereit.</span>
      <button class="btn" onClick={() => location.reload()}>Neu laden</button>
      <button class="btn secondary" onClick={() => setOffen(false)}>Später</button>
    </div>
  );
}
