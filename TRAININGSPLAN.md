# Trainingsplan Radfahren — Projektwissen

Wissensdokument für ein Claude-Projekt. Beschreibt den Trainingsplan, die zugehörige
PWA und den Zugriff auf Trainingsdaten über intervals.icu.

Aus dem Code der App extrahiert (`index.html`), nicht abgeschrieben. Bei Änderungen am
Plan muss dieses Dokument mitgezogen werden.

- **App:** https://sfutterer.github.io/trainingsplanRad/
- **Repo:** https://github.com/sfutterer/trainingsplanRad
- **Datenquelle:** intervals.icu, synchronisiert von Garmin Connect

> **Fassung 12, Stand 22.10.2026.** **Retest ausgewertet: 234,7 W über 20 min → FTP 223 W,
> LTHR 166 bpm.** Die Arbeits-FTP entfällt — Test-FTP und Zielwatt rechnen wieder auf
> demselben Wert. **Neue Zielwatt:** Do-Intervalle 250–260 W, Sa-Blöcke 178–196 W,
> Phase-4-Schwelle 201–212 W. **Z2 folgt jetzt der FTP:** Coggan-Z2 123–167 W, für lange
> Fahrten gilt ein **Arbeitsbereich von Ø 135–150 W**, gesteuert über den Durchschnitt,
> kontrolliert über das Decoupling. Die feste Regel „Z2 106–144 W unabhängig von der FTP"
> ist aufgehoben. Das Pulskriterium der Intervalle hängt an **166 bpm**. **Woche 10 war
> keine Erholungswoche** (Entscheidung nach Erkältungspause), nächste Erholungswoche
> bleibt Woche 13. Der Anlauf zum 22.10. ist in Abschnitt 2a dokumentiert, der Test in der
> Testhistorie. Begründung in Abschnitt 9i.
>
> Fassung 11 (24.09.2026) brachte: **Die Zielwatt der Donnerstagsintervalle stiegen auf
> 240–250 W, die Arbeits-FTP von 206 auf 215 W.** Anlass: zwei Intervalleinheiten in Folge
> (17.09., 24.09.) hatten das Pulskriterium „≥ 163 bpm in den letzten 60 s" bei Leistungen
> bis 239 W verfehlt, und am 24.09. kamen nach vier Wiederholungen noch 268 W über 4 min.
> Neu war eine Nachsteuerregel über das Pulskriterium in 5-W-Schritten. Begründung in
> Abschnitt 9h.
>
> Fassung 10 (23.09.2026) brachte: **Der Dienstag ist eine feste Größe:** dieselbe lange
> Pendelstrecke, Soll 90 min, in jeder Belastungswoche bis Woche 15. Er wird nicht mehr
> verlängert — die verfügbare Zeit vor Arbeitsbeginn ist ausgeschöpft. Die Wochensummen
> änderten sich nicht. Begründung in Abschnitt 9g.
>
> Fassung 9 (20.09.2026) brachte: Im Koordinationsblock (Abschnitt 10) ersetzt die
> **einbeinige Standwaage** den Diagonalgang. Begründung in Abschnitt 9f.
>
> Fassung 8 (19.09.2026) brachte: **Auf dem Cube hat in Z2 die Leistung Vorrang vor der
> Kadenz — Zielkadenz 80–85 rpm statt 85–90 rpm**, Arbeitspunkt Gang 8 bei 80–82 rpm.
> Außerdem: **Die Analyse bewertet Radeinheiten mit Leistungsmesser nach Abschnitten**
> (App-Anforderung 30). Begründung in Abschnitt 9e.
>
> Fassung 7 (17.09.2026) brachte: 5-min-Referenzwert 254 W = 132 % der Test-FTP, Einführung
> der **Arbeits-FTP 206 W** für die Zielwatt der Qualitätseinheiten, kein vorgezogener
> Retest, Intervallkriterium an der LTHR statt an der HFmax, präzisierte Ruhepuls-Regel,
> Streckenregel für Maximalversuche. Begründungen in Abschnitt 9d.
>
> Fassung 6 (11.09.2026) brachte: **Es wird das ganze Jahr draußen gefahren, keine
> Rolle.** Abschnitt 4.11 ordnet den Donnerstag neu. Der Retest am 03.12. startet um
> **14:00 statt 16:21**. Begründung in Abschnitt 9c.
>
> Fassung 5 (09.09.2026) brachte: Erhaltungsreiz Phase 3 als 3 × 3 min, eingebettet in die
> Z2-Einheit am Donnerstag, statt 6 × 30 s am Mittwoch.
>
> Fassung 4 (04.09.2026) brachte: 5-Minuten-All-out aus dem Schwellentest gestrichen,
> VO2max-Referenz auf Do 17.09. verlegt, Testdauer 65 → 55 min.
>
> Fassung 3 (30.08.2026) brachte: 2:1-Rhythmus ab Woche 5, Wochenumfang als Obergrenze
> statt als Sollwert, verbindlicher Testanlauf zum 10.09., zweite Beineinheit ab
> Phase 3, Ernährungs-Zieldaten als eigener Abschnitt. Der Plan endet mit Woche 16 —
> danach wird ein neuer Plan geschrieben.
>
> Begründungen der Änderungen in Abschnitt 9 (Fassung 3), 9a (Fassung 4),
> 9b (Fassung 5), 9c (Fassung 6), 9d (Fassung 7), 9e (Fassung 8), 9f (Fassung 9),
> 9g (Fassung 10), 9h (Fassung 11) und 9i (Fassung 12).

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

**Sensorik:** Herzfrequenz durchgehend. Leistungs- und Trittfrequenzmesser am Cube Nuroad
**seit Ende August**. Seit dem Schwellentest am 10.09. sind Wattwerte die primäre
Steuergröße der Qualitätseinheiten und der langen Ausfahrt.

### FTP 223 W — ein Wert für alles (seit Fassung 12)

**Seit dem Retest am 22.10. gibt es wieder nur eine FTP: 223 W.** Sie steht in
intervals.icu, in der App, im Zonenmodell und ist zugleich die Bezugsgröße aller
Zielwatt.

**Die Arbeits-FTP ist aufgehoben.** Sie war von Fassung 7 bis 11 eine Hilfsgröße, weil
der erste Test (192 W) belegt zu niedrig lag: Fassung 7 setzte sie auf 206 W, Fassung 11
auf 215 W, jeweils nur für die Zielwatt der Qualitätseinheiten. Der Retest liegt mit
223 W noch 8 W darüber — die Arbeits-FTP war also eher vorsichtig als zu hoch angesetzt.

**Warum der Testwert jetzt trägt:** Der Test vom 22.10. war ausbelastet (Max HF 180,
Ø 172 bpm in den letzten 5 min) und gleichmäßig gefahren (5-min-Abschnitte 236 / 233 /
232 / 237 W). Die Unsicherheit, die der erste Test hatte — fehlende Pacing-Erfahrung,
keine Ausbelastung —, fällt damit weg. Einzelheiten in der Testhistorie (Abschnitt 2a)
und in Abschnitt 9i.

**Struktur:** Woche 1–4 im 3:1-Rhythmus, **ab Woche 5 im 2:1-Rhythmus**.

- **Phase 1 (Woche 1–4):** Grundlage, Tempo-Intervalle in Z3. Woche 4 mit Schwellentest.
- **Phase 2 (Woche 5–10):** VO2max-Intervalle, 5 × 4 min. Woche 10 mit Retest.
- **Phase 3 (Woche 11–13):** Grundlagenblock mit Erhaltungsreiz.
- **Phase 4 (Woche 14–16):** Schwellenblock, 3 × 10–12 min. Woche 16 mit Retest.

**Erholungswochen: 4, 7, 13, 16.** Reduzierter Umfang **und** reduzierte Intensität.
Keine Z5-Arbeit, keine Blöcke am Samstag, kein Beinblock am Dienstag.

**Woche 10 war keine Erholungswoche (Fassung 12).** Woche 8 fiel durch eine Erkältung
weitgehend aus und war faktisch eine Pause. Eine Erholungswoche direkt danach wäre zu
früh gekommen. Woche 10 blieb deshalb Testwoche mit Testanlauf, aber ohne reduzierten
Umfang; die lange Ausfahrt lag am Sonntag. Die nächste Erholungswoche ist Woche 13 wie
geplant. **Absicherung:** Die Wochen 9 bis 12 sind vier Belastungswochen in Folge. Die
TSB-Regel aus der Erholungssteuerung (sieben Tage unter −20 → Folgewoche Erholung) und
das Wellness-Gate gelten deshalb in Woche 11 und 12 ausdrücklich als Auslöser.

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
| 8 | 03.10. – 09.10.2026 | 2 · faktisch Pause (Erkältung) |
| 9 | 10.10. – 16.10.2026 | 2 · Samstag mit Blöcken |
| 10 | 17.10. – 23.10.2026 | 2 · **Retest Do 22.10.** · keine Erholungswoche (Fassung 12) |
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
| Dienstag | Rad, Grundlagenausdauer Z2 — **Arbeitsweg, feste lange Strecke, konstant 90 min** · in Phase 3/4 abends Beinblock |
| Mittwoch | Rad, kurzes Z2 — **Arbeitsweg, direkt** · abends Rumpf **verkürzt** (2 Runden) |
| Donnerstag | Rad, Qualitätseinheit (je nach Phase) |
| Freitag | Ruhetag oder optional 30–40 min Z1 |
| Samstag | Lange Ausfahrt, Basis Z2 |
| Sonntag | Rumpf **voll** + Beinblock + optional Z1-Fahrt |

Der Tausch Mittwoch ↔ Sonntag ist bewusst: die anstrengendere Krafteinheit liegt
direkt vor dem Ruhetag Montag, und der Tag vor dem Qualitätstag Donnerstag ist leicht.

### Ist-Stand nach drei Wochen (Stand 30.08.2026)

Grundlage der Änderungen in Fassung 3. Zahlen aus intervals.icu, Wochenbuckets laufen
dort **Mo–So** und sind gegen die Planwochen (Sa–Fr) versetzt.

| Woche (Mo–So) | Radzeit | Load | CTL | ATL | TSB |
|---|---|---|---|---|---|
| 10.–16.08. | 34 min | 9 | 0,2 | 1,2 | −1 |
| 17.–23.08. | 364 min | 221 | 5,1 | 22,4 | −17,3 |
| 24.–29.08. | 351 min | 241 | 9,9 | 35,9 | **−26,0** |

**Befund 1 — Die Zonenkorrektur hat sofort gewirkt.** Anteil der Fahrzeit oberhalb Z2:
55 % in der ersten Woche, 10 % in der zweiten.

**Befund 2 — Der Ist-Umfang liegt über dem Plan.** Geplant waren 266 und 326 Minuten,
gefahren wurden 364 und 351. Siehe Umfangsdeckel unten.

**Befund 3 — TSB −26 bei CTL 10.** Die Ramp-Rate-Regel ist bei dieser CTL nicht
aussagekräftig und wird durch den Umfangsdeckel ersetzt.

**Befund 4 — Gewicht.** Die erste belastbare Messung ist der 17.08. (97,6 kg); der Wert
102,2 kg vom 01.07. und 15.08. stammt vermutlich aus einer einzigen Eingabe. Siehe
Abschnitt 11.

**Befund 5 — Gelände.** 173 und 308 Höhenmeter pro Woche auf 114 bzw. 119 km. Die
Annahme flacher Referenzstrecken trägt.

### Umfangsdeckel

**Die Wochensumme Rad ist eine Obergrenze, nicht nur ein Sollwert.** Zulässig ist der
Planwert plus höchstens 10 %. Wird er überschritten, wird in der Folgewoche gekürzt,
nicht kompensiert.

### Erholungssteuerung

Zweistufig, weil die klassischen Modellwerte bei niedriger CTL nicht tragen:

| CTL | Steuerung |
|---|---|
| **unter 20** | Umfangsdeckel + Wellness-Gate. TSB wird beobachtet, aber **nicht** als Auslöser verwendet |
| **ab 20** | Zusätzlich: liegt TSB sieben Tage in Folge unter −20, ist die Folgewoche eine Erholungswoche, unabhängig von der Wochennummer |

**Seit 17.09.2026 (CTL über 20) ist die zweite Stufe aktiv.** Mitte Oktober liegt die
CTL um 30. Bis Fassung 11 lief die Trainingslast auf der Test-FTP 192 W und fiel dadurch
rund 12–16 % zu hoch aus. **Ab dem 22.10. rechnet intervals.icu mit 223 W** — Load, CTL
und ATL fallen ab dann niedriger aus als zuvor bei gleicher Arbeit. Das ist eine
Korrektur der Rechnung, kein Formverlust, und beim Lesen der Fitness-Seite mitzudenken.

Ergänzend gilt weiterhin: zwei rote Wellness-Tage hintereinander → gesamte Woche als
Erholungswoche.

### Arbeitsweg als Trainingsbestandteil

Dienstag und Mittwoch sind Bürotage. Nur der Hinweg wird gefahren, mit Gepäck.
Direkte Strecke ca. 13 km; **gesteuert wird über die Zeit, nicht über die Distanz.**

