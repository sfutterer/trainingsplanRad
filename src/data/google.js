/* Anmeldung mit Google, ohne Backend.

   Die App liegt auf GitHub Pages. Es gibt keinen Server, der ein Token
   nachpruefen koennte, und es gibt keine Datenbank, in der etwas laege, das zu
   schuetzen waere - alle Daten stehen im localStorage des Geraets, auf dem sie
   entstanden sind.

   Damit ist klar, was diese Anmeldung leistet und was nicht:

     Sie leistet - eine verlaessliche, stabile Kennung fuer ein Profil, dazu
       Name und Bild. Zwei Menschen an einem Browser bekommen getrennte
       Trainingsprotokolle, und jeder sieht oben rechts, wessen Daten er gerade
       vor sich hat.

     Sie leistet nicht - Schutz. Wer den localStorage dieses Browsers oeffnet,
       liest jedes Profil, ohne sich irgendwo anzumelden. Die Signatur des
       ID-Tokens wird hier nicht geprueft, weil ohne Server nichts da ist, das
       den oeffentlichen Schluessel verlaesslich beschaffen und das Ergebnis
       verteidigen koennte. Eine Pruefung, die der Angreifer selbst ausfuehrt,
       ist keine.

   Das ist kein Mangel dieser Loesung, sondern die Eigenschaft einer App ohne
   Backend. Wer echten Schutz braucht, braucht einen Server - und dann gehoeren
   die Daten auch dorthin und nicht in den localStorage.

   Verwendet wird "Sign in with Google", also google.accounts.id: der Rueckruf
   bekommt ein ID-Token, in dem sub, Name, Mailadresse und Bild bereits
   drinstehen. Der OAuth-Weg ueber ein Access-Token braeuchte einen zweiten
   Abruf gegen die userinfo-Schnittstelle, gaebe dasselbe zurueck und liefe
   ohne Backend auf dieselbe ungepruefte Zusicherung hinaus. */

/* Das Skript wird nachgeladen und nicht in index.html eingebunden.

   Zwei Gruende: es kommt von einem fremden Server, und die App muss offline
   starten koennen - eine PWA, die auf accounts.google.com wartet, bevor sie
   den Trainingsplan zeigt, waere auf dem Rad wertlos. Und wer sich nie
   anmeldet, laedt es nie. */
export const GSI_URL = 'https://accounts.google.com/gsi/client';

export class AnmeldeError extends Error {
  constructor(titel, zeilen){
    super(titel);
    this.titel = titel;
    this.zeilen = zeilen || [];
  }
}

/* Die Client-ID dieses Projekts, offen im Quelltext.

   Das sieht nach einem Fehler aus und ist keiner: eine Client-ID ist dafuer
   gebaut, oeffentlich zu sein. Sie steht bei jeder Seite mit "Sign in with
   Google" im Quelltext, und hier landet sie ohnehin im ausgelieferten Bundle -
   die App liegt auf GitHub Pages, das gebaute JavaScript ist lesbar. Sie aus
   dem Repo herauszuhalten haette also nichts geschuetzt, sondern nur den
   Eindruck erweckt, hier waere etwas zu schuetzen.

   Was sie schuetzt, sind die "Authorized JavaScript origins" in der Google
   Cloud Console: die ID funktioniert ausschliesslich von den dort
   eingetragenen Herkuenften. Wer sie kopiert und auf seine eigene Seite setzt,
   bekommt origin_mismatch.

   Was hier NICHT stehen darf, ist das Client secret, das Google in derselben
   JSON-Datei mitliefert (GOCSPX-...). Diese App braucht es nicht - sie holt
   nur ID-Tokens, und der Code-Austausch, fuer den das Secret da waere, kommt
   nie vor. In einem oeffentlichen Repo waere es der eine Fund, der wirklich
   weh taete. Es gehoert geloescht, nicht eingecheckt. */
const CLIENT_ID = '156267411976-vb9l52s08mr8av7iht283ivmslcr79m6.apps.googleusercontent.com';

/* Ueberschreibbar beim Bauen, fuer Forks: wer die App unter einer anderen
   Adresse betreibt, braucht eine eigene ID - die obige funktioniert bei ihm
   nicht, weil Google die Herkunft prueft. Leer gesetzt zaehlt als "nicht
   gesetzt", sonst schaltete eine unbelegte Variable in der Action die
   Anmeldung ab. */
export function clientIdAusBuild(){
  try {
    const v = import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if(typeof v === 'string' && v.trim()) return v.trim();
  } catch(e){}
  return CLIENT_ID;
}

let laden = null;

