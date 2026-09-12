/* Puls- und Leistungszonen.

   Bis zur Testwoche gelten die Uebergangsbaender aus plan.json, danach Coggan
   aus der LTHR - aber nur, wenn der Test tatsaechlich gelaufen ist. Ohne LTHR
   laufen die Uebergangsbaender weiter, sonst rechnete die App mit Zonen, die
   es nicht gibt.

   thresholds ist immer {ftp, lthr, hrmax} mit null fuer "noch nicht gemessen". */

export const NO_THRESHOLDS = { ftp: null, lthr: null, hrmax: null };

/* Oben offen. Derselbe Wert wie in plan.js, wo die Uebergangsbaender gebaut
   werden - bandRange erkennt daran, dass "ueber x" statt "x-y" dasteht. */
const OPEN_TOP = 999;

/* Wie lange gemittelt wird, bevor Wattwerte in Baender fallen.

   Roher Leistungsstrom ist kein Intensitaetsmass. Auf der Strasse springt er
   zwischen 0 W im Rollen und 400 W an jeder Bodenwelle; eine gleichmaessig
   gefahrene Grundlagenausfahrt mit 139 W Ø verteilt sich sample-fuer-sample
   ueber alle fuenf Zonen. Der Puls glaettet sich von selbst, weil der
   Kreislauf traege ist - die Leistung tut es nicht, und deshalb muss die
   Auswertung es tun.

   Dreissig Sekunden, weil das die Zeitkonstante ist, mit der Coggan selbst
   rechnet (die normalisierte Leistung mittelt ueber genau dieses Fenster).
   Zentriert und nicht nachlaufend: ein nachlaufendes Mittel verschiebt die
   Verteilung um eine halbe Fensterlaenge, und fuer ein Histogramm ist die
   Verschiebung ein Fehler ohne Gegenwert. */
export const WATT_FENSTER_SEK = 30;

/* Unter diesem Wert wird nicht getreten, sondern gerollt.

   Genau null und nicht "wenig": ohne Drehmoment keine Leistung, das ist
   Freilauf. Soft pedalling mit 30 W ist dagegen Treten und gehoert in Z1.

   Rollzeit steht nicht in Z1, sondern neben der Verteilung. Sie in Z1 zu
   zaehlen liest sich harmlos, verschiebt aber genau die Kennzahl, an der die
   Warnung "zu locker" haengt: eine Ausfahrt mit langen Abfahrten waere nach
   Watt zu einem Drittel "unter Z2", ohne dass irgendwo zu locker gefahren
   wurde. Die Anteile gelten deshalb auf die getretene Zeit. */
export const ROLLEN_WATT = 1;

