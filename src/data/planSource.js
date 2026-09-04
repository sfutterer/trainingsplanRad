/* Woher der Plan kommt.

   Reihenfolge: eigener Plan aus dem Speicher, sonst plan.json aus dem Repo.
   Die Datei im Repo ist damit der Default, nicht die Wahrheit - wer den Plan
   im laufenden Betrieb aendert, ueberschreibt ihn lokal und behaelt trotzdem
   jederzeit den Weg zurueck.

   Ein kaputter oder fehlender Plan fuehrt zu einer Fehlermeldung, nicht zu
   Ersatzwerten. Lieber gar keine Vorgabe als eine falsche. */

import { planValidate, PLAN_SCHEMA_VERSION } from '../domain/schema.js';
import { createPlan } from '../domain/plan.js';

const PLAN_URL = 'plan.json';

export class PlanError extends Error {
  constructor(titel, zeilen){
    super(titel);
    this.titel = titel;
    this.zeilen = zeilen || [];
  }
}

/* Trennt Pruefen von Laden, damit der Import in der Oberflaeche dieselbe
   Pruefung benutzt wie der Start. */
export function parsePlan(json, herkunft){
  const fehler = planValidate(json);
  if(fehler.length){
    const kopf = fehler.slice(0, 12);
    if(fehler.length > kopf.length) kopf.push('… und ' + (fehler.length - kopf.length) + ' weitere Beanstandungen.');
    throw new PlanError('Der Plan (' + herkunft + ') ist nicht verwendbar.', kopf);
  }
  return createPlan(json);
}

export async function loadPlan(repos, fetchImpl){
  const eigener = await repos.planOverride();
  if(eigener){
    try {
      return { plan: parsePlan(eigener, 'eigener Plan'), source: 'override', json: eigener };
    } catch(e){
      /* Der eigene Plan ist kaputt. Nicht still auf den Default zurueckfallen -
         sonst rechnet die App mit anderen Zahlen, als der Nutzer eingestellt hat.

         Der Fehlerbildschirm ersetzt die ganze App: es gibt in diesem Zustand
         keine Tabs, also auch nicht den Knopf in den Einstellungen, auf den der
         Hinweis bis zum 30.08.2026 verwies. Stattdessen traegt der Fehler jetzt
         die Marke istEigener, und der Bildschirm bietet das Verwerfen selbst
         an - sonst ist die App mit einem alten eigenen Plan verriegelt. */
      const pe = new PlanError('Dein eigener Plan ist nicht verwendbar.',
        (e.zeilen || [e.message]).concat([
          'Der Default aus dem Repo liegt weiter bereit – unten verwerfen und neu laden.'
        ]));
      pe.istEigener = true;
      throw pe;
    }
  }

  const f = fetchImpl || fetch;
  let res;
  try {
    res = await f(PLAN_URL, { cache: 'no-cache' });
  } catch(e){
    throw new PlanError('plan.json konnte nicht geladen werden.', [
      'Keine Verbindung zur Datei. Offline und noch nichts im Cache?'
    ]);
  }
  if(!res.ok){
    throw new PlanError('plan.json konnte nicht geladen werden: Der Server antwortete mit ' + res.status + '.',
      ['Liegt plan.json neben index.html und ist sie erreichbar?']);
  }
  let json;
  try {
    json = await res.json();
  } catch(e){
    throw new PlanError('plan.json ist kein gültiges JSON.',
      [String(e.message), 'Häufigste Ursachen: ein Komma zu viel oder zu wenig, ein fehlendes Anführungszeichen, oder ein Kommentar – JSON kennt keine.']);
  }
  return { plan: parsePlan(json, 'plan.json'), source: 'default', json };
}

export { PLAN_SCHEMA_VERSION };
