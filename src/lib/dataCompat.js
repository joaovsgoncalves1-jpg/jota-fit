/**
 * dataCompat — helpers de compatibilidade pra dados inconsistentes
 * (legados ou seeds antigos) que escapam do mapper neutro.
 *
 * Use quando:
 *  - Um registro veio de uma versão antiga do schema
 *  - O backend pode retornar campo em snake_case OU camelCase
 *  - Um campo opcional pode estar nulo e a UI precisa de fallback
 */

/**
 * Retorna o "papel" do criador de uma rotina.
 * Schema oficial é 'student' | 'jota', mas algumas rotinas legadas
 * têm o email do consultor em created_by, ou foram criadas por
 * um admin (cujo email costuma estar no created_by_id).
 *
 * Heurísticas:
 *  - 'jota' / 'student' literais → respeita
 *  - email com 'jota' / 'admin' / 'consult' → 'jota'
 *  - se a rotina veio com flag explícita createdByRole === 'jota' → 'jota'
 *  - default → 'student'
 */
export function getCreatorRole(routine) {
  if (!routine) return 'student';
  const raw = routine.createdByRole || routine.created_by || routine.createdBy;
  if (!raw) return 'student';
  if (raw === 'jota' || raw === 'student') return raw;
  // raw provavelmente é um email
  const v = String(raw).toLowerCase();
  if (v.includes('jota') || v.includes('admin') || v.includes('consult') || v.includes('coach')) {
    return 'jota';
  }
  return 'student';
}

/** Compat: aceita objeto neutro OU snake_case (registros legados / seeds). */
export const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
};

/**
 * Normaliza um SetLog para o formato neutro,
 * mesmo que venha em snake_case (legado) ou já neutro.
 */
export const normalizeSetLog = (s) => s && ({
  id: s.id,
  sessionId: pick(s, 'sessionId', 'session_id'),
  studentEmail: pick(s, 'studentEmail', 'student_email'),
  exerciseId: pick(s, 'exerciseId', 'exercise_id'),
  exerciseName: pick(s, 'exerciseName', 'exercise_name'),
  setNumber: pick(s, 'setNumber', 'set_number'),
  weightKg: pick(s, 'weightKg', 'weight_kg'),
  reps: s.reps,
  durationSeconds: pick(s, 'durationSeconds', 'duration_seconds'),
  bodyweightKg: pick(s, 'bodyweightKg', 'bodyweight_kg'),
  addedWeightKg: pick(s, 'addedWeightKg', 'added_weight_kg'),
  bandAssistanceLevel: pick(s, 'bandAssistanceLevel', 'band_assistance_level'),
  bandColor: pick(s, 'bandColor', 'band_color'),
  rir: s.rir,
  rpe: s.rpe,
  restSeconds: pick(s, 'restSeconds', 'rest_seconds'),
  isPr: pick(s, 'isPr', 'is_pr') || false,
  prType: pick(s, 'prType', 'pr_type'),
  notes: s.notes,
  createdAt: pick(s, 'createdAt', 'created_date'),
});

/**
 * Calcula `exercisesCompleted` a partir dos SetLogs (sets distintos).
 * Usado quando `WorkoutSession.exercisesCompleted` veio nulo.
 */
export function countDistinctExercises(sets) {
  if (!sets?.length) return 0;
  const ids = new Set();
  for (const s of sets) {
    const id = pick(s, 'exerciseId', 'exercise_id');
    if (id) ids.add(id);
  }
  return ids.size;
}

/**
 * Resolve `exercise` a partir de um RoutineExercise + lista de exercises.
 * Retorna { exercise, found }. Se não achar, devolve um stub mínimo
 * para que a UI consiga renderizar sem quebrar.
 */
export function resolveExercise(routineExercise, exercises) {
  const id = pick(routineExercise || {}, 'exerciseId', 'exercise_id');
  const exercise = (exercises || []).find(e => e.id === id);
  if (exercise) return { exercise, found: true };
  return {
    exercise: {
      id,
      name: 'Exercício não encontrado',
      trackingType: 'weight_reps',
      _missing: true,
    },
    found: false,
  };
}