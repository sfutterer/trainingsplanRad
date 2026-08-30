/* Die Fahrt in Abschnitte zerlegt: Wind, Steigung, Untergrund.

   Ein Mittelwert ueber die ganze Fahrt beantwortet die Frage nicht, die man vor
   der Karte hat: nicht "wie viel Gegenwind war es", sondern "wo". Deshalb wird
   die Spur in Stuecke von rund 150 m geschnitten und jedes Stueck einzeln
   bewertet - Kurs gegen Windrichtung der jeweiligen Stunde, Hoehendifferenz
   gegen Laenge, dazu der Untergrund aus OpenStreetMap.

   Jeder Abschnitt bekommt genau eine Klasse, weil er auf der Karte genau eine
   Farbe haben kann. Treffen Steigung und Gegenwind zusammen, entscheidet die
   groebere Schaetzung, welcher der beiden mehr Watt kostet - eine 8-Prozent-
   Rampe bei Rueckenwind ist eine Rampe, kein Windloch. Der Untergrund ist
   davon unabhaengig und wird zusaetzlich gestrichelt gezeichnet, sonst wuerde
   er von Wind und Bergen ueberdeckt. */

import { abstand, peilung, windAnteil, abstandZuStrecke, rechteck } from './geo.js';

/* Schwellen in den Einheiten, in denen man sie liest: Prozent Steigung,
   km/h Gegenwindanteil. Sie stehen in der Legende genauso da. */
export const SCHWELLEN = {
  bergMittel: 3,
  bergStark: 7,
  windMittel: 8,
  windStark: 16,
  /* Darueber ist es kein Berg, sondern Rauschen im Hoehenstream. */
  steigungMax: 25,
  /* Unter dieser Geschwindigkeit ist es eine Pause und keine Fahrtrichtung. */
  standKmh: 4
};

export const KLASSEN = ['berg-stark', 'berg-mittel', 'wind-stark', 'wind-mittel', 'weg', 'frei'];

export const KLASSE_TEXT = {
  'berg-stark':  'bergauf über ' + SCHWELLEN.bergStark + ' %',
  'berg-mittel': 'bergauf ' + SCHWELLEN.bergMittel + '–' + SCHWELLEN.bergStark + ' %',
  'wind-stark':  'Gegenwind über ' + SCHWELLEN.windStark + ' km/h',
  'wind-mittel': 'Gegenwind ' + SCHWELLEN.windMittel + '–' + SCHWELLEN.windStark + ' km/h',
  'weg':         'unbefestigt',
  'frei':        'nichts davon'
};

/* Rohe Schaetzung, ausschliesslich zum Vergleich zweier Widerstaende auf
   demselben Abschnitt - keine Leistungsangabe, und nirgends angezeigt.
   85 kg Systemgewicht, CdA 0,35 m², Luftdichte 1,2 kg/m³. */
const MASSE = 85, G = 9.81, RHO = 1.2, CDA = 0.35, TEMPO_ANNAHME = 20;

function wattBerg(a){
  const v = (a.tempoKmh || TEMPO_ANNAHME) / 3.6;
  return MASSE * G * v * ((a.steigung || 0) / 100);
}

function wattWind(a){
  const v = (a.tempoKmh || TEMPO_ANNAHME) / 3.6, w = (a.gegenKmh || 0) / 3.6;
  return 0.5 * RHO * CDA * ((v + w) * (v + w) - v * v) * v;
}

export function klassifiziere(a){
  const berg = (a.steigung || 0) >= SCHWELLEN.bergStark ? 'berg-stark'
             : (a.steigung || 0) >= SCHWELLEN.bergMittel ? 'berg-mittel' : null;
  const wind = (a.gegenKmh || 0) >= SCHWELLEN.windStark ? 'wind-stark'
             : (a.gegenKmh || 0) >= SCHWELLEN.windMittel ? 'wind-mittel' : null;
  if(berg && wind) return wattBerg(a) >= wattWind(a) ? berg : wind;
  if(berg) return berg;
  if(wind) return wind;
  if(a.untergrund === 'unbefestigt') return 'weg';
  return 'frei';
}

