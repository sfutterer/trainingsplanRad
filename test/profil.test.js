/* Die Profiltrennung und die eine Uebergabe, die es nur einmal gibt.

   Der wichtigste Fall steht ganz unten: der Bestand von vor dem Update landet
   im ersten Profil, das sich anmeldet, und nur dort. Faellt dieser Test, hat
   ein Nutzer nach dem Update eine leere App vor sich - und keinen Weg zurueck
   ausser einer Sicherung, die er vermutlich nie angelegt hat. */

import { describe, it, expect } from 'vitest';
import { memoryAdapter, createRepos, KEYS } from '../src/data/storage.js';
import { profilAdapter, praefixFuer, profilId, ladeProfile, merkeProfil,
         vergissProfil, aktivesProfilId, setzeAktivesProfil, uebertrageAltbestand,
         GERAET, LOKAL, PROFIL_PRAEFIX } from '../src/data/profile.js';
import { leseIdToken, AnmeldeError } from '../src/data/google.js';

/* Ein Bestand, wie ihn jemand vor dem Update im Browser stehen hatte: nackte
   Schluessel, kein Praefix. */
function altbestand(){
  return {
    [KEYS.startDate]: '2026-08-15',
    [KEYS.coreLog]:   JSON.stringify([{ id:'a', day:'2026-08-20', week:1, rounds:3, sets:24 }]),
    [KEYS.apiKey]:    'icu-abc123',
    [KEYS.settings]:  JSON.stringify({ voice:false, theme:'dark' })
  };
}

const ANNA = { id: profilId('117000000000000000001'), name:'Anna Beispiel', email:'anna@example.com', bild:'', zuletzt:'2026-08-30T08:00:00.000Z' };
const BODO = { id: profilId('117000000000000000002'), name:'Bodo Beispiel', email:'bodo@example.com', bild:'', zuletzt:'2026-08-30T09:00:00.000Z' };

describe('Praefix', () => {
  it('laesst das lokale Profil da, wo der Bestand schon liegt', () => {
    /* Der leere Praefix ist die ganze Vertraeglichkeit nach hinten: wer sich
       nie anmeldet, liest und schreibt genau die Schluessel von vorher. */
    expect(praefixFuer(LOKAL)).toBe('');
    expect(praefixFuer(null)).toBe('');
    expect(praefixFuer(undefined)).toBe('');
  });

  it('haengt angemeldete Profile an ihre Kontokennung', () => {
    expect(praefixFuer(ANNA.id)).toBe(PROFIL_PRAEFIX + 'google:117000000000000000001:');
  });
});

describe('Profiladapter', () => {
  it('schreibt ohne Praefix genau dorthin, wo der Altbestand liegt', async () => {
    const basis = memoryAdapter(altbestand());
    const a = profilAdapter(basis);
    expect(await a.get(KEYS.coreLog)).toBe(altbestand()[KEYS.coreLog]);

    await a.set(KEYS.coreLog, '[]');
    expect(await basis.get(KEYS.coreLog)).toBe('[]');
  });

  it('haelt zwei Profile auseinander', async () => {
    const basis = memoryAdapter({});
    const a = profilAdapter(basis);

    a.setzePraefix(praefixFuer(ANNA.id));
    await a.set(KEYS.coreLog, '["anna"]');

    a.setzePraefix(praefixFuer(BODO.id));
    expect(await a.get(KEYS.coreLog)).toBe(null);
    await a.set(KEYS.coreLog, '["bodo"]');

    a.setzePraefix(praefixFuer(ANNA.id));
    expect(await a.get(KEYS.coreLog)).toBe('["anna"]');
    /* Und im lokalen Profil steht von beiden nichts. */
    a.setzePraefix('');
    expect(await a.get(KEYS.coreLog)).toBe(null);
  });

  it('loescht nur im eigenen Profil', async () => {
    const basis = memoryAdapter({});
    const a = profilAdapter(basis);
    a.setzePraefix(praefixFuer(ANNA.id));
    await a.set(KEYS.apiKey, 'anna-key');
    a.setzePraefix(praefixFuer(BODO.id));
    await a.set(KEYS.apiKey, 'bodo-key');

    await a.remove(KEYS.apiKey);
    a.setzePraefix(praefixFuer(ANNA.id));
    expect(await a.get(KEYS.apiKey)).toBe('anna-key');
  });

  it('zeigt dem lokalen Profil weder fremde Profile noch die Geraetedaten', async () => {
    /* Sonst saehe eine Aufzaehlung im lokalen Profil den halben Speicher -
       einschliesslich der Frage, wer angemeldet ist. */
    const basis = memoryAdapter({
      [KEYS.coreLog]: '[]',
      [GERAET.aktiv]: ANNA.id,
      [GERAET.profile]: '[]',
      [praefixFuer(ANNA.id) + KEYS.coreLog]: '["anna"]'
    });
    const a = profilAdapter(basis);
    expect((await a.keys()).sort()).toEqual([KEYS.coreLog]);

    a.setzePraefix(praefixFuer(ANNA.id));
    expect(await a.keys()).toEqual([KEYS.coreLog]);
  });

  it('traegt die Repos unveraendert', async () => {
    /* Der Punkt der ganzen Uebung: ueber dem Adapter aendert sich nichts. */
    const basis = memoryAdapter({});
    const a = profilAdapter(basis);
    a.setzePraefix(praefixFuer(ANNA.id));
    const repos = createRepos(a);

    await repos.setThresholds({ ftp:230, lthr:160, hrmax:186 });
    expect(await repos.thresholds()).toEqual({ ftp:230, lthr:160, hrmax:186 });
    expect(await basis.get(praefixFuer(ANNA.id) + KEYS.thresholds)).toBeTruthy();
    expect(await basis.get(KEYS.thresholds)).toBe(null);
  });
});

