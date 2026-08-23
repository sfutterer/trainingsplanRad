/* Untergrund aus OpenStreetMap, ueber die Overpass-API.

   Weder intervals.icu noch Garmin wissen, ob ein Kilometer Asphalt oder
   Schotter war - kein Sensor misst das. OpenStreetMap weiss es, weil Menschen
   es eingetragen haben: surface am Weg, oder die Art des Weges selbst.

   Overpass braucht keinen Schluessel und ist CORS-faehig, passt also zur
   uebrigen App. Abgefragt werden nur Wege entlang der Spur, und davon nur die,
   die ueberhaupt etwas zum Untergrund sagen - eine Flaechenabfrage ueber die
   ganze Bounding Box waere ein Vielfaches an Daten fuer dieselbe Antwort.

   Dabei gehen die Koordinaten der Fahrt an Overpass. Das steht auch in der
   Analyse, wo das Ergebnis benutzt wird. */

import { abstand } from '../domain/geo.js';
import { holen, ZEITGRENZE } from './netz.js';

const OVERPASS = 'https://overpass-api.de/api/interpreter';

/* Radius um die Spur. Grosszuegiger als die Zuordnungstoleranz in strecke.js:
   erst holen, dann genau messen. */
const SUCH_RADIUS = 30;

/* Die Punktliste in around ist ein Linienpuffer, keine Kette von Kreisen:
   Overpass sucht entlang der Verbindung zwischen den Punkten. Weniger Punkte
   liefern also denselben Korridor, nur schneller - und darauf kommt es an.
   Gemessen an einer 60-km-Runde durch Muenchen, dem schlechten Fall: 150
   Punkte 27 s, 75 Punkte 12 s, 40 Punkte 9 s, jedes Mal dasselbe Ergebnis von
   rund 1 MB. Mit 150 Punkten lief die Abfrage in die Zeitgrenze des Servers
   (504), und die Wiederholungen fielen in dessen Slot-Limit (429) - das sah
   nach einem ausgelasteten Overpass aus, war aber eine zu teure Abfrage.

   Verlaesslich schnell wird es davon nicht: dieselbe Abfrage brauchte in
   Messungen zwischen 9 und 20 s, je nach Last der oeffentlichen Instanz, und
   lief zwischendurch in ein 504. Deshalb wartet die Anzeige nicht darauf - die
   Karte steht vorher, der Untergrund kommt nach, und was einmal geholt wurde,
   bleibt gespeichert. Ein zweiter Server als Ausweichweg waere naheliegend,
   aber die bekannten Spiegel sind aus diesem Netz nicht erreichbar.

   Bei 500 m Abstand schneidet der Puffer selbst in engen Kehren nichts ab, was
   der Suchradius nicht ohnehin abdeckt. */
const MAX_PUNKTE = 45;
const MIN_ABSTAND = 500;

export function stuetzpunkte(punkte, minAbstand, max){
  const min = minAbstand || MIN_ABSTAND;
  const grenze = max || MAX_PUNKTE;
  const p = (punkte || []).filter(Boolean);
  if(p.length < 2) return p.slice();
  const raus = [p[0]];
  for(const q of p.slice(1)){
    if(abstand(raus[raus.length - 1], q) >= min) raus.push(q);
  }
  if(raus[raus.length - 1] !== p[p.length - 1]) raus.push(p[p.length - 1]);
  /* Immer noch zu viele: gleichmaessig ausduennen, die Enden behalten. */
  if(raus.length > grenze){
    const schritt = raus.length / grenze;
    const knapp = [];
    for(let i = 0; i < grenze; i++) knapp.push(raus[Math.floor(i * schritt)]);
    knapp.push(raus[raus.length - 1]);
    return knapp;
  }
  return raus;
}

export function overpassAbfrage(punkte){
  const liste = punkte.map(p => p[0].toFixed(5) + ',' + p[1].toFixed(5)).join(',');
  const um = '(around:' + SUCH_RADIUS + ',' + liste + ')';
  return '[out:json][timeout:25];(' +
    'way' + um + '["highway"]["surface"];' +
    'way' + um + '["highway"~"^(track|path|bridleway)$"];' +
    ');out tags geom;';
}

export async function ladeWege(punkte){
  const stuetzen = stuetzpunkte(punkte);
  if(stuetzen.length < 2) return [];
  let res;
  try {
    res = await holen(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(overpassAbfrage(stuetzen))
    }, ZEITGRENZE.osm, 'Overpass');
  } catch(e){
    if(/nicht geantwortet/.test(e.message)) throw e;
    throw new Error('Overpass nicht erreichbar. Offline oder Netz blockiert?');
  }
  if(res.status === 429){
    throw new Error('Overpass lässt gerade keine weitere Abfrage zu (429).');
  }
  if(res.status === 504){
    throw new Error('Overpass hat die Abfrage abgebrochen (504).');
  }
  if(!res.ok) throw new Error('Overpass antwortete mit ' + res.status + '.');
  const d = await res.json();
  /* Ueberschreitet die Abfrage das Zeitlimit des Servers, kommt trotzdem 200
     zurueck - mit leerer Liste und einer Bemerkung. Das darf nicht als
     "keine unbefestigten Wege" durchgehen. */
  if(d && d.remark && /timed out|out of memory/i.test(d.remark)){
    throw new Error('Overpass: ' + d.remark);
  }
  return wegeAus(d);
}

export function wegeAus(antwort){
  const raus = [];
  for(const el of ((antwort && antwort.elements) || [])){
    if(el.type !== 'way' || !Array.isArray(el.geometry)) continue;
    const geom = el.geometry.filter(g => g && g.lat != null && g.lon != null)
      .map(g => [g.lat, g.lon]);
    if(geom.length < 2) continue;
    raus.push({ id: el.id, tags: el.tags || {}, geom: geom });
  }
  return raus;
}

/* Der Untergrund einer Fahrt aendert sich nicht mehr. Als Zeichenkette je
   Abschnitt - u unbefestigt, f fest, - kein Eintrag - kostet er ein paar
   hundert Byte, und das zweite Ansehen derselben Fahrt braucht keine Abfrage.
   Die Laenge gehoert zum Schluessel: aendert sich die Abschnittslaenge, passt
   der alte Eintrag nicht mehr und faellt weg. */
export function untergrundCode(abschnitte){
  return (abschnitte || []).map(a =>
    a.untergrund === 'unbefestigt' ? 'u' : a.untergrund === 'fest' ? 'f' : '-').join('');
}

export function untergrundAusCode(code){
  const z = String(code || '');
  return (ll, i) => (z[i] === 'u' ? 'unbefestigt' : z[i] === 'f' ? 'fest' : null);
}