/* Aus der Punktfolge Abschnitte machen.

   punkte: [{ ll:[lat,lng], hoehe, sek }] - Hoehe und Sekunde duerfen fehlen.
   opts.wind: (sek) => { aus, kmh } fuer die Stunde, in der der Abschnitt lag.
   opts.untergrund: (ll) => 'unbefestigt' | 'fest' | null

   Die Abschnittslaenge waechst mit der Fahrt: 150 m auf 20 km sind 130
   Abschnitte, auf 120 km waeren es 800 - und 800 Linien zeichnet kein Handy
   mehr fluessig. Ueber die Laenge bleibt es bei rund 250 Stuecken. */
export function baueAbschnitte(punkte, opts){
  const o = opts || {};
  const p = (punkte || []).filter(x => x && x.ll);
  if(p.length < 2) return [];
  const gesamt = gesamtMeter(p);
  const minMeter = o.minMeter || Math.max(150, Math.round(gesamt / 250 / 50) * 50);

  const raus = [];
  let start = 0, meter = 0, ll = [p[0].ll];
  for(let i = 1; i < p.length; i++){
    meter += abstand(p[i - 1].ll, p[i].ll);
    ll.push(p[i].ll);
    if(meter >= minMeter){
      raus.push(macheAbschnitt(p[start], p[i], meter, ll, o));
      start = i; meter = 0; ll = [p[i].ll];
    }
  }
  /* Der Rest kommt nur als eigener Abschnitt dazu, wenn er lang genug ist,
     um eine Aussage zu tragen - sonst haengt er am letzten. */
  if(meter >= minMeter * 0.4){
    raus.push(macheAbschnitt(p[start], p[p.length - 1], meter, ll, o));
  } else if(raus.length && ll.length > 1){
    const letzter = raus[raus.length - 1];
    letzter.ll = letzter.ll.concat(ll.slice(1));
    letzter.meter += meter;
  }
  return raus;
}

function macheAbschnitt(von, bis, meter, ll, o){
  const sek = (von.sek != null && bis.sek != null) ? Math.max(bis.sek - von.sek, 0) : null;
  const a = {
    ll: ll,
    meter: meter,
    sek: sek,
    tempoKmh: sek ? meter / sek * 3.6 : null,
    kurs: peilung(von.ll, bis.ll),
    steigung: 0,
    hoehenDelta: null,
    windAus: null,
    windKmh: null,
    windAnteil: null,
    gegenKmh: 0,
    untergrund: null,
    klasse: 'frei'
  };

  if(von.hoehe != null && bis.hoehe != null && meter > 0){
    a.hoehenDelta = bis.hoehe - von.hoehe;
    const s = a.hoehenDelta / meter * 100;
    a.steigung = Math.abs(s) > SCHWELLEN.steigungMax ? 0 : s;
  }

  /* Im Stand hat "Fahrtrichtung" keine Bedeutung - dann bleibt der Wind aus
     der Bewertung, statt eine Ampelpause als Gegenwindloch zu zeigen. */
  const faehrt = a.tempoKmh == null || a.tempoKmh >= SCHWELLEN.standKmh;
  const w = o.wind ? o.wind(von.sek != null ? von.sek : 0) : null;
  if(w && w.aus != null && faehrt){
    a.windAus = w.aus;
    a.windKmh = w.kmh;
    a.windAnteil = windAnteil(a.kurs, w.aus);
    a.gegenKmh = (w.kmh || 0) * a.windAnteil;
  }

  if(o.untergrund) a.untergrund = o.untergrund(ll[Math.floor(ll.length / 2)]);
  a.klasse = klassifiziere(a);
  return a;
}

function gesamtMeter(punkte){
  let m = 0;
  for(let i = 1; i < punkte.length; i++) m += abstand(punkte[i - 1].ll, punkte[i].ll);
  return m;
}

/* Aufeinanderfolgende Abschnitte mit gleicher Klasse zu einer Linie
   zusammenfassen. Aus 250 Abschnitten werden so meist 40 Linien - Leaflet
   zeichnet jede als eigenes SVG-Element, und das ist der Unterschied zwischen
   fluessigem und ruckelndem Verschieben. */
