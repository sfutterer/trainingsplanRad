/* Uebungsanleitung als Bottom Sheet - auf Android das uebliche Muster fuer
   Detailinhalte, und die Greifzone liegt unten.

   Fuenf Herkuenfte, ein Dialog: Rumpfzirkel, Beinblock, Beweglichkeit,
   Koordination und seit Plan 2 die Krafteinheiten mit Saetzen. Alle
   beschreiben ihre Uebungen gleich (Video, Schritte, Ziel), nur die Dosierung
   entsteht unterschiedlich. Beim Zirkel und beim Beinblock wird sie aus Woche
   und Sekunden gerechnet, bei Beweglichkeit und Koordination steht sie fertig
   im Plan, bei der Kraft reicht der Aufrufer sie als Text herein - sie haengt
   am Programm und an der Kraftphase der Woche, nicht an der Uebung.

   Seit dem 15.11.2026 steht oben das Video der Uebung (Uebungsbild.jsx) und
   darunter ein Verweis auf YouTube - im Vollbild der App ist der eingebettete
   Player manchmal kleiner, als man ihn haben will.

   Escape, Fokusfalle und die Rueckgabe des Fokus liegen in Sheet.jsx - der
   Dialog teilt sie sich mit dem Tagesueberblick und den Rueckfragen. */

import { plan, week, stufen } from '../../state/store.js';
import { repLong, legDose, legRepText } from '../../domain/core.js';
import { stufeText } from '../../domain/kraft.js';
import { Sheet } from './Sheet.jsx';
import { Uebungsbild, istVideo, videoLink } from '../tabs/training/Uebungsbild.jsx';

const QUELLEN = {
  core:         p => p.circuit.exercises,
  leg:          p => p.legs.exercises,
  mobility:     p => p.mobility.exercises,
  coordination: p => p.coordination.exercises,
  kraft:        p => (p.kraft ? p.kraft.uebungen : [])
};

export function ExerciseDialog({ spec, workSec, onClose }){
  /* Der Trainingsbereich kann eine andere Woche zeigen als die von heute -
     auch eine aus dem anderen Plan. Der Dialog nimmt dann deren Uebungen. */
  const p = spec.plan || plan.value;
  const istBein = spec.kind === 'leg';
  const istKraft = spec.kind === 'kraft';
  const istKoerper = spec.kind === 'mobility' || spec.kind === 'coordination';
  const quelle = QUELLEN[spec.kind] || QUELLEN.core;
  const liste = quelle(p);
  const ex = spec.key ? liste.find(x => x.key === spec.key) : liste[spec.i];
  if(!ex) return null;
  const dose = istBein ? legDose(p, spec.week || week.value) : null;
  const dosis = istKraft
    ? (spec.dosis || '')
    : istBein
    ? legRepText(ex, dose) + ' · ' + p.texts.legTempoPlain +
      (ex.perSide ? ' ' + p.texts.legPerSideNote : '') + ' ' + ex.progression
    : istKoerper
      ? ex.dosage + ' · ' + ex.focus
      : repLong(ex, workSec);
  const stufe = ex.stufenleiter ? stufeText(p, ex.stufenleiter, stufen.value) : null;

  return (
    <Sheet onClose={onClose} labelledBy="exdialog-titel">
      <Uebungsbild src={ex.img} name={ex.name} />
      <h3 id="exdialog-titel">{ex.name}</h3>
      {dosis ? <div class="dose">{dosis}</div> : null}
      {stufe ? (
        <p class="hint">Aktuelle Stufe {stufe.index + 1} von {stufe.anzahl}: <b>{stufe.text}</b></p>
      ) : null}
      <ol>{ex.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      <p class="goal">{istBein ? ex.why + ' ' + ex.goal : ex.goal}</p>
      {istVideo(ex.img) ? (
        <p class="hint">
          <a href={videoLink(ex.img)} target="_blank" rel="noopener noreferrer">Video auf YouTube öffnen</a>
        </p>
      ) : null}
      <button class="btn block" onClick={onClose}>Schließen</button>
    </Sheet>
  );
}
