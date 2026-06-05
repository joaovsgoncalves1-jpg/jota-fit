/**
 * Implementação Firebase — em construção (MVP Fase 0).
 * Ative com VITE_DATA_BACKEND=firebase após implementar cada entidade.
 */
import { firebaseAuth, firestoreDb } from '@/lib/firebase';

const notReady = (name) => () => {
  throw new Error(
    `[firebaseClient] ${name} ainda não migrado. Veja docs/migracao/ENTIDADES-MVP.md`
  );
};

/** Proxy até mapear entidades Base44 → coleções Firestore */
const entityStub = new Proxy(
  {},
  {
    get: (_, prop) => ({
      filter: notReady(prop),
      get: notReady(prop),
      create: notReady(prop),
      update: notReady(prop),
      delete: notReady(prop),
      list: notReady(prop),
    }),
  }
);

export const db = entityStub;

export const auth = {
  me: notReady('auth.me'),
  isAuthenticated: async () => !!firebaseAuth.currentUser,
  updateMe: notReady('auth.updateMe'),
  logout: async () => {
    if (firebaseAuth) await firebaseAuth.signOut();
  },
  redirectToLogin: notReady('auth.redirectToLogin'),
};

export const integrations = {};
export const users = {};
export const functions = {};

export { firestoreDb };