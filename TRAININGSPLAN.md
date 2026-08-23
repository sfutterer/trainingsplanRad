# Trainingsplan Radfahren — Projektwissen

Wissensdokument für ein Claude-Projekt. Beschreibt den Trainingsplan, die zugehörige
PWA und den Zugriff auf Trainingsdaten über intervals.icu.

Aus dem Code der App extrahiert (`index.html`), nicht abgeschrieben. Bei Änderungen am
Plan muss dieses Dokument mitgezogen werden.

- **App:** https://sfutterer.github.io/trainingsplanRad/
- **Repo:** https://github.com/sfutterer/trainingsplanRad
- **Datenquelle:** intervals.icu, synchronisiert von Garmin Connect

> **Fassung 2, Stand 22.08.2026.** Überarbeitet nach einer Analyse gegen den Stand der
> Trainingslehre (Zonenmodelle, San Millán, VO2max-Protokolle, Krafttraining). Die
> Änderungen gegenüber Fassung 1 sind in Abschnitt 9 begründet. Der Plan reicht jetzt
> bis Woche 16 statt in einen unbefristeten Erhaltungszyklus zu laufen.
>
> **Nachtrag 22.08.2026:** Die Übergangs-Pulszonen wurden nach der ersten ausgewerteten
> Samstagsausfahrt korrigiert. Z2 liegt bei 128–142 bpm, nicht bei 108–126. Begründung
> in Abschnitt 1. **Nachtrag 23.08.:** Arbeitsbereich auf 128–135 eingegrenzt, 142 nur
> noch als harte Obergrenze.

---

## 1. Grundlagen des Plans

**Sportler:** Einsteiger im Radsport. Ausgangslage bei Planerstellung: eine etablierte
2-Stunden-Ausfahrt am Wochenende.

**Ziele, in dieser Rangfolge:**
1. Grundlagenausdauer
2. VO2max
3. Rumpfstabilität

**Sensorik:** Herzfrequenz durchgehend (Handgelenk). **Leistungs- und Trittfrequenzmesser
ab ca. 05.09.2026**, also ab Woche 4. Daraus ergibt sich die Zweiteilung des Plans in
eine Übergangszeit ohne Watt (Woche 1–3) und den regulären Betrieb ab Woche 4.

**Struktur:** vier Blöcke à vier Wochen, jede vierte Woche ist Erholungswoche
(`week % 4 === 0`).

- **Phase 1 (Woche 1–4):** Grundlage, Tempo-Intervalle in Z3. Woche 4 mit Schwellentest.
- **Phase 2 (Woche 5–8):** VO2max-Intervalle, 5 × 4 min.
- **Phase 3 (Woche 9–12):** Grundlagenblock, drei Z2-Tage, keine harten Intervalle.
  Woche 12 mit Retest.
- **Phase 4 (Woche 13–16):** Schwellenblock, 3 × 10–12 min. Woche 16 mit Retest.
- **Ab Woche 17:** Winterblock, siehe Abschnitt 8.

**Erholungswochen:** reduzierter Umfang **und** reduzierte Intensität. Keine Z5-Arbeit,
keine Blöcke am Samstag.

### Startdatum und Kalender

**Trainingsbeginn: Samstag, 15.08.2026.** Das ist der Bezugspunkt für alle
Wochenberechnungen: Woche *n* läuft ab `Start + (n − 1) × 7 Tagen` über sieben Tage.

Die Trainingswoche läuft dadurch **von Samstag bis Freitag** — sie beginnt also mit der
langen Ausfahrt und endet mit dem optionalen Freitag.

| Woche | Zeitraum | Phase |
|---|---|---|
| 1 | 15.08. – 21.08.2026 | 1 |
| 2 | 22.08. – 28.08.2026 | 1 |
| 3 | 29.08. – 04.09.2026 | 1 |
| **4** | 05.09. – 11.09.2026 | 1 · Erholung · **Test Do 10.09.** |
| 5 | 12.09. – 18.09.2026 | 2 |
| 6 | 19.09. – 25.09.2026 | 2 · Samstag mit Blöcken |
| 7 | 26.09. – 02.10.2026 | 2 |
| **8** | 03.10. – 09.10.2026 | 2 · Erholung |
| 9 | 10.10. – 16.10.2026 | 3 |
| 10 | 17.10. – 23.10.2026 | 3 · Samstag mit Blöcken |
| 11 | 24.10. – 30.10.2026 | 3 · **Zeitumstellung 25.10.** |
| **12** | 31.10. – 06.11.2026 | 3 · Erholung · **Retest Do 05.11.** |
| 13 | 07.11. – 13.11.2026 | 4 |
| 14 | 14.11. – 20.11.2026 | 4 · Samstag mit Blöcken |
| 15 | 21.11. – 27.11.2026 | 4 |
| **16** | 28.11. – 04.12.2026 | 4 · Erholung · **Retest Do 03.12.** |

**Aktuelle Woche selbst berechnen:** `floor((heute − 15.08.2026) / 7) + 1`. Das Datum in
diesem Dokument nicht als „heute" verwenden — immer gegen das tatsächliche Tagesdatum
rechnen.

In der App muss dasselbe Startdatum im Tab „Heute" eingetragen sein, sonst rechnen
Plananzeige, Timer-Voreinstellungen und Analyse mit einer falschen Woche.

**Wochenrhythmus:**

| Tag | Einheit |
|---|---|
| Montag | Ruhetag, kein Training |
| Dienstag | Rad, Grundlagenausdauer Z2 — **Arbeitsweg, verlängert** |
| Mittwoch | Rad, kurzes Z2 — **Arbeitsweg, direkt** · abends Rumpf **verkürzt** (2 Runden) |
| Donnerstag | Rad, Qualitätseinheit (je nach Phase) |
| Freitag | Ruhetag oder optional 30–40 min Z1 |
| Samstag | Lange Ausfahrt, Basis Z2 |
| Sonntag | Rumpf **voll** + Beinblock + optional Z1-Fahrt |

Der Tausch Mittwoch ↔ Sonntag ist bewusst: die anstrengendere Krafteinheit liegt jetzt
direkt vor dem Ruhetag Montag, und der Tag vor dem Qualitätstag Donnerstag ist leicht.

### Arbeitsweg als Trainingsbestandteil

Dienstag und Mittwoch sind Bürotage. Nur der Hinweg wird gefahren, mit Gepäck.
Direkte Strecke ca. 13 km; die Streckenwahl ist so angelegt, dass in Z2 mindestens
die Solldauer zusammenkommt — **gesteuert wird über die Zeit, nicht über die Distanz.**
Im Zweifel länger.

| Tag | Strecke | Charakter |
|---|---|---|
| **Dienstag** | verlängert, ca. 20 km+ | die volle Z2-Einheit nach Plan |
| **Mittwoch** | direkt, ca. 13 km | bewusst der lockerste Fahrtag der Woche |

**Warum der Mittwoch kurz bleibt:** Er ist der einzige Fahrtag direkt vor dem
Qualitätstag Donnerstag. Irgendein Tag muss der leichteste sein — das ist dieser.
Unteres bis mittleres Z2, nicht am Sprechtest-Limit.

**Ausnahme Phase 3 (Woche 9–12):** Dort ist der Donnerstag selbst eine Z2-Einheit und
braucht keine Schonung davor. Der Mittwoch wächst deshalb auf 60 min.

**Zusammenhängend statt aufgeteilt.** Eine gestreckte Hinfahrt schlägt zwei kürzere
Fahrten deutlich: der mitochondriale Reiz braucht die Dauer am Stück, zwei mal 30 min
sind nicht ein mal 60. Zusätzlich liegen zwischen Morgenfahrt und Rumpftraining am
Abend rund zehn Stunden Erholung.

**Praktische Randbedingungen:**

- **Ankunftspuffer 15 min.** Zeitdruck macht aus einer Z2-Fahrt zuverlässig eine
  Z3-Fahrt. Der Puffer ist Teil des Trainings.
- **Gepäck auf den Gepäckträger, nicht in den Rucksack.** Auf 20 km täglich belastet
  ein Rucksack Schultern, Hände und unteren Rücken — genau die Stellen, an denen
  Einsteiger beim Umfangsaufbau aussteigen.
- **Wattwerte mit Gepäck sind nicht mit denen vom Samstag vergleichbar.** Ab Woche 4
  relevant. Pendelfahrten in intervals.icu als `commute` taggen.
- **Ab Oktober:** Dunkelheit, Kälte und Nebel im Morgenverkehr. Beleuchtung und Reifen
  gehören dann zur Planung; bei niedrigen Temperaturen braucht die Fahrt länger, bis
  sie wirklich Z2 ist.

### Pulszonen — Übergangsfassung (Woche 1 bis 4)

**Korrigiert am 22.08.2026, methodisch nachgeschärft am 23.08.2026.** Die ursprünglichen
Bänder waren glatte %HFmax-Dekaden bei einer angenommenen HFmax von 180 bpm. Die
Dekaden-Aufteilung hat sich als falsch erwiesen; die HFmax-Annahme selbst trägt vorerst.

| Zone | bpm **(gültig)** | ursprünglich | Verwendung |
|---|---|---|---|
| unter Z1 | < 100 | < 90 | Rollen, Pause |
| Z1 | 100–128 | 90–108 | Erholung, Einfahren, optionale Fahrten |
| **Z2 Arbeitsbereich** | **128–135** | 108–126 | **Grundlagenausdauer — hier fahren** |
| Z2 Obergrenze | 135–142 | — | nur kurzzeitig, siehe unten |
| Z3 | 142–155 | 126–144 | Tempo |
| Z4 | 155–168 | 144–162 | Übergang, im Plan nicht angesteuert |
| Z5 | > 168 | 162–180 | VO2max |

**Der Arbeitsbereich 128–135 ist belegt, die Obergrenze 142 nicht.** Grundlagenfahrten
werden in 128–135 gefahren. 142 ist eine harte Grenze, kein Ziel.

#### Woher die Korrektur kommt

Datengrundlage: Samstagsausfahrt 22.08.2026, 143 min, 46,9 km, 113 hm, überwiegend flach.
Unbefestigter Untergrund überwiegend im ersten Drittel, komplett in der ersten Hälfte.
Letztes Drittel mit Ortschaften, Kreuzungen, Orientierung und einsetzender Dunkelheit.

