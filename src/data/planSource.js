/* Woher der Plan kommt.

   Reihenfolge: eigener Plan aus dem Speicher, sonst plan.json aus dem Repo.
   Die Datei im Repo ist damit der Default, nicht die Wahrheit - wer den Plan
   im laufenden Betrieb aendert, ueberschreibt ihn lokal und behaelt trotzdem
   jederzeit den Weg zurueck.

   Ein kaputter oder fehlender Plan fuehrt zu einer Fehlermeldung, nicht zu
   Ersatzwerten. Lieber gar keine Vorgabe als eine falsche. */

import { planValidate, PLAN_SCHEMA_VERSION } from '../domain/schema.js';
import { createPlan } from '../domain/plan.js';
import { migriere } from '../domain/migration.js';
import { Meldefehler } from './fehler.js';

const PLAN_URL = 'plan.json';

export class PlanError extends Meldefehler {}

/* Trennt Pruefen von Laden, damit der Import in der Oberflaeche dieselbe
   Pruefung benutzt wie der Start.

   Zuerst die Migration, dann die Pruefung: ein eigener Plan im Speicher kann
   beliebig alt sein, und er ist die einzige Fassung, die der Nutzer nicht mit
   einem Update mitbekommt. Ohne sie hiesse ein Schemawechsel, dass der eigene
   Plan abgelehnt wird und der einzige Weg zurueck darin besteht, ihn
   wegzuwerfen.

   Zurueck kommen Modell und gehobene Datei. Beide, weil der Aufrufer die
   gehobene Fassung speichern und exportieren muss: wer eine Sicherung von
   heute einspielt, soll morgen nicht wieder migriert werden, und der Export
   soll die Datei liefern, mit der die App tatsaechlich rechnet. */
export function parsePlan(rohJson, herkunft){
  const json = migriere(rohJson);
  const fehler = planValidate(json);
  if(fehler.length){
    const kopf = fehler.slice(0, 12);
    if(fehler.length > kopf.length) kopf.push('… und ' + (fehler.length - kopf.length) + ' weitere Beanstandungen.');
    throw new PlanError('Der Plan (' + herkunft + ') ist nicht verwendbar.', kopf);
  }
  /* gehoben sagt, ob die Migration etwas getan hat. Der Aufrufer schreibt
     die gehobene Fassung dann einmal zurueck - ohne das laege im Speicher
     dauerhaft die alte Datei, und die Migration muesste sie bei jedem Start
     erneut heben. Eine Migration, die nie fertig wird, ist eine, die man
     nicht mehr entfernen kann. */
  return { plan: createPlan(json), json, gehoben: json !== rohJson };
}

export async function loadPlan(repos, fetchImpl){
  const eigener = await repos.planOverride();
  if(eigener){
    try {
      /* Die gehobene Fassung geht zurueck und nicht die gespeicherte: sonst
         zeigte der Export eine Datei, mit der die App gar nicht rechnet. */
      const g = parsePlan(eigener, 'eigener Plan');
      return { plan: g.plan, source: 'override', json: g.json, gehoben: g.gehoben };
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
  const g = parsePlan(json, 'plan.json');
  return { plan: g.plan, source: 'default', json: g.json, gehoben: g.gehoben };
}

export { PLAN_SCHEMA_VERSION };
