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

   Doppelt gefahrene Strecken - beim Intervalltraining die Regel - weichen um
   knapp eine halbe Strichbreite nach rechts der eigenen Fahrtrichtung aus.
   Rechts ist beim Zurueckfahren die andere Strassenseite, also entstehen genau
   zwei Spuren: eine hin, eine zurueck, auch bei zwanzig Wiederholungen. Die
   Strichbreite bleibt ueberall gleich - unterschiedlich dicke Linien lasen sich
   wie ein Fehler.

   Die Fahrtrichtung steht als weisser Winkel in der Linie, nicht als Pfeil
   daneben: Marker neben der Spur waren bei zwei Spuren nicht mehr zuzuordnen.

   Der Versatz muss in Bildschirmpunkten gerechnet werden, nicht in Metern:
   drei Meter sind bei der Uebersicht ueber eine ganze Fahrt weniger als ein
   Pixel. Deshalb wird die Spur nach jedem Zoomen neu gelegt.

   Kacheln kommen zur Laufzeit aus dem Netz. Offline bleibt die Karte leer -
   das steht dann auch dort, statt eine graue Flaeche zu zeigen. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { mapKey, settings } from '../../state/store.js';
import { kachelQuelle, KARTENSTIL_DEFAULT } from '../../state/kartenstile.js';
import { KLASSEN, KLASSE_TEXT } from '../../domain/strecke.js';

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

/* Strichbreiten in Bildschirmpunkten. Ueberall dieselben, auch auf doppelt
   gefahrenen Abschnitten: der Versatz allein trennt die beiden Spuren. */
const SPUR = 4.5, RAND = 8.5;

/* Halbe Strichbreite plus eine Haaresbreite: die Spuren beruehren sich, statt
   auseinanderzulaufen. Ein Versatz je Durchfahrt - die erste Fassung zaehlte
   sie - wurde beim Zirkeltraining zu einem Faecher aus einem Dutzend Linien. */
const VERSATZ_PX = 2.6;

const WINKEL_ABSTAND = 450;   // Meter zwischen zwei Richtungswinkeln
const WINKEL_JE_GRUPPE = 4;
const WINKEL_GROESSE = 3.6;   // Bildschirmpunkte, Armlaenge

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

   Nicht je Zeichengruppe: bei acht Intervallen auf derselben Strecke gibt es
   ein Dutzend Gruppen, und deren Winkel lagen alle auf denselben paar hundert
   Metern - eine weisse Leiter ueber der Spur. Stattdessen werden Kandidaten
   gesammelt und ausgeduennt: ein Winkel je Richtung und Bildschirmabstand, der
   Rest fliegt heraus. Damit steht auf jeder der beiden Spuren einer, egal wie
   oft die Strecke gefahren wurde. */
const WINKEL_MIN_PX = 70;    // Bildschirmabstand zwischen zwei Winkeln derselben Richtung
const WINKEL_MAX = 12;