| Befund | Wert |
|---|---|
| HF Ø / Median | 131 / 131 |
| Zeit im alten „Z3"-Band (126–144) | 80,7 % |
| Zeit im alten „Z2"-Band (108–126) | 13,6 % |
| Sprechtest bei 130–135 | ganze Sätze möglich, ein bis zwei Atemzüge |
| Sprechtest bei 144 | noch möglich |
| HF-Sprünge > 8 bpm/s im gesamten Stream | **0** |
| Zeit ≥ 144 bpm | 5,9 min in 11 kurzen Blöcken, max. 156 |

**Der Rechenfehler in den alten Bändern:** 130–135 bpm entsprechen 72–75 % der
angenommenen HFmax von 180. Genau dort verortet die Literatur LT1 — nicht bei 60–70 %.
Das alte Z2-Band lag eine ganze Dekade zu tief und beschrieb in Wahrheit
Erholungsintensität.

**Zum Wert 144:** kein Messfehler. Über den gesamten Stream gibt es keinen einzigen
Sprung über 8 bpm/s, wie er für Kadenz-Lock oder Aussetzer der optischen Messung
typisch wäre. Die elf kurzen Blöcke über 144 sehen nach echten Antritten aus.

#### Driftanalyse — und warum die Obergrenze unsicher ist

Die erste Auswertung nannte 1,8 % Drift über die Hälften. **Dieser Wert war zu grob
gerechnet.** Bei feinerer Aufteilung und nach Herausfiltern aller Stop-and-go-Phasen
(nur Segmente ≥ 120 s durchgehend > 15 km/h, zusammen 83 von 143 min):

| Drittel | Steady-Zeit | Ø km/h | Ø HF | EF (km/h ÷ HF) |
|---|---|---|---|---|
| D1 | 36,5 min | 21,2 | 131,0 | 0,1619 |
| D2 | 34,8 min | 20,8 | 131,6 | 0,1578 |
| D3 | 11,7 min | 20,0 | 132,2 | 0,1513 |

**Drift D1 → D3: +6,5 %. Über die Hälften: +3,9 %.** Zielwert ist unter 5 %.

Der Effekt bleibt also auch ohne Ampeln und Kreuzungen bestehen und ist **nicht** durch
Gelände erklärbar — der unbefestigte Abschnitt lag am Anfang, was die frühe Effizienz
eher unterschätzt und den realen Abfall damit noch etwas größer macht.

**Trotzdem war die Fahrt nicht klar über LT1.** Gegenprobe bei gleicher Geschwindigkeit,
früh gegen spät:

| Geschwindigkeit | HF früh | HF spät | Δ |
|---|---|---|---|
| 16–18 km/h | 130,7 | 130,2 | −0,5 |
| 18–20 km/h | 131,4 | 131,3 | −0,1 |
| 20–22 km/h | 130,5 | 132,4 | +1,9 |
| 22–24 km/h | 130,9 | 132,4 | +1,6 |

Bei einer Fahrt von 2,4 h **oberhalb** LT1 wären 5 bis 10 Schläge Anstieg zu erwarten.
Ein bis zwei sind es. Der Drift von 4–6,5 % hat vermutlich andere Ursachen: längste
Fahrt bisher, Knieprobleme ab der Hälfte, Verpflegung und Trinken über 2,4 h, Abkühlung
und Dunkelheit am Ende.

**Schlussfolgerung:** Die untere Hälfte des Bandes ist belegt, die obere nicht. Deshalb
128–135 als Arbeitsbereich.

**Nächste Überprüfung:** Samstagsausfahrt konsequent bei 128–135 fahren. Fällt der Drift
dann unter 5 %, ist die Obergrenze gefunden — ein sauberer Test ganz ohne Powermeter.

#### Status dieser Bänder

**Arbeitsannahme, kein gemessener Wert.** Sie stützt sich auf einen einzigen Datenpunkt,
eine ungeprüfte HFmax und auf Geschwindigkeit als Ersatz für Leistung. Geschwindigkeit
ist dafür ein schlechter Stellvertreter — Wind, Untergrund und Steigung verfälschen sie.
Ab dem Powermeter rechnet intervals.icu das Decoupling aus Watt, dann ist die Frage
endgültig geklärt.

Die Bänder gelten bis zum Test am 10.09.2026 und ersetzen bis dahin die alte Tabelle
vollständig — auch rückwirkend in der Auswertung.

Weiterhin gilt: **der Sprechtest sticht die Zahl.** Die Bänder sind eine Hilfslinie, die
Atmung ist die Steuergröße.

**Wichtig für jede Auswertung:** Diese Bänder sind nicht die Zonen von intervals.icu.
Dort sind die Zonen an der LTHR ausgerichtet, `icu_hr_zone_times` passt also **nicht**
auf diese Tabelle. Zeit je Zone muss aus dem Puls-Stream gegen die Bänder oben
gerechnet werden. Fahrten vor dem 22.08. sind mit den alten Bändern ausgewertet worden
und müssen neu gerechnet werden, bevor sie vergleichbar sind.

#### Methodenhinweis für künftige Driftanalysen

Der erste Anlauf war methodisch zu grob. Für alle weiteren Auswertungen gilt:

1. **Nicht nur Hälften vergleichen** — Drittel zeigen Effekte, die die Zweiteilung
   verdeckt.
2. **Stop-and-go herausfiltern.** Nur Segmente ≥ 120 s durchgehend > 15 km/h werten.
   Ortsdurchfahrten und Kreuzungen verzerren EF stark.
3. **Gegenprobe bei gleicher Geschwindigkeit** früh gegen spät. Das ist der belastbarere
   Test als jede EF-Mittelung.
4. **Untergrund und Streckenprofil notieren**, sonst ist die Zuordnung von Ursachen
   Raten. Ab Woche 4 entfällt das Problem, weil Watt unabhängig davon sind.

### Zonen ab Woche 5 — Zielmodell

Nach dem Test am 10.09. werden beide Zonensätze **nach Coggan** gesetzt, in
intervals.icu **und** in der App identisch. Damit entfällt die eigene Zonenrechnung als
Pflichtweg und `icu_hr_zone_times` wird wieder verwendbar.

**Herzfrequenz, % LTHR:**

| Zone | % LTHR | Verwendung |
|---|---|---|
| Z1 | < 68 % | Erholung, optionale Fahrten |
| Z2 | 69–83 % | Grundlagenausdauer |
| Z3 | 84–94 % | Tempo |
| Z4 | 95–105 % | Schwelle (Phase 4) |
| Z5 | > 106 % | VO2max |

**Leistung, % FTP:**

| Zone | % FTP | Verwendung |
|---|---|---|
| Z1 | < 55 % | Intervallpausen, optionale Fahrten |
| Z2 | 56–75 % | Grundlagenausdauer |
| Z3 | 76–90 % | Samstagsblöcke |
| Z4 | 91–105 % | Schwelle (Phase 4) |
| Z5 | 106–120 % | VO2max (Phase 2) |

**Coggan-Z2 ist breit.** 69–83 % LTHR reicht bis nahe an Tempo heran; das obere Ende
liegt bei Einsteigern häufig über LT1. Für Grundlagenfahrten gilt deshalb dauerhaft:
**der Sprechtest sticht die Zahl.** Ganze Sätze müssen möglich sein, Atmung merklich
vertieft, aber ruhig und rhythmisch. Wird das Sprechen kurzatmig, ist LT1 überschritten.

### Steuergrößen je Einheit

| Einheit | Primär | Kontrolle |
|---|---|---|
| Di Z2 | Sprechtest, HF 128–135 | Ø-Watt beobachten, nicht steuern |
| Mi Z2 kurz | Sprechtest, bewusst darunter | — |
| Do Intervalle (ab W5) | **Watt** | HF nur am Intervallende |
| Do Intervalle (bis W4) | Atmung, HF ab Minute 3 | — |
| Do Schwelle (Phase 4) | **Watt** | HF sollte in Z4 einpendeln |
| Sa Basis | HF Z2 + Sprechtest | Decoupling nach der Fahrt |
| Sa Blöcke | Watt 80–88 % FTP | HF steigt langsam, ist normal |
| Fr/So optional | HF unter Z2-Obergrenze | — |

### Trittfrequenz — ab Woche 4

Vor dem Sensor wird die Kadenz **nicht** erfasst. Manuelles Zählen ist ausdrücklich
kein Bestandteil des Plans.

| Situation | Ziel |
|---|---|
| Grundlage Z2 | 85–90 rpm |
| Intervalle Z5 | 95–100 rpm |
| Schwellenblöcke | 85–90 rpm |
| Anstieg | nicht unter 70 rpm, notfalls Übersetzung anpassen |

Liegt die selbstgewählte Kadenz deutlich darunter (60–75 ist bei Einsteigern normal),
in 5er-Schritten über vier bis sechs Wochen herantasten, nicht erzwingen.

**Kadenzpyramide** als Teil des Einfahrens am Dienstag, alle ein bis zwei Wochen:
30 s je 90 / 100 / 110 / 120 / 110 / 100 / 90 rpm im leichten Gang, Puls bleibt in
Z1/Z2, nicht im Sattel hüpfen. Kostet 3,5 min.

**Kein Kraftausdauertraining mit niedriger Kadenz** (großer Gang, 50–60 rpm) im ersten
Jahr. Hohe Pedalkräfte bei untrainierter Beinmuskulatur belasten das Knie.

### Wellness-Gate

Morgens vor dem Donnerstag zu prüfen, Datenquelle `GET /athlete/0/wellness`:

```
Ruhepuls > 7-Tage-Schnitt + 5 bpm          ODER
HRV deutlich unter 7-Tage-Schnitt          ODER
Schlaf < 6 h in zwei Nächten hintereinander
  → Donnerstag wird 60 min Z2
  → Samstag ohne Blöcke
```

Nach fieberhaftem Infekt mindestens so viele lockere Tage wie Krankheitstage, bevor
wieder Intensität gefahren wird.

### Geschwindigkeitsannahme

Distanzangaben sind Schätzwerte, keine Vorgaben:
`Geschwindigkeit = min(21 + 0,15 × (Woche − 1), 24)` km/h.

**Gilt nur bis Woche 4.** Sobald Leistungsdaten vorliegen, sind Distanz- und
Geschwindigkeitsschätzungen ohne Aussagewert und werden nicht mehr angezeigt.

---

## 2. Wochenplan im Detail

