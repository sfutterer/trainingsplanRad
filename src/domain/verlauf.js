/* Historische Leistungsanalyse: Reihen ueber die Wochen, jede mit einer
   Richtung und mit der Angabe, ob sie ueberhaupt schon etwas hergibt.

   Eigene Datei statt Anbau an analysis.js. Dort sieht jede Funktion genau
   einen Tag und vergleicht ihn mit dem Plan; hier lautet die Frage, was ueber
   Wochen passiert. Zusammengelegt waeren aus 741 Zeilen weit ueber tausend
   geworden, ohne dass eine Zeile der einen Frage der anderen dient.

   Die Steigung kommt ueberall aus Theil-Sen, wie beim Gewichtstrend weiter
   oben in analysis.js, und aus demselben Grund: bei einer Ausgleichsgeraden
   haben die Randpunkte die groesste Hebelwirkung, und der juengste Punkt ist
   immer ein Rand. Eine einzige Ausfahrt bei Hitze, Gegenwind oder mit dem
   Gepaecktraeger kippt damit die Aussage ueber acht Wochen. Der Median aller
   paarweisen Steigungen wandert erst, wenn rund ein Viertel der Punkte
   danebenliegt.

   Vor jeder Aussage steht eine Bremse. Ein Trend aus zwei Fahrten ueber zehn
   Tage ist keine Leistungsentwicklung, sondern Wetter - und weil der Plan erst
   seit wenigen Wochen laeuft, ist genau das der Normalfall. Deshalb liefert
   jede Reihe entweder eine Richtung oder den Satz, was ihr fehlt und ab wann
   sie etwas sagen wird. Eine Luecke ist harmlos; eine Zahl, die wie eine
   Messung aussieht und keine ist, kostet Trainingsentscheidungen.

   Alles rein: keine Signals, kein fetch, kein Date.now(). Die Daten kommen als
   Parameter herein, damit sich jede Aussage mit einer synthetischen Reihe
   nachpruefen laesst. */

import { anIsRide } from './analysis.js';

/* Schwellen und Fenster stehen hier und nicht in plan.json: das ist
   Auswertungspolitik der App, kein Trainingsplan. */
export const VERLAUF = {
  minPunkte: 4,
  minWochen: 3,
  /* Der Effizienzfaktor lebt von der Vergleichbarkeit. Unter 45 min ist eine
     Fahrt ueberwiegend Anfahrt und Ampeln, und ein Puls ausserhalb des
     Z2-Fensters heisst, dass die Fahrt eine andere war. */
  ef: { minSec: 45 * 60, lthr: [0.60, 0.85], hrmax: [0.55, 0.78],
        flachProzent: 1, dauerSpreizung: 3, pulsSpanne: 12 },
  /* Entkopplung wird erst auf der langen Fahrt aussagekraeftig - auf einer
     Stunde entkoppelt fast nichts, auch bei schlechter Grundlage. */
  entkopplung: { minSec: 75 * 60, flachAbsolut: 0.2, gut: 5 },
  test: { minPunkte: 3, minWochen: 4, flachProzent: 0.5 },
  interim: { minPunkte: 4, minWochen: 3 },
  umfang: { flachProzent: 3, quoteFlach: 1, rahmen: 0.15 },
  zonen: { flachProzent: 3, anteilFlach: 1 },
  rumpf: { flachAbsolut: 0.1 }
};

/* ---------- Kalender und Zahlen ---------- */

/* Auf dem ISO-String rechnen, nicht auf Date: die Eintraege kommen als
   "JJJJ-MM-TT", und ein lokales Date daraus zu bauen verschiebt bei
   Sommerzeitwechseln den Tag. Dieselbe Entscheidung wie beim Wellnessteil. */
export function tagNr(iso){
  const t = String(iso || '').slice(0, 10).split('-').map(Number);
  if(t.length !== 3 || t.some(v => !Number.isFinite(v))) return null;
  return Math.round(Date.UTC(t[0], t[1] - 1, t[2]) / 86400000);
}

export function wochenNummer(iso, startIso){
  const a = tagNr(iso), b = tagNr(startIso);
  if(a === null || b === null) return null;
  return Math.floor((a - b) / 7) + 1;
}

export function kurzTag(iso){
  const s = String(iso || '').slice(0, 10);
  return s.length === 10 ? s.slice(8, 10) + '.' + s.slice(5, 7) + '.' : s;
}

