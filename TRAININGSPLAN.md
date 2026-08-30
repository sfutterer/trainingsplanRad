# Trainingsplan Radfahren — Projektwissen

Wissensdokument für ein Claude-Projekt. Beschreibt den Trainingsplan, die zugehörige
PWA und den Zugriff auf Trainingsdaten über intervals.icu.

Aus dem Code der App extrahiert (`index.html`), nicht abgeschrieben. Bei Änderungen am
Plan muss dieses Dokument mitgezogen werden.

- **App:** https://sfutterer.github.io/trainingsplanRad/
- **Repo:** https://github.com/sfutterer/trainingsplanRad
- **Datenquelle:** intervals.icu, synchronisiert von Garmin Connect

> **Fassung 3, Stand 30.08.2026.** Überarbeitet nach einer Auswertung der ersten drei
> Trainingswochen gegen die tatsächlichen intervals.icu-Daten. Die wesentlichen
> Änderungen: **2:1-Rhythmus ab Woche 5**, Wochenumfang als Obergrenze statt als
> Sollwert, verbindlicher Testanlauf zum 10.09., zweite Beineinheit ab Phase 3,
> Ernährungs-Zieldaten als eigener Abschnitt. Der Plan endet mit Woche 16 — danach
> wird ein neuer Plan geschrieben.
>
> Begründungen der Änderungen in Abschnitt 9.

---

## 1. Grundlagen des Plans

**Sportler:** Einsteiger im Radsport. Ausgangslage bei Planerstellung: eine etablierte
2-Stunden-Ausfahrt am Wochenende.

**Ziele, in dieser Rangfolge:**
1. Grundlagenausdauer
2. VO2max
3. Rumpfstabilität

Langfristiges Fernziel außerhalb dieses Plans: lange Touren mit ausgeprägtem
Höhenprofil, und Leistungsfähigkeit im Alltag bis ins hohe Alter. Dieser Plan ist die
Grundlagenphase dafür, nicht die Vorbereitung auf ein konkretes Ereignis.

**Sensorik:** Herzfrequenz durchgehend (Handgelenk). Leistungs- und Trittfrequenzmesser
liegen **seit Ende August vor**, also früher als ursprünglich geplant. Bis zum
Schwellentest am 10.09. werden Wattwerte **nur mitgeschrieben, nicht zur Steuerung
verwendet** — ohne FTP fehlt der Bezugswert. Ab Woche 5 sind sie die primäre
Steuergröße der Qualitätseinheiten.

**Struktur:** Woche 1–4 im 3:1-Rhythmus, **ab Woche 5 im 2:1-Rhythmus**.

- **Phase 1 (Woche 1–4):** Grundlage, Tempo-Intervalle in Z3. Woche 4 mit Schwellentest.
- **Phase 2 (Woche 5–10):** VO2max-Intervalle, 5 × 4 min. Woche 10 mit Retest.
- **Phase 3 (Woche 11–13):** Grundlagenblock mit Erhaltungsreiz.
- **Phase 4 (Woche 14–16):** Schwellenblock, 3 × 10–12 min. Woche 16 mit Retest.

**Erholungswochen: 4, 7, 10, 13, 16.** Reduzierter Umfang **und** reduzierte Intensität.
Keine Z5-Arbeit, keine Blöcke am Samstag, kein Beinblock am Dienstag.

Die alte Formel `week % 4 === 0` gilt **nicht mehr**. Die Erholungswochen stehen als
feste Liste.

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
| **7** | 26.09. – 02.10.2026 | 2 · Erholung |
| 8 | 03.10. – 09.10.2026 | 2 |
| 9 | 10.10. – 16.10.2026 | 2 · Samstag mit Blöcken |
| **10** | 17.10. – 23.10.2026 | 2 · Erholung · **Retest Do 22.10.** |
| 11 | 24.10. – 30.10.2026 | 3 · **Zeitumstellung 25.10.** |
| 12 | 31.10. – 06.11.2026 | 3 · Samstag mit Blöcken |
| **13** | 07.11. – 13.11.2026 | 3 · Erholung |
| 14 | 14.11. – 20.11.2026 | 4 |
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
| Dienstag | Rad, Grundlagenausdauer Z2 — **Arbeitsweg, verlängert** · in Phase 3/4 abends Beinblock |
| Mittwoch | Rad, kurzes Z2 — **Arbeitsweg, direkt** · abends Rumpf **verkürzt** (2 Runden) |
| Donnerstag | Rad, Qualitätseinheit (je nach Phase) |
| Freitag | Ruhetag oder optional 30–40 min Z1 |
| Samstag | Lange Ausfahrt, Basis Z2 |
| Sonntag | Rumpf **voll** + Beinblock + optional Z1-Fahrt |

Der Tausch Mittwoch ↔ Sonntag ist bewusst: die anstrengendere Krafteinheit liegt jetzt
direkt vor dem Ruhetag Montag, und der Tag vor dem Qualitätstag Donnerstag ist leicht.

### Ist-Stand nach drei Wochen (Stand 30.08.2026)

Grundlage aller Änderungen in dieser Fassung. Zahlen aus intervals.icu, Wochenbuckets
laufen dort **Mo–So** und sind gegen die Planwochen (Sa–Fr) versetzt.

| Woche (Mo–So) | Radzeit | Load | CTL | ATL | TSB |
|---|---|---|---|---|---|
| 10.–16.08. | 34 min | 9 | 0,2 | 1,2 | −1 |
| 17.–23.08. | 364 min | 221 | 5,1 | 22,4 | −17,3 |
| 24.–29.08. | 351 min | 241 | 9,9 | 35,9 | **−26,0** |

**Befund 1 — Die Zonenkorrektur hat sofort gewirkt.** Anteil der Fahrzeit oberhalb Z2:
55 % in der ersten Woche, 10 % in der zweiten. Grundlagenausdauer entsteht ab jetzt
tatsächlich.

**Befund 2 — Der Ist-Umfang liegt über dem Plan.** Geplant waren 266 und 326 Minuten,
gefahren wurden 364 und 351. Ursache ist unter anderem, dass `WED_MIN` als Mindestwert
definiert ist und die Streckenwahl „im Zweifel länger" lautet. Siehe Umfangsdeckel unten.

**Befund 3 — TSB −26 bei CTL 10.** Die Ermüdung liegt beim 3,6-Fachen der Grundlast.
Die Ramp-Rate von 4,9 bzw. 5,1 liegt formal auf der Obergrenze aus Fassung 2, diese
Regel stammt aber aus dem Leistungssport und meint eine CTL von 60–80. Bei CTL 10 sind
+5 Punkte eine Verdopplung der Grundlast pro Woche. **Die Ramp-Rate-Regel ist bei dieser
CTL nicht aussagekräftig** und wird durch den Umfangsdeckel ersetzt.

**Befund 4 — Gewicht.** Die erste belastbare Messung ist der 17.08. (97,6 kg); der Wert
102,2 kg vom 01.07. und 15.08. ist zweimal identisch und stammt vermutlich aus einer
einzigen Eingabe. Der scheinbare Sturz von 4,6 kg ist ein Messartefakt, kein
Gewichtsverlust. Seit dem 17.08. wird täglich gewogen: rund **700 g pro Woche**. Siehe
Abschnitt 11.

**Befund 5 — Gelände.** 173 und 308 Höhenmeter pro Woche auf 114 bzw. 119 km. Die
Annahme flacher Referenzstrecken trägt, die Datengrundlage für die Driftanalyse ist
sauber.

### Umfangsdeckel

**Die Wochensumme Rad ist eine Obergrenze, nicht nur ein Sollwert.** Zulässig ist der
Planwert plus höchstens 10 %. Wird er überschritten, wird in der Folgewoche gekürzt,
nicht kompensiert.

Das ersetzt die Ramp-Rate-Regel als primäre Absicherung, solange die CTL unter 20 liegt.

### Erholungssteuerung

Zweistufig, weil die klassischen Modellwerte bei niedriger CTL nicht tragen:

| CTL | Steuerung |
|---|---|
| **unter 20** | Umfangsdeckel + Wellness-Gate. TSB wird beobachtet, aber **nicht** als Auslöser verwendet — bei CTL 10 ist ein TSB über −10 rechnerisch kaum erreichbar |
| **ab 20** | Zusätzlich: liegt TSB sieben Tage in Folge unter −20, ist die Folgewoche eine Erholungswoche, unabhängig von der Wochennummer |

Ergänzend gilt weiterhin: zwei rote Wellness-Tage hintereinander → gesamte Woche als
Erholungswoche.

### Arbeitsweg als Trainingsbestandteil

Dienstag und Mittwoch sind Bürotage. Nur der Hinweg wird gefahren, mit Gepäck.
Direkte Strecke ca. 13 km; die Streckenwahl ist so angelegt, dass in Z2 mindestens
die Solldauer zusammenkommt — **gesteuert wird über die Zeit, nicht über die Distanz.**

| Tag | Strecke | Charakter |
|---|---|---|
| **Dienstag** | verlängert, ca. 20 km+ | die volle Z2-Einheit nach Plan |
| **Mittwoch** | direkt, ca. 13 km | bewusst der lockerste Fahrtag der Woche |

**Warum der Mittwoch kurz bleibt:** Er ist der einzige Fahrtag direkt vor dem
Qualitätstag Donnerstag. Irgendein Tag muss der leichteste sein — das ist dieser.
Unteres bis mittleres Z2, nicht am Sprechtest-Limit.

**Ausnahme Phase 3 (Woche 11–12):** Dort ist der Donnerstag selbst eine Z2-Einheit und
braucht keine Schonung davor. Der Mittwoch wächst auf 60 min und trägt zusätzlich den
Erhaltungsreiz (siehe Abschnitt 2).

**Zusammenhängend statt aufgeteilt.** Eine gestreckte Hinfahrt schlägt zwei kürzere
Fahrten deutlich: der mitochondriale Reiz braucht die Dauer am Stück, zwei mal 30 min
sind nicht ein mal 60.

