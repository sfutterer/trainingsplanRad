/* Laeuft gerade ein Timer? Braucht die App an zwei Stellen: der
   Update-Hinweis haelt sich zurueck, und der Wake Lock haengt daran. */
import { signal } from '@preact/signals';

export const timerLaeuft = signal(false);