export function zahl(v, nk){
  const n = nk == null ? 2 : nk;
  if(!Number.isFinite(v)) return '–';
  return (Math.round(v * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n).replace('.', ',');
}

function median(v){
  const s = v.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function sauber(punkte){
  return (punkte || [])
    .filter(p => p && Number.isFinite(p.t) && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t);
}

/* ---------- Steigung ---------- */

/* Median aller paarweisen Steigungen, dazu die beiden Medianwerte als Anker.
   Der Anker wird gebraucht, weil die Gerade gezeichnet werden soll: durch
   (Median der Zeitpunkte, Median der Werte) legt sie sich robust in die Punkte,
   ohne dass ein Achsenabschnitt aus den Randpunkten geschaetzt werden muss. */
export function theilSen(punkte){
  const p = sauber(punkte);
  if(p.length < 2) return null;
  const steigungen = [];
  for(let i = 0; i < p.length; i++){
    for(let j = i + 1; j < p.length; j++){
      const dt = p[j].t - p[i].t;
      if(dt > 0) steigungen.push((p[j].v - p[i].v) / dt);
    }
  }
  if(!steigungen.length) return null;
  return {
    proTag: median(steigungen),
    mitte: median(p.map(x => x.v)),
    tMitte: median(p.map(x => x.t)),
    n: p.length,
    tage: p[p.length - 1].t - p[0].t,
    erster: p[0],
    letzter: p[p.length - 1]
  };
}

/* Die eine Aussage, die jeder Indikator braucht: Richtung, Groessenordnung je
   Woche und - wichtiger - ob man das ueberhaupt sagen darf.

   Zwei Rauschgrenzen zur Wahl. flachProzent fuer Groessen, deren Aenderung nur
   relativ zu sich selbst Sinn ergibt (Watt je Schlag, Minuten), flachAbsolut
   fuer Groessen, die schon in Prozentpunkten gemessen werden (Entkopplung,
   Z2-Anteil) - dort waere ein Prozentsatz eines Prozentsatzes nur verwirrend. */
export function trendAus(punkte, opts){
  const o = opts || {};
  const p = sauber(punkte);
  const minP = o.minPunkte || VERLAUF.minPunkte;
  const minW = o.minWochen == null ? VERLAUF.minWochen : o.minWochen;
  const nk = o.nachkomma == null ? 2 : o.nachkomma;
  const einheit = o.einheit || '';
  const tage = p.length > 1 ? p[p.length - 1].t - p[0].t : 0;
  const wochen = tage / 7;

  const basis = {
    n: p.length, tage, wochen, einheit, nachkomma: nk,
    belastbar: false, richtung: null, urteil: null,
    proWoche: null, prozentProWoche: null, mitte: null, tMitte: null,
    aussage: null, grund: null
  };

  if(p.length < minP){
    return Object.assign(basis, { grund:
      'Noch keine belastbare Aussage: ' + p.length +
      (p.length === 1 ? ' Messpunkt' : ' Messpunkte') + ' von ' + minP + ' nötigen. ' +
      'Ab ' + minP + ' Punkten über ' + minW + ' Wochen steht hier eine Richtung.' });
  }
  if(wochen < minW){
    return Object.assign(basis, { grund:
      'Noch keine belastbare Aussage: die Reihe deckt erst ' + zahl(wochen, 1) +
      ' Wochen ab, nötig sind ' + minW + '. Über einen kürzeren Zeitraum misst man Tagesform, keine Entwicklung.' });
  }

  const ts = theilSen(p);
  if(!ts) return Object.assign(basis, { grund: 'Alle Messpunkte liegen auf demselben Tag – daraus lässt sich keine Entwicklung lesen.' });

  const proWoche = ts.proTag * 7;
  const bezug = Math.abs(ts.mitte);
  const prozentProWoche = bezug > 0 ? proWoche / bezug * 100 : null;
  const flach = o.flachAbsolut != null
    ? Math.abs(proWoche) < o.flachAbsolut
    : (prozentProWoche === null || Math.abs(prozentProWoche) < (o.flachProzent == null ? 1 : o.flachProzent));

  const richtung = flach ? 'unveraendert' : (proWoche > 0 ? 'steigt' : 'faellt');
  const besser = o.besser || null;
  const urteil = !besser ? 'offen'
    : richtung === 'unveraendert' ? 'gleich'
    : ((richtung === 'steigt') === (besser === 'hoch') ? 'besser' : 'schlechter');

  const vz = proWoche >= 0 ? '+' : '−';
  const betrag = zahl(Math.abs(proWoche), nk) + (einheit ? ' ' + einheit : '');
  const pz = prozentProWoche === null ? '' :
    ' (' + vz + zahl(Math.abs(prozentProWoche), 1) + ' % je Woche)';
  const aussage = richtung === 'unveraendert'
    ? 'unverändert – ' + vz + betrag + ' je Woche liegt unter der Rauschgrenze'
    : (richtung === 'steigt' ? 'steigt um ' : 'fällt um ') + betrag + ' je Woche' + pz;

  return Object.assign(basis, {
    belastbar: true, richtung, urteil, proWoche, prozentProWoche,
    mitte: ts.mitte, tMitte: ts.tMitte, aussage,
    grund: null
  });
}

/* Zwei Punkte sind kein Trend, aber auch nicht nichts - zwischen zwei
   Schwellentests liegen acht Wochen, da ist der Vergleich die einzige Aussage,
   die es ueberhaupt geben kann. Sie wird als Vergleich benannt, nicht als
   Trend, damit niemand sie fuer eine Entwicklung haelt. */
export function zweiPunktVergleich(punkte, einheit, nk){
  const p = sauber(punkte);
  if(p.length < 2) return null;
  const a = p[0], b = p[p.length - 1];
  const d = b.v - a.v;
  const vz = d >= 0 ? '+' : '−';
  const pz = a.v ? Math.abs(d / a.v * 100) : null;
  return {
    von: a.v, bis: b.v, delta: d, tage: b.t - a.t,
    text: zahl(a.v, nk) + ' → ' + zahl(b.v, nk) + ' ' + einheit + ' (' + vz +
      zahl(Math.abs(d), nk) + (pz === null ? '' : ', ' + vz + zahl(pz, 1) + ' %') + ')'
  };
}

/* ---------- 1. Effizienzfaktor ---------- */

/* Das Pulsfenster, in dem eine Fahrt als Grundlagenfahrt durchgeht.

   Aus der LTHR, nicht aus der HFmax, wenn beides da ist: die LTHR ist gemessen,
   die HFmax meist nur der hoechste je aufgezeichnete Wert. Ohne beides gibt es
   kein Fenster - und dann bewusst gar keine Aussage statt einer ueber einen
   Topf aus Pendelwegen, Intervallen und Ausfahrten. */
export function effizienzFenster(th){
  const t = th || {};
  if(t.lthr > 0){
    return { min: Math.round(t.lthr * VERLAUF.ef.lthr[0]),
             max: Math.round(t.lthr * VERLAUF.ef.lthr[1]),
             quelle: 'LTHR ' + t.lthr + ' bpm' };
  }
  if(t.hrmax > 0){
    return { min: Math.round(t.hrmax * VERLAUF.ef.hrmax[0]),
             max: Math.round(t.hrmax * VERLAUF.ef.hrmax[1]),
             quelle: 'HFmax ' + t.hrmax + ' bpm' };
  }
  return null;
}

/* Leistung je Herzschlag. Mit Wattmesser die normalisierte Leistung je
   Ø-Puls, wie im Trainingsplan beschrieben, sonst die Durchschnitts-
   geschwindigkeit je Ø-Puls.

   Eine Reihe fuehrt genau eine Einheit. Waehrend der ersten Wochen kommen
   Wattwerte nur fuer manche Fahrten; die Reihen zu mischen haette bei jedem
   Wechsel einen Sprung erzeugt, den niemand als Einheitenwechsel erkennt.
   Deshalb: sobald genug Fahrten Watt haben, zaehlen nur diese. */
export function effizienzSerie(acts, th, opts){
  const o = opts || {};
  const minSec = o.minSec || VERLAUF.ef.minSec;
  const minP = o.minPunkte || VERLAUF.minPunkte;
  const fenster = effizienzFenster(th);

  const fahrten = (acts || []).filter(a => a && anIsRide(a.type));
  const verworfen = { kurz: 0, ohnePuls: 0, ausserhalb: 0, ohneWert: 0 };
  const roh = [];

  for(const a of fahrten){
    const sec = a.moving_time || a.elapsed_time || 0;
    const hf = a.average_heartrate || 0;
    if(sec < minSec){ verworfen.kurz++; continue; }
    if(!(hf > 0)){ verworfen.ohnePuls++; continue; }
    if(fenster && (hf < fenster.min || hf > fenster.max)){ verworfen.ausserhalb++; continue; }
    const watt = a.icu_weighted_avg_watts > 0 ? a.icu_weighted_avg_watts
               : (a.average_watts > 0 ? a.average_watts : 0);
    const kmh = a.distance > 0 && sec > 0 ? (a.distance / 1000) / (sec / 3600) : 0;
    if(!watt && !kmh){ verworfen.ohneWert++; continue; }
    const tag = String(a.start_date_local || '').slice(0, 10);
    const t = tagNr(tag);
    if(t === null){ verworfen.ohneWert++; continue; }
    roh.push({ id: a.id, name: a.name || a.type, tag, t, sec, hf, watt, kmh });
  }

  const mitWatt = roh.filter(r => r.watt > 0);
  const wattReihe = mitWatt.length >= minP;
  const genommen = wattReihe ? mitWatt : roh;
  const einheit = wattReihe ? 'W/bpm' : 'km/h/bpm';
  const nachkomma = 3;

  const punkte = genommen.map(r => ({
    t: r.t, v: (wattReihe ? r.watt : r.kmh) / r.hf,
    marke: kurzTag(r.tag), titel: r.name,
    zusatz: Math.round(r.sec / 60) + ' min · ⌀ ' + Math.round(r.hf) + ' bpm'
  }));

  /* Auch innerhalb des Fensters koennen die Fahrten zu verschieden sein. Eine
     Stunde Pendelweg neben vier Stunden Ausfahrt ergibt zwei Punkte, die sich
     schon aus physiologischen Gruenden unterscheiden, ohne dass sich etwas
     entwickelt haette. */
  const dauern = genommen.map(r => r.sec);
  const pulse = genommen.map(r => r.hf);
  const streuung = genommen.length ? {
    dauerVon: Math.round(Math.min(...dauern) / 60), dauerBis: Math.round(Math.max(...dauern) / 60),
    hfVon: Math.round(Math.min(...pulse)), hfBis: Math.round(Math.max(...pulse))
  } : null;
  const heterogen = !!streuung && (
    (streuung.dauerVon > 0 && streuung.dauerBis / streuung.dauerVon > VERLAUF.ef.dauerSpreizung) ||
    (streuung.hfBis - streuung.hfVon > VERLAUF.ef.pulsSpanne));

  let trend = trendAus(punkte, {
    einheit, nachkomma, besser: 'hoch',
    minPunkte: minP, flachProzent: VERLAUF.ef.flachProzent
  });

  if(!fenster){
    trend = Object.assign({}, trend, { belastbar: false, richtung: null, urteil: null, aussage: null,
      grund: 'Keine Aussage möglich: ohne LTHR oder HFmax lässt sich Z2 nicht abgrenzen. ' +
        'Die Reihe würde Pendelwege, Intervalle und Ausfahrten in einen Topf werfen. ' +
        'Der Schwellentest liefert die LTHR – danach steht hier ein Wert.' });
  }

  const regel = 'Gewertet werden nur Radfahrten ab ' + Math.round(minSec / 60) + ' min' +
    (fenster ? ' mit Ø-Puls zwischen ' + fenster.min + ' und ' + fenster.max + ' bpm (Z2-Fenster aus ' + fenster.quelle + ')' : '') +
    '. Wert: ' + (wattReihe ? 'Ø-Watt (normalisiert, wenn vorhanden) je Ø-Puls' : 'Ø-Geschwindigkeit je Ø-Puls') + '.';

  const bilanz = 'Gewertet ' + punkte.length + ' von ' + fahrten.length +
    (fahrten.length === 1 ? ' Fahrt' : ' Fahrten') +
    (verworfen.kurz ? ' · ' + verworfen.kurz + ' zu kurz' : '') +
    (verworfen.ausserhalb ? ' · ' + verworfen.ausserhalb + ' außerhalb des Pulsfensters' : '') +
    (verworfen.ohnePuls ? ' · ' + verworfen.ohnePuls + ' ohne Puls' : '') +
    (verworfen.ohneWert ? ' · ' + verworfen.ohneWert + ' ohne Watt und ohne Strecke' : '') +
    (wattReihe && roh.length > mitWatt.length ? ' · ' + (roh.length - mitWatt.length) + ' ohne Wattwert' : '') + '.';

  return {
    schluessel: 'ef', titel: 'Effizienzfaktor', einheit, nachkomma,
    punkte, trend, regel, bilanz, streuung, heterogen, fenster,
    hinweis: heterogen
      ? 'Die gewerteten Fahrten sind untereinander wenig vergleichbar (' +
        streuung.dauerVon + ' bis ' + streuung.dauerBis + ' min, ⌀-Puls ' +
        streuung.hfVon + ' bis ' + streuung.hfBis + ' bpm). Ein Teil der Streuung ist die Fahrt, nicht die Form.'
      : null
  };
}

/* ---------- 2. Aerobe Entkopplung ---------- */

/* Pa:Hf je langer Fahrt. Der Wert kommt fertig von intervals.icu.

   Selbst zu rechnen haette fuer jede Fahrt die Streams gebraucht - bei acht
   Wochen ein bis zwei Dutzend Abrufe fuer eine einzige Kurve, genau der Fehler,
   den die Detailansicht schon einmal hatte. Fehlt das Feld, steht das da,
   statt dass eine leere Kurve nach fehlendem Training aussieht. */
export function entkopplungSerie(acts, opts){
  const o = opts || {};
  const minSec = o.minSec || VERLAUF.entkopplung.minSec;
  const lang = (acts || []).filter(a => a && anIsRide(a.type) &&
    (a.moving_time || a.elapsed_time || 0) >= minSec);

  const punkte = [];
  for(const a of lang){
    const d = a.decoupling;
    if(!Number.isFinite(d)) continue;
    const tag = String(a.start_date_local || '').slice(0, 10);
    const t = tagNr(tag);
    if(t === null) continue;
    punkte.push({ t, v: d, marke: kurzTag(tag), titel: a.name || a.type,
      zusatz: Math.round((a.moving_time || a.elapsed_time || 0) / 60) + ' min' });
  }

  let trend = trendAus(punkte, {
    einheit: '%-Punkte', nachkomma: 2, besser: 'niedrig',
    flachAbsolut: VERLAUF.entkopplung.flachAbsolut
  });

  const fehltFeld = lang.length > 0 && punkte.length === 0;
  if(fehltFeld){
    trend = Object.assign({}, trend, { grund:
      'intervals.icu liefert für diese ' + lang.length + ' langen Fahrten keinen Decoupling-Wert. ' +
      'Er entsteht dort erst mit Wattmesser oder aus dem Pulsverlauf einer durchgehend ' +
      'gleichmäßigen Fahrt – bis dahin bleibt dieser Indikator leer.' });
  }

  const niveau = punkte.length ? median(punkte.map(p => p.v)) : null;
  return {
    schluessel: 'entkopplung', titel: 'Aerobe Entkopplung', einheit: '%', nachkomma: 1,
    punkte, trend, fehltFeld, niveau, langeFahrten: lang.length,
    regel: 'Nur Fahrten ab ' + Math.round(minSec / 60) + ' min. Pa:Hf von intervals.icu, ' +
      'ein Wert je Fahrt. Bis 5 % trägt die Grundlage diese Dauer.',
    hinweis: niveau === null ? null
      : niveau <= VERLAUF.entkopplung.gut
        ? 'Median ' + zahl(niveau, 1) + ' % – die Grundlage trägt diese Dauer.'
        : 'Median ' + zahl(niveau, 1) + ' % – über 5 %. Entweder ist die Dauer noch zu lang für die Grundlage, oder die Fahrten waren zu hart.'
  };
}

/* ---------- 3. Schwellentests und Zwischenkontrollen ---------- */

function logReihe(liste, feld, zusatz){
  return (liste || [])
    .filter(e => e && e.day && e[feld] > 0)
    .map(e => ({ t: tagNr(e.day), v: e[feld], marke: kurzTag(e.day),
                 titel: e.week ? 'Woche ' + e.week : e.day,
                 zusatz: zusatz ? zusatz(e) : null }))
    .filter(p => p.t !== null)
    .sort((a, b) => a.t - b.t);
}

/* Die Tests sind der harte Anker, die Zwischenkontrollen die weiche Gegenprobe.
   Getrennt gefuehrt und getrennt bewertet: drei Tests in sechzehn Wochen
   koennen die Punktzahl der anderen Reihen nie erreichen, also gilt fuer sie
   eine eigene Untergrenze - sonst haette der wichtigste Wert des Plans
   dauerhaft "keine Aussage" dagestanden. */
export function testSerie(testLog, interimLog){
  const tests = (testLog || []).slice().sort((a, b) => (a && b && a.day < b.day ? -1 : 1));
  const bed = { minPunkte: VERLAUF.test.minPunkte, minWochen: VERLAUF.test.minWochen,
                flachProzent: VERLAUF.test.flachProzent, besser: 'hoch' };

  const bauen = (feld, einheit, nk) => {
    const punkte = logReihe(tests, feld);
    return {
      punkte, einheit, nachkomma: nk,
      trend: trendAus(punkte, Object.assign({ einheit, nachkomma: nk }, bed)),
      vergleich: punkte.length >= 2 ? zweiPunktVergleich(punkte, einheit, nk) : null
    };
  };

  const sprechtest = logReihe(interimLog, 'talkHr');
  const rpe = logReihe(interimLog, 'rpe');

  return {
    schluessel: 'tests', titel: 'Schwellentests',
    ftp: bauen('ftp', 'W', 0),
    lthr: bauen('lthr', 'bpm', 0),
    w20: bauen('w20', 'W', 0),
    /* Kein Besser oder Schlechter: der Sprechtestpuls steigt auch, wenn die
       Baender zu eng liegen, und faellt auch bei Muedigkeit. Er ist eine
       Gegenprobe zu den Baendern, kein Leistungsmass. */
    sprechtest: {
      punkte: sprechtest, einheit: 'bpm', nachkomma: 0,
      trend: trendAus(sprechtest, { einheit: 'bpm', nachkomma: 1,
        minPunkte: VERLAUF.interim.minPunkte, minWochen: VERLAUF.interim.minWochen,
        flachAbsolut: 0.5 })
    },
    rpe: {
      punkte: rpe, einheit: 'RPE', nachkomma: 1,
      trend: trendAus(rpe, { einheit: 'Punkte', nachkomma: 2,
        minPunkte: VERLAUF.interim.minPunkte, minWochen: VERLAUF.interim.minWochen,
        flachAbsolut: 0.1 })
    },
    anzahl: tests.length,
    regel: 'FTP und LTHR aus der Testhistorie, Sprechtest-Puls und RPE aus den ' +
      'Zwischenkontrollen. Beides wird im Tab „Zonen“ eingetragen und liegt nur auf diesem Gerät.'
  };
}

/* ---------- 4. Wochenumfang Soll gegen Ist ---------- */

/* Die Wochenzeilen kommen aus anWeekTotals, damit Soll und Ist genau so
   gerechnet sind wie in der Wochenkarte darunter. Eine zweite Rechnung waere
   der sichere Weg zu zwei Zahlen fuer dieselbe Woche. */
export function umfangSerie(wochen){
  const zeilen = (wochen || []).filter(w => w && Number.isFinite(w.week))
    .slice().sort((a, b) => a.week - b.week);

  const punkte = zeilen.map(w => {
    const istMin = Math.round((w.istSec || 0) / 60);
    const sollMin = w.sollMin || 0;
    return {
      woche: w.week, t: w.week * 7, v: istMin, istMin, sollMin,
      quote: sollMin ? istMin / sollMin * 100 : null,
      marke: 'W' + w.week, titel: 'Woche ' + w.week,
      zusatz: sollMin ? 'Soll ' + sollMin + ' min' : 'ohne Sollwert'
    };
  });
  const sollPunkte = punkte.filter(p => p.sollMin > 0)
    .map(p => ({ t: p.t, v: p.sollMin, marke: p.marke, titel: p.titel }));
  const mitIst = punkte.filter(p => p.istMin > 0);

  const trend = trendAus(mitIst, { einheit: 'min', nachkomma: 0, besser: 'hoch',
    flachProzent: VERLAUF.umfang.flachProzent });
  const quotePunkte = mitIst.filter(p => p.quote !== null).map(p => ({ t: p.t, v: p.quote }));
  const quoteTrend = trendAus(quotePunkte, { einheit: '%-Punkte', nachkomma: 1,
    besser: 'hoch', flachAbsolut: VERLAUF.umfang.quoteFlach });

  const bewertet = mitIst.filter(p => p.quote !== null);
  const imRahmen = bewertet.filter(p => Math.abs(p.quote - 100) <= VERLAUF.umfang.rahmen * 100).length;

  return {
    schluessel: 'umfang', titel: 'Wochenumfang Soll gegen Ist', einheit: 'min', nachkomma: 0,
    punkte, sollPunkte, trend, quoteTrend,
    wochenMitDaten: mitIst.length,
    konsistenz: bewertet.length
      ? { wochen: bewertet.length, imRahmen,
          text: imRahmen + ' von ' + bewertet.length + ' Wochen im Rahmen von ±15 % um den Sollwert.' }
      : null,
    regel: 'Ist ist die gefahrene Zeit der Woche einschließlich optionaler Fahrten, ' +
      'Soll die Summe der geplanten Radminuten. Ohne Konsistenz sagt jede Leistungskurve darüber nichts.',
    hinweis: mitIst.length === 0
      ? 'Für keine Woche liegen aufgezeichnete Fahrzeiten vor – ohne intervals.icu steht hier nur der Sollwert.'
      : null
  };
}

/* ---------- 5. Zonenverteilung ---------- */

/* Zonenzeiten je Aktivitaet, so wie intervals.icu sie fuehrt.

   Die App kann Zonenzeiten selbst rechnen, braucht dafuer aber den Pulsstream
   jeder einzelnen Fahrt. Fuer acht Wochen waeren das zwei Dutzend Abrufe, nur
   um eine Kurve zu zeichnen. icu_hr_zone_times kommt mit der Aktivitaetsliste
   mit und kostet keinen zusaetzlichen Abruf.

   Die erste Zone ist Z1, die zweite Z2, alles darueber ist hart. Das gilt fuer
   jedes Zonenmodell mit aufsteigenden Baendern und macht die Auswertung
   unabhaengig davon, wie viele Zonen das Konto fuehrt. */
export function zonenAusAktivitaet(a){
  const z = a && a.icu_hr_zone_times;
  if(!Array.isArray(z) || z.length < 3) return null;
  const w = z.map(v => (v > 0 ? v : 0));
  const gesamt = w.reduce((n, v) => n + v, 0);
  if(!(gesamt > 0)) return null;
  return { z1: w[0], z2: w[1], hart: w.slice(2).reduce((n, v) => n + v, 0), gesamt };
}

export function zonenSerie(acts, wochen, startIso){
  const zeilen = (wochen || []).filter(w => w && Number.isFinite(w.week))
    .slice().sort((a, b) => a.week - b.week);
  const je = {};
  for(const w of zeilen) je[w.week] = { woche: w.week, z2Sec: 0, hartSec: 0, quelle: null };

  for(const a of (acts || [])){
    if(!a || !anIsRide(a.type)) continue;
    const z = zonenAusAktivitaet(a);
    if(!z) continue;
    const w = wochenNummer(String(a.start_date_local || '').slice(0, 10), startIso);
    if(w === null) continue;
    const e = je[w] || (je[w] = { woche: w, z2Sec: 0, hartSec: 0, quelle: null });
    e.z2Sec += z.z2;
    e.hartSec += z.hart;
    e.quelle = 'icu';
  }

  /* Wo intervals.icu nichts liefert, gilt, was die Tagesauswertung aus den
     Streams gerechnet hat. In der Liste ist das nichts, in der Detailansicht
     alles - beides ist richtig, und die Herkunft steht in der UI. */
  for(const w of zeilen){
    const e = je[w.week];
    if(e.quelle) continue;
    if((w.z2Sec || 0) + (w.hardSec || 0) > 0){
      e.z2Sec = w.z2Sec || 0;
      e.hartSec = w.hardSec || 0;
      e.quelle = 'streams';
    }
  }

  const alle = Object.keys(je).map(k => je[k]).sort((a, b) => a.woche - b.woche);
  const punkte = alle.map(e => {
    const z2Min = Math.round(e.z2Sec / 60), hartMin = Math.round(e.hartSec / 60);
    const summe = e.z2Sec + e.hartSec;
    return {
      woche: e.woche, t: e.woche * 7, v: z2Min, z2Min, hartMin, quelle: e.quelle,
      anteil: summe > 0 ? e.z2Sec / summe * 100 : null,
      marke: 'W' + e.woche, titel: 'Woche ' + e.woche,
      zusatz: z2Min + ' min Z2 · ' + hartMin + ' min hart'
    };
  });
  const mitDaten = punkte.filter(p => p.quelle);

  const z2Trend = trendAus(mitDaten.map(p => ({ t: p.t, v: p.z2Min })),
    { einheit: 'min', nachkomma: 0, besser: 'hoch', flachProzent: VERLAUF.zonen.flachProzent });
  const hartTrend = trendAus(mitDaten.map(p => ({ t: p.t, v: p.hartMin })),
    { einheit: 'min', nachkomma: 0, flachProzent: VERLAUF.zonen.flachProzent });
  const anteilTrend = trendAus(mitDaten.filter(p => p.anteil !== null).map(p => ({ t: p.t, v: p.anteil })),
    { einheit: '%-Punkte', nachkomma: 1, besser: 'hoch', flachAbsolut: VERLAUF.zonen.anteilFlach });

  const quellen = {};
  for(const p of mitDaten) quellen[p.quelle] = (quellen[p.quelle] || 0) + 1;

  return {
    schluessel: 'zonen', titel: 'Zonenverteilung', einheit: 'min', nachkomma: 0,
    punkte, mitDaten: mitDaten.length, z2Trend, hartTrend, anteilTrend, quellen,
    regel: 'Z2-Minuten gegen harte Minuten (alles oberhalb Z2) je Woche. ' +
      'Zielgröße sind 300 bis 400 min Z2; ein hoher Z2-Anteil bei wenigen harten Minuten ist polarisiert.',
    hinweis: mitDaten.length === 0
      ? 'Für keine Woche liegen Zonenzeiten vor. intervals.icu liefert sie erst, wenn dort HR-Zonen gesetzt sind – ' +
        'bis dahin zeigt die Auswertung einer einzelnen Fahrt die Zonen aus dem Pulsstream.'
      : (quellen.streams && !quellen.icu
          ? 'Zonenzeiten aus den Pulsstreams dieser App, nicht von intervals.icu.'
          : null)
  };
}

/* ---------- Lokale Ergaenzung: Rumpf- und Beinprotokoll ---------- */

/* Ohne intervals.icu bleibt das hier das einzige, was ueber tatsaechlich
   getanes Training etwas sagt. Es ist keine Leistungsgroesse, sondern eine
   Konsistenzgroesse - und wird auch so beschriftet. */
export function rumpfSerie(coreLog, startIso){
  const je = {};
  for(const e of (coreLog || [])){
    if(!e || !e.day) continue;
    const w = wochenNummer(e.day, startIso);
    if(w === null || w < 1) continue;
    const z = je[w] || (je[w] = { woche: w, rumpf: 0, bein: 0 });
    if(e.kind === 'leg') z.bein++; else z.rumpf++;
  }
  const punkte = Object.keys(je).map(k => je[k]).sort((a, b) => a.woche - b.woche)
    .map(z => ({ t: z.woche * 7, v: z.rumpf, woche: z.woche, rumpf: z.rumpf, bein: z.bein,
                 marke: 'W' + z.woche, titel: 'Woche ' + z.woche,
                 zusatz: z.rumpf + ' Rumpf · ' + z.bein + ' Beinblock' }));
  return {
    schluessel: 'rumpf', titel: 'Rumpfeinheiten je Woche', einheit: 'Einheiten', nachkomma: 1,
    punkte,
    trend: trendAus(punkte, { einheit: 'Einheiten', nachkomma: 2, besser: 'hoch',
      flachAbsolut: VERLAUF.rumpf.flachAbsolut }),
    regel: 'Aus dem Protokoll des Rumpf-Timers, zwei Einheiten je Woche sind geplant. ' +
      'Liegt nur auf diesem Gerät und braucht keinen Zugang zu intervals.icu.'
  };
}

/* ---------- Alles auf einmal ---------- */

/* Ein Aufruf statt sechs, weil die Ansicht sie ohnehin alle braucht und weil
   so an genau einer Stelle steht, welche Quelle in welchen Indikator geht.
   Ein Objekt statt sieben Stellungsparametern: die Aufrufstelle soll lesbar
   bleiben, wenn eine Quelle fehlt. */
export function verlaufBericht(quellen){
  const q = quellen || {};
  return {
    effizienz:   effizienzSerie(q.acts, q.thresholds),
    entkopplung: entkopplungSerie(q.acts),
    tests:       testSerie(q.testLog, q.interimLog),
    umfang:      umfangSerie(q.wochen),
    zonen:       zonenSerie(q.acts, q.wochen, q.startIso),
    rumpf:       rumpfSerie(q.coreLog, q.startIso),
    verbunden:   !!q.verbunden
  };
}
