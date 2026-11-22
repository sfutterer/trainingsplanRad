import { render } from 'preact';
import './ui/theme.css';
import './ui/app.css';
import { App } from './App.jsx';
import { boot } from './state/store.js';
import { registerNoSleepVideo } from './platform/index.js';
import { registerSW } from 'virtual:pwa-register';
import { setUpdater } from './state/update.js';

registerNoSleepVideo(document.getElementById('noSleepVideo'));

/* Update-Hinweis statt automatischem Neuladen: ein Reload mitten im Intervall
   waere ruinoes. Der Knopf erscheint, die Entscheidung bleibt beim Nutzer.

   Der Rueckgabewert von registerSW ist die Umschaltfunktion und wird
   gebraucht - ein blosser Reload laesst den alten Service Worker am Ruder.
   Begruendung in state/update.js. */
if(location.protocol.startsWith('http')){
  setUpdater(registerSW({
    onNeedRefresh(){ window.dispatchEvent(new CustomEvent('app-update-verfuegbar')); }
  }));
}

boot().then(() => render(<App />, document.getElementById('app')));
