/* Was hinter dem Profilbild oben rechts steckt.

   Angemeldet: wer man ist, welche anderen Profile auf dem Geraet liegen, und
   der Weg zurueck ins lokale Profil. Nicht angemeldet: eine Erklaerung, was
   die Anmeldung hier ueberhaupt tut, und der Google-Knopf.

   Die Erklaerung steht bewusst im Sheet und nicht hinter einem Fragezeichen:
   "Anmelden" heisst in fast jeder App "meine Daten liegen jetzt in der Cloud".
   Hier heisst es das Gegenteil - die Daten bleiben, wo sie sind, und die
   Anmeldung entscheidet nur, welcher Stapel davon offen ist. Wer das nicht
   liest, meldet sich an und wartet auf eine Synchronisierung, die nie kommt.

   Der einzige Vorgang mit einer Ueberraschung ist die erste Anmeldung: sie
   zieht den bisherigen Bestand in das neue Profil. Deshalb laedt sie nicht
   still neu, sondern sagt vorher, was sie mitgenommen hat. */

import { useState, useEffect, useRef } from 'preact/hooks';
import { Sheet } from './Sheet.jsx';
import { Avatar } from './Avatar.jsx';
import { profil, profile, meldeAn, meldeAb, wechsleZu, neuStarten,
         AnmeldeError } from '../../state/auth.js';
import { zeichneKnopf, clientId } from '../../data/google.js';
import { benenne } from '../../data/exportImport.js';
import { vibrate } from '../../platform/index.js';

/* Der Knopf von Google, in einem Kasten, den Google zeichnet.

   Er wird jedes Mal neu gezeichnet, wenn das Sheet aufgeht: die Bibliothek
   haengt sich an ein konkretes Element, und ein Element aus einem geschlossenen
   Sheet ist beim naechsten Oeffnen nicht mehr im Dokument. */