export function zeichenGruppen(abschnitte){
  const raus = [];
  for(const a of (abschnitte || [])){
    const weg = a.untergrund === 'unbefestigt';
    const doppelt = !!a.doppelt;
    const letzte = raus[raus.length - 1];
    /* Auch die Spur trennt: eine Gruppe wird als eine Linie gezeichnet, und
       eine Linie kann nicht halb versetzt sein. */
    if(letzte && letzte.klasse === a.klasse && letzte.weg === weg && letzte.doppelt === doppelt){
      letzte.ll = letzte.ll.concat(a.ll.slice(1));
      letzte.meter += a.meter;
    } else {
      raus.push({ klasse: a.klasse, weg: weg, doppelt: doppelt,
                  ll: a.ll.slice(), meter: a.meter });
    }
  }
  return raus;
}

/* ---------- Doppelt gefahrene Abschnitte ---------- */

/* Beim Intervalltraining faehrt man dieselbe Strasse hin und zurueck, oft
   viele Male. Auf der Karte liegt der Rueckweg dann genau auf dem Hinweg, und
   sichtbar ist nur, was zuletzt gezeichnet wurde - meist das gruene Stueck
   ueber dem violetten, obwohl auf dem Hinweg der Wind stand.

   Deshalb wird nur eine Frage beantwortet: kommt die Spur an dieser Stelle
   noch ein zweites Mal vorbei? Wenn ja, weicht der Abschnitt beim Zeichnen zur
   Seite aus, nach rechts der eigenen Fahrtrichtung - und rechts ist beim
   Zurueckfahren die andere Strassenseite. Damit gibt es genau zwei Spuren, eine
   je Richtung, egal ob man die Strecke zweimal oder zwanzigmal faehrt.

   Die Zahl der Durchfahrten wird bewusst nicht gezaehlt: ein Versatz je
   Durchfahrt addierte sich beim Zirkeltraining zu einem Faecher aus einem
   Dutzend Linien.

   Geprueft wird gegen die Punkte der Spur, nicht gegen die Nachbarabschnitte.
   Der Abschnittsvergleich hatte Loecher: laeuft die Rueckfahrt genau ueber die
   Naht zweier Abschnitte, deckt keiner von beiden genug davon ab, und ein
   Stueck mitten in der Strecke blieb unerkannt. */

export const DOPPEL_TOLERANZ = 30;      // Meter Abstand zwischen zwei Durchfahrten
export const DOPPEL_TRENNUNG = 200;     // Meter Fahrweg, die dazwischen liegen muessen
const RICHTUNG_GLEICH = 60;             // Grad: bis dahin dieselbe Richtung
const RICHTUNG_GEGEN = 120;             // Grad: darueber Gegenrichtung

function zelle(p, grad){
  return Math.round(p[0] / grad) + ':' + Math.round(p[1] / grad);
}

/* Die Punkte aller Abschnitte hintereinander, mit dem Weg vom Start und der
   Richtung an dieser Stelle. Die Abschnitte teilen ihre Endpunkte, deshalb
   faengt jeder ab dem zweiten Punkt an. */
function spurPunkteAus(abschnitte){
  const punkte = [];
  let weg = 0;
  abschnitte.forEach((a, i) => {
    a.ll.forEach((p, k) => {
      if(i > 0 && k === 0) return;
      if(punkte.length) weg += abstand(punkte[punkte.length - 1].ll, p);
      punkte.push({ ll: p, weg: weg, kurs: a.kurs, abschnitt: i });
    });
  });
  return punkte;
}

function proben(ll){
  const n = ll.length;
  if(n < 3) return [0, n - 1].filter((v, i, a) => a.indexOf(v) === i);
  return [Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75)];
}

