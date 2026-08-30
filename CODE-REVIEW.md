# Code-Review: Qualität, Architektur, Komponentenschnitt

Stand 29.08.2026, geprüft gegen `main` (3d4fa13). Grundlage: alle Dateien unter
`src/`, `public/plan.json`, die CSS-Dateien, `test/`, `vite.config.js` und die
GitHub-Action. `npm test` läuft grün (196 Tests, 9 Dateien), `npm run build`
läuft durch.

## Stand der Umsetzung (30.08.2026)

**43 von 44 Punkten umgesetzt.** Offen bleibt allein **5.3** (Wochentage als
Feldnamen in `plan.json`) – ausdrücklich zurückgestellt, weil es `weeks`,
`day.js` und `schema.js` gemeinsam ändert und vor die nächste Schemafassung
gehört.

Danach: `npm run check` (Linter, 241 Tests, Build) läuft durch, ESLint meldet
null Fehler und null Warnungen, und alle sieben Bereiche wurden im Browser
nachgeprüft.

Drei Dinge, die beim Umsetzen zusätzlich herauskamen:

- **`analysis.js` warf einen `ReferenceError`.** `estimateRounds` las
  `EXERCISES.length` – eine Modulvariable aus der Einzeldatei-Fassung, die es in
  diesem Modul nie gab. Die Funktion lief genau dann, wenn jemand den Zirkel auf
  der Uhr statt mit dem App-Timer aufzeichnete. Gefunden vom ersten Test aus
  3.3, festgehalten in `test/abgleich.test.js`.
- **Der doppelte `<h1>` war nur versteckt.** In `app.css` stand
  `h1.title{ display:none }` – der Fehler aus 1.2 war also schon einmal
  bemerkt und zugedeckt statt behoben worden. Beides ist weg.
- **`no-undef` sieht JSX nicht.** Eine vergessene Einfuhr von `<Zahlenfeld />`
  fiel erst im Browser als leerer Bereich auf, weil ESLints Kernregel nur
  `Identifier` prüft und nicht `JSXIdentifier`. `react/jsx-no-undef` steht
  jetzt in der Konfiguration.

Zwei Entscheidungen sind anders ausgefallen als vorgeschlagen, beide begründet
an Ort und Stelle:

- **6.1 (Umlaute):** nicht auf echte Umlaute umgestellt, sondern auf die
  ASCII-Umschrift der Mehrheit gezogen. Grund: die Bezeichner des Projekts sind
  selbst transliteriert (`Uebungsliste`, `Koerperablauf`, `blaettern`), und
  Kommentare nennen sie ständig – eine Umstellung hätte aus `testBloecke`
  „testBlöcke" gemacht. Die Regel steht jetzt im README.
- **3.6 (Code-Splitting):** ohne `lazy`/`Suspense` aus `preact/compat` gelöst.
  Compat nur dafür hereinzuziehen kostet mehr, als das Aufteilen einspart;
  stattdessen 15 Zeilen Nachlader in `App.jsx`. Das Startbündel fiel von
  76 kB auf 43 kB gzip.

Die Punkte unten sind der ursprüngliche Befund und bleiben als Begründung
stehen – die Kästchen sagen, was davon erledigt ist.

## Gesamturteil

Die Architektur trägt. Die Schichtung `domain` → `data` → `state` → `ui` ist
sauber durchgehalten: kein `fetch` und kein DOM in `domain/`, jede
Plattformfähigkeit hinter einer Funktion, die ausfallen darf, jede Planzahl aus
`plan.json` statt aus dem Code. Die Kommentare erklären durchgehend das *Warum*
und nennen sogar die verworfenen Alternativen – das ist deutlich mehr, als
Projekte dieser Größe üblicherweise mitbringen, und es sollte so bleiben.

Die Befunde unten sind deshalb fast alle Nachzieharbeiten, keine Konstruktions-
fehler: Muster, die drei- bis fünfmal von Hand wiederholt statt einmal als
Komponente hingestellt wurden, eine Handvoll doppelter Helfer aus der Zeit des
Umbaus von der Einzeldatei, und eine Reihe echter Bedienbarkeitslücken bei
Tastatur und Screenreader.

Reihenfolge der Abschnitte: erst was falsch ist, dann was doppelt ist, dann was
groß ist, dann das Feilen.

---

## 1 · Fehler und echte Lücken

### 1.1 Zonenfarben stehen zweimal und widersprechen sich

- [x] **Zonenfarben aus `plan.json` entfernen und auf die Tokens ziehen**