| Tag | Strecke | Charakter |
|---|---|---|
| **Dienstag** | **feste lange Strecke**, ca. 30–34 km | die volle Z2-Einheit, **konstant 90 min** (Fassung 10) |
| **Mittwoch** | direkt, ca. 13 km | bewusst der lockerste Fahrtag der Woche |

**Warum der Mittwoch kurz bleibt:** Er ist der einzige Fahrtag direkt vor dem
Qualitätstag Donnerstag. Unteres bis mittleres Z2, nicht am Sprechtest-Limit.

**Ausnahme Phase 3 (Woche 11–12):** Dort ist der Donnerstag selbst eine Z2-Einheit und
braucht keine Schonung davor. Der Mittwoch wächst auf 60 min — **reines Z2, ohne
Zusatzreiz.** Der Erhaltungsreiz hängt seit Fassung 5 am Donnerstag.

**Zusammenhängend statt aufgeteilt.** Eine gestreckte Hinfahrt schlägt zwei kürzere
Fahrten deutlich: der mitochondriale Reiz braucht die Dauer am Stück.

**Praktische Randbedingungen:**

- **Ankunftspuffer 15 min.** Zeitdruck macht aus einer Z2-Fahrt zuverlässig eine
  Z3-Fahrt. Der Puffer ist Teil des Trainings.
- **Gepäck auf den Gepäckträger, nicht in den Rucksack.**
- **Die Pendeltage laufen auf dem Trekkingrad**, das keinen Leistungs- und
  Kadenzsensor hat. Diese Fahrten tragen weder Watt noch Trittfrequenz — das ist so
  gewollt und kein Datenverlust. In intervals.icu als `commute` **und** mit dem Vermerk
  „kein Powermeter" taggen, damit sie eFTP- und EF-Trends nicht verfälschen.
- **Ab Oktober:** Dunkelheit, Kälte und Nebel im Morgenverkehr. Beleuchtung und Reifen
  gehören dann zur Planung; bei niedrigen Temperaturen braucht die Fahrt länger, bis
  sie wirklich Z2 ist.
- **Der Dienstag ist gedeckelt durch die verfügbare Zeit, nicht durch den Plan**
  (Fassung 10). Soll 90 min; **85–100 min Fahrzeit gelten als planmäßig.** Die Strecke
  wird nicht verlängert, auch nicht zum Ausgleich einer anderen ausgefallenen Einheit.
  Braucht die Fahrt länger, wird **die Strecke gekürzt, nicht die Abfahrt vorverlegt**.
  Eine kürzere Dienstagsfahrt wird nicht kompensiert.
- **In Erholungswochen** (7, 13, 16) bleibt der Dienstag bei 50 min. In Testwochen
  gilt der Testanlauf aus Abschnitt 2a.

### Pulszonen — Übergangsfassung (Woche 1 bis 4, historisch)

**Korrigiert am 22.08.2026, methodisch nachgeschärft am 23.08.2026.** Gültig bis zum
ersten Test am 10.09.; seitdem gelten die Coggan-Zonen unten. Die Bänder bleiben als
historische Fassung stehen, weil die Pendeltage auf dem Trekkingrad weiterhin mit dem
belegten Arbeitsbereich 128–135 bpm gefahren werden.

| Zone | bpm | Verwendung |
|---|---|---|
| unter Z1 | < 100 | Rollen, Pause |
| Z1 | 100–128 | Erholung, Einfahren, optionale Fahrten |
| **Z2 Arbeitsbereich** | **128–135** | **Grundlagenausdauer — hier fahren** |
| Z2 Obergrenze | 135–142 | nur kurzzeitig |
| Z3 | 142–155 | Tempo |
| Z4 | 155–168 | Übergang, im Plan nicht angesteuert |
| Z5 | > 168 | VO2max |

**Nachtrag Fassung 12:** Die damals zugrunde gelegte HFmax-Annahme von 180 bpm ist am
22.10. im Retest erstmals tatsächlich erreicht worden. Der Arbeitsbereich 128–135 liegt
in der HF-Z2 aus der neuen LTHR 166 (113–137 bpm).

#### Woher die Korrektur kommt

Datengrundlage: Samstagsausfahrt 22.08.2026, 143 min, 46,9 km, 113 hm, überwiegend flach.

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

#### Driftanalyse

Nach Herausfiltern aller Stop-and-go-Phasen (nur Segmente ≥ 120 s durchgehend
> 15 km/h, zusammen 83 von 143 min):

| Drittel | Steady-Zeit | Ø km/h | Ø HF | EF (km/h ÷ HF) |
|---|---|---|---|---|
| D1 | 36,5 min | 21,2 | 131,0 | 0,1619 |
| D2 | 34,8 min | 20,8 | 131,6 | 0,1578 |
| D3 | 11,7 min | 20,0 | 132,2 | 0,1513 |

**Drift D1 → D3: +6,5 %. Über die Hälften: +3,9 %.** D3 stützt sich auf nur 11,7 min
Steady-Zeit und ist statistisch dünn. Die Gegenprobe bei gleicher Geschwindigkeit zeigte
nur 1–2 Schläge Anstieg früh gegen spät.

#### Methodenhinweis für künftige Driftanalysen

1. **Nicht nur Hälften vergleichen** — Drittel zeigen Effekte, die die Zweiteilung
   verdeckt. Aber: Drittel mit unter 15 min Steady-Zeit nicht überinterpretieren.
2. **Stop-and-go herausfiltern.** Nur Segmente ≥ 120 s durchgehend > 15 km/h werten.
3. **Gegenprobe bei gleicher Geschwindigkeit** früh gegen spät.
4. **Untergrund und Streckenprofil notieren.** Auf Fahrten mit Leistungsmesser entfällt
   das Problem, weil Watt unabhängig davon sind.
5. **Verpflegung notieren.** Ab 90 min Fahrzeit ohne Kohlenhydratzufuhr ist der Drift
   nicht mehr sauber der Intensität zuzuordnen.
6. **Anstiege in einer Hälfte** (neu in Fassung 12) verzerren den Hälftenvergleich des
   Decouplings. Liegt ein harter Anstieg nur in einer Hälfte, ist der Wert nicht
   aussagekräftig (Beispiel So 18.10.).

### Zonen — gesetzt seit 22.10.2026 (Fassung 12)

Beide Zonensätze stehen nach Coggan, in intervals.icu **und** in der App identisch.
intervals.icu zeigt die exakten Grenzen; die Tabellen hier sind auf ganze Watt bzw.
Schläge gerundet.

**Leistung, aus der FTP 223 W:**

| Zone | % FTP | Watt | Verwendung |
|---|---|---|---|
| Z1 | 0–55 % | 1–122 | Intervallpausen, optionale Fahrten |
| **Z2** | **56–75 %** | **123–167** | **Di, Mi, Sa — Grundlagenausdauer**, Arbeitsbereich lange Fahrt Ø 135–150 W |
| Z3 | 76–90 % | 168–200 | Samstagsblöcke |
| Z4 | 91–105 % | 201–234 | Schwellenblöcke Phase 4 |
| Z5 | 106–120 % | 235–267 | VO2max-Intervalle |
| SS | 84–97 % | 187–216 | Sweetspot, derzeit nicht im Plan |

**Vorwerte aus der Test-FTP 192 W (10.09. bis 22.10.):** Z1 1–105, Z2 106–144, Z3 145–172,
Z4 173–201, Z5 202–230 W.

**Herzfrequenz, aus der Schwellen-HF 166 bpm:**

| Zone | % LTHR | bpm |
|---|---|---|
| Z1 | 0–67 % | 0–112 |
| **Z2** | **68–83 %** | **113–137** |
| Z3 | 83–94 % | 138–156 |
| Z4 | 94–104 % | 157–172 |
| Z5 | 105 %+ | 173+ |

**Die LTHR ist 166, der Ø-Puls der 20 Testminuten am 22.10.** Anders als beim ersten
Test sind erhobener Protokollwert und gesetzter Wert diesmal identisch: Der Test war
ausbelastet (letzte 5 min Ø 172 bpm, Max 180). Beim ersten Test lag der Protokollwert bei
152, gesetzt wurden 163, weil der Test nicht ausbelastet war. intervals.icu rechnet für
seinen eigenen LTHR-Hinweis mit 98 % des 20-min-Pulses (hier 163); dieser Plan bleibt bei
der Methode aus Abschnitt 2a, damit die drei Tests vergleichbar bleiben.

**Zur HFmax:** Im Retest wurden **180 bpm** erreicht, am Ende eines ausbelasteten
20-min-Abschnitts. Das entspricht der bisherigen Annahme von 180 und ist jetzt ein
Messwert — als Untergrenze, weil kein gezielter Maximalversuch am Berg gefahren wurde.
Das Feld „Max HR" in intervals.icu bleibt bei 180. **Kontrollgrößen hängen weiter an der
LTHR, nicht an der HFmax.**

### Z2 folgt der FTP (neu in Fassung 12)

**Bis Fassung 11 galt Z2 fest bei 106–144 W, ausdrücklich unabhängig von der FTP.**
Begründet war das mit LT1 und dem belegten Arbeitspunkt um 139 W (Decoupling −0,9 % am
12.09.). Diese Regel ist aufgehoben.

**Ab sofort:**

- **Z2 ist die Coggan-Zone aus der aktuellen FTP**, derzeit **123–167 W**, und wandert
  mit jedem Test mit.
- **Arbeitsbereich für lange Fahrten: Ø 135–150 W.** Gemeint ist die
  Durchschnittsleistung beim Treten, nicht der Momentanwert. Kurze Wellen, Anfahren und
  Kuppen dürfen darüber liegen; gesteuert wird über den Schnitt, damit ein gleichmäßiger
  Fahrfluss möglich bleibt.
- **Bei vielen Stopps** zieht das Rollen den Gesamtschnitt nach unten. Der angezeigte
  Ø inklusive Rollphasen liegt dann rund 5–10 W unter dem Schnitt beim Treten.
- **Kontrolle über das Decoupling:** ≤ 5 % → der Arbeitsbereich trägt diese Dauer.
  Liegen zwei lange Fahrten in Folge über 5 %, wird der Arbeitsbereich auf Ø 130–145 W
  zurückgenommen.
- **Der Sprechtest bleibt oberste Instanz.** Ganze Sätze müssen möglich sein. Wird das
  Sprechen kurzatmig, ist LT1 überschritten — unabhängig von der Zahl.

**Warum der Arbeitsbereich unter der Zonenobergrenze liegt:** Coggan-Z2 reicht bis
75 % FTP und liegt oben oft über LT1. Belegt ist bisher der Bereich um 139 W; 150 W ist
der Schritt, den die gestiegene FTP plausibel macht, 167 W ist es nicht.

**Zielwatt der Qualitätseinheiten — aus der FTP 223 W (Fassung 12):**

| Einheit | Vorgabe | Watt |
|---|---|---|
| Do-Intervalle Phase 2 | 112–116 % | **250–260**, Nachsteuerung über das Pulskriterium |
| Sa-Blöcke Woche 12 | 80–88 % | **178–196** |
| Do-Erhaltungsreiz Phase 3 | 112–116 % | **250–260**, bzw. der zuletzt nachgesteuerte Wert |
| Do-Schwellenblöcke Phase 4 | 90–95 % | **201–212** |

**Vorwerte:** Fassung 11 (Arbeits-FTP 215 W): Do-Intervalle 240–250 W, Sa-Blöcke
172–189 W, Schwelle 194–204 W, Woche 7 fest ~196 W. Fassung 7 bis 10 (Arbeits-FTP 206 W):
222–237 W, 165–181 W, 185–196 W.

**Für Grundlagenfahrten sticht der Sprechtest die Zahl.** Zweite Kontrollinstanz ist
der Drift: liegt er über 5 %, war die Fahrt zu hart, auch wenn die Leistung im
Arbeitsbereich lag.

### Steuergrößen je Einheit

| Einheit | Primär | Kontrolle |
|---|---|---|
| Di Z2 (Trekkingrad, kein Powermeter) | Sprechtest, HF 128–135 | — |
| Mi Z2 kurz (Trekkingrad) | Sprechtest, bewusst darunter | — |
| Do Intervalle Phase 2 | **250–260 W**, Nachsteuerung ±5 W | Atmung sticht die Zahl; HF nur am Intervallende (≥ 166 bpm, letzte 60 s) |
| Do Z2 + Erhaltungsreiz (Phase 3) | Sprechtest für den Z2-Anteil, **250–260 W** (bzw. nachgesteuerter Wert) für die 3 × 3 min | HF nur am Intervallende |
| Do Schwelle (Phase 4) | **201–212 W** | HF sollte in Z4 einpendeln |
| Sa Basis | **Ø 135–150 W** beim Treten (Z2 123–167 W) | Sprechtest, Decoupling nach der Fahrt |
| Sa Blöcke | **178–196 W** | HF steigt langsam, ist normal |
| Fr/So optional | HF unter Z2-Obergrenze | — |

**Die beiden Bürotage laufen auf dem Trekkingrad und liefern keine Watt- und
Kadenzwerte.** Fehlende Leistungsdaten an Di und Mi sind kein Aufzeichnungsfehler.
Wattbasierte Kennzahlen — Efficiency Factor, eFTP, Zeit in Watt-Z2 — entstehen nur an Do
und Sa auf dem Cube Nuroad.

### Trittfrequenz