/* ---- Woher ein Schwellenwert kommt ----

   Die drei Zahlen entstehen auf zwei Wegen, und die App wusste bis zum
   10.09.2026 nicht, welcher es war. Die Zonenkarte behauptete deshalb "aus
   Test übernommen", sobald ueberhaupt eine LTHR dastand - auch bei einer, die
   jemand von Hand eingetippt hatte. Umgekehrt nannte der Hinweis eine
   getippte Zahl "die gemessene LTHR". Zwei Saetze, die dasselbe Feld
   verschieden erklaeren, und beide koennen falsch sein.

   Der Unterschied ist keiner der Anzeige. Ein Messwert ist an einem Tag unter
   einem Protokoll entstanden und ist mit dem naechsten Test vergleichbar; eine
   getippte Zahl ist eine Annahme, eine Korrektur oder ein Wert von woanders.
   Beide gelten gleich - gerechnet wird mit dem, was zuletzt gesetzt wurde -,
   aber wer die Baender einordnen will, muss sehen, was er vor sich hat.

   Die Herkunft haengt an jedem Wert einzeln, nicht am Satz: HFmax misst kein
   Schwellentest, die Zahl ist also praktisch immer von Hand, waehrend FTP und
   LTHR daneben gemessen sein koennen.

     { art: 'test', tag: '2026-09-10' }         im Test dieses Tages gemessen
     { art: 'hand', seit: '2026-09-12T18:04' }  von Hand eingetragen, mit
                                                Zeitpunkt der Eingabe
     null / fehlt                               nicht gesetzt oder nicht
                                                vermerkt

   Nicht vermerkt heisst nicht vermerkt: Schwellenwerte, die vor dieser
   Aenderung gespeichert wurden, tragen keine Herkunft, und die Anzeige rate
   nicht - sie schweigt darueber, bis der Wert das naechste Mal gesetzt wird.

   ---- Wer gewinnt, wenn beide Wege denselben Wert setzen ----

   Der zuletzt gesetzte, und dafuer braucht die Hand einen Zeitpunkt. Bis zum
   12.09.2026 trug sie keinen, und das reichte genau solange, wie ein Test nur
   einmal gespeichert wird.

   Seit ein gespeicherter Test wieder aufgemacht und berichtigt werden kann,
   reicht es nicht mehr: der Schwellentest vom 10.09.2026 ergab als Ø-Puls der
   zwanzig Minuten 152 bpm, und daraus Coggan-Baender, deren Z2 bei 126 bpm
   endet - eine Grundlagenfahrt mit 132 bpm liegt darin in Z3. Die Schwellen-HF
   gehoert dort nicht hin; sie wurde am 12.09. von Hand auf 163 gesetzt. Ein
   Tippfehler im Testeintrag, zwei Tage spaeter berichtigt, haette die 152
   wieder ueber die 163 gelegt - still, und mit ihr den Fehlalarm.

   Die Regel lautet deshalb: ein Test setzt einen Wert nur, wenn nach seinem
   Testtag keine Eingabe von Hand steht. Verglichen wird die Eingabe mit dem
   Tag des Tests und nicht mit dem Zeitpunkt des Speicherns - der Testtag ist
   das Datum, an dem gemessen wurde, und ein Nachtrag drei Wochen spaeter
   macht die Messung nicht neuer. Ein spaeterer Test gewinnt dagegen immer:
   seine Messung liegt nach der Eingabe.

   ISO-Zeichenketten vergleichen sich dabei wie Zeitpunkte, und ein Zeitstempel
   ist laenger als der Tag, an dem er liegt - '2026-09-10T18:04' > '2026-09-10'
   ist wahr. Eine Eingabe am Testtag selbst gewinnt damit gegen den Test, und
   das ist richtig: gefahren wurde an diesem Tag vorher. */

export const SCHWELLEN_FELDER = ['ftp', 'lthr', 'hrmax'];

export function quelleVon(th, feld){
  const q = th && th.quellen && th.quellen[feld];
  return q && q.art ? q : null;
}

/* Steht fuer dieses Feld eine Eingabe von Hand, die nach dem Testtag liegt?

   Ohne vermerkten Zeitpunkt nein - eine Eingabe, von der niemand weiss, wann
   sie war, kann eine Messung nicht ueberstimmen. */
export function handNachTest(th, feld, tag){
  const q = quelleVon(th, feld);
  return !!(q && q.art === 'hand' && q.seit && tag && q.seit > tag);
}

function mitQuellen(neu, quellen){
  return { ftp: neu.ftp ?? null, lthr: neu.lthr ?? null, hrmax: neu.hrmax ?? null, quellen };
}

/* Nach einem Test.

   gemessen traegt die Werte, die dieser Test hergegeben hat - null fuer
   "nicht gemessen". Was er nicht misst, bleibt unangetastet samt Herkunft;
   sonst truege eine mitgereichte HFmax nach jedem Test den Stempel
   "gemessen". Gemessen ist auch eine Zahl, die schon dastand: eine
   Wiederholungsmessung ist eine Messung.

   Was nach dem Testtag von Hand gesetzt wurde, bleibt stehen - samt Wert.
   Die Messung ist damit nicht verloren, sie steht in der Testhistorie; sie
   traegt nur nicht die Zonen. Begruendung oben bei handNachTest.

   Gibt zurueck, was gilt: die drei Werte und ihre Herkunft, und nichts
   daneben - das Ergebnis wird so gespeichert, wie es hier herauskommt. Der
   Aufrufer rechnet nicht selbst aus, welcher Wert gewinnt; genau dort entstand
   der Fehler, den die Regel verhindert. */
export function schwellenAusTest(alt, gemessen, tag){
  const quellen = { ...(alt && alt.quellen) };
  const werte = {
    ftp:   alt ? alt.ftp   ?? null : null,
    lthr:  alt ? alt.lthr  ?? null : null,
    hrmax: alt ? alt.hrmax ?? null : null
  };

  for(const f of SCHWELLEN_FELDER){
    const m = gemessen ? gemessen[f] : null;
    if(m == null) continue;
    if(handNachTest(alt, f, tag)) continue;
    werte[f] = m;
    quellen[f] = { art: 'test', tag };
  }
  for(const f of SCHWELLEN_FELDER) if(werte[f] == null) quellen[f] = null;

  return mitQuellen(werte, quellen);
}

