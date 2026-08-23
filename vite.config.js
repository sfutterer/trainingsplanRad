import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

/* Die Seite liegt unter sfutterer.github.io/trainingsplanRad/, also in einem
   Unterpfad. Ohne base zeigen alle erzeugten Pfade ins Leere. */
export default defineConfig({
  base: '/trainingsplanRad/',
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
        cleanupOutdatedCaches: true
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
