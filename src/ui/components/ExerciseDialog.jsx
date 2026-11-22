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

import { plan, week, stufen, setStufe } from '../../state/store.js';
import { repLong, legDose, legRepText } from '../../domain/core.js';
import { stufeText, stufenleiter } from '../../domain/kraft.js';
import { Auswahlfeld } from './Feld.jsx';
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
  const leiter = ex.stufenleiter ? stufenleiter(p, ex.stufenleiter) : null;

  return (
    <Sheet onClose={onClose} labelledBy="exdialog-titel">
      <Uebungsbild src={ex.img} name={ex.name} />
      <h3 id="exdialog-titel">{ex.name}</h3>
      {dosis ? <div class="dose">{dosis}</div> : null}
      {/* Die Stufe wird hier umgestellt und nicht mehr in einer Karte unter
          dem Kraftablauf: sie gehoert an die Uebung, die sie betrifft, und im
          Trainingsbereich nahm sie als Block aus vier Auswahlfeldern Platz
          weg, ohne dass man sie dort je ansah. Sie ist ein Stand, keine
          Vorgabe - gespeichert auf dem Geraet, gueltig in Zirkel und
          Kraftablauf zugleich. */}
      {stufe ? (
        <div class="stufenwahl">
          <Auswahlfeld titel={'Stufe (' + (stufe.index + 1) + ' von ' + stufe.anzahl + ')'}
            wert={String(stufe.index)}
            onWert={v => setStufe(ex.stufenleiter, parseInt(v, 10) || 0)}
            optionen={leiter.stufen.map((x, i) => ({ id: String(i), label: (i + 1) + '. ' + x }))} />
        </div>
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
