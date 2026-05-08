/**
 * baseClient — único ponto onde os services tocam o Base44.
 * Quando migrarmos pro nosso backend, basta substituir este arquivo (mantendo
 * a interface de cada service intacta).
 */
import { base44 } from '@/api/base44Client';

export const db = base44.entities;
export const auth = base44.auth;
export const integrations = base44.integrations;
export const users = base44.users;
export const functions = base44.functions;