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

import { signal } from '@preact/signals';
import { tab } from './store.js';

export const BEREICHE = {
  plan:          'Plan',
  training:      'Training',
  intervalle:    'Intervalle',
  analyse:       'Analyse',
  test:          'Schwellentest',
  zonen:         'Zonen & Schwellenwerte',
  einstellungen: 'Einstellungen',
  about:         'Über die App'
};

/* Die Bausteine innerhalb des Trainingsbereichs. Sie stehen aus demselben
   Grund hier wie die Bereiche: wer von aussen auf einen Baustein zeigt, muss
   geprueft werden koennen, und der Zielbereich allein genuegt nicht.

   Welcher Baustein offen ist, war bis zum 31.10.2026 ein useState im
   Trainings-Tab - und genau daran scheiterte der Sprung von der Tageskarte.
   Die Knoepfe "Beinblock öffnen" und "Rumpf-Timer öffnen" nannten beide nur
   den Bereich; welcher Baustein gemeint war, ging unterwegs verloren. Der Tab
   bleibt montiert, sobald er einmal offen war, also stand dort noch der
   Baustein des letzten Besuchs: am Dienstag fuehrte "Beinblock öffnen" in den
   Rumpf, am Mittwoch "Rumpf-Timer öffnen" in die Beine. Solange Rumpf und
   Beine auf denselben Tag fielen, fiel es nicht auf.

   Als Signal ist es Zustand wie jeder andere: der Tab liest ihn und schreibt
   ihn, der Sprung von aussen setzt ihn mit. */
export const BAUSTEINE = {
  core:         'Rumpf',
  leg:          'Beine',
  mobility:     'Beweglichkeit',
  coordination: 'Koordination',
  neutral:      'Timer'
};

export const baustein = signal('core');

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

/* `ziel` darf einen Baustein mitbringen: gotoTab('training', true, 'leg')
   oeffnet den Trainingsbereich und darin den Beinblock.

   Der Baustein wird vor der Rueckkehr gesetzt. Wer schon im Trainingsbereich
   steht und auf einen anderen Baustein zeigt, waere sonst an der Pruefung
   darunter haengengeblieben - der Bereich stimmt ja bereits. */
export function gotoTab(roh, push, bausteinId){
  const id = tabId(roh);
  if(!id) return;
  if(bausteinId && BAUSTEINE[bausteinId]) baustein.value = bausteinId;
  if(tab.value === id) return;
  tab.value = id;
  if(push) history.pushState({ tab: id }, '', '#' + id);
  const c = document.querySelector('.content');
  if(c) c.scrollTop = 0;
}

export { tab };
