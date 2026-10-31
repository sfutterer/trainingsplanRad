/* Die Messwerte: eine Liste mit Datum, aus der die geltenden Schwellenwerte
   fallen.

   Bis zum 31.10.2026 gab es zwei Speicher fuer dieselbe Sache. In
   `training-thresholds` standen die drei geltenden Zahlen samt einem Vermerk
   je Wert, ob er gemessen oder getippt worden war; in `test-history` standen
   die Tests. Wer eine Zahl von Hand aenderte, ueberschrieb sie - die alte war
   danach weg, ohne Datum, ohne Spur. Das Eingabefeld sah deshalb aus wie eine
   Einstellung und nicht wie eine Messung, und die Frage "seit wann rechnet die
   App mit 223 W" liess sich nicht beantworten.

   Jetzt gibt es eine Liste. Jeder Eintrag ist ein Messwert mit einem Datum und
   einer Art:

     test   ein Schwellentest - Ø-Watt und Ø-Puls der 20 Minuten, daraus FTP
            und LTHR, dazu Kadenz, RPE, Gewicht, Bedingungen und das
            Protokoll, gegen das der Trainingsplan die Vergleichbarkeit prueft
     hand   ein eingetragener Wert - FTP, LTHR oder HFmax, so wie er gilt,
            mit einer Notiz, woher er kommt (eFTP, Garmin, Korrektur)

   Was gilt, wird daraus gerechnet und nicht gespeichert: je Feld gewinnt der
   juengste Eintrag, der es nennt. Damit beantwortet die Liste von selbst, was
   vorher eine Sonderregel war - ein berichtigter alter Test ueberschreibt
   keinen neueren Wert, weil er aelter ist, und nicht, weil eine Vergleichsregel
   das abfaengt.

   Zwei Eintraege am selben Tag sind erlaubt: ein Test und eine Korrektur
   danach. Deshalb traegt der Schluessel die Art mit. */

import { kurzTag, tagNr } from './week.js';
import { zahl } from './zahlen.js';
import { z2WattBand, zoneBand, prozentBand } from './zones.js';

export const WERTFELDER = ['ftp', 'lthr', 'hrmax'];

export const ART_TEST = 'test';
export const ART_HAND = 'hand';

const n = v => (Number.isFinite(v) && v > 0 ? Math.round(v) : null);

export function istTest(e){ return !!e && e.art !== ART_HAND; }

/* Der Schluessel eines Eintrags. Tag und Art, damit die Korrektur am Testtag
   den Test nicht ersetzt. Ohne Datum - ein uebernommener Bestandswert, dessen
   Zeitpunkt nie vermerkt wurde - gibt es genau einen Platz. */
export function messwertId(tagIso, art){
  return (tagIso || 'bestand') + '/' + (art === ART_HAND ? ART_HAND : ART_TEST);
}

/* Ein Eintrag in seine feste Form. Unbekannte Felder bleiben stehen: ein
   Testeintrag traegt Kadenz, RPE und Bedingungen, und die gehen niemanden
   hier etwas an.

   Eintraege aus der Zeit vor dieser Liste haben weder `art` noch `id` - sie
   sind Tests, denn etwas anderes gab es in diesem Speicher nicht. */
export function normalisiere(e){
  if(!e || typeof e !== 'object') return null;
  const art = e.art === ART_HAND ? ART_HAND : ART_TEST;
  const day = typeof e.day === 'string' && e.day ? e.day : null;
  const werte = {};
  for(const f of WERTFELDER) werte[f] = n(e[f]);
  return { ...e, ...werte, art, day, id: e.id || messwertId(day, art) };
}

/* Aelteste zuerst. Am selben Tag gilt der Handeintrag als der spaetere: er ist
   die Korrektur des Tests und nicht seine Vorlage. Ein Eintrag ohne Datum ist
   der aelteste von allen - er stammt aus der Zeit, in der nichts mitgeschrieben
   wurde. */
