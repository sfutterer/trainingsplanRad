/* Navigation Drawer, Material 3.

   Enthaelt alle Bereiche - auch die, die unten keinen Platz haben. Die untere
   Leiste traegt die vier Ziele des Trainings, hier steht der Rest: Zonen und
   Werte, Einstellungen.

   Schliesst ueber die Zurueck-Geste, den Klick daneben und die Auswahl. */

import { useEffect } from 'preact/hooks';
import { vibrate } from '../../platform/index.js';

const ICONS = {
  plan: 'M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 7v10H5V9h14zM7 11h5v5H7v-5z',
  kraft: 'M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z',
  intervalle: 'M15 1H9v2h6V1zm-3 21a9 9 0 0 0 7.03-14.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A9 9 0 1 0 12 22zm0-2a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm1-11h-2v6h2V9z',
  analyse: 'M5 21h2V9H5v12zm6 0h2V3h-2v18zm6 0h2v-8h-2v8z',
  zonen: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13h-1.5v6l5.25 3.15.75-1.23-4.5-2.67z',
  about: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z',
  einstellungen: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z'
};

export const DRAWER_GRUPPEN = [
  { titel: 'Training', ziele: [
    { id: 'plan',       label: 'Plan' },
    { id: 'kraft',      label: 'Kraft' },
    { id: 'intervalle', label: 'Intervalle' },
    { id: 'analyse',    label: 'Analyse' }
  ]},
  { titel: 'Werte', ziele: [
    { id: 'zonen',      label: 'Zonen & Schwellenwerte' }
  ]},
  { titel: null, ziele: [
    { id: 'einstellungen', label: 'Einstellungen' },
    { id: 'about',         label: 'Über die App' }
  ]}
];

export function NavDrawer({ offen, aktiv, onSelect, onClose }){
  useEffect(() => {
    if(!offen) return;
    const aufTaste = e => { if(e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', aufTaste);
    return () => document.removeEventListener('keydown', aufTaste);
  }, [offen, onClose]);

  return (
    <div class={'drawer-wrap' + (offen ? ' offen' : '')} aria-hidden={offen ? 'false' : 'true'}>
      <div class="drawer-schleier" onClick={onClose}></div>
      <nav class="drawer" aria-label="Alle Bereiche">
        <div class="drawer-kopf">
          <div class="drawer-app">Trainingsplan</div>
          <div class="drawer-sub">Radfahren</div>
        </div>
        {DRAWER_GRUPPEN.map((g, gi) => (
          <div class="drawer-gruppe" key={gi}>
            {g.titel && <div class="drawer-gruppentitel">{g.titel}</div>}
            {g.ziele.map(z => (
              <button key={z.id}
                class={'drawer-item' + (aktiv === z.id ? ' an' : '')}
                aria-current={aktiv === z.id ? 'page' : undefined}
                onClick={() => { vibrate(8); onSelect(z.id); }}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={ICONS[z.id]} /></svg>
                <span>{z.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}
