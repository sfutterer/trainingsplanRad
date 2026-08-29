/* Uebungsanleitung als Bottom Sheet - auf Android das uebliche Muster fuer
   Detailinhalte, und die Greifzone liegt unten.

   Vier Herkuenfte, ein Dialog: Rumpfzirkel, Beinblock, Beweglichkeit und
   Koordination beschreiben ihre Uebungen gleich (Bild, Schritte, Ziel), nur
   die Dosierung entsteht unterschiedlich. Beim Zirkel und beim Beinblock wird
   sie aus Woche und Sekunden gerechnet, bei Beweglichkeit und Koordination
   steht sie fertig im Plan. Deshalb nur eine Fallunterscheidung fuer den
   Dosistext und kein zweiter Dialog.

   Escape schliesst. Ein vollstaendiger Fokus-Trap fehlt weiterhin - er
   braucht Fokusverwaltung beim Oeffnen und Schliessen und gehoert in einen
   eigenen Schritt; die Taste kostete drei Zeilen und half sofort. */

import { useEffect } from 'preact/hooks';
import { plan, week } from '../../state/store.js';
import { repLong, legDose, legRepText } from '../../domain/core.js';
import { Uebungsbild } from '../tabs/training/Uebungsbild.jsx';

const QUELLEN = {
  core:         p => p.circuit.exercises,
  leg:          p => p.legs.exercises,
  mobility:     p => p.mobility.exercises,
  coordination: p => p.coordination.exercises
};

export function ExerciseDialog({ spec, workSec, onClose }){
  useEffect(() => {
    const aufTaste = e => { if(e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', aufTaste);
    return () => document.removeEventListener('keydown', aufTaste);
  }, [onClose]);

  const p = plan.value;
  const istBein = spec.kind === 'leg';
  const istKoerper = spec.kind === 'mobility' || spec.kind === 'coordination';
  const quelle = QUELLEN[spec.kind] || QUELLEN.core;
  const ex = quelle(p)[spec.i];
  if(!ex) return null;

  const dose = istBein ? legDose(p, week.value) : null;
  const dosis = istBein
    ? legRepText(ex, dose) + ' · ' + p.texts.legTempoPlain +
      (ex.perSide ? ' ' + p.texts.legPerSideNote : '') + ' ' + ex.progression
    : istKoerper
      ? ex.dosage + ' · ' + ex.focus
      : repLong(ex, workSec);

  return (
    <div class="dialog" onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="exdialog-titel">
        <div class="grip"></div>
        <Uebungsbild src={ex.img} name={ex.name} />
        <h3 id="exdialog-titel">{ex.name}</h3>
        <div class="dose">{dosis}</div>
        <ol>{ex.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        <p class="goal">{istBein ? ex.why + ' ' + ex.goal : ex.goal}</p>
        <button class="btn block" style="margin-top:14px" onClick={onClose}>Schließen</button>
      </div>
    </div>
  );
}
