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

/* Die Radeinheiten, die ein Tag im Plan tragen kann. "locker" gehoert nicht
   dazu: der Freitag laesst offen, ob gefahren wird, und sagt deshalb auch
   nichts darueber, was eine Fahrt an diesem Tag war. */
const RADARTEN = ['z2', 'lang', 'intervalle', 'test'];

/* Die Art der Radeinheit, die der Plan an diesem Tag vorsieht, oder null.
   `info` ist das Ergebnis von buildDayInfo. */
export function geplanteRadart(info){
  if(!info || info.vorStart) return null;
  const e = (info.einheiten || []).find(x => RADARTEN.includes(x.art));
  return e ? e.art : null;
}

/* Steht fuer den Tag eine Radeinheit im Plan, ist die Fahrt diese Einheit.

   Seit dem 31.10.2026. Bis dahin entschied allein die Aufzeichnung, und die
   kann eine Grundlagenfahrt nahe der Z2-Obergrenze nicht von einem
   Tempo-Intervalltag trennen: der Dienstag vom 27.10.2026 lag bei Ø 136 bpm
   zu 46 % oberhalb der zweiten Pulszone von intervals.icu, der Z3-Donnerstag
   vom 27.08.2026 bei Ø 136 bpm und hoechstens 158 - in den Zonensummen sind
   die beiden nicht zu unterscheiden. Der Plan weiss, was an dem Tag dran war.

   Ohne geplante Radeinheit - Ruhetag, freier Freitag, vor Planbeginn - bleibt
   die Einordnung aus den eigenen Werten.

   Die Reihenfolge dort ist die Aussage: erst die Dauer, dann die Haerte.

   Die lange Ausfahrt traegt ab Woche 5 Bloecke in Z3 - bei 3 x 10 min in einer
   Fahrt ueber zweieinhalb Stunden liegt der harte Anteil ueber der Schwelle,
   und die Ausfahrt waere als Intervalltag gezaehlt worden. Sie ist aber keiner:
   die Bloecke stecken in einer langen Fahrt und sind nicht ihr Zweck.

   Ein Schwellentest wird bewusst nicht erraten. Er sieht in den Zonenzeiten
   aus wie ein Intervalltag, und der Name der Aufzeichnung kommt von der Uhr,
   nicht vom Plan. Im Plan steht er, dort ist er sicher. */
export function artDerAktivitaet(a, geplant){
  if(!a) return 'sonstige';
  if(!isRide(a.type)) return isStrength(a.type) ? 'rumpf' : 'sonstige';
  if(geplant) return geplant;

  const min = (a.moving_time || a.elapsed_time || 0) / 60;
  if(min >= LANG_MINUTEN) return 'lang';

  const z = zonenAusAktivitaet(a);
  if(z && z.hart / z.gesamt >= HART_ANTEIL) return 'intervalle';
  return 'z2';
}
