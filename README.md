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

### Aufbau einer Woche

Jede Woche trägt ihre Nummer, ihre Phase, die Taktung des Rumpfzirkels und
unter `tage` je Wochentag das, was an ihm von der Woche abhängt:

```json
{ "week": 1, "phase": 1,
  "zirkel": { "workSeconds": 25, "restSeconds": 25, "rounds": 2 },
  "tage": {
    "di": { "minutes": 60, "legRounds": 0 },
    "mi": { "minutes": 0, "extra": null },
    "do": { "kind": "intervals", "title": "…", "zone": "z3", "reps": 4, … },
    "sa": { "minutes": 120, "bloecke": null },
    "so": { "optionalMinutes": 30, "legRounds": 2 }
  } }
```

Montag und Freitag fehlen: an ihnen hängt nichts von der Woche ab – der Montag
ist frei, der Freitag steht in `fridayOptional`. Ein Kürzel, das die Prüfung
nicht kennt, wird beanstandet, damit ein hingeschriebenes `"mo"` nicht
stillschweigend wirkungslos bleibt.

### Schemafassung und Migration

Die Datei trägt eine `schemaVersion`, aktuell **3**. Ein lokal gespeicherter
Plan einer älteren Fassung wird beim Laden **gehoben**, nicht abgelehnt: die
Umschreibung steht in `src/domain/migration.js` und läuft, bevor geprüft wird.
Der gehobene Plan wird einmal zurückgeschrieben, damit er nicht bei jedem Start
erneut wandern muss.

Bis Fassung 2 nannten die Feldnamen den Wochentag (`tuesdayMinutes`,
`saturdayBlocks`); der Donnerstag stand daneben schon als vollwertiges Objekt.
Fassung 3 gibt jedem Tag dieselbe Form.

Für eine Fassung, zu der es keinen Migrationsschritt gibt, bleibt es beim alten
Verhalten: die Prüfung lehnt sie mit einer Zahl ab, statt Felder zu raten.

## Aufbau

| Verzeichnis | Inhalt |
|---|---|
| `src/domain/` | Plan, Zonen, Analyse, Timer. Rein: kein DOM, kein fetch, keine Uhr außer als Parameter |
| `src/data/` | Speicher, Profile, Google-Anmeldung, `plan.json`, intervals.icu |
| `src/platform/` | Wake Lock, Sprachausgabe, Töne, Haptik – jede darf ausfallen |
| `src/state/` | Signals |
| `src/ui/` | Komponenten und die acht Bereiche |
| `test/` | Prüfsummen über die Tagesstruktur, dazu Migration, Kalender, Abgleich |

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

## Anmeldung und Profile

Oben rechts steht das Profilbild. Dahinter lässt sich ein Google-Konto anmelden;
jedes angemeldete Konto bekommt einen **eigenen Datenbestand** – Protokolle,
Testhistorie, Erhebungen, Schwellenwerte, Zugänge, Plan und Einstellungen.

Was die Anmeldung **nicht** tut: hochladen, abgleichen, schützen. Es gibt kein
Backend. Alles bleibt im `localStorage` des Geräts, und ohne Server lässt sich
die Signatur des ID-Tokens nicht prüfen – wer den Speicher dieses Browsers
öffnet, liest jedes Profil ohne Anmeldung. Die Anmeldung **ordnet Daten zu, sie
verschließt sie nicht**. Für zwei Geräte bleibt die Sicherung der Weg.

Ohne Anmeldung läuft die App unverändert weiter, auf demselben Bestand wie
bisher: das lokale Profil benutzt die Schlüssel ohne Präfix, angemeldete
Profile liegen unter `profil:google:<sub>:`. Die `sub` ist die Kontokennung von
Google und nicht die Mailadresse – die kann sich ändern, ohne dass der Bestand
mitwandern soll.

**Beim Update:** der Bestand, der vor der ersten Anmeldung auf dem Gerät lag,
wandert vollständig in das **erste Profil, das sich anmeldet**, und wird dort
angezeigt. Das passiert genau einmal; ein zweites Konto fängt leer an. Ein
Merker im Speicher hält fest, wer ihn bekommen hat.

### Client-ID

Die Client-ID steht offen in `src/data/google.js`. Das ist Absicht: eine
Client-ID ist dafür gebaut, öffentlich zu sein, und sie landet ohnehin im
ausgelieferten Bundle – die App liegt auf GitHub Pages, das gebaute JavaScript
ist lesbar. Geschützt wird sie nicht durch Geheimhaltung, sondern durch die
**Authorized JavaScript origins** in der Google Cloud Console: sie funktioniert
nur von den dort eingetragenen Herkünften, sonst `origin_mismatch`.