**Praktische Randbedingungen:**

- **Ankunftspuffer 15 min.** Zeitdruck macht aus einer Z2-Fahrt zuverlässig eine
  Z3-Fahrt. Der Puffer ist Teil des Trainings.
- **Gepäck auf den Gepäckträger, nicht in den Rucksack.**
- **Wattwerte mit Gepäck sind nicht mit denen vom Samstag vergleichbar.** Pendelfahrten
  in intervals.icu als `commute` taggen.
- **Ab Oktober:** Dunkelheit, Kälte und Nebel im Morgenverkehr. Beleuchtung und Reifen
  gehören dann zur Planung; bei niedrigen Temperaturen braucht die Fahrt länger, bis
  sie wirklich Z2 ist.
- **Die Verlängerung des Dienstags hat eine Obergrenze.** Der Umfangsdeckel gilt auch
  hier: lieber den Planwert treffen als „im Zweifel länger".

### Pulszonen — Übergangsfassung (Woche 1 bis 4)

**Korrigiert am 22.08.2026, methodisch nachgeschärft am 23.08.2026.** Die ursprünglichen
Bänder waren glatte %HFmax-Dekaden bei einer angenommenen HFmax von 180 bpm. Die
Dekaden-Aufteilung hat sich als falsch erwiesen; die HFmax-Annahme selbst trägt vorerst.

| Zone | bpm **(gültig)** | Verwendung |
|---|---|---|
| unter Z1 | < 100 | Rollen, Pause |
| Z1 | 100–128 | Erholung, Einfahren, optionale Fahrten |
| **Z2 Arbeitsbereich** | **128–135** | **Grundlagenausdauer — hier fahren** |
| Z2 Obergrenze | 135–142 | nur kurzzeitig, siehe unten |
| Z3 | 142–155 | Tempo |
| Z4 | 155–168 | Übergang, im Plan nicht angesteuert |
| Z5 | > 168 | VO2max |

**Der Arbeitsbereich 128–135 ist belegt, die Obergrenze 142 nicht.** Grundlagenfahrten
werden in 128–135 gefahren. 142 ist eine harte Grenze, kein Ziel.

#### Woher die Korrektur kommt

Datengrundlage: Samstagsausfahrt 22.08.2026, 143 min, 46,9 km, 113 hm, überwiegend flach.
Unbefestigter Untergrund überwiegend im ersten Drittel. Letztes Drittel mit Ortschaften,
Kreuzungen, Orientierung und einsetzender Dunkelheit.

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

Nach Herausfiltern aller Stop-and-go-Phasen (nur Segmente ≥ 120 s durchgehend
> 15 km/h, zusammen 83 von 143 min):

| Drittel | Steady-Zeit | Ø km/h | Ø HF | EF (km/h ÷ HF) |
|---|---|---|---|---|
| D1 | 36,5 min | 21,2 | 131,0 | 0,1619 |
| D2 | 34,8 min | 20,8 | 131,6 | 0,1578 |
| D3 | 11,7 min | 20,0 | 132,2 | 0,1513 |

**Drift D1 → D3: +6,5 %. Über die Hälften: +3,9 %.** Zielwert ist unter 5 %.

**Einschränkung:** D3 stützt sich auf nur 11,7 min Steady-Zeit. Der Wert +6,5 % ist
statistisch dünn und trägt weniger, als er wirkt.

**Gegenprobe bei gleicher Geschwindigkeit,** früh gegen spät:

| Geschwindigkeit | HF früh | HF spät | Δ |
|---|---|---|---|
| 16–18 km/h | 130,7 | 130,2 | −0,5 |
| 18–20 km/h | 131,4 | 131,3 | −0,1 |
| 20–22 km/h | 130,5 | 132,4 | +1,9 |
| 22–24 km/h | 130,9 | 132,4 | +1,6 |

Bei einer Fahrt von 2,4 h **oberhalb** LT1 wären 5 bis 10 Schläge Anstieg zu erwarten.
Ein bis zwei sind es. Der Drift hat vermutlich andere Ursachen: längste Fahrt bisher,
muskuläre Beschwerden im Oberschenkel ab der Hälfte, fehlende Verpflegung über 2,4 h,
Abkühlung und Dunkelheit am Ende.

**Schlussfolgerung:** Die untere Hälfte des Bandes ist belegt, die obere nicht. Deshalb
128–135 als Arbeitsbereich.

**Nächste Überprüfung:** Samstagsausfahrt konsequent bei 128–135 fahren. Fällt der Drift
dann unter 5 %, ist die Obergrenze gefunden.

#### Status dieser Bänder

**Arbeitsannahme, kein gemessener Wert.** Sie stützt sich auf einen einzigen Datenpunkt,
eine ungeprüfte HFmax und auf Geschwindigkeit als Ersatz für Leistung. Ab dem Testwert
rechnet intervals.icu das Decoupling aus Watt, dann ist die Frage endgültig geklärt.

Die Bänder gelten bis zum Test am 10.09.2026 und ersetzen bis dahin die alte Tabelle
vollständig — auch rückwirkend in der Auswertung.

**Wichtig für jede Auswertung:** Diese Bänder sind nicht die Zonen von intervals.icu.
Dort sind die Zonen an der LTHR ausgerichtet, `icu_hr_zone_times` passt also **nicht**
auf diese Tabelle. Zeit je Zone muss aus dem Puls-Stream gegen die Bänder oben
gerechnet werden.

#### Methodenhinweis für künftige Driftanalysen

1. **Nicht nur Hälften vergleichen** — Drittel zeigen Effekte, die die Zweiteilung
   verdeckt. Aber: Drittel mit unter 15 min Steady-Zeit nicht überinterpretieren.
2. **Stop-and-go herausfiltern.** Nur Segmente ≥ 120 s durchgehend > 15 km/h werten.
3. **Gegenprobe bei gleicher Geschwindigkeit** früh gegen spät. Das ist der belastbarere
   Test als jede EF-Mittelung.
4. **Untergrund und Streckenprofil notieren.** Ab Woche 5 entfällt das Problem, weil
   Watt unabhängig davon sind.
5. **Verpflegung notieren.** Ab 90 min Fahrzeit ohne Kohlenhydratzufuhr ist der Drift
   nicht mehr sauber der Intensität zuzuordnen.

### Zonen ab Woche 5 — Zielmodell

Nach dem Test am 10.09. werden beide Zonensätze nach Coggan gesetzt, in intervals.icu
**und** in der App identisch. Damit wird `icu_hr_zone_times` wieder verwendbar.

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

**Für Grundlagenfahrten sticht der Sprechtest die Zahl.** Ganze Sätze müssen möglich
sein, Atmung merklich vertieft, aber ruhig und rhythmisch. Wird das Sprechen kurzatmig,
ist LT1 überschritten — unabhängig davon, was die Zone sagt. Zweite Kontrollinstanz ist
der Drift: liegt er über 5 %, war die Fahrt zu hart, auch wenn der Puls im Band lag.

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

### Trittfrequenz

| Situation | Ziel |
|---|---|
| Grundlage Z2 | 85–90 rpm |
| Intervalle Z5 | 95–100 rpm |
| Schwellenblöcke | 85–90 rpm |
| Anstieg | nicht unter 70 rpm, notfalls Übersetzung anpassen |

Liegt die selbstgewählte Kadenz deutlich darunter (60–75 ist bei Einsteigern normal),
in 5er-Schritten über vier bis sechs Wochen herantasten, nicht erzwingen.

**Kein Kraftausdauertraining mit niedriger Kadenz** (großer Gang, 50–60 rpm) in diesem
Plan. Grund ist die muskuläre Belastung: hohe Pedalkräfte auf noch untrainierter
Beinmuskulatur erzeugen einen Reiz, der mehrere Tage Erholung kostet und den
Qualitätstag am Donnerstag entwertet. Die Rückmeldung nach den ersten Samstagsausfahrten
bestätigt das — die Oberschenkel brauchen bereits ohne Zusatzreiz mehr als einen Tag.

**Kadenzpyramide** als Teil des Einfahrens am Mittwoch, alle ein bis zwei Wochen:
30 s je 90 / 100 / 110 / 120 / 110 / 100 / 90 rpm im leichten Gang, Puls bleibt in
Z1/Z2, nicht im Sattel hüpfen. Kostet 3,5 min.

### Höhenmeter — Einführung

Bisher nahezu ausschließlich Flachstrecke (bestätigt: 2,6 hm/km im Ist-Stand).
Höhenmeter sind ein eigener Trainingsreiz und werden **nicht zusätzlich zur laufenden
Zeit-Progression** eingeführt, sondern als eigenständige, entkoppelte Variable:

1. **Eine Variable zur Zeit.** Die Wochendauer steigt bereits. Höhenmeter gleichzeitig
   draufzusetzen heißt Zeit, muskuläre Last und HF-Ausschläge parallel zu erhöhen —
   kippt etwas, ist die Ursache nicht mehr zuzuordnen.
2. **Zonenkalibrierung läuft noch.** Die Übergangsbänder stammen aus einer bewusst
   flachen Referenzfahrt; Gelände ist als Störgröße für die Driftanalyse dokumentiert.
3. **Kadenz am Berg.** Anstiege drücken die Kadenz nach unten. Ungewohnte Steigungen
   ohne eingeübtes Kadenzmanagement sind das größere Risiko als die reine
   Ausdauerbelastung.

**Vorgehen:**

- **Bis Woche 4 (Test):** weiterhin flaches Gelände.
- **Ab Woche 5 (Steuerung über Watt):** Höhenmeter **ersetzen** statt addieren — eine
  flache Einheit gegen eine leicht hügelige mit ähnlicher Zeit tauschen.
- **Einstieg klein:** 50–100 Hm in eine bestehende Ausfahrt einbauen, bevorzugt am
  **Samstag**.
- **Kadenz bewusst hochhalten**, nicht unter 70 rpm. Passende Übersetzung ist die
  wirksamere Lösung als Disziplin am Berg.
