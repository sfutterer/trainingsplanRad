/* Der Stapel der Overlays und sein Umgang mit der Historie.

   Geprueft wird nicht, ob ein Sheet zugeht - das sieht man - sondern die
   Buchfuehrung dahinter. Sie ist die Stelle, an der sich die Zurueck-Geste
   verzaehlen kann, und ein Fehler faellt erst zwei Handbewegungen spaeter auf:
   ein Schritt zu viel wirft aus der App, ein Schritt zu wenig laesst Zurueck
   einmal ins Leere laufen.

   Die Historie ist hier ein Stapel aus Zustaenden mit einem Zeiger darauf -
   genau so viel, wie pushState, back und history.state ausmachen. */

import { describe, it, expect, beforeEach } from 'vitest';
import { overlayOffen, overlayZurueck } from '../src/state/overlays.js';

let zustaende, zeiger;

function historie(){
  zustaende = [{ tab: 'training' }];
  zeiger = 0;
  globalThis.history = {
    get state(){ return zustaende[zeiger]; },
    pushState(s){ zustaende = zustaende.slice(0, zeiger + 1).concat([s]); zeiger += 1; },
    back(){ if(zeiger > 0) zeiger -= 1; }
  };
}

beforeEach(() => {
  historie();
  /* Ein Stapelrest aus einem vorangegangenen Fall wuerde den naechsten
     verfaelschen - abraeumen, bis nichts mehr kommt. */
  while(overlayZurueck()){ /* leeren */ }
});

describe('Overlay-Stapel', () => {
  it('legt beim Oeffnen einen Schritt an und nimmt den Bereich mit', () => {
    overlayOffen(() => {});
    expect(zeiger).toBe(1);
    expect(history.state.tab).toBe('training');
    expect(history.state.overlay).toBeTypeOf('number');
  });

  it('schliesst bei Zurueck das oberste Overlay und meldet das', () => {
    const zu = [];
    overlayOffen(() => zu.push('unten'));
    overlayOffen(() => zu.push('oben'));
    /* Die Geste selbst: der Browser hat den Schritt schon zurueckgenommen,
       bevor der Rahmen gefragt wird. */
    history.back();
    expect(overlayZurueck()).toBe(true);
    expect(zu).toEqual(['oben']);
    history.back();
    expect(overlayZurueck()).toBe(true);
    expect(zu).toEqual(['oben', 'unten']);
  });

  it('meldet Zurueck ohne Overlay als unbehandelt', () => {
    expect(overlayZurueck()).toBe(false);
  });

  it('zieht den eigenen Schritt ein, wenn nicht die Geste geschlossen hat', () => {
    const ab = overlayOffen(() => {});
    expect(zeiger).toBe(1);
    ab();
    expect(zeiger).toBe(0);
    expect(overlayZurueck()).toBe(false);
  });

  it('nimmt nach der Geste keinen zweiten Schritt zurueck', () => {
    let ab = null;
    ab = overlayOffen(() => ab());
    history.back();
    overlayZurueck();
    /* Ein zweites back() aus dem Aufraeumteil waere hier der Schritt, der aus
       der App hinausfuehrt. */
    expect(zeiger).toBe(0);
  });

  it('laesst einen Bereichswechsel ueber dem Overlay unangetastet', () => {
    const ab = overlayOffen(() => {});
    /* Die Glocke fuehrt mit "Zum Plan" genau das aus: erst schliessen, dann
       den Bereich wechseln - und der Wechsel legt seinen eigenen Schritt. */
    history.pushState({ tab: 'plan' });
    ab();
    expect(zeiger).toBe(2);
    expect(history.state.tab).toBe('plan');
  });
});
