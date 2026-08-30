/* Die Pulsbaender als Liste, und die eine Stelle, an der eine Zone zu ihrer
   Farbe kommt.

   Die Liste stand zweimal da - im Zonen-Tab und unten im Intervall-Timer -,
   beide Male dieselbe Schleife ueber hrBands mit demselben Punkt davor. Der
   Unterschied ist einzig, ob der Wattbereich mitlaeuft: im Zonen-Tab ja, denn
   dort geht es um die Zahlen selbst; im Timer nicht, denn dort steht die
   Vorgabe schon oben.

   Die Farbe kommt aus den Tokens und nicht mehr aus plan.json. Sie lag dort
   als Hexwert und gleichzeitig hier als Token, und beide wurden benutzt:
   dieselbe Zone war in der Bandliste tuerkis und im Verlaufsgraphen gruen, und
   die Fassung aus plan.json blieb im Dunkelmodus auf ihren hellen
   Saettigungen stehen. Jetzt gibt es einen Weg, und er fuehrt durch das
   Theme.

   Der Schluessel des untersten Bandes heisst "unter" und nicht "z0" - deshalb
   die eine Fallunterscheidung. */

import { bandRange, wattText } from '../../domain/zones.js';

export function zonenFarbe(key){
  return 'var(--' + (key === 'unter' ? 'z-unter' : key) + ')';
}

function Zonenpunkt({ zone }){
  return <i class="dot" style={'background:' + zonenFarbe(zone)}></i>;
}

export function Zonenliste({ bands, plan, thresholds, mitWatt }){
  return (
    <>
      {bands.filter(b => b.key !== 'unter').map(b => {
        const watt = mitWatt ? wattText(plan, thresholds, b.key) : null;
        return (
          <div class="row zonerow" key={b.key}>
            <span><Zonenpunkt zone={b.key} />{b.label}</span>
            <b>{bandRange(b)}{watt ? ' · ' + watt : ''}</b>
          </div>
        );
      })}
    </>
  );
}
