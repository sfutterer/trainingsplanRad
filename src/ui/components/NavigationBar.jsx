/* Material 3 Navigation Bar.

   Unten, weil dort der Daumen ist. Fuenf Ziele sind die Obergrenze, die M3
   dafuer vorsieht - genau die Zahl, die dieser Plan braucht.

   Kein Header darueber: der Ort steht in der Navigation, der Platz gehoert
   dem Inhalt. Auf einem Handy ist die obere linke Ecke die am schlechtesten
   erreichbare Stelle des Bildschirms. */

import { vibrate } from '../../platform/index.js';
import { BEREICHE, HAUPTZIELE } from '../../state/navigation.js';
import { Icon } from './Icon.jsx';

/* Vier Ziele unten - die Bereiche, die waehrend des Trainings gebraucht
   werden. Alles Seltenere steht im Drawer. Die Etiketten muessen bei 375 px
   in rund 93 px passen, also ein Wort je Ziel - und ueberall dasselbe Wort:
   im Drawer und in der Titelzeile steht kein laengerer Name mehr.

   Genau deshalb kommen die Namen aus navigation.js und stehen nicht noch
   einmal hier: sie standen frueher in drei Listen, und "ueberall dasselbe
   Wort" war eine Absprache statt einer Tatsache. */
const ZIELE = HAUPTZIELE.map(id => ({ id, label: BEREICHE[id] }));

function ripple(ev){
  const host = ev.currentTarget.querySelector('.pill');
  if(!host) return;
  const r = host.getBoundingClientRect();
  const el = document.createElement('span');
  el.className = 'ripple';
  const d = Math.max(r.width, r.height);
  el.style.width = el.style.height = d + 'px';
  el.style.left = (ev.clientX - r.left - d / 2) + 'px';
  el.style.top  = (ev.clientY - r.top  - d / 2) + 'px';
  host.appendChild(el);
  setTimeout(() => el.remove(), 500);
}

export function NavigationBar({ active, onSelect }){
  return (
    <nav class="navbar" role="tablist" aria-label="Bereiche">
      {ZIELE.map(z => (
        <button
          key={z.id}
          class="navitem"
          role="tab"
          aria-selected={active === z.id ? 'true' : 'false'}
          onPointerDown={ripple}
          onClick={() => { vibrate(8); onSelect(z.id); }}
        >
          <span class="pill">
            <Icon name={z.id} />
          </span>
          <span class="label">{z.label}</span>
        </button>
      ))}
    </nav>
  );
}

export { ZIELE };