| Situation | Ziel |
|---|---|
| Grundlage Z2, Cube (Do/Sa, Wattvorgabe) | **80–85 rpm** — die Leistung hat Vorrang |
| Grundlage Z2, Trekkingrad (Di/Mi, keine Wattvorgabe) | 85–90 rpm |
| Intervalle Z5 | 95–100 rpm |
| Schwellenblöcke | 85–90 rpm |
| Anstieg | nicht unter 70 rpm, notfalls Übersetzung anpassen |

Liegt die selbstgewählte Kadenz deutlich darunter, in 5er-Schritten über vier bis sechs
Wochen herantasten, nicht erzwingen. **Auf dem Cube in Z2 gilt die Untergrenze
80 rpm.**

**Der Kadenz-Gang-Konflikt im Flachen (Fassung 7, entschieden in Fassung 8).** Der
1×12-Antriebsstrang des Cube springt zwischen benachbarten Gängen um bis zu 50 % in der
Übersetzung. Der belegte Arbeitspunkt ist **Gang 8 bei 80–82 rpm, rund 139 W**.
Dieselbe Übersetzung mit 85–90 rpm ergibt überschlägig 155–165 W.

- **Auf der Z2-Fahrt hat die Leistung Vorrang vor der Kadenz.** Zielkadenz auf dem Cube
  ist **80–85 rpm**.
- **Nachtrag Fassung 12:** Mit dem Arbeitsbereich Ø 135–150 W liegt Gang 8 bei
  80–85 rpm mitten im Ziel. 155–165 W bei 85–90 rpm sind jetzt zwar noch Z2, liegen aber
  über dem Arbeitsbereich — die Regel „unter 85 rpm bleiben" gilt deshalb weiter.
- **Geprüft am Sa 19.09. (Gang-Test):** Gang 7 mit 89 rpm ergab **Ø 107 W** — einen
  Zwischengang für ~139 W bei höherer Kadenz gibt es im Flachen nicht.
- **Bei Gegenwind oder Rückenwind** verschiebt sich der passende Gang. Die Regel bleibt
  dieselbe: den Gang wählen, in dem der Schnitt bei 80–85 rpm im Arbeitsbereich liegt.
- **Der Ort für reine Kadenzarbeit** ist die Kadenzpyramide am Mittwoch im leichten Gang
  sowie die Pendelfahrten auf dem Trekkingrad.

**Kein Kraftausdauertraining mit niedriger Kadenz** (großer Gang, 50–60 rpm) in diesem
Plan. Hohe Pedalkräfte auf noch untrainierter Beinmuskulatur kosten mehrere Tage
Erholung und entwerten den Qualitätstag.

**Kadenzpyramide** als Teil des Einfahrens am Mittwoch, alle ein bis zwei Wochen:
30 s je 90 / 100 / 110 / 120 / 110 / 100 / 90 rpm im leichten Gang, Puls bleibt in
Z1/Z2, nicht im Sattel hüpfen. Kostet 3,5 min.

### Höhenmeter — Einführung

Höhenmeter sind ein eigener Trainingsreiz und werden **nicht zusätzlich zur laufenden
Zeit-Progression** eingeführt, sondern als eigenständige, entkoppelte Variable:

1. **Eine Variable zur Zeit.** Höhenmeter und Dauer nicht gleichzeitig steigern.
2. **Gelände als Störgröße für die Driftanalyse** — mit Leistungsmesser deutlich
   kleiner, aber nicht null.
3. **Kadenz am Berg.** Ungewohnte Steigungen ohne eingeübtes Kadenzmanagement sind das
   größere Risiko als die reine Ausdauerbelastung.

**Vorgehen:**

- **Ab Woche 5:** Höhenmeter **ersetzen** statt addieren — eine flache Einheit gegen eine
  leicht hügelige mit ähnlicher Zeit tauschen.
- **Einstieg klein**, bevorzugt am **Samstag**.
- **Kadenz bewusst hochhalten**, nicht unter 70 rpm.
- **Danach eigenständige Progression:** +50 Hm je Belastungswoche, unabhängig von der
  Zeit-Progression der Woche.

**Hm-Band Samstag** (Hm je Ausfahrt, Reihen `SAT_HM_*` in Abschnitt 2):

| Woche | 1–4 | 5 | 6 | **7** | 8 | 9 | 10 | 11 | 12 | **13** | 14 | 15 | **16** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Hm** | flach | 150–250 | 200–300 | **100–200** | 250–350 | 300–400 | 150–250 | 350–450 | 400–500 | **200–300** | 450–550 | 500–600 | **250–350** |

**Woche 10** bleibt trotz entfallener Erholungswoche bei 150–250 Hm: Die lange Ausfahrt
lag vier Tage vor dem Retest. Woche 11 setzt wie geplant mit 350–450 Hm auf Woche 9 auf.

In den **Erholungswochen** beginnt das Band halb so hoch wie in der letzten
Belastungswoche. Sie zählen für die Steigerung nicht mit.

### Wellness-Gate

Morgens vor dem Donnerstag zu prüfen, Datenquelle `GET /athlete/0/wellness`:

```
Ruhepuls > 7-Tage-Schnitt + 5 bpm          ODER
HRV deutlich unter 7-Tage-Schnitt          ODER
Schlaf < 6 h in zwei Nächten hintereinander
  → Donnerstag wird 60 min Z2
  → Samstag ohne Blöcke
```

**Welcher Ruhepuls zählt (seit Fassung 7):** Maßgeblich ist der abgeschlossene Wert des
Vortags aus intervals.icu, verglichen mit dem Sieben-Tage-Schnitt. Liegt der Wert des
laufenden Tages bereits vor und ist er deutlich höher, zählt der höhere von beiden.

Nach fieberhaftem Infekt mindestens so viele lockere Tage wie Krankheitstage, bevor
wieder Intensität gefahren wird.

---

## 2. Wochenplan im Detail

| Woche | Phase | Di Z2 | Mi Z2 | Do Qualität | Sa lange Ausfahrt | So Z1 opt. | Rumpf So |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 60 | — | 4×5 min Z3 → 56 | 120, reines Z2 + 18 min Z3 | 30 | 2 Rd × 25 s / 25 s → 14 |
| 2 | 1 | 70 | 40 | 4×5 min Z3 → 56 | 130, reines Z2 | 30 | 2 Rd × 30 s / 25 s → 15 |
| 3 | 1 | 80 | 40 | 5×5 min Z3 → 64 | 140, reines Z2 | 35 | 2 Rd × 35 s / 25 s → 16 |
| **4** Erh. | 1 | 45 | 30 | **Schwellentest → 55** | 90, reines Z2 | 25 | 2 Rd × 25 s / 25 s → 14 |
| 5 | 2 | 85 | 40 | **5 min max + 4×4 min Z5 → 65** | 150, reines Z2 | 35 | 3 Rd × 30 s / 20 s → 21 |
| 6 | 2 | 90 | 40 | 5×4 min Z5 → 63 | 160 **+ 2×12 min Z3** | 40 | 3 Rd × 35 s / 20 s → 23 |
| **7** Erh. | 2 | 50 | 30 | 4×3 min Sweetspot → 48 | 100, reines Z2 | 25 | 2 Rd × 30 s / 25 s → 15 |
| 8 | 2 | 90 | 40 | 5×4 min Z5 → 63 | 165, reines Z2 | 40 | 3 Rd × 35 s / 20 s → 23 |
| 9 | 2 | 90 | 40 | 5×4 min Z5 → 63 | 175 **+ 2×12 min Z3** | 40 | 3 Rd × 40 s / 20 s → 25 |
| 10 Test | 2 | 50 | 30 + Öffner | **Retest → 55** | **150, reines Z2** (am So) | 25 | 2 Rd × 30 s / 25 s → 15 |
| 11 | 3 | 90 | **60** | **70 min Z2 + 3×3 min Z5** | 170, reines Z2 | 40 | 3 Rd × 40 s / 20 s → 25 |
| 12 | 3 | 90 | **60** | **75 min Z2 + 3×3 min Z5** | 180 **+ 2×12 min Z3** | 40 | 3 Rd × 40 s / 20 s → 25 |
| **13** Erh. | 3 | 50 | 30 | 55 min Z2 | 105, reines Z2 | 25 | 2 Rd × 30 s / 25 s → 15 |
| 14 | 4 | 90 | 40 | 3×10 min Z4 → 67 | 175, reines Z2 | 40 | 3 Rd × 40 s / 20 s → 25 |
| 15 | 4 | 90 | 40 | 3×12 min Z4 → 73 | 185, reines Z2 | 40 | 3 Rd × 40 s / 20 s → 25 |
| **16** Erh. | 4 | 50 | 30 | **Retest → 55** | 105, reines Z2 | 25 | 2 Rd × 30 s / 25 s → 15 |

Alle Werte in Minuten.

**Woche 10 (Fassung 12):** Testwoche ohne Erholungsreduktion. Die Werte für Di, Mi und
Do folgen dem Testanlauf (Abschnitt 2a), die lange Ausfahrt hat 150 statt 100 min und
lag am Sonntag, weil der Samstag Rumpftag war. Die Rumpfdosis bleibt in der Testwoche
reduziert, ohne Beinblock.

### Wochenumfang Rad und Deckel

| Woche | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Soll** | 266 | 326 | 359 | **245** | **375** | 393 | 253 | 398 | 408 | **310** | 430 | 445 | 265 | 412 | 428 | **265** |
| **Max (+10 %)** | 293 | 359 | 395 | **270** | **413** | 432 | 278 | 438 | 449 | **341** | 473 | 490 | 292 | 453 | 471 | **292** |

Woche 10 neu in Fassung 12 (bisher 260 / 286). Gefahren wurden rund 250 min: Die lange
Ausfahrt endete am 18.10. nach 86 min mit einem Platten, der Dienstag fiel aus.

**Der Dienstag trägt ab Woche 6 keine Steigerung mehr** (Fassung 10). Die Progression
kommt aus den anderen Tagen:

| Träger | Verlauf in den Belastungswochen | Beitrag |
|---|---|---|
| **Samstag** (Dauer) | 150 → 160 → 165 → 175 → 170 → 180 → 175 → 185 min | Hauptträger der Grundlage |
| **Samstag** (Höhenmeter) | Band steigt von 150–250 auf 500–600 Hm | eigene Progression, bei gleicher Dauer |
| **Donnerstag** | 63–65 → 70–75 (Phase 3) → 67–73 min (Phase 4) | Dauer in Phase 3, Intensitätsdauer in Phase 4 |
| **Mittwoch** | 40 → **60 min** in Woche 11–12 | dritter echter Grundlagentag in Phase 3 |
| **Dienstag** | **90 min, konstant** | Sockel, keine Progression |

**Z2-Summe pro Woche** ist die Kennzahl, die zählt — Zielgröße 300–400 min.

**Zugrundeliegende Reihen** (Index 0 = Woche 1):

```
TUE_MIN     [60, 70, 80, 45, 85, 90, 50, 90, 90, 50, 90, 90, 50, 90, 90, 50]   # ab W6 fest, nie über 90 planen
WED_MIN     [0, 40, 40, 30, 40, 40, 30, 40, 40, 30, 60, 60, 30, 40, 40, 30]
SAT_MIN     [120, 130, 140, 90, 150, 160, 100, 165, 175, 150, 170, 180, 105, 175, 185, 105]
SUN_MIN     [30, 30, 35, 25, 35, 40, 25, 40, 40, 25, 40, 40, 25, 40, 40, 25]
CORE_WORK   [25, 30, 35, 25, 30, 35, 30, 35, 40, 30, 40, 40, 30, 40, 40, 30]
CORE_ROUNDS [2, 2, 2, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2]
CORE_REST   [25, 25, 25, 25, 20, 20, 25, 20, 20, 25, 20, 20, 25, 20, 20, 25]
LEG_ROUNDS  [2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 3, 3, 2, 3, 3, 2]
SAT_HM_VON  [0, 0, 0, 0, 150, 200, 100, 250, 300, 150, 350, 400, 200, 450, 500, 250]
SAT_HM_BIS  SAT_HM_VON + 100 ab Woche 5
RECOVERY    Wochen 4, 7, 13, 16          # Woche 10 seit Fassung 12 entfernt
TEST_WEEKS  Wochen 4, 10, 16
```

`WED_MIN` ist ein **Mindestwert für den Tag**, aber die Wochensumme deckelt trotzdem.

`CORE_*` gilt für den **Sonntag**. Der Mittwoch fährt immer **2 Runden** mit derselben
Belastung und Pause. In Testwochen gilt die reduzierte Rumpfdosis auch ohne
Erholungswoche.

**Donnerstag je Phase:**

| Phase | Wochen | Inhalt | Ziel |
|---|---|---|---|
| 1 | 1–3 | 4–5 × 5 min Z3, 3 min Pause | Tempo, pulsfreundliche Intervalllänge |
| 1 | 4 | Schwellentest | FTP + LTHR |
| 2 | **5** | **5 min maximal** (VO2max-Referenz) + **4 × 4 min**, 4 min Pause | VO2max + Referenzwert |
| 2 | 6, 8, 9 | **5 × 4 min**, 4 min Pause (Woche 8 und 9: 240–250 W aus Arbeits-FTP 215 W) | VO2max |
| 2 | 7 | 4 × 3 min bei ~196 W | Erholungswoche, kein Z5 |
| 2 | 10 | Retest | FTP + LTHR |
| 3 | 11–12 | 70–75 min Z2, darin **3 × 3 min bei 250–260 W** (112–116 %), 3 min Pause | dritter Grundlagentag + Erhaltungsreiz VO2max |
| 3 | 13 | 55 min Z2 | Erholungswoche |
| 4 | 14–15 | 3 × 10–12 min bei **201–212 W** (90–95 %), 5 min Pause | Schwelle |
| 4 | 16 | Retest | FTP + LTHR |

