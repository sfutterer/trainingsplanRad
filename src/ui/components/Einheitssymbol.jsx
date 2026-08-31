/* Das Zeichen einer Einheitsart - dasselbe im Plan und in der Analyse.

   Eine Art, ein Zeichen, eine Farbe: was am Donnerstag als Intervalltag im
   Plan steht, traegt in der Analyseliste dasselbe Zeichen in derselben Farbe.
   Anders herum waere die Liste eine zweite Sprache fuer dieselbe Sache - und
   die Frage "war das die Einheit, die dastand?" muesste man uebersetzen.

   Jede Radeinheit zeigt ein Rad - die Art steht als Kennzeichen daneben, nicht
   an seiner Stelle. Wer die Liste ueberfliegt, soll zuerst sehen, DASS
   gefahren wurde, und erst dann was.

   Die Farben kommen aus der Zonenrampe, wo die Art eine Zone meint: Grundlage
   gruen wie Z2, die lange Ausfahrt in der Farbe der Bloecke, Intervalle rot
   wie Z5, Rumpf blau wie Z1. Der Schwellentest liegt zwischen Intervall und
   Grundlage und bekommt Z4. Nur die beiden Arten ohne Zone - der lockere Tag
   und alles Fremde - haben eigene Toene, die in der Rampe nicht vorkommen.

   Die Beschriftung steht hier und nicht in domain/einheiten.js: dort wird
   eingeordnet, hier benannt. */

import { Icon } from './Icon.jsx';
import './einheit.css';

/* Was gefahren wird, traegt ein Rad - immer dasselbe, mit einem Kennzeichen
   fuer die Art. Vier Fahrten stehen im Plan: die Grundlagenfahrt ohne
   Kennzeichen, dazu Intervalle, lange Ausfahrt und Schwellentest.

   Der lockere Freitag bekommt keines: er ist "Ruhetag ODER lockere Fahrt" -
   ein Rad wuerde eine Fahrt behaupten, die der Plan gerade offen laesst. */
export const EINHEITSARTEN = {
  z2:         { icon:'rad',           label:'Grundlagenausdauer' },
  lang:       { icon:'radLang',       label:'Lange Ausfahrt' },
  intervalle: { icon:'radIntervalle', label:'Intervalle' },
  test:       { icon:'radTest',       label:'Schwellentest' },
  rumpf:      { icon:'training',      label:'Rumpf und Kraft' },
  locker:     { icon:'halbmond',      label:'Frei oder locker' },
  ruhe:       { icon:'mond',          label:'Ruhetag' },
  sonstige:   { icon:'blitz',         label:'Sonstige Einheit' }
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