- **Danach eigenständige Progression** (+10–15 % alle 1–2 Wochen), unabhängig von der
  Zeit-Progression der Woche.

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

| Woche | Phase | Di Z2 | Mi Z2 | Do Qualität | Sa lange Ausfahrt | So Z1 opt. | Rumpf So |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 60 | — | 4×5 min Z3 → 56 | 120, reines Z2 + 18 min Z3 | 30 | 2 Rd × 25 s / 25 s → 14 |
| 2 | 1 | 70 | 40 | 4×5 min Z3 → 56 | 130, reines Z2 | 30 | 2 Rd × 30 s / 25 s → 15 |
| 3 | 1 | 80 | 40 | 5×5 min Z3 → 64 | 140, reines Z2 | 35 | 2 Rd × 35 s / 25 s → 16 |
| **4** Erh. | 1 | 45 | 30 | **Schwellentest → 65** | 90, reines Z2 | 25 | 2 Rd × 25 s / 25 s → 14 |
| 5 | 2 | 85 | 40 | 5×4 min Z5 → 63 | 150, reines Z2 | 35 | 3 Rd × 30 s / 20 s → 21 |
| 6 | 2 | 90 | 40 | 5×4 min Z5 → 63 | 160 **+ 2×12 min Z3** | 40 | 3 Rd × 35 s / 20 s → 23 |
| **7** Erh. | 2 | 50 | 30 | 4×3 min Sweetspot → 48 | 100, reines Z2 | 25 | 2 Rd × 30 s / 25 s → 15 |
| 8 | 2 | 90 | 40 | 5×4 min Z5 → 63 | 165, reines Z2 | 40 | 3 Rd × 35 s / 20 s → 23 |
| 9 | 2 | 90 | 40 | 5×4 min Z5 → 63 | 175 **+ 2×12 min Z3** | 40 | 3 Rd × 40 s / 20 s → 25 |
| **10** Erh. | 2 | 50 | 30 | **Retest → 65** | 100, reines Z2 | 25 | 2 Rd × 30 s / 25 s → 15 |
| 11 | 3 | 90 | **60** | **70 min Z2** | 170, reines Z2 | 40 | 3 Rd × 40 s / 20 s → 25 |
| 12 | 3 | 90 | **60** | **75 min Z2** | 180 **+ 2×12 min Z3** | 40 | 3 Rd × 40 s / 20 s → 25 |
| **13** Erh. | 3 | 50 | 30 | 55 min Z2 | 105, reines Z2 | 25 | 2 Rd × 30 s / 25 s → 15 |
| 14 | 4 | 90 | 40 | 3×10 min Z4 → 67 | 175, reines Z2 | 40 | 3 Rd × 40 s / 20 s → 25 |
| 15 | 4 | 90 | 40 | 3×12 min Z4 → 73 | 185, reines Z2 | 40 | 3 Rd × 40 s / 20 s → 25 |
| **16** Erh. | 4 | 50 | 30 | **Retest → 65** | 105, reines Z2 | 25 | 2 Rd × 30 s / 25 s → 15 |

Alle Werte in Minuten.

### Wochenumfang Rad und Deckel

| Woche | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Soll** | 266 | 326 | 359 | 255 | 373 | 393 | 253 | 398 | 408 | 270 | 430 | 445 | 265 | 412 | 428 | 275 |
| **Max (+10 %)** | 293 | 359 | 395 | 281 | 410 | 432 | 278 | 438 | 449 | 297 | 473 | 490 | 292 | 453 | 471 | 303 |

Die Steigerung je Belastungswoche liegt ab Woche 5 zwischen 1 und 6 %. Der Sprung von
Woche 1 auf Woche 2 (+23 %) war der Einführung des Pendeltags geschuldet und einmalig.

**Z2-Summe pro Woche** ist die Kennzahl, die zählt — Zielgröße 300–400 min.

**Zugrundeliegende Reihen** (Index 0 = Woche 1):

```
TUE_MIN     [60, 70, 80, 45, 85, 90, 50, 90, 90, 50, 90, 90, 50, 90, 90, 50]
WED_MIN     [0, 40, 40, 30, 40, 40, 30, 40, 40, 30, 60, 60, 30, 40, 40, 30]
SAT_MIN     [120, 130, 140, 90, 150, 160, 100, 165, 175, 100, 170, 180, 105, 175, 185, 105]
SUN_MIN     [30, 30, 35, 25, 35, 40, 25, 40, 40, 25, 40, 40, 25, 40, 40, 25]
CORE_WORK   [25, 30, 35, 25, 30, 35, 30, 35, 40, 30, 40, 40, 30, 40, 40, 30]
CORE_ROUNDS [2, 2, 2, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2]
CORE_REST   [25, 25, 25, 25, 20, 20, 25, 20, 20, 25, 20, 20, 25, 20, 20, 25]
LEG_ROUNDS  [2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 3, 3, 2, 3, 3, 2]
RECOVERY    Wochen 4, 7, 10, 13, 16
```

`WED_MIN` ist ein **Mindestwert für den Tag**, aber die Wochensumme deckelt trotzdem.
Längere Fahrzeit am Mittwoch ist zulässig, solange der Wochendeckel eingehalten wird.

`CORE_*` gilt für den **Sonntag**. Der Mittwoch fährt immer **2 Runden** mit derselben
Belastung und Pause.

**Donnerstag je Phase:**

| Phase | Wochen | Inhalt | Ziel |
|---|---|---|---|
| 1 | 1–3 | 4–5 × 5 min Z3, 3 min Pause | Tempo, pulsfreundliche Intervalllänge |
| 1 | 4 | Schwellentest | FTP + LTHR |
| 2 | 5, 6, 8, 9 | **5 × 4 min**, 4 min Pause, 108–115 % FTP | VO2max |
| 2 | 7 | 4 × 3 min bei ~95 % FTP | Erholungswoche, kein Z5 |
| 2 | 10 | Retest | FTP + LTHR |
| 3 | 11–12 | 70–75 min Z2 | dritter Grundlagentag |
| 3 | 13 | 55 min Z2 | Erholungswoche |
| 4 | 14–15 | 3 × 10–12 min bei 90–95 % FTP, 5 min Pause | Schwelle |
| 4 | 16 | Retest | FTP + LTHR |

Einfahren immer 15 min, Ausrollen 12 min. Die Wiederholungszahl in Phase 2 ist **fest
bei 5** — die Progression läuft über die Leistung, nicht über mehr Wiederholungen.

**Erhaltungsreiz Phase 3 (Woche 11 und 12):** An den Mittwoch wird **6 × 30 s zügig mit
30 s lockerem Rollen** angehängt, insgesamt knapp 6 min. Grund: Phase 3 enthält sonst
drei Wochen ohne jeden harten Reiz, und die VO2max bildet sich von allen Größen am
schnellsten zurück. Der Mittwoch ist in Phase 3 nicht mehr der Schontag vor dem
Qualitätstag, weil es keinen gibt. In der Erholungswoche 13 entfällt der Reiz.

**Samstag:** Basis Z2. **Z3-Blöcke nur in den Wochen 6, 9 und 12** — jeweils die zweite
Belastungswoche eines 2:1-Paars, und nicht in Phase 4, wo der Donnerstag bereits die
Schwellenarbeit trägt. Dann 2 × 12 min in der **zweiten Hälfte** der Fahrt mit 8 min
lockerem Rollen dazwischen. Einfahren 15 min, Ausrollen 10 min.

### Ausführungsregeln Intervalle

1. **Rollender Start.** In der letzten Minute der Erholung das Tempo leicht anziehen.
2. **Bewertungsfenster ist Minute 3 bis 5** (Phase 1) bzw. Minute 2 bis 4 (Phase 2).
   Der Puls davor ist bedeutungslos und darf keine Reaktion auslösen.
3. **Atmung führt, Puls bestätigt.** Bei Widerspruch gewinnt die Atmung.
4. **Die letzte Wiederholung ist die härteste.** Ist die erste die schwerste, war der
   Start zu hart. Ziel ab Phase 2: Leistungsabfall Wdh. 1 → letzte unter 5 %.
5. **Kadenz-Lock erkennen.** Fällt der Puls in der Erholung nicht binnen 60–90 s
   merklich ab oder klebt er nahe der Trittfrequenz, misst die optische Messung die
   Beine. Ab da nach Atmung fahren, Aufzeichnung verwerfen.
6. **Uhr fest und höher tragen**, ein bis zwei Fingerbreit über dem Handgelenkknochen.

---

## 2a. Schwellentest — Ablauf, Anlauf, Freigabe

Testtermine: **Do 10.09.** (W4), **Do 22.10.** (W10), **Do 03.12.** (W16).

### Ablauf

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

### Anlauf zum 10.09.2026 (verbindlich)

| Datum | Tag | Einheit |
|---|---|---|
| Do 03.09. | W3 | **Statt 5×5 min Z3:** Einfahren 15 min, **2 × 6 min Testtempo**, 6 min Pause, Ausrollen 10 min |
| Fr 04.09. | W3 | Ruhe |
| Sa 05.09. | W4 | 90 min reines Z2 |
| So 06.09. | W4 | **Nur Rumpf-Zirkel, kein Beinblock** |
| Mo 07.09. | W4 | Ruhe |
| Di 08.09. | W4 | 45 min, **direkte Strecke**, unteres Z2, nicht verlängern |
| Mi 09.09. | W4 | 30 min Z1 **+ 3 × 1 min zügig / 1 min locker**, kein Rumpf |
| **Do 10.09.** | W4 | **Test** |
| Fr 11.09. | W4 | Ruhe oder 30 min Z1 |

**Warum der 03.09. getauscht wird:** Fünf mal fünf Minuten Tempo eine Woche vor dem Test
bringen keine Anpassung mehr, die bis zum 10.09. wirksam wird — Trainingsreize brauchen
zwei bis drei Wochen. Sie kosten aber Erholung. Zwei mal sechs Minuten im angestrebten
Testtempo liefern stattdessen eine Wattzahl, auf die im Test gezielt werden kann. Ohne
das wird der erste Test blind gepaced, und blind gepacete Tests fallen zu niedrig aus.