Einfahren immer 15 min, Ausrollen 12 min. Die Wiederholungszahl in Phase 2 war **fest
bei 5** — die Progression lief über die Leistung.

**Alle Prozentangaben dieser Tabelle beziehen sich seit Fassung 12 auf die FTP 223 W.**
Phase 2 ist mit dem Retest abgeschlossen; weitere VO2max-Arbeit kommt nur noch als
Erhaltungsreiz in Phase 3.

**Erhaltungsreiz Phase 3 (Woche 11 und 12):** In die Z2-Einheit am Donnerstag werden
**3 × 3 min bei 250–260 W (112–116 % FTP) mit je 3 min lockerer Pause** eingebettet,
insgesamt 15 min. Grund: Phase 3 enthält sonst drei Wochen ohne jeden harten Reiz, und
die VO2max bildet sich von allen Größen am schnellsten zurück. In der Erholungswoche 13
entfällt der Reiz.

**Lage im Verlauf der Einheit:** nach mindestens 20 min Z2, nicht direkt nach dem
Einfahren, und mit mindestens 15 min lockerem Ausrollen danach. Der Rest der Einheit
bleibt Z2 nach Sprechtest.

**Die Wochensumme ändert sich dadurch nicht** — die 15 min liegen *innerhalb* der 70
bzw. 75 min.

**Warum am Donnerstag statt am Mittwoch:** Der Mittwoch ist eine Pendelfahrt mit Gepäck,
zu fester Uhrzeit, im Berufsverkehr, in Woche 11–12 im Dunkeln und in der Kälte. Der
Donnerstag ist die einzige freie Wochentagsfahrt.

**Warum 3 × 3 min und nicht 6 × 30 s:** Sauerstoffaufnahme braucht rund zwei Minuten bis
zum Vollausschlag. Drei Minuten liefern etwa eine Minute nutzbare Zeit nahe VO2max je
Wiederholung, in Summe rund 9 min harte Zeit pro Woche — etwa ein Drittel der
Phase-2-Dosis. Das reicht für den Erhalt.

**Verschiebt sich der Donnerstag** (Wetter, Abschnitt 4.11), wandert der
Erhaltungsreiz mit in die Einheit, in die der Donnerstag verlegt wird — bei Verlegung
auf den Samstag in die zweite Hälfte der Ausfahrt. Der Samstag ist dann kein sauberer
Z2-Tag mehr und **das Decoupling der Woche fällt als Kennzahl aus.**

**Samstag:** Basis Z2, Arbeitsbereich **Ø 135–150 W**. **Z3-Blöcke nur in den Wochen 6,
9 und 12** — jeweils die zweite Belastungswoche eines 2:1-Paars, und nicht in Phase 4.
Dann 2 × 12 min in der **zweiten Hälfte** der Fahrt mit 8 min lockerem Rollen
dazwischen, **178–196 W** (80–88 % der FTP 223 W; Woche 9 noch 172–189 W, Woche 6
165–181 W). Einfahren 15 min, Ausrollen 10 min.

**Kontrolle über die Atmung:** merklich vertieft, Sprechen nur noch in kurzen Sätzen.

### Ausführungsregeln Intervalle

1. **Rollender Start.** In der letzten Minute der Erholung das Tempo leicht anziehen.
2. **Bewertungsfenster ist Minute 2 bis 4** (Phase 2) bzw. Minute 2 bis 3 (Phase 3).
   Der Puls davor ist bedeutungslos und darf keine Reaktion auslösen.
3. **Atmung führt, Puls bestätigt.** Bei Widerspruch gewinnt die Atmung.
4. **Die letzte Wiederholung ist die härteste.** Ist die erste die schwerste, war der
   Start zu hart. Ziel: Leistungsabfall Wdh. 1 → letzte unter 5 %.
5. **Kadenz-Lock erkennen.** Fällt der Puls in der Erholung nicht binnen 60–90 s
   merklich ab oder klebt er nahe der Trittfrequenz, ab da nach Atmung fahren und die
   Aufzeichnung verwerfen.
