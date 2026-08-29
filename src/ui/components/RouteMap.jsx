/* Streckenkarte, Leaflet.

   Die Thunderforest-Stile brauchen einen Schluessel. Ohne den waere die Karte
   leer - deshalb faellt sie auf OpenStreetMap zurueck, das ohne Anmeldung
   funktioniert. Die App sagt in den Einstellungen, was der Unterschied ist,
   statt hier stumm etwas anderes zu zeigen.

   Gezeichnet wird nicht eine Linie, sondern die Abschnitte in der Farbe ihrer
   staerksten Bremse: Steigung, Gegenwind, unbefestigt - oder gruen, wenn
   nichts davon zutraf. Unbefestigt kommt zusaetzlich als Punktlinie darueber,
   sonst waere Schotter unsichtbar, sobald am selben Stueck auch Wind oder
   Steigung dazukommt.

   Doppelt gefahrene Strecken - beim Intervalltraining die Regel - teilen sich
   die Linie laengs: jede Richtung bekommt eine Haelfte, nach rechts der eigenen
   Fahrtrichtung, und rechts ist beim Zurueckfahren die andere Strassenseite.
   Zusammen sind die beiden Haelften so breit wie eine einfache Linie und liegen
   auf demselben weissen Rand - es sieht also aus wie eine Linie in zwei Farben,
   nicht wie zwei Strassen. Wie oft die Strecke gefahren wurde, aendert daran
   nichts: es bleibt bei zwei Haelften.

   Die Fahrtrichtung steht als weisser Winkel in der Linie, nicht als Pfeil
   daneben: Marker neben der Spur waren bei zwei Spuren nicht mehr zuzuordnen.
   Die Winkel stehen auf der ganzen Strecke, nicht nur auf den doppelt
   gefahrenen Stuecken - auf einer Runde ist die Frage "wo ging es hin" genauso
   berechtigt, und eine Linie ohne Richtung beantwortet sie nicht. Gesetzt
   werden sie in dem Stueck Strecke, das gerade zu sehen ist, und darum auch
   nach jedem Verschieben neu.

   Der Versatz muss in Bildschirmpunkten gerechnet werden, nicht in Metern:
   drei Meter sind bei der Uebersicht ueber eine ganze Fahrt weniger als ein
   Pixel. Deshalb wird die Spur nach jedem Zoomen neu gelegt.

   Die Windrichtung liegt als Feld gleicher Pfeile ueber der Karte, alle in die
   Richtung zeigend, in die der Wind weht. Ein Raster statt eines einzelnen
   Pfeils in der Ecke: so sieht man die Windrichtung ueberall dort, wo gerade
   die Strecke liegt, und der Pfeil mit Schaft und Spitze ist als Richtung zu
   lesen, nicht als Symbol. Die Pfeile folgen nicht der Spur, sondern stehen im
   festen Bildschirmraster - daran unterscheiden sie sich von den weissen
   Fahrtrichtungs-Winkeln. Ein Schild oben rechts benennt zusaetzlich die
   Himmelsrichtung, aus der der Wind kommt.

   Kacheln kommen zur Laufzeit aus dem Netz. Offline bleibt die Karte leer -
   das steht dann auch dort, statt eine graue Flaeche zu zeigen. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { mapKey, settings } from '../../state/store.js';
import { kachelQuelle, KARTENSTIL_DEFAULT } from '../../state/kartenstile.js';
import { KLASSEN, KLASSE_TEXT } from '../../domain/strecke.js';
import { richtungKurz } from '../../data/wetter.js';

/* Leaflet wird erst geladen, wenn eine Karte gebraucht wird. Eingebunden
   kostet es rund 45 kB gzip - die duerfen nicht auf dem Start liegen, nur
   damit die Timer aufgehen. */
let leafletP = null;
function ladeLeaflet(){
  if(!leafletP){
    leafletP = Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css')
    ]).then(([m]) => m.default || m);
  }
  return leafletP;
}

