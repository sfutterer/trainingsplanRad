/* Zonen, Schwellenwerte und die Erhebung der Uebergangszeit.

   Standen frueher unter den Tageskarten. Das war die falsche Stelle: der Plan
   beantwortet "was mache ich heute", diese Seite beantwortet "mit welchen
   Zahlen rechne ich". Das eine schaut man taeglich an, das andere alle paar
   Wochen.

   Genau darauf ist die Seite seit dem 10.09.2026 beschraenkt. Bis dahin stand
   hier ein zweites Testformular neben dem im Testbereich - beide fuellten
   denselben Speicher, aber nicht mit demselben Eintrag: dieses fragte Ø-Watt,
   Kadenz, Gewicht und Bedingungen, das andere zusaetzlich Ø-Puls und RPE. Ein
   ueber diesen Weg eingetragener Test hatte also keine LTHR - ausgerechnet die
   Zahl, aus der alle Pulsbaender entstehen - und keine Guetepruefung. Zwei
   Wege zu derselben Ablage, von denen einer weniger speichert, sind keine
   Wahlmoeglichkeit, sondern eine Falle.

   Was bleibt, ist die Korrektur von Hand: FTP, LTHR und HFmax direkt setzen.
   Das ist eine andere Sache als einen Test einzutragen und gehoert deshalb
   nicht in die Testhistorie - eine getippte Zahl ist keine Messung. */

import { useState } from 'preact/hooks';
import { plan, thresholds, week, testLog, interimLog, startDate,
         setThresholds, addInterimEntry } from '../../../state/store.js';
import { isoDayLocal, toMidnight, dayFromIso, weekNumberFor, tagNr, kurzTag,
         datumText, weekStartFor } from '../../../domain/week.js';
import { gotoTab } from '../../../state/navigation.js';
import { hrBands, zonenGrund, zoneBand, quelleVon, schwellenVonHand,
         SCHWELLEN_FELDER } from '../../../domain/zones.js';
import { sprechtestBezug, FTP_FAKTOR } from '../../../domain/test.js';
import { zahl } from '../../../domain/zahlen.js';
import { Zonenliste } from '../../components/Zonenliste.jsx';
import { Verlaufsgraph } from '../../components/Verlaufsgraph.jsx';
import { Testhistorie } from '../../components/Testhistorie.jsx';
import { Zahlenfeld, Textfeld } from '../../components/Feld.jsx';
import './zonen.css';

/* Die Zonen und - seit dem 10.09.2026 - der Grund, aus dem gerade diese
   gelten.

   Die Karte zeigte nur das Ergebnis. Wer am Testtag seine LTHR eintrug, sah
   die Pulsbaender unveraendert stehen, waehrend die Wattzonen aus der frisch
   gemessenen FTP sofort erschienen - die haengen an keiner Woche. Eine Karte,
   die halb umschaltet und nichts dazu sagt, laesst genau einen Schluss zu:
   die Zahlen stehen fest im Code. Sie stehen in plan.json, und was fehlte,
   war der Satz, ab wann damit gerechnet wird. */
/* Woher ein Wert kommt, in Worten. Ohne Vermerk kein Satz: eine geratene
   Herkunft stuende so bestimmt da wie eine vermerkte. */
function herkunftText(quelle){
  if(!quelle) return null;
  if(quelle.art === 'hand') return 'von Hand eingetragen';
  return 'im Test' + (quelle.tag ? ' vom ' + datumText(dayFromIso(quelle.tag)) : '') + ' gemessen';
}

