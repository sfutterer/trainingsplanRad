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
   jemand von Hand eingetippt hatte.

   Der Unterschied ist keiner der Anzeige. Ein Messwert ist an einem Tag unter
   einem Protokoll entstanden und ist mit dem naechsten Test vergleichbar; eine
   eingetragene Zahl ist eine Annahme, eine Korrektur oder ein Wert von
   woanders. Beide gelten gleich - gerechnet wird mit dem juengsten -, aber wer
   die Baender einordnen will, muss sehen, was er vor sich hat.

   Die Herkunft haengt an jedem Wert einzeln, nicht am Satz: HFmax misst kein
   Schwellentest, die Zahl ist also praktisch immer eingetragen, waehrend FTP
   und LTHR daneben gemessen sein koennen.

     { art: 'test', tag: '2026-09-10', id: … }   im Test dieses Tages gemessen
     { art: 'hand', tag: '2026-09-12', id: … }   eingetragener Wert
     null / fehlt                                nicht gesetzt

   Wer gewinnt, wenn beide Wege denselben Wert setzen, steht seit dem
   31.10.2026 nicht mehr hier. Bis dahin war es eine Regel mit Zeitstempeln:
   ein Test ueberschrieb eine Eingabe nur, wenn sein Testtag nach ihr lag.
   Seit die Werte als Liste mit Datum liegen (domain/messwerte.js), beantwortet
   die Reihenfolge der Liste dieselbe Frage von selbst - der juengste Eintrag
   traegt den Wert, und ein berichtigter alter Test bleibt alt. Vier
   Funktionen sind damit ersatzlos entfallen: schwellenAusTest,
   schwellenVonHand, handNachTest und ueberstimmteFelder.

   Was bleibt, ist der Vermerk am geltenden Satz - er kommt jetzt aus der
   Liste und wird hier nur noch gelesen. */

export const SCHWELLEN_FELDER = ['ftp', 'lthr', 'hrmax'];

export function quelleVon(th, feld){
  const q = th && th.quellen && th.quellen[feld];
  return q && q.art ? q : null;
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
  const keys = wattSchluessel(plan);
  return keys.map((k, i) => ({
    key: k,
    label: plan.zoneLabel[k] || k.toUpperCase(),
    min: i === 0 ? 0 : wattGrenze(plan, th, keys[i - 1]) + 1,
    max: i + 1 < keys.length ? wattGrenze(plan, th, k) + 1 : OPEN_TOP
  }));
}

function wattSchluessel(plan){
  return Object.keys(plan.powerZones)
    .sort((a, b) => plan.powerZones[a][0] - plan.powerZones[b][0]);
}

/* Die Obergrenze einer Wattzone in ganzen Watt, so wie der Trainingsplan sie
   schreibt: abgerundet, und die naechste Zone beginnt ein Watt darueber. Bei
   192 W ist das Z1 bis 105, Z2 106-144, Z3 145-172, Z4 173-201, Z5 ab 202.
   Bis zum 19.09.2026 stand hier die Untergrenze aus minFactor, gerundet - und
   damit Z2 108-144 W in der App gegen 106-144 W im Plan. Zwei Zahlen fuer
   dieselbe Zone, und die Auswertung zaehlte gegen die dritte (bis 146). */
function wattGrenze(plan, th, key){
  return Math.floor(th.ftp * plan.powerZones[key][1] + 1e-9);
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
  const keys = wattSchluessel(plan);
  const i = keys.indexOf(key);
  const min = i > 0 ? wattGrenze(plan, th, keys[i - 1]) + 1 : Math.round(th.ftp * z[0]);
  return min + '–' + wattGrenze(plan, th, key) + ' W';
}

/* ---- Die Vorgabe einer Zone, in der Reihenfolge ihrer Steuergroessen ----

   Bis zum 31.10.2026 stand hier "Z2 113-138 bpm · 123-167 W": der Puls
   zuerst, die Watt als Anhaengsel. Das war die Reihenfolge aus der Zeit vor
   dem ersten Schwellentest, als es nur Pulsbaender gab - und sie blieb
   stehen, nachdem der Plan auf die Leistung umgestellt hatte. Wer auf dem Rad
   die erste Haelfte der Zeile liest, las damit die Kontrollgroesse und nicht
   die Vorgabe.

   Jetzt fuehrt die Leistung, sobald eine FTP eingetragen ist, und der Puls
   steht als das dahinter, was er ist. Ohne FTP bleibt alles, wie es war: dann
   gibt es keine Wattzahl, und der Puls ist die Steuergroesse. */
export function targetText(plan, th, key, week){
  const w = wattText(plan, th, key);
  if(!w) return zoneText(plan, th, key, week);
  const b = zoneBand(plan, th, key, week);
  return key.toUpperCase() + ' ' + w + (b ? ' · Puls ' + bandRange(b) : '');
}

/* Wie die Zeile darueber heisst. "Zielzone" stimmte, solange die Zone das
   Ziel war; sobald nach Watt gefahren wird, ist das Ziel eine Leistung. */