**Warum die Öffner am 09.09.:** Nach zwei ruhigen Tagen fühlt sich das System träge an.
Ein kurzer harter Reiz am Vortag stellt die Spritzigkeit her, ohne Ermüdung zu erzeugen.

**Derselbe Anlauf gilt sinngemäß für die Retests am 22.10. und 03.12.:** Woche davor
kein voller Qualitätstag, Sonntag davor ohne Beinblock, Dienstag kurz, Mittwoch mit
Öffnern.

### Go/No-Go am Testmorgen

Alle vier Punkte müssen zutreffen:

1. **Ruhepuls** höchstens 5 bpm über dem Sieben-Tage-Schnitt
2. **Kein Muskelkater** in den Oberschenkeln
3. Zwei Nächte hintereinander mindestens 7 Stunden Schlaf
4. Kein Infekt im Anflug, unter 30 °C, kein Sturm

**TSB wird bewusst nicht als Kriterium verwendet.** Bei einer CTL um 10 ist ein TSB über
−10 rechnerisch kaum zu erreichen; ein solches Kriterium würde den Test dauerhaft
blockieren. Realistisch liegt der TSB am 10.09. bei etwa −10 bis −13, und das ist in
Ordnung.

### Verschiebungsregel

**Nach hinten, ohne Ersatzeinheit, ohne Tausch.** Die frühere Regel („auf den Samstag
derselben Woche verschieben und mit der langen Ausfahrt tauschen") war falsch: Die
Trainingswoche läuft Sa–Fr, der Samstag derselben Woche liegt also **vor** dem
Donnerstag.

| Fällt das Go/No-Go durch | |
|---|---|
| Testtag | Ruhetag oder maximal 40 min Z1. Die geplante Einheit entfällt **ersatzlos** |
| Folgetag (Fr) | Ruhetag |
| **Samstag** | **Test.** Er ersetzt die lange Ausfahrt der neuen Woche, kommt nicht dazu |
| Sonntag | Rumpf-Zirkel, kein Beinblock |

**Zweite Absage:** Test auf den Donnerstag der Folgewoche. Die betreffende Woche wird
zur Grundlagenwoche, die Phase startet eine Woche später. Ein verschobener Testtermin
kostet fast nichts — ein unter schlechten Bedingungen gefahrener Test verzerrt die Zonen
für den gesamten Folgeblock.

### Was nach jedem Test festgehalten wird

| Feld | Quelle | Wohin |
|---|---|---|
| Ø-Watt der 20 min | Aktivität | Notiz + Testhistorie |
| **FTP** = Ø-Watt × 0,95 | Rechnung | intervals.icu Settings + App |
| **LTHR** = Ø-Puls der 20 min | Aktivität | intervals.icu Settings + App |
| Ø-Watt der 5 min | Aktivität | Notiz, VO2max-Referenz |
| Ø-Kadenz der 20 min | Aktivität | Notiz |
| Gewicht am Testtag | Waage | Wellness — sonst ist W/kg über die Tests nicht vergleichbar |
| Bedingungen | selbst | Temperatur, Wind, Strecke, Rad, Reifendruck |
| RPE der letzten 5 min | selbst | 1–10; unter 9 heißt: nicht ausbelastet |

### Einordnung des ersten Testwerts

**Der Wert vom 10.09. ist eine Untergrenze, kein Messwert.** Drei Faktoren wirken alle
in dieselbe Richtung nach unten: fehlende Pacing-Erfahrung mit Powermeter, ein TSB um
−10, und ein Körper, der sich noch nie voll ausbelastet hat.

Praktische Folgen:

- Fühlen sich die Intervalle in Phase 2 bei 108–115 % dieser FTP zu leicht an, wird nach
  Atmung gefahren, nicht nach der Zahl.
- Die **eFTP** auf der Power-Seite von intervals.icu ist ab Woche 6 der Gegencheck.
  Zieht sie deutlich über den Testwert, war der Test zu niedrig, und ein früherer Retest
  ist sinnvoll.
- Der Retest am 22.10. wird einen Teil seines Zuwachses aus Testkompetenz beziehen, nicht
  nur aus Form. Das ist normal und kein Grund, den Zuwachs kleinzurechnen.

### Checkliste unmittelbar nach dem Test

1. FTP und LTHR in intervals.icu Settings → Ride eintragen
2. Power Zones und HR Zones auf **Coggan** stellen, Load Priority auf **Power**
3. FTP von automatisch auf **manuell** umstellen
4. Dieselben fünf Grenzwerte in die App übernehmen
5. Zeile in der Testhistorie ausfüllen
6. Sprechtest-Puls aus der Übergangserhebung gegen die neue Z2-Obergrenze halten —
   liegt er deutlich darunter, wird Z2 nach unten begrenzt
7. Am Folgetag locker oder frei

### Testhistorie

| Datum | Woche | Ø-Watt 20 min | FTP | LTHR | Ø-Watt 5 min | Gewicht | Bedingungen |
|---|---|---|---|---|---|---|---|
| 10.09.2026 | 4 | | | | | | |
| 22.10.2026 | 10 | | | | | | |
| 03.12.2026 | 16 | | | | | | |

### Laufende Kontrolle zwischen den Tests

Wöchentlich nach der Samstagsausfahrt:

| Größe | Wo | Was sie sagt |
|---|---|---|
| **Decoupling Pw:HR** | Aktivität Samstag | ≤ 5 % → Grundlage trägt diese Dauer |
| **Efficiency Factor** | Aktivität Di und Sa | Trend über Wochen, nicht Einzelwert |
| **eFTP** | Power-Seite | Zwischenkontrolle |
| **Wochenumfang** | Analyse-Tab | gegen den Deckel aus Abschnitt 2 |
| **CTL / ATL / TSB** | Fitness-Seite | ab CTL 20 als Auslöser, davor nur beobachten |

---

## 3. Rumpf-Zirkel und Beinblock

8 Übungen, Rundenzirkel. Rundenpause fest 60 s, 10 s Vorlauf.
Gesamtdauer = `Runden × (8 × Belastung + 7 × Pause) + (Runden − 1) × 60 + 10`.

**Sonntag:** volle Rundenzahl aus `CORE_ROUNDS`, anschließend Beinblock.
**Mittwoch:** immer 2 Runden, kein Beinblock.

### Reihenfolge und Begründung

Die Reihenfolge ist bewusst so gewählt, dass **nie zwei Übungen mit derselben
Anforderung direkt aufeinander folgen**.

| # | Übung | Dosierung | Anforderung |
|---|---|---|---|
| 1 | Dead Bug | Wdh., Tempo 5 s, **alternierend** | vorne, Rückenlage |
| 2 | Schulterstabilität (Band-Pull-Apart) | Wdh., Tempo 3 s | Schulter/Zug, stehend |
| 3 | Unterarmstütz (Plank) | halten | vorne, gestützt |
| 4 | Bird Dog | Wdh., Tempo 5 s, **alternierend** | hinten/Anti-Rotation |
| 5 | Liegestütz | Wdh., Tempo 3 s | Druck |
| 6 | Seitstütz links | halten | seitlich |
| 7 | Hüftheben (Glute Bridge) | Wdh., Tempo 3 s | Hüftstreckung |
| 8 | Seitstütz rechts | halten | seitlich |

### Beinblock

Drei Übungen als kleiner Zirkel. **Kein Timer — Wiederholungen zählen.**
Zeitbedarf 8–12 min.

**Warum nach dem Zirkel:** Der Zirkel dient als Aufwärmen. Der Beinblock wird **nie
kalt** begonnen — falls er einmal allein steht, gehen 5 min lockeres Einrollen oder
Hampelmänner voraus.

| # | Übung | Warum an dieser Stelle |
|---|---|---|
| 1 | Kniebeuge, frei | beidbeinig, größte Muskelmasse, braucht die frischeste Technik |
| 2 | Split Squat / Ausfallschritt | einbeinig, verlangt Stabilität |
| 3 | Wadenheben einbeinig | kleinste Muskelgruppe, darf zuletzt ermüden |

Pause zwischen den Übungen 30 s, zwischen den Runden 60 s.

#### Häufigkeit

| Wochen | Sonntag | Dienstag abends |
|---|---|---|
| 1–10 (Phase 1–2) | voll | — |
| **11–12 (Phase 3)** | voll | **zweite Einheit**, 2 Runden am unteren Rand der Spanne |
| **14–15 (Phase 4)** | voll | **Erhaltungsdosis**, 1–2 Runden am unteren Rand |
| Erholungswochen 4, 7, 10, 13, 16 | unterer Rand, 2 Runden | entfällt |

**Warum erst ab Woche 11:** In Phase 1 und 2 ist der Donnerstag der Qualitätstag. Eine
Beineinheit am Dienstagabend läge knapp 40 Stunden davor — zu wenig Abstand, um beides
in Qualität zu fahren. In Phase 3 ist der Donnerstag selbst eine Z2-Einheit, damit fällt
der Konflikt weg. In Phase 4 kehrt er zurück, deshalb dort nur Erhaltungsdosis.

**Warum Erhaltungsdosis kein Rückschritt ist:** Kraft zu erhalten braucht deutlich
weniger Reiz als Kraft aufzubauen. Ein bis zwei Sätze genügen, um das in Phase 3
Aufgebaute über die Schwellenwochen zu retten.

#### Dosierung je Phase

| Phase | Wochen | Kniebeuge | Split Squat | Wadenheben | Runden |
|---|---|---|---|---|---|
| 1 | 1–3 | 8–10 Wdh. | 6 je Seite | 10 je Seite | 2 |
| 2 | 5, 6, 8, 9 | 10–12 Wdh. | 8 je Seite | 12 je Seite | 2–3 |
| 3 | 11–12 | 12–15 Wdh. | 8 je Seite | 12–15 je Seite | 3 |
| 4 | 14–15 | 8–10 **mit Zusatzgewicht** | 6–8 **mit Zusatzgewicht** | 12–15, Ferse erhöht | 3 |
| — | Erholungswochen | unterer Rand der laufenden Phase | | | 2 |

**Tempo durchgehend:** 3 s absenken, 1 s heben, keine Pause unten, kein Schwung.
Das exzentrische Absenken ist der Reiz — schnelles Ablassen halbiert den Nutzen.

#### Progressionsregel

**Die Progression ist von den Phasengrenzen entkoppelt.** Weitergerückt wird, sobald das
obere Ende der Wiederholungsspanne in allen Runden mit sauberer Form erreicht wurde, und
das an zwei aufeinanderfolgenden Sonntagen — **auch wenn die Phase das noch nicht
vorsieht.** Die Tabelle oben gibt den Einstieg vor, nicht die Obergrenze.

Reihenfolge der Steigerung:

1. mehr Wiederholungen innerhalb der Spanne
2. mehr Runden (2 → 3)
3. schwierigere Variante — Split Squat mit erhöhtem hinteren Fuß, Wadenheben mit
   erhöhter Ferse
4. Zusatzgewicht — Rucksack mit Büchern oder Wasserflaschen, später Kurzhanteln

**Nicht** über das Tempo steigern und **nicht** über mehr Übungen.

**Warum die Entkopplung:** Zusatzgewicht stand in Fassung 2 erst ab Woche 13. Bei
laufendem Kaloriendefizit ist die Reizhöhe der entscheidende Faktor für den Muskelerhalt,
und ein Defizit läuft ab Woche 1. Auf eine Phasengrenze zu warten verschenkt Wochen.

#### Muskelkater-Regel

Muskelkater in den Oberschenkeln am Sonntag ist in den ersten Wochen zu erwarten. Er
kommt überwiegend nicht von der Samstagsausfahrt, sondern vom exzentrischen Absenken im
Beinblock — ein Reiz, der beim Radfahren praktisch nicht vorkommt.

| Zustand am Sonntag | Beinblock |
|---|---|
| frei | volle Spanne |
| leichter, diffuser Muskelkater | **unteres Ende** der Wiederholungsspanne, volle Runden |
| ausgeprägter Muskelkater | **entfällt**, nur Rumpf-Zirkel |

Der Effekt klingt von selbst zurück: Nach zwei bis drei gleichartigen Belastungen
reagiert die Muskulatur deutlich weniger. Nach etwa vier Wochen ist das Thema erledigt.

**Wann es kein normaler Muskelkater ist:** einseitig statt symmetrisch, punktuell
lokalisierbar statt diffus, scharf statt dumpf, in Ruhe vorhanden, beim Fahren
schlechter statt besser, oder länger als drei Tage anhaltend. Dann Pause und Ursache
klären.

#### Abbruchregel

Kippt die Form, ist der Satz zu Ende. Konkrete Abbruchzeichen:

- Knie fällt beim Aufrichten nach innen
- Rücken rundet im unteren Bereich
- Ferse hebt sich vom Boden
- Oberkörper kippt beim Split Squat zur Seite

Lieber 6 saubere Wiederholungen als 12 schlechte.

#### Einordnung in die Woche

- Der Sonntagsblock liegt **vor dem Ruhetag Montag** und vier Tage vor dem Qualitätstag
  Donnerstag.
- Die optionale Sonntagsfahrt kommt **davor**, nicht danach.
- Fällt der Sonntag aus, wird der Beinblock **nicht** auf den Mittwoch nachgeholt.

### Dosierungsmodell Rumpf

Die Zeit bleibt die Uhr des Zirkels, damit der Timer handsfrei läuft. Dynamische
Übungen bekommen zusätzlich ein **Wiederholungsziel**: `floor(Belastung ÷ Tempo)`, bei
alternierenden Übungen auf eine gerade Zahl abgerundet. Beispiel bei 40 s: Bird Dog
8 Wdh. (4 je Seite), Liegestütz 13 Wdh.

### Abbruchregel Rumpf

Wenn die Form kippt — Hüfte hängt durch, Rücken wird rund, Zittern — ist der Satz zu
Ende. Eine Runde weniger kostet nichts.

### Übungsanleitungen

**Dead Bug** — Rückenlage, Arme zur Decke, Knie 90°. Gegenüberliegenden Arm und Bein
langsam absenken (ca. 2 s). Unterer Rücken bleibt flach am Boden, Rippen Richtung
Becken. Ca. 2 s kontrolliert zurück. Jede Wiederholung wechselt die Seite.
*Ziel: tiefe Bauchmuskulatur ohne Belastung des Rückens.*

**Band-Pull-Apart** — Band vor der Brust, Arme auseinanderziehen, Schulterblätter
zusammen. Ca. 2 s ziehen und kurz halten, 1 s zurück. Schultern bleiben unten.
*Ziel: gegen das Einsinken der Schultern bei langem Fahren.*

**Unterarmstütz (Plank)** — Unterarme und Zehen am Boden, gerade Linie von Kopf bis
Ferse, Bauchnabel Richtung Wirbelsäule. Po nicht hochschieben, Rücken nicht durchhängen.
*Ziel: gesamte Rumpfmuskulatur, die die gebückte Haltung stützt.*

**Bird Dog** — Vierfüßlerstand, Hände unter den Schultern. Gegenüberliegenden Arm und
Bein ausstrecken, Rücken gerade, kein Hohlkreuz, Hüfte nicht verdrehen. Oben 1–2 s
halten. Jede Wiederholung wechselt die Seite.
*Ziel: Koordination und tiefe Rückenmuskulatur.*

**Liegestütz** — Auf Zehen oder Knien, Körper gerade, Ellbogen nah am Körper.
Ca. 2 s absenken, 1 s hochdrücken, kein Schwung.
*Ziel: Brust, Trizeps, Schultern — Armhaltung und Stützkraft am Lenker.*

**Seitstütz links / rechts** — Auf einem Unterarm seitlich abstützen, Körper gestreckt,
Hüfte anheben und halten. Oberen Arm zur Decke strecken.
*Ziel: seitliche Stabilität, verhindert Wackeln im Oberkörper beim Antritt.*

**Hüftheben (Glute Bridge)** — Rückenlage, Knie angewinkelt, Füße hüftbreit. Fersen in
den Boden drücken, Becken anheben, oben Gesäß bewusst anspannen. Nicht ins Hohlkreuz
drücken. Ca. 1 s oben halten, kontrolliert absenken ohne ganz abzulegen.
Steigerung: erst oben 2–3 s halten, dann einbeinig.
*Ziel: Gesäß und hintere Oberschenkel — stabilisieren auf dem Rad das Becken.*

**Kniebeuge** — Füße schulterbreit, Zehen leicht nach außen. Hüfte zuerst nach hinten,
dann runter; Knie folgen der Fußrichtung. So tief, wie der Rücken gerade bleibt.
Gewicht auf der ganzen Fußsohle, Ferse bleibt am Boden. 3 s runter, 1 s hoch.
*Steigerung: Wiederholungen → Rucksack vor der Brust → Kurzhanteln.*

**Split Squat / Ausfallschritt** — Ein Fuß etwa eine Schrittlänge vor dem anderen,
beide Füße zeigen nach vorn. Oberkörper aufrecht, hinteres Knie senkrecht Richtung
Boden absenken. Vorderes Knie bleibt über dem Mittelfuß. 3 s runter, 1 s hoch. Eine
Seite komplett, dann wechseln.
*Steigerung: Wiederholungen → hinterer Fuß erhöht (Bulgarian) → Zusatzgewicht.*

**Wadenheben einbeinig** — Auf einem Bein stehen, mit den Fingerspitzen an einer Wand
balancieren (nicht abstützen). Langsam auf den Ballen heben, oben 1 s halten, ebenso
langsam absenken.
*Steigerung: Wiederholungen → Ballen auf einer Stufe, Ferse tiefer als die Stufe.*

### Bewusste Entscheidungen bei der Zirkelgestaltung

Nicht „zurückoptimieren":

- **Haltezeit bei 40 s gedeckelt.** Längere Einzelhalte lassen bei Einsteigern die Form
  zerfallen. Gesteigert wird über eine zusätzliche Runde.
- **Belastung : Pause mindestens 1 : 0,5.**
- **Dead Bug und Bird Dog sind alternierend.**
- **Kein Superman / keine Rückenextension.** Ersetzt durch das Hüftheben.
- **Der volle Zirkel liegt am Sonntag, nicht am Mittwoch.**

---

## 4. Anpassungsoptionen bei Planabweichungen

Ausweichvarianten, die **im Voraus festgelegt** sind.

### 4.0 Wochengrenze beachten

**Die Trainingswoche läuft Samstag bis Freitag.** Bei jeder Verschiebung prüfen, ob sie
diese Grenze überschreitet:

- Der **Freitag** ist der letzte Tag der laufenden Woche.
- Der **Samstag** beginnt die neue Woche.

Eine lange Ausfahrt „auf Freitag vorziehen" verschiebt sie damit in die **Vorwoche** und
lädt diese doppelt. Ein Tausch Donnerstag ↔ Samstag verschiebt Umfang zwischen zwei
Wochen. Beides ist zulässig, muss aber beim Umfangsdeckel berücksichtigt werden.

### 4.1 Invarianten

1. **Montag bleibt Ruhetag.**
2. **Mindestens zwei Tage zwischen Qualitätstag und langer Ausfahrt.**
3. **Der Tag vor dem Qualitätstag ist der leichteste Fahrtag.**
4. **Nie zwei harte oder lange Tage hintereinander.**
5. **Verschieben schlägt Streichen. Streichen schlägt Stapeln.**

### 4.2 Opferreihenfolge bei Zeitnot

```
Beinblock → Rumpf → optionale Fahrten → Mittwoch → Dienstag
          → zuletzt: Qualitätstag oder lange Ausfahrt
```

| Phase | Wichtiger | Begründung |
|---|---|---|
| 1 und 3 | **lange Ausfahrt** | Grundlagenblöcke, der Umfang ist der Zweck |
| 2 und 4 | **Qualitätstag** | Intensitätsblöcke, die Intervalle sind der Zweck |

Der Block aus Abschnitt 10 (Beweglichkeit, Koordination) steht **nicht** in dieser
Reihenfolge — er kostet keine Erholung und hat keinen Grund, zuerst zu fallen.

### 4.3 Samstag: keine Zeit für die lange Ausfahrt

| # | Option | Bewertung |
|---|---|---|
| **A1** | Kompletter Tagestausch mit Sonntag | **Beste Wahl.** Beide Tage bleiben in derselben Woche |
| **A2** | Samstag verkürzt fahren, 70–90 statt 140 min | Gut |
| **A3** | Auf Freitag vorziehen | **Verschiebt in die Vorwoche** (siehe 4.0). Nur in Phase 1 und 3 und nur, wenn die Vorwoche unter dem Deckel liegt |
| **A4** | Streichen, Di/Mi verlängern | **Schlechtester Ersatz.** Der Reiz ist die Dauer am Stück |

**Nicht** nur die Radfahrten tauschen und Rumpf plus Beinblock am Sonntag stehen lassen.
Muss es so laufen: Beinblock weglassen, Zirkel machen.

### 4.4 Dienstag nicht im Büro

| # | Option | Bewertung |
|---|---|---|
| **B1** | Freie Runde von zu Hause, gleiche Dauer | **Beste Wahl** |
| **B2** | Auf Mittwoch schieben, dort lang fahren | Nur in **Phase 3** |
| **B3** | Auf Freitag schieben | Nur wenn Samstag kurz oder getauscht |

### 4.5 Mittwoch nicht im Büro

| # | Option | Bewertung |
|---|---|---|
| **C1** | Kurze freie Fahrt, 40 min | Beste Wahl |
| **C2** | Ersatzlos streichen | **Völlig in Ordnung** |
| **C3** | Auf Freitag schieben | Nur in Phase 1 und 3 |

In Phase 3 zusätzlich beachten: der Erhaltungsreiz (6 × 30 s) hängt am Mittwoch und
wandert mit.

### 4.6 Beide Bürotage weg

- **Dienstag** als freie Fahrt in voller Länge, **Mittwoch** streichen.
- Oder: Dienstag voll, **Freitag** 40 min statt Mittwoch — nur bei leichtem Donnerstag.

Die Z2-Summe sinkt um rund 40 min. **Nicht kompensieren.**

### 4.7 Donnerstag außerplanmäßig im Büro

| # | Option | Bewertung |
|---|---|---|
| **E1** | Do = Pendel-Z2, Qualität auf Freitag, lange Ausfahrt auf Sonntag | **Beste Wahl.** Fr Qualität, Sa frei, So lang — zwei Tage Abstand. Beachten: der Samstag gehört bereits zur Folgewoche |
| **E2** | Qualität auf Dienstag vorziehen, Do = Pendel-Z2 | **Nur wenn Dienstag Homeoffice ist** |
| **E3** | Woche zur Grundlagenwoche machen, Qualität streichen | Phase 1 und 3 unkritisch. Phase 2/4: einmal verkraftbar |
| **E4** | Intervalle auf dem Hinweg fahren | **Nicht empfohlen** |

### 4.8 Donnerstag fällt ganz aus

- **Phase 1 und 3:** streichen.
- **Phase 2 und 4:** auf Freitag, lange Ausfahrt der Folgewoche auf Sonntag.
- Alternativ die Intervalle in die Samstagsausfahrt integrieren. Dann ist der Samstag
  kein sauberer Z2-Tag mehr und **das Decoupling der Woche fällt als Kennzahl aus**.

### 4.9 Ganzes Wochenende weg

**Woche als Erholungswoche behandeln**, danach normal weitermachen. Nicht nachholen, die
Folgewoche nicht aufblähen.

### 4.10 Wellness-Gate rot

Grundregel aus Abschnitt 1: Donnerstag wird 60 min Z2, Samstag ohne Blöcke.
**Zwei rote Tage hintereinander → gesamte Woche als Erholungswoche.**

### 4.11 Wetter am Qualitätstag

- Do ↔ Sa tauschen, **nur** wenn die lange Ausfahrt dann am Sonntag Platz hat. Beachten:
  das verschiebt Umfang in die Folgewoche.
- Sonst: Donnerstag zu Z2 machen, Intervalle in den Samstag verlegen.
- Ab Woche 11 liegt der Donnerstag im Dunkeln — dann ist das der Regelfall.

### 4.12 Urlaub oder Reise, ganze Woche

- **Rumpf, Beinblock und der Block aus Abschnitt 10 brauchen kein Equipment.**
- Radwoche komplett streichen.
- **Wiedereinstieg mit einer Erholungswoche.**

### 4.13 Auswirkung auf die Analyse

Verschobene Einheiten sind **keine Planverstöße**. Bei getauschten Tagen die
Tagesbewertung ignorieren und nur die **Wochensummen** betrachten.

---

## 5. Die App

Einzelne HTML-Datei, PWA, installierbar, offline nutzbar. Gehostet auf GitHub Pages.

### Tabs

**Heute** — aktuelle Trainingswoche, Phase, Startdatum (editierbar) und die nächsten
7 Tage als Karten mit Soll-Vorgaben. Direktsprung zu den Timern.

**Rumpf** — Zirkel-Timer mit Sprachansage, Übungsbild, Wiederholungsziel und
Tempo-Hinweis. Voreinstellungen aus der Trainingswoche vorbelegt, überschreibbar.

**Intervalle** — Timer für den Donnerstag, mit Einfahren, Wiederholungen, Erholung und
Ausrollen, Zonenanzeige und Sprachansage.

**Analyse** — Abgleich der tatsächlichen Aktivitäten mit dem Plan, siehe Abschnitt 7.

### Anpassungsbedarf für Fassung 3

Der Code steht auf Fassung 2. Folgendes muss nachgezogen werden:

1. **Erholungswochen als feste Liste** `[4, 7, 10, 13, 16]` statt `week % 4 === 0`.
2. **Alle Reihen auf die neuen 16 Werte** aus Abschnitt 2 setzen, `LEG_ROUNDS` inklusive.
3. **Phasengrenzen neu:** 1–4, 5–10, 11–13, 14–16.
4. **Testwochen neu:** 4, 10, 16. `thursdayPlan()` entsprechend anpassen.
5. **Samstag-Blöcke in Woche 6, 9, 12** (feste Liste statt Formel).
6. **Erhaltungsreiz** an der Mittwochskarte in Woche 11 und 12 anzeigen.
7. **Zweite Beineinheit** an der Dienstagskarte in Woche 11, 12, 14, 15.
8. **Umfangsdeckel** in der Analyse: Warnung, wenn die Wochensumme den Planwert um mehr
   als 10 % überschreitet. Das ist neu — bisher gab es nur eine Warnung nach unten.
9. **Muskelkater-Abfrage** vor dem Beinblock am Sonntag: drei Stufen, steuert die
   angezeigte Wiederholungsspanne.
10. **Testanlauf** aus Abschnitt 2a als Hinweis ab 10 Tagen vor dem Testtermin, inklusive
    Go/No-Go-Liste am Testmorgen.

**Nicht in die App:** Abschnitt 11 (Ernährung). Der Block ist reine Dokumentation und
gehört nicht in `plan.json`.

### Bewusst nicht übernommen

Die harte Z2-Obergrenze 142. Die App zeigt Z2 als 128–135 bpm. Der Wert 142 ist unbelegt
und wäre, sobald er in der App steht, ein Ziel geworden statt einer Grenze.

### Der Plan liegt in `plan.json`, nicht im Code

Seit 23.08.2026 stehen alle Plandaten in `plan.json` neben `index.html`.

| In der JSON | Im Code geblieben |
|---|---|
| Wochenwerte je Woche, Donnerstag und Samstagsblöcke je Woche | Kalender- und Wochenrechnung, Phasenzuordnung |
| Pulszonen, Leistungszonen, Kadenzziele | Zonenberechnung aus LTHR und FTP |
| Übungen mit Schritten, Zielen, Bildpfaden; Beinblock-Dosierung je Phase | Wiederholungsziel aus Belastung ÷ Tempo, Zirkeldauer |
| Timer-Konstanten, Schwellentest-Ablauf | Sequenzbau der Timer |
| Freistehende Erklärtexte | Satzgerüste mit eingerechneten Zahlen |
| **Erholungswochen-Liste** (neu in Fassung 3) | — |
| — | **Auswertungstoleranzen der Analyse** |

**Beim Bearbeiten zu beachten:**

- Die Wochen stehen als Objekte in `weeks[]`, nicht als parallele Reihen.
- **Nach jeder Änderung `CACHE_VERSION` in `sw.js` hochzählen.**
- Eine neue Übung braucht zusätzlich einen Eintrag in der `ASSETS`-Liste in `sw.js`.
- Die Texte in `texts` werden als HTML eingefügt; `<` und `&` darin zerlegen die Anzeige.
- Ist die Datei kaputt oder fehlt sie, zeigt die App eine Fehlermeldung und **keine
  Zahlen**.
- `fetch` ist über `file://` gesperrt: die App per `python3 -m http.server` öffnen.

### Persistenz

`localStorage`, Schlüssel:

| Schlüssel | Inhalt |
|---|---|
| `training-start-date` | Startdatum des Plans — hier `2026-08-15` |
| `intervals-icu-api-key` | API-Key für intervals.icu, nur auf dem Gerät |
| `core-session-log` | Protokoll der Rumpfeinheiten, JSON-Array, max. 80 Einträge |
| `test-history` | Testhistorie |
| `interim-log` | Sprechtest-Puls und RPE der Übergangszeit |

### Protokoll der Rumpfeinheiten

Der Rumpf-Timer schreibt jede Einheit selbst mit. Gespeichert wird nach **jedem Satz**.

Pro Einheit: Tag, Trainingswoche, geplante Runden, Belastung, Pause, Anzahl Sätze,
Zeit unter Spannung, ob komplett beendet, letzte Übung mit Runde, und je Übung Sätze,
gehaltene Sekunden und Zahl der vorzeitigen Abbrüche. Beinblock-Einträge tragen
`kind:'leg'`.

### PWA-Eigenheiten

- `display: standalone`, Statusleiste sichtbar.
- **Der Anzeigemodus steckt in der installierten Verknüpfung**, nicht in der
  ausgelieferten Seite. Sofortlösung: deinstallieren und neu hinzufügen.
- Service Worker arbeitet **cache-first**. Nach einem Update `CACHE_VERSION` erhöhen,
  danach App zweimal neu starten; GitHub Pages cached zusätzlich bis zu 10 Minuten.

---

## 6. Trainingsdaten über intervals.icu

Garmin Connect synchronisiert automatisch nach intervals.icu. **intervals.icu ist die
Datenquelle, nicht Garmin.**

### Zugang

- Basis: `https://intervals.icu/api/v1`
- Auth: HTTP Basic, Benutzername `API_KEY`, Passwort = persönlicher API-Key
- Key: intervals.icu → Settings → Developer Settings
- Athleten-ID: `0` steht für den angemeldeten Sportler

Der Key ist wie ein Passwort zu behandeln — er erlaubt Lese- **und** Schreibzugriff.

### Einstellungen nach dem Test

Settings → Sportart **Ride**:

| Feld | Wert |
|---|---|
| FTP | Ø-Watt der 20 min × 0,95 |
| Threshold HR (LTHR) | Ø-Puls der 20 min |
| Max HR | höchster je gemessener Wert |
| Power Zones | Coggan |
| HR Zones | Coggan, % LTHR |
| Load Priority | Power |

Zonenänderungen werden rückwirkend auf die Historie angewandt.

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

Nützliche Felder: `start_date_local`, `type`, `name`, `moving_time`, `elapsed_time`,
`distance` (Meter), `average_heartrate`, `max_heartrate`, `has_heartrate`,
`icu_training_load`, `icu_intensity`, `icu_lap_count`, `average_watts`,
`icu_weighted_avg_watts`, `average_cadence`, `icu_efficiency_factor`, `icu_power_hr`.
Der Feldfilter `fields=` lohnt sich — die Aktivität hat 183 Felder.

Puls-Streams liefern 1-Hz-Samples.

**Lap-Marken setzen.** Ohne sie müssen Intervallgrenzen aus der geplanten Struktur
rekonstruiert werden, was die Auswertung ungenau macht. Am Garmin die Runden-Taste
konsequent verwenden.

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

**Praktischer Nutzen:** Der komplette Plan aus Abschnitt 2 lässt sich als `Event`-Reihe
in den intervals.icu-Kalender schreiben und geht von dort auf die Garmin-Uhr.

- **Woche 1–4:** `target: HR`, Vorgabe sind die Übergangsbänder.
- **Ab Woche 5:** `target: POWER`, Vorgabe in % FTP. Klartext-Syntax, z. B.
  `5x` / `4m 108-115%` / `4m z1`.

**Vor jedem Schreibvorgang bestätigen lassen.** `DELETE`-Aufrufe sind nicht rückholbar.

### Zur Anbindung im Chat

Der Zugriff im Chat läuft über einen intervals.icu-Konnektor („ICUvisor"). Die Endpunkte
und Feldnamen oben stammen aus der OpenAPI-Spezifikation und sind verifiziert. Die
konkreten Werkzeugnamen des Konnektors sind hier nicht dokumentiert — im Zweifel die
Werkzeugliste des Konnektors zugrunde legen.

---

## 7. Was sich aus welchen Daten auswerten lässt

### Radeinheiten

- **Dauer** gegen den Sollwert, Toleranz 15 %.
- **Wochensumme gegen den Deckel.** Überschreitung um mehr als 10 % ist eine Warnung.
  Das ist in Fassung 3 neu und ersetzt die Ramp-Rate als Frühwarnung.
- **Zonenverteilung** aus dem Puls-Stream gegen die Bänder aus Abschnitt 1.
- **Z2-Tage:** Warnung bei mehr als 15 % der Zeit in Z4/Z5. Warnung auch, wenn unter
  40 % in Z2 und unter 75 % in Z1–Z2 liegen.
- **Samstag:** in den Wochen 6, 9, 12 zusätzlich die erreichte Z3-Blockzeit gegen den
  Sollwert. Sonst gilt der Samstag als Z2-Tag.
- **Donnerstag:** harte Zeit gegen `Wiederholungen × Minuten`. Bis Woche 4 zählt die
  Zone **unter** der Zielzone mit, weil der Puls dem Tritt nachhinkt. **Ab Woche 5 wird
  stattdessen die Zeit in der Watt-Zone gezählt.**
- **Pendelfahrten (Di, Mi):** Die Solldauer ist eine **Untergrenze**. Über 20 % der Zeit
  oberhalb Z2 heißt, der Weg wurde unter Zeitdruck gefahren.
- **Ruhetag mit Fahrt:** als Zusatz markiert, nicht als Fehler.
- **Optionale Fahrten (Freitag, Sonntag):** nicht am Umfang gemessen. Bewertet wird die
  Intensität: über 25 % der Zeit oberhalb Z2 gilt als zu hart.

### Zusätzliche Kennzahlen ab Woche 5

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
| Wochensumme gegen Deckel | Woche | ≤ Soll + 10 % | Überlastungsschutz |

### Krafteinheiten

**intervals.icu speichert bei Krafteinheiten nur Dauer und Puls.** Es gibt kein Feld für
Übung, Satz, Wiederholung oder Gewicht. Auch Garmin erkennt Planks, Dead Bugs und Bird
Dogs nicht zuverlässig.

Zwei Auswertungswege:

**1. Rundenschätzung aus der Dauer.** Der Zirkel ist deterministisch. Passt keine
Rundenzahl auf eine halbe Runde genau, wird nichts behauptet. **Achtung:** am Sonntag
verlängert der Beinblock die Aufzeichnung um ca. 10 min — und ab Woche 11 kommt am
Dienstagabend eine zweite, kürzere Krafteinheit dazu, die nicht als Sonntagszirkel
fehlinterpretiert werden darf.

**2. Das App-eigene Protokoll** (genauer, hat Vorrang). Liefert exakte Runden, Sätze,
Zeit unter Spannung, Abbruchpunkt und **welche Übung regelmäßig vorzeitig beendet
wird**.

Fehlt beides, wird das Rumpftraining als „nicht erfasst" ausgewiesen.

**Ist-Befund 30.08.:** In beiden ausgewerteten Wochen ist nur **eine** Krafteinheit
aufgezeichnet, der Plan sieht zwei vor. Entweder wird die zweite nicht aufgezeichnet
oder sie fällt aus — vor der nächsten Auswertung zu klären.

### Sportart-Erkennung

Rad: Typ enthält `ride`, `cycl`, `bike`, `biking` oder `spinning`.
Kraft: Typ enthält `weight`, `strength`, `core`, `workout`, `yoga`, `pilates` oder
`training`.

### Getrennte Summen

Geplante und optionale Fahrzeit werden getrennt summiert und getrennt ausgewiesen.

---

## 8. Nach Woche 16

Der Plan endet am **04.12.2026**. Danach wird auf Basis der drei Testergebnisse und der
Auswertung der 16 Wochen ein neuer Plan geschrieben.

Punkte, die dann zu klären sind — hier nur als Merkposten, ohne Festlegung:

- Ergebnis der drei Schwellentests und die Entwicklung von FTP, LTHR und Gewicht
- Rolle oder Smarttrainer für den Winter, da Draußentraining unter der Woche ab Dezember
  praktisch ausgeschlossen ist
- Zieltermin und Zielereignis
- Höhenmeter als eigenständige Progression
- Lange Ausfahrten jenseits von drei Stunden

---

## 9. Änderungen gegenüber Fassung 2

| # | Änderung | Begründung |
|---|---|---|
| 1 | **2:1 statt 3:1 ab Woche 5**, Erholungswochen 4, 7, 10, 13, 16 | TSB −26 bei CTL 10 in Woche 3. Der 3:1-Rhythmus war in Fassung 2 selbst als Risiko benannt, mit der Begründung, `week % 4 === 0` halte die App-Logik einfach. Das ist kein Trainingsargument |
| 2 | **Wochenumfang als Obergrenze** (Soll + 10 %) | Ist-Umfang lag 10–35 % über Plan. Der Plan war nicht zu aggressiv, die Ausführung lag darüber |
| 3 | **Ramp-Rate-Regel ersetzt** | Bei CTL unter 20 ist „≤ 5 Punkte/Woche" nicht aussagekräftig — das wäre eine Verdopplung der Grundlast pro Woche |
| 4 | **Erholungssteuerung zweistufig** | TSB als Auslöser erst ab CTL 20, davor Umfangsdeckel und Wellness-Gate |
| 5 | **Verbindlicher Testanlauf** (Abschnitt 2a) mit Testtempo-Vorbelastung am 03.09. und Öffnern am 09.09. | Ein blind gepacter erster Test fällt zu niedrig aus und verzerrt die Zonen für den gesamten Folgeblock |
| 6 | **Go/No-Go-Liste statt TSB-Grenzwert** | Ein TSB-Kriterium wäre bei dieser CTL dauerhaft blockierend |
| 7 | **Verschiebungsregel korrigiert:** nach hinten, ohne Ersatz, ohne Tausch | Die alte Regel („Samstag derselben Woche") war bei einer Sa–Fr-Woche unmöglich — der Samstag liegt fünf Tage vor dem Donnerstag |
| 8 | **Abschnitt 4.0 Wochengrenze** neu | Derselbe Denkfehler steckte in 4.3, 4.7 und 4.11 |
| 9 | **Phasen neu geschnitten:** 1–4, 5–10, 11–13, 14–16. Tests in Woche 4, 10, 16 | Folge des 2:1-Rhythmus. Testabstände 6 Wochen statt 8 und 4 |
| 10 | **Samstagsblöcke in Woche 6, 9, 12** statt 6, 10, 14 | Jeweils zweite Belastungswoche eines Paars; nicht in Phase 4, wo der Donnerstag bereits Schwellenarbeit trägt |
| 11 | **Erhaltungsreiz in Phase 3** (6 × 30 s am Mittwoch, Woche 11–12) | Drei Wochen ohne harten Reiz kosten VO2max. Kostet an Erholung praktisch nichts |
| 12 | **Zweite Beineinheit ab Woche 11**, Dienstagabend; Phase 4 als Erhaltungsdosis | Erst in Phase 3 fällt der Konflikt mit dem Qualitätstag weg. Vorher gibt es keinen freien Platz in der Woche |
| 13 | **Progression des Beinblocks von den Phasengrenzen entkoppelt** | Zusatzgewicht ab Woche 13 zu warten verschenkt Wochen, in denen das Defizit bereits läuft |
| 14 | **Muskelkater-Regel** für den Beinblock | Rückmeldung: Oberschenkel brauchen nach der Samstagsausfahrt mehr als einen Tag. Abschnitt 4.3 warnte bereits vor Krafttraining auf müder Muskulatur, ohne eine Regel dafür zu haben |
| 15 | **Bikefit und Knie-Begründungen entfernt** | Die Beschwerden waren einmalig und muskulär, nicht das Knie. Die Kadenzregel bleibt, mit muskulärer statt orthopädischer Begründung |
| 16 | **Abschnitt 11 Ernährung** neu | Zieldaten festhalten. Bewusst nicht in `plan.json` |
| 17 | **Abschnitt 8 auf Merkposten reduziert** | Nach Woche 16 wird ein neuer Plan geschrieben, nicht dieser fortgeschrieben |
| 18 | **Ist-Stand-Abschnitt** mit den Daten der ersten drei Wochen | Grundlage aller Änderungen dieser Fassung, nachvollziehbar dokumentiert |
| 19 | **Sensorik-Abschnitt aktualisiert** | Powermeter liegt früher vor als geplant, wird bis zum Test aber nur mitgeschrieben |
| 20 | **Drift-Einschränkung dokumentiert** | D3 der Referenzfahrt stützt sich auf 11,7 min Steady-Zeit; der Wert +6,5 % ist statistisch dünn |

### Bewusst **nicht** geändert

- **Der Einstiegssprung in Woche 1–3.** Die Wochen sind gefahren; rückwirkend zu bremsen
  bringt nichts.
- **Alle Entscheidungen zum Rumpf-Zirkel** (Deckel bei 40 s, Verhältnis 1:0,5,
  alternierende Übungen, kein Superman).
- **Ein Qualitätstag pro Woche** in Phase 1, 2 und 4. Für einen Einsteiger richtig
  dosiert.
- **Sprechtest als oberste Instanz für Z2.** Coggan-Z2 ist breit und liegt oben oft über
  LT1.

### Unter Vorbehalt

- **Dienstag wächst auf 90 min.** Das sind rund 30 km vor Arbeitsbeginn, plus Puffer,
  Umziehen und Duschen. Falls das nicht aufgeht: Dienstag bei 75 min deckeln und die
  Differenz auf den Samstag legen.
- **Phase 3 erreicht 445 min Rad pro Woche.** Ein großer Teil ist Pendelzeit, die ohnehin
  anfällt. Fallen die Bürotage weg, sinkt der Umfang automatisch mit; das ist kein
  Planverstoß.
- **Phase 3 umfasst nur zwei Belastungswochen.** Als Grundlagenblock ist das kurz. Sie
  ist hier vor allem die Brücke zwischen VO2max- und Schwellenblock und trägt die zweite
  Beineinheit.

---

## 10. Beweglichkeit, Koordination und Knochenreiz

Eigenständiger, radunabhängiger Block. Beweglichkeit und Koordination verlieren mit
zunehmendem Alter unabhängig von der Ausdauerentwicklung an Substanz.

**Bewusst getrennt vom Radplan gehalten:** geringe mechanische Belastung, kaum
Interferenz mit Kraft- oder Ausdauererholung. **Nicht** Teil der Opferreihenfolge aus
Abschnitt 4 — der Block kostet keine Erholung und hat keinen Grund, zuerst zu fallen.

### Täglich — Mobility-Flow (5–6 min)

| # | Übung | Dosierung | Fokus |
|---|---|---|---|
| 1 | Tiefe Kniebeuge halten, seitlich pendeln | 60 s | Hüfte, Sprunggelenk |
| 2 | 90/90-Wechsel im Sitzen | 10 Wdh. je Seite | Hüftrotation innen/außen |
| 3 | Katze-Kuh + BWS-Rotation, Vierfüßlerstand | 8 Wdh. je Seite | Brustwirbelsäule |
| 4 | Schulterkreisen mit Stab/Handtuch über Kopf | 10 Wdh. | Schulter |
| 5 | Ausfallschritt mit Rotation zum vorderen Bein | 6 je Seite | Hüftbeuger, Rotation |

**Größter Hebel bei Radfahrern:** verkürzte Hüftbeuger durch die gebeugte Sitzposition.
Statisches Dehnen davon direkt nach der Fahrt, solange der Muskel warm ist.

### Alle 2 Tage — Gleichgewicht und Koordination (5–8 min)

| # | Übung | Dosierung | Fokus |
|---|---|---|---|
| 1 | Einbeinstand, Augen zu | 3 × 20–30 s je Seite | Propriozeption |
| 2 | Einbeinstand + Kopfdrehungen | 2 × 20 s je Seite | Vestibularis |
| 3 | Diagonalgang, kontralateraler Arm-Bein-Schwung, betont langsam | 20 Schritte | Koordination |
| 4 | Tandemstand auf instabiler Unterlage, ggf. Ball werfen/fangen | 2 × 30 s | Gleichgewicht unter Zusatzreiz |

### 2–3 × pro Woche — Knochenreiz (unter 1 min)

**20–30 beidbeinige Sprünge**, zügig, weich landen. An den Mobility-Flow gehängt.

**Warum:** Radfahren ist nicht gewichtstragend und leistet für die Knochendichte nichts.
Der Reiz, der dort wirkt, ist kurz, stoßhaltig und ermüdungsfrei. Bei laufendem
Kaloriendefizit ist das der einzige Reiz im gesamten Programm, den das Rad prinzipiell
nicht liefern kann.

**Ausdrücklich keine eigene Einheit.** Zählt in der Wochenrechnung nicht mit, taucht in
keiner Opferreihenfolge auf, erzeugt keine messbare Erholungslast.

Steigerung erst, wenn 30 Sprünge ohne Ermüdung und mit weicher Landung gelingen: dann
einbeinig, wenige Wiederholungen je Seite.

### Platzierung in der Woche

- **Mobility-Flow:** an jedem Tag möglich, auch am Ruhetag Montag.
- **Gleichgewicht und Koordination:** alle zwei Tage, z. B. Mo/Mi/Fr/So.
- **Knochenreiz:** an den Mobility-Flow gehängt, nicht am Tag vor dem Qualitätstag.
- Alle drei Blöcke passen morgens, als Pause im Büro oder abends dazwischen.

### Progressionsregel

1. Einbeinstand mit geschlossenen Augen > 30 s sauber je Seite → instabile Unterlage
2. Tandemstand auf instabiler Unterlage stabil → zusätzlich Augen schließen

### Abgrenzung

Kein Eintrag im App-Protokoll und keine Auswertung über intervals.icu vorgesehen.

---

## 11. Ernährung — Zieldaten

**Referenzabschnitt, keine Steuerung durch den Plan.** Die Umsetzung läuft unabhängig.
Bewusst **nicht** in `plan.json` und damit nicht in der App.

### Zielwerte

| Größe | Wert |
|---|---|
| Ausgangsgewicht | 102,2 kg (01.07.2026) |
| Erste belastbare Messung | 97,6 kg (17.08.2026) |
| Zielgewicht Woche 16 (04.12.2026) | 87 kg |
| Zielkorridor Abnahmerate | 500–650 g/Woche |
| Protein | 1,6–2,2 g/kg → bei 96 kg: 155–212 g/Tag |
| Verpflegung auf dem Rad | ab 90 min Fahrzeit, 40–60 g Kohlenhydrate/h |

### Hinweise

- **Der Wert 102,2 kg steht zweimal identisch** (01.07. und 15.08.) und stammt vermutlich
  aus einer einzigen Eingabe. Der scheinbare Sturz auf 97,6 kg am 17.08. ist ein
  Messartefakt, kein Gewichtsverlust. Für jede Verlaufsrechnung ist der 17.08. der erste
  belastbare Punkt.
- **Nur der Wochentrend ist lesbar.** Der Tageswert schwankt um bis zu 1,5 kg bei einem
  echten Trend von rund 100 g pro Tag. Gleitendes Sieben-Tage-Mittel verwenden.
- **87 kg sind das optimistische Ende.** Von 96,3 kg aus sind das 664 g pro Woche über
  14 Wochen und damit oberhalb des eigenen Korridors. Bei 500–650 g liegt das Ergebnis
  bei 87 bis 89 kg.
- **Gewicht am Testtag dokumentieren** — sonst ist W/kg über die drei Tests nicht
  vergleichbar (steht auch in der Testcheckliste, Abschnitt 2a).
- **Ab Woche 5 liegen die Samstagsausfahrten bei 150+ min.** Ohne Verpflegung verzerrt
  der Energiemangel im letzten Drittel die Driftanalyse — der Drift ist dann nicht mehr
  sauber der Intensität zuzuordnen.
- **Kein Tracking vorgesehen.** Die Steuerung läuft über den Wochentrend auf der Waage.
