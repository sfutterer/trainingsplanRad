/* Der Ring ist die Hauptanzeige waehrend des Trainings.

   Hier gelten Material-3-Konventionen nicht: gelesen wird aus zwei Metern
   Entfernung, mit schwitzigen Haenden, oft im Gegenlicht. Deshalb sehr grosse
   Ziffern, harte Phasenwechsel statt weicher Uebergaenge, und die Flaeche
   faerbt sich mit, nicht nur der Ring. */

const R = 98;
const CIRC = 2 * Math.PI * R;

export function ProgressRing({ fraction, color, phase, time, exercise, meta, zone, onTap }){
  return (
    <div class="ring" style={'--ringcolor:' + color} onClick={onTap}>
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <circle class="track" cx="110" cy="110" r={R}></circle>
        <circle class="prog" cx="110" cy="110" r={R}
          style={'stroke-dasharray:' + CIRC + ';stroke-dashoffset:' + (CIRC * (1 - fraction))}></circle>
      </svg>
      <div class="ringmid">
        <div class="phase">{phase}</div>
        <div class="time">{time}</div>
        <div class="ex">{exercise}</div>
        {meta ? <div class="meta">{meta}</div> : null}
        {zone ? <div class={'zone z-' + (zone.cls || 'z1')}>{zone.label}</div> : null}
      </div>
    </div>
  );
}
