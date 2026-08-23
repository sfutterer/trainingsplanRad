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

const OVERPASS = 'https://overpass-api.de/api/interpreter';

/* Radius um die Spur. Grosszuegiger als die Zuordnungstoleranz in strecke.js:
   erst holen, dann genau messen. */
const SUCH_RADIUS = 35;

/* Overpass rechnet den Umweg um jeden Punkt einzeln. Mehr als rund 150 Punkte
   machen die Abfrage langsam, ohne etwas zu finden, was zwischen zwei 250 m
   entfernten Punkten laege. */
const MAX_PUNKTE = 150;
const MIN_ABSTAND = 200;

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
  return '[out:json][timeout:40];(' +
    'way' + um + '["highway"]["surface"];' +
    'way' + um + '["highway"~"^(track|path|bridleway)$"];' +
    ');out tags geom;';
}

export async function ladeWege(punkte){
  const stuetzen = stuetzpunkte(punkte);
  if(stuetzen.length < 2) return [];
  let res;
  try {
    res = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(overpassAbfrage(stuetzen))
    });
  } catch(e){
    throw new Error('Overpass nicht erreichbar. Offline oder Netz blockiert?');
  }
  if(res.status === 429 || res.status === 504){
    throw new Error('Overpass ist gerade ausgelastet (' + res.status + '). Später erneut versuchen.');
  }
  if(!res.ok) throw new Error('Overpass antwortete mit ' + res.status + '.');
  const d = await res.json();
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
