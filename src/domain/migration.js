/* Alte plan.json-Fassungen auf die aktuelle heben.

   Es gibt zwei Stellen, an denen ein Plan hereinkommt: die Datei aus dem Repo
   und ein eigener Plan aus dem Speicher des Geraets. Der zweite ist der
   Grund, dass es diese Datei gibt - er kann beliebig alt sein, er liegt in
   jeder Sicherung, die je heruntergeladen wurde, und er ist die einzige
   Fassung, die der Nutzer nicht mit einem Update mitbekommt.

   Ohne Migration hiesse ein Schemawechsel: der eigene Plan wird abgelehnt,
   die App zeigt einen Fehlerbildschirm, und der Weg zurueck ist "auf Default
   zuruecksetzen" - also den eigenen Plan wegwerfen. Das ist kein Weg zurueck,
   das ist Datenverlust mit Ansage.

   Der Grundsatz bleibt trotzdem "lieber gar keine Vorgabe als eine falsche":
   migriert wird nur, was sich verlustfrei umschreiben laesst. Was diese Datei
   nicht kennt, geht unveraendert weiter in die Pruefung und wird dort mit
   Feldnamen beanstandet.

   Rein: kein DOM, kein fetch, keine Uhr. */

/* Fassung 2 -> 3.

   Fassung 2 nannte die Wochentage im Feldnamen: tuesdayMinutes,
   wednesdayExtra, saturdayBlocks, sundayOptionalMinutes - und daneben stand
   der Donnerstag als vollwertiges Objekt. Ein Tag war damit entweder eine
   Zahl mit einem Wochentag davor oder ein Objekt, je nachdem, welchen man
   erwischte, und der Beinblock hiess am Sonntag legRounds und am Dienstag
   tuesdayLegRounds - zweimal dasselbe unter zwei Namen.

   Fassung 3 gibt jedem Tag ein Objekt unter seinem Kuerzel. Was zum Tag
   gehoert, steht am Tag: die Dauer, der Beinblock am Abend, der Reiz an der
   Fahrt, die Bloecke in der langen Ausfahrt. Montag und Freitag fehlen, weil
   an ihnen nichts von der Woche abhaengt - der Montag ist frei, der Freitag
   steht in fridayOptional.

   Der Zirkel zieht in einen eigenen Abschnitt: seine drei Zahlen gehoeren
   zusammen und zu keinem einzelnen Tag - er laeuft am Mittwoch und am
   Sonntag mit derselben Taktung. */
function woche2zu3(w){
  const neu = { week: w.week, phase: w.phase };

  neu.zirkel = {
    workSeconds: w.coreWorkSeconds,
    restSeconds: w.coreRestSeconds,
    rounds: w.coreRounds
  };

  neu.tage = {
    di: { minutes: w.tuesdayMinutes, legRounds: w.tuesdayLegRounds || 0 },
    mi: { minutes: w.wednesdayMinutes, extra: w.wednesdayExtra ?? null },
    do: w.thursday,
    sa: { minutes: w.saturdayMinutes, bloecke: w.saturdayBlocks ?? null },
    so: { optionalMinutes: w.sundayOptionalMinutes, legRounds: w.legRounds }
  };

  return neu;
}

/* Der Winterblock nennt die Tage, die er aendert; ein genannter Tag ersetzt
   den der letzten Planwoche vollstaendig.

   Die Samstagsdauer wandert deshalb als Zahl mit hinein. In Fassung 2 kam sie
   aus der letzten Planwoche, waehrend die Bloecke danebenstanden - eine Haelfte
   des Tages hier, die andere dort. Als ganze Zahl ist sie sichtbar und
   aenderbar, und die Regel "ein genannter Tag ersetzt ganz" braucht keine
   Ausnahme. Dass sie damit nicht mehr automatisch der letzten Woche folgt, ist
   kein Verlust: der Block sagt selbst, dass nach ihm ein neuer Plan
   geschrieben wird. */
function winter2zu3(b, letzte){
  return {
    phase: b.phase,
    name: b.name,
    note: b.note,
    tage: {
      do: b.thursday,
      sa: { minutes: letzte.saturdayMinutes, bloecke: b.saturdayBlocks ?? null }
    }
  };
}

/* Der Dokumentationsblock beschreibt die Datei und muss deshalb mitwandern.
   Was Fassung 2 beschrieb, gilt in Fassung 3 nicht mehr - ein Verweis auf
   tuesdayMinutes in einem migrierten Plan waere schlimmer als kein Verweis.
   Die Eintraege, die sich auf die alte Form beziehen, werden ersetzt; alles
   Uebrige bleibt Wort fuer Wort stehen. */
