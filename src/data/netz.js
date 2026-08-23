/* Netzabrufe mit Zeitgrenze.

   fetch hat von sich aus kein Zeitlimit: haengt der Gegenserver, haengt die
   Anzeige mit - genau das war bei Overpass zu sehen, wo eine zu teure Abfrage
   nach einer halben Minute mit 504 zurueckkam und die Auswertung bis dahin
   stand. Lieber ohne die Daten weiterrechnen und sagen, was fehlt.

   Die Grenzen sind nach dem gemessen, was der Dienst normal braucht, mal
   ungefaehr drei: intervals.icu antwortet in unter einer Sekunde, Open-Meteo
   in Millisekunden. Overpass ist der Ausreisser - dieselbe Abfrage lag zwischen
   9 und 20 s. Deshalb dort die weite Grenze, aber die Anzeige wartet nicht
   darauf. */

export const ZEITGRENZE = {
  icu: 15000,
  wetter: 10000,
  osm: 25000
};

export async function holen(url, opts, ms, name){
  const ctl = new AbortController();
  const uhr = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, Object.assign({}, opts, { signal: ctl.signal }));
  } catch(e){
    if(e && e.name === 'AbortError'){
      throw new Error(name + ' hat nach ' + Math.round(ms / 1000) + ' s nicht geantwortet.');
    }
    throw e;
  } finally {
    clearTimeout(uhr);
  }
}