function ZonenKarte(){
  const p = plan.value, th = thresholds.value, w = week.value, start = startDate.value;
  const bands = hrBands(p, th, w);
  const { coggan, grund, abWoche, quelle } = zonenGrund(p, th, w);
  const abDatum = abWoche && start ? weekStartFor(abWoche, start) : null;
  /* Die Herkunft der LTHR als Einschub, oder gar nichts. Sie steht nicht als
     eigener Satz da: der Hinweis erklaert, ab wann gerechnet wird, und woher
     die Zahl kommt, gehoert in dieselbe Zeile. */
  const woher = herkunftText(quelle);

  return (
    <div class="card">
      <div class="row"><span>Zonenmodell</span><b>
        {coggan ? 'Coggan, % LTHR (' + th.lthr + ' bpm)' + (th.ftp > 0 ? ' · Watt aus FTP ' + th.ftp + ' W' : '')
                : 'Übergangsbänder, Arbeitsannahme'}
      </b></div>
      <Zonenliste bands={bands} plan={p} thresholds={th} mitWatt />

      {coggan && woher && (
        <p class="hint">
          Die Bänder entstehen aus der LTHR von {th.lthr} bpm – {woher}.
        </p>
      )}
      {grund === 'zu-frueh' && (
        <p class="hint good">
          Die LTHR steht ({th.lthr} bpm{woher ? ', ' + woher : ''}) und ist nicht verloren –
          gerechnet wird mit ihr ab Woche {abWoche}
          {abDatum ? ', also ab ' + datumText(abDatum) : ''}. Bis dahin gelten die
          Übergangsbänder. So verlangt es der Plan: der Test misst die Bänder des
          <b> Folgeblocks</b>, nicht die der laufenden Woche.
          {th.ftp > 0 ? ' Die Wattzonen stehen schon jetzt daneben – sie hängen an der FTP und an keiner Woche.' : ''}
        </p>
      )}
      {grund === 'kein-test' && w >= p.cogganFromWeek && (
        <p class="hint warn">
          Ab Woche {p.cogganFromWeek} wäre Coggan vorgesehen, es fehlt aber die LTHR. Solange
          keine dasteht – gemessen oder von Hand –, laufen die Übergangsbänder weiter.
        </p>
      )}

      <p class="hint">{coggan ? p.texts.zoneNoteCoggan : p.texts.zoneNoteTransition}</p>
      <p class="hint">
        Keine dieser Zahlen steht im Code: die Übergangsbänder und die Coggan-Prozentsätze
        stehen in <b>plan.json</b>, LTHR und FTP kommen aus dem Schwellentest oder aus der
        Eingabe darunter.
      </p>
    </div>
  );
}

/* Zwei Verlaeufe, kein W/kg.

   W/kg waere die naheliegende Zahl und ist hier die falsche: waehrend einer
   Abnehmphase bewegen sich Zaehler und Nenner gleichzeitig, ein steigender
   Quotient sagt dann nichts darueber, ob der Motor groesser geworden ist.
   Getrennt gezeichnet beantworten die beiden Linien genau das - und eine
   flache FTP-Linie ueber einer fallenden Gewichtslinie ist kein Stillstand,
   sondern gehaltene Leistung bei weniger Energie.

   Beide auf einer gemeinsamen Prozentachse, nicht jede auf ihren eigenen
   Bereich normiert. Eigene Bereiche waren der erste Entwurf und machten aus
   einem Watt Unterschied zwischen zwei Tests einen Ausschlag ueber die halbe
   Bildhoehe - Messrauschen, gezeichnet wie Fortschritt.

   Gezeichnet wird jetzt mit Verlaufsgraph und nicht mehr mit einem eigenen
   SVG. Die Begruendung oben rechtfertigt eine andere Aufbereitung der Daten -
   eben die Umrechnung auf Prozent gegen den ersten Test - und nicht eine
   zweite Zeichenroutine: die alte Fassung brachte eigene Skalierung, eigene
   Legende und eigene Trefferflaechen mit, also drei Dinge, die es schon gab,
   nur kleiner und ohne antippbare Punkte. Die Mindestspanne, die das Rauschen
   klein haelt, ist als Eigenschaft dorthin gewandert. */
const VERLAUF_MIN_SPANNE = 4;   // Prozent, damit Rauschen nicht das Bild fuellt

/* Aus einer Testreihe die Prozentaenderung gegen den ersten Wert. Der absolute
   Wert bleibt als Zusatz am Punkt haengen - beim Antippen steht dort "215 W"
   und nicht nur "+3,9 %". */
function prozentReihe(eintraege, feld, einheit, nk){
  const echte = eintraege.filter(e => e[feld] > 0);
  if(echte.length < 2) return null;
  const erster = echte[0][feld];
  return {
    erster, letzter: echte[echte.length - 1][feld],
    punkte: echte.map(e => ({
      t: tagNr(e.day),
      v: (e[feld] - erster) / erster * 100,
      marke: kurzTag(e.day),
      zusatz: zahl(e[feld], nk) + ' ' + einheit
    }))
  };
}

