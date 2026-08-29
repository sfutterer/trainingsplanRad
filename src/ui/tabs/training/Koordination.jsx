/* Koordination: vier Uebungen, alle zwei Tage, 5 bis 8 Minuten.

   Ob heute ein Koordinationstag ist, rechnet die Ansicht aus den beiden
   Signalen today und startDate - also aus demselben Kalender, an dem auch die
   Wochennummer haengt. Kein Date.now() an dieser Stelle: der Rhythmus muss
   sich mit einem verstellten Startdatum durchspielen lassen, ohne die
   Systemuhr zu stellen. Der Tag wird nicht gespeichert, sondern jedes Mal neu
   gerechnet - es gibt nichts, was zwischen Signal und Speicher auseinander
   laufen koennte.

   Bewusst kein Eintrag im Protokoll und kein Abhaken: der Plan sieht fuer
   Beweglichkeit und Koordination ausdruecklich keine Aufzeichnung vor. Ein
   Haken je Tag waere schnell gebaut, wuerde aber eine Auswertung
   versprechen, die es nicht gibt.

   Die zweistufige Progression steht als zwei nummerierte Stufen und nicht als
   Fliesstext: sie ist eine Freischaltregel - die zweite Stufe gilt erst, wenn
   die erste sauber gelingt - und keine Steigerung, die mit der Woche
   weiterrueckt. */

import { plan, today, startDate } from '../../../state/store.js';
import { toMidnight } from '../../../domain/week.js';

/* Ganze Tage zwischen zwei Mitternachten. Gerundet statt abgeschnitten: in den
   Umstellungsnaechten liegen 23 oder 25 Stunden zwischen zwei Mitternachten,
   abschneiden ergaebe dort einen Tag zu wenig. */
function tageSeit(von, bis){
  return Math.round((toMidnight(bis) - toMidnight(von)) / 86400000);
}

export function Koordination({ onOpen }){
  const c = plan.value.coordination;
  const uebungen = c.exercises;
  const rhythmus = Math.max(1, c.everyNthDay);

  const start = startDate.value;
  const tage = start ? tageSeit(start, today.value) : null;
  const rest = tage == null ? null : ((tage % rhythmus) + rhythmus) % rhythmus;
  const istHeute = rest === 0;
  const inTagen = rest == null ? null : (rest === 0 ? 0 : rhythmus - rest);

  const naechster = inTagen === 1 ? 'morgen'
    : inTagen === 2 ? 'übermorgen'
    : 'in ' + inTagen + ' Tagen';

  return (
    <>
      <div class="card">
        <div class="row"><span>Koordination</span><b>{c.durationHint} · alle {rhythmus} Tage</b></div>
        {rest == null
          ? <p class="tagchip">Ohne Startdatum lässt sich der Rhythmus nicht ausrechnen.</p>
          : <p class={'tagchip' + (istHeute ? ' an' : '')}>
              {istHeute ? 'Heute ist Koordinationstag.' : 'Heute nicht dran – der nächste ist ' + naechster + '.'}
            </p>}
        <p class="hint">{c.placement}</p>
      </div>

      <div class="card">
        <div class="row"><span>Freischaltregel</span><b>zwei Stufen</b></div>
        <p class="hint" style="margin-top:2px">
          Keine Wochenprogression: erst weiterrücken, wenn die aktuelle Stufe sauber gelingt.
        </p>
        <ol class="stufen">
          {c.progression.map((s, i) => (
            <li key={i}><span class="stufennr">Stufe {i + 1}</span><span>{s}</span></li>
          ))}
        </ol>
      </div>

      <div class="card">
        <div class="row"><span>Übungen</span><b>{uebungen.length} Stück</b></div>
        <div class="exlist koerperliste" style="margin-top:8px">
          {uebungen.map((ex, i) => (
            <button class="exrow" key={ex.key} onClick={() => onOpen(i)}>
              <span class="exname">
                {i + 1}. {ex.name}
                <small><b>{ex.dosage}</b> · {ex.focus}</small>
              </span>
              <span class="ziel">›</span>
            </button>
          ))}
        </div>
        <p class="hint">{c.scope}</p>
      </div>
    </>
  );
}
