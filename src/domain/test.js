/* Der Schwellentest als eigener Vorgang - nicht als Donnerstag unter anderen.

   Bis hierher war der Test in der App an drei Stellen verteilt und an keiner
   ganz: als Tageskarte im Plan, als Betriebsart im Intervalltimer und als
   Formular unter den Zonen. Was fehlte, war die Sache selbst. Der Test ist
   kein Trainingstag, sondern eine Messung mit zehn Tagen Anlauf, einer
   Go/No-Go-Entscheidung am Morgen, einem festen Ablauf und zwei Zahlen am
   Ende, an denen der ganze Folgeblock haengt. Wer am Testmorgen wissen wollte,
   was zu tun ist, musste das aus drei Bereichen zusammensuchen.

   Dieses Modul rechnet die Lage: welcher Termin als naechstes ansteht, wo im
   Anlauf man gerade steht, welcher Schritt heute gilt und welche Ablaeufe sich
   abspielen lassen. Es entscheidet nichts ueber die Anzeige und stellt keine
   Fragen an die Uhr - was "heute" ist, kommt herein.

   Warum der Tempotest hier eine eigene Rolle bekommt: er ist der einzige
   Schritt des Anlaufs mit einem Ergebnis. Aus den zwei mal sechs Minuten faellt
   die Wattzahl, auf die im Test gezielt wird - der Plan sagt ausdruecklich
   "notieren". Notiert wurde sie bisher nirgends, und sieben Tage spaeter stand
   man am Start ohne die Zahl, fuer die man die Einheit gefahren war.

   Rein: kein DOM, kein fetch, keine Uhr. */

import { testWeeks, testDateFor, thursdayDateFor, toMidnight, dayOffset,
         isoDayLocal, addDays } from './week.js';
import { thursdayPlan, thursdayVariante, schrittSekunden } from './day.js';

/* Alle Testtermine des Plans mit ihrem Datum. Abgeleitet aus den Testwochen,
   damit keine zweite Liste danebensteht. */
export function testTermine(plan, startDate){
  if(!startDate) return [];
  return testWeeks(plan).map(w => ({
    week: w,
    datum: testDateFor(plan, w, startDate),
    minuten: thursdayPlan(plan, w).minutes,
    titel: thursdayPlan(plan, w).title
  }));
}

/* Der Termin, um den es gerade geht.

   Das ist der naechste, der noch nicht vorbei ist - einschliesslich des
   heutigen. Der Tag danach zaehlt bewusst noch dazu: der Anlauf hat einen
   Schritt fuer ihn ("Ruhe oder 30 min Z1"), und das Ergebnis wird meist erst
   dann eingetragen. Danach rueckt der Blick auf den naechsten Termin.

   Sind alle vorbei, bleibt der letzte stehen. Ein leerer Bereich waere die
   schlechtere Antwort: die Testhistorie und die Auswertung gelten weiter. */
export function aktuellerTermin(plan, heute, startDate){
  const alle = testTermine(plan, startDate);
  if(!alle.length) return null;
  const h = toMidnight(heute);
  return alle.find(t => dayOffset(t.datum, h) >= -1) || alle[alle.length - 1];
}

/* Der Anlauf als Liste mit Datum und Zustand.

   Die Schritte stehen in plan.json als Tagesabstand zum Termin; welcher
   Wochentag daraus wird, ergibt sich aus dem Startdatum. Der Testtag selbst
   steht mitten in der Liste und nicht daneben - er ist der Grund, aus dem die
   uebrigen dastehen, und in einer Zeitleiste ohne ihn fehlt die Mitte. */
export function anlaufTage(plan, termin, heute){
  const tt = plan.testTaper;
  if(!termin || !tt || !Array.isArray(tt.steps)) return [];
  const h = toMidnight(heute);

  const zeilen = tt.steps.map(s => ({
    offset: s.offsetDays,
    datum: addDays(termin.datum, s.offsetDays),
    label: s.label,
    text: s.text,
    session: s.session || null,
    test: false
  }));
  zeilen.push({ offset: 0, datum: termin.datum, label: 'Testtag',
                text: null, session: null, test: true });
  zeilen.sort((a, b) => a.offset - b.offset);

  for(const z of zeilen){
    const ab = dayOffset(z.datum, h);
    z.heute = ab === 0;
    z.vergangen = ab < 0;
  }
  return zeilen;
}

