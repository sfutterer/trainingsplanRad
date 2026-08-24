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

   Doppelt gefahrene Strecken - beim Intervalltraining die Regel - liegen
   nebeneinander statt uebereinander: halbe Breite, seitlich versetzt, jede
   Spur nach rechts ihrer eigenen Fahrtrichtung. Dadurch trennen sich Hin- und
   Rueckweg von selbst, und Pfeile sagen, welche Spur welche ist. Der Versatz
   muss in Bildschirmpunkten gerechnet werden, nicht in Metern: sechs Meter
   sind bei der Uebersicht ueber eine ganze Fahrt weniger als ein Pixel. Deshalb
   wird die Spur nach jedem Zoomen neu gelegt.

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

/* Strichbreiten in Bildschirmpunkten. Doppelt gefahrene Abschnitte teilen sich
   die Breite der einfachen Spur, damit die Strecke gleich breit bleibt. */
const BREIT  = { spur: 5, rand: 10 };
const SCHMAL = { spur: 3, rand: 7 };
const VERSATZ_PX = 2.4;
const PFEIL_ABSTAND = 700;   // Meter zwischen zwei Richtungspfeilen
const PFEIL_JE_GRUPPE = 3;
const PFEIL_NEBEN = 5.5;     // Bildschirmpunkte, um die der Pfeil neben seiner Spur sitzt
const PFEIL_MAX = 16;        // mehr Pfeile liest niemand, und jeder ist ein DOM-Knoten

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

/* Wo Pfeile hingehoeren und wohin sie zeigen. Ein Pfeil je 700 m, mindestens
   einer, hoechstens drei je Abschnittsgruppe - sonst steht die Karte voll.

   Zwei Feinheiten, ohne die es unlesbar wird: der Pfeil sitzt neben seiner
   Spur, nicht darauf - bei 3 px Spurbreite wuerde er sonst beide Spuren
   ueberdecken. Und die Stellen sind je Gruppe versetzt, sonst liegen der Pfeil
   des Hinwegs und der des Rueckwegs an derselben Stelle uebereinander. */
function pfeilStellen(karte, ll, meter, schritt){
  const anzahl = Math.max(1, Math.min(PFEIL_JE_GRUPPE, Math.round((meter || 0) / PFEIL_ABSTAND)));
  const raus = [];
  for(let k = 0; k < anzahl; k++){
    const teil = (k + 0.5 + (schritt || 0) * 0.5) / anzahl % 1;
    const i = Math.min(ll.length - 2, Math.max(1, Math.round(teil * (ll.length - 1))));
    const a = karte.latLngToLayerPoint(ll[i - 1]), b = karte.latLngToLayerPoint(ll[Math.min(i + 1, ll.length - 1)]);
    const dx = b.x - a.x, dy = b.y - a.y;
    if(!dx && !dy) continue;
    /* Das Zeichen zeigt nach oben, also entspricht 0 Grad dem Bildschirmnorden. */
    raus.push({ ll: ll[i], grad: Math.atan2(dx, -dy) * 180 / Math.PI });
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

      function zeichneSpur(){
        schicht.clearLayers();
        let pfeile = 0, doppelteGruppe = 0;
        for(const g of teile){
          if(!g.ll || g.ll.length < 2) continue;
          const b = g.doppelt ? SCHMAL : BREIT;
          const abstand = VERSATZ_PX + (g.versatz || 0) * SCHMAL.rand;
          const ll = g.doppelt ? versetzt(m, g.ll, abstand) : g.ll;
          const farbe = token(TOKEN[g.klasse] || '--spur');

          L.polyline(ll, { color: randFarbe, weight: b.rand, opacity: .9,
            lineCap: 'round', lineJoin: 'round' }).addTo(schicht);
          L.polyline(ll, { color: farbe, weight: b.spur, opacity: 1,
            lineCap: 'round', lineJoin: 'round' }).addTo(schicht);
          /* Unbefestigt als feine Punktlinie obendrauf: eine zweite Farbe kann
             der Abschnitt nicht tragen, eine zweite Textur schon. */
          if(g.weg){
            L.polyline(ll, { color: '#14150f', weight: Math.max(1.5, b.spur - 1),
              opacity: .85, dashArray: '1 6', lineCap: 'round' }).addTo(schicht);
          }
          if(g.doppelt){
            const neben = versetzt(m, g.ll, abstand + PFEIL_NEBEN);
            for(const pf of pfeilStellen(m, neben, g.meter, doppelteGruppe++)){
              if(pfeile >= PFEIL_MAX) break;
              L.marker(pf.ll, { interactive: false, keyboard: false, icon: L.divIcon({
                className: 'spurpfeil', iconSize: [12, 12],
                html: '<div style="transform:rotate(' + Math.round(pf.grad) + 'deg);color:' + farbe + '">▲</div>'
              })}).addTo(schicht);
              pfeile++;
            }
          }
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
          {km(bilanz.doppeltMeter)} doppelt gefahren: dort liegen die Durchfahrten nebeneinander,
          die Pfeile zeigen die jeweilige Fahrtrichtung.
        </span>
      )}
      {laeuft && <span class="leghinweis">Untergrund wird noch geladen …</span>}
      {!laeuft && !bilanz.untergrundBekannt && (
        <span class="leghinweis">Zum Untergrund liegt für den größten Teil der Strecke kein Eintrag in OpenStreetMap vor.</span>
      )}
    </div>
  );
}
