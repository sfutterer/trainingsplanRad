/* Navigation Drawer, Material 3.

   Enthaelt alle Bereiche - auch die, die unten keinen Platz haben. Die untere
   Leiste traegt die vier Ziele des Trainings, hier steht der Rest: Zonen und
   Werte, Einstellungen.

   Schliesst ueber die Zurueck-Geste, Escape, den Klick daneben und die
   Auswahl. Die ersten drei liegen in useOverlay.js - sie sind dieselben wie
   beim Bottom Sheet, und Escape stand hier bis dahin ein zweites Mal. Die
   Fokusfalle kam damit dazu: wer den Drawer mit der Tastatur oeffnete, lief
   mit Tab bisher hinter ihm durch die Seite. */

import { useRef } from 'preact/hooks';
import { vibrate } from '../../platform/index.js';
import { BEREICHE, HAUPTZIELE } from '../../state/navigation.js';
import { useOverlay } from './useOverlay.js';
import { Icon } from './Icon.jsx';

/* Die erste Gruppe traegt keine Ueberschrift mehr: sie hiess "Training", und
   seit der Sammelbereich denselben Namen hat, stuende das Wort zweimal
   untereinander. Als erste Gruppe direkt unter dem Kopf braucht sie keine
   Beschriftung - die Trennlinie der naechsten Ueberschrift grenzt sie ab.

   Hier stehen nur die Kennungen und die Gruppierung. Die Namen kommen aus
   navigation.js: sie lagen frueher in drei Listen gleichzeitig, und ein
   Bereich, der unten anders hiess als im Drawer, waere niemandem aufgefallen. */
const GRUPPEN = [
  { titel: null,    ziele: HAUPTZIELE },
  { titel: 'Werte', ziele: ['test', 'zonen'] },
  { titel: null,    ziele: ['einstellungen', 'about'] }
];

export function NavDrawer({ offen, aktiv, onSelect, onClose }){
  const box = useRef(null);
  const schliessen = useOverlay(offen, onClose, box);

  /* inert statt nur aria-hidden: der geschlossene Drawer steht weiterhin im
     Baum, damit er beim Oeffnen hineinfahren kann. Weder aria-hidden noch das
     transform nehmen seine sieben Knoepfe aus der Tabreihenfolge - wer mit
     Tastatur bedient, lief bisher durch sieben unsichtbare Schaltflaechen.
     inert nimmt sie aus Fokus, Trefferflaeche und Vorlesebaum zugleich; das
     Attribut muss dabei ganz fehlen und darf nicht auf "false" stehen. */
  return (
    <div class={'drawer-wrap' + (offen ? ' offen' : '')} inert={offen ? undefined : true}>
      <div class="drawer-schleier" onClick={() => schliessen.current()}></div>
      <nav class="drawer" aria-label="Alle Bereiche" tabIndex={-1} ref={box}>
        <div class="drawer-kopf">
          <div class="drawer-app">Trainingsplan</div>
          <div class="drawer-sub">Radfahren</div>
        </div>
        {GRUPPEN.map((g, gi) => (
          <div class="drawer-gruppe" key={gi}>
            {g.titel && <div class="drawer-gruppentitel">{g.titel}</div>}
            {g.ziele.map(id => (
              <button key={id}
                class={'drawer-item' + (aktiv === id ? ' an' : '')}
                aria-current={aktiv === id ? 'page' : undefined}
                onClick={() => { vibrate(8); onSelect(id); }}>
                <Icon name={id} />
                <span>{BEREICHE[id]}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}
