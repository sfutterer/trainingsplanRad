/* Wer ist angemeldet, und wessen Daten sind gerade offen.

   Zwei Signale, drei Aktionen. Die eigentliche Arbeit - Praefix, Registry,
   Altbestand - steht in data/profile.js; hier steht nur die Reihenfolge, in
   der sie passiert, und die ist bei der Anmeldung der springende Punkt:

     merken -> Altbestand uebertragen -> aktiv setzen -> neu laden

   Erst wenn das Profil in der Liste steht, darf ihm der Altbestand
   zugeschrieben werden; erst wenn der Altbestand drueben ist, darf es aktiv
   werden. Andersherum saehe der Nutzer nach dem Neuladen einen leeren
   Bestand - und wuerde in dem Moment glauben, das Update habe seine
   Trainingsprotokolle verloren.

   Warum am Ende ein location.reload() und kein Neubefuellen der Signale: die
   Bereiche ziehen ihren Anfangszustand beim Einhaengen aus dem Speicher - die
   Fahrtauswertung, der Zirkel, die Kalendernavigation. Ein Profilwechsel unter
   ihnen hinweg liesse die Haelfte davon auf den Daten des vorigen Profils
   stehen. Der Neustart ist die einzige Fassung, bei der man nicht bei jedem
   neuen Bereich daran denken muss - und die Sicherung macht es aus demselben
   Grund schon heute so. */

import { signal, computed } from '@preact/signals';
import { localStorageAdapter } from '../data/storage.js';
import { profilAdapter, ladeProfile, merkeProfil, vergissProfil, aktivesProfilId,
         setzeAktivesProfil, uebertrageAltbestand, praefixFuer, profilId,
         LOKAL } from '../data/profile.js';
import { leseIdToken, clientId, vergissAutoAuswahl, AnmeldeError } from '../data/google.js';

/* Der Basisspeicher haelt, was dem Geraet gehoert: die Profilliste, das aktive
   Profil, die Client-ID. Er ist nie praefigiert - sonst laege die Frage, wer
   angemeldet ist, in dem Bestand, den man erst nach der Antwort findet. */
const basis = localStorageAdapter();

/* Und darueber der Adapter, den store.js zu Repos macht. Ein einziger fuer die
   ganze App; sein Praefix wird beim Start einmal gesetzt. */
export const profilSpeicher = profilAdapter(basis);

/* null heisst: lokales Profil, niemand angemeldet. Kein Sonderobjekt dafuer -
   die Abwesenheit eines Profils ist genau das, was hier gemeint ist. */
export const profil  = signal(null);
export const profile = signal([]);

export const angemeldet = computed(() => profil.value != null);

/* Die Anfangsbuchstaben, wenn kein Bild da ist oder es nicht laedt. Zwei
   Buchstaben, weil einer bei zwei Profilen zu oft gleich ist. */
export function initialen(p){
  const quelle = (p && (p.name || p.email)) || '';
  const woerter = quelle.trim().split(/[\s.@_-]+/).filter(Boolean);
  if(!woerter.length) return '?';
  const erste = woerter[0][0] || '';
  const zweite = woerter.length > 1 ? (woerter[1][0] || '') : '';
  return (erste + zweite).toUpperCase();
}

/* Laeuft vor allem anderen in boot(): erst wenn der Praefix steht, darf
   irgendetwas aus dem Speicher gelesen werden - auch der Plan nicht, denn ein
   eigener Plan gehoert dem Profil. */
export async function initAuth(){
  const liste = await ladeProfile(basis);
  const aktivId = await aktivesProfilId(basis);
  const aktiv = liste.find(p => p.id === aktivId) || null;

  /* Ein aktives Profil, das nicht mehr in der Liste steht, kann es nach einem
     halb durchgelaufenen "Profil entfernen" geben. Dann lieber das lokale
     Profil als ein Bestand, den niemand mehr zuordnen kann. */
  profilSpeicher.setzePraefix(praefixFuer(aktiv ? aktiv.id : LOKAL));
  profile.value = liste;
  profil.value = aktiv;
}

/* Der Rueckruf des Google-Knopfes. Wirft AnmeldeError, wenn das Token nichts
   taugt - der Aufrufer zeigt den Text im Sheet an, und es aendert sich nichts.

   Gibt zurueck, was aus dem Altbestand uebernommen wurde: das Sheet meldet es,
   denn es ist das Einzige an diesem Vorgang, das der Nutzer nicht erwartet. */
export async function meldeAn(credential){
  const konto = leseIdToken(credential, clientId(), Date.now());
  const p = {
    id:      profilId(konto.sub),
    name:    konto.name,
    email:   konto.email,
    bild:    konto.bild,
    zuletzt: new Date().toISOString()
  };
  await merkeProfil(basis, p);
  const uebernommen = await uebertrageAltbestand(basis, p.id);
  await setzeAktivesProfil(basis, p.id);
  return { profil: p, uebernommen };
}

export async function meldeAb(){
  vergissAutoAuswahl();
  await setzeAktivesProfil(basis, LOKAL);
}

export async function wechsleZu(id){
  await setzeAktivesProfil(basis, id);
}

/* Entfernt Eintrag und Daten. Der Aufrufer fragt vorher nach - das hier ist
   die einzige Stelle der App, die Trainingsprotokolle ohne Ersatz loescht. */
export async function entferneProfil(id){
  const aktivId = await aktivesProfilId(basis);
  await vergissProfil(basis, id);
  if(aktivId === id) await setzeAktivesProfil(basis, LOKAL);
  profile.value = await ladeProfile(basis);
}

/* Alle Wege, die den Bestand unter der laufenden App austauschen, enden hier -
   siehe Dateikopf. */
export function neuStarten(){
  location.reload();
}

export { AnmeldeError, LOKAL };