`public/plan.json:152-167` gibt jedem Band ein `color` (Z2 = `#2dd4a7`),
`src/ui/theme.css:48-52` definiert dieselbe Zone als `--z2` (hell `#3e7a63`,
dunkel `#6fb394`). Beide werden benutzt:

| Wo | Quelle | Z2 im Hellmodus |
|---|---|---|
| Zonenliste `ZonenTab.jsx:28`, `IntervalleTab.jsx:228` | `b.color` aus plan.json | `#2dd4a7` |
| Zonenbalken `AnalyseTab.jsx:49` | `p.zoneColor[k]` aus plan.json | `#2dd4a7` |
| Verlaufsgraph `AnalyseTab.jsx:~400` | `var(--z2)` | `#3e7a63` |

Dieselbe Zone hat also je nach Bildschirm eine andere Farbe, und die Werte aus
`plan.json` folgen dem Theme nicht – im Dunkelmodus stehen sie unverändert auf
den hellen Sättigungen. Der README behauptet außerdem „Alle Werte liegen als
Tokens in `src/ui/theme.css`", was mit `plan.json` daneben nicht stimmt.

Vorschlag: in `plan.json` das Feld `color` durch `colorToken` (`"--z2"`)
ersetzen oder ganz streichen und die Farbe in `domain/plan.js` aus dem
Zonenschlüssel ableiten. Die Farbwahl ist Darstellung, nicht Trainingsplan – sie
gehört nicht in die Datei, die der Nutzer bearbeitet.

### 1.2 Zwei `<h1>` auf der Intervalle-Seite

- [x] **`<h1 class="title">Intervalle</h1>` in `IntervalleTab.jsx:136` löschen**

Die `AppBar` setzt den Titel bereits (`App.jsx:33`, `AppBar.jsx:17`). Der
Intervalle-Tab ist der einzige, der ihn zusätzlich selbst schreibt – das
Ergebnis sind zwei `<h1>` im Dokument, doppelter Text auf dem Bildschirm und
eine kaputte Überschriftengliederung für Screenreader.

### 1.3 Der geschlossene Drawer bleibt mit Tab erreichbar

- [x] **`inert` auf `.drawer-wrap` setzen, solange er zu ist**

`NavDrawer.jsx:60` setzt `aria-hidden`, `app.css:270-287` schiebt ihn per
`transform` aus dem Bild und schaltet `pointer-events` ab. Beides entfernt die
sieben Knöpfe darin nicht aus der Tabreihenfolge: `aria-hidden` tut das nicht,
und `transform` erst recht nicht. Wer mit Tastatur bedient, läuft durch sieben
unsichtbare Schaltflächen. Fokussierbare Elemente in einem `aria-hidden`-Container
sind zusätzlich ein ARIA-Verstoß.

`inert` löst beides in einem Attribut und ist seit 2023 überall verfügbar.

### 1.4 Neunzehn Eingabefelder ohne Beschriftung

- [x] **`<label for>` statt `<span>` in der `.field`-Zeile (siehe 2.2)**

`grep "<label" src/ui` liefert null Treffer, `aria-label` auf einem `<input>`
ebenfalls null – bei 19 Eingabefeldern. Der Screenreader liest also „Bearbeiten,
Zahl" ohne zu sagen, ob es die Belastung, die Pause oder die Rundenzahl ist. Die
Beschriftung steht als `<span>` daneben und ist mit dem Feld nicht verknüpft.
Zusätzlich fehlt damit die Vergrößerung der Trefferfläche, die ein `<label>`
mitbringt.

Fällt zusammen mit 2.2 weg, sobald es eine `Feld`-Komponente gibt.

### 1.5 Dialoge ohne Fokusfalle

- [x] **Fokusverwaltung für `ExerciseDialog` und `HeuteOverlay`**