| Woche | Phase | Di Z2 | Mi Z2 | Do Qualität | Sa lange Ausfahrt | So Z1 optional | Rumpf So (voll) |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 60 min / 21 km | — | 4×5 min Z3, 3 min Pause → 56 min | 120 min / 42 km + 18 min Z3 | 30 min | 2 Rd × 25 s / 25 s → 14 min |
| 2 | 1 | 70 min / 25 km | 40 min | 4×5 min Z3, 3 min Pause → 56 min | 130 min / 46 km, **reines Z2** | 30 min | 2 Rd × 30 s / 25 s → 15 min |
| 3 | 1 | 80 min / 28 km | 40 min | 5×5 min Z3, 3 min Pause → 64 min | 140 min / 50 km, **reines Z2** | 35 min | 2 Rd × 35 s / 25 s → 16 min |
| **4** Erholung | 1 | 45 min | 30 min | **Schwellentest → 65 min** | 90 min, reines Z2 | 25 min | 2 Rd × 25 s / 25 s → 14 min |
| 5 | 2 | 85 min | 40 min | 5×4 min Z5, 4 min Pause → 63 min | 150 min, reines Z2 | 35 min | 3 Rd × 30 s / 20 s → 21 min |
| 6 | 2 | 90 min | 40 min | 5×4 min Z5, 4 min Pause → 63 min | 160 min **+ 2×12 min Z3** | 40 min | 3 Rd × 35 s / 20 s → 23 min |
| 7 | 2 | 90 min | 40 min | 5×4 min Z5, 4 min Pause → 63 min | 170 min, reines Z2 | 40 min | 3 Rd × 40 s / 20 s → 25 min |
| **8** Erholung | 2 | 50 min | 30 min | 4×3 min Z3/Sweetspot → 48 min | 100 min, reines Z2 | 25 min | 2 Rd × 30 s / 25 s → 15 min |
| 9 | 3 | 85 min | **60 min** | **70 min Z2** | 155 min, reines Z2 | 40 min | 3 Rd × 35 s / 20 s → 23 min |
| 10 | 3 | 90 min | **60 min** | **75 min Z2** | 165 min **+ 2×12 min Z3** | 40 min | 3 Rd × 40 s / 20 s → 25 min |
| 11 | 3 | 90 min | **60 min** | **75 min Z2** | 170 min, reines Z2 | 40 min | 3 Rd × 40 s / 20 s → 25 min |
| **12** Erholung | 3 | 50 min | 30 min | **Retest → 65 min** | 100 min, reines Z2 | 25 min | 2 Rd × 30 s / 25 s → 15 min |
| 13 | 4 | 85 min | 40 min | 3×10 min Z4, 5 min Pause → 67 min | 160 min, reines Z2 | 40 min | 3 Rd × 40 s / 20 s → 25 min |
| 14 | 4 | 90 min | 40 min | 3×12 min Z4, 5 min Pause → 73 min | 170 min **+ 2×12 min Z3** | 40 min | 3 Rd × 40 s / 20 s → 25 min |
| 15 | 4 | 90 min | 40 min | 3×12 min Z4, 5 min Pause → 73 min | 175 min, reines Z2 | 40 min | 3 Rd × 40 s / 20 s → 25 min |
| **16** Erholung | 4 | 50 min | 30 min | **Retest → 65 min** | 100 min, reines Z2 | 25 min | 2 Rd × 30 s / 25 s → 15 min |

**Wochenumfang Rad** (Di + Mi + Do + Sa + So): 266 · 326 · 359 · 255 · 373 · 393 · 403 ·
253 · 410 · 430 · 435 · 270 · 392 · 413 · 418 · 270 Minuten.

Woche 1 ist ohne Mittwochsfahrt gefahren worden. Der Sprung von Woche 1 auf Woche 2
(+23 %) ist der Einführung des Pendeltags geschuldet und einmalig; ab Woche 3 liegt
die Steigerung je Belastungswoche bei rund 10 %.

**Z2-Summe pro Woche** ist die Kennzahl, die zählt — Zielgröße 300–400 min. Woche 3
kommt auf rund 260 min, Phase 3 auf über 380 min.

**Zugrundeliegende Reihen** (Index 0 = Woche 1):

```
TUE_MIN     [60, 70, 80, 45, 85, 90, 90, 50, 85, 90, 90, 50, 85, 90, 90, 50]
WED_MIN     [0, 40, 40, 30, 40, 40, 40, 30, 60, 60, 60, 30, 40, 40, 40, 30]
SAT_MIN     [120, 130, 140, 90, 150, 160, 170, 100, 155, 165, 170, 100, 160, 170, 175, 100]
SUN_MIN     [30, 30, 35, 25, 35, 40, 40, 25, 40, 40, 40, 25, 40, 40, 40, 25]
CORE_WORK   [25, 30, 35, 25, 30, 35, 40, 30, 35, 40, 40, 30, 40, 40, 40, 30]
CORE_ROUNDS [2, 2, 2, 2, 3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 2]
CORE_REST   [25, 25, 25, 25, 20, 20, 20, 25, 20, 20, 20, 25, 20, 20, 20, 25]
```

`WED_MIN` ist ein **Mindestwert**, kein Sollwert: die Strecke ist so gewählt, dass in
Z2 mindestens diese Zeit zusammenkommt. Längere Fahrzeit ist kein Planverstoß.

`CORE_*` gilt für den **Sonntag**. Der Mittwoch fährt immer **2 Runden** mit derselben
Belastung und Pause.

**Donnerstag je Phase:**

| Phase | Wochen | Inhalt | Ziel |
|---|---|---|---|
| 1 | 1–3 | 4–5 × 5 min Z3, 3 min Pause | Tempo, pulsfreundliche Intervalllänge |
| 1 | 4 | Schwellentest | FTP + LTHR |
| 2 | 5–7 | **5 × 4 min**, 4 min Pause, 108–115 % FTP | VO2max |
| 2 | 8 | 4 × 3 min bei ~95 % FTP | Erholungswoche, kein Z5 |
| 3 | 9–11 | 70–75 min Z2 | dritter Grundlagentag |
| 3 | 12 | Retest | FTP + LTHR |
| 4 | 13–15 | 3 × 10–12 min bei 90–95 % FTP, 5 min Pause | Schwelle |
| 4 | 16 | Retest | FTP + LTHR |

Einfahren immer 15 min, Ausrollen 12 min. Die Wiederholungszahl in Phase 2 ist **fest
bei 5** — die Progression läuft über die Leistung, nicht über mehr Wiederholungen.

**Samstag:** Basis Z2. Z3-Blöcke nur in den Wochen 6, 10 und 14 (`Woche ≥ 5 und
Woche % 2 === 0 und Woche % 4 ≠ 0`), dann 2 × 12 min in der **zweiten Hälfte** der
Fahrt mit 8 min lockerem Rollen dazwischen. In allen übrigen Wochen reines Z2.
Einfahren 15 min, Ausrollen 10 min.

### Ausführungsregeln Intervalle

Gelten für Phase 1 besonders, weil dort ohne Watt gefahren wird:

1. **Rollender Start.** In der letzten Minute der Erholung das Tempo leicht anziehen.
   Aus 110 bpm zu starten kostet zwei Minuten Aufholzeit.
2. **Bewertungsfenster ist Minute 3 bis 5** (Phase 1) bzw. Minute 2 bis 4 (Phase 2).
   Der Puls davor ist bedeutungslos und darf keine Reaktion auslösen.
3. **Atmung führt, Puls bestätigt.** Bei Widerspruch gewinnt die Atmung.
4. **Die letzte Wiederholung ist die härteste.** Ist die erste die schwerste, war der
   Start zu hart. Ziel ab Phase 2: Leistungsabfall Wdh. 1 → letzte unter 5 %.
5. **Kadenz-Lock erkennen.** Fällt der Puls in der Erholung nicht binnen 60–90 s
   merklich ab oder klebt er nahe der Trittfrequenz, misst die optische Messung die
   Beine. Ab da nach Atmung fahren, Aufzeichnung verwerfen.
6. **Uhr fest und höher tragen**, ein bis zwei Fingerbreit über dem Handgelenkknochen.

### Schwellentest (Woche 4, 12, 16 — Donnerstag)

| Schritt | Dauer |
|---|---|
| Einfahren, darin 3 × 1 min zügig mit je 1 min Pause | 20 min |
| All-out | 5 min |
| Locker rollen | 10 min |
| **Gleichmäßig maximal** | 20 min |
| Ausrollen | 10 min |

- **FTP** = Ø-Watt der 20 min × 0,95
- **LTHR** = Ø-Puls der 20 min
- Der 5-min-Wert ist die VO2max-Referenzleistung.

**Pacing:** die ersten drei Minuten bewusst konservativer als das Ziel. Auf die
Runden-Durchschnittsleistung schauen, nicht auf den Momentanwert. Die letzten zwei
Minuten sollen sich anfühlen wie „gerade noch".

**Strecke:** 20 min ohne Ampel, Kreuzung, Abfahrt oder Gegenverkehr, flach oder
gleichmäßig ansteigend. Immer dieselbe Strecke, ähnliche Uhrzeit, gleiches Rad,
gleicher Reifendruck — sonst ist der Retest nicht vergleichbar.

**Verschiebungsregel:** schlechter Schlaf, Infekt im Anflug, über 30 °C oder Sturm →
auf den Samstag derselben Woche verschieben und mit der langen Ausfahrt tauschen. Ein
Test unter schlechten Bedingungen verzerrt die Zonen für acht Wochen.

### Messpunkte im Überblick

| Wann | Was | Aufwand |
|---|---|---|
| **laufend, Woche 1–3** | Sprechtest-Puls und RPE nach jeder Einheit | 1 min |
| **einmalig, vor Woche 4** | HFmax aus der Historie ziehen | 5 min |
| **Do 10.09. (W4)** | Schwellentest → FTP, LTHR, 5-min-Leistung | 65 min |
| **Do 05.11. (W12)** | Retest | 65 min |
| **Do 03.12. (W16)** | Retest | 65 min |
| **wöchentlich ab W4** | Decoupling, EF, eFTP ablesen | 2 min |

### Erhebung in der Übergangszeit (Woche 1–3)

Ohne Leistungsmesser sind das die einzigen verwertbaren Daten. Sie sind die
Gegenprobe zum Testergebnis am 10.09. — zeigen alle drei in dieselbe Richtung, ist der
Testwert plausibel.