/* Woran man gerade ist. Ein Wort, an dem die Ansicht ihre Ueberschrift und
   ihren ersten Satz aufhaengt - und nicht fuenf Vergleiche, die an drei
   Stellen wiederholt werden muessten. */
export function testPhase(plan, termin, heute){
  if(!termin) return 'keiner';
  const tage = dayOffset(termin.datum, toMidnight(heute));
  if(tage === 0) return 'heute';
  if(tage === -1) return 'danach';
  if(tage < -1) return 'vorbei';
  const vorlauf = plan.testTaper ? plan.testTaper.leadDays : 14;
  return tage <= vorlauf ? 'anlauf' : 'fern';
}

/* Die Ablaeufe, die sich im Testbereich abspielen lassen.

   Der Test selbst und jeder Anlaufschritt, der eine Schrittfolge traegt - im
   ausgelieferten Plan sind das der Tempotest sieben Tage davor und die Oeffner
   am Vortag. Alles andere im Anlauf ist eine Fahrt, ein Zirkel oder Ruhe und
   hat im Timer nichts zu zaehlen.

   `tempo` markiert den Anlauf, aus dem die Zielwattzahl faellt: den, dessen
   Belastungsschritte das Testtempo als Anstrengung nennen. Ueber die
   Anstrengung und nicht ueber den Abstand -7, weil der Abstand in einer
   geaenderten plan.json ein anderer sein darf - und nicht ueber die
   Steuergroesse, die den Ablauf beschreibt ("Tempo, das 20 min haltbar
   waere") und das Wort nicht enthalten muss. Die Oeffner am Vortag fallen so
   heraus: sie sind "zuegig" und liefern keine Zahl. */
export function testAblaeufe(plan, termin, heute){
  const raus = [];
  for(const z of anlaufTage(plan, termin, heute)){
    const s = z.session;
    if(!s || s.kind !== 'steps') continue;
    raus.push({
      id: 'anlauf' + z.offset,
      titel: s.title,
      steps: s.steps,
      steering: s.steering || null,
      note: [z.text, s.note].filter(Boolean).join(' '),
      datum: z.datum,
      heute: z.heute,
      tempo: s.steps.some(x => /testtempo/i.test(x.effort || '')),
      /* Wie lang ein Belastungsblock ist - gebraucht, um ihn in der
         Aufzeichnung wiederzufinden. Aus den Schritten und nicht als Zahl
         daneben: aendert plan.json die sechs Minuten, sucht die Auswertung
         danach die richtige Fensterlaenge. */
      blockSekunden: schrittSekunden(s.steps.find(x => x.type === 'work') || {})
    });
  }
  if(plan.thresholdTest && Array.isArray(plan.thresholdTest.steps)){
    raus.push({
      id: 'test',
      titel: termin ? termin.titel : 'Schwellentest',
      steps: plan.thresholdTest.steps,
      steering: plan.thresholdTest.steering || null,
      note: plan.texts.thresholdTestSummary,
      datum: termin ? termin.datum : null,
      heute: !!(termin && dayOffset(termin.datum, toMidnight(heute)) === 0),
      tempo: false
    });
  }
  return raus;
}

/* Welcher Ablauf beim Oeffnen des Bereichs oben liegt: der von heute, sonst
   der Test. Wer den Bereich am Tag des Tempotests oeffnet, will den Tempotest
   und nicht den Test von naechster Woche. */
export function vorgewaehlterAblauf(ablaeufe){
  const heute = ablaeufe.find(a => a.heute);
  return heute ? heute.id : 'test';
}

/* FTP und LTHR aus den Messwerten des Tests.

   Beide Formeln stehen im Trainingsplan und nirgends sonst in der App
   gerechnet: das Zonenformular uebernahm bisher nur die FTP und liess die
   LTHR von Hand eintragen - ausgerechnet die Zahl, aus der alle Pulsbaender
   des Folgeblocks entstehen. */
export const FTP_FAKTOR = 0.95;

