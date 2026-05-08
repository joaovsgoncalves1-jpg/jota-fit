/**
 * Mappers Base44 ↔ formato neutro.
 * Tudo que sai dos services passa por um `to*()`.
 * Tudo que entra (create/update) passa por um `from*()`.
 *
 * Isso isola o resto do app de detalhes do backend (snake_case, nomes específicos do Base44).
 */

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const pickDefined = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
};

// ──────────────────────────────────────────────────────────────────────────────
// StudentProfile
// ──────────────────────────────────────────────────────────────────────────────

export const toStudentProfile = (r) => r && ({
  id: r.id,
  email: r.email,
  name: r.name,
  avatarUrl: r.avatar_url,
  xpTotal: r.xp_total || 0,
  currentStreak: r.current_streak || 0,
  maxStreak: r.max_streak || 0,
  lastCheckinDate: r.last_checkin_date,
  active: r.active !== false,
  fitnessLevel: r.fitness_level,
  weightKg: r.weight_kg,
  targetWeightKg: r.target_weight_kg,
  currentBodyweightKg: r.current_bodyweight_kg,
  heightCm: r.height_cm,
  birthDate: r.birth_date,
  sex: r.sex,
  onboardingCompleted: !!r.onboarding_completed,
  planType: r.plan_type || 'free',
  mainGoal: r.main_goal,
  secondaryGoals: r.secondary_goals,
  trainingLocation: r.training_location,
  availableEquipment: r.available_equipment,
  injuriesOrLimitations: r.injuries_or_limitations,
  medicalNotes: r.medical_notes,
  experienceLevelMusculation: r.experience_level_musculation,
  experienceLevelCalisthenics: r.experience_level_calisthenics,
  experienceLevelCardio: r.experience_level_cardio,
  consultantStatus: r.consultant_status || 'ativo',
  consultationStartDate: r.consultation_start_date,
  consultationEndDate: r.consultation_end_date,
  assignedCoach: r.assigned_coach,
  whatsapp: r.whatsapp,
  emergencyNotes: r.emergency_notes,
  preferredTrainingDays: r.preferred_training_days,
  preferredTrainingTime: r.preferred_training_time,
  weeklyTrainingFrequencyGoal: r.weekly_training_frequency_goal,
  currentPhase: r.current_phase,
  phaseGoal: r.phase_goal,
  desiredSkills: r.desired_skills,
  onboardingAnswers: r.onboarding_answers,
  goals: r.goals,
  trainingDays: r.training_days,
  preferredTime: r.preferred_time,
  createdAt: r.created_date,
  updatedAt: r.updated_date,
});

export const fromStudentProfile = (p) => pickDefined({
  email: p.email,
  name: p.name,
  avatar_url: p.avatarUrl,
  xp_total: p.xpTotal,
  current_streak: p.currentStreak,
  max_streak: p.maxStreak,
  last_checkin_date: p.lastCheckinDate,
  active: p.active,
  fitness_level: p.fitnessLevel,
  weight_kg: p.weightKg,
  target_weight_kg: p.targetWeightKg,
  current_bodyweight_kg: p.currentBodyweightKg,
  height_cm: p.heightCm,
  birth_date: p.birthDate,
  sex: p.sex,
  onboarding_completed: p.onboardingCompleted,
  plan_type: p.planType,
  main_goal: p.mainGoal,
  secondary_goals: p.secondaryGoals,
  training_location: p.trainingLocation,
  available_equipment: p.availableEquipment,
  injuries_or_limitations: p.injuriesOrLimitations,
  medical_notes: p.medicalNotes,
  experience_level_musculation: p.experienceLevelMusculation,
  experience_level_calisthenics: p.experienceLevelCalisthenics,
  experience_level_cardio: p.experienceLevelCardio,
  consultant_status: p.consultantStatus,
  consultation_start_date: p.consultationStartDate,
  consultation_end_date: p.consultationEndDate,
  assigned_coach: p.assignedCoach,
  whatsapp: p.whatsapp,
  emergency_notes: p.emergencyNotes,
  preferred_training_days: p.preferredTrainingDays,
  preferred_training_time: p.preferredTrainingTime,
  weekly_training_frequency_goal: p.weeklyTrainingFrequencyGoal,
  current_phase: p.currentPhase,
  phase_goal: p.phaseGoal,
  desired_skills: p.desiredSkills,
  onboarding_answers: p.onboardingAnswers,
});

// ──────────────────────────────────────────────────────────────────────────────
// Exercise
// ──────────────────────────────────────────────────────────────────────────────