| Größe | Wann | Wie |
|---|---|---|
| **Sprechtest-Puls** | jede Z2-Fahrt | Nach Atmung fahren. Wenn ganze Sätze anstrengend werden: Puls ablesen und notieren. **Nicht umgekehrt** — der Puls folgt der Atmung, nicht die Atmung dem Puls. |
| **Puls Minute 5 der letzten Wiederholung** | jeder Donnerstag | Untergrenze für die LTHR und Plausibilitätsprüfung der Z3-Obergrenze (155) |
| **RPE 1–10** | jede Einheit | Vergleichsmaßstab für später, wenn plötzlich Wattwerte danebenstehen |

**HFmax:** kein eigener Test nötig. Höchsten je aufgezeichneten Wert aus intervals.icu
ziehen (`max_heartrate` über alle Aktivitäten). Stehen dort nur lockere Fahrten, liefert
der erste harte Donnerstag den Wert.

### Was nach jedem Test festgehalten wird

| Feld | Quelle | Wohin |
|---|---|---|
| Ø-Watt der 20 min | Aktivität | Notiz + unten |
| **FTP** = Ø-Watt × 0,95 | Rechnung | intervals.icu Settings + App |
| **LTHR** = Ø-Puls der 20 min | Aktivität | intervals.icu Settings + App |
| Ø-Watt der 5 min | Aktivität | Notiz, VO2max-Referenz |
| Ø-Kadenz der 20 min | Aktivität | Notiz |
| Gewicht am Testtag | Waage | Wellness — sonst ist W/kg über die Tests nicht vergleichbar |
| Bedingungen | selbst | Temperatur, Wind, Strecke, Rad, Reifendruck |
| RPE der letzten 5 min | selbst | 1–10; unter 9 heißt: nicht ausbelastet, Wert eher zu niedrig |

**Wohin dokumentieren:** als Notiz an der Aktivität in intervals.icu (bleibt beim
Datensatz) **und** in der Tabelle unten (macht die Entwicklung auf einen Blick
sichtbar).

### Testhistorie

| Datum | Woche | Ø-Watt 20 min | FTP | LTHR | Ø-Watt 5 min | Gewicht | Bedingungen |
|---|---|---|---|---|---|---|---|
| 10.09.2026 | 4 | | | | | | |
| 05.11.2026 | 12 | | | | | | |
| 03.12.2026 | 16 | | | | | | |

### Checkliste unmittelbar nach dem Test

1. FTP und LTHR in intervals.icu Settings → Ride eintragen
2. Power Zones und HR Zones auf **Coggan** stellen, Load Priority auf **Power**
3. FTP von automatisch auf **manuell** umstellen, damit ein einzelner Antritt am Berg
   den Testwert nicht überschreibt
4. Dieselben fünf Grenzwerte in die App übernehmen
5. Zeile in der Testhistorie oben ausfüllen
6. Sprechtest-Puls aus der Übergangserhebung gegen die neue Z2-Obergrenze halten —
   liegt er deutlich darunter, wird Z2 nach unten begrenzt
7. Am Folgetag locker oder frei. Der Test ist eine harte Einheit.

### Laufende Kontrolle zwischen den Tests

Kein Aufwand, nur ablesen — wöchentlich nach der Samstagsausfahrt:

| Größe | Wo | Was sie sagt |
|---|---|---|
| **Decoupling Pw:HR** | Aktivität Samstag | ≤ 5 % → Grundlage trägt diese Dauer. Steigt der Wert über Wochen bei gleicher Dauer, ist etwas nicht in Ordnung. |
| **Efficiency Factor** | Aktivität Di und Sa | Trend über Wochen, nicht Einzelwert |
| **eFTP** | Power-Seite | Zwischenkontrolle. Weicht er stark vom Testwert ab, ist ein früherer Retest sinnvoll. |
| **CTL-Rampe** | Fitness-Seite | ≤ 5 Punkte/Woche |

Diese vier ersetzen keinen Test, verhindern aber, dass acht Wochen mit falschen Zonen
gefahren werden.

---

## 3. Rumpf-Zirkel und Beinblock

8 Übungen, Rundenzirkel. Rundenpause fest 60 s, 10 s Vorlauf.
Gesamtdauer = `Runden × (8 × Belastung + 7 × Pause) + (Runden − 1) × 60 + 10`.

**Sonntag:** volle Rundenzahl aus `CORE_ROUNDS`, anschließend Beinblock.
**Mittwoch:** immer 2 Runden, kein Beinblock.

### Reihenfolge und Begründung

Die Reihenfolge ist bewusst so gewählt, dass **nie zwei Übungen mit derselben
Anforderung direkt aufeinander folgen**. Plank (3.) und Liegestütz (5.) liegen früh, weil
beide volle Rumpfspannung brauchen; die beiden Seitstütze sind durch das Hüftheben
getrennt, damit der Stützarm dazwischen frei ist.

| # | Übung | Dosierung | Anforderung |
|---|---|---|---|
| 1 | Dead Bug | Wdh., Tempo 5 s, **alternierend** | vorne, Rückenlage, geringe Anforderung |
| 2 | Schulterstabilität (Band-Pull-Apart) | Wdh., Tempo 3 s | Schulter/Zug, stehend |
| 3 | Unterarmstütz (Plank) | halten | vorne, gestützt |
| 4 | Bird Dog | Wdh., Tempo 5 s, **alternierend** | hinten/Anti-Rotation, Vierfüßler |
| 5 | Liegestütz | Wdh., Tempo 3 s | Druck |
| 6 | Seitstütz links | halten | seitlich |
| 7 | Hüftheben (Glute Bridge) | Wdh., Tempo 3 s | Hüftstreckung, Rückenlage |
| 8 | Seitstütz rechts | halten | seitlich |

### Beinblock (nur Sonntag, im Anschluss an den Zirkel)

Drei Übungen als kleiner Zirkel, 2–3 Runden. **Kein Timer — Wiederholungen zählen.**
Zeitbedarf 8–12 min. Anders als beim Rumpf-Zirkel ist die Wiederholung die Einheit,
nicht die Sekunde: eine Kniebeuge mit 3 s Absenken lässt sich nicht sinnvoll gegen eine
Uhr fahren, ohne dass genau das Tempo verlorengeht, das den Reiz ausmacht.

**Warum nach dem Zirkel:** Der Zirkel dient als Aufwärmen. Der Beinblock wird **nie
kalt** begonnen — falls er einmal allein steht, gehen 5 min lockeres Einrollen oder
Hampelmänner voraus.

#### Reihenfolge und Begründung

| # | Übung | Warum an dieser Stelle |
|---|---|---|
| 1 | Kniebeuge, frei | beidbeinig, größte Muskelmasse, braucht die frischeste Technik |
| 2 | Split Squat / Ausfallschritt | einbeinig, verlangt Stabilität — geht nach der Kniebeuge, aber vor der Ermüdung der Wade |
| 3 | Wadenheben einbeinig | kleinste Muskelgruppe, darf zuletzt ermüden |

Pause zwischen den Übungen 30 s, zwischen den Runden 60 s.

#### Dosierung je Phase

| Phase | Wochen | Kniebeuge | Split Squat | Wadenheben | Runden |
|---|---|---|---|---|---|
| 1 | 1–3 | 8–10 Wdh. | 6 je Seite | 10 je Seite | 2 |
| 2 | 5–7 | 10–12 Wdh. | 8 je Seite | 12 je Seite | 2 |
| 3 | 9–11 | 12–15 Wdh. | 8 je Seite | 12–15 je Seite | 3 |
| 4 | 13–15 | 8–10 **mit Zusatzgewicht** | 6–8 **mit Zusatzgewicht** | 12–15, Ferse erhöht | 3 |
| — | Erholungswochen 4, 8, 12, 16 | unterer Rand der laufenden Phase | | | 2 |

```
LEG_ROUNDS  [2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 3, 3, 3, 2]
```

**Tempo durchgehend:** 3 s absenken, 1 s heben, keine Pause unten, kein Schwung.
Das exzentrische Absenken ist der Reiz — schnelles Ablassen halbiert den Nutzen.

#### Progressionsregel

Weiterrücken erst, wenn das **obere Ende der Wiederholungsspanne in allen Runden mit
sauberer Form** erreicht wurde, und das an zwei aufeinanderfolgenden Sonntagen.
Die Reihenfolge der Steigerung:

1. mehr Wiederholungen innerhalb der Spanne
2. mehr Runden (2 → 3)
3. schwierigere Variante — Split Squat mit erhöhtem hinteren Fuß, Wadenheben mit
   erhöhter Ferse
4. Zusatzgewicht — Rucksack mit Büchern oder Wasserflaschen, später Kurzhanteln

**Nicht** über das Tempo steigern und **nicht** über mehr Übungen. Drei Übungen
genügen; ein längerer Block wird an einem Sonntag mit langer Samstagsausfahrt im Rücken
nicht durchgehalten.

#### Abbruchregel

Wie im Zirkel: kippt die Form, ist der Satz zu Ende. Konkrete Abbruchzeichen:

- Knie fällt beim Aufrichten nach innen
- Rücken rundet im unteren Bereich
- Ferse hebt sich vom Boden
- Oberkörper kippt beim Split Squat zur Seite

Lieber 6 saubere Wiederholungen als 12 schlechte. Im ersten Block geht es um
Bewegungsqualität, nicht um Maximalkraft.

#### Einordnung in die Woche

- Der Beinblock liegt **vor dem Ruhetag Montag** und vier Tage vor dem Qualitätstag
  Donnerstag. Das ist der einzige Platz in der Woche, an dem er nichts stört.
- Die optionale Sonntagsfahrt kommt **davor**, nicht danach.
- **Muskelkater in den ersten zwei bis drei Wochen ist zu erwarten.** Der Dienstag
  fühlt sich dann schwerer an. Die Fahrt trotzdem machen, aber am unteren Rand von Z2 —
  sie beschleunigt die Erholung eher, als dass sie schadet.
- Fällt der Sonntag aus, wird der Beinblock **nicht** auf den Mittwoch nachgeholt.
  Ausgefallen ist ausgefallen.

*Warum überhaupt: die Studienlage zum Krafttraining für Radfahrer (2 × pro Woche,
Fokus Beine, 3 Sätze à 4–10 Wdh.) zeigt bessere Effizienz und rund 5 % mehr Leistung im
40-min-Test. Der Zirkel aus Fassung 1 enthielt außer dem Hüftheben keine Beinarbeit.
Die hier gewählte Körpergewichts-Dosierung liegt bewusst unterhalb dieser Studienlage —
sie ist der Einstieg, nicht das Ziel. Die belegte Dosierung mit hoher Last steht im
Winterblock (Abschnitt 8) an.*

