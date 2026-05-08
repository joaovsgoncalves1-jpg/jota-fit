/**
 * progressService — agregação de progresso: check-ins, medidas, XP, streaks, dashboards.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from './_base/baseClient';
import { toCheckin, toBodyMeasurement, mapArray } from './_base/mappers';
import { format } from 'date-fns';

const mapCheckins = mapArray(toCheckin);
const mapMeasurements = mapArray(toBodyMeasurement);

// ──────────────────────────────────────────────────────────────────────────────
// Checkins
// ──────────────────────────────────────────────────────────────────────────────

export async function getTodayCheckin(email) {
  if (!email) return null;
  const today = format(new Date(), 'yyyy-MM-dd');
  const list = await db.Checkin.filter({ student_email: email, date: today });
  return toCheckin(list?.[0] || null);
}

export async function listCheckins(email) {
  if (!email) return [];
  return mapCheckins(await db.Checkin.filter({ student_email: email }));
}

/**
 * Registra check-in do dia + atualiza streak/XP do perfil.
 * @returns {Promise<{ xpEarned: number, newStreak: number }>}
 */
export async function registerCheckin({ email, profile }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Pega XP de checkin (config) — fallback 50
  const xpConfigs = await db.XPConfig.list();
  const xpEarned = xpConfigs?.find(c => c.action_type === 'checkin')?.xp_value || 50;

  await db.Checkin.create({ student_email: email, date: today, xp_earned: xpEarned });

  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const newStreak = profile?.lastCheckinDate === yesterday ? (profile?.currentStreak || 0) + 1 : 1;

  if (profile?.id) {
    await db.StudentProfile.update(profile.id, {
      xp_total: (profile?.xpTotal || 0) + xpEarned,
      current_streak: newStreak,
      max_streak: Math.max(newStreak, profile?.maxStreak || 0),
      last_checkin_date: today,
    });
  }

  return { xpEarned, newStreak };
}

// ──────────────────────────────────────────────────────────────────────────────
// Body measurements
// ──────────────────────────────────────────────────────────────────────────────

export async function listMeasurements(email) {
  if (!email) return [];
  return mapMeasurements(await db.BodyMeasurement.filter({ student_email: email }, '-date'));
}

export async function createMeasurement({ studentEmail, date, ...data }) {
  return db.BodyMeasurement.create({
    student_email: studentEmail,
    date: date || format(new Date(), 'yyyy-MM-dd'),
    weight_kg: data.weightKg,
    body_fat_pct: data.bodyFatPct,
    arm_circumference: data.armCircumference,
    leg_circumference: data.legCircumference,
    chest_circumference: data.chestCircumference,
    waist_circumference: data.waistCircumference,
    notes: data.notes,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// XP / Levels
// ──────────────────────────────────────────────────────────────────────────────

export async function listLevelConfigs() {
  return db.LevelConfig.list();
}

export async function listXPConfigs() {
  return db.XPConfig.list();
}

// ──────────────────────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────────────────────

export function useTodayCheckin(email) {
  const today = format(new Date(), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['progress', 'checkin', email, today],
    queryFn: () => getTodayCheckin(email),
    enabled: !!email,
  });
}

export function useStudentMeasurements(email) {
  return useQuery({
    queryKey: ['progress', 'measurements', email],
    queryFn: () => listMeasurements(email),
    enabled: !!email,
  });
}

export function useLevelConfigs() {
  return useQuery({
    queryKey: ['progress', 'level-configs'],
    queryFn: listLevelConfigs,
    staleTime: 30 * 60 * 1000,
  });
}

export function useRegisterCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registerCheckin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress', 'checkin'] });
      qc.invalidateQueries({ queryKey: ['students', 'profile'] });
    },
  });
}