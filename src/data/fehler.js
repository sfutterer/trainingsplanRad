/* Ein Fehler, den die Oberflaeche vorzeigen kann.

   Drei Stellen werfen ihn: der Plan (planSource.js), die Anmeldung
   (google.js) und die Sicherung (exportImport.js). Alle drei trugen bis
   hierher dieselbe Klasse Zeichen fuer Zeichen selbst - denselben
   Konstruktor, dieselben zwei Felder, dreimal hingeschrieben.

   `titel` ist der eine Satz, der oben steht; `zeilen` sind die Beanstandungen
   darunter, je eine Aufzaehlungszeile. Der Unterschied zu einem nackten Error
   ist genau diese Zweiteilung: eine Planpruefung findet zwoelf Dinge auf
   einmal, und sie in einen Satz zu quetschen heisst, elf davon zu verlieren.

   Die drei Namen bleiben trotzdem eigene Klassen. `PlanError` und
   `AnmeldeError` werden mit instanceof unterschieden - der Fehlerbildschirm
   fragt, ob der Plan schuld war, das Profil-Sheet, ob die Anmeldung -, und im
   Stapelauszug steht dann der Name, an dem man die Herkunft sieht. */
export class Meldefehler extends Error {
  constructor(titel, zeilen){
    super(titel);
    this.titel = titel;
    this.zeilen = zeilen || [];
  }
}
