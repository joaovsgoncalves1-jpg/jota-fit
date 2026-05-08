/**
 * authService — autenticação e sessão do usuário corrente.
 * Interface neutra. Hoje usa Base44 por baixo, amanhã pode ser Supabase/Auth0/próprio.
 */
import { useEffect, useState } from 'react';
import { auth } from './_base/baseClient';
import { toAppUser } from './_base/mappers';

/** @returns {Promise<import('./types').AppUser|null>} */
export async function getCurrentUser() {
  try {
    const u = await auth.me();
    return toAppUser(u);
  } catch {
    return null;
  }
}

/** @returns {Promise<boolean>} */
export async function isAuthenticated() {
  try { return await auth.isAuthenticated(); }
  catch { return false; }
}

/** Atualiza dados do usuário corrente (não inclui email/role). */
export async function updateCurrentUser(data) {
  return auth.updateMe(data);
}

export function logout(redirectUrl) {
  return auth.logout(redirectUrl);
}

export function redirectToLogin(nextUrl) {
  return auth.redirectToLogin(nextUrl);
}

// ──────────────────────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────────────────────

/** Hook para o usuário corrente. Mantém compat com o antigo `useCurrentUser`. */
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then(u => {
      if (cancelled) return;
      setUser(u);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { user, loading, isAdmin: user?.role === 'admin' };
}