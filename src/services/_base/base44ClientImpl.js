/**
 * Implementação Base44 — usada enquanto VITE_DATA_BACKEND=base44 (padrão).
 */
import { base44 } from '@/api/base44Client';

export const db = base44.entities;
export const auth = base44.auth;
export const integrations = base44.integrations;
export const users = base44.users;
export const functions = base44.functions;