export function markiereDoppelt(abschnitte, toleranz){
  const a = abschnitte || [];
  if(a.length < 2) return a;
  const tol = toleranz || DOPPEL_TOLERANZ;
  const grad = tol / 111320 * 2;

  const punkte = spurPunkteAus(a);
  const netz = new Map();
  punkte.forEach((p, i) => {
    const k = zelle(p.ll, grad);
    let l = netz.get(k);
    if(!l){ l = []; netz.set(k, l); }
    l.push(i);
  });

  /* Kommt die Spur an diesem Punkt noch einmal vorbei - weit genug entfernt in
     der Fahrzeit, damit nicht der eigene Nachbarpunkt gemeint ist, und nicht
     quer dazu, denn eine Kreuzung ist keine doppelte Strecke? */
  function nochmal(pi){
    const p = punkte[pi];
    const zl = Math.round(p.ll[0] / grad), zn = Math.round(p.ll[1] / grad);
    for(let dz = -1; dz <= 1; dz++){
      for(let dn = -1; dn <= 1; dn++){
        const l = netz.get((zl + dz) + ':' + (zn + dn));
        if(!l) continue;
        for(const qi of l){
          const q = punkte[qi];
          if(Math.abs(q.weg - p.weg) < DOPPEL_TRENNUNG) continue;
          const diff = Math.abs(((q.kurs - p.kurs + 540) % 360) - 180);
          if(diff > RICHTUNG_GLEICH && diff < RICHTUNG_GEGEN) continue;
          if(abstand(p.ll, q.ll) <= tol) return true;
        }
      }
    }
    return false;
  }

  /* Je Abschnitt drei Proben. Eine reicht nicht - eine einzelne Kreuzung mit
     der eigenen Spur wuerde den ganzen Abschnitt umlegen. */
  const roh = a.map(s => {
    const idx = proben(s.ll);
    let treffer = 0;
    for(const k of idx){
      const p = punkte.findIndex(x => x.ll === s.ll[k]);
      if(p >= 0 && nochmal(p)) treffer++;
    }
    return treffer >= 2;
  });

  /* Glaetten: ein einzelner Ausfall mitten in einer doppelt gefahrenen
     Strecke - eine Kehre, ein GPS-Ausrutscher - setzt die Spur sonst kurz
     zurueck auf die Achse und wieder heraus. Das sah kaputter aus als der
     Fehler war. */
  const glatt = roh.map((v, i) => {
    const vor = roh[i - 1], nach = roh[i + 1];
    if(!v && vor && nach) return true;
    if(v && vor === false && nach === false) return false;
    return v;
  });

  return a.map((s, i) => (glatt[i] === !!s.doppelt ? s : Object.assign({}, s, { doppelt: glatt[i] })));
}

/* Untergrund nachtragen und neu einfaerben.

   Overpass ist der langsamste der drei Dienste, und die Karte soll nicht auf
   ihn warten: erst zeichnen, was aus Aufzeichnung und Wetter schon feststeht,
   dann den Untergrund darueberlegen. gib bekommt Mittelpunkt und Index des
   Abschnitts - so kann die Antwort aus Overpass kommen oder aus dem
   Zwischenspeicher. */
export function setzeUntergrund(abschnitte, gib){
  return (abschnitte || []).map((a, i) => {
    const u = gib(a.ll[Math.floor(a.ll.length / 2)], i);
    if(u === a.untergrund) return a;
    const neu = Object.assign({}, a, { untergrund: u });
    neu.klasse = klassifiziere(neu);
    return neu;
  });
}