function GoogleKnopf({ id, onCredential, onFehler }){
  const kasten = useRef(null);
  const [laeuft, setLaeuft] = useState(true);

  useEffect(() => {
    let weg = false;
    let aufraeumen = null;
    zeichneKnopf(kasten.current, id, onCredential, onFehler)
      .then(f => { aufraeumen = f; if(!weg) setLaeuft(false); })
      .catch(e => { if(!weg){ setLaeuft(false); onFehler(e); } });
    return () => { weg = true; if(aufraeumen) aufraeumen(); };
    /* Nur an der Client-ID: die Rueckrufe werden bei jedem Rendern neu
       gebildet, und ein neu gezeichneter Knopf mitten im Anmelden bricht den
       laufenden Vorgang ab. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div class="gknopf">
      <div ref={kasten}></div>
      {laeuft && <div class="gknopf-warten">Lädt Google …</div>}
    </div>
  );
}

export function ProfilSheet({ onClose }){
  const [fehler, setFehler] = useState(null);
  const [uebernommen, setUebernommen] = useState(null);
  const [anmeldenOffen, setAnmeldenOffen] = useState(false);

  const ich = profil.value;
  const id = clientId();
  const andere = profile.value.filter(p => !ich || p.id !== ich.id);

  function zeigeFehler(e){
    setFehler(e instanceof AnmeldeError
      ? { titel: e.titel, zeilen: e.zeilen }
      : { titel: 'Die Anmeldung hat nicht geklappt.', zeilen: [String(e && e.message || e)] });
  }

  async function annehmen(credential){
    setFehler(null);
    try {
      const r = await meldeAn(credential);
      /* Nichts uebernommen heisst: nichts zu erklaeren. Dann sofort neu laden,
         statt eine Erfolgsmeldung zu zeigen, die niemand braucht. */
      if(!r.uebernommen.length) return neuStarten();
      setUebernommen(r.uebernommen);
    } catch(e){ zeigeFehler(e); }
  }

  async function abmelden(){
    await meldeAb();
    neuStarten();
  }

  async function wechseln(zielId){
    await wechsleZu(zielId);
    neuStarten();
  }

  /* Nach der Uebernahme des Altbestands: kein automatisches Neuladen. Das ist
     die einzige Stelle, an der Daten den Besitzer wechseln, und sie soll
     gelesen werden, bevor sie weg ist. */
  if(uebernommen){
    return (
      <Sheet onClose={neuStarten} label="Anmeldung abgeschlossen">
        <h3>Deine bisherigen Daten sind jetzt in diesem Profil</h3>
        <p class="profil-text">
          Alles, was vor der Anmeldung auf diesem Gerät lag, gehört ab sofort zu diesem
          Profil und ist nur noch nach der Anmeldung zu sehen:
        </p>
        <ul class="profil-liste">
          {uebernommen.map(k => <li key={k}>{benenne(k)}</li>)}
        </ul>
        <p class="profil-text">
          Das passiert genau einmal. Meldet sich später ein zweites Konto an, fängt es
          mit einem leeren Bestand an.
        </p>
        <button class="btn block" onClick={neuStarten}>Weiter</button>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose} label="Profil">
      <div class="profil-kopf">
        <Avatar profil={ich} gross />
        <div class="profil-namen">
          <div class="profil-name">{ich ? ich.name : 'Ohne Anmeldung'}</div>
          <div class="profil-mail">{ich ? ich.email : 'Daten dieses Browsers'}</div>
        </div>
      </div>

      {fehler && (
        <div class="meldung fehler">
          <b>{fehler.titel}</b>
          {fehler.zeilen.length > 0 && <ul>{fehler.zeilen.map((z, i) => <li key={i}>{z}</li>)}</ul>}
        </div>
      )}

      {!ich && (
        <p class="profil-text">
          Die Anmeldung trennt die Daten mehrerer Personen an einem Browser – jedes Konto
          bekommt einen eigenen Bestand an Protokollen, Werten und Einstellungen.
          <b> Hochgeladen wird nichts.</b> Alles bleibt auf diesem Gerät, und ohne Anmeldung
          läuft die App unverändert weiter.
        </p>
      )}

      {/* Kein Zweig fuer "keine Client-ID hinterlegt": die ID steht im
          Quelltext und ist immer da. Der Zweig gab es, solange sie erst
          eingetragen werden musste - er verwies auf eine Zeile in den
          Einstellungen, die es nicht mehr gibt, und war ohnehin nicht mehr
          erreichbar. */}
      {(!ich || anmeldenOffen) &&
        <GoogleKnopf id={id} onCredential={annehmen} onFehler={zeigeFehler} />}

      {ich && !anmeldenOffen && (
        <button class="btn secondary block" onClick={() => { vibrate(8); setAnmeldenOffen(true); }}>
          Weiteres Konto anmelden
        </button>
      )}

      {(andere.length > 0 || ich) && (
        <>
          <div class="profil-trenner">Auf diesem Gerät</div>
          <div class="profil-wahl">
            {andere.map(p => (
              <button key={p.id} class="profil-zeile" onClick={() => { vibrate(8); wechseln(p.id); }}>
                <Avatar profil={p} />
                <span class="profil-zeile-text">
                  <span class="profil-name">{p.name}</span>
                  <span class="profil-mail">{p.email}</span>
                </span>
              </button>
            ))}
            {ich && (
              <button class="profil-zeile" onClick={() => { vibrate(8); abmelden(); }}>
                <Avatar profil={null} />
                <span class="profil-zeile-text">
                  <span class="profil-name">Abmelden</span>
                  <span class="profil-mail">zurück zum Bestand ohne Anmeldung</span>
                </span>
              </button>
            )}
          </div>
          {ich && (
            <p class="profil-hinweis">
              Abmelden löscht nichts. Die Daten dieses Profils bleiben auf dem Gerät und sind
              nach der nächsten Anmeldung wieder da.
            </p>
          )}
        </>
      )}
    </Sheet>
  );
}