export function sortiere(liste){
  return (liste || []).map(normalisiere).filter(Boolean).sort((a, b) => {
    if(a.day !== b.day){
      if(!a.day) return -1;
      if(!b.day) return 1;
      return a.day < b.day ? -1 : 1;
    }
    if(a.art === b.art) return 0;
    return a.art === ART_TEST ? -1 : 1;
  });
}

/* Was gerade gilt, und woher es kommt.

   Die Form ist dieselbe wie die des alten Speichers - drei Zahlen und ein
   Vermerk je Feld -, damit alles, was daran haengt (Zonen, Tageskarten,
   Analyse, Timer), unveraendert weiterrechnet. Neu ist nur, dass niemand sie
   mehr setzt: sie faellt aus der Liste. */
export function geltendeSchwellen(liste){
  const werte = { ftp: null, lthr: null, hrmax: null };
  const quellen = {};
  for(const e of sortiere(liste)){
    for(const f of WERTFELDER){
      if(e[f] == null) continue;
      werte[f] = e[f];
      quellen[f] = { art: e.art, tag: e.day, id: e.id };
    }
  }
  return { ...werte, quellen };
}

/* Der Eintrag, der ein Feld gerade traegt. */
export function eintragFuer(liste, feld){
  const sortiert = sortiere(liste);
  for(let i = sortiert.length - 1; i >= 0; i--) if(sortiert[i][feld] != null) return sortiert[i];
  return null;
}

/* Die Werte, die vor einem bestimmten Eintrag galten. Grundlage des Vergleichs
   "was hat die letzte Messung geaendert". */
export function schwellenVor(liste, id){
  const sortiert = sortiere(liste);
  const i = sortiert.findIndex(e => e.id === id);
  return geltendeSchwellen(i < 0 ? sortiert : sortiert.slice(0, i));
}

/* ---- Verlauf ----

   Eine Reihe fuer den Graphen: die Aenderung gegen den ersten Wert in Prozent,
   der absolute Wert als Zusatz am Punkt.

   Prozent und nicht die Rohzahl, weil FTP, LTHR und Gewicht sonst drei
   Groessenordnungen auf einer Achse waeren. Lag bis zum 31.10.2026 als
   prozentReihe im Zonen-Tab und kannte dort nur die Testeintraege - ein von
   Hand gesetzter Wert fehlte in der Kurve, obwohl mit ihm gerechnet wurde. */
export function reihe(liste, feld, einheit, nachkomma){
  const echte = sortiere(liste).filter(e => e[feld] != null && e.day);
  if(echte.length < 2) return null;
  const erster = echte[0][feld];
  return {
    erster, letzter: echte[echte.length - 1][feld],
    punkte: echte.map(e => ({
      t: tagNr(e.day),
      v: (e[feld] - erster) / erster * 100,
      marke: kurzTag(e.day),
      zusatz: zahl(e[feld], nachkomma || 0) + ' ' + einheit
    }))
  };
}

/* ---- Was die letzte Messung geaendert hat ----

   Die Zahl allein sagt wenig: 223 statt 192 W ist erst dann eine Aussage,
   wenn danebensteht, dass Z2 damit bei 123-167 statt 106-144 W liegt und die
   Schwellenbloecke der Phase 4 bei 201-212 statt 173-182 W.

   Gerechnet wird gegen den Stand davor, nicht gegen den vorigen Eintrag: wer
   eine HFmax eintraegt, aendert an FTP und LTHR nichts, und dann steht hier
   auch nichts darueber.

   Die Folgen kommen als Paare und nicht als Satz - der Text gehoert in die
   Oberflaeche, die Rechnung hierher. */
function bandText(b){ return b ? b.min + '–' + b.max + ' W' : null; }
function pulsText(b){ return b ? b.min + '–' + b.max + ' bpm' : null; }

function folge(titel, von, auf){
  return von === auf || (!von && !auf) ? null : { titel, von: von || '–', auf: auf || '–' };
}