### Dosierungsmodell

Die Zeit bleibt die Uhr des Zirkels, damit der Timer handsfrei läuft. Dynamische
Übungen bekommen zusätzlich ein **Wiederholungsziel**: `floor(Belastung ÷ Tempo)`, bei
alternierenden Übungen auf eine gerade Zahl abgerundet, damit beide Seiten gleich oft
drankommen. Beispiel bei 40 s: Bird Dog 8 Wdh. (4 je Seite), Liegestütz 13 Wdh.

Der Tempo-Hinweis ist wesentlich: ein reines „so viele wie möglich" würde genau das
zerstören, worum es bei Dead Bug und Bird Dog geht — kontrollierte Anti-Extension.

### Abbruchregel

Wenn die Form kippt — Hüfte hängt durch, Rücken wird rund, Zittern — ist der Satz zu
Ende. Abbrechen ist besser als schlecht weitermachen; eine Runde weniger kostet nichts.

### Übungsanleitungen

**Dead Bug** — Rückenlage, Arme zur Decke, Knie 90°. Gegenüberliegenden Arm und Bein
langsam absenken (ca. 2 s). Unterer Rücken bleibt flach am Boden, Rippen Richtung
Becken. Ca. 2 s kontrolliert zurück. Jede Wiederholung wechselt die Seite.
*Ziel: tiefe Bauchmuskulatur ohne Belastung des Rückens.*

**Band-Pull-Apart** — Band vor der Brust, Arme auseinanderziehen, Schulterblätter
zusammen. Ca. 2 s ziehen und kurz halten, 1 s zurück. Schultern bleiben unten.
*Ziel: gegen das Einsinken der Schultern bei langem Rennradfahren.*

**Unterarmstütz (Plank)** — Unterarme und Zehen am Boden, gerade Linie von Kopf bis
Ferse, Bauchnabel Richtung Wirbelsäule. Po nicht hochschieben, Rücken nicht durchhängen.
*Ziel: gesamte Rumpfmuskulatur, die die gebückte Haltung stützt.*

**Bird Dog** — Vierfüßlerstand, Hände unter den Schultern. Gegenüberliegenden Arm und
Bein ausstrecken, Rücken gerade, kein Hohlkreuz, Hüfte nicht verdrehen. Oben 1–2 s
halten. Jede Wiederholung wechselt die Seite.
*Ziel: Koordination und tiefe Rückenmuskulatur.*

**Liegestütz** — Auf Zehen oder Knien, Körper gerade, Ellbogen nah am Körper.
Ca. 2 s absenken, 1 s hochdrücken, kein Schwung. Lieber weniger Wiederholungen als eine
durchhängende Hüfte.
*Ziel: Brust, Trizeps, Schultern — Armhaltung und Stützkraft am Lenker.*

**Seitstütz links / rechts** — Auf einem Unterarm seitlich abstützen, Körper gestreckt,
Hüfte anheben und halten. Oberen Arm zur Decke strecken.
*Ziel: seitliche Stabilität, verhindert Wackeln im Oberkörper beim Antritt.*

**Hüftheben (Glute Bridge)** — Rückenlage, Knie angewinkelt, Füße hüftbreit. Fersen in
den Boden drücken, Becken anheben, oben Gesäß bewusst anspannen (Schulter–Hüfte–Knie in
einer Linie). Nicht ins Hohlkreuz drücken, die Bewegung kommt aus der Hüfte. Ca. 1 s
oben halten, kontrolliert absenken ohne ganz abzulegen. Steigerung: erst oben 2–3 s
halten, dann einbeinig.
*Ziel: Gesäß und hintere Oberschenkel — stabilisieren auf dem Rad das Becken und
entlasten den unteren Rücken. Radfahrer sind hier klassisch schwach, weil im Sattel
kaum Hüftstreckung gegen Widerstand vorkommt.*

**Kniebeuge** — Füße schulterbreit, Zehen leicht nach außen. Hüfte zuerst nach hinten,
dann runter; Knie folgen der Fußrichtung und fallen nicht nach innen. So tief, wie der
Rücken gerade bleibt — für die meisten ist das Oberschenkel etwa parallel. Gewicht auf
der ganzen Fußsohle, Ferse bleibt am Boden. 3 s runter, 1 s hoch, oben nicht
durchdrücken.
*Steigerung: Wiederholungen → Rucksack vor der Brust → Kurzhanteln.*
*Ziel: Beinstrecker und Gesäß unter Last — die Muskulatur, die im Sattel nie gegen
volle Widerstände arbeitet.*

**Split Squat / Ausfallschritt** — Ein Fuß etwa eine Schrittlänge vor dem anderen,
beide Füße zeigen nach vorn. Oberkörper aufrecht, hinteres Knie senkrecht Richtung
Boden absenken bis kurz über den Boden. Vorderes Knie bleibt über dem Mittelfuß, das
Becken kippt nicht zur Seite. 3 s runter, 1 s hoch. Eine Seite komplett, dann wechseln.
*Steigerung: Wiederholungen → hinterer Fuß erhöht (Bulgarian) → Zusatzgewicht.*
*Ziel: einbeinige Kontrolle und Beckenstabilität — überträgt sich direkt auf einen
ruhigen Tritt.*

**Wadenheben einbeinig** — Auf einem Bein stehen, mit den Fingerspitzen an einer Wand
balancieren (nicht abstützen). Langsam auf den Ballen heben, oben 1 s halten, ebenso
langsam absenken. Das Knie bleibt gestreckt, aber nicht überstreckt.
*Steigerung: Wiederholungen → Ballen auf einer Stufe, Ferse tiefer als die Stufe.*
*Ziel: Sprunggelenk und Achillessehne, die den Kraftschluss zum Pedal herstellen.*

### Bewusste Entscheidungen bei der Zirkelgestaltung

Diese Punkte sind Ergebnis einer Überarbeitung, nicht Zufall — bitte nicht
„zurückoptimieren":

- **Haltezeit bei 40 s gedeckelt.** Längere Einzelhalte lassen bei Einsteigern die Form
  zerfallen und fördern Pressatmung. Gesteigert wird über eine zusätzliche Runde, nicht
  über längere Halte.
- **Belastung : Pause mindestens 1 : 0,5.** Eine frühere Fassung lag bei 1 : 0,27 und
  führte reproduzierbar zum Formeinbruch in Runde 2.
- **Dead Bug und Bird Dog sind alternierend**, nicht „halten mit Seitenwechsel zur
  Halbzeit".
- **Kein Superman / keine Rückenextension.** Hyperextension in Bauchlage erzeugt hohe
  Kompression in der Lendenwirbelsäule; Bird Dog deckt die hintere Kette sicherer ab.
  Ersetzt durch das Hüftheben.
- **Der volle Zirkel liegt am Sonntag, nicht am Mittwoch.** In Fassung 1 lag die
  anstrengendere Einheit zwischen Dienstag und Donnerstag und laugte den Qualitätstag
  aus. Jetzt liegt sie vor dem Ruhetag Montag, und der Beinblock hat vier Tage Abstand
  zum Donnerstag.

---

## 4. Anpassungsoptionen bei Planabweichungen

Ausweichvarianten, die **im Voraus festgelegt** sind. Unter Zeitdruck erfundene
Umplanungen fallen regelmäßig auf die Seite „mehr stapeln" — deshalb steht hier, welche
Option in welchem Fall gilt.

### 4.1 Invarianten

Solange diese fünf Regeln stehen, ist eine verschobene Woche in Ordnung — unabhängig
davon, an welchen Wochentagen sie liegt.

1. **Montag bleibt Ruhetag.**
2. **Mindestens zwei Tage zwischen Qualitätstag und langer Ausfahrt.**
3. **Der Tag vor dem Qualitätstag ist der leichteste Fahrtag.**
4. **Nie zwei harte oder lange Tage hintereinander.**
5. **Verschieben schlägt Streichen. Streichen schlägt Stapeln.**

**Faustregel, wenn kein Fall unten passt:** Liegen zwei Tage zwischen Qualitätstag und
langer Ausfahrt, und ist der Tag davor leicht? Wenn ja, funktioniert die Woche.

### 4.2 Opferreihenfolge bei Zeitnot

Was zuerst wegfällt:

```
Beinblock → Rumpf → optionale Fahrten → Mittwoch → Dienstag
          → zuletzt: Qualitätstag oder lange Ausfahrt
```

Welche der letzten beiden zuletzt fällt, hängt von der Phase ab:

| Phase | Wichtiger | Begründung |
|---|---|---|
| 1 und 3 | **lange Ausfahrt** | Grundlagenblöcke, der Umfang ist der Zweck |
| 2 und 4 | **Qualitätstag** | Intensitätsblöcke, die Intervalle sind der Zweck |

### 4.3 Samstag: keine Zeit für die lange Ausfahrt

| # | Option | Bewertung |
|---|---|---|
| **A1** | Kompletter Tagestausch mit Sonntag: Sa = Rumpf + Beine + kurze Fahrt, So = lange Ausfahrt | **Beste Wahl.** Jede Einheit bleibt im Kontext |
| **A2** | Samstag verkürzt fahren, 70–90 statt 140 min | Gut. Die Hälfte ist deutlich mehr als nichts |
| **A3** | Auf Freitag vorziehen | Nur Phase 1 und 3. In Phase 2/4 liegt der harte Donnerstag davor |
| **A4** | Streichen, Di/Mi verlängern | **Schlechtester Ersatz.** Der Reiz ist die Dauer am Stück; zwei mal 20 min mehr ersetzen keine 140 |

**Nicht** nur die Radfahrten tauschen und Rumpf plus Beinblock am Sonntag stehen lassen.
Der Beinblock nach einer 140-Minuten-Ausfahrt trainiert Ermüdungstoleranz mit schlechter
Technik, nicht Kraft. Muss es so laufen: Beinblock weglassen, Zirkel machen.

**Preis von A1:** Der Beinblock verliert den Ruhetag Montag als Puffer und rückt auf
vier statt fünf Tage an den Donnerstag heran. Vertretbar. Im Gegenzug wird der Montag
zum echten Erholungstag nach der langen Ausfahrt.

### 4.4 Dienstag nicht im Büro

| # | Option | Bewertung |
|---|---|---|
| **B1** | Freie Runde von zu Hause, gleiche Dauer | **Beste Wahl** — oft die bessere Einheit, weil kein Ankunftsdruck |
| **B2** | Auf Mittwoch schieben, dort lang fahren | Nur in **Phase 3**. Sonst ist der Mittwoch nicht mehr der leichte Tag vor dem Donnerstag |
| **B3** | Auf Freitag schieben | Nur wenn Samstag kurz oder getauscht — sonst Do/Fr/Sa in Folge |

