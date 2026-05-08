/**
 * studentService — perfis dos alunos, gestão de XP/streak, status de consultoria.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, users } from './_base/baseClient';
import { toStudentProfile, fromStudentProfile, mapArray } from './_base/mappers';

const mapProfiles = mapArray(toStudentProfile);

/** @returns {Promise<import('./types').StudentProfile|null>} */
export async function getProfileByEmail(email) {
  if (!email) return null;
  const list = await db.StudentProfile.filter({ email });
  return toStudentProfile(list?.[0] || null);
}

/** @returns {Promise<import('./types').StudentProfile|null>} */
export async function getProfileById(id) {
  if (!id) return null;
  const list = await db.StudentProfile.filter({ id });
  return toStudentProfile(list?.[0] || null);
}

/** @returns {Promise<import('./types').StudentProfile[]>} */
export async function listAllProfiles({ sortByXP = false } = {}) {
  const sort = sortByXP ? '-xp_total' : undefined;
  return mapProfiles(await db.StudentProfile.list(sort));
}

/** Atualiza um campo do perfil. Aceita formato neutro (camelCase). */
export async function updateProfile(profileId, patch) {
  return db.StudentProfile.update(profileId, fromStudentProfile(patch));
}

export async function createProfile(data) {
  return db.StudentProfile.create(fromStudentProfile(data));
}

/** Convida um novo aluno. */
export async function inviteStudent({ email, name, role = 'student' }) {
  await createProfile({
    email, name,
    xpTotal: 0, currentStreak: 0, maxStreak: 0, active: true,
  });
  await users.inviteUser(email, role);
}

/** Atualiza apenas o consultant_status. */
export async function updateConsultantStatus(profileId, status) {
  return db.StudentProfile.update(profileId, { consultant_status: status });
}

// ──────────────────────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────────────────────

export function useMyProfile(email) {
  return useQuery({
    queryKey: ['students', 'profile', email],
    queryFn: () => getProfileByEmail(email),
    enabled: !!email,
  });
}

export function useAllProfiles(opts = {}) {
  return useQuery({
    queryKey: ['students', 'all', opts.sortByXP ? 'byXP' : 'default'],
    queryFn: () => listAllProfiles(opts),
  });
}

export function useUpdateConsultantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, status }) => updateConsultantStatus(profileId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useInviteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inviteStudent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}