/**
 * workoutService — sessões de treino, séries e PRs.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from './_base/baseClient';
import {
  toWorkoutSession, fromWorkoutSession,
  toSetLog, fromSetLog,
  toPR, fromPR,
  mapArray,
} from './_base/mappers';
import { detectPR, buildPRRecord } from '@/lib/prDetection';

const mapSessions = mapArray(toWorkoutSession);
const mapSets = mapArray(toSetLog);
const mapPRs = mapArray(toPR);

// ──────────────────────────────────────────────────────────────────────────────
// Sessions
// ──────────────────────────────────────────────────────────────────────────────

export async function startSession({ studentEmail, routineId, routineName }) {
  const created = await db.WorkoutSession.create(fromWorkoutSession({
    studentEmail,
    routineId,
    routineName,
    startedAt: new Date().toISOString(),
    status: 'in_progress',
  }));
  return toWorkoutSession(created);
}

export async function finishSession(sessionId, summary) {
  const updated = await db.WorkoutSession.update(sessionId, fromWorkoutSession({
    finishedAt: summary.finishedAt || new Date().toISOString(),
    status: 'completed',
    durationMinutes: summary.durationMinutes,
    totalVolumeKg: summary.totalVolumeKg,
    setsCompleted: summary.setsCompleted,
    exercisesCompleted: summary.exercisesCompleted,
    xpEarned: summary.xpEarned,
    prsCount: summary.prsCount,
  }));
  return toWorkoutSession(updated);
}

export async function getSession(id) {
  if (!id) return null;
  const list = await db.WorkoutSession.filter({ id });
  return toWorkoutSession(list?.[0] || null);
}

export async function listSessionsByStudent(email, { limit = 500 } = {}) {
  if (!email) return [];
  return mapSessions(await db.WorkoutSession.filter({ student_email: email }, '-started_at', limit));
}

export async function listAllSessions({ limit = 500 } = {}) {
  return mapSessions(await db.WorkoutSession.list('-started_at', limit));
}

// ──────────────────────────────────────────────────────────────────────────────
// SetLogs
// ──────────────────────────────────────────────────────────────────────────────

export async function listSetsBySession(sessionId) {
  if (!sessionId) return [];
  return mapSets(await db.SetLog.filter({ session_id: sessionId }));
}

export async function listSetsByStudent(email) {
  if (!email) return [];
  return mapSets(await db.SetLog.filter({ student_email: email }));
}

/**
 * Registra uma série. Detecta PR automaticamente e cria o registro de PR se for o caso.
 * `historicalSets` deve estar no formato neutro (camelCase).
 * @returns {Promise<{ set: import('./types').SetLog, isPR: boolean, prRecord?: import('./types').ExercisePersonalRecord }>}
 */
export async function logSet({ studentEmail, sessionId, exercise, set, historicalSets = [] }) {
  const trackingType = exercise?.trackingType || 'weight_reps';

  // Monta payload no formato Base44 (snake_case) pq prDetection espera assim.
  const payload = {
    session_id: sessionId,
    student_email: studentEmail,
    exercise_id: exercise?.id,
    exercise_name: exercise?.name,
    set_number: set.setNumber,
    completed: true,
    rir: set.rir || undefined,
    rpe: set.rpe || undefined,
  };

  if (['weight_reps', 'unilateral'].includes(trackingType)) {
    payload.weight_kg = set.weightKg || 0;
    payload.reps = set.reps || 0;
  } else if (['bodyweight_reps', 'assisted_bodyweight'].includes(trackingType)) {
    payload.reps = set.reps || 0;
    payload.band_assistance_level = set.bandAssistanceLevel || undefined;
    payload.band_color = set.bandColor || undefined;
  } else if (trackingType === 'hold_time') {
    payload.duration_seconds = set.durationSeconds || 0;
    payload.band_assistance_level = set.bandAssistanceLevel || undefined;
    payload.band_color = set.bandColor || undefined;
  } else if (trackingType === 'time_distance') {
    payload.duration_seconds = (set.durationSeconds || 0);
    payload.weight_kg = set.weightKg || 0;
  }

  // Converte historicalSets neutros → snake_case pra o detector
  const histRaw = historicalSets.map(h => fromSetLog(h));
  const prResult = detectPR(payload, histRaw, trackingType);

  if (prResult?.isPR) {
    payload.is_pr = true;
    payload.pr_type = prResult.prType;
  }

  const createdSet = await db.SetLog.create(payload);

  let prRecord = null;
  if (prResult?.isPR && sessionId) {
    const prRaw = buildPRRecord({
      studentEmail,
      exerciseId: exercise?.id,
      exerciseName: exercise?.name,
      set: payload,
      prResult,
      sessionId,
    });
    const created = await db.ExercisePersonalRecord.create(prRaw);
    prRecord = toPR(created);
  }

  return {
    set: toSetLog(createdSet),
    isPR: !!prResult?.isPR,
    prRecord,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// PRs
// ──────────────────────────────────────────────────────────────────────────────

export async function listPRsByStudent(email, { limit = 500 } = {}) {
  if (!email) return [];
  return mapPRs(await db.ExercisePersonalRecord.filter({ student_email: email }, '-achieved_at', limit));
}

export async function listAllPRs({ limit = 500 } = {}) {
  return mapPRs(await db.ExercisePersonalRecord.list('-achieved_at', limit));
}

export async function getPRsForSession(sessionId) {
  if (!sessionId) return [];
  return mapPRs(await db.ExercisePersonalRecord.filter({ session_id: sessionId }));
}

// ──────────────────────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────────────────────

export function useStudentSessions(email, opts = {}) {
  return useQuery({
    queryKey: ['workouts', 'sessions', email, opts.limit || 500],
    queryFn: () => listSessionsByStudent(email, opts),
    enabled: !!email,
  });
}

export function useAllSessions(opts = {}) {
  return useQuery({
    queryKey: ['workouts', 'all-sessions', opts.limit || 500],
    queryFn: () => listAllSessions(opts),
  });
}

export function useStudentSets(email) {
  return useQuery({
    queryKey: ['workouts', 'sets', email],
    queryFn: () => listSetsByStudent(email),
    enabled: !!email,
  });
}

export function useStudentPRs(email) {
  return useQuery({
    queryKey: ['workouts', 'prs', email],
    queryFn: () => listPRsByStudent(email),
    enabled: !!email,
  });
}

export function useAllPRs(opts = {}) {
  return useQuery({
    queryKey: ['workouts', 'all-prs', opts.limit || 500],
    queryFn: () => listAllPRs(opts),
  });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', 'sessions'] }),
  });
}