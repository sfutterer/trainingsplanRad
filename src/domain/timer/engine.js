/* Eine Uhr fuer beide Timer.

   Kernentscheidung: die Restzeit wird aus der Wanduhr gerechnet, nicht
   heruntergezaehlt. Die alte Fassung lief als setInterval(1000) mit
   secondsLeft -= 1 je Tick, die verstrichene Zeit war also die Zahl der Ticks.
   Android drosselt Timer im Hintergrund auf bis zu einen Tick pro Minute - der
   Timer lief zu langsam und holte das nie auf. Bei den 20 Minuten des
   Schwellentests ist das ein Messfehler, der ueber FTP und LTHR acht Wochen
   lang in die Zonen durchschlaegt.

   Die Engine kennt nur Sequenz, Cursor und Uhr. Sprachausgabe, Piepser, Wake
   Lock und Protokoll haengen als Abonnenten aussen dran - sie bekommen
   Ereignisse und duerfen einzeln ausfallen, ohne den Ablauf zu stoeren.

   Takt 250 ms statt 1000: kostet nichts und laesst den letzten Piepser nicht
   bis zu einer Sekunde zu spaet kommen. */

const TICK_MS = 250;

export function createTimer({ now = () => Date.now(), setInterval: si = setInterval,
                              clearInterval: ci = clearInterval } = {}){
  let seq = [];
  let index = -1;
  let endsAt = 0;
  let pausedLeftMs = 0;
  let lastShownSec = null;
  let running = false;
  let handle = null;
  const listeners = { step: [], tick: [], done: [], leave: [] };

  const emit = (name, payload) => {
    for(const fn of listeners[name]){
      /* Ein fehlerhafter Abonnent darf den Timer nicht anhalten. */
      try { fn(payload); } catch(e) { /* bewusst geschluckt */ }
    }
  };

  const current = () => seq[index] || null;

  function secondsLeft(){
    const step = current();
    if(!step) return 0;
    if(!running && pausedLeftMs > 0) return Math.ceil(pausedLeftMs / 1000);
    return Math.ceil(Math.max(0, endsAt - now()) / 1000);
  }

  function fraction(){
    const step = current();
    if(!step || !step.duration) return 0;
    const leftMs = running ? Math.max(0, endsAt - now()) : pausedLeftMs;
    return Math.max(0, Math.min(1, leftMs / (step.duration * 1000)));
  }

  function enterStep(i){
    index = i;
    const step = current();
    if(!step) return;
    if(step.type === 'done'){
      lastShownSec = 0;
      endsAt = now();
      stop();
      emit('step', { step, index, secondsLeft: 0 });
      emit('done', { step, index });
      return;
    }
    endsAt = now() + step.duration * 1000;
    pausedLeftMs = step.duration * 1000;
    lastShownSec = step.duration;
    emit('step', { step, index, secondsLeft: step.duration });
  }

  function tick(){
    const step = current();
    if(!step || step.type === 'done') return;
    const leftMs = Math.max(0, endsAt - now());
    const sec = Math.ceil(leftMs / 1000);
    const sekundenwechsel = sec !== lastShownSec;
    if(sekundenwechsel) lastShownSec = sec;
    emit('tick', { step, index, secondsLeft: sec, leftMs, fraction: fraction(), sekundenwechsel });
    if(leftMs <= 0){
      emit('leave', { step, index, restSeconds: 0 });
      enterStep(index + 1);
    }
  }

  function start(){
    if(running) return;
    if(index === -1 || (current() && current().type === 'done')){
      index = -1;
      enterStep(0);
    } else if(secondsLeft() <= 0){
      emit('leave', { step: current(), index, restSeconds: 0 });
      enterStep(index + 1);
    } else {
      endsAt = now() + pausedLeftMs;
    }
    if(current() && current().type === 'done') return;
    running = true;
    handle = si(tick, TICK_MS);
  }

  function pause(){
    if(!running) return;
    /* Restzeit einfrieren - sonst laeuft die Deadline waehrend der Pause weiter. */
    pausedLeftMs = Math.max(0, endsAt - now());
    running = false;
    ci(handle); handle = null;
  }

  function stop(){
    running = false;
    if(handle){ ci(handle); handle = null; }
  }

  function skip(){
    if(index === -1) return;
    const step = current();
    emit('leave', { step, index, restSeconds: secondsLeft() });
    stop();
    enterStep(index + 1);
    if(current() && current().type !== 'done'){
      running = true;
      handle = si(tick, TICK_MS);
    }
  }

  /* Einen Schritt zurueck. Bewusst ohne 'leave': zurueckblaettern heisst "das
     zaehlt nicht, ich mache es noch einmal" - haette der Schritt sein Ergebnis
     schon gemeldet, stuende er zweimal im Protokoll. Und bewusst angehalten:
     Zurueck ist eine Korrektur und kein Weiterlauf. */
  function back(){
    if(index <= 0) return;
    stop();
    enterStep(index - 1);
  }

  function reset(newSeq){
    if(index >= 0 && current() && current().type !== 'done'){
      emit('leave', { step: current(), index, restSeconds: secondsLeft(), abandoned: true });
    }
    stop();
    seq = newSeq || seq;
    index = -1;
    endsAt = 0;
    pausedLeftMs = 0;
    lastShownSec = null;
  }

  return {
    on(name, fn){ listeners[name].push(fn); return () => {
      const i = listeners[name].indexOf(fn); if(i >= 0) listeners[name].splice(i, 1);
    }; },
    load(newSeq){ reset(newSeq); },
    start, pause, skip, back, reset,
    toggle(){ running ? pause() : start(); },
    get running(){ return running; },
    get index(){ return index; },
    get sequence(){ return seq; },
    get step(){ return current(); },
    secondsLeft, fraction
  };
}
