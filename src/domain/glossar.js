/* Begriffe, die die Zahlen dieser App tragen - erklärt an der Stelle, an der
   sie stehen.

   Die Zonenseite trug diese Erklärungen bis zum 31.10.2026 als Fließtext:
   neun Absätze unter den Karten, die bei jedem Besuch dastanden und nach dem
   zweiten Lesen nur noch Platz kosteten. Was man wissen muss, braucht man
   einmal; was man täglich sieht, sind die Zahlen.

   Deshalb hier und nicht dort: ein Begriff ist antippbar, die Erklärung kommt
   als Sheet. Wer sie nicht braucht, sieht sie nicht.

   Warum im Code und nicht in plan.json: das sind keine Planzahlen und keine
   Plantexte, sondern Erklärungen der App zu Größen, die es auch ohne diesen
   Trainingsplan gibt. plan.json trägt, was sich mit dem Plan ändert - FTP
   bleibt FTP, auch wenn der Plan ein anderer wird. Die beiden Plantexte, die
   zu Zonen etwas sagen (zoneNoteCoggan, zoneNoteTransition), bleiben deshalb
   in der Datei und stehen weiterhin an der Zonenkarte. */

export const GLOSSAR = {
  ftp: {
    titel: 'FTP',
    text: 'Functional Threshold Power – die Leistung, die sich etwa eine Stunde lang '
      + 'halten lässt, in Watt. Sie kommt aus dem Schwellentest: Ø-Watt der 20 Minuten '
      + 'mal 0,95. Alle Wattzonen und alle Zielwatt des Plans sind Prozentsätze davon, '
      + 'deshalb verschiebt ein neuer Test die ganze Rechnung auf einmal.'
  },
  lthr: {
    titel: 'LTHR',
    text: 'Lactate Threshold Heart Rate – der Puls an der Schwelle, erhoben als Ø-Puls '
      + 'der 20 Testminuten. Aus ihr entstehen die Pulszonen. Sie ist die Kontrollgröße: '
      + 'der Puls hängt an Hitze, Schlaf und Kaffee und sagt erst am Ende eines Blocks '
      + 'etwas, die Leistung sagt es sofort.'
  },
  hrmax: {
    titel: 'HFmax',
    text: 'Der höchste Puls, der erreicht wurde. Kein Schwellentest misst ihn – er '
      + 'entsteht nur aus einer bewussten Ausbelastung und wird deshalb eingetragen und '
      + 'nicht gemessen. In dieser App steuert er nichts: alle Kontrollgrößen hängen an '
      + 'der LTHR, weil eine geschätzte HFmax jede daran hängende Schwelle verzieht.'
  },
  coggan: {
    titel: 'Coggan-Zonen',
    text: 'Das Zonenmodell, nach dem Plan und intervals.icu rechnen: feste Prozentsätze '
      + 'der FTP für die Leistung und der LTHR für den Puls. Z2 ist die Grundlagenzone '
      + '(56–75 % FTP), Z4 die Schwelle, Z5 der VO2max-Bereich. Die Prozentsätze stehen '
      + 'in plan.json, nicht im Code.'
  },
  uebergang: {
    titel: 'Übergangsbänder',
    text: 'Die Pulsbänder, mit denen die App vor dem ersten Schwellentest rechnet – eine '
      + 'Arbeitsannahme aus dem Trainingsplan, kein Messwert. Sie gelten bis zu der '
      + 'Woche, ab der der Plan Coggan vorsieht, und werden dann von den Bändern aus der '
      + 'LTHR abgelöst. Ein Test misst die Bänder des Folgeblocks, nicht die der '
      + 'laufenden Woche.'
  },
  sprechtest: {
    titel: 'Sprechtest',
    text: 'Die oberste Instanz für Z2: ganze Sätze müssen beim Fahren möglich sein. Wird '
      + 'das Sprechen kurzatmig, ist die aerobe Schwelle überschritten – unabhängig '
      + 'davon, was Zahl und Band sagen. Der Puls, bei dem das passiert, wird unter '
      + '„Sprechtest-Erhebung" notiert und gegen die Z2-Obergrenze gehalten.'
  },
  decoupling: {
    titel: 'Decoupling',
    text: 'Wie weit Leistung und Puls im Lauf einer langen Fahrt auseinanderlaufen '
      + '(Pw:HR). Bis 5 % trägt die Grundlagenausdauer diese Dauer; darüber war die '
      + 'Fahrt zu hart, auch wenn die Leistung im Band lag. Die Zahl kommt aus '
      + 'intervals.icu und steht in der Analyse an der Samstagsausfahrt.'
  },
  rpe: {
    titel: 'RPE',
    text: 'Das empfundene Anstrengungsniveau von 1 bis 10. Im Schwellentest wird es für '
      + 'die letzten fünf Minuten erhoben und ist das einzige Feld, das etwas über die '
      + 'Güte des Messwerts sagt: unter 9 heißt nicht ausbelastet, und dann ist die FTP '
      + 'eher zu niedrig – gemessen wurde die Bereitschaft, an die Schwelle zu gehen.'
  },
  wkg: {
    titel: 'W/kg',
    text: 'Leistung je Kilogramm Körpergewicht – die Zahl, die am Berg zählt. Sie wird '
      + 'hier bewusst nicht als Verlaufskurve gezeigt: während einer Abnehmphase bewegen '
      + 'sich Zähler und Nenner gleichzeitig, und ein steigender Quotient sagt dann '
      + 'nichts darüber, ob der Motor größer geworden ist. FTP und Gewicht stehen '
      + 'deshalb getrennt.'
  },
  messwert: {
    titel: 'Messwert',
    text: 'Jeder Eintrag in dieser Liste ist ein Wert mit einem Datum. Ein Schwellentest '
      + 'ist gemessen und trägt sein Protokoll mit; ein eingetragener Wert kommt von '
      + 'woanders – eFTP, Garmin, eine Korrektur. Gerechnet wird je Größe mit dem '
      + 'jüngsten Eintrag, der sie nennt. Nichts wird überschrieben: ein gelöschter '
      + 'Eintrag gibt den Wert frei, der davor galt.'
  }
};

export function begriff(id){
  return GLOSSAR[id] || null;
}
