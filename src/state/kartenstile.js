/* Kartenstile und die Adresse der Kacheln.

   Thunderforest liefert zehn Stile unter derselben Adresse - nur der Pfad
   wechselt. Drei stehen zur Wahl, weil sie verschiedene Fragen beantworten:

   OpenCycleMap zeichnet zu allen Strassen noch das Radroutennetz und
   Hoehenlinien. Das ist gut zum Planen und schlecht zum Nachsehen - auf so
   einer Karte findet man die eigene Spur nicht wieder. Vorgabe ist deshalb
   Atlas: derselbe Kartenschatz ohne das Beiwerk.

   Wie bei den Themes liegt die Liste hier und nicht in der Komponente: die
   Einstellungen brauchen sie genauso wie die Karte. */

export const KARTENSTILE = [
  { id: 'atlas',     label: 'Ruhig',   pfad: 'atlas',     hinweis: 'Straßen und Orte, kein Beiwerk' },
  { id: 'cycle',     label: 'Rad',     pfad: 'cycle',     hinweis: 'OpenCycleMap: Radroutennetz und Höhenlinien' },
  { id: 'landscape', label: 'Gelände', pfad: 'landscape', hinweis: 'Gelände und Höhen, wenig Straßenwerk' }
];

export const KARTENSTIL_DEFAULT = 'atlas';

export function kartenstil(id){
  return KARTENSTILE.find(k => k.id === id) || KARTENSTILE[0];
}

/* Ohne Schluessel OpenStreetMap: das braucht keine Anmeldung. Die Karte bleibt
   damit benutzbar, und die Einstellungen sagen, was fehlt. */
export function kachelQuelle(key, stilId){
  if(!key){
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      nachweis: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    };
  }
  return {
    url: 'https://{s}.tile.thunderforest.com/' + kartenstil(stilId).pfad +
         '/{z}/{x}/{y}.png?apikey=' + encodeURIComponent(key),
    nachweis: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; OpenStreetMap'
  };
}
