/* Material 3 Navigation Bar.

   Unten, weil dort der Daumen ist. Fuenf Ziele sind die Obergrenze, die M3
   dafuer vorsieht - genau die Zahl, die dieser Plan braucht.

   Kein Header darueber: der Ort steht in der Navigation, der Platz gehoert
   dem Inhalt. Auf einem Handy ist die obere linke Ecke die am schlechtesten
   erreichbare Stelle des Bildschirms. */

import { vibrate } from '../../platform/index.js';

const ICONS = {
  heute: 'M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 7v10H5V9h14zM7 11h5v5H7v-5z',
  rumpf: 'M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z',
  intervalle: 'M15 1H9v2h6V1zm-3 21a9 9 0 0 0 7.03-14.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A9 9 0 1 0 12 22zm0-2a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm1-11h-2v6h2V9z',
  analyse: 'M5 21h2V9H5v12zm6 0h2V3h-2v18zm6 0h2v-8h-2v8z',
  plan: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h8v2H8v-2zm0 4h8v2H8v-2z'
};

const ZIELE = [
  { id: 'heute',      label: 'Heute' },
  { id: 'rumpf',      label: 'Rumpf' },
  { id: 'intervalle', label: 'Intervalle' },
  { id: 'analyse',    label: 'Analyse' },
  { id: 'plan',       label: 'Plan' }
];

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
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={ICONS[z.id]} />
            </svg>
          </span>
          <span class="label">{z.label}</span>
        </button>
      ))}
    </nav>
  );
}

export { ZIELE };
