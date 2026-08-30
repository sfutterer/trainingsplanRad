/* Beweglichkeit und Koordination: welche Uebung laeuft gegen die Uhr?

   Die Dosierung dieser beiden Bloecke steht in plan.json als Text
   ("3 × 20–30 s je Seite"), weil sie an keiner Woche und an keiner Phase
   haengt - anders als beim Zirkel gibt es nichts zu rechnen. Fuer den Timer
   muss aus diesem Text eine Zahl werden.

   Verworfen: ein zweites Feld je Uebung (etwa "seconds": 30) neben der
   Dosierung. Das waere dieselbe Angabe ein zweites Mal an anderer Stelle - wer
   nur eine davon aendert, bekommt einen Timer, der etwas anderes zaehlt, als
   danebensteht.

   Deshalb liest zeitDosis() den Dosierungstext, und zwar streng: was nicht auf
   das Muster passt, gilt als nicht zeitgesteuert und bekommt keinen Timer -
   genau der Zustand, den beide Segmente vorher hatten. "10 Wdh. je Seite" und
   "20 Schritte" fallen so von selbst heraus. Ohne /i, damit das grosse S von
   "Schritte" nicht als Sekundenzeichen durchgeht.

   Rein: kein DOM, keine Uhr. */

/* [Saetze ×] Sekunden [– Sekunden] s   z. B. "60 s", "2 × 30 s", "3 × 20–30 s" */
const MUSTER = /^\s*(?:(\d+)\s*[×x]\s*)?(\d+)(?:\s*[–—-]\s*(\d+))?\s*s(?![\wäöüß])/;

export function zeitDosis(dosage){
  if(typeof dosage !== 'string') return null;
  const m = MUSTER.exec(dosage);
  if(!m) return null;
  const saetze = m[1] ? parseInt(m[1], 10) : 1;
  /* Bei einer Spanne zaehlt der Timer das obere Ende: daran haengt die
     Freischaltregel ("Einbeinstand ... ueber 30 s sauber je Seite"). Frueher
     abbrechen darf man jederzeit, laenger halten kann eine abgelaufene Uhr
     nicht. */
  const sekunden = parseInt(m[3] || m[2], 10);
  const jeSeite = /je\s+Seite/i.test(dosage);
  if(!(saetze > 0) || !(sekunden > 0)) return null;
  return { saetze, sekunden, jeSeite, halten: saetze * (jeSeite ? 2 : 1) };
}

export function istZeitgesteuert(ex){
  return !!(ex && zeitDosis(ex.dosage));
}

/* Wie lange die Uhr an dieser Uebung insgesamt laeuft - ohne die Pausen
   dazwischen, die der Plan nicht vorgibt. */
export function zeitSekunden(ex){
  const d = zeitDosis(ex && ex.dosage);
  return d ? d.halten * d.sekunden : 0;
}