### 4.5 Mittwoch nicht im Büro

| # | Option | Bewertung |
|---|---|---|
| **C1** | Kurze freie Fahrt, 40 min | Beste Wahl, geringer Aufwand |
| **C2** | Ersatzlos streichen | **Völlig in Ordnung.** Kleinster Beitrag der Woche — dafür ist er bewusst klein gehalten |
| **C3** | Auf Freitag schieben | Nur in Phase 1 und 3 |

### 4.6 Beide Bürotage weg

- **Dienstag** als freie Fahrt in voller Länge, **Mittwoch** streichen. Rückfall auf die
  Zwei-Z2-Tage-Struktur.
- Oder: Dienstag voll, **Freitag** 40 min statt Mittwoch — nur bei leichtem Donnerstag.

Die Z2-Summe sinkt um rund 40 min. **Nicht kompensieren**, nicht auf den Samstag
draufpacken.

### 4.7 Donnerstag außerplanmäßig im Büro

Der kniffligste Fall — Qualitätstag und Pendeln kollidieren.

| # | Option | Bewertung |
|---|---|---|
| **E1** | Do = Pendel-Z2, Qualität auf Freitag, **dazu** Sa/So tauschen | **Beste Wahl.** Der Sonntagstausch stellt die zwei Tage Abstand wieder her |
| **E2** | Qualität auf Dienstag vorziehen, Do = Pendel-Z2 | Elegant: Di hart, Mi/Do leicht, Sa lang. **Nur wenn Dienstag Homeoffice ist** |
| **E3** | Woche zur Grundlagenwoche machen, Qualität streichen | Phase 1 und 3 unkritisch. Phase 2/4: einmal verkraftbar, zweimal nicht |
| **E4** | Intervalle auf dem Hinweg fahren | **Nicht empfohlen.** Gepäck, Ampeln, Ankunftszeit — die Qualität leidet zu stark |

### 4.8 Donnerstag fällt ganz aus

- **Phase 1 und 3:** streichen, kein nennenswerter Verlust.
- **Phase 2 und 4:** auf Freitag, plus Sa/So-Tausch.
- Alternativ die Intervalle nach 30 min Einfahren in die Samstagsausfahrt integrieren.
  Dann ist der Samstag aber kein sauberer Z2-Tag mehr und **das Decoupling der Woche
  fällt als Kennzahl aus**.

### 4.9 Ganzes Wochenende weg

Die lange Ausfahrt ist nicht ersetzbar. **Woche als Erholungswoche behandeln**, danach
normal weitermachen. Nicht nachholen, die Folgewoche nicht aufblähen — eine ausgefallene
Woche kostet fast nichts, zwei zusammengedrängte Wochen können teuer werden.

Ist ein Bürotag Homeoffice: Dienstag zur langen Fahrt machen, wenn die Zeit reicht.

### 4.10 Wellness-Gate rot

Grundregel aus Abschnitt 1: Donnerstag wird 60 min Z2, Samstag ohne Blöcke.

**Ergänzung:** Zwei rote Tage hintereinander → die gesamte Woche als Erholungswoche
fahren, unabhängig von der Wochennummer im Plan.

### 4.11 Wetter am Qualitätstag

- Do ↔ Sa tauschen, **nur** wenn die lange Ausfahrt dann am Sonntag Platz hat.
- Sonst: Donnerstag zu Z2 machen, Intervalle in den Samstag verlegen.
- **Ab Woche 11 ist das der Regelfall, nicht die Ausnahme.** Dann greift Abschnitt 8.

### 4.12 Urlaub oder Reise, ganze Woche

- **Rumpf und Beinblock brauchen kein Equipment.** Mitnehmen — das hält die Kontinuität.
- Radwoche komplett streichen.
- **Wiedereinstieg mit einer Erholungswoche**, nicht mit der geplanten Belastungswoche.
  Nach sieben Tagen ohne Rad ist die Aufbaurate wieder das Thema.

### 4.13 Auswirkung auf die Analyse

Verschobene Einheiten sind **keine Planverstöße**. Die Auswertung in Abschnitt 7 rechnet
tageweise gegen den Plan und würde einen Tausch doppelt als Fehler melden — einmal als
fehlende Einheit, einmal als unerwartete.

Solange das nicht in der App abgebildet ist: bei getauschten Tagen die Tagesbewertung
ignorieren und nur die **Wochensummen** (Gesamtdauer, Z2-Minuten, harte Zeit) betrachten.

---

## 5. Die App

Einzelne HTML-Datei, PWA, installierbar, offline nutzbar. Keine Abhängigkeiten, alle
Bilder als Base64 eingebettet. Gehostet auf GitHub Pages.

### Tabs

**Heute** — aktuelle Trainingswoche, Phase, Startdatum (editierbar) und die nächsten
7 Tage als Karten mit Soll-Vorgaben. Direktsprung zu den Timern.

**Rumpf** — Zirkel-Timer mit Sprachansage, Übungsbild, Wiederholungsziel und
Tempo-Hinweis. Übungsliste mit Dosierung; Tippen öffnet die vollständige Anleitung mit
Illustration. Voreinstellungen (Runden, Belastung, Pause) werden aus der Trainingswoche
vorbelegt, sind aber überschreibbar. Bildschirm bleibt an.

**Intervalle** — Timer für den Donnerstag, mit Einfahren, Wiederholungen, Erholung und
Ausrollen, Zonenanzeige und Sprachansage. Ebenfalls aus der Woche vorbelegt.

**Analyse** — Abgleich der tatsächlichen Aktivitäten mit dem Plan, siehe Abschnitt 7.

### Stand der Umsetzung in der App

Der Code ist auf Fassung 2 angepasst (23.08.2026). Umgesetzt:

1. Reihen `TUE_MIN`, `SAT_MIN`, `SUN_MIN`, `CORE_*` auf 16 Werte erweitert, `WED_MIN` und
   `LEG_ROUNDS` neu. Die Wochensummen der App stimmen mit denen in Abschnitt 2 überein.
2. Vier Phasen statt zwei; der `weekIndex`-Erhaltungszyklus ist entfallen. Nach Woche 16
   zeigt der Tab „Heute" den Winterblock als Hinweis an und lässt die Wochenwerte auf
   Woche 16 stehen.
3. Die Donnerstag-Wiederholungsformel ist durch `thursdayPlan()` ersetzt — eine Tabelle je
   Phase, inklusive Testwochen und Erholungswoche 8 ohne Z5.
4. Rumpf: Sonntag volle Runden, Mittwoch fest 2. Beinblock am Sonntag als Liste ohne Timer.
5. Samstag-Blöcke nur in Woche 6, 10 und 14 (2 × 12 min, 8 min Rollen dazwischen).
6. Zweiter Zonensatz: bis Woche 4 die Übergangsbänder, ab Woche 5 Coggan aus der LTHR,
   Wattbereiche aus der FTP. Ohne eingetragenen Testwert laufen die Übergangsbänder weiter
   und die App sagt das ausdrücklich.
7. Kadenzziele ab Woche 4 in den Tageskarten und im Intervalltimer.
8. Wellness-Gate als Ampel am Mittwoch und Donnerstag, gerechnet aus
   `GET /athlete/0/wellness` (Ruhepuls gegen 7-Tage-Schnitt + 5, HRV gegen den Schnitt,
   zwei Nächte unter 6 h). Ohne API-Key bleibt der Regeltext stehen.
9. Geschwindigkeits- und Distanzschätzung ab Woche 5 ausgeblendet.
10. Schwellentest als eigener Timer-Modus, fester Ablauf, Einstellungen gesperrt.
11. Mittwochskarte mit Rad **und** Rumpf; die Fahrzeit ist als Untergrenze dargestellt und
    wird in der Analyse auch so bewertet — zu lang löst keine Warnung aus.
12. Beinblock als Checkliste: drei Übungen, Wiederholungsziel aus der Phase, Eintrag je
    Runde.
13. `core-session-log` enthält Beinblock-Einträge mit `kind:'leg'` — Runden, tatsächliche
    Wiederholungen je Runde, Sätze unter dem Ziel. Einträge ohne `kind` sind Rumpf.
14. Wochenmodus im Analyse-Tab: schaltet die Tagesbewertung ab und zeigt Wochensummen
    (Gesamtdauer, Z2-Minuten, harte Zeit).
15. Testhistorie (`test-history`) und Erhebung der Übergangszeit (`interim-log`,
    Sprechtest-Puls und RPE je Einheit) im Tab „Heute". Der Sprechtest-Schnitt wird gegen
    die aktuelle Z2-Obergrenze gehalten. Hinweis auf den nächsten Testtermin ab 14 Tagen
    vorher.

**Bewusst nicht übernommen:** die harte Z2-Obergrenze 142. Die App zeigt Z2 als
128–135 bpm. Der Wert 142 ist unbelegt — der Drift der Referenzfahrt kratzt mit 4–6,5 %
am Zielwert — und wäre, sobald er in der App steht, ein Ziel geworden statt einer Grenze.
Sobald eine Ausfahrt konsequent bei 128–135 gefahren und der Drift unter 5 % liegt, kann
die Obergrenze nachgezogen werden.

**Übungsbilder** liegen als `.webp` im Ordner `assets/` statt als base64 im HTML; der
Service Worker legt sie mit in den Cache. Das hat `index.html` von 1,2 MB auf rund 230 KB
verkleinert.

### Persistenz

`localStorage`, Schlüssel:

| Schlüssel | Inhalt |
|---|---|
| `training-start-date` | Startdatum des Plans, `YYYY-MM-DD` lokal — hier `2026-08-15` |
| `intervals-icu-api-key` | API-Key für intervals.icu, nur auf dem Gerät |
| `core-session-log` | Protokoll der Rumpfeinheiten, JSON-Array, max. 80 Einträge |

Das Startdatum ist die Grundlage aller Wochenberechnungen. Steht es falsch, ist der
komplette Plan verschoben.

### Protokoll der Rumpfeinheiten

Der Rumpf-Timer schreibt jede Einheit selbst mit. Gespeichert wird nach **jedem Satz**,
damit eine abgebrochene oder weggewischte Einheit erhalten bleibt; ein Reset ohne einen
einzigen Satz verwirft den Eintrag.