/* Die Summen unter der Karte: was war wie lang, wie viel Hoehe, wie viel Wind. */
export function streckenBilanz(abschnitte){
  const a = abschnitte || [];
  if(!a.length) return null;
  const b = {
    meter: 0, hoch: 0, runter: 0,
    gegenMeter: 0, querMeter: 0, rueckMeter: 0, windMeter: 0,
    gegenSumme: 0,
    wegMeter: 0, festMeter: 0, unbekanntMeter: 0, doppeltMeter: 0,
    steilster: 0, staerksterGegenwind: 0,
    klassen: {}
  };
  for(const k of KLASSEN) b.klassen[k] = 0;

  for(const s of a){
    b.meter += s.meter;
    b.klassen[s.klasse] = (b.klassen[s.klasse] || 0) + s.meter;
    if(s.hoehenDelta != null){
      if(s.hoehenDelta > 0) b.hoch += s.hoehenDelta;
      else b.runter -= s.hoehenDelta;
    }
    if(s.steigung > b.steilster) b.steilster = s.steigung;
    if(s.windAnteil != null){
      b.windMeter += s.meter;
      b.gegenSumme += s.gegenKmh * s.meter;
      if(s.gegenKmh > b.staerksterGegenwind) b.staerksterGegenwind = s.gegenKmh;
      if(s.windAnteil > 0.3) b.gegenMeter += s.meter;
      else if(s.windAnteil < -0.3) b.rueckMeter += s.meter;
      else b.querMeter += s.meter;
    }
    if(s.doppelt) b.doppeltMeter += s.meter;
    if(s.untergrund === 'unbefestigt') b.wegMeter += s.meter;
    else if(s.untergrund === 'fest') b.festMeter += s.meter;
    else b.unbekanntMeter += s.meter;
  }

  const anteil = m => b.windMeter ? Math.round(m / b.windMeter * 100) : 0;
  b.km = b.meter / 1000;
  b.gegenProzent = anteil(b.gegenMeter);
  b.querProzent  = anteil(b.querMeter);
  b.rueckProzent = anteil(b.rueckMeter);
  /* Der Schnitt ueber die ganze Strecke, Rueckenwind negativ gerechnet: eine
     Fahrt mit halb gegen und halb im Ruecken hatte im Schnitt keinen Wind. */
  b.gegenSchnitt = b.windMeter ? b.gegenSumme / b.windMeter : 0;
  b.wegProzent = b.meter ? Math.round(b.wegMeter / b.meter * 100) : 0;
  b.untergrundBekannt = b.meter ? (b.wegMeter + b.festMeter) / b.meter >= 0.5 : false;
  b.hmProKm = b.km ? b.hoch / b.km : 0;
  b.bergProzent = b.meter
    ? Math.round((b.klassen['berg-mittel'] + b.klassen['berg-stark']) / b.meter * 100) : 0;
  return b;
}

/* ---------- Untergrund aus OpenStreetMap ---------- */

/* Toleranz zwischen Spur und Weg. GPS liegt in der Stadt gut 10 m daneben,
   parallele Wege stehen oft 15 m auseinander - darueber wird die Zuordnung
   geraten, und dann lieber nichts sagen. */
export const WEG_TOLERANZ = 22;

const UNBEFESTIGT = /^(unpaved|gravel|fine_gravel|compacted|ground|dirt|earth|grass|sand|mud|pebblestone|rock|woodchips|clay)/;
const BEFESTIGT   = /^(asphalt|paved|concrete|paving_stones|sett|cobblestone|metal|wood|chipseal|bricks|grass_paver)/;

/* Was OSM ueber den Untergrund sagt - und wo es schweigt, was die Art des
   Weges verraet: ein highway=track ohne surface ist in aller Regel Schotter
   oder Feldweg, sonst waere er als Strasse erfasst. */
export function wegKlasse(tags){
  const t = tags || {};
  if(t.surface){
    /* Befestigt zuerst pruefen: grass_paver und metal_grid fangen mit dem
       Wortstamm eines unbefestigten Untergrunds an, sind aber gebaut. */
    if(BEFESTIGT.test(t.surface)) return 'fest';
    if(UNBEFESTIGT.test(t.surface)) return 'unbefestigt';
  }
  if(t.tracktype && /^grade[2-5]$/.test(t.tracktype)) return 'unbefestigt';
  if(/^(track|path|bridleway)$/.test(t.highway || '')) return 'unbefestigt';
  return null;
}

/* Der naechstgelegene erfasste Weg entscheidet. */
export function untergrundAn(ll, wege, toleranz){
  const grenze = toleranz || WEG_TOLERANZ;
  const grad = grenze / 111320 * 1.5 + 0.0002;
  let besteD = Infinity, beste = null;
  for(const w of (wege || [])){
    if(!w.geom || w.geom.length < 2) continue;
    const r = w.rechteck || (w.rechteck = rechteck(w.geom));
    if(ll[0] < r.latMin - grad || ll[0] > r.latMax + grad ||
       ll[1] < r.lonMin - grad || ll[1] > r.lonMax + grad) continue;
    for(let i = 1; i < w.geom.length; i++){
      const d = abstandZuStrecke(ll, w.geom[i - 1], w.geom[i]);
      if(d < besteD){ besteD = d; beste = w; }
    }
  }
  if(!beste || besteD > grenze) return null;
  return wegKlasse(beste.tags);
}
