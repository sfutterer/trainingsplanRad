/* Profile: getrennte Datenbestaende in einem Browser.

   Bis hierher lag alles in localStorage dieses einen Browserprofils, mit
   nackten Schluesseln wie "core-session-log". Das reicht, solange genau ein
   Mensch die App benutzt. Sobald sich jemand anmeldet, muss klar sein, wessen
   Trainingsprotokolle da stehen - sonst schreibt der zweite Nutzer in die
   Historie des ersten.

   Die Trennung passiert an genau einer Stelle: einem Adapter, der jedem
   Schluessel einen Praefix voranstellt. Alles darueber - createRepos, die
   Sicherung, jeder Bereich - merkt davon nichts und arbeitet weiter mit
   "core-session-log".

   Das lokale Profil hat bewusst den leeren Praefix. Es IST der Bestand von
   vor diesem Update, unveraendert an derselben Stelle. Damit ist die App ohne
   Anmeldung genau das, was sie vorher war - und wer sich nie anmeldet, merkt
   von der ganzen Sache nichts.

   Angemeldete Profile liegen unter "profil:google:<sub>:". Die sub ist die
   Google-Kontokennung: stabil, auch wenn jemand seinen Namen oder seine
   Mailadresse aendert. Die Mailadresse als Kennung zu nehmen waere der
   naheliegende Fehler - ein Kontowechsel bei Google zoege den kompletten
   Datenbestand hinter sich her. */

import { KEYS } from './storage.js';

/* Schluessel, die keinem Profil gehoeren, sondern dem Geraet: wer angemeldet
   ist, welche Profile es hier gibt, und wer den Altbestand bekommen hat. Sie
   stehen unpraefigiert neben den Daten des lokalen Profils - deshalb muss
   keys() sie kennen, um sie herauszufiltern.

   Sie gehoeren aus demselben Grund nicht in die Sicherung: die ist der Bestand
   EINES Profils, und ein eingespieltes "auth-aktiv" wuerde auf einem anderen
   Geraet auf ein Profil zeigen, das es dort nicht gibt. */
export const GERAET = {
  profile:    'auth-profile',
  aktiv:      'auth-aktiv',
  altbestand: 'auth-altbestand'
};

export const PROFIL_PRAEFIX = 'profil:';

/* Das Profil ohne Anmeldung. Kein Eintrag in der Liste, kein Praefix - der
   Zustand, in dem die App vor diesem Update immer war. */
export const LOKAL = 'lokal';

export function praefixFuer(id){
  return (!id || id === LOKAL) ? '' : PROFIL_PRAEFIX + id + ':';
}

export function profilId(sub){ return 'google:' + sub; }

/* Der Adapter, der die Trennung macht. Sein Praefix ist veraenderlich, weil
   die Repos darueber beim Start einmal gebaut und dann von der halben App
   eingefuehrt werden - ein Profilwechsel darf diese Bindung nicht brechen.

   Praktisch wechselt er trotzdem nur einmal je Sitzung: der Wechsel laedt die
   Seite neu, weil zu viele Bereiche ihren Anfangszustand beim Einhaengen aus
   dem Speicher ziehen. Veraenderlich ist er fuer den Start - Praefix setzen,
   dann laden - und fuer die Tests. */
export function profilAdapter(basis){
  let praefix = '';
  const geraetKeys = new Set(Object.values(GERAET));

  return {
    basis,
    get praefix(){ return praefix; },
    setzePraefix(p){ praefix = p || ''; },

    async get(k){ return basis.get(praefix + k); },
    async set(k, v){ return basis.set(praefix + k, v); },
    async remove(k){ return basis.remove(praefix + k); },

    /* Ohne Praefix muessen die Schluessel der anderen Profile und die des
       Geraets heraus - sonst saehe das lokale Profil alles, was sonst noch im
       Speicher liegt. */
    async keys(){
      const alle = await basis.keys();
      if(praefix){
        return alle.filter(k => k.startsWith(praefix)).map(k => k.slice(praefix.length));
      }
      return alle.filter(k => !k.startsWith(PROFIL_PRAEFIX) && !geraetKeys.has(k));
    }
  };
}

