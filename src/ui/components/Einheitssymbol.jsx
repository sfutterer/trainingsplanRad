/* Das Zeichen einer Einheitsart - dasselbe im Plan und in der Analyse.

   Eine Art, ein Zeichen, eine Farbe: was am Donnerstag als Intervalltag im
   Plan steht, traegt in der Analyseliste dasselbe Zeichen in derselben Farbe.
   Anders herum waere die Liste eine zweite Sprache fuer dieselbe Sache - und
   die Frage "war das die Einheit, die dastand?" muesste man uebersetzen.

   Die Farben kommen aus der Zonenrampe, wo die Art eine Zone meint: Grundlage
   gruen wie Z2, die lange Ausfahrt in der Farbe der Bloecke, Intervalle rot
   wie Z5, Rumpf blau wie Z1. Der Schwellentest liegt zwischen Intervall und
   Grundlage und bekommt Z4. Nur die beiden Arten ohne Zone - der lockere Tag
   und alles Fremde - haben eigene Toene, die in der Rampe nicht vorkommen.

   Die Beschriftung steht hier und nicht in domain/einheiten.js: dort wird
   eingeordnet, hier benannt. */

import { Icon } from './Icon.jsx';
import './einheit.css';

export const EINHEITSARTEN = {
  z2:         { icon:'rad',      label:'Grundlagenausdauer' },
  lang:       { icon:'berg',     label:'Lange Ausfahrt' },
  intervalle: { icon:'bloecke',  label:'Intervalle' },
  test:       { icon:'ziel',     label:'Schwellentest' },
  rumpf:      { icon:'training', label:'Rumpf und Kraft' },
  locker:     { icon:'halbmond', label:'Frei oder locker' },
  ruhe:       { icon:'mond',     label:'Ruhetag' },
  sonstige:   { icon:'blitz',    label:'Sonstige Einheit' }
};

export function einheitsLabel(art){
  const e = EINHEITSARTEN[art];
  return e ? e.label : '';
}

/* `titel` nur setzen, wo das Zeichen allein steht.

   In der Analyseliste steht die Art gleich daneben im Text, im Monatsraster
   traegt der Knopf sie in seinem aria-label. Ein zweites Mal vorgelesen zu
   werden ist dort keine Hilfe, sondern eine Wiederholung. */
export function Einheitssymbol({ art, klasse, mitTitel }){
  const e = EINHEITSARTEN[art] || EINHEITSARTEN.sonstige;
  return (
    <span class={'esym art-' + (EINHEITSARTEN[art] ? art : 'sonstige') + (klasse ? ' ' + klasse : '')}>
      <Icon name={e.icon} titel={mitTitel ? e.label : undefined} />
    </span>
  );
}
