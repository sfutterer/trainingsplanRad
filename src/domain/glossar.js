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
      + 'halten lässt, in Watt. Aus dem Schwellentest: Ø-Watt der 20 Minuten × 0,95. '
      + 'Alle Wattzonen und Zielwatt des Plans sind Prozentsätze davon.'
  },
  lthr: {
    titel: 'LTHR',
    text: 'Lactate Threshold Heart Rate – der Puls an der Schwelle, erhoben als Ø-Puls '
      + 'der 20 Testminuten. Aus ihr entstehen die Pulszonen. Mit FTP ist sie '
      + 'Kontrollgröße, gesteuert wird über die Leistung.'
  },
  hrmax: {
    titel: 'HFmax',
    text: 'Der höchste erreichte Puls. Der Schwellentest misst ihn nicht, er wird '
      + 'eingetragen. In dieser App steuert er nichts; die Pulszonen hängen an der LTHR.'
  },
  coggan: {
    titel: 'Coggan-Zonen',
    text: 'Das Zonenmodell von Plan und intervals.icu: feste Prozentsätze der FTP für '
      + 'die Leistung und der LTHR für den Puls. Z2 ist die Grundlagenzone (56–75 % FTP), '
      + 'Z4 die Schwelle, Z5 der VO2max-Bereich.'
  },
  uebergang: {
    titel: 'Übergangsbänder',
    text: 'Die Pulsbänder aus dem Trainingsplan, mit denen die App vor dem ersten '
      + 'Schwellentest rechnet. Sie gelten bis zu der Woche, ab der der Plan Coggan '
      + 'vorsieht, danach die Bänder aus der LTHR.'
  },
  sprechtest: {
    titel: 'Sprechtest',
    text: 'Kriterium für Z2: ganze Sätze sind beim Fahren möglich. Der Puls, bei dem das '
      + 'Sprechen kurzatmig wird, wird unter „Sprechtest-Erhebung" notiert und mit der '
      + 'Z2-Obergrenze verglichen.'
  },
  decoupling: {
    titel: 'Decoupling',
    text: 'Wie weit Leistung und Puls im Lauf einer langen Fahrt auseinanderlaufen '
      + '(Pw:HR), in Prozent. Die Grenze liegt bei 5 %.'
  },
  rpe: {
    titel: 'RPE',
    text: 'Das empfundene Anstrengungsniveau von 1 bis 10, im Schwellentest für die '
      + 'letzten fünf Minuten erhoben. Unter 9 gilt der Test als nicht ausbelastet.'
  },
  wkg: {
    titel: 'W/kg',
    text: 'Leistung je Kilogramm Körpergewicht. Im Verlauf stehen FTP und Gewicht '
      + 'getrennt, weil sich bei einer Gewichtsänderung beide Teile des Quotienten bewegen.'
  },
  messwert: {
    titel: 'Messwert',
    text: 'Ein Wert mit Datum: gemessen im Schwellentest oder direkt eingetragen (eFTP, '
      + 'Garmin, Korrektur). Je Größe gilt der jüngste Eintrag. Wird er gelöscht, gilt '
      + 'wieder der davor.'
  }
};

export function begriff(id){
  return GLOSSAR[id] || null;
}
