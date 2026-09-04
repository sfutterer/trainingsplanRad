/* Gewicht nach intervals.icu schreiben - der einzige Schreibvorgang der App,
   und deshalb der einzige mit Rueckfrage.

   Er stand bis zum 04.09.2026 zweimal da, im Testbereich und im Zonen-Tab,
   mit wortgleichem Fragetext und leicht verschiedener Fehlerbehandlung. Der
   Satz "das ist der einzige Wert, den diese App jemals dorthin schreibt" ist
   ein Versprechen an den Nutzer; ein Versprechen, das an zwei Stellen steht,
   ist eines, das an einer davon irgendwann anders lautet.

   Gibt zurueck, was passiert ist, statt selbst zu melden: die beiden
   Aufrufer zeigen Meldungen an verschiedenen Stellen und in verschiedener
   Form, und eine Meldung von hier aus haette an einer der beiden im Weg
   gestanden.

     { art: 'abgelehnt' }            der Nutzer hat verneint
     { art: 'ok' }                   geschrieben
     { art: 'fehler', text }         nicht geschrieben, mit Grund

   Kein Aufruf ohne Zugang und ohne Gewicht: dann gibt es nichts zu fragen. */

import { apiKey } from './store.js';
import { putWellness } from '../data/icu.js';
import { bestaetige } from './dialog.js';
import { dayFromIso } from '../domain/week.js';

export async function gewichtSchreiben(tagIso, kg){
  if(!(kg > 0) || !apiKey.value) return { art: 'abgelehnt' };

  const ja = await bestaetige({
    titel: 'Gewicht nach intervals.icu schreiben?',
    text: kg + ' kg für den ' + dayFromIso(tagIso).toLocaleDateString('de-DE') + '. '
        + 'Das ist der einzige Wert, den diese App jemals dorthin schreibt – '
        + 'alles andere wird nur gelesen.',
    jaLabel: 'Schreiben'
  });
  if(!ja) return { art: 'abgelehnt' };

  try {
    await putWellness(apiKey.value, tagIso, { weight: kg });
    return { art: 'ok' };
  } catch(e){
    return { art: 'fehler', text: e.message };
  }
}