Pro Einheit: Tag, Trainingswoche, geplante Runden, Belastung, Pause, Anzahl Sätze,
Zeit unter Spannung, ob komplett beendet, letzte Übung mit Runde, und je Übung Sätze,
gehaltene Sekunden und Zahl der vorzeitigen Abbrüche.

Das ist die einzige Quelle für Übungs- und Satzdaten — siehe Abschnitt 7.

### PWA-Eigenheiten

- `display: standalone`, Statusleiste sichtbar.
- **Der Anzeigemodus steckt in der installierten Verknüpfung, nicht in der
  ausgelieferten Seite.** Eine App, die noch mit `display: fullscreen` hinzugefügt wurde,
  bleibt im Vollbild. Chrome erneuert das WebAPK erst nach seiner nächsten
  Manifest-Prüfung (höchstens täglich); iOS gar nicht. Sofortlösung: deinstallieren und
  neu zum Startbildschirm hinzufügen. Die App zeigt in diesem Fall selbst einen Hinweis.
- Service Worker arbeitet **cache-first**. Nach einem Update muss `CACHE_VERSION` in
  `sw.js` erhöht werden, sonst sieht man die Änderung in der installierten App nie.
  Danach App zweimal neu starten; GitHub Pages cached zusätzlich bis zu 10 Minuten
  (`max-age=600`).

---

## 6. Trainingsdaten über intervals.icu

Garmin Connect synchronisiert automatisch nach intervals.icu. **intervals.icu ist die
Datenquelle, nicht Garmin.** Direkter Zugriff auf Garmin Connect scheitert an CORS,
fehlendem Client Secret und einem Freigabeverfahren; intervals.icu spiegelt dagegen den
Origin zurück und erlaubt den `authorization`-Header.

### Zugang

- Basis: `https://intervals.icu/api/v1`
- Auth: HTTP Basic, Benutzername `API_KEY`, Passwort = persönlicher API-Key
- Key: intervals.icu → Settings → Developer Settings
- Athleten-ID: `0` steht für den angemeldeten Sportler

Der Key ist wie ein Passwort zu behandeln — er erlaubt Lese- **und** Schreibzugriff auf
das gesamte Konto.

### Einstellungen, die nach dem Test zu setzen sind

Settings → Sportart **Ride**:

| Feld | Wert |
|---|---|
| FTP | Ø-Watt der 20 min × 0,95 |
| Threshold HR (LTHR) | Ø-Puls der 20 min |
| Max HR | höchster je gemessener Wert |
| Power Zones | Coggan |
| HR Zones | Coggan, % LTHR |
| Load Priority | Power |

Zonenänderungen werden rückwirkend auf die Historie angewandt — Warten kostet also
keine Datenkontinuität.

Die eFTP-Schätzung findet sich auf der **Power**-Seite. Bis zum ersten Test ist sie
mangels harter Anstrengungen wenig belastbar; ab Woche 5 ist sie eine brauchbare
Zwischenkontrolle zwischen den Tests. Sobald ein echter Testwert vorliegt, FTP auf
manuell stellen, damit ein einzelner Antritt am Berg den Wert nicht überschreibt.

### Lesen

| Zweck | Endpunkt |
|---|---|
| Aktivitätenliste | `GET /athlete/0/activities?oldest=…&newest=…&fields=…` |
| Einzelne Aktivität | `GET /athlete/0/activities/{ids}` |
| Puls-Stream | `GET /activity/{id}/streams.json?types=heartrate` |
| Leistungs- und Kadenz-Stream | `GET /activity/{id}/streams.json?types=watts,cadence` |
| Intervalle einer Aktivität | `GET /activity/{id}/intervals` |
| Geplante Einheiten (Kalender) | `GET /athlete/0/events` |
| Workout-Bibliothek | `GET /athlete/0/workouts` |
| Wellness (Ruhepuls, Gewicht, HRV, Schlaf) | `GET /athlete/0/wellness` |

Nützliche Felder der Aktivität: `start_date_local`, `type`, `name`, `moving_time`,
`elapsed_time`, `distance` (Meter), `average_heartrate`, `max_heartrate`,
`has_heartrate`, `icu_training_load`, `icu_intensity`, `icu_lap_count`.
Ab Woche 4 zusätzlich `average_watts`, `icu_weighted_avg_watts`, `average_cadence`,
`icu_efficiency_factor`, `icu_power_hr` (Decoupling).
Der Feldfilter `fields=` lohnt sich — die Aktivität hat 183 Felder.

Puls-Streams liefern 1-Hz-Samples; ein Sample entspricht einer Sekunde.

### Schreiben

| Zweck | Endpunkt |
|---|---|
| Geplante Einheit anlegen | `POST /athlete/0/events` |
| Mehrere Einheiten auf einmal | `POST /athlete/0/events/bulk` |
| Einheit ändern / löschen | `PUT` bzw. `DELETE /athlete/0/events/{eventId}` |
| Einheit als erledigt markieren | `POST /athlete/0/events/{eventId}/mark-done` |
| Ganzen Plan anwenden | `POST /athlete/0/events/apply-plan` |
| Workout in der Bibliothek | `POST /athlete/0/workouts` |
| Manuelle Aktivität nachtragen | `POST /athlete/0/activities/manual` |
| Aktivität bearbeiten | `PUT /activity/{id}` |
| Wellness-Werte setzen | `PUT /athlete/0/wellness/{date}` |

Ein `Event` (geplante Einheit) trägt unter anderem: `category`
(`WORKOUT`, `RACE_A`, `RACE_B`, `RACE_C`, `NOTE`, `PLAN`, `HOLIDAY`, `SICK`),
`start_date_local`, `name`, `description`, `type` (Sportart), `moving_time`,
`target` (`AUTO`, `POWER`, `HR`, `PACE`), `workout_doc` (strukturierte Schritte),
`indoor`, `tags`.

**Praktischer Nutzen:** Der komplette Plan aus Abschnitt 2 lässt sich als `Event`-Reihe
in den intervals.icu-Kalender schreiben. Von dort geht er als geplantes Workout zurück
auf die Garmin-Uhr.

- **Woche 1–4:** `target: HR`, Vorgabe sind die Übergangsbänder aus Abschnitt 1.
- **Ab Woche 5:** `target: POWER`, Vorgabe in % FTP. Der Workout-Builder versteht
  Klartext, z. B. `5x` / `4m 108-115%` / `4m z1`.

**Vor jedem Schreibvorgang bestätigen lassen.** Schreibende Aufrufe verändern echte
Kalender- und Aktivitätsdaten, `DELETE`-Aufrufe sind nicht rückholbar.

### Zur Anbindung im Chat

Der Zugriff im Chat läuft über einen intervals.icu-Konnektor (vom Nutzer als „ICUvisor"
bezeichnet). Die Endpunkte und Feldnamen oben stammen aus der offiziellen
OpenAPI-Spezifikation von intervals.icu (`GET https://intervals.icu/api/v1/docs`,
117 Pfade) und sind verifiziert. Die konkreten Werkzeugnamen des Konnektors sind hier
**nicht** dokumentiert, weil sie nicht überprüft werden konnten — im Zweifel die
Werkzeugliste des Konnektors zugrunde legen und die Angaben hier als Landkarte der
verfügbaren Daten und Operationen verwenden.

---

## 7. Was sich aus welchen Daten auswerten lässt

### Radeinheiten

Vollständig auswertbar. Die App vergleicht je Tag:

- **Dauer** gegen den Sollwert, Toleranz 15 %
- **Zonenverteilung** aus dem Puls-Stream gegen die Bänder aus Abschnitt 1. Die Bänder
  wurden am 22.08. korrigiert — Auswertungen älterer Fahrten sind mit den alten Bändern
  entstanden und vor jedem Vergleich neu zu rechnen.
- **Z2-Tage:** Warnung bei mehr als 15 % der Zeit in Z4/Z5 — eine zu hart gefahrene
  Grundlagenfahrt kostet die Erholung für die Intervalle. Warnung auch, wenn unter 40 %
  in Z2 und unter 75 % in Z1–Z2 liegen.
- **Samstag:** in den Wochen 6, 10, 14 zusätzlich die erreichte Z3-Blockzeit gegen den
  Sollwert. In allen anderen Wochen gilt der Samstag als Z2-Tag.
- **Donnerstag:** harte Zeit gegen `Wiederholungen × Minuten`. Dabei zählt die Zone
  **unter** der Zielzone mit, weil der Puls dem Tritt nachhinkt und man die Zone darunter
  auf dem Weg nach oben durchläuft. Nur Z5 zu zählen würde saubere Intervalle als
  Abbruch melden. **Ab Woche 5 wird stattdessen die Zeit in der Watt-Zone gezählt** —
  dort entfällt die Verzögerung und die Kompensation ist nicht mehr nötig.
- **Pendelfahrten (Di, Mi):** Die Solldauer ist eine **Untergrenze**, keine Zielmarke.
  Zu lang ist kein Fehler und darf keine Warnung auslösen; die 15-%-Toleranz gilt hier
  nur nach unten. Bewertet wird zusätzlich die Intensität — über 20 % der Zeit oberhalb
  Z2 heißt, der Weg wurde unter Zeitdruck gefahren.
- **Ruhetag mit Fahrt:** als Zusatz markiert, nicht als Fehler
- **Optionale Fahrten (Freitag, Sonntag):** werden bewusst **nicht am Umfang gemessen** —
  kürzer oder gar nicht ist bei einer freiwilligen Einheit kein Fehler. Bewertet wird
  die Intensität: über 25 % der Zeit oberhalb Z2 gilt als zu hart.

### Zusätzliche Kennzahlen ab Woche 4

| Kennzahl | Einheit | Zielwert | Aussage |
|---|---|---|---|
| Decoupling Pw:HR | Samstag, Z2-Anteil | ≤ 5 % | Grundlage trägt diese Dauer |
| Efficiency Factor NP ÷ Ø-HF | Di und Sa | Trend steigend | aerobe Basis wächst |
| Leistungsabfall Wdh. 1 → letzte | Donnerstag | < 5 % | Pacing sauber |
| Erste Wdh. über Zielband | Donnerstag | Warnung ab > 5 % darüber | zu hart gestartet |
| HF am Intervallende | Donnerstag | ≥ 90 % HFmax in den letzten 60 s | Reiz erreicht |
| Ø-Kadenz | alle | ≥ 85 rpm in Z2 | Technik |
| Kadenzabfall im Intervall | Donnerstag | < 8 rpm | Ermüdung, Gang zu schwer |
| Zeit in Watt-Z2 | Woche | Trend Richtung 300 min | Grundlagendosis |
| CTL-Rampe | Woche | ≤ 5 Punkte/Woche | Überlastungsschutz |

