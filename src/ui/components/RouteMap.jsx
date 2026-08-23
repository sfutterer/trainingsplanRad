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

      /* Erst ein breiter weisser Rand unter der ganzen Spur, dann die farbigen
         Abschnitte darauf. Eine Linie ohne Rand verschwindet, sobald der
         Untergrund an einer Stelle dieselbe Helligkeit hat. */
      const rand = L.polyline(latlng, {
        color: token('--spur-rand'), weight: 10, opacity: .9, lineCap: 'round', lineJoin: 'round'
      }).addTo(m);

      const teile = (gruppen && gruppen.length) ? gruppen : [{ klasse: null, ll: latlng }];
      for(const g of teile){
        if(!g.ll || g.ll.length < 2) continue;
        L.polyline(g.ll, {
          color: token(TOKEN[g.klasse] || '--spur'),
          weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round'
        }).addTo(m);
        /* Unbefestigt als feine Punktlinie obendrauf: eine zweite Farbe kann
           der Abschnitt nicht tragen, eine zweite Textur schon. */
        if(g.weg){
          L.polyline(g.ll, {
            color: '#14150f', weight: 2.5, opacity: .85, dashArray: '1 6', lineCap: 'round'
          }).addTo(m);
        }
      }

      m.fitBounds(rand.getBounds(), { padding: [18, 18] });

      /* Start hohl, Ziel gefuellt - in derselben Farbe, damit die Karte nicht
         drei Bedeutungen in drei Farben behauptet. */
      const spurFarbe = token('--spur'), randFarbe = token('--spur-rand');
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
        m.fitBounds(rand.getBounds(), { padding: [18, 18] });
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
      {laeuft && <span class="leghinweis">Untergrund wird noch geladen …</span>}
      {!laeuft && !bilanz.untergrundBekannt && (
        <span class="leghinweis">Zum Untergrund liegt für den größten Teil der Strecke kein Eintrag in OpenStreetMap vor.</span>
      )}
    </div>
  );
}
