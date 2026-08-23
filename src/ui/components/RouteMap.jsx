/* Streckenkarte, Leaflet.

   OpenCycleMap braucht einen Thunderforest-Schluessel. Ohne den waere die
   Karte leer - deshalb faellt sie auf OpenStreetMap zurueck, das ohne
   Anmeldung funktioniert. Die App sagt in den Einstellungen, was der
   Unterschied ist, statt hier stumm etwas anderes zu zeigen.

   Kacheln kommen zur Laufzeit aus dem Netz. Offline bleibt die Karte leer -
   das steht dann auch dort, statt eine graue Flaeche zu zeigen. */

import { useEffect, useRef, useState } from 'preact/hooks';
import { mapKey } from '../../state/store.js';

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
     Schluessel dazukommt, und baut die Karte mit den Radkacheln neu - statt bis
     zum naechsten Aufruf auf OpenStreetMap stehen zu bleiben. */
  const key = mapKey.value;

  useEffect(() => {
    if(!box.current || !latlng || latlng.length < 2) return;
    let m = null, weg = false;

    ladeLeaflet().then(L => {
      if(weg || !box.current) return;
      m = L.map(box.current, { attributionControl: true, zoomControl: true });

      const url = key
        ? 'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=' + encodeURIComponent(key)
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const nachweis = key
        ? '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; OpenStreetMap'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
      L.tileLayer(url, { attribution: nachweis, maxZoom: 18 }).addTo(m);

      /* Aus den Theme-Tokens lesen, damit die Spur zum Rest passt und beim
         Themewechsel nicht als Fremdkoerper stehen bleibt. */
      const token = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';
      const spurFarbe = token('--primary'), zielFarbe = token('--hard');

      const spur = L.polyline(latlng, { color: spurFarbe, weight: 4, opacity: .95 }).addTo(m);
      m.fitBounds(spur.getBounds(), { padding: [18, 18] });

      L.circleMarker(latlng[0], { radius: 6, color: '#fff', weight: 2, fillColor: spurFarbe, fillOpacity: 1 })
        .addTo(m).bindTooltip('Start');
      L.circleMarker(latlng[latlng.length - 1], { radius: 6, color: '#fff', weight: 2, fillColor: zielFarbe, fillOpacity: 1 })
        .addTo(m).bindTooltip('Ziel');

      /* Der Windpfeil zeigt, wohin der Wind weht - nicht, woher er kommt.
         Andersherum liest ihn jeder falsch. */
      if(windAus != null){
        const ecke = m.getBounds().getNorthEast();
        const pfeil = L.divIcon({
          className: 'windpfeil',
          html: '<div style="transform:rotate(' + ((windAus + 180) % 360) + 'deg)">↑</div>',
          iconSize: [34, 34]
        });
        L.marker([ecke.lat, ecke.lng], { icon: pfeil, interactive: false }).addTo(m);
      }

      /* Leaflet misst beim Anlegen manchmal zu frueh, wenn der Container
         gerade erst eingeblendet wurde. */
      setTimeout(() => m && m.invalidateSize(), 120);
    }).catch(e => setFehler('Karte konnte nicht geladen werden: ' + e.message));

    return () => { weg = true; if(m) m.remove(); };
  }, [latlng, windAus, key]);

  if(fehler) return <div class="karte-leer">{fehler}</div>;

  if(!latlng || latlng.length < 2){
    return <div class="karte-leer">Für diese Fahrt liegen keine GPS-Daten vor.</div>;
  }
  return <div class="karte" ref={box}></div>;
}
