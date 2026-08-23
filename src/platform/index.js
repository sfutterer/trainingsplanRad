/* Browser-Faehigkeiten, je hinter einer Funktion.

   Grundregel: jede darf ausfallen, ohne die App zu brechen. Der Wake Lock
   fehlt auf manchen Geraeten, die Sprachausgabe braucht eine Nutzergeste, und
   in einer eingebetteten Umgebung sind beide gar nicht deklarierbar. Wer das
   nicht kapselt, hat den Fehler mitten im Timer. */

/* ---- Bildschirm anlassen ---- */
let wakeLock = null;
let wollen = true;
let videoEl = null;
const wakeListeners = [];

export function onWakeChange(fn){ wakeListeners.push(fn); return () => {
  const i = wakeListeners.indexOf(fn); if(i >= 0) wakeListeners.splice(i, 1);
}; }

function meldeWake(active, note){
  for(const fn of wakeListeners){ try { fn({ active, note }); } catch(e){} }
}

export function setKeepAwake(v){
  wollen = !!v;
  if(!wollen) releaseWakeLock();
  else ensureWakeLock();
}

export function wantsKeepAwake(){ return wollen; }

/* Video-Notnagel fuer Browser ohne Wake Lock API. Ein stumm geloopter Clip
   haelt den Bildschirm wach - haesslich, aber es funktioniert. */
export function registerNoSleepVideo(el){ videoEl = el; }

export async function ensureWakeLock(){
  if(!wollen) return false;
  if(document.visibilityState !== 'visible') return false;
  if('wakeLock' in navigator){
    try {
      if(wakeLock) return true;
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; meldeWake(false, 'freigegeben'); });
      meldeWake(true, 'Wake Lock');
      return true;
    } catch(e){ /* faellt auf das Video zurueck */ }
  }
  if(videoEl){
    try {
      await videoEl.play();
      meldeWake(true, 'Video-Notnagel');
      return true;
    } catch(e){ /* braucht eine Nutzergeste */ }
  }
  meldeWake(false, 'nicht verfügbar');
  return false;
}

export function releaseWakeLock(){
  if(wakeLock){ try { wakeLock.release(); } catch(e){} wakeLock = null; }
  if(videoEl){ try { videoEl.pause(); } catch(e){} }
  meldeWake(false, null);
}

if(typeof document !== 'undefined'){
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'visible') ensureWakeLock();
  });
}

/* ---- Sprachausgabe ---- */
let speechPrimed = false;

/* Chrome auf Android gibt Sprache erst nach einer Nutzergeste frei. Einmal
   eine leere Aeusserung abzusetzen schaltet das frei, ohne hoerbar zu sein. */
export function primeSpeech(){
  if(speechPrimed || !('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
    speechPrimed = true;
  } catch(e){}
}

let ansageTimer = null;

/* Eine neue Ansage ersetzt die alte, sie stellt sich nicht dahinter.

   speak() reiht standardmaessig ein. Wer fuenfmal "Weiter" drueckt, sammelt
   damit fuenf Ansagen an, die nacheinander abgespielt werden - laengst nachdem
   man weitergegangen ist. In dieser App gibt es keinen Fall, in dem zwei
   Ansagen gleichzeitig gelten: die letzte beschreibt immer den Schritt, in dem
   man gerade steht. */
export function speak(text, enabled){
  if(!enabled || !text || !('speechSynthesis' in window)) return;
  try {
    const s = window.speechSynthesis;
    /* Chrome haelt die Sprachausgabe an, sobald die Seite den Fokus verliert,
       und kommt danach nicht immer von selbst zurueck. */
    if(s.paused) s.resume();
    s.cancel();
    if(ansageTimer) clearTimeout(ansageTimer);

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 1.0;
    /* cancel() und speak() unmittelbar nacheinander verschluckt Chrome
       gelegentlich - die neue Aeusserung faellt dann stillschweigend aus.
       Ein Tick Abstand genuegt, und er sammelt zugleich schnelle
       Weiter-Klicks ein: nur die letzte Ansage wird tatsaechlich gesprochen. */
    ansageTimer = setTimeout(() => { ansageTimer = null; s.speak(u); }, 80);
  } catch(e){}
}

export function cancelSpeech(){
  try {
    if(ansageTimer){ clearTimeout(ansageTimer); ansageTimer = null; }
    window.speechSynthesis && window.speechSynthesis.cancel();
  } catch(e){}
}

/* Beim Zurueckkommen aufwecken. Ohne das bleibt nach einem Wechsel in eine
   andere App die erste Ansage danach stumm - und das ist beim Timer genau die,
   auf die man gewartet hat. */
if(typeof document !== 'undefined' && 'speechSynthesis' in window){
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'visible' && window.speechSynthesis.paused){
      try { window.speechSynthesis.resume(); } catch(e){}
    }
  });
}

/* ---- Toene ---- */
let audioCtx = null;

export function beep(freq, dur, delay){
  setTimeout(() => {
    try {
      if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if(audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur / 1000);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + dur / 1000 + 0.02);
    } catch(e){}
  }, delay || 0);
}

/* ---- Haptik ----
   Auf Android das ehrlichste Rueckmeldesignal bei nassen Haenden. */
export function vibrate(pattern){
  try { navigator.vibrate && navigator.vibrate(pattern); } catch(e){}
}

/* ---- Anzeigemodus ---- */
export function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         window.navigator.standalone === true;
}

/* ---- Dauerhafter Speicher ----
   Bittet den Browser, localStorage nicht bei Platzmangel zu raeumen. Kein
   Ersatz fuer die Sicherung, aber billig zu haben. */
export async function requestPersistentStorage(){
  try {
    if(navigator.storage && navigator.storage.persist){
      if(await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch(e){}
  return false;
}

/* ---- Datei herunterladen ---- */
export function downloadJson(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