`ExerciseDialog.jsx:10` benennt die Lücke selbst („Ein vollständiger Fokus-Trap
fehlt weiterhin"). Escape schließt, aber der Fokus wandert beim Öffnen nicht in
den Dialog und beim Schließen nicht zurück auf den auslösenden Knopf, und Tab
läuft aus dem Bottom Sheet in die Seite dahinter. Beide Dialoge brauchen
dieselbe Behandlung – also einen gemeinsamen `useDialog`-Hook oder eine
`Sheet`-Komponente (passt zu 2.1).

### 1.6 `prompt()` als Eingabemaske für den Schwellentest

- [x] **Testeingabe in ein Formular überführen**

`ZonenTab.jsx:151-158` fragt vier Werte hintereinander per `prompt()` ab
(20-min-Watt, 5-min-Watt, Gewicht, Bedingungen), `EinstellungenTab.jsx:206` das
Startdatum ebenso. Das lässt sich nicht abbrechen ohne alles zu verlieren, nicht
korrigieren, nicht testen, ist auf Android hässlich, und beim Datum wird die
Eingabe per Regex geprüft statt mit `<input type="date">` erst gar nicht falsch
zu ermöglichen. Für eine App, deren Bedienung sonst bis zur Tastenposition
durchdacht ist, fällt das auf.

### 1.7 `confirm()` für die Rückfragen

- [x] **Rückfragen über einen eigenen Bestätigungsdialog**

Fünf Stellen (`EinstellungenTab.jsx:120,131,268`, `ZonenTab.jsx:180`) nutzen
`confirm()`. Für „Sicherung einspielen – alle Daten werden überschrieben" ist das
die folgenreichste Frage der App und verdient dieselbe Sorgfalt wie der Rest.

---

## 2 · Wiederverwendbare Bausteine, die noch fehlen

Das ist der Kern der Frage nach dummen Komponenten. Es gibt schon gute:
`Baustein`/`Buehne`/`Uebungsliste`, `Gruppe`/`Zeile`/`Schalter`,
`ProgressRing`, `Verlaufsgraph`/`IndikatorKarte`, `Uebungsbild`. Fünf weitere
Muster werden aber noch von Hand wiederholt.

### 2.1 `Segmented` – der Umschalter, fünfmal gebaut

- [x] **`ui/components/Segmented.jsx` anlegen und die fünf Stellen darauf ziehen**

| Datei | Zeile | Rolle | ARIA |
|---|---|---|---|
| `TrainingTab.jsx` | 241 | vier Bausteine | `role="tablist"` |
| `PlanTab.jsx` | 158 | Woche/Monat | `role="group"` |
| `AnalyseTab.jsx` | 549 | Einheiten/Verlauf | keine |
| `EinstellungenTab.jsx` | 165 | Theme | keine |
| `EinstellungenTab.jsx` | 187 | Kartenstil | keine |

Fünfmal dieselbe Schleife über `{id, label}`, dreimal mit unterschiedlicher
ARIA-Behandlung – und die beiden ohne Rolle sind für den Screenreader nur eine
Reihe unverbundener Knöpfe. Eine Komponente `<Segmented ziele={} aktiv={}
onWaehlen={} rolle="tab|radio" />` beseitigt die Wiederholung *und* legt die
ARIA-Frage an einer Stelle fest.

### 2.2 `Feld` – die Eingabezeile, siebzehnmal gebaut

- [x] **`ui/components/Feld.jsx` (Zahl und Text) anlegen**

`<div class="field"><span>…</span><input …/></div>` steht 17-mal:
`IntervalleTab` 5×, `ZonenTab` 6×, `TrainingTab` 4×, `AnalyseTab` 2×. Jedes Mal
mit derselben `parseInt(e.currentTarget.value, 10) || fallback`-Zeile daneben.
Die Komponente löst zugleich 1.4 (Beschriftung per `for`/`id`) und die
uneinheitliche Behandlung ungültiger Eingaben.

### 2.3 `KalenderNavi` – die Blätterleiste, zweimal gebaut

- [x] **Die `kalnavi`-Leiste aus `PlanTab.jsx:118-133` und `Monatsansicht.jsx:64-79` herausziehen**

Beide bauen dieselben sechs Elemente: Heute-Knopf, `‹`, Titel, `›`, und den
unsichtbaren Spiegel-Knopf, der die Mitte hält. Der Unterschied ist der Titel
und was „vor/zurück" bedeutet. Eine Komponente mit den Steckplätzen
`titel`, `onVor`, `onZurueck`, `onHeute`, `heuteVersteckt` deckt beide ab. Der
Spiegel-Trick für die Zentrierung sollte ohnehin nur einmal erklärt sein.

### 2.4 `Zonenliste` – die Bänderliste, zweimal gebaut

- [x] **`hrBands`-Liste als eigene Komponente**

`ZonenTab.jsx:22-33` und `IntervalleTab.jsx:225-231` rendern dieselbe Liste aus
`hrBands(p, th, w).filter(b => b.key !== 'unter')` mit demselben Punkt und
derselben `bandRange`. Beim Umbau der Farben (1.1) sonst zwei Baustellen.

### 2.5 `Icon` – die SVG-Pfade, dreimal einkopiert

- [x] **Ein Icon-Register statt drei `ICONS`-Objekte**

Der Pfad für „Training/Kraft" steht identisch in `NavDrawer.jsx:13`,
`NavigationBar.jsx:14` und `AnalyseTab.jsx:39` (`SYMBOL.kraft`). Dazu Pfade in
`AppBar`, `Snackbar`, `SettingsList`, `Uebungsbild`, `Auswertung`.
Vorschlag: `ui/components/icons.js` mit den Pfaddaten und eine dünne
`<Icon name="training" />`-Komponente. Das ist die klassische dumme Komponente
und spart im Bundle die dreifache Pfaddefinition.

### 2.6 Zwei Diagramm-Implementierungen nebeneinander

- [x] **Prüfen, ob `ZonenTab`s `Verlauf` durch `Verlaufsgraph` ersetzbar ist**

`components/Verlaufsgraph.jsx` ist die ausgebaute Fassung (Trendgerade,
antippbare Punkte, Legende, Trefferflächen). `ZonenTab.jsx:78-120` zeichnet mit
`Verlauf` ein zweites, kleineres SVG von Hand – eigene Skalierung, eigene
Legende, eigene Deltaformatierung. Die fachliche Begründung im Kommentar (FTP
und Gewicht auf gemeinsamer Prozentachse) ist gut und soll bleiben; sie
rechtfertigt aber eine andere *Datenaufbereitung*, nicht eine zweite
*Zeichenroutine*. Wenn `Verlaufsgraph` prozentnormierte Reihen entgegennimmt,
fällt das zweite SVG weg.

---

## 3 · Architektur

### 3.1 Ringabhängigkeit: Tabs importieren aus `App.jsx`

- [x] **`gotoTab` und `tab` nach `state/navigation.js` verschieben**

`App.jsx` importiert `AnalyseTab` und `PlanTab`; `AnalyseTab.jsx:34` und
`Tag.jsx:25` importieren `gotoTab` aus `App.jsx` zurück. Das läuft dank
ESM-Hoisting, ist aber ein Zyklus und stellt die Schichtung auf den Kopf: der
Rahmen darf die Bereiche kennen, nicht umgekehrt. Navigation ist Zustand und
gehört zu den anderen Signals nach `state/` – dort liegt `tab` ohnehin schon
(`store.js:29`). Nach dem Umzug wäre `App.jsx` reiner Rahmen und die Tabs hätten
keine Kenntnis mehr voneinander.

### 3.2 `analysis.js` trägt zwei Themen

- [x] **`domain/wellness.js` aus `domain/analysis.js` herauslösen**

741 Zeilen, zwei getrennte Gegenstände: Zeile 1–515 der Abgleich von
Aufzeichnung und Plan (`an*`), Zeile 516–741 die Wellness-Auswertung
(`wellnessGate`, `gewichtTrend`, `abnehmHinweis`, `wellnessSerie`,
`verfassungAus`). Die beiden Hälften rufen einander nicht auf. Der Testaufbau
weiß das längst – `test/wellness.test.js` testet nur die zweite Hälfte.

### 3.3 Der Abgleich mit dem Plan ist ungetestet

- [x] **Tests für `anCompareDay` / `anBuildReport` / `anWeekTotals`**

Das ist die größte ungetestete Fläche des Projekts und zugleich die, die alle
Urteile der App erzeugt („Zusatz", „zu kurz", „zu hart für einen Grundlagentag").
`anCompareDay` allein ist 238 Zeilen (`analysis.js:232-470`) mit rund zwei
Dutzend Verzweigungen. Die übrigen Domänenmodule sind gut abgedeckt (196 Tests);
diese eine Lücke fällt umso mehr auf.

Ein Nebeneffekt: `anCompareDay` lässt sich beim Testen kaum am Stück prüfen. Die
Notizenerzeuger (`anCoreLogNotes`, `anLegNotes`, `anEasyRideNotes`,
`anCommuteIntensityNotes`) sind bereits exportiert – sie einzeln zu testen ist
der billigere Einstieg als der große Durchlauf.

### 3.4 `buildDayInfo` ist 255 Zeilen

- [x] **`buildDayInfo` (`day.js:184-439`) nach Wochentagen aufteilen**

Eine Funktion, die für jeden der sieben Wochentage einen eigenen Zweig hat, plus
Testwoche, plus Winterblock. Die Bausteinfunktionen darüber (`rideKennzahlen`,
`circuitBlock`, `testBloecke`, `zusatzBloecke`) zeigen, wohin die Reise geht –
der Rest sollte denselben Weg gehen: je Wochentag eine Funktion, `buildDayInfo`
nur noch die Verteilung.

### 3.5 Detail-Ladelogik steckt in der Ansicht

- [x] **Den `useEffect` aus `AnalyseTab.Detail` in einen Hook ziehen**

`AnalyseTab.jsx:157-289` – rund 130 Zeilen asynchrone Orchestrierung (Streams,
Wellness, Wetter, Overpass, Zwischenspeicher, Abbruchbehandlung, vier
Zwischenzustände) mitten in einer Anzeigekomponente. Die Reihenfolge und die
Ausfallbehandlung sind sorgfältig durchdacht und ausführlich begründet – genau
deshalb gehören sie in eine eigene, benennbare Einheit
(`useFahrtauswertung(act)`), wo man sie auch prüfen kann. Die Komponente
behielte das Zeichnen.

Kleinigkeit im selben Block: `verfassungAus_` (`AnalyseTab.jsx:172`) beschattet
den gleichnamigen Import mit einem Unterstrich am Ende. Umbenennen.

### 3.6 Alle sieben Bereiche liegen in einem Bündel

- [x] **Tabs per `lazy()` nachladen**

`dist/assets/index-*.js` ist 218 kB (75 kB gzip); nur Leaflet ist bereits
getrennt. `App.jsx:17-24` importiert alle sieben Bereiche statisch. Wer nur den
Plan und den Rumpfzirkel benutzt, lädt trotzdem `verlauf.js` (614 Zeilen),
`analysis.js` (741), `strecke.js` (404), `fazit.js` (219) und `osm.js` mit. Der
Analyse-Bereich ist der natürliche Schnitt – er ist der einzige, der ohne Timer
auskommt, und der teuerste.

### 3.7 `datei()` gehört in `platform/`

- [x] **Den Dateiwähler aus `EinstellungenTab.jsx:22-34` nach `platform/index.js`**

Die Funktion baut ein `<input type="file">` und liest per `FileReader` – das ist
Browserfähigkeit, kein Bereichswissen, und `downloadJson` als Gegenstück liegt
bereits richtig in `platform/index.js:180`.

### 3.8 Ein Tab importiert das CSS eines anderen

- [x] **`.hint.warn` / `.hint.good` nach `app.css` verschieben**

`ZonenTab.jsx:17` importiert `'../plan/plan.css'` – nur wegen zweier Modifier
(`plan.css:218-219`) auf der globalen Klasse `.hint`, die in `app.css:112`
definiert ist. Modifier einer globalen Klasse gehören zu ihr.

### 3.9 `.uebungsblock` ist in zwei Dateien definiert

- [x] **Die Höhenrechnung an einer Stelle zusammenführen**

`components/timer.css:66` und `tabs/training/training.css:194` definieren beide
`.uebungsblock` mit unterschiedlichem `max-height`. Der Kommentar erklärt es
(der Trainings-Tab hat Segmentleiste und Kopfzeile zusätzlich), aber das Ergebnis
hängt an der Importreihenfolge in `TrainingTab.jsx:47-48` – schiebt jemand die
beiden Zeilen, ändert sich das Layout ohne erkennbaren Grund.

Dazu die drei Magic Numbers `152px`, `266px`, `322px`: sie kodieren die Höhe von
App-Bar, Navigationsleiste, Segmentleiste, Kopfzeile und Laufstreifen als
Summen. Als benannte Custom Properties (`--h-appbar`, `--h-navbar` …) wären sie
zusammensetzbar und beim Ändern einer Leistenhöhe nicht dreimal nachzurechnen.

---

## 4 · Doppelter Code

### 4.1 Identische Helfer in zwei Modulen

- [x] **`median` zusammenführen** – zeichengleich in `analysis.js:631` und
      `verlauf.js:78`.
- [x] **`tagNummer` / `tagNr` zusammenführen** – zeichengleiche Rümpfe,
      verschiedene Namen (`analysis.js:543`, `verlauf.js:55`).

Ziel: ein `domain/zahlen.js` oder `domain/datum.js`. Beide sind Reste des Umbaus
von der Einzeldatei.

### 4.2 Zwei Funktionen `ein()` mit verschiedenem Ergebnis

- [x] **Auf `zahl(v, 1)` aus `verlauf.js:72` vereinheitlichen**

| Datei | Zeile | `ein(20)` | `ein(20.04)` |
|---|---|---|---|
| `fazit.js` | 26 | `"20"` | `"20"` |
| `Auswertung.jsx` | 66 | `"20,0"` | `"20,0"` |

Gleicher Name, gleicher Zweck, unterschiedliche Ausgabe – und `verlauf.js:72`
kann mit `zahl(v, 1)` beides. Dass `Auswertung.jsx` seine Fassung sogar
exportiert und `AnalyseTab.jsx:35` sie importiert, macht die Verwechslung
wahrscheinlicher.

### 4.3 Die beiden Diagnosezeilen sind dasselbe Gerüst

- [x] **`DiagnoseZeile` und `WellnessZeile` auf eine `PruefZeile` ziehen**

`EinstellungenTab.jsx:283-390`: beide halten `offen`/`laeuft`/`erg`, beide
schalten auf `apiKey`, beide rendern `Zeile` + `szeile-eingabe` + Knopf +
`shilfe`. Unterschied sind die Abfrage und die Darstellung des Ergebnisses –
also genau zwei Steckplätze.

### 4.4 Die Zeitraumauswahl steht zweimal wörtlich da

- [x] **Die vier `<option>` einmal als Konstante**

`AnalyseTab.jsx:73-78` und `AnalyseTab.jsx:428-434` – identische
`<select>`-Blöcke mit denselben vier Optionen in derselben Datei.

---

## 5 · `plan.json`

Die Datei ist gut gebaut: `dokumentation` ganz oben erklärt Zweck, Bearbeitung
und die nicht offensichtlichen Regeln; alles zu einer Woche steht in einem
Objekt statt in parallelen Reihen; `schema.js` prüft beim Laden und die App
zeigt lieber gar keine Zahl als eine falsche. Das ist der richtige Aufbau, und
er soll so bleiben. Fünf Punkte fallen trotzdem auf.

### 5.1 Deutsch und Englisch gemischt

- [x] **Eine Sprache für die Schlüssel festlegen**

Die Schlüssel sind englisch (`weeks`, `coreCircuit`, `tuesdayMinutes`), die Werte
und die gesamte `dokumentation` deutsch – und `dokumentation` selbst ist der
einzige deutsche Schlüssel unter zwanzig englischen. Für eine Datei, die
ausdrücklich vom Nutzer bearbeitet werden soll und deren Fehlermeldungen deutsch
sind (`schema.js`), ist das eine Bruchstelle. Empfehlung: englisch bleiben und
`dokumentation` zu `documentation` machen – das ist die kleinere Änderung und
hält die Schlüssel maschinennah, während alles Erklärende deutsch bleibt.

### 5.2 Farben gehören nicht hierher

- [x] siehe **1.1**

### 5.3 Wochentage sind als Feldnamen einbetoniert

- [ ] **Erwägen: `days: { tue: …, wed: … }` statt `tuesdayMinutes`, `wednesdayMinutes`, …**

Heute heißen die Felder `tuesdayMinutes`, `wednesdayMinutes`, `saturdayMinutes`,
`sundayOptionalMinutes`, `thursday`, `saturdayBlocks`. Der Montag fehlt ganz –
dass er der Ruhetag ist, muss man aus `texts.mondayRest` erschließen. Wer den
Qualitätstag vom Donnerstag auf den Mittwoch legen will, kann das nicht in der
Datei tun, obwohl genau das der Zweck der Datei ist.

Das ist die größte Änderung der Liste und keine dringende – der Plan liegt fest.
Sie gehört aber vor die nächste Schemafassung erwogen, denn sie ändert `weeks`,
`day.js` und `schema.js` gemeinsam.

### 5.4 Wiederholung in `weeks`

- [x] **Prüfen, ob `thursday` als Verweis auf eine Vorlage kürzer wäre**

Das `thursday`-Objekt steht in den Wochen 1–3, 5–7 und 13–15 jeweils wörtlich
gleich da – neun von sechzehn Wochen tragen eine von drei Fassungen. Die
Ausschreibung hat einen echten Vorteil (jede Woche für sich lesbar, nichts kann
sich gegeneinander verschieben – genau die Begründung in `dokumentation.weeks`),
also ist das bewusst kein Fehler. Für die Lesbarkeit spräche eine
`thursdayTemplates`-Sektion mit `"thursday": "tempo"`; dagegen spricht, dass man
dann zweimal nachschlagen muss. **Entscheidung notieren, nicht stillschweigend
lassen** – der jetzige Zustand sieht sonst nach Copy-Paste aus, obwohl er es
nicht ist.

### 5.5 Unbekannte Schlüssel fallen still durch

- [x] **`planValidate` unbekannte Schlüssel der obersten Ebene melden lassen**

`schema.js:165` prüft alle Pflichtfelder, aber nichts prüft, ob ein Schlüssel
*zu viel* dasteht. Ein Tippfehler in einem optionalen Feld (`saturdayBlock` statt
`saturdayBlocks`, `powr` statt `power`) wird ohne ein Wort verworfen, und die
App rechnet mit dem Standardwert weiter – das widerspricht dem sonst
durchgehaltenen Grundsatz „lieber gar keine Zahl als eine falsche". Nebenbei
würde die Prüfung `dokumentation` ausdrücklich erlauben statt bloß dulden.

Auch die drei kleineren Punkte:

- `dokumentation.weeks` sagt „Eine Zeile je Trainingswoche" – tatsächlich sind es
  acht Zeilen je Woche. Satz nachziehen.
- `winterBlock.phase` ist `5`, `phaseNames` kennt aber nur `1`–`4`. Dass
  `plan.js:31` den Namen nachträglich einträgt, steht nur im Code. Ein Satz in
  `dokumentation` dazu.
- `thresholdTest.steps`: `label` und `short` unterscheiden sich nur im Leerzeichen
  (`"Zügig 1 / 3"` gegen `"Zügig 1/3"`). Wenn `short` nur die kompakte Schreibung
  ist, kann es entfallen und aus `label` erzeugt werden.

---

## 6 · Lesbarkeit und Formatierung

Grundlage ist gut: keine Tabs, kein Leerraum am Zeilenende, `if(…)` durchgehend
ohne Leerzeichen, zwei Leerzeichen Einrückung überall, jede Datei mit einem
erklärenden Kopf – bis auf eine.

### 6.1 Umlaute uneinheitlich

- [x] **Eine Schreibweise für Kommentare festlegen und durchziehen**

37 Dateien schreiben Kommentare in ASCII-Umschrift (`waere`, `laeuft`, `Uebung`,
`haengt`), `schema.js` schreibt sie durchgehend mit echten Umlauten, und in
`Koerperablauf.jsx:131` sowie `Uebungsbild.jsx:26` stehen beide Schreibweisen in
derselben Datei. Da alle Nutzertexte ohnehin UTF-8 mit echten Umlauten sind,
spricht nichts mehr für die Umschrift – sie ist ein Rest aus der Zeit vor der
Modultrennung und liest sich messbar schlechter.

### 6.2 `IntervalleTab.jsx` hat als einzige Datei keinen Kopfkommentar

- [x] **Dateikopf ergänzen**

Jede andere Datei im Projekt erklärt oben, was sie tut und warum sie so gebaut
ist. `IntervalleTab.jsx` beginnt bei Zeile 1 mit `import`. Zu erklären gäbe es
einiges: warum der Testmodus nicht verstellbar ist, warum die Ansagen über
`flags` statt über Gleichheitsvergleiche laufen (steht als Inline-Kommentar
weiter unten), warum der Tab die `Buehne` aus `Baustein.jsx` *nicht* benutzt.

### 6.3 Der Intervall-Timer folgt der eigenen Tastenregel nicht

- [x] **Prüfen, ob `IntervalleTab` die `Buehne` übernehmen kann**

`Baustein.jsx:63-80` legt ausdrücklich fest: links Zurück, Mitte Haupthandlung,
rechts Weiter – „beides liegt am selben Fleck". Der Intervalle-Tab baut seine
Reihe selbst (`IntervalleTab.jsx:196-200`) und belegt links **Reset** statt
Zurück. Das ist die eine Stelle, an der die aufwendig hergestellte Einheitlichkeit
bricht – und es ist ausgerechnet die Reihe, die man auf dem Rad blind trifft.

### 6.4 24 Inline-Styles

- [x] **`style="margin-top:…"` durch Klassen ersetzen**

24 Vorkommen, davon 15 reine `margin-top`-Korrekturen
(`AnalyseTab` 5×, `ZonenTab` 4×, `IntervalleTab` 4×, `Auswertung` 2×). Die
Abstände gehören in die Regeln von `.card`, `.row` und `.hint`, sonst wandert
jede Layoutänderung durch fünf JSX-Dateien. Die legitimen Fälle (berechnete
Balkenbreite, Zonenfarbe, `--runden`) bleiben natürlich.

### 6.5 Sehr lange Zeilen in `analysis.js`

- [x] **Meldungstexte aus dem Kontrollfluss lösen**

17 Zeilen über 140 Zeichen, die längste 244 (`analysis.js:453`) – durchgehend
`row.notes.push({kind:'', text:'…langer deutscher Satz…'})` mitten im
Verzweigungsbaum. Der Kontrollfluss verschwindet zwischen den Texten. Die Sätze
gehören als benannte Konstanten oder als Funktionen `noteZuKurz(min, soll)` an
den Dateianfang; der Rumpf von `anCompareDay` würde dabei um schätzungsweise ein
Drittel kürzer und endlich überschaubar. (Die *Schwellen* bleiben zu Recht hier
– das ist begründet in `analysis.js:7`.)

### 6.6 Namenspräfix `an` ist überflüssig geworden

- [x] **Erwägen: `an*` in `analysis.js` entpräfixen**

`anIsRide`, `anFmtMin`, `anCompareDay`, `anWeekTotals` … das `an` stammt aus der
Zeit, als alles in einer Datei lag und der Präfix den Namensraum ersetzte. Heute
macht das Modul das, und `anFmtMin` heißt beim Aufrufer trotzdem `anFmtMin`.
Reine Kosmetik, aber es betrifft eine der meistgelesenen Dateien. Am besten
zusammen mit 3.2 in einem Durchgang.

---

## 7 · Aufräumen und Werkzeug

### 7.1 Toter Code

- [x] **`formatDate` (`day.js:501`) löschen** – wird nirgends benutzt, auch
      nicht in Tests.
- [x] **`swUpdate` (`main.jsx:14`) prüfen** – exportiert, aber von niemandem
      importiert; der Update-Weg läuft über das `app-update-verfuegbar`-Event.
- [x] **`onWakeChange` / `wantsKeepAwake` / `isStandalone` (`platform/index.js`)** –
      drei Fähigkeiten mit Melderegister, aber ohne Abnehmer. Entweder benutzen
      (eine Diagnosezeile „Bildschirm wach: Wake Lock / Video / nicht verfügbar"
      wäre naheliegend und nützlich) oder entfernen.

### 7.2 Zu breite öffentliche Schnittstelle

- [x] **`export` streichen, wo es keinen Abnehmer gibt**

48 Exporte haben außerhalb ihrer eigenen Datei keinen Verwender, darunter zehn
`an*`-Notizenerzeuger. Das ist teils Absicht (Konstanten wie `SCHWELLEN`,
`ZEITGRENZE` dokumentieren), teils Rest des Umbaus. Bei den `an*`-Funktionen
lohnt der umgekehrte Weg: nicht entfernen, sondern in 3.3 testen – dann haben
sie einen Abnehmer.

### 7.3 Kein Linter, kein Formatter

- [x] **ESLint mit `eslint-plugin-react-hooks` aufsetzen**

Es gibt keine `.eslintrc`, keine `.prettierrc`, keine `.editorconfig`. Die
Formatierung ist trotzdem konsistent – das spricht für die Disziplin, hält aber
nicht, sobald jemand anderes beiträgt. Vor allem `react-hooks/exhaustive-deps`
würde hier tragen: mehrere `useEffect` haben bewusst unvollständige
Abhängigkeitslisten (`Beinblock.jsx:127` `[zelle]`, `AnalyseTab.jsx:290`
`[act.id]`, `TrainingTab.jsx:150` `[s.voice]`). Die sind alle begründet – aber
begründet gehört als `// eslint-disable-next-line` mit Grund dokumentiert, nicht
als stille Auslassung, die man von einem Versehen nicht unterscheiden kann.

`.editorconfig` mit `indent_size = 2`, `charset = utf-8`,
`insert_final_newline = true` kostet vier Zeilen und friert den Ist-Zustand ein.

### 7.4 Veraltete Zustandskopien beim Tageswechsel

- [x] **Prüfen: `cfg` in `TrainingTab` und `IntervalleTab` bei Wochenwechsel**

Beide leiten ihr `cfg` einmalig beim Einhängen aus `week.value` ab
(`TrainingTab.jsx:57`, `IntervalleTab.jsx:29`). Das `today`-Signal aktualisiert
sich, wenn die App über Mitternacht offen bleibt (`store.js:78`) – `cfg` nicht.
Wer die App am Samstagabend offen lässt und am Sonntagmorgen den Zirkel startet,
bekommt die Rundenzahl der Vorwoche. Selten, aber genau der Fall, für den das
`today`-Signal überhaupt eingeführt wurde. Ein `useEffect` auf `week.value`, der
nur zurücksetzt, solange kein Timer läuft, wäre die vorsichtige Lösung.

---

## Vorschlag für die Reihenfolge

1. **1.2, 1.3, 7.1** – klein, eindeutig, kein Diskussionsbedarf.
2. **2.1, 2.2** – die beiden Komponenten mit der größten Hebelwirkung; 2.2 löst
   1.4 gleich mit.
3. **1.1 + 5.2** – die Zonenfarben in einem Durchgang, sonst zwei Baustellen.
4. **3.1, 3.8, 4.1, 4.2** – Aufräumen der Schichten und der Dubletten.
5. **3.2 + 3.3 + 6.5 + 6.6** – `analysis.js` in einem Durchgang: teilen,
   testen, Texte lösen, entpräfixen.
6. **7.3** – Linter, sobald der Umbau steht, damit er nicht gegen ihn arbeitet.
7. Der Rest nach Gelegenheit; **5.3** erst vor der nächsten Schemafassung.
