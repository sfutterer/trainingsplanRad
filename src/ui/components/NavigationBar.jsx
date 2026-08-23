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
  einstellungen: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z'
};

const ZIELE = [
  { id: 'heute',      label: 'Heute' },
  { id: 'rumpf',      label: 'Rumpf' },
  { id: 'intervalle', label: 'Intervalle' },
  { id: 'analyse',    label: 'Analyse' },
  /* Kurzes Etikett: bei fuenf Zielen bleiben auf einem 375-px-Bildschirm
     rund 75 px je Eintrag, "Einstellungen" wuerde abgeschnitten. Das Zahnrad
     traegt die Bedeutung, die Ueberschrift auf der Seite nennt sie voll aus. */
  { id: 'einstellungen', label: 'Optionen' }
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
