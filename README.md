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

Die Datei trägt eine `schemaVersion`; mit Fassung 3 des Trainingsplans steht sie
auf 2. Ein älterer, lokal gespeicherter Plan wird deshalb abgelehnt statt halb
weitergerechnet – im Tab „Plan“ auf „Auf Default zurücksetzen“, dann gilt wieder
die Fassung aus dem Repo.

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

## Schreibweisen im Code

**Kommentare in ASCII-Umschrift** (`waere`, `laeuft`, `Uebung`), **Nutzertexte
mit echten Umlauten**. Das ist keine Nostalgie: die Bezeichner des Projekts
sind selbst transliteriert – `Uebungsliste`, `Koerperablauf`, `blaettern`,
`zuruecksetzen` –, und Kommentare erwähnen sie ständig. Mit Umlauten im
Fließtext wäre jede Nennung eines Bezeichners ein Sonderfall, und
`testBloecke` stünde neben „testBlöcke". Die Trennung hat außerdem den
Nebeneffekt, dass man Nutzertext im Diff sofort erkennt.

`npm run lint` prüft ESLint-Regeln, die Fehler finden, keine Formatierung –
dafür sorgt `.editorconfig`. `npm run check` läuft Linter, Tests und Build in
der Reihenfolge, in der auch die GitHub-Action sie ausführt.

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
- **Über die App** – Version, welche Schnittstelle wofür benutzt wird, was dabei
  das Gerät verlässt, Zeitgrenzen, Nachweise

## Zugänge

| Dienst | Wofür | Schlüssel |
|---|---|---|
| intervals.icu | Aktivitäten, Streams, Wellness | nötig, Settings → Developer Settings |
| Thunderforest | Kartenkacheln in der Analyse (Atlas, OpenCycleMap, Landscape) | optional, sonst OpenStreetMap |
| Open-Meteo | Temperatur, Feuchte, Niederschlag und Wind je Stunde | keiner |
| Overpass (OpenStreetMap) | Untergrund der gefahrenen Wege | keiner |

Die Anleitung, wo man die Schlüssel bekommt, steht in der App hinter dem
Fragezeichen der jeweiligen Zeile.

## Farben

Neutrales Grau als Grundton, ein gedämpftes Blau als einziger Akzent – für das
aktive Navigationsziel, den Hauptknopf, Gruppenüberschriften und Verweise.
Alles andere bleibt flach.

Farbe trägt nur dort Bedeutung, wo sie gebraucht wird:

| Wo | Warum |
|---|---|
| Zonenrampe Z1–Z5 | Blau → Grün → Gelb → Orange → Rot, Farbton gespreizt, Sättigung zurückgenommen |
| Timerphasen | warm = Belastung, kühl = Erholung – aus zwei Metern schneller lesbar als jede Beschriftung |
| Tageskarten | nur eine schmale Kante links, die Überschriften bleiben neutral |

Alle Werte liegen als Tokens in `src/ui/theme.css`, je einmal für hell und
dunkel. Jede Zonenfarbe erreicht mindestens 5:1 gegen ihre Fläche.

## Analyse

Zuerst eine Liste der Aufzeichnungen aus dem gewählten Zeitraum – eine Abfrage.
Die Auswertung läuft erst beim Antippen einer Fahrt: Pulszonen aus dem Stream,
Abgleich mit dem Plan, Streckenkarte und Bedingungen.

Die Spur wird in Abschnitte von rund 150 m geschnitten und jeder Abschnitt
einzeln bewertet: Gegenwindanteil aus Fahrtrichtung gegen die Windrichtung
**der jeweiligen Stunde**, Steigung aus dem Höhenstream, Untergrund aus
OpenStreetMap. Auf der Karte trägt jeder Abschnitt die Farbe seiner stärksten
Bremse – bergauf, Gegenwind, unbefestigt – oder grün, wenn nichts davon zutraf.
Treffen Steigung und Wind zusammen, entscheidet eine grobe Wattschätzung,
welche der beiden die Farbe bekommt; unbefestigt kommt zusätzlich als
Punktlinie darüber, damit Schotter nicht verdeckt wird.

Doppelt gefahrene Strecken – beim Intervalltraining die Regel – teilen die Linie
längs: jede Richtung bekommt eine Hälfte, nach rechts der eigenen Fahrtrichtung,
und rechts ist beim Zurückfahren die andere Straßenseite. Zusammen sind die
Hälften so breit wie eine einfache Linie und liegen auf demselben weißen Rand –
es sieht also aus wie **eine** Linie in zwei Farben und bleibt dort, wo die
Straße ist. Wie oft die Strecke gefahren wurde, ändert daran nichts; ein Versatz
je Durchfahrt addierte sich zu einem Fächer aus einem Dutzend Linien. Die
Fahrtrichtung steht als weißer Winkel in der Linie – auf der ganzen Strecke,
nicht nur auf doppelt gefahrenen Stücken –, ausgedünnt auf einen je Richtung und
Bildschirmabstand. Der Versatz rechnet in Bildschirmpunkten und
wird nach jedem Zoomen neu gelegt – ein Meter ist in der Gesamtübersicht weniger
als ein Pixel.

Darunter eine Auswertung, die Strecke und Wetter zusammen liest, und am Ende
ein Fazit: passt die Einheit zum Plan, erklären die Bedingungen eine Abweichung,
und was wäre nächstes Mal anders zu machen. Das Fazit steht auch oben in der
Kopfkarte – die Frage nach einer Fahrt ist zuerst „war das gut so?“.

Geladen wird in zwei Stufen: erst Aufzeichnung, Wetter und Wellness – die
antworten in Millisekunden, die Karte steht also sofort. Der Untergrund kommt
nach, weil Overpass für eine lange Runde zwischen 9 und 20 s braucht, und wird
je Fahrt gespeichert; beim zweiten Ansehen fällt die Abfrage weg. Jeder Abruf
hat eine Zeitgrenze (intervals.icu 15 s, Open-Meteo 10 s, Overpass 25 s).
Fällt einer aus, zeigt die App die Auswertung ohne diesen Teil und sagt es
kurz in einer Snackbar – statt zu warten oder eine Fehlerseite zu zeigen.

Der Planbeginn steht standardmäßig auf dem **15.08.2026**, dem Samstag, an dem
Woche 1 begonnen hat. Liegt er auf einem anderen Wochentag, warnt die App: die
Trainingswoche beginnt samstags, und ein verschobener Start zieht jeden Samstag
in die Vorwoche – die lange Ausfahrt bekäme dann durchgehend die falsche Dauer.
