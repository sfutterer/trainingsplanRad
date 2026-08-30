/* Der Umschalter mit zwei bis vier Zielen nebeneinander.

   Stand fuenfmal von Hand da: die vier Trainingsbausteine, Woche gegen Monat,
   Einheiten gegen Verlauf, die drei Themes und die drei Kartenstile. Fuenfmal
   dieselbe Schleife ueber {id, label} - und dreimal eine andere Antwort auf
   die Frage, was das fuer den Screenreader ist: einmal role="tablist", einmal
   role="group", dreimal gar nichts. Die drei ohne Rolle waren damit eine Reihe
   unverbundener Knoepfe, bei der nichts sagt, dass genau einer gilt.

   Deshalb liegt die Rolle jetzt hier, und es gibt genau zwei:

     rolle="tab"    schaltet die Ansicht darunter um - Bausteine, Woche/Monat,
                    Einheiten/Verlauf. Der Inhalt wechselt, die Seite bleibt.
     rolle="radio"  waehlt einen Wert aus - Erscheinungsbild, Kartenstil. Es
                    wird nichts umgeblaettert, es wird etwas eingestellt.

   Die Unterscheidung ist keine Formsache: "Tab" kuendigt einen Bereichswechsel
   an, "Optionsfeld" eine Einstellung. Wer nur zuhoert, braucht den Unterschied.

   Ein Ziel darf gesperrt sein - der Kartenstil steht ohne Thunderforest-
   Schluessel nicht zur Wahl. */

export function Segmented({ ziele, aktiv, onWaehlen, rolle = 'tab', label, klasse }){
  const istTab = rolle !== 'radio';
  return (
    <div class={'segmented' + (klasse ? ' ' + klasse : '')}
      role={istTab ? 'tablist' : 'radiogroup'} aria-label={label}>
      {ziele.map(z => {
        const an = aktiv === z.id;
        return (
          <button key={z.id} type="button"
            class={'segbtn' + (an ? ' an' : '')}
            role={istTab ? 'tab' : 'radio'}
            aria-selected={istTab ? (an ? 'true' : 'false') : undefined}
            aria-checked={istTab ? undefined : (an ? 'true' : 'false')}
            disabled={z.disabled}
            onClick={() => onWaehlen(z.id)}>{z.label}</button>
        );
      })}
    </div>
  );
}