function winkelKandidaten(karte, gelegt){
  const raus = [];
  for(const t of gelegt){
    if(!t.g.doppelt) continue;
    const anzahl = Math.max(1, Math.min(WINKEL_JE_GRUPPE,
      Math.round((t.g.meter || 0) / WINKEL_ABSTAND)));
    for(let k = 0; k < anzahl; k++){
      const i = Math.min(t.ll.length - 2, Math.max(1,
        Math.round((k + 0.5) / anzahl * (t.ll.length - 1))));
      const p = karte.latLngToLayerPoint(t.ll[i]);
      const a = karte.latLngToLayerPoint(t.ll[i - 1]);
      const b = karte.latLngToLayerPoint(t.ll[Math.min(i + 1, t.ll.length - 1)]);
      const dx = b.x - a.x, dy = b.y - a.y;
      const laenge = Math.sqrt(dx * dx + dy * dy);
      if(!laenge) continue;
      raus.push({ p: p, kurs: Math.atan2(dx, -dy) * 180 / Math.PI, ll: t.ll, i: i });
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
      /* Nah, aber in Gegenrichtung: das ist die andere Spur und darf bleiben. */
      return Math.abs(((v.kurs - k.kurs + 540) % 360) - 180) <= 60;
    });
    if(!zuNah) raus.push(k);
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
      const schicht = L.layerGroup().addTo(m);
      const spurFarbe = token('--spur'), randFarbe = token('--spur-rand');

      /* In drei Durchgaengen, nicht Gruppe fuer Gruppe: erst alle weissen
         Raender, dann alle Farben, dann die Winkel. Sonst deckt der Rand der
         naechsten Gruppe die Farbe der vorigen zu - bei acht Durchfahrten
         derselben Strecke waren am Ende nur die Linien der letzten zu sehen,
         und die Winkel gar nicht. */
      function zeichneSpur(){
        schicht.clearLayers();
        const gelegt = teile
          .filter(g => g.ll && g.ll.length >= 2)
          .map(g => ({ g: g, ll: g.doppelt ? versetzt(m, g.ll, VERSATZ_PX) : g.ll,
                       farbe: token(TOKEN[g.klasse] || '--spur') }));

        for(const t of gelegt){
          L.polyline(t.ll, { color: randFarbe, weight: RAND, opacity: .9,
            lineCap: 'round', lineJoin: 'round' }).addTo(schicht);
        }
        for(const t of gelegt){
          L.polyline(t.ll, { color: t.farbe, weight: SPUR, opacity: 1,
            lineCap: 'round', lineJoin: 'round' }).addTo(schicht);
          /* Unbefestigt als feine Punktlinie obendrauf: eine zweite Farbe kann
             der Abschnitt nicht tragen, eine zweite Textur schon. */
          if(t.g.weg){
            L.polyline(t.ll, { color: '#14150f', weight: 2, opacity: .85,
              dashArray: '1 6', lineCap: 'round' }).addTo(schicht);
          }
        }
        for(const k of winkelAusduennen(winkelKandidaten(m, gelegt))){
          const w = winkel(m, k.ll, k.i);
          if(!w) continue;
          L.polyline(w, { color: randFarbe, weight: 1.8, opacity: 1,
            lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(schicht);
        }
      }

      /* Ausschnitt zuerst: der Versatz rechnet in Bildschirmpunkten, und die
         gibt es erst, wenn die Karte eine Mitte und eine Zoomstufe hat. */
      const umriss = L.latLngBounds(latlng);
      m.fitBounds(umriss, { padding: [18, 18] });
      zeichneSpur();
      /* Der Versatz haengt am Zoom, also muss die Spur nach jedem Zoomen neu
         gelegt werden. Zwischen zwei Zoomstufen bleibt sie unveraendert. */
      m.on('zoomend', zeichneSpur);

      /* Start hohl, Ziel gefuellt - in derselben Farbe, damit die Karte nicht
         drei Bedeutungen in drei Farben behauptet. */
      L.circleMarker(latlng[0], { radius: 6, color: spurFarbe, weight: 3, fillColor: randFarbe, fillOpacity: 1 })
        .addTo(m).bindTooltip('Start');
      L.circleMarker(latlng[latlng.length - 1], { radius: 6, color: randFarbe, weight: 3, fillColor: spurFarbe, fillOpacity: 1 })
        .addTo(m).bindTooltip('Ziel');

      /* Der Windpfeil zeigt, wohin der Wind weht - nicht, woher er kommt.
         Andersherum liest ihn jeder falsch.

         Als Bedienelement, nicht als Marker an der Nordostecke: der Marker sass
         genau auf der Ecke und wurde von overflow:hidden zu drei Vierteln
         abgeschnitten - und beim Neueinpassen rutschte er aus dem Bild. */
      if(windAus != null){
        const pfeil = L.control({ position: 'topright' });
        pfeil.onAdd = () => {
          const d = L.DomUtil.create('div', 'windpfeil');
          d.innerHTML = '<div style="transform:rotate(' + ((windAus + 180) % 360) + 'deg)">↑</div>';
          return d;
        };
        pfeil.addTo(m);
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
export function StreckenLegende({ bilanz, laeuft }){
  if(!bilanz) return null;
  const km = m => (m / 1000).toFixed(1).replace('.', ',') + ' km';
  const vorhanden = KLASSEN.filter(k => (bilanz.klassen[k] || 0) >= 100);
  const wegRest = bilanz.wegMeter - (bilanz.klassen['weg'] || 0);
  return (
    <div class="legende">
      <span class="leghinweis">Farbe: was auf dem Abschnitt am stärksten gebremst hat.</span>
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
          {km(bilanz.doppeltMeter)} doppelt gefahren: Hin- und Rückweg liegen dort nebeneinander,
          die weißen Winkel zeigen die Fahrtrichtung.
        </span>
      )}
      {laeuft && <span class="leghinweis">Untergrund wird noch geladen …</span>}
      {!laeuft && !bilanz.untergrundBekannt && (
        <span class="leghinweis">Zum Untergrund liegt für den größten Teil der Strecke kein Eintrag in OpenStreetMap vor.</span>
      )}
    </div>
  );
}