/* Welche gemessenen Felder eine spaetere Eingabe von Hand behaelt.

   Eigene Auskunft und kein Feld am Ergebnis: der Testbereich braucht sie fuer
   seine Meldung - ein Messwert, der nicht uebernommen wurde, ohne dass es
   dasteht, ist derselbe stille Vorgang von der anderen Seite -, aber
   gespeichert wird nur, was gilt. */
export function ueberstimmteFelder(alt, gemessen, tag){
  return SCHWELLEN_FELDER.filter(f =>
    gemessen && gemessen[f] != null && handNachTest(alt, f, tag));
}

/* Von Hand. Markiert wird, was sich geaendert hat - wer nur die HFmax
   nachtraegt, soll damit nicht die gemessene FTP zu einer getippten machen.

   jetzt ist der Zeitpunkt der Eingabe, als ISO-Zeichenkette. Er entscheidet
   spaeter, ob ein berichtigter Test diesen Wert wieder ueberschreiben darf -
   deshalb kommt er herein und wird nicht hier geholt: dieses Modul kennt
   keine Uhr. */
export function schwellenVonHand(alt, neu, jetzt){
  const quellen = { ...(alt && alt.quellen) };
  for(const f of SCHWELLEN_FELDER){
    if(neu[f] == null){ quellen[f] = null; continue; }
    if(!alt || alt[f] !== neu[f]){
      quellen[f] = jetzt ? { art: 'hand', seit: jetzt } : { art: 'hand' };
    }
  }
  return mitQuellen(neu, quellen);
}

function hasLthr(th){ return !!(th && th.lthr > 0); }
function hasFtp(th){  return !!(th && th.ftp  > 0); }

function cogganHrBands(plan, lthr){
  const r = f => Math.round(lthr * f);
  return plan.cogganBands.map(b => ({
    key: b.key, label: b.label,
    min: r(b.minFactor),
    max: b.maxFactor === null ? 999 : r(b.maxFactor)
  }));
}

export function usesCoggan(plan, th, week){
  return week >= plan.cogganFromWeek && hasLthr(th);
}

/* Warum gerade diese Baender gelten.

   usesCoggan beantwortet die Frage mit ja oder nein, und genau daran ist die
   Anzeige bis zum 10.09.2026 gescheitert: wer am Testtag seine LTHR eintrug,
   sah die Pulsbaender unveraendert stehen und keinen Grund dafuer. Die
   Wattzonen wechselten dagegen sofort - sie haengen an der FTP und an keiner
   Woche -, also sah die Karte halb umgeschaltet aus. Der naechstliegende
   Schluss war, die Zahlen stuenden fest im Code.

   Zwei Gruende halten die Uebergangsbaender, und sie sind verschieden:

     'kein-test'   es gibt keine LTHR. Ohne Messung gibt es nichts zu rechnen.
     'zu-frueh'    die LTHR steht, die Woche ist noch nicht so weit. So
                   verlangt es der Plan: der Test misst die Baender des
                   Folgeblocks, nicht die der laufenden Woche.

   abWoche und abWeek/abDatum liegen bei, damit die Anzeige "ab Woche 5" mit
   einem Datum belegen kann - eine Wochennummer allein beantwortet "wann?"
   nicht. */
export function zonenGrund(plan, th, week){
  /* Die Herkunft der LTHR gehoert dazu: sie ist die Zahl, aus der die Baender
     entstehen, und ob sie gemessen oder getippt ist, aendert nichts an der
     Rechnung, aber alles an ihrer Belastbarkeit. */
  const quelle = quelleVon(th, 'lthr');
  if(usesCoggan(plan, th, week)) return { coggan: true, grund: 'coggan', abWoche: null, quelle };
  return {
    coggan: false,
    grund: hasLthr(th) ? 'zu-frueh' : 'kein-test',
    abWoche: hasLthr(th) ? plan.cogganFromWeek : null,
    quelle
  };
}

