/**
 * Ponto único de backend dos services.
 * Padrão: Base44. Futuro: VITE_DATA_BACKEND=firebase
 */
import * as base44Impl from './base44ClientImpl';
import * as firebaseImpl from './firebaseClient';

const useFirebase = import.meta.env.VITE_DATA_BACKEND === 'firebase';
const impl = useFirebase ? firebaseImpl : base44Impl;

export const db = impl.db;
export const auth = impl.auth;
export const integrations = impl.integrations;
export const users = impl.users;
export const functions = impl.functions;

export const dataBackend = useFirebase ? 'firebase' : 'base44';