describe('Profilliste', () => {
  it('legt an, aktualisiert und wirft nichts doppelt hinein', async () => {
    const basis = memoryAdapter({});
    await merkeProfil(basis, ANNA);
    await merkeProfil(basis, BODO);
    await merkeProfil(basis, Object.assign({}, ANNA, { name:'Anna Neu', bild:'https://example.com/a.png' }));

    const liste = await ladeProfile(basis);
    expect(liste).toHaveLength(2);
    const anna = liste.find(p => p.id === ANNA.id);
    expect(anna.name).toBe('Anna Neu');
    expect(anna.bild).toBe('https://example.com/a.png');
  });

  it('uebersteht eine kaputte Liste, statt die App zu blockieren', async () => {
    expect(await ladeProfile(memoryAdapter({ [GERAET.profile]: '[{kaputt' }))).toEqual([]);
    expect(await ladeProfile(memoryAdapter({ [GERAET.profile]: '{"kein":"array"}' }))).toEqual([]);
    expect(await ladeProfile(memoryAdapter({ [GERAET.profile]: '[null,{"ohne":"id"}]' }))).toEqual([]);
  });

  it('nimmt beim Entfernen die Daten mit', async () => {
    const basis = memoryAdapter({});
    await merkeProfil(basis, ANNA);
    await merkeProfil(basis, BODO);
    await basis.set(praefixFuer(ANNA.id) + KEYS.coreLog, '["anna"]');
    await basis.set(praefixFuer(BODO.id) + KEYS.coreLog, '["bodo"]');

    await vergissProfil(basis, ANNA.id);
    expect(await ladeProfile(basis)).toHaveLength(1);
    expect(await basis.get(praefixFuer(ANNA.id) + KEYS.coreLog)).toBe(null);
    /* Und die des anderen bleiben stehen. */
    expect(await basis.get(praefixFuer(BODO.id) + KEYS.coreLog)).toBe('["bodo"]');
  });

  it('nennt ohne Anmeldung das lokale Profil', async () => {
    const basis = memoryAdapter({});
    expect(await aktivesProfilId(basis)).toBe(LOKAL);
    await setzeAktivesProfil(basis, ANNA.id);
    expect(await aktivesProfilId(basis)).toBe(ANNA.id);
    await setzeAktivesProfil(basis, LOKAL);
    expect(await aktivesProfilId(basis)).toBe(LOKAL);
    expect(await basis.get(GERAET.aktiv)).toBe(null);
  });
});

