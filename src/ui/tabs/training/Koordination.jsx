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
   weiterrueckt. Sie steht als letzte Karte, weil sie einmal gelesen und dann
   fuer Wochen nicht mehr angesehen wird; bisher lag sie zwischen Kopf und
   Uebungen mitten im Weg.

   Der gefuehrte Ablauf liegt in Koerperablauf.jsx, gemeinsam mit dem der
   Beweglichkeit. Hier zaehlt die Uhr an drei der vier Uebungen, denn hier steht
   die Dosierung in Sekunden - "3 × 20–30 s je Seite" laesst sich nicht im Kopf
   mitzaehlen, waehrend man mit geschlossenen Augen auf einem Bein steht. Der
   Ablauf haelt nach jedem Satz an und schaltet nie von selbst in die naechste
   Uebung; die Freischaltregel bleibt damit eine Entscheidung des Nutzers und
   keine der App. */

import { plan, today, startDate } from '../../../state/store.js';
import { koordinationsRest } from '../../../domain/day.js';
import { Baustein } from './Baustein.jsx';
import { useKoerperablauf } from './Koerperablauf.jsx';

export function Koordination({ onOpen }){
  const c = plan.value.coordination;
  const uebungen = c.exercises;
  const rhythmus = Math.max(1, c.everyNthDay);

  /* Der Rest kommt aus der Domaene und wird hier nicht ein zweites Mal
     gerechnet: die Tageskarte haengt den Block an denselben Takt, und zwei
     Rechnungen fuer dieselbe Frage geben irgendwann zwei Antworten. */
  const rest = koordinationsRest(plan.value, today.value, startDate.value);
  const istHeute = rest === 0;
  const inTagen = rest == null ? null : (rest === 0 ? 0 : rhythmus - rest);

  const naechster = inTagen === 1 ? 'morgen'
    : inTagen === 2 ? 'übermorgen'
    : 'in ' + inTagen + ' Tagen';

  const { buehne, liste } = useKoerperablauf({
    uebungen, timerId: 'koordination',
    label: 'Koordination', segment: 'coordination', onOpen
  });

  return (
    <Baustein
      titel="Koordination"
      meta={c.durationHint + ' · alle ' + rhythmus + ' Tage'}
      status={rest == null
        ? <p class="tagchip">Ohne Startdatum lässt sich der Rhythmus nicht ausrechnen.</p>
        : <p class={'tagchip' + (istHeute ? ' an' : '')}>
            {istHeute ? 'Heute ist Koordinationstag.' : 'Heute nicht dran – der nächste ist ' + naechster + '.'}
          </p>}
      buehne={buehne}
      hinweise={[c.placement, c.scope]}
      schluss={
        <div class="card">
          <div class="row"><span>Freischaltregel</span><b>zwei Stufen</b></div>
          <p class="hint">
            Keine Wochenprogression: erst weiterrücken, wenn die aktuelle Stufe sauber gelingt.
          </p>
          <ol class="stufen">
            {c.progression.map((s, i) => (
              <li key={i}><span class="stufennr">Stufe {i + 1}</span><span>{s}</span></li>
            ))}
          </ol>
        </div>
      }>
      {liste}
    </Baustein>
  );
}