export function ladeGoogle(){
  if(laden) return laden;
  laden = new Promise((fertig, fehler) => {
    if(typeof document === 'undefined'){
      return fehler(new AnmeldeError('Anmeldung ist hier nicht möglich.'));
    }
    const schon = window.google && window.google.accounts && window.google.accounts.id;
    if(schon) return fertig(schon);

    const s = document.createElement('script');
    s.src = GSI_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      const id = window.google && window.google.accounts && window.google.accounts.id;
      if(id) fertig(id);
      else fehler(new AnmeldeError('Google hat geantwortet, aber nicht mit dem erwarteten Skript.'));
    };
    /* Beim naechsten Versuch von vorn: der haeufigste Grund ist "gerade kein
       Netz", und der ist beim uebernaechsten Mal vorbei. Bliebe das abgelehnte
       Versprechen stehen, waere die Anmeldung bis zum Neuladen der App
       gesperrt. */
    s.onerror = () => {
      laden = null;
      fehler(new AnmeldeError('Google ist nicht erreichbar.', [
        'Ohne Netz geht die Anmeldung nicht. Die App selbst funktioniert offline weiter.'
      ]));
    };
    document.head.appendChild(s);
  });
  return laden;
}

/* Base64url ohne Polsterung, und der Name kann Umlaute tragen: "Müller" steht
   im Token als UTF-8 und kaeme ueber atob allein als "MÃ¼ller" heraus. */
function nutzlast(jwt){
  const teile = String(jwt || '').split('.');
  if(teile.length !== 3) throw new AnmeldeError('Google hat kein verwertbares Token geschickt.');
  const b64 = teile[1].replace(/-/g, '+').replace(/_/g, '/');
  const rest = b64.length % 4;
  const voll = rest ? b64 + '='.repeat(4 - rest) : b64;
  let text;
  try {
    const roh = atob(voll);
    text = new TextDecoder().decode(Uint8Array.from(roh, c => c.charCodeAt(0)));
  } catch(e){
    throw new AnmeldeError('Google hat kein verwertbares Token geschickt.');
  }
  try { return JSON.parse(text); }
  catch(e){ throw new AnmeldeError('Google hat kein verwertbares Token geschickt.'); }
}

/* Was hier geprueft wird, ist Plausibilitaet und keine Sicherheit - siehe
   Dateikopf. Es faengt die Faelle ab, die im Betrieb wirklich vorkommen: ein
   Token fuer eine andere Client-ID, ein abgelaufenes aus einem alten Tab, und
   eines ohne sub, aus dem sich kein Profil bilden liesse.

   jetzt als Parameter, damit der Test nicht an der Uhr des Rechners haengt -
   dieselbe Regel wie ueberall sonst in diesem Projekt. */
export function leseIdToken(jwt, clientId, jetzt){
  const p = nutzlast(jwt);
  const sub = typeof p.sub === 'string' ? p.sub : '';
  if(!sub) throw new AnmeldeError('Google hat kein Konto mitgeschickt.');

  if(clientId && p.aud && p.aud !== clientId){
    throw new AnmeldeError('Die Anmeldung gehört zu einer anderen Client-ID.', [
      'Vermutlich steht in den Einstellungen eine andere ID als die, mit der die App gebaut wurde.'
    ]);
  }

  const sek = Math.floor((jetzt == null ? Date.now() : jetzt) / 1000);
  if(typeof p.exp === 'number' && p.exp < sek){
    throw new AnmeldeError('Die Anmeldung ist abgelaufen.', ['Bitte noch einmal anmelden.']);
  }

  return {
    sub,
    name:  (typeof p.name === 'string' && p.name) ? p.name
         : (typeof p.email === 'string' ? p.email : 'Angemeldet'),
    email: typeof p.email === 'string' ? p.email : '',
    bild:  typeof p.picture === 'string' ? p.picture : ''
  };
}

/* Den offiziellen Knopf zeichnen lassen, statt einen eigenen zu bauen: Google
   verlangt das in den Markenrichtlinien, und der Knopf bringt die Kontoauswahl
   gleich mit.

   Er sitzt in einem Sheet, ist also immer erst nach einer bewussten Geste zu
   sehen. One Tap, das beim Oeffnen der Seite ungefragt aufpoppt, hat in einer
   App, die man mitten im Training aufschlaegt, nichts zu suchen.

   Gibt eine Aufraeumfunktion zurueck. */
export async function zeichneKnopf(el, clientId, onCredential, onFehler){
  const id = await ladeGoogle();
  id.initialize({
    client_id: clientId,
    callback: antwort => {
      try { onCredential(antwort && antwort.credential); }
      catch(e){ onFehler(e); }
    },
    /* Kein stilles Anmelden beim Oeffnen der Seite: welches Profil gilt, steht
       auf diesem Geraet und wird nicht von Google entschieden. */
    auto_select: false,
    cancel_on_tap_outside: true,
    ux_mode: 'popup'
  });
  id.renderButton(el, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'pill',
    locale: 'de',
    width: 260
  });
  return () => { try { id.cancel(); } catch(e){} };
}

/* Nach dem Abmelden beim naechsten Besuch nicht stillschweigend dasselbe Konto
   waehlen. Darf ausfallen - das Skript ist ueberhaupt nur geladen, wenn sich
   in dieser Sitzung jemand angemeldet hat. */
export function vergissAutoAuswahl(){
  try {
    const id = window.google && window.google.accounts && window.google.accounts.id;
    if(id) id.disableAutoSelect();
  } catch(e){}
}
