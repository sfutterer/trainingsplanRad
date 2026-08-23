import { render } from 'preact';
import './ui/theme.css';
import './ui/app.css';
import { App } from './App.jsx';
import { boot } from './state/store.js';
import { registerNoSleepVideo } from './platform/index.js';
import { registerSW } from 'virtual:pwa-register';

registerNoSleepVideo(document.getElementById('noSleepVideo'));

/* Update-Hinweis statt automatischem Neuladen: ein Reload mitten im Intervall
   waere ruinoes. Der Knopf erscheint, die Entscheidung bleibt beim Nutzer. */
export const swUpdate = { ready: null };
if(location.protocol.startsWith('http')){
  swUpdate.ready = registerSW({
    onNeedRefresh(){ window.dispatchEvent(new CustomEvent('app-update-verfuegbar')); }
  });
}

boot().then(() => render(<App />, document.getElementById('app')));