Das **Client secret**, das Google in derselben JSON-Datei mitliefert
(`GOCSPX-…`), gehört **nicht** ins Repo und wird auch nicht gebraucht – die App
holt nur ID-Tokens, der Code-Austausch kommt nie vor.

Der Client steht auf **Testing** mit einer Testnutzer-Liste. Das erspart
Domain-Nachweis, Homepage und Datenschutzerklärung, die Google für externe Apps
im Production-Status verlangt. Wer sich anmelden können soll, muss in
[Google Auth Platform → Zielgruppe](https://console.cloud.google.com/auth/audience)
als Testnutzer eingetragen sein (bis 100). Die erteilte Zustimmung läuft nach
sieben Tagen ab; da die App nach der ersten Anmeldung nie wieder
authentifiziert, merkt man davon nur etwas, wenn man sich nach längerer Pause
erneut anmeldet.

**Eine eigene ID** braucht nur, wer die App unter einer anderen Adresse
betreibt – dann bei
[Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients)
einen Client vom Typ *Webanwendung* anlegen, unter *Authorized JavaScript
origins* die eigene Herkunft eintragen (nur Schema und Host, **ohne Pfad**) und
die ID als `VITE_GOOGLE_CLIENT_ID` in den Build geben – lokal über `.env`
(siehe `.env.example`), im Deploy über die Repository-Variable
`GOOGLE_CLIENT_ID`. Das überschreibt die mitgelieferte.

Der Build ist der einzige Weg dorthin. Ein Feld in den Einstellungen gab es
kurzzeitig; es ist weg, weil es eine Einstellung war, die jeder Nutzer sah und
nur der eine Mensch brauchte, der die App ohnehin selbst baut.

## Daten sichern

Trainingsprotokolle, Testhistorie und Erhebungen liegen nur im `localStorage`
dieses einen Browserprofils. Unter „Einstellungen“ steht der Knopf für die
Sicherung – das ist die einzige Kopie, die es gibt.

Die Sicherung umfasst **ein Profil**: den Bestand, der beim Herunterladen offen
ist. Wer zwei Konten benutzt, lädt zwei Dateien herunter. Wer angemeldet ist und
eine Sicherung einspielt, überschreibt damit nur sein eigenes Profil; die
Profilliste des Geräts und die Anmeldung selbst stehen nicht in der Datei.

## Aufbau der Oberfläche

Unten die vier Bereiche, die während des Trainings gebraucht werden: **Plan**,
**Kraft**, **Intervalle**, **Analyse**. Oben links das Menü mit allen Bereichen,
oben rechts die Glocke und daneben das Profilbild.

Die **Glocke** meldet drei Dinge: einmal am Tag, was heute ansteht; ein rotes
Wellness-Gate; und einen Tag der vergangenen Woche, an dem die Vorgabe
ausgefallen oder zu kurz gekommen ist. Liegt etwas an, steht eine Zahl an der
Glocke. Beim Antippen werden die Meldungen gezeigt und beim Schließen gelöscht –
gemerkt wird nur, welche Meldung weg ist, nicht ihr Text. Liegt nichts an, zeigt
die Glocke wie bisher den Tagesüberblick. Das Gate und die verpassten Tage
brauchen den intervals.icu-Schlüssel; ohne ihn bleibt die Tagesmeldung.

Nur über das Menü erreichbar, weil man sie selten braucht:

- **Schwellentest** – Anleitung, Anlauf als Zeitleiste, Go/No-Go zum Abhaken,
  die Uhr für Test, Tempotest und Öffner, die VO2max-Referenz mit ihrer
  118-%-Gegenprobe, und die Eingabe von FTP und LTHR
- **Zonen & Schwellenwerte** – Zonenmodell, FTP und LTHR, Sprechtest-Erhebung
- **Einstellungen** – Zugänge, Erscheinungsbild, Planbeginn, Plan, Sicherung, Diagnose
- **Über die App** – Version, welche Schnittstelle wofür benutzt wird, was dabei
  das Gerät verlässt, Zeitgrenzen, Nachweise

## Testablauf und Varianten

Der Ablauf des Schwellentests trägt in `plan.json` eine Kennung und eine
Fassungsnummer (`thresholdTest.id`, `.fassung`). Sie wandert in jeden Eintrag der
Testhistorie. Grund: der Trainingsplan verlangt einen **identischen Ablauf über
alle drei Termine**, sonst sind die Werte nicht vergleichbar – ohne Kennung wäre
diese Regel nicht prüfbar, und zwei Werte aus zwei Protokollen stünden
stillschweigend in derselben Linie. Weichen Einträge voneinander ab, sagt die
Testhistorie das.

Deshalb gibt es genau **ein** aktives Protokoll und keine Liste: eine Liste wäre
die Einladung, die Regel zu brechen.

Ein Donnerstag darf daneben eine **Variante** tragen – eine zweite zulässige Form
desselben Tages, über die am Tag selbst entschieden wird. Im ausgelieferten Plan
ist das die VO2max-Referenz in Woche 5: fünf Minuten maximal als erste
Wiederholung statt der fünften. Der Regelfall bleibt unverändert daneben stehen;
die Wahl steht auf der Tageskarte und wird gespeichert. Drei Zustände, und alle
drei sind unterscheidbar: noch nicht entschieden, Variante gewählt, ausdrücklich
abgewählt. Die Wochensumme rechnet mit der Variante, weil der Trainingsplan sie so
nennt – `weekPlanMinutes` kennt weder Datum noch Zustand, und die zwei Minuten
Unterschied liegen unter der Auflösung des Umfangsdeckels.

## Zugänge

| Dienst | Wofür | Schlüssel |
|---|---|---|
| intervals.icu | Aktivitäten, Streams, Wellness | nötig, Settings → Developer Settings |
| Thunderforest | Kartenkacheln in der Analyse (Atlas, OpenCycleMap, Landscape) | optional, sonst OpenStreetMap |
| Open-Meteo | Temperatur, Feuchte, Niederschlag und Wind je Stunde | keiner |
| Overpass (OpenStreetMap) | Untergrund der gefahrenen Wege | keiner |
| Google | Anmeldung, trennt die Profile auf einem Gerät | optional, Client-ID (siehe oben) |

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
| Tageskarten | keine Typfarbe; das Zeichen der Einheitsart trägt die Farbe |

Alle Werte liegen als Tokens in `src/ui/theme.css`, je einmal für hell und
dunkel. Jede Zonenfarbe erreicht mindestens 5:1 gegen ihre Fläche.

## Analyse

Zuerst eine Liste der Aufzeichnungen aus dem gewählten Zeitraum, nach Tagen
gruppiert – eine Abfrage. Die Auswertung läuft erst beim Antippen eines Tages:
Pulszonen aus den Streams, Abgleich mit dem Plan, je Fahrt eine Streckenkarte
und die Bedingungen.

Ausgewertet wird der **Tag** und nicht die einzelne Fahrt. Der Plan macht seine
Vorgabe je Tag; wer sie auf zwei Fahrten verteilt, weil der Arbeitsweg zweimal
anfällt, bekäme sie sonst zweimal ganz gegen sich gerechnet – Hinweg „kürzer“,
Rückweg „kürzer“, zusammen genau richtig. Dauer und Zonenzeiten laufen deshalb
über alle Aufzeichnungen des Tages zusammen.

Die Summe entsteht aber in einer Reihenfolge, und die steht daneben: **jede
Fahrt wird der Reihe nach bewertet**, die zweite auf dem Stand, den die erste
hinterlassen hat. Je Fahrt ein Laufstand gegen die Vorgabe des Tages
(„115 von 40 min Untergrenze – 75 min darüber“), die Überschreitung an der
Fahrt, die sie auslöst, und die Pulszonen genau dieser Fahrt – über beide
gemittelt verschwindet ein gehetzter Rückweg hinter einem ruhigen Hinweg.
Streckenzahlen, Wetter und Karte stehen ebenso je Fahrt: über zwei Fahrten
summiert entstünde eine Strecke, die niemand gefahren ist, und ein Windanteil,
in dem Hin- und Rückweg sich gegenseitig aufheben.

Am Tag bleibt, was in Minuten und nicht in Anteilen zählt: die harte Zeit eines
Intervalltages und die Z3-Blöcke des Samstags. Sie auf zwei Fahrten zu
verteilen hieße, dieselbe Vorgabe zweimal ganz zu verlangen.

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

Oben in der Kopfkarte steht das Fazit des Tages: passt die Einheit zum Plan,
erklären die Bedingungen eine Abweichung, und was wäre nächstes Mal anders zu
machen – die Frage nach einer Fahrt ist zuerst „war das gut so?“. Ein Tag
deutlich über der Vorgabe ist dort kein grünes Fazit mehr, auch wo länger kein
Planverstoß ist: die Grundlage kommt aus der Wochensumme, nicht aus einzelnen
langen Tagen.

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