/* ---- Leistungsbaender zum Zaehlen ----

   Die Wattzonen stehen in plan.json als Coggan-Prozentschritte und sind
   absichtlich nicht lueckenlos: Z1 bis 55 %, Z2 ab 56 %. Zum Anzeigen ist das
   richtig - so ist Coggan definiert -, zum Zaehlen nicht. zoneSeconds ordnet
   ein Sample dem Band mit min <= v < max zu; bei einer FTP von 192 W fielen
   die knapp zwei Watt zwischen 105,6 und 107,5 durch jedes Raster und
   verschwanden aus der Gesamtzeit.

   Zum Zaehlen werden die Luecken deshalb geschlossen: jedes Band reicht bis
   zum Beginn des naechsten, das oberste ist oben offen. Ein Sprint mit 130 %
   FTP gehoert in Z5 und nicht in keine Zone - maxFactor 1,2 ist eine Angabe
   fuer die Tabelle, keine Obergrenze der Wirklichkeit.

   Kein "unter"-Band: in Watt gibt es kein "unterhalb Z1", Z1 beginnt bei null.
   Was darunter liegt, ist kein niedriger Wert, sondern gar kein Treten - und
   das behandelt zoneSeconds getrennt. */
export function powerBands(plan, th){
  if(!hasFtp(th)) return null;
  const keys = Object.keys(plan.powerZones)
    .sort((a, b) => plan.powerZones[a][0] - plan.powerZones[b][0]);
  const w = f => Math.round(th.ftp * f);
  return keys.map((k, i) => ({
    key: k,
    label: plan.zoneLabel[k] || k.toUpperCase(),
    min: w(plan.powerZones[k][0]),
    max: i + 1 < keys.length ? w(plan.powerZones[keys[i + 1]][0]) : OPEN_TOP
  }));
}

/* ---- Woraus die Zonenverteilung gerechnet wird ----

   Bis zum 12.09.2026 immer aus dem Pulsstrom, und bis Woche 5 gegen die
   Uebergangsbaender. Das war zum Scheitern verurteilt, sobald der Test lief:
   die Uebergangsbaender stuetzten sich auf eine ungepruefte HFmax und auf
   Geschwindigkeit als Ersatz fuer Leistung, und der Trainingsplan nennt sie
   ausdruecklich eine Arbeitsannahme bis zum Testtag. Eine Ausfahrt danach
   gegen sie zu messen, erzeugt Warnungen ueber einen Massstab, den es nicht
   mehr gibt - die Samstagsausfahrt vom 12.09.2026 lag mit 31 % "ueber Z2",
   bei 139 W Ø gegen ein Z2 von 106-144 W und einer Entkopplung von -0,9 %.

   Der Plan sagt das fuer den Donnerstag selbst: "Ab Woche 5 wird stattdessen
   die Zeit in der Watt-Zone gezaehlt." Dieselbe Regel gilt fuer jede
   Radeinheit - eine Fahrt wird nicht danach beurteilt, welcher Wochentag sie
   ist.

     'watt'           ab cogganFromWeek, sobald FTP und Leistungsstrom da sind
     'hf-coggan'      ab cogganFromWeek ohne Leistung: Puls gegen die Coggan-
                      Baender aus der LTHR. Das Trekkingrad hat keinen
                      Leistungsmesser, seine Fahrten bleiben auswertbar.
     'hf-uebergang'   Woche 1 bis 4, oder ueberhaupt keine Messwerte. Die
                      Wochen davor bleiben damit reproduzierbar.

   hatLeistung entscheidet der Aufrufer - nur er sieht den Strom. */
export function zonenQuelle(plan, th, week, hatLeistung){
  const abWoche = week >= plan.cogganFromWeek;
  if(abWoche && hatLeistung && hasFtp(th)) return 'watt';
  if(abWoche && hasLthr(th)) return 'hf-coggan';
  return 'hf-uebergang';
}

/* Quelle und Baender in einem Griff, damit kein Aufrufer die eine ohne die
   anderen bestimmt. */
export function zonenBaender(plan, th, week, hatLeistung){
  const quelle = zonenQuelle(plan, th, week, hatLeistung);
  return {
    quelle,
    bands: quelle === 'watt' ? powerBands(plan, th)
         : quelle === 'hf-coggan' ? cogganHrBands(plan, th.lthr)
         : plan.hrTransition
  };
}

export function hrBands(plan, th, week){
  return usesCoggan(plan, th, week) ? cogganHrBands(plan, th.lthr) : plan.hrTransition;
}

export function zoneBand(plan, th, key, week){
  return hrBands(plan, th, week).find(b => b.key === key) || null;
}

