/* Streckenkarte, Leaflet.

   Die Thunderforest-Stile brauchen einen Schluessel. Ohne den waere die Karte
   leer - deshalb faellt sie auf OpenStreetMap zurueck, das ohne Anmeldung
   funktioniert. Die App sagt in den Einstellungen, was der Unterschied ist,
   statt hier stumm etwas anderes zu zeigen.

   Kacheln kommen zur Laufzeit aus dem Netz. Offline bleibt die Karte leer -
   das steht dann auch dort, statt eine graue Flaeche zu zeigen. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { mapKey, settings } from '../../state/store.js';
import { kachelQuelle, KARTENSTIL_DEFAULT } from '../../state/kartenstile.js';

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

export function RouteMap({ latlng, windAus }){
  const box = useRef(null);
  const [fehler, setFehler] = useState(null);
  /* Im Render gelesen, nicht erst im Effekt: so merkt die Komponente, wenn der
     Schluessel oder ein anderer Stil dazukommt, und baut die Karte neu - statt
     bis zum naechsten Aufruf auf den alten Kacheln stehen zu bleiben. */
  const key = mapKey.value;
  const stilId = (settings.value.mapStyle) || KARTENSTIL_DEFAULT;

  useEffect(() => {
    if(!box.current || !latlng || latlng.length < 2) return;
    let m = null, weg = false;

    ladeLeaflet().then(L => {
      if(weg || !box.current) return;
      m = L.map(box.current, { attributionControl: true, zoomControl: true });

      const quelle = kachelQuelle(key, stilId);
      L.tileLayer(quelle.url, { attribution: quelle.nachweis, maxZoom: 18 }).addTo(m);

      const token = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';
      const spurFarbe = token('--spur'), randFarbe = token('--spur-rand');

      /* Zwei Linien statt einer: erst ein breiter weisser Rand, darauf die
         Spur. Eine einzelne Linie verschwindet zwischen den Kartenlinien,
         sobald der Untergrund an einer Stelle dieselbe Helligkeit hat - der
         Rand loest die Spur von allem, was darunter liegt. */
      L.polyline(latlng, { color: randFarbe, weight: 9, opacity: .9, lineCap: 'round', lineJoin: 'round' }).addTo(m);
      const spur = L.polyline(latlng, { color: spurFarbe, weight: 4.5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(m);
      m.fitBounds(spur.getBounds(), { padding: [18, 18] });

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
        m.fitBounds(spur.getBounds(), { padding: [18, 18] });
      }, 120);
    }).catch(e => setFehler('Karte konnte nicht geladen werden: ' + e.message));

    return () => { weg = true; if(m) m.remove(); };
  }, [latlng, windAus, key, stilId]);

  if(fehler) return <div class="karte-leer">{fehler}</div>;

  if(!latlng || latlng.length < 2){
    return <div class="karte-leer">Für diese Fahrt liegen keine GPS-Daten vor.</div>;
  }
  return <div class="karte" ref={box}></div>;
}
