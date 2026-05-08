/**
 * exerciseService — biblioteca de exercícios + substituições + progressões.
 *
 * Exemplo:
 *   const list = await exerciseService.searchExercises({ muscle: 'Peitoral' });
 *   const ex = await exerciseService.getExercise(id);
 */
import { useQuery } from '@tanstack/react-query';
import { db } from './_base/baseClient';
import { toExercise, mapArray } from './_base/mappers';

const mapExercises = mapArray(toExercise);

/**
 * Busca exercícios com filtros leves no cliente.
 * @param {Object} [filters]
 * @param {string} [filters.search]
 * @param {string} [filters.muscle]
 * @param {string} [filters.equipment]
 * @param {string} [filters.exerciseType]
 * @param {string} [filters.movementPattern]
 * @param {string} [filters.difficulty]
 * @param {string} [filters.location]
 * @param {string} [filters.trackingType]
 * @param {boolean} [filters.usesBand]
 * @param {boolean} [filters.verifiedByJota]
 * @returns {Promise<import('./types').Exercise[]>}
 */
export async function searchExercises(filters = {}) {
  const all = mapExercises(await db.Exercise.list('-created_date', 500));
  return applyClientFilters(all, filters);
}

/** Lista todos exercícios (cache global). */
export async function listAllExercises() {
  return mapExercises(await db.Exercise.list('-created_date', 500));
}

/** @returns {Promise<import('./types').Exercise|null>} */
export async function getExercise(id) {
  if (!id) return null;
  const list = await db.Exercise.filter({ id });
  return toExercise(list?.[0] || null);
}

// ──────────────────────────────────────────────────────────────────────────────
// Filtros no cliente — preserva o comportamento atual da Biblioteca.
// ──────────────────────────────────────────────────────────────────────────────
export function applyClientFilters(list, f = {}) {
  let out = list || [];

  if (f.search) {
    const q = f.search.toLowerCase();
    out = out.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.primaryMuscle?.toLowerCase().includes(q) ||
      (e.muscleGroups || []).some(m => m.toLowerCase().includes(q)) ||
      (e.secondaryMuscles || []).some(m => m.toLowerCase().includes(q))
    );
  }
  if (f.movementPattern) out = out.filter(e => e.movementPattern === f.movementPattern);
  if (f.muscle) out = out.filter(e =>
    e.primaryMuscle === f.muscle ||
    (e.muscleGroups || []).includes(f.muscle) ||
    (e.secondaryMuscles || []).includes(f.muscle)
  );
  if (f.equipment) out = out.filter(e => (e.equipment || []).includes(f.equipment));
  if (f.exerciseType) out = out.filter(e => e.exerciseType === f.exerciseType);
  if (f.difficulty) out = out.filter(e => e.difficulty === f.difficulty);
  if (f.location) out = out.filter(e => (e.location || []).includes(f.location));
  if (f.trackingType) out = out.filter(e => e.trackingType === f.trackingType);
  if (f.usesBand) out = out.filter(e => e.usesBand);
  if (f.verifiedByJota) out = out.filter(e => e.verifiedByJota || e.isJotaOriginal);
  return out;
}

// ──────────────────────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────────────────────

export function useExercises() {
  return useQuery({
    queryKey: ['exercises', 'all'],
    queryFn: listAllExercises,
    staleTime: 5 * 60 * 1000,
  });
}

export function useExercise(id) {
  return useQuery({
    queryKey: ['exercises', 'one', id],
    queryFn: () => getExercise(id),
    enabled: !!id,
  });
}