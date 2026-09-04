/* Die letzten Testeintraege als Liste.

   Stand bis zum 04.09.2026 zweimal: im Testbereich und im Zonen-Tab. Die
   beiden Zeilen waren nicht gleich - der Zonen-Tab zeigte das Gewicht, der
   Testbereich stattdessen den RPE, und die Warnung vor gemischten Protokollen
   gab es nur im Testbereich. Zwei Ansichten desselben Protokolls, von denen
   eine die Regel des Trainingsplans nicht kannte.

   Jetzt eine Zeile mit allem, was in dem Eintrag steht. Weggelassen wird nur,
   was fehlt - eine Zeile mit "–" fuer jedes nicht erhobene Feld waere
   laenger als eine mit den Zahlen darin.

   Die Bedingungen stehen mit in der Zeile. Sie wurden seit jeher erhoben -
   der Trainingsplan verlangt sie ausdruecklich und fuehrt eine eigene Spalte
   dafuer - und in der ganzen App nirgends gelesen. Bei drei Tests im Plan
   haengt der Vergleich zweier Werte an genau dieser Zeile: 6 Grad und
   Gegenwind gegen 22 Grad und Windstille sind keine zwei Formzustaende. */

import { gemischteProtokolle } from '../../domain/test.js';

const ANZAHL = 4;

function zeile(e){
  return [
    'FTP ' + (e.ftp || '–') + ' W',
    'LTHR ' + (e.lthr || '–') + ' bpm',
    e.w20 ? '20 min ' + e.w20 + ' W' : null,
    e.kadenz ? e.kadenz + ' U/min' : null,
    e.rpe ? 'RPE ' + e.rpe : null,
    e.weight ? e.weight + ' kg' : null,
    e.conditions || null
  ].filter(Boolean).join(' · ');
}

export function Testhistorie({ eintraege, mitKopf }){
  const liste = (eintraege || []).slice().sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, ANZAHL);
  if(!liste.length) return null;

  return (
    <>
      {mitKopf
        ? <div class="row"><span>Testhistorie</span><b>{eintraege.length} Einträge</b></div>
        : <div class="listhead">Testhistorie</div>}
      {liste.map((e, i) => (
        <div class="listrow datum" key={e.day || i}>
          <span>{e.day}{e.week ? ' · W' + e.week : ''}</span>
          <span>{zeile(e)}</span>
        </div>
      ))}
      {/* Die Regel des Trainingsplans, hier nachgeprueft statt nur zitiert. */}
      {gemischteProtokolle(eintraege) && <p class="hint warn">
        Die Einträge stammen aus verschiedenen Testabläufen. Der Trainingsplan verlangt
        über alle Termine denselben Ablauf – die Werte sind untereinander nicht
        vergleichbar.
      </p>}
    </>
  );
}