export function konsequenz(plan, liste, woche){
  const sortiert = sortiere(liste);
  const juengster = sortiert[sortiert.length - 1];
  if(!juengster) return null;

  const jetzt = geltendeSchwellen(sortiert);
  const davor = schwellenVor(sortiert, juengster.id);

  const felder = WERTFELDER
    .filter(f => jetzt[f] != null && jetzt[f] !== davor[f])
    .map(f => ({ feld: f, von: davor[f], auf: jetzt[f],
                 diff: davor[f] == null ? null : jetzt[f] - davor[f] }));

  const folgen = [];
  if(jetzt.ftp !== davor.ftp){
    folgen.push(folge('Z2 in Watt', bandText(z2WattBand(plan, davor)), bandText(z2WattBand(plan, jetzt))));
    folgen.push(folge('Schwellenblöcke Phase 4 (90–95 %)',
      bandText(prozentBand(plan, davor, '90–95 % FTP')),
      bandText(prozentBand(plan, jetzt, '90–95 % FTP'))));
    folgen.push(folge('Erhaltungsreiz (112–116 %)',
      bandText(prozentBand(plan, davor, '112–116 % FTP')),
      bandText(prozentBand(plan, jetzt, '112–116 % FTP'))));
  }
  if(jetzt.lthr !== davor.lthr){
    folgen.push(folge('Z2 im Puls',
      pulsText(zoneBand(plan, davor, 'z2', Math.max(woche, plan.cogganFromWeek))),
      pulsText(zoneBand(plan, jetzt, 'z2', Math.max(woche, plan.cogganFromWeek)))));
  }

  return {
    eintrag: juengster,
    felder,
    folgen: folgen.filter(Boolean),
    /* Die Pulsbaender des Plans gelten erst ab einer Woche - eine frisch
       gemessene LTHR aendert bis dahin nichts an ihnen. Das ist die Frage, die
       am Testtag jeder stellt. */
    pulsAbWoche: jetzt.lthr != null && woche < plan.cogganFromWeek ? plan.cogganFromWeek : null
  };
}

/* ---- Uebernahme des alten Speichers ----

   Die Tests stehen schon in der Liste. Was fehlt, ist der Wert, den jemand von
   Hand gesetzt hat: er lebte nur in `training-thresholds`, und ohne diese
   Uebernahme waere er beim ersten Start nach dem Umbau verschwunden - samt
   einer HFmax, die ein Test ueberhaupt nicht liefert.

   Die Bedingung, an der sich die Uebernahme messen lassen muss: danach gilt
   genau das, was vorher galt. Nicht ungefaehr, sondern Wert fuer Wert - wer
   die App nach dem Update oeffnet, darf keine andere Zone sehen als am Abend
   davor.

   In zwei Schritten:

   1  Werte von Hand mit Eingabedatum werden ein Eintrag an diesem Tag.

   2  Was danach noch abweicht, wird so eingetragen, dass es gilt. Das betrifft
      vor allem Werte ohne Eingabedatum - so speicherte die App bis zum
      12.09.2026, und die von Hand gesetzte LTHR 163 jenes Tages ist genau so
      ein Fall. Die erste Fassung dieser Uebernahme legte sie ohne Datum an den
      Anfang der Liste; der Test vom 10.09. mit 152 war damit juenger und
      gewann. Gefunden durch die Pruefung gegen alle Datenformen der
      Vorversion (test/messwerte.test.js), nicht durch Zufall.

      Das Datum, das ein solcher Eintrag bekommt, ist der Tag des juengsten
      Eintrags der Liste. Das ist keine Erfindung, sondern eine Untergrenze: in
      der Vorversion ueberschrieb jeder neu gespeicherte Test einen
      undatierten Handwert. Steht die Handzahl noch im Speicher, wurde sie nach
      dem juengsten Test gesetzt. Am selben Tag gewinnt der Handeintrag (siehe
      sortiere), also gilt er - wie vorher.

   Die Notiz sagt, dass das Datum erschlossen ist. Eine Zahl, deren Herkunft
   geraten aussieht, ist schlimmer als eine, die sagt, was man weiss.

   Zweimal aufgerufen aendert sich nichts mehr: beim zweiten Mal gilt schon,
   was gelten soll. Der alte Speicher wird nach der ersten Uebernahme ohnehin
   geleert (state/store.js), damit ein spaeter geloeschter Wert nicht beim
   naechsten Start zurueckkommt. */