export function zielLabel(th){
  return hasFtp(th) ? 'Zielleistung' : 'Zielzone';
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
export function gleitenderMittel(werte, zeit, fensterSek){
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
                  damit auf die getretene Zeit.
     maske        nur Messwerte mit maske[i] zaehlen - die gleichmaessig
                  gefahrene Zeit aus steady.js. Was ausserhalb liegt, fehlt in
                  _total und in _rollen; _total ist dann die Steady-Zeit. */
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
    if(o.maske && !o.maske[i]) continue;
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

/* ---- Die FTP hinter den Zielwatt ----

   Seit Fassung 12 gibt es wieder nur eine FTP: die aus dem Schwellentest. Sie
   traegt die Zonen, die Zonenanzeige, die Bewertung gegen Z2 und die Zielwatt
   der Qualitaetseinheiten. Eingetragen wird sie in den Zonen, nicht in
   plan.json - die Datei kennt nur Prozentsaetze und die Baender, die sich als
   Prozentsatz nicht schreiben lassen.

   Von Fassung 7 bis 11 gab es daneben die Arbeits-FTP aus plan.json: der erste
   Test lag belegt zu tief (192 W), und die Zielwatt rechneten deshalb gegen
   206, spaeter 215 W, waehrend die Zonen beim Testwert blieben. Der Retest vom
   22.10.2026 hat die Luecke geschlossen (223 W), das Feld ist aus der Datei
   verschwunden - der Weg dahin bleibt aber offen: traegt ein Plan arbeits_ftp,
   gilt sie weiter fuer die Zielwatt. Ein gehobener Plan aus Fassung 2 und ein
   eigener Plan duerfen das, und die Funktion ist der einzige Ort, an dem die
   Frage beantwortet wird.

   Die Herkunft wandert mit, weil sie an jeder Zielwattangabe stehen muss: eine
   Zahl, deren Grundlage niemand mehr rekonstruiert, ist dasselbe Problem wie
   ein Test ohne Bedingungen. */
export function arbeitsFtp(plan, th){
  const a = plan && plan.arbeitsFtp;
  if(a && a.watt > 0){
    return { watt: a.watt, quelle: 'arbeit', seit: a.seit || null, bis: a.bis || null,
             herkunft: a.herkunft || null };
  }
  if(hasFtp(th)) return { watt: th.ftp, quelle: 'test', seit: null, bis: null, herkunft: null };
  return null;
}

/* "FTP 223 W", und nur im Ausnahmefall "Arbeits-FTP 215 W" - die Grundlage in
   drei Worten.

   Bis Fassung 11 hiess es hier "Test-FTP", weil daneben die Arbeits-FTP stand
   und die beiden auseinanderzuhalten waren. Seit es nur noch eine gibt, ist
   der Zusatz eine Unterscheidung ohne Gegenstueck - und auf dem Rad eine
   Silbe, die nichts erklaert. Die Baender der gefahrenen Wochen nennen ihre
   Arbeits-FTP weiterhin, aber als Text in der Datei und nicht von hier. */
export function ftpHerkunft(af){
  if(!af) return '';
  return (af.quelle === 'arbeit' ? 'Arbeits-FTP ' : 'FTP ') + af.watt + ' W';
}

/* Z2 in Watt, aus der eingetragenen FTP: 123-167 W bei 223 W.

   Bis Fassung 11 stand im Trainingsplan "Z2 106-144 W, unabhaengig von der
   FTP" - das war die Coggan-Zone der Test-FTP 192 W, als feste Zahl
   festgehalten, weil die FTP belegt zu tief lag. Fassung 12 hat die Regel
   aufgehoben; die Zone wandert mit jedem Test. Gerechnet hat die App es immer
   schon so, die feste Zahl war nur ihr damaliges Ergebnis. */
export function z2WattBand(plan, th){
  if(!hasFtp(th) || !plan.powerZones.z1 || !plan.powerZones.z2) return null;
  return { min: wattGrenze(plan, th, 'z1') + 1, max: wattGrenze(plan, th, 'z2') };
}

/* ---- Zielbaender der Qualitaetseinheiten ----

   Ein Zielband hat immer dieselbe Gestalt, egal woher es kommt:

     min, max   die Grenzen in Watt; min gleich max heisst ein fester Wert
     text       "240–250 W" oder "196 W" - was auf dem Rad abgelesen wird
     herkunft   "112–116 % der Arbeits-FTP 215 W" - Plan-Punkt 26
     quelle     'plan' fuer ein Band aus der Datei, 'prozent' fuer ein
                gerechnetes

   Die eine Gestalt ist der Punkt: Ring, Tageskarte, Timer und Analyse zeigen
   dasselbe Band, und keiner von ihnen muss wissen, auf welchem der beiden
   Wege es entstanden ist. */
function band(min, max, herkunft, quelle){
  const a = Math.round(min), b = Math.round(max);
  return { min: a, max: b, herkunft, quelle,
           text: a === b ? a + ' W' : a + '–' + b + ' W' };
}

/* Zwei Wege zu einem Zielband, und das feste Band hat Vorrang.

   Der Regelfall ist der Prozentsatz: er rechnet gegen die Arbeits-FTP und
   bleibt damit von sich aus richtig, wenn sie sich aendert - deshalb stehen
   die Samstagsbloecke (80-88 %) und die Schwellenbloecke der Phase 4
   (90-95 %) weiterhin so in der Datei.

   Das feste Band aus plan.json kam mit Fassung 11 dazu, fuer die drei Faelle,
   die sich als Prozentsatz der heutigen Arbeits-FTP nicht mehr richtig
   schreiben lassen:

     die Donnerstage ab Woche 8    240-250 W, in 5-W-Schritten ueber das
                                   Pulskriterium nachgesteuert - nach zwei
                                   Schritten ist das keine runde Prozentzahl
                                   mehr, und die Prozentzahl war ohnehin nur
                                   die Herleitung
     der Donnerstag der Woche 7    fest 196 W; 95 % der neuen Arbeits-FTP
                                   waeren 204 W, und die Erholungswoche soll
                                   gerade nichts kitzeln
     die gefahrenen Wochen 5, 6    222-237 W aus der Arbeits-FTP 206 W. Die
                                   Analyse eines gefahrenen Tages muss gegen
                                   die Vorgabe rechnen, die an ihm galt -
                                   sonst faellt der Samstag vom 19.09. mit
                                   171 W nachtraeglich durch ein Band, das es
                                   an diesem Tag nicht gab

   Die Herkunft ist beim festen Band Pflichtangabe in der Datei und wird beim
   gerechneten aus dem Prozentsatz und der Arbeits-FTP gebildet. In beiden
   Faellen steht sie am Band, nicht daneben. */
export function zielband(plan, th, spec){
  const z = spec && spec.zielwatt;
  if(z && z.min > 0){
    return band(z.min, z.max > 0 ? z.max : z.min, z.herkunft || null, 'plan');
  }
  return prozentBand(plan, th, spec && (spec.power || spec.effort));
}

/* Eine Prozentangabe aus plan.json als Band: "108–115 % FTP" wird bei einer
   Arbeits-FTP von 206 W zu 222-237 W, "ca. 95 % FTP" zu 196 W. null, wenn im
   Text keine Prozentangabe auf die FTP steht oder keine FTP da ist - dann
   bleibt der Text allein stehen. */
export function prozentBand(plan, th, text){
  const af = arbeitsFtp(plan, th);
  if(!af || typeof text !== 'string') return null;
  const zahl = s => parseFloat(s.replace(',', '.'));
  const her = (a, b) => (b == null ? Math.round(a) : Math.round(a) + '–' + Math.round(b))
                        + ' % der ' + ftpHerkunft(af);
  const spanne = text.match(/(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)\s*%\s*FTP/);
  if(spanne){
    const von = zahl(spanne[1]), bis = zahl(spanne[2]);
    return band(af.watt * von / 100, af.watt * bis / 100, her(von, bis), 'prozent');
  }
  const eins = text.match(/(\d+(?:[.,]\d+)?)\s*%\s*FTP/);
  if(!eins) return null;
  const p = zahl(eins[1]);
  return band(af.watt * p / 100, af.watt * p / 100, her(p), 'prozent');
}

/* Das Ziel der Samstagsbloecke: 80-88 % der Arbeits-FTP, oder das feste Band
   am Blockeintrag der Woche. `bloecke` ist tage.sa.bloecke - ohne Bloecke
   gibt es kein Blockziel. */
export function blockWattBand(plan, th, bloecke){
  const z = bloecke && bloecke.zielwatt;
  if(z && z.min > 0){
    return band(z.min, z.max > 0 ? z.max : z.min, z.herkunft || null, 'plan');
  }
  const bp = plan.saturdayRide && plan.saturdayRide.blockPower;
  const af = arbeitsFtp(plan, th);
  if(!bp || !af) return null;
  return band(af.watt * bp.minFactor, af.watt * bp.maxFactor,
              Math.round(bp.minFactor * 100) + '–' + Math.round(bp.maxFactor * 100) +
              ' % der ' + ftpHerkunft(af), 'prozent');
}

/* Das Band als eine Zeile: "240–250 W · 112–116 % der Arbeits-FTP 215 W".

   Wo der Platz fuer zwei Zeilen reicht - am Ring und an der Blockzeile der
   Tageskarte - steht die Herkunft klein darunter statt hinter einem
   Mittelpunkt. Beides zeigt dasselbe; getrennt gehalten, weil auf dem Rad nur
   die erste Haelfte gelesen wird. */
export function zielbandZeile(b){
  if(!b) return null;
  return b.herkunft ? b.text + ' · ' + b.herkunft : b.text;
}

/* Kadenzziel auf dem Trekkingrad (Di, Mi). Fassung 8 trennt nach Rad: auf dem
   Cube hat in Z2 die Leistung Vorrang und das Ziel ist 80-85 rpm, auf dem
   Trekkingrad gibt es keine Wattvorgabe, dort bleibt 85-90 rpm als
   Richtwert. */
export function cadenceTextTrekking(plan, key, week){
  if(week < plan.cadence.fromWeek) return null;
  const t = plan.cadence.trekkingrad;
  return (t && t[key]) || plan.cadence.byZone[key] || null;
}
