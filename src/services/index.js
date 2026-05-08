/**
 * Barrel exports — facilita imports nas telas.
 *
 * import { studentService, exerciseService, useMyProfile } from '@/services';
 */
export * as authService from './authService';
export * as studentService from './studentService';
export * as exerciseService from './exerciseService';
export * as routineService from './routineService';
export * as workoutService from './workoutService';
export * as progressService from './progressService';
export * as recommendationService from './recommendationService';
export * as consultantService from './consultantService';

// Re-export hooks individualmente também (mais ergonômico)
export { useCurrentUser } from './authService';
export {
  useMyProfile, useAllProfiles,
  useUpdateConsultantStatus, useInviteStudent,
} from './studentService';
export { useExercises, useExercise } from './exerciseService';
export {
  useStudentRoutines, useAllRoutines, useRoutine,
  useRoutineExercises, useAllRoutineExercises,
  useDeleteRoutine, useSetActiveRoutine,
} from './routineService';
export {
  useStudentSessions, useAllSessions, useStudentSets,
  useStudentPRs, useAllPRs, useStartSession,
} from './workoutService';
export {
  useTodayCheckin, useStudentMeasurements, useLevelConfigs, useRegisterCheckin,
} from './progressService';
export { useConsultantNotes, useCreateNote } from './consultantService';