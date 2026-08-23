/* Wetter zur Zeit der Fahrt, von Open-Meteo.

   Kein Schluessel noetig und CORS-faehig, laesst sich also direkt aus dem
   Browser abrufen - genau das, was eine App ohne Backend braucht. Dieselbe
   Quelle, aus der auch intervals.icu sein Wetter zieht; dort ist die Anzeige
   allerdings den Unterstuetzern vorbehalten.

   Interessant ist nicht die Temperatur, sondern der Wind im Verhaeltnis zur
   Fahrtrichtung. Ein Durchschnitt ueber die ganze Fahrt beantwortet das nicht -
   deshalb wird stundenweise geholt und abschnittsweise verrechnet. */

const BASIS = 'https://archive-api.open-meteo.com/v1/archive';
const AKTUELL = 'https://api.open-meteo.com/v1/forecast';

function tagVon(iso){ return String(iso).slice(0, 10); }

/* Das Archiv hinkt ein paar Tage hinterher. Fuer frische Fahrten liefert die
   Forecast-API dieselben Felder als Rueckschau. */
function endpunkt(datumIso){
  const alter = (Date.now() - new Date(datumIso).getTime()) / 86400000;
  return alter > 6 ? BASIS : AKTUELL;
}

export async function ladeWetter(lat, lon, startIso){
  const tag = tagVon(startIso);
  const url = endpunkt(startIso) +
    '?latitude=' + lat.toFixed(3) + '&longitude=' + lon.toFixed(3) +
    '&start_date=' + tag + '&end_date=' + tag +
    '&hourly=temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,relative_humidity_2m' +
    '&timezone=auto';
  const res = await fetch(url);
  if(!res.ok) throw new Error('Wetterdaten nicht verfügbar (' + res.status + ').');
  const d = await res.json();
  if(!d.hourly || !d.hourly.time) throw new Error('Wetterdaten unvollständig.');
  return d.hourly;
}

/* Den Messwert zur passenden Stunde greifen. */
export function stundenIndex(hourly, zeitIso){
  const ziel = String(zeitIso).slice(0, 13);
  const i = hourly.time.findIndex(t => String(t).slice(0, 13) === ziel);
  return i >= 0 ? i : 0;
}

/* Wind zu der Stunde, in der ein Abschnitt gefahren wurde.

   Ein Wert fuer die ganze Fahrt reicht nicht: eine Vierstundenfahrt sieht am
   Ende oft eine andere Windrichtung als am Anfang, und genau daran haengt, ob
   die Rueckfahrt Rueckenwind war oder nicht. sek ist die Sekunde seit dem
   Start, wie sie der Zeit-Stream zaehlt. */
export function windZurZeit(hourly, startIso, sek){
  const t = new Date(String(startIso).replace(/Z$/, ''));
  if(isNaN(t.getTime())) return null;
  t.setSeconds(t.getSeconds() + (sek || 0));
  const i = stundenIndex(hourly, isoStunde(t));
  return {
    aus: hourly.wind_direction_10m[i],
    kmh: hourly.wind_speed_10m[i],
    boe: hourly.wind_gusts_10m[i]
  };
}

function isoStunde(d){
  const z = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours());
}

export const HIMMELSRICHTUNG = ['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW'];
export function richtungKurz(grad){
  return HIMMELSRICHTUNG[Math.round(((grad % 360) / 22.5)) % 16];
}
