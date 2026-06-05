/**
 * Ponto único de backend dos services.
 *
 * - Padrão: Base44 (dados + auth)
 * - VITE_USE_FIREBASE_DATA=true → dados Firestore, auth Base44 (híbrido MVP)
 * - VITE_DATA_BACKEND=firebase → mesmo que USE_FIREBASE_DATA (legado)
 */
import * as base44Impl from './base44ClientImpl';
import * as firebaseImpl from './firebaseClient';

const useFirebaseData =
  import.meta.env.VITE_USE_FIREBASE_DATA === 'true' ||
  import.meta.env.VITE_DATA_BACKEND === 'firebase';

const impl = useFirebaseData ? firebaseImpl : base44Impl;

export const db = impl.db;
export const auth = impl.auth;
export const integrations = impl.integrations;
export const users = impl.users;
export const functions = impl.functions;

export const dataBackend = useFirebaseData ? 'firebase' : 'base44';