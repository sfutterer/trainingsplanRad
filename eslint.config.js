/* Linter-Regeln.

   Das Projekt hatte bis zum 29.08.2026 keinen. Die Formatierung war trotzdem
   durchgehend einheitlich - das spricht fuer die Disziplin, haelt aber nicht,
   sobald jemand anderes beitraegt.

   Die eigentliche Regel, um die es geht, ist react-hooks/exhaustive-deps.
   Mehrere useEffect haben hier bewusst unvollstaendige Abhaengigkeitslisten:
   der Beinblock haengt nur an der Zelle, die Fahrtauswertung nur an der
   Aktivitaets-ID, die Timer nur an der Stimme. Die sind alle begruendet - aber
   begruendet gehoert als eslint-disable-next-line mit Grund dokumentiert, nicht
   als stille Auslassung, die man von einem Versehen nicht unterscheiden kann.
   Deshalb steht sie auf "warn" und nicht auf "off": sie soll sichtbar bleiben.

   Bewusst keine Formatierungsregeln: dafuer sorgt .editorconfig, und ein
   Formatierer, der ueber gewachsenen Code laeuft, macht aus einem Review eine
   Rauschwolke. Hier stehen nur Regeln, die Fehler finden.

   Preact statt React: die JSX-Laufzeit heisst anders, deshalb wird die
   React-spezifische Komponentenpruefung nicht gebraucht. Die Hook-Regeln
   gelten dagegen unveraendert, weil Preact dieselbe Hook-Mechanik hat. */

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';

export default [
  {
    ignores: ['dist/**', 'dev-dist/**', 'node_modules/**']
  },

  /* Die Domaene und die Datenschicht laufen auch in Node - dort gibt es kein
     window. Was hier zu viel deklariert waere, faellt in den Bloecken darunter
     wieder weg. */
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: { 'react-hooks': reactHooks, react },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      /* Ohne diese Regel haelt no-unused-vars jede Komponente fuer unbenutzt:
         eine Verwendung als <Baustein /> zaehlt fuer den Linter sonst nicht
         als Referenz. */
      'react/jsx-uses-vars': 'error',

      /* Das Gegenstueck, und der wichtigere der beiden: no-undef aus dem Kern
         sieht eine vergessene Einfuhr in JSX nicht. <Zahlenfeld /> ist fuer
         den Parser ein JSXIdentifier und kein Identifier, die Regel greift
         also gar nicht - der Fehler faellt erst zur Laufzeit auf, und dann als
         leerer Bereich. Genau so ist er beim Umbau des Intervall-Timers
         entstanden und erst im Browser aufgefallen. */
      'react/jsx-no-undef': 'error',

      /* Die eigentliche Ausbeute: ein Tippfehler in einem Bezeichner ist genau
         der Fehler, der in analysis.js jahrelang unbemerkt lag (EXERCISES). */
      'no-undef': 'error',

      /* Auf warn, damit die begruendeten Auslassungen sichtbar bleiben, ohne
         den Build zu blockieren - siehe Dateikopf. */
      'react-hooks/exhaustive-deps': 'warn',

      /* Ein leerer catch ist hier Absicht und kein Versehen: jede
         Plattformfaehigkeit darf ausfallen, ohne die App zu brechen. Die
         Regel bleibt aktiv, erlaubt aber den kommentierten Fall. */
      'no-empty': ['error', { allowEmptyCatch: true }],

      /* Im JSX-Text stehen geschuetzte Leerzeichen (U+00A0), und zwar mit
         Absicht: zwischen Zahl und Einheit gehoert im Deutschen eines hin, und
         auf einem Handy bricht die Zeile sonst zwischen "24" und "km/h". Der
         Linter kann sie nicht von einem versehentlich hineingeratenen
         unterscheiden - im Code ausserhalb von Text bleibt die Regel deshalb
         scharf, im Text nicht. */
      'no-irregular-whitespace': ['error', { skipJSXText: true }],

      /* Ungenutzte Argumente vor einem genutzten lassen sich nicht weglassen;
         ein fuehrender Unterstrich markiert sie als gewollt.

         caughtErrors auf none: die App faengt an dutzenden Stellen einen
         Fehler ab, ohne ihn zu lesen - genau das ist die Regel dieses
         Projekts, dass jede Plattformfaehigkeit ausfallen darf. catch(e){}
         als Verstoss zu melden wuerde die Absicht zum Fehler erklaeren. */
      'no-unused-vars': ['error', {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none'
      }]
    }
  },

  /* Die Vite-Konfiguration und der Linter selbst laufen in Node. */
  {
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } }
  },

  /* Die Tests laufen unter Vitest in Node. */
  {
    files: ['test/**/*.js'],
    languageOptions: { globals: { ...globals.node } }
  },

  /* Vite ersetzt diese beiden beim Bauen; im Quelltext sind sie frei. */
  {
    files: ['src/**/*.jsx'],
    languageOptions: {
      globals: { __APP_VERSION__: 'readonly', __BUILD_DATE__: 'readonly' }
    }
  }
];