export function testWerte({ w20, hr20, kadenz, gewicht }){
  const zahl = v => (v > 0 ? v : null);
  const watt = zahl(w20);
  return {
    w20: watt,
    /* Seit Fassung 4 die Kadenz statt der 5-min-Leistung: der 5-min-Wert
       entsteht jetzt an einem anderen Tag und gehoert nicht mehr in dieselbe
       Zeile. Die Kadenz gehoert dagegen zum Test - sie sagt, ob zwei Tests
       mit derselben Trittfrequenz gefahren wurden. */
    kadenz: zahl(kadenz),
    hr20: zahl(hr20),
    weight: zahl(gewicht),
    ftp: watt ? Math.round(watt * FTP_FAKTOR) : null,
    lthr: zahl(hr20),
    wkg: watt && gewicht > 0 ? Math.round(watt * FTP_FAKTOR / gewicht * 100) / 100 : null
  };
}

/* ---- Die VO2max-Referenz ----

   Sie entsteht seit Fassung 4 nicht mehr am Testtag, sondern als erste
   Wiederholung der ersten Intervalleinheit danach. Ihr Termin ist deshalb ein
   Tag mit Variante, und der Test, auf den sie sich bezieht, ist der letzte
   davor - nur dessen FTP kann sie pruefen. */
export function vo2maxTermin(plan, startDate){
  if(!startDate) return null;
  for(let w = 1; w <= plan.weekCount; w++){
    const v = thursdayVariante(plan, w);
    if(v && v.ergebnis === 'vo2max5'){
      const datum = thursdayDateFor(plan, w, startDate);
      const test = testTermine(plan, startDate)
        .filter(t => dayOffset(t.datum, datum) <= 0).pop() || null;
      return { week: w, datum, variante: v, test };
    }
  }
  return null;
}

/* Die Gegenprobe des Trainingsplans: liegt der 5-min-Wert deutlich ueber
   118 % der Test-FTP, war der Test zu niedrig und der Retest rueckt vor.

   Die Grenze steht hier und nicht in plan.json, weil sie Bewertungspolitik
   ist und keine Trainingsvorgabe - dieselbe Trennung wie bei den Toleranzen
   in analysis.js. */
export const VO2MAX_GRENZE = 118;

export function vo2maxBezug(watt, ftp){
  if(!(watt > 0) || !(ftp > 0)) return null;
  const prozent = Math.round(watt / ftp * 100);
  return { watt, ftp, prozent, zuNiedrig: prozent > VO2MAX_GRENZE, grenze: VO2MAX_GRENZE };
}

/* ---- Das Ergebnis des Tempotests aus der Aufzeichnung ----

   Der Plan verlangt, die Ø-Leistung von Block 2 zu notieren. Abtippen geht,
   aber die Zahl steht in der Aufzeichnung, und wer sie von Hand aus der Uhr
   liest, liest den Momentanwert oder den Schnitt der ganzen Fahrt.

   Gesucht werden die beiden staerksten nicht ueberlappenden Fenster von
   Blocklaenge. Das ist keine Mustererkennung, sondern die Form der Einheit:
   15 min locker, 6 min hart, 6 min locker, 6 min hart, 10 min ausrollen - in
   einer solchen Fahrt sind die beiden Bloecke die beiden staerksten Fenster,
   und zwar mit Abstand. Welches davon Block 2 ist, entscheidet die Zeit und
   nicht die Leistung: wurde nach unten korrigiert, ist Block 2 der schwaechere
   der beiden, und genau seine Zahl ist die gesuchte.

   Beide Bloecke werden zurueckgegeben und angezeigt. Die Zuordnung ist eine
   Annahme, und eine Annahme, die man nicht nachpruefen kann, ist eine
   Behauptung - mit beiden Zahlen und ihren Zeiten daneben sieht man in einer
   Sekunde, ob sie stimmt.

   Ohne Leistungsstrom gibt es nichts zu finden: der Puls hinkt bei sechs
   Minuten hinterher, sein staerkstes Fenster liegt spaeter als der Block und
   waere die falsche Antwort auf eine Frage nach Watt. */

/* Takt der Aufzeichnung bestimmen, nicht annehmen - dieselbe Rechnung wie in
   zoneSeconds. Der Median ist robust gegen einzelne Pausen. */
