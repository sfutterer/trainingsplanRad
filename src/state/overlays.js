/* Der Stapel der offenen Overlays - und was die Zurueck-Geste damit macht.

   Auf Android ist Zurueck die Handbewegung, mit der man alles schliesst. In
   dieser App fing sie bisher nur drei Overlays ab, und zwar dort, wo sie
   geoeffnet werden: der Drawer, die Glocke und das Profil merkten sich im
   Rahmen je ein Ref, und der popstate-Handler fragte die drei der Reihe nach.

   Der Uebungsdialog stand nicht in dieser Reihe - er geht tief im
   Trainings-Tab auf, und der Rahmen wusste nichts von ihm. Zurueck sprang
   deshalb mitten aus der Anleitung in einen anderen Bereich und nahm dabei
   die laufende Uebung mit. Genau das ist der Fall, fuer den es diese Datei
   gibt: wer ein Overlay oeffnet, meldet es hier an, egal wo er sitzt.

   Ein Stapel und keine Liste von Flaggen: Overlays koennen uebereinander
   liegen (aus dem Profil heraus eine Rueckfrage), und dann schliesst Zurueck
   das oberste und nicht irgendeines.

   Zur Historie gehoert jeweils ein eigener Eintrag. Er wird beim Oeffnen
   gelegt und beim Schliessen wieder eingezogen - sonst bliebe nach jedem
   Sheet ein toter Schritt zurueck, bei dem Zurueck einmal nichts tut.

   Der Eintrag traegt den bisherigen Zustand weiter und nur die Overlay-Nummer
   dazu; die Adresse bleibt unangetastet. Damit muss diese Datei nicht wissen,
   welcher Bereich gerade offen ist - der steht schon im Zustand, den der
   Rahmen beim Bereichswechsel gelegt hat. */

let zaehler = 0;
const stapel = [];

/* Meldet ein offenes Overlay an und gibt die Abmeldung zurueck - fuer den
   Aufraeumteil eines Effekts gedacht:

     useEffect(() => overlayOffen(() => setOffen(false)), []); */
export function overlayOffen(schliessen){
  const nr = ++zaehler;
  const eintrag = { nr, schliessen, ausHistorie: false };
  stapel.push(eintrag);
  history.pushState({ ...(history.state || {}), overlay: nr }, '');

  return () => {
    const i = stapel.indexOf(eintrag);
    if(i >= 0) stapel.splice(i, 1);
    /* Den eigenen Eintrag nur einziehen, wenn er noch obenauf liegt. Hat die
       Zurueck-Geste ihn schon verbraucht, waere ein zweites back() ein Schritt
       zu viel; hat inzwischen ein Bereichswechsel darueber geschrieben - die
       Glocke fuehrt mit "Zum Plan" genau das aus -, gehoert der Schritt
       zurueck dem Bereichswechsel und nicht mehr dem Overlay. */
    if(!eintrag.ausHistorie && history.state && history.state.overlay === nr) history.back();
  };
}

/* Schliesst das oberste Overlay. Meldet zurueck, ob es eines gab - der Rahmen
   navigiert nur, wenn nicht. */
export function overlayZurueck(){
  const oben = stapel.pop();
  if(!oben) return false;
  /* Damit die Abmeldung weiss, dass ihr Eintrag schon verbraucht ist. */
  oben.ausHistorie = true;
  oben.schliessen();
  return true;
}