export function uebernimmSchwellen(liste, alt){
  let ergebnis = sortiere(liste);
  if(!alt) return ergebnis;

  /* 1 - mit Eingabedatum. Drei Werte vom selben Tag sind eine Eingabe. */
  const datiert = new Map();
  for(const f of WERTFELDER){
    const v = n(alt[f]);
    if(v == null) continue;
    const q = alt.quellen && alt.quellen[f];
    if(!(q && q.art === ART_HAND && typeof q.seit === 'string')) continue;
    const tag = q.seit.slice(0, 10);
    const id = messwertId(tag, ART_HAND);
    if(ergebnis.some(e => e.id === id)) continue;
    const e = datiert.get(id) || { id, art: ART_HAND, day: tag,
      note: 'aus dem früheren Schwellenspeicher übernommen' };
    e[f] = v;
    datiert.set(id, e);
  }
  if(datiert.size) ergebnis = sortiere(ergebnis.concat([...datiert.values()]));

  /* 2 - was jetzt noch abweicht, so eintragen, dass es gilt. */
  const gilt = geltendeSchwellen(ergebnis);
  const offen = WERTFELDER.filter(f => n(alt[f]) != null && gilt[f] !== n(alt[f]));
  if(!offen.length) return ergebnis;

  const tage = ergebnis.map(e => e.day).filter(Boolean);
  const tag = tage.length ? tage[tage.length - 1] : null;
  const id = messwertId(tag, ART_HAND);
  const vorhanden = ergebnis.find(e => e.id === id);
  const eintrag = vorhanden ? { ...vorhanden } : {
    id, art: ART_HAND, day: tag,
    note: tag ? 'aus dem früheren Schwellenspeicher übernommen – Eingabedatum '
                + 'unbekannt, gilt spätestens seit diesem Tag'
              : 'aus dem früheren Schwellenspeicher übernommen'
  };
  for(const f of offen) eintrag[f] = n(alt[f]);
  return sortiere(ergebnis.filter(e => e.id !== id).concat([eintrag]));
}

/* ---- Vorbelegung eines neuen Eintrags ----

   Der letzte Testtermin, der nicht in der Zukunft liegt. Wer einen Messwert
   eintraegt, kommt in aller Regel von genau diesem Tag - und tippt sonst ein
   Datum ab, das zwei Bildschirme weiter steht.

   `termine` sind die Testtermine des Plans als ISO-Tage, aufsteigend. Gibt es
   keinen vergangenen, gilt heute: ein Wert aus einer anderen Quelle haengt an
   keinem Testtermin. */
export function vorbelegtesDatum(termine, heuteIso){
  const vergangen = (termine || []).filter(t => t && t <= heuteIso);
  return vergangen.length ? vergangen[vergangen.length - 1] : heuteIso;
}

/* Ob zu einem Tag schon ein Eintrag der Art existiert - die Ergebnisansicht
   fragt danach, um "Ändern" statt "Speichern" zu schreiben. */
export function findeMesswert(liste, id){
  return sortiere(liste).find(e => e.id === id) || null;
}

/* Die Beschriftung eines Eintrags in einer Zeile: was er traegt, ohne das,
   was er nicht traegt. */
export function werteText(e){
  if(!e) return '';
  return WERTFELDER
    .filter(f => e[f] != null)
    .map(f => ({ ftp: 'FTP ' + e.ftp + ' W', lthr: 'LTHR ' + e.lthr + ' bpm',
                 hrmax: 'HFmax ' + e.hrmax + ' bpm' })[f])
    .join(' · ');
}
