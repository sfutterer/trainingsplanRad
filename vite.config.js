import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

/* Die Seite liegt unter sfutterer.github.io/trainingsplanRad/, also in einem
   Unterpfad. Ohne base zeigen alle erzeugten Pfade ins Leere. */
/* Version und Baudatum kommen aus package.json in den Build. Ohne das muesste
   die Zahl an zwei Stellen gepflegt werden, und die Info-Seite zeigte irgendwann
   etwas anderes an als das, was ausgeliefert wurde. */
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  base: '/trainingsplanRad/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10))
  },
  plugins: [
    preact(),
    VitePWA({
      /* prompt statt autoUpdate: ein automatischer Reload mitten in einem
         laufenden Intervall waere ruinoes. Die App fragt stattdessen - und
         schweigt, solange ein Timer laeuft. */
      registerType: 'prompt',
      injectRegister: null,
      manifest: false,               // manifest.webmanifest liegt handgepflegt in public/
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,json,webmanifest}'],
        /* Workbox-Laufzeit in sw.js hineinschreiben statt per importScripts
           nachzuladen. Eine Datei weniger, ein Fehlerfall weniger - und bei
           dieser Groesse kostet es nichts. */
        inlineWorkboxRuntime: true,
        /* Der alte Service Worker war stale-while-revalidate: er lieferte
           index.html sofort aus dem Cache und aktualisierte im Hintergrund -
           man sah also immer den Stand vom vorletzten Start.

           Hier liegt index.html im Precache mit Revisionshash. Eine neue
           Fassung wird als Ganzes installiert und wartet; erst der Knopf im
           Update-Banner schaltet um. Kein halber Stand, kein Reload mitten im
           Intervall, und kein Ueberspringen einer Version. */
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        /* Das Profilbild kommt von Google und faellt damit nicht in den
           Precache. Ohne diese Regel steht oben rechts unterwegs immer nur der
           Ersatz aus Anfangsbuchstaben - und genau unterwegs ist die App
           offline. Ein Bild, das sich praktisch nie aendert, darf aus dem
           Cache kommen.

           statuses 0 mit aufnehmen: das Bild wird ohne CORS geladen, die
           Antwort ist deshalb opaque und traegt Status 0. Ohne den Eintrag
           landet nie etwas im Cache. */
        runtimeCaching: [{
          urlPattern: /^https:\/\/lh3\.googleusercontent\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'profilbilder',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] }
          }
        }]
      },
      devOptions: { enabled: false }
    })
  ],
  build: {
    target: 'es2020',
    sourcemap: true
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js']
  }
});