const DOKU_3 = {
  weeks: 'Ein Objekt je Trainingswoche. week zaehlt lueckenlos ab 1, phase '
    + 'verweist auf phaseNames, zirkel traegt die Taktung des Rumpfzirkels '
    + '(workSeconds, restSeconds, rounds), und tage traegt je Wochentag, was '
    + 'an ihm von der Woche abhaengt.',
  tage: 'Die Wochentage unter ihrem Kuerzel: di, mi, do, sa, so. Montag und '
    + 'Freitag fehlen, weil an ihnen nichts von der Woche abhaengt - der '
    + 'Montag ist frei, der Freitag steht in fridayOptional. '
    + 'di.minutes und di.legRounds: Arbeitsweg und die zweite Beineinheit am '
    + 'Abend. mi.minutes und mi.extra: die kurze Fahrt und ein daran '
    + 'haengender Reiz. do: der Qualitaetstag als vollstaendiges Objekt, '
    + 'siehe variante. sa.minutes und sa.bloecke: die lange Ausfahrt und die '
    + 'Z3-Bloecke darin. so.optionalMinutes und so.legRounds: die optionale '
    + 'Fahrt davor und die Runden des Beinblocks. Ein Kuerzel, das hier nicht '
    + 'steht, wird beanstandet - sonst schriebe jemand "mo" hin und wunderte '
    + 'sich, dass der Montag sich nicht ruehrt.',
  nachDemPlanende: 'Nach der letzten Woche gilt winterBlock. Er nennt die '
    + 'Tage, die er aendert - do und sa -, und ein genannter Tag ersetzt den '
    + 'der letzten Planwoche vollstaendig; die uebrigen erbt er von ihr. '
    + 'Ab Fassung 3 traegt der Block keinen Winterplan mehr, sondern die '
    + 'Merkposten fuer den Nachfolgeplan.',
  variante: 'Ein tage.do darf eine benannte Variante tragen: eine zweite '
    + 'zulaessige Form desselben Tages, ueber die am Tag selbst entschieden '
    + 'wird. Im ausgelieferten Plan ist das die VO2max-Referenz in Woche 5. '
    + 'Der Regelfall bleibt daneben unveraendert stehen - gewaehlt wird in '
    + 'der App, und die Wahl wird gespeichert. Die Wochensumme rechnet mit '
    + 'der Variante, weil der Trainingsplan sie so nennt; die zwei Minuten '
    + 'Unterschied liegen unter der Aufloesung des Umfangsdeckels.',
  wiederholungenInWeeks: 'Das tage.do-Objekt steht in mehreren Wochen '
    + 'woertlich gleich da. Das ist Absicht und kein Copy-Paste-Rest: jede '
    + 'Woche bleibt fuer sich lesbar, und nichts kann sich gegeneinander '
    + 'verschieben.'
};

export function migriere2zu3(p){
  const doku = { ...(p.documentation || {}) };
  delete doku.fassung3;
  delete doku.fassung4;
  Object.assign(doku, DOKU_3);
  doku.migration = 'Ein Plan der Fassung 2 wird beim Laden auf Fassung 3 '
    + 'gehoben: die Wochentage im Feldnamen (tuesdayMinutes, saturdayBlocks …) '
    + 'werden zu einem Objekt je Tag unter weeks[].tage.';

  const neu = {
    ...p,
    schemaVersion: 3,
    documentation: doku,
    weeks: p.weeks.map(woche2zu3),
    winterBlock: winter2zu3(p.winterBlock, p.weeks[p.weeks.length - 1])
  };
  return neu;
}

/* Die Kette. Heute ein Glied, spaeter mehrere - deshalb eine Tabelle und
   keine Fallunterscheidung: eine Fassung 1 waere sonst zweimal zu pruefen. */
const SCHRITTE = { 2: migriere2zu3 };

export function migriere(p){
  if(!p || typeof p !== 'object' || Array.isArray(p)) return p;
  let out = p;
  /* Eine Fassung ohne Schritt bleibt stehen - auch eine zu neue. Die Pruefung
     sagt danach mit einer Zahl, was los ist; ein Migrationsversuch ins
     Ungewisse haette Zahlen erfunden. */
  for(let i = 0; i < 10; i++){
    const schritt = SCHRITTE[out.schemaVersion];
    if(!schritt) return out;
    out = schritt(out);
  }
  return out;
}
