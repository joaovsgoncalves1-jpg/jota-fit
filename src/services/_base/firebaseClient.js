/**
 * Dados no Firestore. Auth/invite ainda via Base44 (híbrido até Fase auth).
 * Ative: VITE_USE_FIREBASE_DATA=true
 */
import * as base44Impl from './base44ClientImpl';
import { createFirestoreDb } from './firestoreEntity';

export const db = createFirestoreDb();

/** Auth continua Base44 enquanto login não migrar */
export const auth = base44Impl.auth;
export const integrations = base44Impl.integrations;
export const users = base44Impl.users;
export const functions = base44Impl.functions;