/* Sekunden als Text - fuenf Formen, eine Datei.

   Sie standen bis zum 04.09.2026 an vier Stellen: klok und dauer wortgleich
   im Intervalle- und im Testbereich, minutenText in day.js, fmtMin in
   analysis.js, schrittDauer noch einmal im Testbereich. Zusammengelegt sind es
   nicht fuenf Fassungen derselben Funktion, sondern fuenf verschiedene
   Antworten auf "wie lange":

     mmss           5:00        Der Countdown auf dem Ring. Immer mm:ss, auch
                                bei 90 Minuten - man liest ihn im Vorbeisehen
                                und braucht die Sekunden.
     dauerText      1 h 05 min  Wie lange die Einheit dauert. Ausgeschrieben,
                                weil sie vor dem Losfahren gelesen wird.
     stundenText    1:05 h      Dasselbe in der Auswertung, wo Zahlen
                                untereinander stehen und ausrichtbar sein
                                muessen.
     minutenText    5,5 min     Wo eine halbe Minute zaehlt. Der Erhaltungsreiz
                                ist 5,5 min lang; auf 6 gerundet stuende in der
                                Karte mehr, als der Plan verlangt.
     schrittDauer   40 s        Die Dauer eines Planschritts, so wie der Plan
                    15 min      sie nennt. Drei Faelle und keine Formel:
                    5:30 min    "15:00 min" waere fuer eine glatte Viertelstunde
                                eine Ziffernwueste, und ein Oeffner ueber 40 s
                                laesst sich nicht als 0,67 Minuten hinschreiben.

   Rein: kein DOM, keine Uhr. */

/* mm:ss. Negatives klemmt auf null - eine Uhr, die "-1:00" zeigt, ist keine. */
export function mmss(sek){
  const s = Math.max(0, Math.round(sek));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

export function dauerText(sek){
  const m = Math.round(sek / 60);
  return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min';
}

export function stundenText(sek){
  const m = Math.round(sek / 60);
  return m < 60 ? m + ' min' : Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') + ' h';
}

export function minutenText(sek){
  return String(Math.round(sek / 6) / 10).replace('.', ',') + ' min';
}

/* Dauer eines Planschritts. Die Datei darf "minutes" oder "seconds" nennen -
   ein Oeffner ueber 40 s laesst sich als 0,666 Minuten nicht hinschreiben. */
export function schrittSekunden(s){
  if(!s) return 0;
  return typeof s.seconds === 'number' ? s.seconds : Math.round((s.minutes || 0) * 60);
}

export function schrittDauer(s){
  const sek = schrittSekunden(s);
  if(sek < 60) return sek + ' s';
  if(sek % 60 === 0) return (sek / 60) + ' min';
  return mmss(sek) + ' min';
}

/* Die Dauer einer Schrittfolge in Minuten. Gerechnet und nicht gepflegt -
   sonst laufen die Summe der Schritte und die Zahl daneben auseinander. */
export function schritteMinuten(steps){
  return Math.round((steps || []).reduce((n, s) => n + schrittSekunden(s), 0) / 60);
}
