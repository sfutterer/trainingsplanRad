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

**Voraussetzung in den Repo-Einstellungen:** Settings → Pages → Build and
deployment → Source muss auf **GitHub Actions** stehen, nicht auf „Deploy from
a branch". Sonst liefert Pages den Quelltext statt des Builds aus – und die
Seite lädt nichts, weil `index.html` dann auf rohes JSX zeigt.

Bricht der Build, bleibt die zuletzt veröffentlichte Fassung stehen. Der Stand
vor dem Umbau liegt als Tag `vor-umbau` bereit.

## Den Plan ändern

Der Trainingsplan steht in `public/plan.json`, nicht im Code. Zwei Wege:

- **Dauerhaft für alle:** Datei im Repo bearbeiten und pushen.
- **Nur auf dem Gerät:** Unter „Einstellungen“ exportieren, bearbeiten, importieren.
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
dieses einen Browserprofils. Unter „Einstellungen“ steht der Knopf für die
Sicherung – das ist die einzige Kopie, die es gibt.

## Aufbau der Oberfläche

Unten die vier Bereiche, die während des Trainings gebraucht werden: **Plan**,
**Kraft**, **Intervalle**, **Analyse**. Oben links das Menü mit allen Bereichen,
oben rechts die Glocke mit dem Tagesüberblick.

Nur über das Menü erreichbar, weil man sie selten braucht:

- **Zonen & Schwellenwerte** – Zonenmodell, FTP und LTHR, Sprechtest-Erhebung
- **Einstellungen** – Zugänge, Erscheinungsbild, Planbeginn, Plan, Sicherung, Diagnose

## Zugänge

| Dienst | Wofür | Schlüssel |
|---|---|---|
| intervals.icu | Aktivitäten, Streams, Wellness | nötig, Settings → Developer Settings |
| Thunderforest | OpenCycleMap in der Analyse | optional, sonst OpenStreetMap |
| Open-Meteo | Temperatur und Wind je Fahrt | keiner |

Die Anleitung, wo man die Schlüssel bekommt, steht in der App hinter dem
Fragezeichen der jeweiligen Zeile.

## Analyse

Zuerst eine Liste der Aufzeichnungen aus dem gewählten Zeitraum – eine Abfrage.
Die Auswertung läuft erst beim Antippen einer Fahrt: Pulszonen aus dem Stream,
Abgleich mit dem Plan, Streckenkarte und Wetter. Aus Windrichtung und
Fahrtrichtung wird abschnittsweise der Gegenwindanteil gerechnet – die Frage,
die eine Drift-Analyse sonst offen lässt.

Der Planbeginn steht standardmäßig auf dem **15.08.2026**, dem Samstag, an dem
Woche 1 begonnen hat. Liegt er auf einem anderen Wochentag, warnt die App: die
Trainingswoche beginnt samstags, und ein verschobener Start zieht jeden Samstag
in die Vorwoche – die lange Ausfahrt bekäme dann durchgehend die falsche Dauer.
