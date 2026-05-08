/**
 * routineService — rotinas e exercícios da rotina.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from './_base/baseClient';
import {
  toRoutine, fromRoutine,
  toRoutineExercise, fromRoutineExercise,
  mapArray,
} from './_base/mappers';

const mapRoutines = mapArray(toRoutine);
const mapREs = mapArray(toRoutineExercise);

/** @returns {Promise<import('./types').Routine[]>} */
export async function listRoutinesByStudent(email) {
  if (!email) return [];
  return mapRoutines(await db.Routine.filter({ student_email: email }));
}

/** Todas rotinas (admin). */
export async function listAllRoutines() {
  return mapRoutines(await db.Routine.list());
}

/** @returns {Promise<import('./types').Routine|null>} */
export async function getRoutine(id) {
  if (!id) return null;
  const r = await db.Routine.filter({ id });
  return toRoutine(r?.[0] || null);
}

/** @returns {Promise<import('./types').Routine|null>} */
export async function getActiveRoutine(email) {
  const list = await listRoutinesByStudent(email);
  return list.find(r => r.isActive) || null;
}

/** Cria rotina. Aceita objeto neutro. */
export async function createRoutine(routine) {
  const created = await db.Routine.create(fromRoutine(routine));
  return toRoutine(created);
}

/** Atualiza rotina. */
export async function updateRoutine(id, patch) {
  const updated = await db.Routine.update(id, fromRoutine(patch));
  return toRoutine(updated);
}

export async function deleteRoutine(id) {
  return db.Routine.delete(id);
}

/**
 * Carrega uma rotina + RoutineExercises + dados completos do Exercise.
 * Se algum exercise_id não for encontrado, devolve o item com `exercise: null`
 * e `missing: true` — a UI deve mostrar fallback "Exercício não encontrado"
 * sem quebrar.
 */
export async function getRoutineWithExercises(routineId) {
  if (!routineId) return null;
  const routine = await getRoutine(routineId);
  if (!routine) return null;

  const items = await listRoutineExercises(routineId);
  if (!items.length) return { routine, items: [] };

  // Lazy import para evitar ciclo
  const { getExercisesByIds } = await import('./exerciseService.js');
  const ids = [...new Set(items.map(i => i.exerciseId).filter(Boolean))];
  const exercises = await getExercisesByIds(ids);
  const exerciseById = new Map(exercises.map(e => [e.id, e]));

  return {
    routine,
    items: items.map(re => ({
      ...re,
      exercise: exerciseById.get(re.exerciseId) || null,
      missing: !exerciseById.has(re.exerciseId),
    })),
  };
}

/** Marca uma rotina como ativa, desativando as outras do mesmo aluno. */
export async function setActiveRoutine(routineId, studentEmail) {
  const all = await listRoutinesByStudent(studentEmail);
  await Promise.all(
    all.filter(r => r.isActive && r.id !== routineId)
       .map(r => db.Routine.update(r.id, { is_active: false }))
  );
  return updateRoutine(routineId, { isActive: true });
}

// ──────────────────────────────────────────────────────────────────────────────
// RoutineExercise
// ──────────────────────────────────────────────────────────────────────────────

export async function listRoutineExercises(routineId) {
  if (!routineId) return [];
  const items = mapREs(await db.RoutineExercise.filter({ routine_id: routineId }));
  return items.sort((a, b) => (a.order || 0) - (b.order || 0));
}

/** Lista todas RoutineExercise (uso admin). */
export async function listAllRoutineExercises() {
  return mapREs(await db.RoutineExercise.list());
}

export async function addExerciseToRoutine(routineId, payload) {
  const created = await db.RoutineExercise.create(
    fromRoutineExercise({ ...payload, routineId })
  );
  return toRoutineExercise(created);
}

export async function updateRoutineExercise(id, patch) {
  const updated = await db.RoutineExercise.update(id, fromRoutineExercise(patch));
  return toRoutineExercise(updated);
}

export async function removeRoutineExercise(id) {
  return db.RoutineExercise.delete(id);
}

/** Duplica todas RoutineExercise de uma origem para um destino. */
export async function duplicateRoutineExercises(fromRoutineId, toRoutineId) {
  const items = await listRoutineExercises(fromRoutineId);
  if (!items.length) return;
  const payload = items.map(i => fromRoutineExercise({
    routineId: toRoutineId,
    exerciseId: i.exerciseId,
    order: i.order,
    sets: i.sets,
    targetReps: i.targetReps,
    targetWeightKg: i.targetWeightKg,
    targetDurationSeconds: i.targetDurationSeconds,
    restSeconds: i.restSeconds,
    bandAssistanceLevel: i.bandAssistanceLevel,
    unilateral: i.unilateral,
    notes: i.notes,
    rirTarget: i.rirTarget,
    rpeTarget: i.rpeTarget,
  }));
  return db.RoutineExercise.bulkCreate(payload);
}

// ──────────────────────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────────────────────

export function useStudentRoutines(email) {
  return useQuery({
    queryKey: ['routines', 'student', email],
    queryFn: () => listRoutinesByStudent(email),
    enabled: !!email,
  });
}

export function useAllRoutines() {
  return useQuery({
    queryKey: ['routines', 'all'],
    queryFn: listAllRoutines,
  });
}

export function useRoutine(id) {
  return useQuery({
    queryKey: ['routines', 'one', id],
    queryFn: () => getRoutine(id),
    enabled: !!id,
  });
}

export function useRoutineExercises(routineId) {
  return useQuery({
    queryKey: ['routines', 'exercises', routineId],
    queryFn: () => listRoutineExercises(routineId),
    enabled: !!routineId,
  });
}

export function useAllRoutineExercises() {
  return useQuery({
    queryKey: ['routines', 'all-exercises'],
    queryFn: listAllRoutineExercises,
  });
}

export function useDeleteRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteRoutine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useSetActiveRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routineId, studentEmail }) => setActiveRoutine(routineId, studentEmail),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
}