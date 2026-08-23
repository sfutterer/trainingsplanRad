# Trainingsplan Radfahren

PWA für einen Rad-Trainingsplan. Läuft auf GitHub Pages, ohne Backend, alle
Daten bleiben auf dem Gerät.

**App:** https://sfutterer.github.io/trainingsplanRad/

## Entwickeln

```bash
npm install
npm run dev      # Entwicklungsserver
npm test         # Domänenlogik gegen den bekannten Stand prüfen
npm run build    # Produktionsbuild nach dist/
```

Node-Version steht in `.nvmrc`. Ein Push auf `main` baut und veröffentlicht
automatisch über GitHub Actions.

## Den Plan ändern

Der Trainingsplan steht in `public/plan.json`, nicht im Code. Zwei Wege:

- **Dauerhaft für alle:** Datei im Repo bearbeiten und pushen.
- **Nur auf dem Gerät:** Im Tab „Plan“ exportieren, bearbeiten, importieren.
  Der eigene Plan wird lokal gespeichert und gilt ab sofort; die Repo-Fassung
  bleibt der Default und ist per Knopf wieder erreichbar.

Beim Laden wird geprüft. Ist etwas falsch, zeigt die App eine Meldung mit dem
beanstandeten Feld und **keine Zahlen** – lieber gar keine Vorgabe als eine
falsche.

## Aufbau

| Verzeichnis | Inhalt |
|---|---|
| `src/domain/` | Plan, Zonen, Analyse, Timer. Rein: kein DOM, kein fetch, keine Uhr außer als Parameter |
| `src/data/` | Speicher, `plan.json`, intervals.icu |
| `src/platform/` | Wake Lock, Sprachausgabe, Töne, Haptik – jede darf ausfallen |
| `src/state/` | Signals |
| `src/ui/` | Komponenten und die fünf Bereiche |
| `test/` | Gleichheitsnachweis gegen den Stand vor dem Umbau (Tag `vor-umbau`) |

`TRAININGSPLAN.md` ist die fachliche Spezifikation. Bei Änderungen am Plan muss
sie mitgezogen werden.

## Daten sichern

Trainingsprotokolle, Testhistorie und Erhebungen liegen nur im `localStorage`
dieses einen Browserprofils. Der Tab „Plan“ hat einen Knopf für die Sicherung –
das ist die einzige Kopie, die es gibt.