function delta(reihe, einheit, nk){
  const d = reihe.letzter - reihe.erster;
  const vz = d >= 0 ? '+' : '−';
  return vz + zahl(Math.abs(d), nk) + ' ' + einheit +
         ' (' + vz + zahl(Math.abs(d / reihe.erster * 100), 1) + ' %)';
}

function Verlauf({ eintraege }){
  const sortiert = eintraege.slice().sort((a, b) => (a.day < b.day ? -1 : 1));
  const ftp = prozentReihe(sortiert, 'ftp', 'W', 0);
  const kg = prozentReihe(sortiert, 'weight', 'kg', 1);
  if(!ftp && !kg) return null;

  const reihen = [];
  if(ftp) reihen.push({ name: 'FTP', farbe: 'var(--z4)', punkte: ftp.punkte });
  if(kg)  reihen.push({ name: 'Gewicht', farbe: 'var(--z1)', punkte: kg.punkte });

  return (
    <>
      <div class="listhead">Verlauf</div>
      <Verlaufsgraph reihen={reihen} einheit="%" nachkomma={1}
        mindestSpanne={VERLAUF_MIN_SPANNE} />
      <div class="verlaufleg">
        {ftp && <span><i class="z4"></i>FTP {delta(ftp, 'W', 0)}</span>}
        {kg && <span><i class="z1"></i>Gewicht {delta(kg, 'kg', 1)}</span>}
      </div>
      <p class="hint">
        Änderung gegenüber dem ersten Test, beide Linien auf derselben Achse. Bewusst
        getrennt statt als W/kg: sinkt das Gewicht gewollt, sagt ein steigender Quotient
        nichts über die Form. Eine flache FTP-Linie bei fallendem Gewicht ist gehaltene
        Leistung bei weniger Energie – kein Stillstand.
      </p>
    </>
  );
}

/* Die Schwellenwerte, mit denen gerechnet wird - und nur sie.

   Die Karte kann eine Zahl aendern und keinen Test anlegen. Der Unterschied
   ist nicht formal: die Testhistorie traegt Protokollkennung und Fassung, weil
   der Trainingsplan denselben Ablauf ueber alle Termine verlangt. Eine hier
   getippte FTP hat kein Protokoll - sie in dieselbe Reihe zu stellen, macht
   aus der Pruefung "gleicher Ablauf?" eine, die stillschweigend besteht.

   Der Weg zum Test steht daneben als Knopf. Er ist der Grund, aus dem das
   Formular hier verschwinden konnte: wer hierher kam, um einen Test
   einzutragen, ist einen Tipp entfernt von der Stelle, an der das geht.

   Was hier eingetragen wird, gilt - genau wie ein Messwert und ohne
   Einschraenkung. Die Kopfzeile behauptete bis zum 10.09.2026 "aus Test
   uebernommen", sobald ueberhaupt eine LTHR dastand, auch bei einer von Hand
   getippten. Jetzt steht je Wert dabei, woher er kommt: eine getippte HFmax
   neben einer gemessenen FTP ist der Normalfall und keine Unstimmigkeit. */

const FELDNAMEN = { ftp: 'FTP', lthr: 'LTHR', hrmax: 'HFmax' };
const EINHEIT   = { ftp: 'W', lthr: 'bpm', hrmax: 'bpm' };

/* Ein Satz fuer die Kopfzeile. Nicht die Aufzaehlung aller drei - die steht
   darunter -, sondern die Antwort auf "womit rechnet die App gerade". */
function herkunftKurz(th){
  const arten = SCHWELLEN_FELDER
    .filter(f => th[f] > 0)
    .map(f => { const q = quelleVon(th, f); return q ? q.art : 'unbekannt'; });
  if(!arten.length) return 'noch nichts eingetragen';
  const einzig = new Set(arten);
  if(einzig.size > 1) return 'gemessen und von Hand';
  return { test: 'aus dem Test', hand: 'von Hand', unbekannt: 'Herkunft nicht vermerkt' }[arten[0]];
}

