/* Welche Art von Einheit das ist - im Plan und in der Aufzeichnung.

   Die Analyseliste kannte bis hierher zwei Faelle: Rad oder nicht Rad. Damit
   trugen die Grundlagenfahrt am Dienstag, der Intervalltag am Donnerstag und
   die lange Ausfahrt am Samstag dasselbe Zeichen - drei Einheiten, die im Plan
   verschiedene Aufgaben haben und beim Durchblaettern der Woche gerade deshalb
   auseinandergehalten werden wollen. Die Plan-Ansicht hatte die Unterscheidung
   schon, aber nur als Farbpunkt im Monatsraster.

   Die Arten stehen hier und nicht in der Anzeige, weil sie beide Ansichten
   betreffen: der Plan kennt seine Art aus buildDayInfo (dort steht `art` am
   Tag), die Aufzeichnung muss aus ihren eigenen Werten geschlossen werden. Das
   Zeichen und die Farbe je Art stehen in ui/components/Einheitssymbol.jsx -
   das ist Anzeige, nicht Trainingslehre.

   Rein: kein DOM, keine Uhr, kein fetch. */

import { isRide, isStrength } from './analysis.js';
import { zonenAusAktivitaet } from './verlauf.js';

/* Ab dieser Dauer ist eine Fahrt die lange Ausfahrt.

   Der Plan faehrt sie samstags zwischen 90 und 185 min, die uebrigen Radtage
   hoechstens 90. Zwei Stunden trennen die beiden Gruppen fuer den groessten
   Teil des Plans, ohne dass die Einordnung wissen muss, welcher Wochentag
   gerade ist - eine Ausfahrt bleibt eine Ausfahrt, auch wenn sie am Sonntag
   stattfand. */
const LANG_MINUTEN = 120;

/* Ab diesem Anteil oberhalb Z2 war es ein Intervalltag.

   Gerechnet auf alles ueber Z2, weil zonenAusAktivitaet nur bis dahin trennt -
   und weil ein Puls im Bereich Z3 waehrend einer Grundlagenfahrt nichts ist,
   was man ueber ein Viertel der Zeit haelt. Die Schwelle liegt hoch genug,
   dass Ampeln, Anstiege und der Pulsanstieg am Ende einer Fahrt sie nicht
   erreichen. */
const HART_ANTEIL = 0.15;

/* Die Reihenfolge ist die Aussage: erst die Dauer, dann die Haerte.

   Die lange Ausfahrt traegt ab Woche 5 Bloecke in Z3 - bei 3 x 10 min in einer
   Fahrt ueber zweieinhalb Stunden liegt der harte Anteil ueber der Schwelle,
   und die Ausfahrt waere als Intervalltag gezaehlt worden. Sie ist aber keiner:
   die Bloecke stecken in einer langen Fahrt und sind nicht ihr Zweck.

   Ein Schwellentest wird bewusst nicht erraten. Er sieht in den Zonenzeiten
   aus wie ein Intervalltag, und der Name der Aufzeichnung kommt von der Uhr,
   nicht vom Plan. Im Plan steht er, dort ist er sicher. */
export function artDerAktivitaet(a){
  if(!a) return 'sonstige';
  if(!isRide(a.type)) return isStrength(a.type) ? 'rumpf' : 'sonstige';

  const min = (a.moving_time || a.elapsed_time || 0) / 60;
  if(min >= LANG_MINUTEN) return 'lang';

  const z = zonenAusAktivitaet(a);
  if(z && z.hart / z.gesamt >= HART_ANTEIL) return 'intervalle';
  return 'z2';
}