const TOKEN = {
  'frei':        '--sp-frei',
  'berg-mittel': '--sp-berg',
  'berg-stark':  '--sp-berg-stark',
  'wind-mittel': '--sp-wind',
  'wind-stark':  '--sp-wind-stark',
  'weg':         '--sp-weg'
};

function token(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

/* Strichbreiten in Bildschirmpunkten. Die Strecke ist immer gleich breit: eine
   einfache Linie hat SPUR, zwei Haelften haben je die Haelfte davon und liegen
   Schulter an Schulter. Der weisse Rand laeuft in beiden Faellen auf der Achse
   der Strecke - er haelt die Linie zusammen, statt sie zu verdoppeln. */
const SPUR = 5, RAND = 9;
const SPUR_HALB = SPUR / 2;

/* Ein Viertel der Strichbreite: damit stossen die beiden Haelften in der Mitte
   aneinander und der Strich bleibt dort, wo die Strasse ist. Mehr Versatz sah
   nach zwei verschiedenen Strassen aus. Ein Versatz je Durchfahrt - die erste
   Fassung zaehlte sie - wurde beim Zirkeltraining zu einem Faecher aus einem
   Dutzend Linien. */
const VERSATZ_PX = SPUR / 4;

const WINKEL_GROESSE = 2.6;   // Bildschirmpunkte, Armlaenge - passt in eine Haelfte

/* Eine Linie seitlich versetzen, in Bildschirmpunkten und rechts der
   Fahrtrichtung. Auf dem Bildschirm zeigt y nach unten, rechts von (dx, dy)
   ist damit (-dy, dx). */
function versetzt(karte, ll, px){
  if(!px) return ll;
  const pts = ll.map(p => karte.latLngToLayerPoint(p));
  return pts.map((p, i) => {
    const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const laenge = Math.sqrt(dx * dx + dy * dy) || 1;
    return karte.layerPointToLatLng([p.x - dy / laenge * px, p.y + dx / laenge * px]);
  });
}

/* Ein Winkel in Fahrtrichtung, als drei Punkte auf der Linie selbst - gezeichnet
   wird er weiss und schmal, damit er in der Farbe liegt statt sie zu ersetzen. */
function winkel(karte, ll, i){
  const p = karte.latLngToLayerPoint(ll[i]);
  const a = karte.latLngToLayerPoint(ll[Math.max(i - 1, 0)]);
  const b = karte.latLngToLayerPoint(ll[Math.min(i + 1, ll.length - 1)]);
  const dx = b.x - a.x, dy = b.y - a.y;
  const laenge = Math.sqrt(dx * dx + dy * dy);
  if(!laenge) return null;
  const ux = dx / laenge, uy = dy / laenge;      // Fahrtrichtung
  const nx = -uy, ny = ux;                        // rechts davon
  const s = WINKEL_GROESSE;
  const ecken = [
    [p.x - ux * s + nx * s, p.y - uy * s + ny * s],
    [p.x + ux * s,          p.y + uy * s],
    [p.x - ux * s - nx * s, p.y - uy * s - ny * s]
  ];
  return ecken.map(q => karte.layerPointToLatLng(q));
}

/* Wo die Winkel sitzen.

   Nicht an festen Metermarken der Strecke: eine Marke alle 300 m ist bei der
   Uebersicht dicht genug, aber hineingezoomt liegt der Ausschnitt zwischen zwei
   Marken, und dann steht kein einziger Winkel im Bild. Gemessen wird deshalb in
   Bildschirmpunkten - alle 70 Punkte entlang der Linie einer, unabhaengig vom
   Zoom.

   Und nicht je Zeichengruppe: bei acht Intervallen auf derselben Strecke gibt
   es ein Dutzend Gruppen, deren Winkel alle auf denselben paar hundert Metern
   laegen - eine weisse Leiter ueber der Spur. Das Ausduennen danach laesst je
   Richtung einen stehen. */
const WINKEL_MIN_PX = 70;     // Bildschirmabstand zwischen zwei Winkeln
const WINKEL_MAX = 30;

function winkelKandidaten(karte, gelegt){
  /* Nur der sichtbare Ausschnitt, mit etwas Rand. Sonst faellt die Obergrenze
     auf Kandidaten, die gerade niemand sieht. */
  const sicht = karte.getBounds().pad(0.2);
  const raus = [];
  for(const t of gelegt){
    const pts = t.ll.map(p => karte.latLngToLayerPoint(p));
    let seit = WINKEL_MIN_PX;   // der erste Punkt der Gruppe darf gleich einer sein
    for(let i = 1; i < pts.length - 1; i++){
      const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
      seit += Math.sqrt(dx * dx + dy * dy);
      if(seit < WINKEL_MIN_PX) continue;
      if(!sicht.contains(t.ll[i])) continue;
      const a = pts[i - 1], b = pts[i + 1];
      const rx = b.x - a.x, ry = b.y - a.y;
      const laenge = Math.sqrt(rx * rx + ry * ry);
      if(!laenge) continue;
      seit = 0;
      raus.push({ p: pts[i], kurs: Math.atan2(rx, -ry) * 180 / Math.PI, ll: t.ll, i: i });
    }
  }
  return raus;
}

function winkelAusduennen(kandidaten){
  const raus = [];
  for(const k of kandidaten){
    if(raus.length >= WINKEL_MAX) break;
    const zuNah = raus.some(v => {
      const dx = v.p.x - k.p.x, dy = v.p.y - k.p.y;
      if(Math.sqrt(dx * dx + dy * dy) > WINKEL_MIN_PX) return false;
      /* Nah, aber in Gegenrichtung: das ist die andere Haelfte und darf bleiben. */
      return Math.abs(((v.kurs - k.kurs + 540) % 360) - 180) <= 60;
    });
    if(!zuNah) raus.push(k);
  }
  return raus;
}

/* Das Windfeld ueber der Karte.

   Ein Raster gleicher Pfeile, alle in die Richtung, in die der Wind weht
   (windAus + 180 - die Meldung nennt die Richtung, AUS der er kommt). Anders
   als die weissen Fahrtrichtungs-Winkel folgen die Windpfeile nicht der Spur,
   sondern liegen im festen Bildschirmraster und zeigen ausnahmslos gleich -
   daran liest man sie als Wind und nicht als Streckenrichtung. Sie liegen
   unter der Spur und halb durchsichtig, damit die Strecke oben bleibt.

   Gerechnet wird in Containerpunkten, also haengt das Feld am Ausschnitt und
   wird nach jedem Zoomen und Verschieben neu gelegt. */
const WIND_RASTER = 92;      // Bildschirmabstand zwischen zwei Pfeilen
const WIND_LAENGE = 20;      // Laenge des Schafts
const WIND_SPITZE = 6.5;     // Laenge der beiden Schenkel der Pfeilspitze
const WIND_SPITZE_WINKEL = 0.5;   // Radiant, halber Oeffnungswinkel der Spitze

function windPfeile(karte, nachGrad){
  const b = nachGrad * Math.PI / 180;
  const ux = Math.sin(b), uy = -Math.cos(b);   // Wehrichtung, y zeigt nach unten
  const hx = -ux, hy = -uy;                     // von der Spitze zurueck zum Schaft
  const dreh = (w, x, y) => [Math.cos(w) * x - Math.sin(w) * y, Math.sin(w) * x + Math.cos(w) * y];
  const [s1x, s1y] = dreh(WIND_SPITZE_WINKEL, hx, hy);
  const [s2x, s2y] = dreh(-WIND_SPITZE_WINKEL, hx, hy);
  const groesse = karte.getSize();
  const halb = WIND_LAENGE / 2;
  const pt = (x, y) => karte.containerPointToLatLng([x, y]);
  const raus = [];
  let reihe = 0;
  for(let y = WIND_RASTER / 2; y < groesse.y; y += WIND_RASTER, reihe++){
    const versatz = (reihe % 2) * (WIND_RASTER / 2);   // Reihen auf Luecke
    for(let x = WIND_RASTER / 2 + versatz; x < groesse.x; x += WIND_RASTER){
      const tailX = x - ux * halb, tailY = y - uy * halb;
      const tipX = x + ux * halb, tipY = y + uy * halb;
      raus.push([pt(tailX, tailY), pt(tipX, tipY)]);
      raus.push([
        pt(tipX + s1x * WIND_SPITZE, tipY + s1y * WIND_SPITZE),
        pt(tipX, tipY),
        pt(tipX + s2x * WIND_SPITZE, tipY + s2y * WIND_SPITZE)
      ]);
    }
  }
  return raus;
}

export function RouteMap({ latlng, gruppen, windAus }){
  const box = useRef(null);
  const [fehler, setFehler] = useState(null);
  /* Im Render gelesen, nicht erst im Effekt: so merkt die Komponente, wenn der
     Schluessel oder ein anderer Stil dazukommt, und baut die Karte neu - statt
     bis zum naechsten Aufruf auf den alten Kacheln stehen zu bleiben. */
  const key = mapKey.value;
  const stilId = settings.value.mapStyle || KARTENSTIL_DEFAULT;

  useEffect(() => {
    if(!box.current || !latlng || latlng.length < 2) return;
    let m = null, weg = false;

    ladeLeaflet().then(L => {
      if(weg || !box.current) return;
      m = L.map(box.current, { attributionControl: true, zoomControl: true });

      const quelle = kachelQuelle(key, stilId);
      L.tileLayer(quelle.url, { attribution: quelle.nachweis, maxZoom: 18 }).addTo(m);

      /* Jede Gruppe bekommt ihren eigenen weissen Rand: bei versetzten Spuren
         gehoert der Rand zur Spur, nicht zur Achse der Strecke. */
      const teile = (gruppen && gruppen.length) ? gruppen : [{ klasse: null, ll: latlng }];
      /* Das Windfeld ganz unten, direkt ueber den Kacheln: es ordnet die
         Strecke ein, darf sie aber nicht verdecken. */
      const windSchicht = L.layerGroup().addTo(m);
      const schicht = L.layerGroup().addTo(m);
      /* Die Winkel liegen in einer eigenen Schicht: sie haengen am Ausschnitt
         und werden auch beim Verschieben neu gesetzt, die Linien nur beim
         Zoomen. */
      const winkelSchicht = L.layerGroup().addTo(m);
      let gelegt = [];
      const spurFarbe = token('--spur'), randFarbe = token('--spur-rand');

      /* In drei Durchgaengen, nicht Gruppe fuer Gruppe: erst alle weissen
         Raender, dann alle Farben, dann die Winkel. Sonst deckt der Rand der
         naechsten Gruppe die Farbe der vorigen zu - bei acht Durchfahrten
         derselben Strecke waren am Ende nur die Linien der letzten zu sehen,
         und die Winkel gar nicht. */
      function zeichneSpur(){
        schicht.clearLayers();
        gelegt = teile
          .filter(g => g.ll && g.ll.length >= 2)
          .map(g => ({ g: g, ll: g.doppelt ? versetzt(m, g.ll, VERSATZ_PX) : g.ll,
                       farbe: token(TOKEN[g.klasse] || '--spur') }));

        /* Der Rand liegt auf der Achse, nicht auf der versetzten Haelfte -
           sonst waere die Strecke dort, wo sie doppelt gefahren wurde, doppelt
           so breit wie sonst. */
        for(const t of gelegt){
          L.polyline(t.g.ll, { color: randFarbe, weight: RAND, opacity: .9,
            lineCap: 'round', lineJoin: 'round' }).addTo(schicht);
        }
        for(const t of gelegt){
          L.polyline(t.ll, { color: t.farbe, weight: t.g.doppelt ? SPUR_HALB : SPUR,
            opacity: 1, lineCap: 'butt', lineJoin: 'round' }).addTo(schicht);
          /* Unbefestigt als feine Punktlinie obendrauf: eine zweite Farbe kann
             der Abschnitt nicht tragen, eine zweite Textur schon. */
          if(t.g.weg){
            L.polyline(t.ll, { color: '#14150f', weight: t.g.doppelt ? 1.4 : 2,
              opacity: .85, dashArray: '1 6', lineCap: 'round' }).addTo(schicht);
          }
        }
        zeichneWinkel();
      }

      function zeichneWind(){
        windSchicht.clearLayers();
        if(windAus == null) return;
        const linien = windPfeile(m, (windAus + 180) % 360);
        const windFarbe = token('--sp-wind-stark');
        /* Erst alle weissen Kaschierungen, dann alle Farben - sonst frisst der
           Rand des naechsten Pfeils die Spitze des vorigen. */
        for(const l of linien){
          L.polyline(l, { color: randFarbe, weight: 3.6, opacity: .45,
            lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(windSchicht);
        }
        for(const l of linien){
          L.polyline(l, { color: windFarbe, weight: 1.6, opacity: .8,
            lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(windSchicht);
        }
      }

      function zeichneWinkel(){
        winkelSchicht.clearLayers();
        for(const k of winkelAusduennen(winkelKandidaten(m, gelegt))){
          const w = winkel(m, k.ll, k.i);
          if(!w) continue;
          L.polyline(w, { color: randFarbe, weight: 1.3, opacity: 1,
            lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(winkelSchicht);
        }
      }

      /* Ausschnitt zuerst: der Versatz rechnet in Bildschirmpunkten, und die
         gibt es erst, wenn die Karte eine Mitte und eine Zoomstufe hat. */
      const umriss = L.latLngBounds(latlng);
      m.fitBounds(umriss, { padding: [18, 18] });
      zeichneWind();
      zeichneSpur();
      /* Der Versatz haengt am Zoom, also muss die Spur nach jedem Zoomen neu
         gelegt werden. Zwischen zwei Zoomstufen bleibt sie unveraendert. Das
         Windfeld haengt am ganzen Ausschnitt und wird auch beim Verschieben
         mitgezogen. */
      m.on('zoomend', () => { zeichneWind(); zeichneSpur(); });
      m.on('moveend', () => { zeichneWind(); zeichneWinkel(); });

      /* Start hohl, Ziel gefuellt - in derselben Farbe, damit die Karte nicht
         drei Bedeutungen in drei Farben behauptet. */
      L.circleMarker(latlng[0], { radius: 6, color: spurFarbe, weight: 3, fillColor: randFarbe, fillOpacity: 1 })
        .addTo(m).bindTooltip('Start');
      L.circleMarker(latlng[latlng.length - 1], { radius: 6, color: randFarbe, weight: 3, fillColor: spurFarbe, fillOpacity: 1 })
        .addTo(m).bindTooltip('Ziel');

      /* Die Windpfeile zeigen, wohin der Wind weht - nicht, woher er kommt.
         Andersherum liest sie jeder falsch. Das Feld ueber der Karte sagt das
         schon; dieses Schild dazu benennt die Himmelsrichtung, aus der der
         Wind kommt, so wie sie auch in der Auswertung steht.

         Als Bedienelement, nicht als Marker an der Nordostecke: der Marker sass
         genau auf der Ecke und wurde von overflow:hidden zu drei Vierteln
         abgeschnitten - und beim Neueinpassen rutschte er aus dem Bild. */
      if(windAus != null){
        const schild = L.control({ position: 'topright' });
        schild.onAdd = () => {
          const d = L.DomUtil.create('div', 'windpfeil');
          const dreh = (windAus + 180) % 360;
          d.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(' + dreh + 'deg)">' +
              '<path d="M12 3 L12 21 M12 3 L7 10 M12 3 L17 10" />' +
            '</svg>' +
            '<span>Wind aus ' + richtungKurz(windAus) + '</span>';
          return d;
        };
        schild.addTo(m);
      }

      /* Leaflet misst beim Anlegen manchmal zu frueh, wenn der Container
         gerade erst eingeblendet wurde. Danach noch einmal einpassen: mit der
         falschen Groesse gemessen, landet der Ausschnitt sonst tief in einer
         Ecke der Strecke - man sieht dann lauter Strassen und die Spur laeuft
         am Bildrand vorbei. */
      setTimeout(() => {
        if(!m) return;
        m.invalidateSize();
        m.fitBounds(umriss, { padding: [18, 18] });
        zeichneWind();
        zeichneSpur();
      }, 120);
    }).catch(e => setFehler('Karte konnte nicht geladen werden: ' + e.message));

    return () => { weg = true; if(m) m.remove(); };
  }, [latlng, gruppen, windAus, key, stilId]);

  if(fehler) return <div class="karte-leer">{fehler}</div>;

  if(!latlng || latlng.length < 2){
    return <div class="karte-leer">Für diese Fahrt liegen keine GPS-Daten vor.</div>;
  }
  return <div class="karte" ref={box}></div>;
}

/* Legende unter der Karte. Nur was vorkam: eine Zeile "unbefestigt: 0 km"
   erklaert nichts, sie verlaengert nur die Liste.

   Die Zeilen duerfen sich nicht ueberschneiden. Vorher stand der Schotter
   zweimal da - einmal als Farbe und einmal als Gesamtsumme -, und bei einer
   Fahrt, auf der kein Schotterabschnitt zusaetzlich Wind oder Steigung hatte,
   waren beide Zahlen gleich. Zwei Zeilen mit derselben Zahl sehen aus wie ein
   Fehler. Jetzt zeigt die Punktlinie nur den Rest: den Schotter, dem eine
   andere Farbe zusteht, weil dort etwas Staerkeres gebremst hat. So addieren
   sich die Zeilen zur Gesamtstrecke. */
export function StreckenLegende({ bilanz, laeuft, windAus }){
  if(!bilanz) return null;
  const km = m => (m / 1000).toFixed(1).replace('.', ',') + ' km';
  const vorhanden = KLASSEN.filter(k => (bilanz.klassen[k] || 0) >= 100);
  const wegRest = bilanz.wegMeter - (bilanz.klassen['weg'] || 0);
  return (
    <div class="legende">
      <span class="leghinweis">
        Farbe: was auf dem Abschnitt am stärksten gebremst hat. Die weißen Winkel zeigen die Fahrtrichtung.
        {windAus != null && ' Die violetten Pfeile über der Karte zeigen, wohin der Wind weht (aus ' + richtungKurz(windAus) + ').'}
      </span>
      {vorhanden.map(k => (
        <span class="legpost" key={k}>
          <i class={'legfarbe k-' + k}></i>{KLASSE_TEXT[k]} <b>{km(bilanz.klassen[k])}</b>
        </span>
      ))}
      {wegRest >= 100 && (
        <span class="legpost">
          <i class="legfarbe gepunktet"></i>unbefestigt, dazu Wind oder Steigung <b>{km(wegRest)}</b>
        </span>
      )}
      {bilanz.doppeltMeter >= 100 && (
        <span class="leghinweis">
          {km(bilanz.doppeltMeter)} doppelt gefahren: dort teilen sich Hin- und Rückweg die Linie,
          jede Richtung eine Hälfte.
        </span>
      )}
      {laeuft && <span class="leghinweis">Untergrund wird noch geladen …</span>}
      {!laeuft && !bilanz.untergrundBekannt && (
        <span class="leghinweis">Zum Untergrund liegt für den größten Teil der Strecke kein Eintrag in OpenStreetMap vor.</span>
      )}
    </div>
  );
}