export function bandRange(b){
  if(!b) return '';
  if(b.max >= 999) return 'über ' + b.min + ' bpm';
  return b.min + '–' + b.max + ' bpm';
}

/* "Z2 128-142 bpm" - eine Stelle, an der die Zahlen stehen. Vorher waren die
   bpm-Werte in ein Dutzend Textbausteine einkopiert und liefen bei jeder
   Zonenkorrektur auseinander. */
export function zoneText(plan, th, key, week){
  const b = zoneBand(plan, th, key, week);
  return b ? key.toUpperCase() + ' ' + bandRange(b) : key.toUpperCase();
}

export function zoneSpan(plan, th, from, to, week){
  const a = zoneBand(plan, th, from, week), b = zoneBand(plan, th, to, week);
  if(!a || !b) return from.toUpperCase() + '–' + to.toUpperCase();
  return from.toUpperCase() + '–' + to.toUpperCase() + ' ' + a.min + '–' + b.max + ' bpm';
}

/* Ohne FTP null - die Anzeige laesst den Wattteil dann weg. */
export function wattText(plan, th, key){
  const z = plan.powerZones[key];
  if(!hasFtp(th) || !z) return null;
  return Math.round(th.ftp * z[0]) + '–' + Math.round(th.ftp * z[1]) + ' W';
}

export function targetText(plan, th, key, week){
  const w = wattText(plan, th, key);
  return w ? zoneText(plan, th, key, week) + ' · ' + w : zoneText(plan, th, key, week);
}

/* Trittfrequenz erst ab dem Sensor - vorher gibt es keine Messung, und
   manuelles Zaehlen ist ausdruecklich kein Bestandteil des Plans. */
export function cadenceText(plan, key, week){
  if(week < plan.cadence.fromWeek) return null;
  return plan.cadence.byZone[key] || null;
}

export function withCadence(plan, text, key, week){
  const c = cadenceText(plan, key, week);
  return c ? text + ' · ' + c : text;
}

/* Geschwindigkeit und Distanz sind Schaetzungen aus einem angenommenen
   Schnitt. Sobald Leistungsdaten vorliegen, sind sie ohne Aussagewert. */
export function showsDistance(plan, week){
  return week <= plan.speed.showUntilWeek;
}

function estimateSpeed(plan, week){
  return Math.min(plan.speed.baseKmh + plan.speed.perWeekKmh * (week - 1), plan.speed.maxKmh);
}

export function estimateDistance(plan, minutes, week){
  return Math.round((minutes / 60) * estimateSpeed(plan, week));
}

/* Ob ein Leistungsstrom tatsaechlich Leistung enthaelt.

   Der Strom kann da sein und trotzdem nichts hergeben: eine Fahrt ohne
   Leistungsmesser liefert je nach Konto keinen watts-Strom, einen mit lauter
   null oder einen mit lauter Nullen. Verlangt wird deshalb, dass ein knappes
   Drittel der Messwerte echte Leistung traegt - weniger ist ein Ausfall und
   keine Aufzeichnung. Dreissig Messwerte als Untergrenze, damit ein
   Zweiminuten-Schnipsel nicht darueber entscheidet, welcher Massstab fuer den
   Tag gilt. */
export function hatLeistungsstrom(data){
  if(!Array.isArray(data) || data.length < 30) return false;
  let echte = 0;
  for(const v of data) if(Number.isFinite(v) && v > 0) echte++;
  return echte >= data.length * 0.3;
}

/* Gleitender Mittelwert ueber ein Zeitfenster, zentriert.

   Ueber die Zeitachse und nicht ueber Messwerte: bei variablem Takt sind
   dreissig Samples zwischen 30 s und zweieinhalb Minuten lang, und ein
   Fenster, dessen Laenge von der Aufzeichnung abhaengt, glaettet jede Fahrt
   anders. Zwei Zeiger, weil beide Fenstergrenzen mit i monoton wachsen -
   ueber die ganze Fahrt bleibt es damit linear. */