export const toExercise = (r) => r && ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  exerciseType: r.exercise_type,
  movementPattern: r.movement_pattern,
  primaryMuscle: r.primary_muscle,
  secondaryMuscles: r.secondary_muscles || [],
  muscleGroups: r.muscle_groups || [],
  equipment: r.equipment || r.equipment_needed || [],
  location: r.location || [],
  difficulty: r.difficulty,
  trackingType: r.tracking_type || 'weight_reps',
  description: r.description,
  instructions: r.instructions,
  tips: r.tips,
  commonMistakes: r.common_mistakes,
  setsRecommended: r.sets_recommended,
  restSeconds: r.rest_seconds,
  usesBand: !!r.uses_band,
  bandUsageType: r.band_usage_type,
  bandAssistanceLevel: r.band_assistance_level,
  bandAnchorPoint: r.band_anchor_point,
  bandPurpose: r.band_purpose,
  unilateral: !!r.unilateral,
  isJotaOriginal: !!r.is_jota_original,
  verifiedByJota: !!r.verified_by_jota,
  gifUrl: r.gif_url,
  videoUrl: r.video_url,
  imageUrl: r.image_url,
  thumbnailUrl: r.thumbnail_url,
  createdAt: r.created_date,
});

// ──────────────────────────────────────────────────────────────────────────────
// Routine
// ──────────────────────────────────────────────────────────────────────────────

export const toRoutine = (r) => {
  if (!r) return r;
  // created_by no schema deveria ser 'student'|'jota', mas registros legados
  // podem ter email do criador. Normalizamos via getCreatorRole.
  const raw = r.created_by;
  let role = 'student';
  if (raw === 'jota' || raw === 'student') {
    role = raw;
  } else if (typeof raw === 'string' && raw) {
    const v = raw.toLowerCase();
    if (v.includes('jota') || v.includes('admin') || v.includes('consult') || v.includes('coach')) {
      role = 'jota';
    }
  }
  return {
    id: r.id,
    name: r.name,
    studentEmail: r.student_email,
    description: r.description,
    daysOfWeek: r.days_of_week || [],
    isActive: !!r.is_active,
    createdByRole: role,
    createdByEmail: typeof raw === 'string' && raw.includes('@') ? raw : null,
    consultantNote: r.consultant_note,
    createdAt: r.created_date,
    updatedAt: r.updated_date,
  };
};

export const fromRoutine = (r) => pickDefined({
  name: r.name,
  student_email: r.studentEmail,
  description: r.description,
  days_of_week: r.daysOfWeek,
  is_active: r.isActive,
  created_by: r.createdByRole,
  consultant_note: r.consultantNote,
});

// ──────────────────────────────────────────────────────────────────────────────
// RoutineExercise
// ──────────────────────────────────────────────────────────────────────────────

export const toRoutineExercise = (r) => r && ({
  id: r.id,
  routineId: r.routine_id,
  exerciseId: r.exercise_id,
  order: r.order || 0,
  sets: r.sets,
  targetReps: r.target_reps || r.reps,
  targetWeightKg: r.target_weight_kg,
  targetDurationSeconds: r.target_duration_seconds,
  restSeconds: r.rest_seconds,
  bandAssistanceLevel: r.band_assistance_level,
  unilateral: !!r.unilateral,
  notes: r.notes,
  rirTarget: r.rir_target,
  rpeTarget: r.rpe_target,
});

export const fromRoutineExercise = (re) => pickDefined({
  routine_id: re.routineId,
  exercise_id: re.exerciseId,
  order: re.order,
  sets: re.sets,
  target_reps: re.targetReps,
  target_weight_kg: re.targetWeightKg,
  target_duration_seconds: re.targetDurationSeconds,
  rest_seconds: re.restSeconds,
  band_assistance_level: re.bandAssistanceLevel,
  unilateral: re.unilateral,
  notes: re.notes,
  rir_target: re.rirTarget,
  rpe_target: re.rpeTarget,
});

// ──────────────────────────────────────────────────────────────────────────────
// WorkoutSession
// ──────────────────────────────────────────────────────────────────────────────

export const toWorkoutSession = (r) => r && ({
  id: r.id,
  studentEmail: r.student_email,
  routineId: r.routine_id,
  routineName: r.routine_name,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
  durationMinutes: r.duration_minutes,
  status: r.status || 'in_progress',
  notes: r.notes,
  totalVolumeKg: r.total_volume_kg,
  // Pode vir null em sessões antigas — quem consome resolve fallback via SetLogs
  exercisesCompleted: r.exercises_completed ?? null,
  setsCompleted: r.sets_completed ?? null,
  xpEarned: r.xp_earned || 0,
  prsCount: r.prs_count || 0,
  prsDetail: r.prs_detail,
  createdAt: r.created_date,
});

