/* Die Glocke: was heute ansteht, ohne den Bereich zu wechseln.

   Bewusst knapp - wer mehr wissen will, ist zwei Antipper vom Plan entfernt.
   Als Bottom Sheet, weil die Greifzone unten liegt. */

import { plan, thresholds, startDate, today } from '../../state/store.js';
import { buildDayInfo } from '../../domain/day.js';
import { WEEKDAY_NAMES } from '../../domain/week.js';

export function HeuteOverlay({ onClose, onZumPlan }){
  const info = buildDayInfo(plan.value, thresholds.value, today.value, startDate.value);
  const d = today.value;

  return (
    <div class="dialog" onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div class="sheet" role="dialog" aria-label="Was heute ansteht">
        <div class="grip"></div>
        <div class="heute-kopf">
          <span>{WEEKDAY_NAMES[d.getDay()]}, {d.toLocaleDateString('de-DE')}</span>
          <span>Woche {info.week}{info.winter ? '' : ' / ' + plan.value.weekCount}</span>
        </div>
        <h3 class={'type-' + info.type}>{info.title}</h3>
        <p class="heute-detail">{info.detail}</p>
        {info.wellness && <p class="heute-regel">{plan.value.texts.wellnessRule}</p>}
        <div class="buttons" style="margin-top:16px">
          <button class="btn" onClick={onZumPlan}>Zum Plan</button>
          <button class="btn secondary" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}