function gleitenderMittel(werte, zeit, fensterSek){
  const n = werte.length;
  const halb = fensterSek / 2;
  const out = new Array(n);
  let a = 0, b = 0, summe = 0, anzahl = 0;

  for(let i = 0; i < n; i++){
    while(b < n && zeit[b] <= zeit[i] + halb){
      const v = werte[b];
      if(Number.isFinite(v)){ summe += v; anzahl++; }
      b++;
    }
    while(a < n && zeit[a] < zeit[i] - halb){
      const v = werte[a];
      if(Number.isFinite(v)){ summe -= v; anzahl--; }
      a++;
    }
    /* Faellt das ganze Fenster aus, bleibt der Rohwert stehen - und ist er
       selbst keine Zahl, bleibt er es. Die Zaehlung ueberspringt ihn dann. */
    out[i] = anzahl > 0 ? summe / anzahl : werte[i];
  }
  return out;
}

/* Zonenzeit aus einem Messstrom - Puls oder Leistung.

   Ein Sample ist NICHT eine Sekunde: Garmin zeichnet variabel auf, in echten
   Daten liegen die Abstaende zwischen 1 und 17 s bei einem Mittel von gut 4 s.
   Jedes Sample gilt bis zum naechsten, gewichtet mit dem Zeitdelta. Ohne
   time-Stream bleibt eine Sekunde je Sample als Notnagel, dann stimmen zwar
   die Anteile, aber nicht die absoluten Minuten.

   opts fuer den Leistungsstrom, siehe WATT_FENSTER_SEK und ROLLEN_WATT:

     fensterSek   vorher ueber dieses Zeitfenster mitteln
     rollenUnter  Werte darunter zaehlen als Rollen, nicht als Zone. Sie
                  stehen in _rollen und fehlen in _total - die Anteile gelten
                  damit auf die getretene Zeit. */
export function zoneSeconds(bands, hrData, timeData, recordedSec, opts){
  const o = opts || {};
  const out = {};
  for(const b of bands) out[b.key] = 0;
  let counted = 0, rollen = 0;
  const n = hrData.length;
  const hasTime = Array.isArray(timeData) && timeData.length === n && n > 1;

  /* Takt der Aufzeichnung bestimmen, nicht annehmen. Die Uhr kann pro Sekunde
     aufzeichnen oder im intelligenten Modus mit schwankenden Abstaenden, und
     neue Sensoren koennen das erneut aendern. Der Median ist robust gegen
     einzelne Pausen. */
  let takt = null;
  if(hasTime){
    const d = [];
    for(let i = 1; i < n; i++){
      const dt = timeData[i] - timeData[i - 1];
      if(dt > 0 && dt <= 60) d.push(dt);
    }
    if(d.length){
      d.sort((a, b) => a - b);
      takt = d[Math.floor(d.length / 2)];
    }
  }

  /* Ohne Zeit-Stream aus der Aufzeichnungsdauer skalieren. Gleichmaessig statt
     exakt, trifft die Gesamtzeit aber und ist allem vorzuziehen, was still
     eine Sekunde je Messwert annimmt. */
  let fallbackDt = 1;
  let method = hasTime ? 'zeitgewichtet' : 'annahme';
  if(!hasTime && recordedSec > 0 && n > 0){
    const q = recordedSec / n;
    if(q > 0.2 && q < 60){ fallbackDt = q; method = 'skaliert'; takt = q; }
  }

  /* Geglaettet wird auf der Zeitachse, auch wo es keinen Zeit-Stream gibt -
     dann auf der aus dem Takt gerechneten. Ein gleichmaessiges Raster ist
     genau die Annahme, die 'skaliert' und 'annahme' ohnehin schon treffen. */
  let werte = hrData;
  if(o.fensterSek > 0 && n > 1){
    const zeit = hasTime ? timeData : hrData.map((_, i) => i * (fallbackDt || 1));
    werte = gleitenderMittel(hrData, zeit, o.fensterSek);
  }

  for(let i = 0; i < n; i++){
    const v = werte[i];
    let dt = fallbackDt;
    if(hasTime){
      const next = i + 1 < n ? timeData[i + 1] : null;
      dt = next == null ? (takt || 1) : next - timeData[i];
      /* Pausen und Luecken nicht als Zonenzeit durchschlagen lassen. */
      if(!(dt > 0)) dt = 0;
      if(dt > 60) dt = 60;
    }
    if(!Number.isFinite(v)) continue;
    if(o.rollenUnter != null && v < o.rollenUnter){ rollen += dt; continue; }
    const band = bands.find(b => v >= b.min && v < b.max);
    if(band){ out[band.key] += dt; counted += dt; }
  }
  out._total = counted;
  out._rollen = rollen;
  out._method = method;
  out._takt = takt;
  out._samples = n;
  return out;
}