6. **Pulsgurt bzw. Uhr korrekt sitzend**, Messquelle über die Einheit nicht wechseln.
7. **Nachsteuerregel für die Zielwatt (seit Fassung 11, Schwelle seit Fassung 12
   166 bpm).** Maßstab ist der Ø-Puls der letzten 60 s jeder Wiederholung gegen die
   LTHR 166 bpm:
   - **Erreichen die letzten zwei Wiederholungen die 166 bpm nicht**, obwohl das Band
     gehalten wurde → nächste Einheit **+5 W** auf beide Grenzen.
   - **Liegt der Puls schon ab Wdh. 2 darüber und ist die Atmung am Limit**, oder bricht
     die Leistung zur letzten Wiederholung um mehr als 5 % ein → **−5 W**.
   - Dazwischen bleibt das Band. Höchstens ein Schritt pro Woche, Erholungswochen
     zählen nicht.
   - Eine **gewollte schnellere Schlusswiederholung** („alles raus") ist erlaubt, fließt
     aber nicht in die Nachsteuerung ein.
   - **In Phase 3 (3 × 3 min)** gilt die Regel sinngemäß für die Wiederholungen 2 und 3.

---

## 2a. Schwellentest — Ablauf, Anlauf, Freigabe

Testtermine: **Do 10.09.** (W4), **Do 22.10.** (W10), **Do 03.12.** (W16).

### Ablauf

| Schritt | Dauer |
|---|---|
| Einfahren, darin 3 × 1 min zügig mit je 1 min Pause | 20 min |
| Locker rollen | 5 min |
| **Gleichmäßig maximal** | 20 min |
| Ausrollen | 10 min |

Gesamtdauer 55 min.

- **FTP** = Ø-Watt der 20 min × 0,95
- **LTHR** = Ø-Puls der 20 min
- **Die VO2max-Referenzleistung wird hier nicht erhoben.**

#### Warum der 5-Minuten-All-out entfällt

Das Originalprotokoll nach Coggan/Allen stellt einen 5-min-All-out mit 10 min Pause vor
den 20-min-Abschnitt, um die anaerobe Kapazität zu leeren. Für diesen Plan überwiegen
die Nachteile: Die anaerobe Kapazität ist bei Einsteigern klein, die Pause reicht bei
niedriger CTL nicht zur Erholung, und vor allem gilt die Pacing-Vorgabe aus dem
Testanlauf nur für frische Beine. Ein All-out davor würde den Test wieder blind pacen.

**Preis dieser Entscheidung:** Der Faktor 0,95 ist für das Originalprotokoll kalibriert;
ohne Vorermüdung fällt die errechnete FTP minimal höher aus. Systematisch und über alle
drei Tests gleich — für den Trendvergleich unkritisch.

**Verbindlich für alle drei Termine:** Der Ablauf ist am 10.09., 22.10. und 03.12.
**identisch** — überall ohne All-out.

### Der 5-Minuten-Wert (VO2max-Referenz)

Erhoben als **erste Wiederholung der ersten Intervalleinheit am Do 17.09.** (Woche 5),
nicht am Testtag. Seine Funktion war der Plausibilitätscheck der Intervallvorgabe.

**Gegenprobe:** Liegt der 5-min-Wert deutlich über 118 % der Test-FTP, war der Test zu
niedrig.

**Pacing:** die ersten drei Minuten bewusst konservativer als das Ziel. Auf die
Runden-Durchschnittsleistung schauen, nicht auf den Momentanwert.

**Strecke — seit Fassung 7: kein Gefälle im Maximalversuch.** Flach oder gleichmäßig
ansteigend, ohne abfallendes letztes Drittel. Lässt sich ein Gefälle nicht vermeiden,
rechtzeitig zwei Gänge hochschalten, bevor die Wattzahl fällt.

### Ergebnis des 5-min-Versuchs vom 17.09.2026

| Größe | Wert |
|---|---|
| Ø Leistung 5 min | **254 W** |
| Anteil der Test-FTP 192 W | **132 %** (gemessen an der FTP 223 W: 114 %) |
| W/kg (7-Tage-Schnitt 95,5 kg) | 2,66 |
| Ø HF letzte 60 s | 169,6 bpm |
| Max HF der Einheit | 171 bpm |
| Verlauf | Minute 0–3: 224 W · Minute 3–4,5: ~308 W · letzte 30 s: 252 W |

Die Gegenprobe hatte damals ausgelöst: Die FTP von 192 W war zu niedrig. **Der Retest
vom 22.10. hat das bestätigt** — gemessen an 223 W liegt der 5-min-Wert bei 114 % und
damit im erwarteten Bereich.

**Strecke:** 20 min ohne Ampel, Kreuzung, Abfahrt oder Gegenverkehr, flach oder
gleichmäßig ansteigend. Immer dieselbe Strecke, ähnliche Uhrzeit, gleiches Rad,
gleicher Reifendruck (2,5 bar) — sonst ist der Retest nicht vergleichbar.

**Festgelegte Ausnahme: Retest 03.12. mit Start 14:00 statt 16:21.** Sonnenuntergang ist
dann gegen 16:25, die Fahrt dauert 1:31 h. Strecke, Protokoll, Rad und Reifendruck
bleiben identisch; die Uhrzeit wird unter „Bedingungen" vermerkt. Begründung in 9c,
Details in `SCHWELLENTESTS.md`. **Der 22.10. startete tatsächlich um 16:50**, der
Testabschnitt lag gegen 17:15 bis 17:35, vor Sonnenuntergang.

### Anlauf zum 10.09.2026 (verbindlich, gefahren)

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

**Warum der Testtempo-Tag:** Zwei mal sechs Minuten im angestrebten Testtempo liefern
eine Wattzahl, auf die im Test gezielt werden kann. Ohne das wird blind gepaced, und
blind gepacete Tests fallen zu niedrig aus.

**Warum die Öffner am Vortag:** Nach ruhigen Tagen fühlt sich das System träge an. Ein
kurzer harter Reiz am Vortag stellt die Spritzigkeit her, ohne Ermüdung zu erzeugen.

### Anlauf zum 22.10.2026 (gefahren, neu in Fassung 12)

| Datum | Tag | Einheit |
|---|---|---|
| Mi 14.10. | W9 | Arbeitsweg direkt, 42 min, Ø HF 127 |
| Do 15.10. | W9 | **Ruhetag** (Qualitätstag auf Freitag verlegt) |
| Fr 16.10. | W9 | **Tempotest**: 15 min Einfahren, **2 × 6 min** mit **218 W** / **227 W**, HF letzte 2 min 155 / 160. Am selben Tag vorher Bikefitting mit Belastungsminuten auf der Rolle |
| Sa 17.10. | W10 | Rumpf voll, **kein Beinblock** |
| So 18.10. | W10 | lange Ausfahrt geplant 2:30 h Z2, 150–250 Hm — **nach 86 min wegen Platten beendet**, 182 Hm |
| Mo 19.10. | W10 | Ruhe |
| Di 20.10. | W10 | **ausgefallen** (zeitlich nicht möglich), nicht nachgeholt |
| Mi 21.10. | W10 | **55 min mit Öffnern** (265 / 252 / 230 W je ~1 min), Rest Ø 114 W |
| **Do 22.10.** | W10 | **Retest**, Pacing-Vorgabe 225 W |

**Ableitung der Pacing-Vorgabe:** Block 2 des Tempotests mit 227 W bei HF 160 in den
letzten 2 min, Selbsteinschätzung „20 min machbar, aber stark am Limit". Vorgabe 225 W
konstant; gefahren wurden 234,7 W.

**Abweichungen gegenüber dem ersten Anlauf:** Der Testtempo-Tag lag sechs statt sieben
Tage vor dem Test, die lange Ausfahrt am Sonntag statt Samstag, und durch den Platten
und den ausgefallenen Dienstag waren die vier Tage vor dem Test ruhiger als geplant.
Beides wirkt eher in Richtung frischer Beine.

**Derselbe Anlauf gilt sinngemäß für den Retest am 03.12.:** Woche davor kein voller
Qualitätstag, sondern 2 × 6 min Testtempo; Tag vor der langen Ausfahrt ohne Beinblock;
Dienstag kurz; Mittwoch mit Öffnern. Woche 16 ist zugleich Erholungswoche.

### Go/No-Go am Testmorgen

Alle vier Punkte müssen zutreffen:

1. **Ruhepuls** höchstens 5 bpm über dem Sieben-Tage-Schnitt — maßgeblich ist der
   abgeschlossene Wert des Vortags
2. **Kein Muskelkater** in den Oberschenkeln
3. Zwei Nächte hintereinander mindestens 7 Stunden Schlaf
4. Kein Infekt im Anflug, unter 30 °C, kein Sturm

**TSB wird bewusst nicht als Kriterium verwendet.**

### Verschiebungsregel

**Nach hinten, ohne Ersatzeinheit, ohne Tausch.**

| Fällt das Go/No-Go durch | |
|---|---|
| Testtag | Ruhetag oder maximal 40 min Z1. Die geplante Einheit entfällt **ersatzlos** |
| Folgetag (Fr) | Ruhetag |
| **Samstag** | **Test.** Er ersetzt die lange Ausfahrt der neuen Woche, kommt nicht dazu |
| Sonntag | Rumpf-Zirkel, kein Beinblock |

**Zweite Absage:** Test auf den Donnerstag der Folgewoche. Ein verschobener Testtermin
kostet fast nichts — ein unter schlechten Bedingungen gefahrener Test verzerrt die Zonen
für den gesamten Folgeblock.

### Was nach jedem Test festgehalten wird

| Feld | Quelle | Wohin |
|---|---|---|
| Ø-Watt der 20 min | Aktivität | Notiz + Testhistorie |
| **FTP** = Ø-Watt × 0,95 | Rechnung | intervals.icu Settings + App |
| **LTHR** = Ø-Puls der 20 min | Aktivität | intervals.icu Settings + App |
| Ø-Kadenz der 20 min | Aktivität | Notiz |
| Gewicht am Testtag | Waage | Wellness |
| Bedingungen | selbst | Temperatur, Wind, Strecke, Rad, Reifendruck, Startzeit |
| RPE der letzten 5 min | selbst | 1–10; unter 9 heißt: nicht ausbelastet |

### Einordnung der Testwerte

**Der Wert vom 10.09. war eine Untergrenze.** Fehlende Pacing-Erfahrung, ein TSB um −10
und ein Körper, der sich noch nie voll ausbelastet hatte, wirkten alle nach unten. Die
Gegenchecks (5-min-Wert 132 %, eFTP-Sprung auf 206 W) haben das am 17.09. bestätigt, und
der Plan hat mit der Arbeits-FTP (206, später 215 W) gegengesteuert.

**Der Wert vom 22.10. ist ein belastbarer Messwert.** Ausbelastet (Max HF 180),
gleichmäßig gepaced, nach vollständigem Testanlauf. Der Zuwachs von 192 auf 223 W
(+16 %) setzt sich aus echtem Formgewinn und der zu niedrigen ersten Messung zusammen;
gegenüber der zuletzt geschätzten Arbeits-FTP von 215 W beträgt er +4 %. **Für den
Vergleich zum 03.12. ist der 22.10. die saubere Basis.**

### Checkliste unmittelbar nach dem Test

1. FTP und LTHR in intervals.icu Settings → Ride eintragen
2. Power Zones und HR Zones auf **Coggan** stellen, Load Priority auf **Power**
3. FTP auf **manuell**
4. Dieselben Grenzwerte in die App und auf den Edge übernehmen
5. Zeile in der Testhistorie ausfüllen — hier und in `SCHWELLENTESTS.md`
6. Z2-Arbeitsbereich gegen das Decoupling der nächsten langen Ausfahrt prüfen
7. Am Folgetag locker oder frei

### Testhistorie

| Datum | Woche | Ø-Watt 20 min | FTP | LTHR | Ø-Kadenz | Gewicht | Bedingungen |
|---|---|---|---|---|---|---|---|
| **10.09.2026** | 4 | **202,6 W** | **192 W** | 152 erhoben / **163 gesetzt** | 86 rpm | 95,7 kg | 21,6 °C, teils bewölkt, Wind 2,5 km/h Ost, trocken, Start 16:21, Cube Nuroad, 2,5 bar. RPE 7–8, negativer Split +5,7 % |
| **22.10.2026** | 10 | **234,7 W** (NP 236) | **223 W** | **166** erhoben und gesetzt | 89 rpm | 91,8 kg | ca. 14 °C, meist bewölkt, Wind ~10 km/h, trocken, Start 16:50 (Testabschnitt ca. 17:15), Cube Nuroad, 2,5 bar. 5-min-Abschnitte 236 / 233 / 232 / 237 W, HF Ø 166, letzte 5 min 172, **Max 180**. Pacing-Vorgabe 225 W, um 10 W übertroffen. RPE nicht erfasst, Selbsteinschätzung vorab „stark am Limit" |
| 03.12.2026 | 16 | | | | | | Start 14:00, siehe 9c |

**Veränderung 10.09. → 22.10.:** +32 W im 20-min-Wert (+16 %), FTP 192 → 223 W, W/kg
2,01 → 2,43 (+21 %, Gewicht −3,9 kg).

Die ausführliche Fassung mit Pacing, Rundenverlauf und Schlussfolgerungen steht in
`SCHWELLENTESTS.md`. **Beide Tabellen sind identisch zu führen** — weicht eine ab, gilt
`SCHWELLENTESTS.md`.

### VO2max-Referenz (5-Minuten-Wert)

Getrennt geführt, weil der Wert nicht am Testtag erhoben wird.

| Datum | Woche | Ø-Watt 5 min | % der FTP | Bemerkung |
|---|---|---|---|---|
| **17.09.2026** | 5 | **254 W** | 132 % von 192 / **114 % von 223** | Ungleichmäßiges Pacing, Gefälle im Schlussteil — Untergrenze. Max HF 171 |
| 24.09.2026 | 6 | — (4 min: **268 W**) | (4 min: 120 % von 223) | Fünfte Wiederholung der 5 × 4 min, vorbelastet. Ø HF letzte 60 s 168 bpm, Max HF 173 |

### Laufende Kontrolle zwischen den Tests

Wöchentlich nach der Samstagsausfahrt:

| Größe | Wo | Was sie sagt |
|---|---|---|
| **Decoupling Pw:HR** | Aktivität Samstag | ≤ 5 % → Grundlage trägt diese Dauer und den Arbeitsbereich Ø 135–150 W |
| **Efficiency Factor** | Aktivität Sa (Di nur über Puls und Zeit auf der festen Strecke) | Trend über Wochen, nicht Einzelwert |
| **eFTP** | Power-Seite | Zwischenkontrolle |
| **Wochenumfang** | Analyse-Tab | gegen den Deckel aus Abschnitt 2 |
| **CTL / ATL / TSB** | Fitness-Seite | Auslöser für Erholungswochen; ab 22.10. auf FTP 223 W gerechnet |

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
| Erholungswochen 4, 7, 13, 16 | unterer Rand, 2 Runden | entfällt |
| Testwochen 4, 10, 16 | Tag vor der langen Ausfahrt der Testwoche: **kein Beinblock** | entfällt |

**Warum erst ab Woche 11:** In Phase 1 und 2 ist der Donnerstag der Qualitätstag. Eine
Beineinheit am Dienstagabend läge knapp 40 Stunden davor. In Phase 3 ist der Donnerstag
selbst eine Z2-Einheit, damit fällt der Konflikt weg. In Phase 4 kehrt er zurück, deshalb
dort nur Erhaltungsdosis.

**Warum Erhaltungsdosis kein Rückschritt ist:** Kraft zu erhalten braucht deutlich
weniger Reiz als Kraft aufzubauen.

#### Dosierung je Phase

| Phase | Wochen | Kniebeuge | Split Squat | Wadenheben | Runden |
|---|---|---|---|---|---|
| 1 | 1–3 | 8–10 Wdh. | 6 je Seite | 10 je Seite | 2 |
| 2 | 5, 6, 8, 9 | 10–12 Wdh. | 8 je Seite | 12 je Seite | 2–3 |
| 3 | 11–12 | 12–15 Wdh. | 8 je Seite | 12–15 je Seite | 3 |
| 4 | 14–15 | 8–10 **mit Zusatzgewicht** | 6–8 **mit Zusatzgewicht** | 12–15, Ferse erhöht | 3 |
| — | Erholungswochen | unterer Rand der laufenden Phase | | | 2 |

**Tempo durchgehend:** 3 s absenken, 1 s heben, keine Pause unten, kein Schwung.

#### Progressionsregel

**Die Progression ist von den Phasengrenzen entkoppelt.** Weitergerückt wird, sobald das
obere Ende der Wiederholungsspanne in allen Runden mit sauberer Form erreicht wurde, und
das an zwei aufeinanderfolgenden Sonntagen — **auch wenn die Phase das noch nicht
vorsieht.**

Reihenfolge der Steigerung:

1. mehr Wiederholungen innerhalb der Spanne
2. mehr Runden (2 → 3)
3. schwierigere Variante — Split Squat mit erhöhtem hinteren Fuß, Wadenheben mit
   erhöhter Ferse
4. Zusatzgewicht — Rucksack mit Büchern oder Wasserflaschen, später Kurzhanteln

**Nicht** über das Tempo steigern und **nicht** über mehr Übungen.

**Warum die Entkopplung:** Bei laufendem Kaloriendefizit ist die Reizhöhe der
entscheidende Faktor für den Muskelerhalt. Auf eine Phasengrenze zu warten verschenkt
Wochen.

#### Muskelkater-Regel

| Zustand am Sonntag | Beinblock |
|---|---|
| frei | volle Spanne |
| leichter, diffuser Muskelkater | **unteres Ende** der Wiederholungsspanne, volle Runden |
| ausgeprägter Muskelkater | **entfällt**, nur Rumpf-Zirkel |

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

**Liegestütz** — Auf Zehen oder mit erhöhten Händen, Körper gerade, Ellbogen nah am
Körper. Ca. 2 s absenken, 1 s hochdrücken, kein Schwung.
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

- **Haltezeit bei 40 s gedeckelt.** Gesteigert wird über eine zusätzliche Runde.
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

Eine lange Ausfahrt „auf Freitag vorziehen" verschiebt sie damit in die **Vorwoche**.
Ein Tausch Donnerstag ↔ Samstag verschiebt Umfang zwischen zwei Wochen. Beides ist
zulässig, muss aber beim Umfangsdeckel berücksichtigt werden.

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
Reihenfolge.

### 4.3 Samstag: keine Zeit für die lange Ausfahrt

| # | Option | Bewertung |
|---|---|---|
| **A1** | Kompletter Tagestausch mit Sonntag | **Beste Wahl.** Beide Tage bleiben in derselben Woche |
| **A2** | Samstag verkürzt fahren, 70–90 statt 140 min | Gut |
| **A3** | Auf Freitag vorziehen | **Verschiebt in die Vorwoche** (siehe 4.0). Nur in Phase 1 und 3 und nur, wenn die Vorwoche unter dem Deckel liegt |
| **A4** | Streichen, Mittwoch verlängern | **Schlechtester Ersatz.** Der **Dienstag** wird dafür **nicht** verlängert (Fassung 10) |

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

### 4.6 Beide Bürotage weg

- **Dienstag** als freie Fahrt in voller Länge, **Mittwoch** streichen.
- Oder: Dienstag voll, **Freitag** 40 min statt Mittwoch — nur bei leichtem Donnerstag.

Die Z2-Summe sinkt um rund 40 min. **Nicht kompensieren.**

### 4.7 Donnerstag außerplanmäßig im Büro

| # | Option | Bewertung |
|---|---|---|
| **E1** | Do = Pendel-Z2, Qualität auf Freitag, lange Ausfahrt auf Sonntag | **Beste Wahl.** Fr Qualität, Sa frei oder Rumpf, So lang. Beachten: der Samstag gehört bereits zur Folgewoche. So gefahren am 16.–18.10. |
| **E2** | Qualität auf Dienstag vorziehen, Do = Pendel-Z2 | **Nur wenn Dienstag Homeoffice ist** |
| **E3** | Woche zur Grundlagenwoche machen, Qualität streichen | Phase 1 und 3 unkritisch. Phase 2/4: einmal verkraftbar |
| **E4** | Intervalle auf dem Hinweg fahren | **Nicht empfohlen** |

### 4.8 Donnerstag fällt ganz aus

- **Phase 1:** streichen.
- **Phase 2 und 4:** auf Freitag, lange Ausfahrt der Folgewoche auf Sonntag.
- **Phase 3 (Woche 11–12):** Der Z2-Umfang wird gestrichen, **die 3 × 3 min nicht.**
  Sie sind der einzige harte Reiz der Woche und wandern in die zweite Hälfte der
  Samstagsausfahrt. In Woche 13 wird nichts nachgeholt.
- Alternativ die Intervalle in die Samstagsausfahrt integrieren. Dann ist der Samstag
  kein sauberer Z2-Tag mehr und **das Decoupling der Woche fällt als Kennzahl aus**.

### 4.9 Ganzes Wochenende weg

**Woche als Erholungswoche behandeln**, danach normal weitermachen. Nicht nachholen.

### 4.10 Wellness-Gate rot

Grundregel aus Abschnitt 1: Donnerstag wird 60 min Z2, Samstag ohne Blöcke.
**Zwei rote Tage hintereinander → gesamte Woche als Erholungswoche.**

### 4.11 Wetter und Tageslicht am Qualitätstag

**Seit Fassung 6 wird das ganze Jahr draußen gefahren.**

| Priorität | Donnerstag | Hinweis |
|---|---|---|
| **1** | **tagsüber fahren** (Gleitzeit, früherer Feierabend) | Regelfall, sobald es nach Feierabend dunkel ist |
| **2** | im Dunkeln auf bekannter Strecke | tagsüber bereits gefahren, befestigt, verkehrsarm |
| **3** | in den Samstag verlegen | **nur bei schlechtem Wetter** (Starkregen, Sturm, Glätte) |

Bei Priorität 3:

- Do ↔ Sa tauschen, **nur** wenn die lange Ausfahrt dann am Sonntag Platz hat.
- Sonst: Donnerstag zu Z2 machen, Intervalle in die zweite Hälfte der Samstagsausfahrt.
  **Das Decoupling der Woche fällt dann als Kennzahl aus.**

### 4.12 Urlaub, Reise oder Krankheit, ganze Woche

- **Rumpf, Beinblock und der Block aus Abschnitt 10 brauchen kein Equipment.**
- Radwoche komplett streichen.
- **Nach Krankheit:** mindestens so viele lockere Tage wie Krankheitstage, bevor wieder
  Intensität gefahren wird. Eine planmäßige Erholungswoche direkt nach einer
  krankheitsbedingten Pause kann entfallen, wenn die Pause selbst schon eine war (so
  entschieden für Woche 10, Fassung 12).

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

### Anpassungsbedarf

Was die App mitziehen muss, geordnet nach der Fassung, aus der die Anforderung stammt.

Aus Fassung 3 (30.08.2026):

1. **Erholungswochen als feste Liste** statt `week % 4 === 0` — seit Fassung 12
   `[4, 7, 13, 16]` (siehe Punkt 34).
2. **Alle Reihen auf die 16 Werte** aus Abschnitt 2 setzen, `LEG_ROUNDS` inklusive.
3. **Phasengrenzen neu:** 1–4, 5–10, 11–13, 14–16.
4. **Testwochen neu:** 4, 10, 16. `thursdayPlan()` entsprechend anpassen.
5. **Samstag-Blöcke in Woche 6, 9, 12** (feste Liste statt Formel).
6. **Erhaltungsreiz** an der **Donnerstagskarte** in Woche 11 und 12 anzeigen.
7. **Zweite Beineinheit** an der Dienstagskarte in Woche 11, 12, 14, 15.
8. **Umfangsdeckel** in der Analyse: Warnung, wenn die Wochensumme den Planwert um mehr
   als 10 % überschreitet.
9. **Muskelkater-Abfrage** vor dem Beinblock am Sonntag: drei Stufen, steuert die
   angezeigte Wiederholungsspanne.
10. **Testanlauf** aus Abschnitt 2a als Hinweis ab 10 Tagen vor dem Testtermin, inklusive
    Go/No-Go-Liste am Testmorgen.

Aus Fassung 4 (04.09.2026):

11. **Schwellentest-Ablauf im Timer:** All-out-Segment entfernen. Sequenz: 20 min
    Einfahren (mit 3 × 1 min zügig), 5 min locker, 20 min Test, 10 min Ausrollen;
    Gesamtdauer 55 min.
12. **Woche 5 als Variante, nicht als Sonderfall** in `plan.json`, mit gespeicherter
    Wahl (unentschieden, gewählt, abgewählt).
13. **Wochenwerte nicht eintragen, sondern rechnen** (`weekPlanMinutes`), Umfangsdeckel
    folgt daraus.
14. **Testhistorie:** Spalte „Ø-Kadenz" statt „Ø-Watt 5 min"; VO2max-Referenz als eigene
    Karte mit 118-%-Gegenprobe.
15. **Ablaufgleichheit prüfbar machen** — Kennung und Fassungsnummer des Testablaufs in
    jedem Eintrag der Testhistorie.
16. **RPE der letzten 5 min** als Feld im Testergebnis.
17. **Sprechtest-Puls gegen die Z2-Obergrenze** nur über die Erhebungen seit dem letzten
    Test mitteln.
18. **Kein RPE je Einheit.**
19. **Die Notiz gehört an den Wert**, nicht auf die Eingabekarte.
20. **Bedingungen des Tests anzeigen**, in beiden Testhistorien.

Aus Fassung 5 (09.09.2026):

21. **Woche 11 und 12 im Intervall-Timer** als Schrittliste in `plan.json`
    (`tage.do.kind: "steps"`): 10 min Einfahren, 25 min Z2, 3 × (3 min / 3 min Pause),
    dann 20 bzw. 25 min Z2.
22. **Erhaltungsreiz von der Mittwochs- auf die Donnerstagskarte.**
23. **Zonenanzeige im Timer:** die Blöcke tragen ihr Zielband statt eines Pulsbands.

Aus Fassung 6 (11.09.2026):

24. **Keine Anforderung an App oder `plan.json`.**

Aus Fassung 7 (17.09.2026):

25. ~~**Zweiter FTP-Wert `arbeits_ftp` in `plan.json`.**~~ **Aufgehoben in Fassung 12**
    (Punkt 34). Die Logik „fehlt `arbeits_ftp`, gilt `ftp`" sorgt dafür, dass das
    Entfernen des Felds genügt.
26. **Herkunft anzeigen.** An der Zielwattangabe muss ablesbar sein, gegen welchen Wert
    gerechnet wurde.
27. **Kennzahl „HF am Intervallende" an der LTHR**, nicht an der HFmax — seit Fassung 12
    ≥ 166 bpm.
28. **Z2-Warnungen der Analyse:** Zonenquelle auf Leistung, Pulsprüfung nur als
    Zweitkriterium, keine Warnung bei Decoupling unter 5 %. **An Di und Mi (Trekkingrad,
    keine Watt) bleibt die Pulsprüfung die einzige Quelle.**

Aus Fassung 8 (19.09.2026):

29. **Kadenzziel Z2 nach Rad trennen:** Cube 80–85 rpm, keine Warnung unter 85, solange
    die Leistung passt; Trekkingrad 85–90 rpm als Richtwert ohne Prüfung.
30. **Analyse der Radeinheiten nach Abschnitten.** Gilt für Fahrten mit Leistungsmesser
    (Cube, Do/Sa); Di/Mi auf dem Trekkingrad bleiben bei der Pulsprüfung
    (Z2 ≤ 137 bpm seit Fassung 12).
    - **Bezugswerte seit Fassung 12:** Z2 123–167 W und Arbeitsbereich Ø 135–150 W aus der
      **FTP 223 W**; Blockziel Samstag 178–196 W (80–88 %), Do-Reiz 250–260 W (112–116 %).
    - **Glätten:** Zonenzeiten auf dem 30-s-Gleitmittel. Stillstand (0 W **und** unter
      2 km/h) fällt aus allen Rechnungen heraus.
    - **Abschnitte:** erste 15 min Einfahren und letzte 10 min Ausrollen werden nicht
      bewertet. In Blockwochen sind Runden mit 10–14 min und Ø ≥ 170 W die Blöcke;
      fehlen sie, die zwei stärksten nicht überlappenden 12-min-Fenster der zweiten
      Fahrthälfte. Die 8 min nach jedem Block außer dem letzten sind Blockpause. Der Rest
      ist der Z2-Anteil.
    - **Bewertung:** Blöcke nur gegen ihr Zielband. Blockpause: Hinweis nur bei
      Ø > 167 W. Z2-Anteil: Zeit über 167 W (geglättet) wird gezählt, Ø-Leistung beim
      Treten gegen den Arbeitsbereich 135–150 W angezeigt.
    - **„Zu hart" für die Einheit** nur bei Decoupling Pw:HR des Z2-Anteils > 5 %; lässt es
      sich nicht rechnen, bei Ø-Leistung des Z2-Anteils > 150 W oder mehr als 10 % seiner
      Zeit über 167 W. **Decoupling ≤ 5 % heißt: keine Warnung.**
    - **Decoupling** nur über den Z2-Anteil ab Minute 15 bis zum Beginn des ersten Blocks
      (ohne Blöcke: bis zum Ausrollen), Hälften nach Bewegungszeit.
    - **Kadenz (nur Cube):** Z2-Anteil Ziel 80–85 rpm, Hinweis nur unter 80 rpm; Blöcke
      Ziel 85–90 rpm.
    - **Anzeige:** „Z2-Anteil: X min, Ø Y W beim Treten (Arbeitsbereich 135–150)" und
      „Geplante Blöcke: 2 × 12 min, Ø ___ W (Ziel 178–196)" getrennt.

Aus Fassung 11 (24.09.2026):

31. ~~**`arbeits_ftp` auf 215.**~~ Erledigt durch Fassung 12 (Punkt 34).
32. **Timer zeigt das Zielband, nicht das Zonenband.** Am 24.09. zeigte die App für die
    Intervalle das Z5-Band statt des Zielbands. Anzeige am Ring und auf der Karte:
    Zielband aus `plan.json`, darunter klein die Herkunft (Punkt 26). **Bleibt offen.**
33. **Nachsteuerung sichtbar machen.** Die Analyse des Donnerstags zeigt je
    Wiederholung Ø-Watt und Ø-Puls der letzten 60 s und gibt nach Regel 7 einen Hinweis
    „nächstes Mal +5 W / −5 W / Band halten". Schwelle seit Fassung 12: 166 bpm.

Aus Fassung 12 (22.10.2026):

34. **Werte nach dem Retest:** `ftp` 223, `lthr` 166, `arbeits_ftp` entfernen.
    Zielbänder: Do-Reiz Phase 3 250–260 W, Sa-Blöcke Woche 12 178–196 W, Phase 4
    201–212 W. Erholungswochen `[4, 7, 13, 16]`, Testwochen weiterhin `[4, 10, 16]`.
    Woche 10: `SAT_MIN` 150, Soll 310, Deckel 341; Rumpfdosis der Woche bleibt reduziert,
    Beinblock entfällt am Tag vor der langen Ausfahrt.
35. **Z2-Arbeitsbereich als eigenes Feld** (`z2_arbeitsbereich: [135, 150]`), getrennt
    von den Zonengrenzen. Karte „Samstag" zeigt „Ø 135–150 W (Z2 123–167)". Die App
    darf den Arbeitsbereich nicht aus der FTP errechnen — er ist eine Entscheidung,
    keine Formel.
36. **Testhistorie:** Zeile 22.10. eintragen (Abschnitt 2a), inklusive Max HF 180 und
    Pacing-Abschnitten.

**Nicht in die App:** Abschnitt 11 (Ernährung).

### Bewusst nicht übernommen

Die harte Pulsobergrenze 142 aus der Übergangsfassung.

### Der Plan liegt in `plan.json`, nicht im Code

Seit 23.08.2026 stehen alle Plandaten in `plan.json` neben `index.html`.

| In der JSON | Im Code geblieben |
|---|---|
| Wochenwerte je Woche, Donnerstag und Samstagsblöcke je Woche | Kalender- und Wochenrechnung, Phasenzuordnung |
| Pulszonen, Leistungszonen, Kadenzziele, Z2-Arbeitsbereich | Zonenberechnung aus LTHR und FTP |
| Übungen mit Schritten, Zielen, Bildpfaden; Beinblock-Dosierung je Phase | Wiederholungsziel aus Belastung ÷ Tempo, Zirkeldauer |
| Timer-Konstanten, Schwellentest-Ablauf | Sequenzbau der Timer |
| Freistehende Erklärtexte | Satzgerüste mit eingerechneten Zahlen |
| **Erholungswochen-Liste** | — |
| **Ablauf eines Tages als Schrittliste** | — |
| — | **Auswertungstoleranzen der Analyse** |

**Was ein Tag in der Datei tragen kann.** `tage.do.kind` ist `intervals` (drei Zahlen),
`z2` oder `test` (nur Dauer) — oder `steps`, dann steht der ganze Ablauf als Liste da,
mit den Schritttypen inklusive `ride`, `say` am Schritt und `art` am Tag.

**Der Sollwert eines solchen Tages richtet sich nach seinen `work`-Schritten.** Beim
Donnerstag der Phase 3 also Z5 als Zielzone und 9 min harte Zeit; Decoupling und
Sprechtest-Anteil entfallen an diesem Tag. Der saubere Z2-Tag der Woche bleibt der
Samstag.

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
| `interim-log` | Sprechtest-Puls und Notiz |

### Protokoll der Rumpfeinheiten

Der Rumpf-Timer schreibt jede Einheit selbst mit, gespeichert nach **jedem Satz**: Tag,
Trainingswoche, geplante Runden, Belastung, Pause, Anzahl Sätze, Zeit unter Spannung, ob
komplett beendet, letzte Übung mit Runde, und je Übung Sätze, gehaltene Sekunden und
Zahl der vorzeitigen Abbrüche. Beinblock-Einträge tragen `kind:'leg'`.

### PWA-Eigenheiten

- `display: standalone`, Statusleiste sichtbar.
- **Der Anzeigemodus steckt in der installierten Verknüpfung.** Sofortlösung:
  deinstallieren und neu hinzufügen.
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

| Feld | Wert | Stand 22.10.2026 |
|---|---|---|
| FTP | Ø-Watt der 20 min × 0,95, manuell | **223 W** (zuvor 192 W) |
| Threshold HR (LTHR) | Ø-Puls der 20 min | **166 bpm** (zuvor 163) |
| Max HR | im Retest gemessen | **180 bpm** — entspricht der bisherigen Annahme |
| Power Zones | Coggan | |
| HR Zones | Coggan, % LTHR | |
| Load Priority | Power | |

**Am Edge bzw. in Garmin Connect** dieselben Werte für FTP und Laktatschwelle eintragen,
damit Gerät und intervals.icu dieselben Zonen anzeigen.

Zonenänderungen werden rückwirkend auf die Historie angewandt, sofern beim Ändern
bestätigt.

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

**Lap-Marken setzen.** Am Garmin die Runden-Taste konsequent verwenden, oder die
Einheit als strukturiertes Workout fahren.

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

**Praktischer Nutzen:** Der Plan aus Abschnitt 2 lässt sich als `Event`-Reihe in den
intervals.icu-Kalender schreiben und geht von dort auf das Garmin-Gerät. Vorgabe ab
Woche 5 `target: POWER` in % FTP, z. B. `5x` / `4m 112-116%` / `4m z1`.

**Vor jedem Schreibvorgang bestätigen lassen.** `DELETE`-Aufrufe sind nicht rückholbar.

### Zur Anbindung im Chat

Der Zugriff im Chat läuft über einen intervals.icu-Konnektor („ICUvisor"). Die
Athleten-Einstellungen (FTP, LTHR) lassen sich darüber **nicht** ändern — sie werden von
Hand in intervals.icu gesetzt. Im Zweifel die Werkzeugliste des Konnektors zugrunde
legen.

---

## 7. Was sich aus welchen Daten auswerten lässt

### Radeinheiten

- **Dauer** gegen den Sollwert, Toleranz 15 %.
- **Wochensumme gegen den Deckel.** Überschreitung um mehr als 10 % ist eine Warnung.
- **Zonenverteilung:** auf Fahrten mit Leistungsmesser aus dem 30-s-geglätteten
  Leistungsstrom, **nach Abschnitten** bewertet (App-Anforderung 30); auf dem
  Trekkingrad aus dem Puls-Stream gegen die HF-Zonen aus der LTHR 166.
- **Z2-Tage ohne Leistungsmesser:** Warnung bei mehr als 15 % der Zeit in Z4/Z5, und
  wenn unter 40 % in Z2 und unter 75 % in Z1–Z2 liegen.
- **Samstag:** in den Blockwochen werden die Blöcke erkannt und gegen ihr Zielband
  geprüft — getrennt vom Z2-Anteil. Sonst gilt der Samstag als Z2-Tag mit
  Arbeitsbereich Ø 135–150 W.
- **„Zu hart" an Z2-Tagen mit Leistungsmesser** nur, wenn das Decoupling des Z2-Anteils
  über 5 % liegt (ohne Decoupling: Ø beim Treten über 150 W oder mehr als 10 % der Zeit
  über 167 W).
- **Donnerstag:** harte Zeit in der Watt-Zone gegen `Wiederholungen × Minuten`.
- **Pendelfahrten (Di, Mi):** Die Solldauer ist eine **Untergrenze**. Über 20 % der Zeit
  oberhalb HF-Z2 heißt, der Weg wurde unter Zeitdruck gefahren.
- **Ruhetag mit Fahrt:** als Zusatz markiert, nicht als Fehler.
- **Optionale Fahrten (Freitag, Sonntag):** nicht am Umfang gemessen. Über 25 % der Zeit
  oberhalb Z2 gilt als zu hart.

### Kennzahlen

| Kennzahl | Einheit | Zielwert | Aussage |
|---|---|---|---|
| Decoupling Pw:HR | Samstag, Z2-Anteil ab Minute 15 bis zum ersten Block | ≤ 5 % | Grundlage trägt diese Dauer und den Arbeitsbereich; einziges Kriterium für „zu hart" |
| Ø-Leistung beim Treten | Samstag, Z2-Anteil | 135–150 W | Arbeitsbereich getroffen |
| Efficiency Factor NP ÷ Ø-HF | Samstag | Trend steigend | aerobe Basis wächst |
| Leistungsabfall Wdh. 1 → letzte | Donnerstag | < 5 % | Pacing sauber |
| Erste Wdh. über Zielband | Donnerstag | Warnung ab > 5 % darüber | zu hart gestartet |
| HF am Intervallende | Donnerstag | **≥ 166 bpm** in den letzten 60 s, mindestens in den letzten zwei Wiederholungen | Reiz erreicht. Grundlage der Nachsteuerung (Regel 7) |
| Ø-Kadenz | Do und Sa (Cube) | **80–85 rpm in Z2**, 85–90 rpm in Schwellen- und Samstagsblöcken | Technik |
| Kadenzabfall im Intervall | Donnerstag | < 8 rpm | Ermüdung, Gang zu schwer |
| Zeit in Watt-Z2 | Woche | Trend Richtung 300 min | Grundlagendosis. **Nur Do und Sa liefern Watt**; Di und Mi über den Puls-Stream |
| Wochensumme gegen Deckel | Woche | ≤ Soll + 10 % | Überlastungsschutz |

### Krafteinheiten

**intervals.icu speichert bei Krafteinheiten nur Dauer und Puls.** Krafteinheiten werden
derzeit **nicht aufgezeichnet** — fehlende Einträge bedeuten nicht, dass die Einheit
ausgefallen ist. Vor jeder Bewertung nachfragen.

Zwei Auswertungswege, falls aufgezeichnet:

**1. Rundenschätzung aus der Dauer.** Der Zirkel ist deterministisch. Passt keine
Rundenzahl auf eine halbe Runde genau, wird nichts behauptet.

**2. Das App-eigene Protokoll** (genauer, hat Vorrang).

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

Merkposten, ohne Festlegung:

- Ergebnis der drei Schwellentests und die Entwicklung von FTP, LTHR und Gewicht.
  **Vergleichsbasis für den 03.12. ist der 22.10.** — der 10.09. war eine Untergrenze
- Lage der Qualitätseinheiten im Tageslicht von Dezember bis Februar — draußen, ohne
  Rolle (Fassung 6)
- Zieltermin und Zielereignis
- Höhenmeter als eigenständige Progression
- Lange Ausfahrten jenseits von drei Stunden
- **Der Dienstag ist eine feste Größe** (90 min, Fassung 10)
- **Zweiter Qualitätstag pro Woche.** Die CTL liegt Mitte Oktober um 30 — die Frage ist
  für den Folgeplan neu zu stellen (siehe 9b)
- **Z2-Arbeitsbereich** (Fassung 12): Nach drei bis vier langen Fahrten mit Decoupling
  prüfen, ob 135–150 W trägt oder angepasst wird

---

## 9. Änderungen gegenüber Fassung 2

| # | Änderung | Begründung |
|---|---|---|
| 1 | **2:1 statt 3:1 ab Woche 5** | TSB −26 bei CTL 10 in Woche 3 |
| 2 | **Wochenumfang als Obergrenze** (Soll + 10 %) | Ist-Umfang lag 10–35 % über Plan |
| 3 | **Ramp-Rate-Regel ersetzt** | Bei CTL unter 20 nicht aussagekräftig |
| 4 | **Erholungssteuerung zweistufig** | TSB als Auslöser erst ab CTL 20 |
| 5 | **Verbindlicher Testanlauf** | Ein blind gepacter erster Test fällt zu niedrig aus |
| 6 | **Go/No-Go-Liste statt TSB-Grenzwert** | Ein TSB-Kriterium wäre bei dieser CTL dauerhaft blockierend |
| 7 | **Verschiebungsregel korrigiert:** nach hinten, ohne Ersatz, ohne Tausch | Die alte Regel war bei einer Sa–Fr-Woche unmöglich |
| 8 | **Abschnitt 4.0 Wochengrenze** neu | Derselbe Denkfehler steckte in 4.3, 4.7 und 4.11 |
| 9 | **Phasen neu geschnitten:** 1–4, 5–10, 11–13, 14–16 | Folge des 2:1-Rhythmus |
| 10 | **Samstagsblöcke in Woche 6, 9, 12** | Jeweils zweite Belastungswoche eines Paars |
| 11 | **Erhaltungsreiz in Phase 3** | Drei Wochen ohne harten Reiz kosten VO2max (seit Fassung 5 als 3 × 3 min am Donnerstag) |
| 12 | **Zweite Beineinheit ab Woche 11** | Erst in Phase 3 fällt der Konflikt mit dem Qualitätstag weg |
| 13 | **Progression des Beinblocks entkoppelt** | Bei laufendem Defizit zählt die Reizhöhe |
| 14 | **Muskelkater-Regel** | Rückmeldung nach den ersten Samstagsausfahrten |
| 15 | **Bikefit und Knie-Begründungen entfernt** | Beschwerden waren einmalig und muskulär |
| 16 | **Abschnitt 11 Ernährung** neu | Zieldaten festhalten |
| 17 | **Abschnitt 8 auf Merkposten reduziert** | Nach Woche 16 wird ein neuer Plan geschrieben |
| 18 | **Ist-Stand-Abschnitt** | Grundlage der Änderungen nachvollziehbar dokumentiert |
| 19 | **Sensorik-Abschnitt aktualisiert** | Powermeter früher als geplant |
| 20 | **Drift-Einschränkung dokumentiert** | D3 statistisch dünn |

---

## 9a. Änderungen gegenüber Fassung 3

| # | Änderung | Begründung |
|---|---|---|
| 1 | **5-min-All-out aus dem Schwellentest gestrichen**, Pause davor 10 → 5 min | Kleine anaerobe Kapazität, unzureichende Erholung in der Pause, Pacing-Vorgabe nur für frische Beine gültig |
| 2 | **VO2max-Referenz auf Do 17.09. verlegt** | Kostet keinen zusätzlichen Tag; frisch aussagekräftiger |
| 3 | **Variante „Samstag 12.09." verworfen** | Zu nah am Test, zerstört die erste saubere Decoupling-Messung |
| 4 | **Woche 5 Donnerstag: 5 min max + 4 × 4 min** | Folge aus 2 |
| 5 | **Testdauer 65 → 55 min** | Rechnerische Folge |
| 6 | **Testhistorie getrennt** | Die beiden Werte entstehen an verschiedenen Tagen |
| 7 | **Ablaufgleichheit über alle drei Termine festgeschrieben** | Vergleichbarkeit |

---

## 9b. Änderungen gegenüber Fassung 4

**Anlass:** Prüfung der Kritik, reines Zone-2-Training bringe Anfängern wenig. Sie traf
den Plan als Ganzes nicht, aber Phase 3: Woche 11 und 13 waren faktisch reine Z2-Wochen.

| # | Änderung | Begründung |
|---|---|---|
| 1 | **Erhaltungsreiz Phase 3: 6 × 30 s → 3 × 3 min** | 30-s-Antritte erreichen VO2max nie |
| 2 | **Verlegt vom Mittwoch auf den Donnerstag** | Der Mittwoch ist Pendelfahrt mit Gepäck im Berufsverkehr |
| 3 | **Mittwoch Woche 11–12 reines Z2, 60 min** | Umfang bleibt, Reiz geht |
| 4 | **Dosis 9 min harte Zeit pro Woche** | Etwa ein Drittel der Phase-2-Dosis, genug für den Erhalt |
| 5 | **Abschnitt 4.8 ergänzt** | Der Donnerstag trägt in Phase 3 den einzigen harten Reiz |
| 6 | **Wochensummen unverändert** | Die 15 min liegen innerhalb der Einheit |

---

## 9c. Änderungen gegenüber Fassung 5

**Anlass:** Frage, warum viele im Winter auf die Rolle wechseln. Die üblichen Gründe
treffen hier kaum zu; die Rolle wäre ein Motivationsrisiko.

| # | Änderung | Begründung |
|---|---|---|
| 1 | **Ganzjährig draußen, keine Rolle** | Siehe Anlass |
| 2 | **Abschnitt 4.11 neu geordnet** | Die alte Regel hätte das Decoupling über Phase 3 und 4 ausgeschaltet |
| 3 | **Dunkelheit kein Verlegungsgrund** | Folge aus 2 |
| 4 | **Retest 03.12.: Start 14:00** | Sonnenuntergang gegen 16:25 |
| 5 | **Merkposten Abschnitt 8 angepasst** | Draußentraining ab Dezember ist möglich |

---

## 9d. Änderungen gegenüber Fassung 6

**Anlass:** 5-min-Wert 254 W (132 % der Test-FTP), eFTP 206 W, 4 × 4 min ohne
Leistungsabfall.

| # | Änderung | Begründung |
|---|---|---|
| 1 | **Arbeits-FTP 206 W eingeführt** | Zielwatt auf der wahren Leistungsfähigkeit |
| 2 | **Kein vorgezogener Retest** | Kostet einen Testanlauf, liefert nur die bereits ablesbare Zahl |
| 3 | **Test-FTP 192 W bleibt in intervals.icu** | Vergleichbarkeit der Tests |
| 4 | **Zielwatt neu** | Bezugswert wechselt |
| 5 | **Z2 unverändert** 106–144 W | Z2 an LT1 — **aufgehoben in Fassung 12** |
| 6 | **„HF am Intervallende" an der LTHR** | HFmax unbekannt |
| 7 | **Streckenregel für Maximalversuche** | Gefälle verfälscht den Wert |
| 8 | **Ruhepuls-Regel präzisiert** | Garmin liefert verzögert |
| 9 | **Kadenz-Gang-Konflikt dokumentiert** | 85–90 rpm in Gang 8 ergaben damals Z3 |
| 10 | **Trekkingrad an Di und Mi vermerkt** | Fehlende Watt sind Geräteeigenschaft |
| 11 | **Testhistorie ausgefüllt** | Beide Dokumente identisch führen |
| 12 | **LTHR-Widerspruch aufgelöst:** 152 erhoben, 163 gesetzt | Test nicht ausbelastet |

---

## 9e. Änderungen gegenüber Fassung 7

**Anlass:** Gang-Test vom 19.09.: Gang 7 bei 89 rpm nur Ø 107 W.

| # | Änderung | Begründung |
|---|---|---|
| 1 | **Zielkadenz Z2 auf dem Cube 80–85 rpm** | Beide Ziele zugleich im Flachen nicht erreichbar, die Leistung hat Vorrang |
| 2 | **Gang 8 bei 80–82 rpm bleibt Arbeitspunkt** | Decoupling −0,9 % und −1,2 % |
| 3 | **Kadenzziel nach Rad getrennt** | Auf dem Trekkingrad keine Wattvorgabe |
| 4 | **Kennzahl Ø-Kadenz angepasst** | Sonst Fehlmeldungen |
| 5 | **Analyse nach Abschnitten** | Blöcke und Geländespitzen liefen in dieselbe Zählung |

---

## 9f. Änderungen gegenüber Fassung 8

**Anlass:** Der Diagonalgang im Koordinationsblock bot keinerlei Herausforderung.

| # | Änderung | Begründung |
|---|---|---|
| 1 | **Einbeinige Standwaage („Airplane")** statt Diagonalgang | Dynamische einbeinige Kontrolle fehlte vollständig |
| 2 | **Kurzanleitung und Abbruchkriterium** | Die Ausführung entscheidet über den Nutzen |
| 3 | **Progressionsregel um eine Stufe ergänzt** | Steigerungsweg für die dynamische Übung |

Offen: 90/90-Wechsel, Ausfallschritt mit Rotation und Bird Dog — Rückmeldungen liegen
vor, bewusst noch nicht geändert.

---

## 9g. Änderungen gegenüber Fassung 9

**Anlass:** Die lange Pendelfahrt am Dienstag lässt sich aus Zeitgründen nicht weiter
verlängern (22.09.: 96 min Fahrzeit).

| # | Änderung | Begründung |
|---|---|---|
| 1 | **Dienstag fest 90 min, Toleranz 85–100 min** | Die verfügbare Zeit ist die Grenze |
| 2 | **Keine Verlängerung zum Ausgleich** | Die Zeit ist nicht da |
| 3 | **Bei langsamerer Fahrt Strecke kürzen** | Ankunftspuffer bleibt Teil des Trainings |
| 4 | **Progressionsträger ausgewiesen** | Steigerung ohne Dienstag vollständig |
| 5 | **Merkposten in Abschnitt 8** | Folgeplan ohne Dienstagswachstum |

---

## 9h. Änderungen gegenüber Fassung 10

**Anlass:** Intervalle 17.09. und 24.09.: Pulskriterium bis 239 W zweimal verfehlt,
268 W über 4 min nach vier Wiederholungen.

| # | Änderung | Begründung |
|---|---|---|
| 1 | **Do-Intervalle 240–250 W** ab Woche 8 | Dort wird das Pulskriterium rechnerisch erreicht |
| 2 | **Arbeits-FTP 206 → 215 W** | Zwischen den langen und kurzen Anhaltspunkten |
| 3 | **Sa-Blöcke 172–189 W, Phase-4-Schwelle 194–204 W** | Bezugswert wechselt |
| 4 | **Nachsteuerregel in 5-W-Schritten** | Pulskriterium steuert direkt |
| 5 | **Woche 7 fest bei ~196 W** | Erholungswoche soll nichts kitzeln |
| 6 | **Höchster Puls 173 bpm dokumentiert** | Keine HFmax |
| 7 | **App-Anforderungen 31–33** | Neue Zielwerte, Anzeigefehler, Nachsteuer-Hinweis |

---

## 9i. Änderungen gegenüber Fassung 11

### Anlass

Der Retest am Do 22.10.2026 und die Wochen davor.

| Größe | Wert |
|---|---|
| Ø 20 min | **234,7 W**, NP 236 W |
| 5-min-Abschnitte | 236 / 233 / 232 / 237 W |
| FTP (× 0,95) | **223 W** |
| Ø HF 20 min | **166 bpm**, letzte 5 min 172, Max **180** |
| Ø-Kadenz | 89 rpm |
| Gewicht | 91,8 kg → 2,43 W/kg |
| Pacing-Vorgabe | 225 W aus dem Tempotest (227 W bei HF 160) |

Dazu zwei Entscheidungen aus den Wochen 9 und 10: Nach einer Erkältung in Woche 8 entfiel
die Erholungswoche 10, und der Sportler hielt die feste Z2-Obergrenze von 144 W bei einer
eFTP um 205 und einer Arbeits-FTP von 215 W für zu niedrig — Z2 sollte sich nach dem
Retest aus der neuen FTP ergeben.

### Die Änderung

| # | Änderung | Begründung |
|---|---|---|
| 1 | **FTP 223 W**, eingetragen in intervals.icu, App und Edge | Ausbelasteter, gleichmäßig gepacter Test nach vollständigem Anlauf |
| 2 | **Arbeits-FTP aufgehoben** | Der Testwert ist belastbar; zwei FTP-Werte waren eine Notlösung für einen zu niedrigen ersten Test. Die Arbeits-FTP 215 W lag 8 W unter dem Testwert — sie war vorsichtig, nicht überzogen |
| 3 | **LTHR 166 bpm**, erhoben = gesetzt | Ø-Puls der 20 min, gleiche Methode wie Abschnitt 2a. Diesmal ausbelastet, daher keine Abweichung nötig. intervals.icu-Methode (98 %) ergäbe 163 — bewusst nicht verwendet, damit die Testreihe vergleichbar bleibt |
| 4 | **Zielwatt neu:** Phase-3-Reiz 250–260 W, Sa-Blöcke 178–196 W, Schwelle 201–212 W | Prozentsätze unverändert, Bezugswert jetzt die FTP 223 W |
| 5 | **Z2 folgt der FTP:** Coggan-Z2 123–167 W, Arbeitsbereich lange Fahrt **Ø 135–150 W** | Die feste Obergrenze 144 W stammte aus einer Zeit mit belegt zu niedriger FTP. Der Arbeitsbereich bleibt unter der Coggan-Obergrenze, weil Z2 oben über LT1 liegen kann; gesteuert wird über den Schnitt, kontrolliert über das Decoupling |
| 6 | **Pulskriterium der Intervalle ≥ 166 bpm** | Folge aus 3 |
| 7 | **Woche 10 keine Erholungswoche**, Erholungswochen 4, 7, 13, 16 | Woche 8 war krankheitsbedingt faktisch Pause; eine Erholungswoche direkt nach der Pause wäre zu früh gekommen. Absicherung über TSB-Regel und Wellness-Gate in Woche 11 und 12 |
| 8 | **Woche 10 Soll 310 min, Deckel 341**, lange Ausfahrt 150 min | Folge aus 7, mit dem Testanlauf vereinbar |
| 9 | **Anlauf zum 22.10. dokumentiert** (Tempotest Fr 16.10., lange Fahrt So 18.10.) | Nachvollziehbarkeit, Vorlage für den 03.12. |
| 10 | **Max HF 180 als Messwert**, Feld bleibt 180 | Im Retest erreicht |
| 11 | **Testhistorie, VO2max-Tabelle, Settings, Analyse-Bezugswerte nachgeführt** | Konsistenz |
| 12 | **App-Anforderungen 34–36** | Neue Werte, Arbeitsbereich als eigenes Feld, Testhistorie |
| 13 | **Abschnitt 4.12 um Krankheit ergänzt**, Abschnitt 4.7 E1 mit Beispiel | Der Fall ist eingetreten und war nicht geregelt |

### Bewusst **nicht** geändert

- **Erholungswoche 13 und Retest 03.12.** samt Protokoll, Strecke, Rad, 2,5 bar.
- **Wochenstruktur, Umfänge ab Woche 11, Dienstag fest bei 90 min.**
- **Kadenzziel Z2 auf dem Cube 80–85 rpm** — bleibt sinnvoll, weil 85–90 rpm in Gang 8
  über dem Arbeitsbereich liegen.
- **Sprechtest als oberste Instanz für Z2**, „Atmung sticht die Zahl" bei Intervallen.
- **Pulsbänder für die Pendeltage** (128–135 bpm) — belegt und weiter in HF-Z2.
- **Die Nachsteuerregel** — nur ihre Schwelle wechselt auf 166 bpm.

---

## 10. Beweglichkeit, Koordination und Knochenreiz

Eigenständiger, radunabhängiger Block. Beweglichkeit und Koordination verlieren mit
zunehmendem Alter unabhängig von der Ausdauerentwicklung an Substanz.

**Bewusst getrennt vom Radplan gehalten:** geringe mechanische Belastung, kaum
Interferenz mit Kraft- oder Ausdauererholung. **Nicht** Teil der Opferreihenfolge aus
Abschnitt 4.

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
| 3 | Einbeinige Standwaage („Airplane"), betont langsam | 5 Wdh. je Seite | einbeinige Kontrolle, Hüfte, Propriozeption |
| 4 | Tandemstand auf instabiler Unterlage, ggf. Ball werfen/fangen | 2 × 30 s | Gleichgewicht unter Zusatzreiz |

**Einbeinige Standwaage („Airplane") — Ausführung.** Auf einem Bein stehen, Standknie
minimal gebeugt. Oberkörper nach vorn kippen und gleichzeitig das freie Bein nach hinten
strecken, bis Rumpf und Bein eine waagerechte Linie bilden. **Die Hüfte bleibt
geschlossen** — das Becken darf nicht zur freien Seite aufdrehen. Ca. 5 s absenken, kurz
halten, ca. 5 s aufrichten.

*Steigerung:* Arme seitlich ausstrecken → Arme über Kopf → Augen schließen.
*Abbruch:* Sobald das Becken aufdreht oder der Fuß absetzt, ist der Satz zu Ende.

**Warum keine Step-downs von der Treppenstufe:** exzentrische Beinarbeit alle zwei Tage
interferiert mit dem Beinblock am Sonntag. Der Block soll keine Erholung kosten.

### 2–3 × pro Woche — Knochenreiz (unter 1 min)

**20–30 beidbeinige Sprünge**, zügig, weich landen. An den Mobility-Flow gehängt.

**Warum:** Radfahren ist nicht gewichtstragend und leistet für die Knochendichte nichts.
Bei laufendem Kaloriendefizit ist das der einzige Reiz im Programm, den das Rad
prinzipiell nicht liefern kann.

**Ausdrücklich keine eigene Einheit.** Zählt in der Wochenrechnung nicht mit.

Steigerung erst, wenn 30 Sprünge ohne Ermüdung und mit weicher Landung gelingen: dann
einbeinig, wenige Wiederholungen je Seite.

### Platzierung in der Woche

- **Mobility-Flow:** an jedem Tag möglich, auch am Ruhetag Montag.
- **Gleichgewicht und Koordination:** alle zwei Tage, z. B. Mo/Mi/Fr/So.
- **Knochenreiz:** an den Mobility-Flow gehängt, nicht am Tag vor dem Qualitätstag.

### Progressionsregel

1. Einbeinstand mit geschlossenen Augen > 30 s sauber je Seite → instabile Unterlage
2. Tandemstand auf instabiler Unterlage stabil → zusätzlich Augen schließen
3. Standwaage 5 Wdh. je Seite ohne Absetzen und ohne Aufdrehen des Beckens → Arme
   seitlich, danach Arme über Kopf, danach Augen schließen

### Abgrenzung

Kein Eintrag im App-Protokoll und keine Auswertung über intervals.icu vorgesehen.

---

## 11. Ernährung — Zieldaten

**Referenzabschnitt, keine Steuerung durch den Plan.** Die Umsetzung läuft unabhängig
und ist in `ERNAEHRUNGSPLAN.md` beschrieben. Bewusst **nicht** in `plan.json`.

### Zielwerte

| Größe | Wert |
|---|---|
| Ausgangsgewicht | 102,2 kg (01.07.2026) |
| Erste belastbare Messung | 97,6 kg (17.08.2026) |
| Stand 17.09.2026 (Sieben-Tage-Schnitt) | 95,5 kg |
| Testtag 22.10.2026 | 91,8 kg |
| Zielgewicht Woche 16 (04.12.2026) | 87 kg |
| Zielkorridor Abnahmerate | 500–650 g/Woche |
| Protein | 1,6–2,2 g/kg |
| Verpflegung auf dem Rad | ab 90 min Fahrzeit, 40–60 g Kohlenhydrate/h |

### Hinweise

- **Der Wert 102,2 kg** stammt vermutlich aus einer einzigen Eingabe. Für jede
  Verlaufsrechnung ist der 17.08. der erste belastbare Punkt.
- **Nur der Wochentrend ist lesbar.** Gleitendes Sieben-Tage-Mittel verwenden.
- **87 kg sind das optimistische Ende.** Realistisch liegt das Ergebnis bei 89–91 kg.
- **Gewicht am Testtag dokumentieren** — sonst ist W/kg über die drei Tests nicht
  vergleichbar.
- **Lange Ausfahrten ab 150 min** brauchen Verpflegung; ohne sie verzerrt der
  Energiemangel im letzten Drittel die Driftanalyse.
