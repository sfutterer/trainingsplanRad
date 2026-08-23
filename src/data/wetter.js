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

/* Kurs zwischen zwei Punkten in Grad, 0 = Norden. */
export function peilung(a, b){
  const rad = Math.PI / 180;
  const y = Math.sin((b[1] - a[1]) * rad) * Math.cos(b[0] * rad);
  const x = Math.cos(a[0] * rad) * Math.sin(b[0] * rad)
          - Math.sin(a[0] * rad) * Math.cos(b[0] * rad) * Math.cos((b[1] - a[1]) * rad);
  return (Math.atan2(y, x) / rad + 360) % 360;
}

/* Windrichtung wird als Richtung angegeben, AUS der es weht. Gegenwind heisst
   also: der Kurs zeigt dorthin, wo der Wind herkommt. */
export function windAnteil(kurs, windAus){
  const diff = ((windAus - kurs + 540) % 360) - 180;   // -180..180
  return Math.cos(diff * Math.PI / 180);               // 1 = voller Gegenwind, -1 = Rueckenwind
}

/* Aus Spur und Wind den Gegenwindanteil der Fahrt. Nur Abschnitte mit echter
   Bewegung zaehlen - im Stand hat "Fahrtrichtung" keine Bedeutung. */
export function windBilanz(latlng, hourly, index, minMeter){
  const schwelle = minMeter || 25;
  let gegen = 0, rueck = 0, quer = 0, strecke = 0;
  const windAus = hourly.wind_direction_10m[index];
  const tempo = hourly.wind_speed_10m[index];
  for(let i = 1; i < latlng.length; i++){
    const a = latlng[i - 1], b = latlng[i];
    if(!a || !b) continue;
    const d = abstand(a, b);
    if(d < schwelle) continue;
    const anteil = windAnteil(peilung(a, b), windAus);
    strecke += d;
    if(anteil > 0.3) gegen += d;
    else if(anteil < -0.3) rueck += d;
    else quer += d;
  }
  if(!strecke) return null;
  return {
    windAus, tempo,
    gegenProzent: Math.round(gegen / strecke * 100),
    rueckProzent: Math.round(rueck / strecke * 100),
    querProzent:  Math.round(quer / strecke * 100),
    streckeKm: strecke / 1000
  };
}

export function abstand(a, b){
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const HIMMELSRICHTUNG = ['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW'];
export function richtungKurz(grad){
  return HIMMELSRICHTUNG[Math.round(((grad % 360) / 22.5)) % 16];
}