export const fromWorkoutSession = (s) => pickDefined({
  student_email: s.studentEmail,
  routine_id: s.routineId,
  routine_name: s.routineName,
  started_at: s.startedAt,
  finished_at: s.finishedAt,
  duration_minutes: s.durationMinutes,
  status: s.status,
  notes: s.notes,
  total_volume_kg: s.totalVolumeKg,
  exercises_completed: s.exercisesCompleted,
  sets_completed: s.setsCompleted,
  xp_earned: s.xpEarned,
  prs_count: s.prsCount,
  prs_detail: s.prsDetail,
});

// ──────────────────────────────────────────────────────────────────────────────
// SetLog
// ──────────────────────────────────────────────────────────────────────────────

export const toSetLog = (r) => r && ({
  id: r.id,
  sessionId: r.session_id,
  studentEmail: r.student_email,
  exerciseId: r.exercise_id,
  exerciseName: r.exercise_name,
  setNumber: r.set_number,
  weightKg: r.weight_kg,
  reps: r.reps,
  durationSeconds: r.duration_seconds,
  bodyweightKg: r.bodyweight_kg,
  addedWeightKg: r.added_weight_kg,
  bandAssistanceLevel: r.band_assistance_level,
  bandColor: r.band_color,
  assistanceType: r.assistance_type,
  side: r.side || 'both',
  rir: r.rir,
  rpe: r.rpe,
  restSeconds: r.rest_seconds,
  isPr: !!r.is_pr,
  prType: r.pr_type,
  notes: r.notes,
  completed: r.completed !== false,
  createdAt: r.created_date,
});

export const fromSetLog = (s) => pickDefined({
  session_id: s.sessionId,
  student_email: s.studentEmail,
  exercise_id: s.exerciseId,
  exercise_name: s.exerciseName,
  set_number: s.setNumber,
  weight_kg: s.weightKg,
  reps: s.reps,
  duration_seconds: s.durationSeconds,
  bodyweight_kg: s.bodyweightKg,
  added_weight_kg: s.addedWeightKg,
  band_assistance_level: s.bandAssistanceLevel,
  band_color: s.bandColor,
  assistance_type: s.assistanceType,
  side: s.side,
  rir: s.rir,
  rpe: s.rpe,
  rest_seconds: s.restSeconds,
  is_pr: s.isPr,
  pr_type: s.prType,
  notes: s.notes,
  completed: s.completed,
});

// ──────────────────────────────────────────────────────────────────────────────
// ExercisePersonalRecord
// ──────────────────────────────────────────────────────────────────────────────

export const toPR = (r) => r && ({
  id: r.id,
  studentEmail: r.student_email,
  exerciseId: r.exercise_id,
  exerciseName: r.exercise_name,
  recordType: r.record_type,
  value: r.value,
  reps: r.reps,
  weightKg: r.weight_kg,
  durationSeconds: r.duration_seconds,
  bandLevel: r.band_level,
  bandColor: r.band_color,
  context: r.context,
  achievedAt: r.achieved_at,
  sessionId: r.session_id,
});

export const fromPR = (p) => pickDefined({
  student_email: p.studentEmail,
  exercise_id: p.exerciseId,
  exercise_name: p.exerciseName,
  record_type: p.recordType,
  value: p.value,
  reps: p.reps,
  weight_kg: p.weightKg,
  duration_seconds: p.durationSeconds,
  band_level: p.bandLevel,
  band_color: p.bandColor,
  context: p.context,
  achieved_at: p.achievedAt,
  session_id: p.sessionId,
});

// ──────────────────────────────────────────────────────────────────────────────
// Misc
// ──────────────────────────────────────────────────────────────────────────────

export const toBodyMeasurement = (r) => r && ({
  id: r.id,
  studentEmail: r.student_email,
  date: r.date,
  weightKg: r.weight_kg,
  bodyFatPct: r.body_fat_pct,
  armCircumference: r.arm_circumference,
  legCircumference: r.leg_circumference,
  chestCircumference: r.chest_circumference,
  waistCircumference: r.waist_circumference,
  notes: r.notes,
});

export const toCheckin = (r) => r && ({
  id: r.id,
  studentEmail: r.student_email,
  date: r.date,
  xpEarned: r.xp_earned,
});

export const toConsultantNote = (r) => r && ({
  id: r.id,
  studentEmail: r.student_email,
  createdBy: r.created_by,
  note: r.note,
  noteType: r.note_type || 'geral',
  priority: r.priority || 'media',
  relatedRoutineId: r.related_routine_id,
  relatedSessionId: r.related_session_id,
  relatedExerciseId: r.related_exercise_id,
  relatedBodyMeasurementId: r.related_body_measurement_id,
  visibleToStudent: r.visible_to_student !== false,
  createdAt: r.created_at || r.created_date,
});

export const toAppUser = (u) => u && ({
  id: u.id,
  email: u.email,
  fullName: u.full_name,
  role: u.role,
});

// Helpers de array
export const mapArray = (mapper) => (arr) => (arr || []).map(mapper).filter(Boolean);