/* --- Die Profilliste auf dem Geraet --- */

function sauber(p){
  if(!p || typeof p !== 'object' || typeof p.id !== 'string' || !p.id) return null;
  return {
    id:      p.id,
    name:    typeof p.name  === 'string' ? p.name  : '',
    email:   typeof p.email === 'string' ? p.email : '',
    bild:    typeof p.bild  === 'string' ? p.bild  : '',
    zuletzt: typeof p.zuletzt === 'string' ? p.zuletzt : ''
  };
}

export async function ladeProfile(basis){
  const roh = await basis.get(GERAET.profile);
  if(roh == null) return [];
  let v;
  try { v = JSON.parse(roh); } catch(e){ return []; }
  if(!Array.isArray(v)) return [];
  return v.map(sauber).filter(Boolean);
}

/* Legt an oder aktualisiert - Name und Bild aendern sich bei Google
   gelegentlich, und dann soll oben rechts das neue Bild stehen. */
export async function merkeProfil(basis, profil){
  const p = sauber(profil);
  if(!p) return null;
  const liste = await ladeProfile(basis);
  const rest = liste.filter(x => x.id !== p.id);
  const neu = rest.concat([p]);
  await basis.set(GERAET.profile, JSON.stringify(neu));
  return neu;
}

export async function vergissProfil(basis, id){
  const liste = await ladeProfile(basis);
  const neu = liste.filter(p => p.id !== id);
  await basis.set(GERAET.profile, JSON.stringify(neu));

  /* Der Eintrag verschwindet, seine Daten bleiben sonst als Leichen liegen -
     und der Speicher eines Browsers ist nicht gross. Nur die Schluessel dieses
     einen Praefixes, nichts sonst. */
  const praefix = praefixFuer(id);
  if(praefix){
    for(const k of await basis.keys()){
      if(k.startsWith(praefix)) await basis.remove(k);
    }
  }
  return neu;
}

export async function aktivesProfilId(basis){
  return (await basis.get(GERAET.aktiv)) || LOKAL;
}

export async function setzeAktivesProfil(basis, id){
  if(!id || id === LOKAL) return basis.remove(GERAET.aktiv);
  return basis.set(GERAET.aktiv, id);
}

/* --- Der Altbestand ---

   Das Versprechen dieses Updates: wer die App vorher benutzt hat, findet seine
   Protokolle nach der ersten Anmeldung wieder - im Profil, das sich als erstes
   anmeldet.

   Uebertragen und nicht kopieren: eine zweite Fassung derselben Historie im
   lokalen Profil waere kein Sicherheitsnetz, sondern ein zweiter Stand, der
   ab dem naechsten Training auseinanderlaeuft. Wer sie behalten will, hat den
   Knopf "Sicherung herunterladen" - das ist die Kopie, die etwas taugt.

   Genau einmal: der Merker haelt fest, welches Profil den Altbestand bekommen
   hat. Ohne ihn zoege das zweite angemeldete Profil das an sich, was das erste
   inzwischen dort neu geschrieben hat.

   Die Reihenfolge - erst schreiben, dann merken, dann loeschen - ist die
   einzige, die jeden Abbruch ueberlebt. Bricht es beim Schreiben ab, steht der
   Altbestand noch vollstaendig da und der naechste Lauf schreibt ihn einfach
   erneut. Bricht es beim Loeschen ab, liegt er doppelt - sichtbar wird davon
   nichts, denn der Merker steht, und niemand holt ihn ein zweites Mal. */
export async function uebertrageAltbestand(basis, id){
  const praefix = praefixFuer(id);
  if(!praefix) return [];
  if((await basis.get(GERAET.altbestand)) != null) return [];

  const gefunden = [];
  for(const k of Object.values(KEYS)){
    const v = await basis.get(k);
    if(v != null) gefunden.push([k, v]);
  }

  for(const [k, v] of gefunden) await basis.set(praefix + k, v);
  await basis.set(GERAET.altbestand, id);
  for(const [k] of gefunden) await basis.remove(k);

  return gefunden.map(([k]) => k);
}
