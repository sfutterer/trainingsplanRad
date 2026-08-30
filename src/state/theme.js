/* Theme: System, Hell oder Dunkel.

   "System" ist die Vorgabe und setzt kein Attribut - dann entscheidet
   prefers-color-scheme, also die Android-Einstellung. Eine ausdrueckliche
   Wahl setzt data-theme auf der Wurzel und schlaegt das System.

   Die Statusleiste im Standalone-Modus haengt an theme-color. Bei fester Wahl
   muessen die media-Varianten weg, sonst faerbt Android weiter nach System. */

import { signal, effect } from '@preact/signals';

export const THEMES = [
  { id: 'system', label: 'System' },
  { id: 'light',  label: 'Hell' },
  { id: 'dark',   label: 'Dunkel' }
];

/* Muss mit --bg in theme.css uebereinstimmen - sonst hat die Statusleiste
   eine andere Farbe als die Seite darunter. */
const GROUND = { light: '#f6f7f8', dark: '#121316' };

export const theme = signal('system');

function setzeStatusleiste(wahl){
  const kopf = document.head;
  kopf.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
  const meta = (content, media) => {
    const m = document.createElement('meta');
    m.name = 'theme-color';
    m.content = content;
    if(media) m.media = media;
    kopf.appendChild(m);
  };
  if(wahl === 'system'){
    meta(GROUND.light, '(prefers-color-scheme: light)');
    meta(GROUND.dark,  '(prefers-color-scheme: dark)');
  } else {
    meta(GROUND[wahl]);
  }
}

function applyTheme(wahl){
  const w = THEMES.some(t => t.id === wahl) ? wahl : 'system';
  if(w === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', w);
  setzeStatusleiste(w);
}

/* Anwenden, sobald sich das Signal aendert - auch beim ersten Setzen. */
effect(() => applyTheme(theme.value));