function SchwellenKarte(){
  const th = thresholds.value;
  const [f, setF] = useState({ ftp: th.ftp, lthr: th.lthr, hrmax: th.hrmax });

  const geaendert = f.ftp !== th.ftp || f.lthr !== th.lthr || f.hrmax !== th.hrmax;

  return (
    <div class="card">
      <div class="row"><span>Schwellenwerte</span><b>{herkunftKurz(th)}</b></div>
      <Zahlenfeld titel="FTP (W)" wert={f.ftp} min={1} onWert={v => setF({ ...f, ftp: v })} />
      <Zahlenfeld titel="LTHR (bpm)" wert={f.lthr} min={1} onWert={v => setF({ ...f, lthr: v })} />
      <Zahlenfeld titel="HFmax (bpm)" wert={f.hrmax} min={1} onWert={v => setF({ ...f, hrmax: v })} />

      <div class="buttons">
        <button class="btn" disabled={!geaendert}
          onClick={() => setThresholds(schwellenVonHand(th, { ftp: f.ftp, lthr: f.lthr, hrmax: f.hrmax }))}>
          Übernehmen</button>
        <button class="btn secondary" onClick={() => gotoTab('test', true)}>Zum Schwellentest</button>
      </div>

      {/* Je Wert, woher er kommt. Ein Wert ohne Vermerk stammt aus der Zeit
          vor dieser Anzeige; geraten wird nicht, er sagt es selbst. */}
      {SCHWELLEN_FELDER.some(k => th[k] > 0) && (
        <>
          <div class="listhead">Herkunft</div>
          {SCHWELLEN_FELDER.map(k => (
            <div class="listrow" key={k}>
              <span>{FELDNAMEN[k]}</span>
              <span>{th[k] > 0
                ? th[k] + ' ' + EINHEIT[k] + ' · ' + (herkunftText(quelleVon(th, k)) || 'nicht vermerkt')
                : 'nicht gesetzt'}</span>
            </div>
          ))}
        </>
      )}

      <p class="hint">
        Was hier steht, gilt: die drei Zahlen tragen ab sofort alle Zonen – die Pulsbänder
        ab Woche {plan.value.cogganFromWeek}, die Wattzonen sofort. Vermerkt wird nur, dass
        sie von Hand kommen; ein späterer Test überschreibt sie wieder mit dem, was er misst.
        Die Testhistorie bleibt unberührt: eine getippte Zahl ist keine Messung und gehört
        nicht in eine Reihe, die auf einen identischen Ablauf geprüft wird. Ein gefahrener Test
        gehört unter „Schwellentest“ in die Ansicht <b>Ergebnis</b> – dort fallen FTP und LTHR
        aus Ø-Watt und Ø-Puls, und der Eintrag trägt Protokoll, Kadenz und RPE mit.
      </p>
      <p class="hint">
        FTP = Ø-Watt der 20 min × {String(FTP_FAKTOR).replace('.', ',')}, LTHR = Ø-Puls der 20 min.
        Dieselben Werte gehören in
        intervals.icu unter Settings → Ride, Power Zones und HR Zones auf Coggan, Load Priority
        auf Power, FTP von automatisch auf manuell.
      </p>
      {testLog.value.length > 1 && <Verlauf eintraege={testLog.value} />}
      <Testhistorie eintraege={testLog.value} />
    </div>
  );
}

/* Ein Wert mit Regel, dazu die Notiz, die ihn erklaert.

   Hier stand bis zum 04.09.2026 auch ein RPE je Einheit. Es hatte keinen
   Auftrag: der Trainingsplan verlangt Empfinden an zwei Stellen, und beide
   sind woanders verankert - das RPE der letzten fuenf Testminuten als
   Guetepruefung im Testformular, und der Sprechtest als oberste Instanz fuer
   Z2, erhoben als Puls und nicht als Zahl von eins bis zehn. Auch Coggan
   braucht es nicht: dort sind FTP und LTHR die Eingaben, und die RPE-Spalte
   der Zonentabelle ist beschreibend - sie sagt, wie sich eine Zone anfuehlen
   soll, damit man sie ohne Messgeraet findet. Eine Ausgabe des Modells, keine
   Eingabe.

   Dazu kam ein Fehler in der Reihe selbst: Z2-Fahrt und Intervalltag landeten
   in einer Kurve, ohne dass die Einheit mitgespeichert wurde. Ein Ausschlag
   nach oben hiess dort nicht "schlechte Form", sondern "das war ein
   Donnerstag". Bereits gespeicherte Eintraege behalten ihren rpe-Schluessel;
   die Sicherung reicht ihn unveraendert durch. */
