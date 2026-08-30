/* Welcher Bereich ist offen, und wie kommt man dorthin.

   Lag vorher in App.jsx. Das ergab einen Ring: App.jsx zieht die Bereiche
   herein, und zwei von ihnen (AnalyseTab, Tag) zogen gotoTab aus App.jsx
   zurueck. Das laeuft dank ESM-Hoisting, stellt die Schichtung aber auf den
   Kopf - der Rahmen darf die Bereiche kennen, nicht umgekehrt.

   Hier ist es an der richtigen Stelle: welcher Bereich offen ist, ist Zustand
   wie jeder andere, und tab lag ohnehin schon als Signal in store.js. Der
   Rahmen liest ihn, die Bereiche schreiben ihn - ohne dass sie einander
   kennen.

   Die Bereichsliste steht hier und nicht in App.jsx, weil gotoTab pruefen
   muss, ob es das Ziel gibt. Welche Komponente dazu gehoert, weiss weiterhin
   nur App.jsx - das ist die Zuordnung, die den Ring erzeugt hat. */

import { tab } from './store.js';

export const BEREICHE = {
  plan:          'Plan',
  training:      'Training',
  intervalle:    'Intervalle',
  analyse:       'Analyse',
  zonen:         'Zonen & Schwellenwerte',
  einstellungen: 'Einstellungen',
  about:         'Über die App'
};

/* Die vier Ziele der unteren Leiste - die Bereiche, die waehrend des Trainings
   gebraucht werden. Alles Seltenere steht nur im Drawer. */
export const HAUPTZIELE = ['plan', 'training', 'intervalle', 'analyse'];

/* Alte Bereichsnamen, die auf den Sammelbereich Training zeigen. "kraft" steht
   in Lesezeichen und im Verlauf, seit der Bereich noch nur den Zirkel und den
   Beinblock trug; "rumpf" wurde nie vergeben, aber aus dem Plan heraus
   angesprungen. Beide hier abzufangen ist billiger, als einen Link ins Leere
   laufen zu lassen - gotoTab verwirft unbekannte Namen sonst still. */
const ALIAS = { kraft: 'training', rumpf: 'training' };

export function tabId(roh){
  const id = ALIAS[roh] || roh;
  return BEREICHE[id] ? id : null;
}

export function gotoTab(roh, push){
  const id = tabId(roh);
  if(!id || tab.value === id) return;
  tab.value = id;
  if(push) history.pushState({ tab: id }, '', '#' + id);
  const c = document.querySelector('.content');
  if(c) c.scrollTop = 0;
}

export { tab };