function taktSekunden(zeit){
  if(!Array.isArray(zeit) || zeit.length < 2) return null;
  const d = [];
  for(let i = 1; i < zeit.length; i++){
    const dt = zeit[i] - zeit[i - 1];
    if(dt > 0 && dt <= 60) d.push(dt);
  }
  if(!d.length) return null;
  d.sort((a, b) => a - b);
  return d[Math.floor(d.length / 2)];
}

function mittel(werte, von, bis){
  let summe = 0, n = 0;
  for(let i = von; i < bis; i++){
    const v = werte[i];
    if(Number.isFinite(v)){ summe += v; n += 1; }
  }
  return n ? summe / n : null;
}

export function tempoBloecke({ watts, puls, zeit, sekunden }){
  if(!Array.isArray(watts) || !watts.length || !(sekunden > 0)) return null;
  const takt = taktSekunden(zeit) || 1;
  const fenster = Math.max(2, Math.round(sekunden / takt));
  const n = watts.length;
  if(n < fenster * 2) return null;

  /* Praefixsummen: der gleitende Schnitt ueber ein paar tausend Messwerte darf
     nicht quadratisch werden. Nicht gemessene Stellen zaehlen als null Watt -
     im Freilauf sind sie das auch. */
  const s = new Float64Array(n + 1);
  for(let i = 0; i < n; i++) s[i + 1] = s[i] + (Number.isFinite(watts[i]) ? watts[i] : 0);
  const schnitt = i => (s[i + fenster] - s[i]) / fenster;

  let best = 0;
  for(let i = 1; i + fenster <= n; i++) if(schnitt(i) > schnitt(best)) best = i;

  let zweitbest = -1;
  for(let i = 0; i + fenster <= n; i++){
    if(i + fenster > best && i < best + fenster) continue;   // ueberlappt
    if(zweitbest < 0 || schnitt(i) > schnitt(zweitbest)) zweitbest = i;
  }
  if(zweitbest < 0) return null;

  const sek = i => (Array.isArray(zeit) && Number.isFinite(zeit[i]) ? zeit[i] : Math.round(i * takt));
  const block = i => ({
    watt: Math.round(schnitt(i)),
    puls: Array.isArray(puls) ? (v => (v == null ? null : Math.round(v)))(mittel(puls, i, i + fenster)) : null,
    vonSek: sek(i),
    bisSek: sek(Math.min(i + fenster, n - 1))
  });

  const [frueh, spaet] = best < zweitbest ? [best, zweitbest] : [zweitbest, best];
  return { erster: block(frueh), zweiter: block(spaet), fensterSekunden: fenster * takt };
}

/* Die Zahl, auf die im Test gezielt wird, und was daraus faellt.

   Die FTP steht hier nicht als Vorhersage, sondern als Rechnung mit der Formel
   des Plans: haelt das Ziel ueber die 20 Minuten, ist es der Ø-Wert, aus dem
   sie entsteht. Vorher zu wissen, worauf der Test hinauslaeuft, ist kein
   Selbstzweck - eine Zahl, die weit unter der bisherigen FTP liegt, ist am
   Tag davor ein Hinweis und nicht erst danach. */
export function testZiel(prep, thresholds){
  const watt = prep && prep.zielWatt > 0 ? prep.zielWatt : null;
  if(!watt) return null;
  const ftp = Math.round(watt * FTP_FAKTOR);
  const alt = thresholds && thresholds.ftp > 0 ? thresholds.ftp : null;
  return {
    watt,
    puls: prep.zielPuls > 0 ? prep.zielPuls : null,
    ftp,
    /* Nur der Vergleich, keine Bewertung: ob ein Minus an der Form liegt oder
       an einem zu vorsichtigen Anlauf, entscheidet der Test. */
    gegenAlt: alt ? Math.round((ftp - alt) / alt * 100) : null,
    alteFtp: alt
  };
}

/* Der Schluessel, unter dem die Notizen zu einem Termin liegen. Das Datum des
   Tests und nicht die Wochennummer: verschiebt sich der Planbeginn, verschiebt
   sich die Woche mit, das gefahrene Datum aber nicht. */
export function terminSchluessel(termin){
  return termin ? isoDayLocal(termin.datum) : null;
}