### Krafteinheiten

**intervals.icu speichert bei Krafteinheiten nur Dauer und Puls.** Es gibt kein Feld für
Übung, Satz, Wiederholung oder Gewicht — geprüft im `Activity`- und `Interval`-Schema.
Das `Interval`-Schema kennt nur `WORK` und `RECOVERY` und ist auf Rad und Lauf ausgelegt.
Auch Garmin erkennt Planks, Dead Bugs und Bird Dogs nicht zuverlässig, weil die
Handgelenksbewegung fehlt.

Daraus folgen zwei Auswertungswege:

**1. Rundenschätzung aus der Dauer** (wenn nur eine Garmin-Aufzeichnung vorliegt).
Der Zirkel ist deterministisch, die Dauer lässt sich also auf eine Rundenzahl
zurückrechnen. Passt keine Rundenzahl auf eine halbe Runde genau, wird nichts behauptet.
**Achtung:** am Sonntag verlängert der Beinblock die Aufzeichnung um ca. 10 min — die
Schätzung muss den Sonntag anders behandeln als den Mittwoch.

**2. Das App-eigene Protokoll** (genauer, hat Vorrang). Liefert exakte Runden, Sätze,
Zeit unter Spannung, Abbruchpunkt und — am wertvollsten — **welche Übung regelmäßig
vorzeitig beendet wird**, samt Anteil der tatsächlich gehaltenen Zeit. Das ist die
Auswertung, die Garmin grundsätzlich nicht liefern kann.

Fehlt beides, wird das Rumpftraining als „nicht erfasst" ausgewiesen — es kann auch nur
eine Lücke in der Erfassung sein. Liegt an einem Rumpftag ausschließlich die optionale
Fahrt vor, wird nur diese bewertet und das fehlende Rumpftraining nicht kommentiert.

### Sportart-Erkennung

Rad: Typ enthält `ride`, `cycl`, `bike`, `biking` oder `spinning`.
Kraft: Typ enthält `weight`, `strength`, `core`, `workout`, `yoga`, `pilates` oder
`training`.

### Behobene Ungenauigkeit

Die Kennzahl „Abweichung Fahrzeit" rechnete in Fassung 1 alle gefahrenen Minuten gegen
nur die geplanten Radeinheiten; optionale Fahrten schoben den Wert nach oben. **Geplante
und optionale Fahrzeit werden ab Fassung 2 getrennt summiert und getrennt ausgewiesen.**

---

## 8. Ab Woche 17 — Winterblock

Ab Woche 11 (Zeitumstellung 25.10.2026) liegt der Donnerstag im Dunkeln. Ab Woche 17
(05.12.2026) ist Draußentraining unter der Woche praktisch ausgeschlossen.

**Mit Rolle:** Der Plan wird besser, nicht schlechter. ERG-Modus trifft die Wattvorgabe
exakt, der Rampentest wird möglich, die Intervallqualität steigt. Struktur bleibt, nur
der Ort ändert sich.

**Ohne Rolle:** Intensität auf das Wochenende bei Tageslicht verlegen, unter der Woche
nur noch Rumpf und Beinkraft. Der Beinblock wird dann zum Hauptinhalt und darf auf
2 × pro Woche mit höherer Last steigen (3 Sätze, 4–10 Wdh.) — das ist die Dosierung,
aus der die belegten Leistungszuwächse stammen.

**Ohnehin ab Oktober zu klären:** Beleuchtung, Sichtbarkeit, Reifen.

**Offene Punkte, die den Winterblock schärfen würden:**

- Gibt es eine Rolle oder einen Smarttrainer?
- Gibt es einen Zieltermin im Frühjahr? Der Plan trainiert derzeit auf kein Ereignis hin.
- Bikefit: bei einer Steigerung von 120 auf über 380 Minuten pro Woche sind Sattel,
  Hände und Knie die häufigste Abbruchursache, nicht die Kondition.

---

## 9. Was sich gegenüber Fassung 1 geändert hat und warum

| # | Änderung | Begründung |
|---|---|---|
| 1 | Samstag ist reines Z2, Blöcke nur alle vier Wochen | Fassung 1 hatte zwei harte Tage bei 5–6 h Wochenumfang. Bei einem Intensitätstag pro Woche ist der Donnerstag der wertvollere. |
| 2 | Donnerstag Phase 2 fest bei 5 × 4 min | 6–8 Wiederholungen liegen über allem, was als Einstiegsdosis belegt ist. Progression läuft über Watt. |
| 3 | Wiederholungsformel entfernt | `weekIndex` und `4 + floor((Woche−1)/2)` widersprachen sich ab Woche 9 (6 vs. 8 Wdh.). Tabelle je Phase statt Formel. |
| 4 | Erholungswochen ohne Z5 | Woche 8 hatte in Fassung 1 5 × 4 min Z5 — die Standarddosis, nicht eine Erholungsdosis. Umfang sank um 30 %, Intensität nur um 17 %. |
| 5 | Schwellentest in Woche 4, 12, 16 | Der ganze Plan hing an sechs geschätzten bpm-Werten (220 − Alter). Ohne Messung ist jede Zonenvorgabe eine Vermutung. |
| 6 | Zweiter Zonensatz nach Watt, Coggan | Leistung reagiert verzögerungsfrei; Puls hinkt 60–90 s nach. Für 4-min-Intervalle ist Puls als Steuergröße ungeeignet. |
| 7 | Coggan statt %HFmax, LTHR statt HFmax als Anker | Die Schwelle verschiebt sich mit der Form, HFmax nicht. Coggan 5 Zonen passen 1:1 auf das bestehende Z1–Z5-Modell und auf die Leistungszonen. |
| 8 | Sprechtest als oberste Instanz für Z2 | Auch Coggan-Z2 ist breit und liegt oben oft über LT1. |
| 9 | Rumpf: Sonntag voll, Mittwoch verkürzt | Fassung 1 legte die anstrengendere Einheit zwischen Dienstag und Donnerstag — das war im Dokument selbst als Risiko notiert. |
| 10 | Beinblock am Sonntag | Der Zirkel enthielt außer dem Hüftheben keine Beinarbeit. Genau dort liegen die belegten Effekte für Radfahrer. |
| 11 | Phase 3 als reiner Grundlagenblock | Fassung 1 lief ab Woche 9 unbefristet im VO2max-Muster. Solche Blöcke laufen 3–6 Wochen, danach braucht es Grundlage oder einen anderen Reiz. |
| 12 | Phase 4 als Schwellenblock | Anderer Reiz statt Wiederholung derselben 4-min-Intervalle. Verhindert Plateau und Monotonie. |
| 13 | Wellness-Gate | Ruhepuls, HRV und Schlaf lagen bereits über die API vor, wurden aber nirgends verwendet. Bei dieser Aufbaurate die wichtigste Sicherung. |
| 14 | Kadenzziele ab Woche 4 | Sensor vorhanden, im Plan bisher nicht abgebildet. Manuelles Zählen ist ausdrücklich nicht vorgesehen. |
| 15 | Neue Kennzahlen (Decoupling, EF, Leistungsabfall, CTL-Rampe) | Erst diese Größen beantworten, ob die Grundlage tatsächlich wächst. |
| 16 | Winterblock statt Endlosschleife | Der Plan lief in Fassung 1 unbefristet weiter, ohne Dunkelheit oder Wetter zu berücksichtigen. |
| 19 | Übergangszonen korrigiert: Z2-Arbeitsbereich 128–135, harte Obergrenze 142 | Die alten Bänder wiesen 80 % einer sauber gefahrenen Grundlagenausfahrt als Z3 aus — die Dekaden-Aufteilung lag eine Stufe zu tief. Die Obergrenze bleibt unsicher, weil der Drift mit 4–6,5 % am Zielwert kratzt. |
| 18 | Anpassungsoptionen als eigener Abschnitt | Fassung 1 kannte nur den Idealfall. Im Voraus festgelegte Ausweichvarianten verhindern, dass unter Zeitdruck gestapelt statt verschoben wird. |
| 17 | Mittwoch als dritter Z2-Tag über den Arbeitsweg | Fassung 1 hatte zwei echte Z2-Tage, empfohlen sind drei bis vier. Der Pendelweg nutzt Zeit, die ohnehin verbraucht wird — die günstigste Form von Mehrumfang. Kurz gehalten, weil er direkt vor dem Qualitätstag liegt. |

### Bewusst **nicht** geändert

- **3:1-Rhythmus** (drei Belastungswochen, eine Erholungswoche). Für einen Einsteiger
  mit dieser Aufbaurate wäre 2:1 die sicherere Wahl. Beibehalten, weil `week % 4 === 0`
  die App-Logik einfach hält. Das Wellness-Gate übernimmt die Absicherung. Falls sich
  Müdigkeit häuft, ist der Wechsel auf 2:1 die erste Stellschraube.
- **Der Einstiegssprung in Woche 1–3.** Von 120 auf 319 Minuten in drei Wochen ist viel.
  Die Wochen sind gefahren bzw. laufen; rückwirkend zu bremsen bringt nichts. Ab Woche 5
  liegt die Steigerung unter 10 % je Belastungswoche.
- **Alle Entscheidungen zum Rumpf-Zirkel** aus Fassung 1 (Deckel bei 40 s, Verhältnis
  1:0,5, alternierende Übungen, kein Superman). Die sind sachlich richtig.

### Unter Vorbehalt

- **Dienstag wächst auf 85–90 min.** Das sind rund 30 km vor Arbeitsbeginn, plus
  Puffer, Umziehen und Duschen — realistisch gut zwei Stunden. Falls das nicht
  aufgeht: Dienstag bei 75 min deckeln und die Differenz auf den Samstag legen. Der
  Samstag hat keine Zeitgrenze, der Dienstag schon. Für das Ziel Grundlagenumfang ist
  gleichgültig, auf welchem Tag die Minuten liegen.
- **Phase 3 erreicht bis zu 435 min Rad pro Woche.** Ein großer Teil davon ist
  Pendelzeit, die ohnehin anfällt — als reine Trainingszeit gelesen wäre es zu viel.
  Wenn die Bürotage wegfallen (Homeoffice, Urlaub), sinkt der Umfang automatisch mit;
  das ist kein Planverstoß und muss nicht kompensiert werden.