function ErhebungsKarte(){
  const p = plan.value, th = thresholds.value, w = week.value;
  const [f, setF] = useState({ talk: null, note: '' });
  const log = interimLog.value;

  /* Der Vergleich mit der Z2-Obergrenze liegt in domain/test.js: er ist Punkt
     6 der Checkliste nach jedem Test und zaehlt nur, was seit dem letzten Test
     erhoben wurde - davor galten andere Baender. */
  const z2 = zoneBand(p, th, 'z2', w);
  const bezug = sprechtestBezug(log, testLog.value, z2);
  const leer = !(f.talk > 0) && !f.note.trim();

  async function eintragen(){
    if(leer) return;
    const heute = toMidnight(new Date());
    await addInterimEntry({
      day: isoDayLocal(heute),
      week: weekNumberFor(heute, startDate.value),
      talkHr: f.talk > 0 ? f.talk : null,
      note: f.note.trim()
    });
    setF({ talk: null, note: '' });
  }

  return (
    <div class="card">
      <div class="row"><span>Sprechtest-Erhebung</span>
        <b>{log.length ? log.length + (log.length === 1 ? ' Eintrag' : ' Einträge') : 'noch nichts erfasst'}</b></div>
      <Zahlenfeld titel="Sprechtest-Puls (bpm)" wert={f.talk} min={1}
        onWert={v => setF({ ...f, talk: v })} />
      {/* Der Platzhalter nennt nur noch, was die App nicht selbst herleitet.
          Er nannte "Wind, Knie, Strecke" - und Wind und Strecke rechnet das
          Fazit aus der Aufzeichnung genauer aus, als man sie tippen kann:
          Gegenwindanteil, Hoehenmeter, hm/km, steilster Abschnitt. Uebrig
          bleibt, was in keiner Datei steht. */}
      <Textfeld titel="Notiz" wert={f.note} platzhalter="Knie, Schlaf, Erkältung, Rad"
        onWert={v => setF({ ...f, note: v })} />
      <button class="btn block" disabled={leer} onClick={eintragen}>Eintragen</button>
      <p class="hint">
        Sprechtest: nach Atmung fahren. Sobald ganze Sätze anstrengend werden, Puls ablesen und
        hier notieren – nicht umgekehrt. Die Notiz gehört zu genau diesem Wert: sie steht
        in der Analyse am angetippten Punkt der Kurve und sagt dort, warum er so liegt.
      </p>
      {bezug && (
        <p class={'hint ' + (bezug.zuHoch ? 'warn' : 'good')}>
          Ø Sprechtest-Puls {bezug.schnitt} bpm aus {bezug.anzahl}{' '}
          {bezug.anzahl === 1 ? 'Erhebung' : 'Erhebungen'}
          {bezug.seit ? ' seit dem Test vom ' + datumText(dayFromIso(bezug.seit)) : ''},
          Z2-Obergrenze {bezug.max} bpm.{' '}
          {bezug.zuHoch
            ? 'Mehr als ' + bezug.abstand + ' bpm darunter – Z2 gehört nach unten begrenzt. '
              + 'Das ist Punkt 6 der Checkliste nach dem Test: der Sprechtest sticht die Zahl.'
            : 'Die Bänder passen zur Atmung.'}
        </p>
      )}
      {log.slice(-4).reverse().map((e, i) => (
        <div class="listrow datum" key={i}>
          <span>{e.day}{e.week ? ' · W' + e.week : ''}</span>
          <span>{e.talkHr ? 'Sprechtest ' + e.talkHr + ' bpm' : '–'}{e.note ? ' · ' + e.note : ''}</span>
        </div>
      ))}
    </div>
  );
}

export function ZonenTab(){
  return (
    <>
      <ZonenKarte />
      <SchwellenKarte />
      <ErhebungsKarte />
    </>
  );
}
