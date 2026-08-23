/* Uebungsanleitung als Bottom Sheet - auf Android das uebliche Muster fuer
   Detailinhalte, und die Greifzone liegt unten. */

import { plan } from '../../state/store.js';
import { repLong, legDose, legRepText } from '../../domain/core.js';
import { week } from '../../state/store.js';

export function ExerciseDialog({ spec, workSec, onClose }){
  const p = plan.value;
  const istBein = spec.kind === 'leg';
  const ex = istBein ? p.legs.exercises[spec.i] : p.circuit.exercises[spec.i];
  if(!ex) return null;

  const dose = istBein ? legDose(p, week.value) : null;
  const dosis = istBein
    ? legRepText(ex, dose) + ' · ' + p.texts.legTempoPlain +
      (ex.perSide ? ' ' + p.texts.legPerSideNote : '') + ' ' + ex.progression
    : repLong(ex, workSec);

  return (
    <div class="dialog" onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div class="sheet" role="dialog" aria-label={ex.name}>
        <div class="grip"></div>
        {ex.img && <img src={ex.img} alt={ex.name} loading="lazy"
          style="width:100%;border-radius:12px;display:block;margin-bottom:12px" />}
        <h3>{ex.name}</h3>
        <div class="dose">{dosis}</div>
        <ol>{ex.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        <p class="goal">{istBein ? ex.why + ' ' + ex.goal : ex.goal}</p>
        <button class="btn block" style="margin-top:14px" onClick={onClose}>Schließen</button>
      </div>
    </div>
  );
}