describe('Altbestand beim Update', () => {
  it('geht vollstaendig an das erste Profil, das sich anmeldet', async () => {
    const basis = memoryAdapter(altbestand());
    const uebernommen = await uebertrageAltbestand(basis, ANNA.id);

    expect(uebernommen.sort()).toEqual(Object.keys(altbestand()).sort());
    for(const [k, v] of Object.entries(altbestand())){
      expect(await basis.get(praefixFuer(ANNA.id) + k)).toBe(v);
      /* Uebertragen und nicht kopiert: zwei Staende derselben Historie liefen
         ab dem naechsten Training auseinander. */
      expect(await basis.get(k)).toBe(null);
    }
    expect(await basis.get(GERAET.altbestand)).toBe(ANNA.id);
  });

  it('ist ueber die Repos hinterher unveraendert lesbar', async () => {
    const basis = memoryAdapter(altbestand());
    await uebertrageAltbestand(basis, ANNA.id);

    const a = profilAdapter(basis);
    a.setzePraefix(praefixFuer(ANNA.id));
    const repos = createRepos(a);
    expect(await repos.startDate()).toBe('2026-08-15');
    expect(await repos.coreLog()).toHaveLength(1);
    expect(await repos.apiKey()).toBe('icu-abc123');
    expect((await repos.settings()).theme).toBe('dark');
  });

  it('gibt ihn kein zweites Mal her', async () => {
    /* Der Kern des Merkers: Bodo meldet sich nach Anna an und bekommt einen
       leeren Bestand - nicht das, was Anna inzwischen geschrieben hat. */
    const basis = memoryAdapter(altbestand());
    await uebertrageAltbestand(basis, ANNA.id);
    await basis.set(praefixFuer(ANNA.id) + KEYS.coreLog, '["anna trainiert weiter"]');

    const zweiter = await uebertrageAltbestand(basis, BODO.id);
    expect(zweiter).toEqual([]);
    expect(await basis.get(praefixFuer(BODO.id) + KEYS.coreLog)).toBe(null);
    expect(await basis.get(GERAET.altbestand)).toBe(ANNA.id);
  });

  it('meldet sich derselbe noch einmal an, passiert nichts mehr', async () => {
    const basis = memoryAdapter(altbestand());
    await uebertrageAltbestand(basis, ANNA.id);
    await basis.set(praefixFuer(ANNA.id) + KEYS.coreLog, '["neuer stand"]');

    expect(await uebertrageAltbestand(basis, ANNA.id)).toEqual([]);
    expect(await basis.get(praefixFuer(ANNA.id) + KEYS.coreLog)).toBe('["neuer stand"]');
  });

  it('vergibt einen leeren Altbestand, ohne etwas anzufassen', async () => {
    /* Der Normalfall einer frischen Installation. Der Merker faellt trotzdem,
       damit ein spaeter angelegtes zweites Profil nicht doch noch etwas an
       sich zieht. */
    const basis = memoryAdapter({});
    expect(await uebertrageAltbestand(basis, ANNA.id)).toEqual([]);
    expect(await basis.get(GERAET.altbestand)).toBe(ANNA.id);
  });

  it('ruehrt das lokale Profil nicht an', async () => {
    const basis = memoryAdapter(altbestand());
    expect(await uebertrageAltbestand(basis, LOKAL)).toEqual([]);
    expect(await basis.get(KEYS.coreLog)).toBe(altbestand()[KEYS.coreLog]);
    expect(await basis.get(GERAET.altbestand)).toBe(null);
  });
});

/* --- Das Token --- */

function jwt(nutzlast){
  const b64 = obj => Buffer.from(JSON.stringify(obj), 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64({ alg:'RS256' }) + '.' + b64(nutzlast) + '.unterschrift';
}

const JETZT = Date.UTC(2026, 7, 30, 10, 0, 0);
const GUELTIG = {
  sub: '117000000000000000001',
  aud: 'abc.apps.googleusercontent.com',
  exp: Math.floor(JETZT / 1000) + 3600,
  name: 'Anna Beispiel',
  email: 'anna@example.com',
  picture: 'https://lh3.googleusercontent.com/a/abc'
};

describe('ID-Token lesen', () => {
  it('holt Kennung, Name, Mail und Bild heraus', () => {
    expect(leseIdToken(jwt(GUELTIG), GUELTIG.aud, JETZT)).toEqual({
      sub: '117000000000000000001',
      name: 'Anna Beispiel',
      email: 'anna@example.com',
      bild: 'https://lh3.googleusercontent.com/a/abc'
    });
  });

  it('bringt Umlaute heil durch', () => {
    /* atob allein liefert hier "MÃ¼ller" - der Name stuende dann so oben
       rechts in der Leiste. */
    const p = leseIdToken(jwt(Object.assign({}, GUELTIG, { name:'Jörg Müller-Weiß' })), GUELTIG.aud, JETZT);
    expect(p.name).toBe('Jörg Müller-Weiß');
  });

  it('nimmt die Mailadresse, wenn kein Name mitkommt', () => {
    const ohneName = Object.assign({}, GUELTIG);
    delete ohneName.name;
    expect(leseIdToken(jwt(ohneName), GUELTIG.aud, JETZT).name).toBe('anna@example.com');
  });

  it('weist ein Token fuer eine andere Client-ID ab', () => {
    expect(() => leseIdToken(jwt(GUELTIG), 'andere.apps.googleusercontent.com', JETZT))
      .toThrow(AnmeldeError);
  });

  it('weist ein abgelaufenes Token ab', () => {
    const alt = Object.assign({}, GUELTIG, { exp: Math.floor(JETZT / 1000) - 1 });
    expect(() => leseIdToken(jwt(alt), GUELTIG.aud, JETZT)).toThrow(/abgelaufen/);
  });

  it('weist ein Token ohne Kontokennung ab', () => {
    const ohneSub = Object.assign({}, GUELTIG);
    delete ohneSub.sub;
    expect(() => leseIdToken(jwt(ohneSub), GUELTIG.aud, JETZT)).toThrow(AnmeldeError);
  });

  it('weist Muell ab, statt daran zu zerbrechen', () => {
    expect(() => leseIdToken('', GUELTIG.aud, JETZT)).toThrow(AnmeldeError);
    expect(() => leseIdToken('nur.zwei', GUELTIG.aud, JETZT)).toThrow(AnmeldeError);
    expect(() => leseIdToken('a.****.c', GUELTIG.aud, JETZT)).toThrow(AnmeldeError);
    expect(() => leseIdToken(null, GUELTIG.aud, JETZT)).toThrow(AnmeldeError);
  });
});
