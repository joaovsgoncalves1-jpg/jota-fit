/**
 * Tipos do domínio Jota Fit em JSDoc.
 * Estes tipos representam o **modelo neutro** que os services expõem para a UI.
 * Não dependem do Base44 — quando migrarmos para outro backend, mantemos os mesmos tipos.
 *
 * Convenções:
 * - camelCase em vez de snake_case (ex: `createdAt` em vez de `created_date`)
 * - datas como ISO strings (`'2025-01-15T10:00:00Z'`) ou date-only (`'2025-01-15'`)
 * - ids como string
 */

// ──────────────────────────────────────────────────────────────────────────────
// User / Student
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} AppUser
 * @property {string} id
 * @property {string} email
 * @property {string} fullName
 * @property {'admin'|'user'|'student'} role
 */

/**
 * @typedef {Object} StudentProfile
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} [avatarUrl]
 * @property {number} xpTotal
 * @property {number} currentStreak
 * @property {number} maxStreak
 * @property {string} [lastCheckinDate]
 * @property {boolean} active
 * @property {'beginner'|'intermediate'|'advanced'} [fitnessLevel]
 * @property {number} [weightKg]
 * @property {number} [targetWeightKg]
 * @property {number} [currentBodyweightKg]
 * @property {number} [heightCm]
 * @property {string} [birthDate]
 * @property {'masculino'|'feminino'|'outro'} [sex]
 * @property {boolean} onboardingCompleted
 * @property {'free'|'pro'|'premium'} planType
 * @property {string} [mainGoal]
 * @property {string[]} [secondaryGoals]
 * @property {'academia'|'casa'|'parque'|'misto'} [trainingLocation]
 * @property {string[]} [availableEquipment]
 * @property {string} [injuriesOrLimitations]
 * @property {string} [medicalNotes]
 * @property {string} [experienceLevelMusculation]
 * @property {string} [experienceLevelCalisthenics]
 * @property {string} [experienceLevelCardio]
 * @property {'lead'|'ativo'|'pausado'|'encerrado'} consultantStatus
 * @property {string} [consultationStartDate]
 * @property {string} [consultationEndDate]
 * @property {string} [assignedCoach]
 * @property {string} [whatsapp]
 * @property {string} [emergencyNotes]
 * @property {string[]} [preferredTrainingDays]
 * @property {string} [preferredTrainingTime]
 * @property {number} [weeklyTrainingFrequencyGoal]
 * @property {string} [currentPhase]
 * @property {string} [phaseGoal]
 * @property {string[]} [desiredSkills]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

// ──────────────────────────────────────────────────────────────────────────────
// Exercise
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Exercise
 * @property {string} id
 * @property {string} name
 * @property {string} [slug]
 * @property {string} [exerciseType] - musculacao | calistenia | mobilidade | cardio | skill | etc.
 * @property {string} [movementPattern]
 * @property {string} [primaryMuscle]
 * @property {string[]} [secondaryMuscles]
 * @property {string[]} [muscleGroups]
 * @property {string[]} [equipment]
 * @property {string[]} [location]
 * @property {'beginner'|'intermediate'|'advanced'} [difficulty]
 * @property {string} [trackingType]
 * @property {string} [description]
 * @property {string} [instructions]
 * @property {string} [tips]
 * @property {string} [commonMistakes]
 * @property {string} [setsRecommended]
 * @property {number} [restSeconds]
 * @property {boolean} usesBand
 * @property {string} [bandUsageType]
 * @property {string} [bandAssistanceLevel]
 * @property {string} [bandAnchorPoint]
 * @property {string} [bandPurpose]
 * @property {boolean} unilateral
 * @property {boolean} isJotaOriginal
 * @property {boolean} verifiedByJota
 * @property {string} [gifUrl]
 * @property {string} [videoUrl]
 * @property {string} [imageUrl]
 * @property {string} [thumbnailUrl]
 * @property {string} createdAt
 */

// ──────────────────────────────────────────────────────────────────────────────
// Routine + RoutineExercise
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Routine
 * @property {string} id
 * @property {string} name
 * @property {string} studentEmail
 * @property {string} [description]
 * @property {string[]} daysOfWeek
 * @property {boolean} isActive
 * @property {'student'|'jota'} createdByRole
 * @property {string} [consultantNote]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} RoutineExercise
 * @property {string} id
 * @property {string} routineId
 * @property {string} exerciseId
 * @property {number} order
 * @property {number} [sets]
 * @property {string} [targetReps]
 * @property {number} [targetWeightKg]
 * @property {number} [targetDurationSeconds]
 * @property {number} [restSeconds]
 * @property {string} [bandAssistanceLevel]
 * @property {boolean} unilateral
 * @property {string} [notes]
 * @property {number} [rirTarget]
 * @property {number} [rpeTarget]
 */

// ──────────────────────────────────────────────────────────────────────────────
// Workout (sessions + sets)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} WorkoutSession
 * @property {string} id
 * @property {string} studentEmail
 * @property {string} [routineId]
 * @property {string} [routineName]
 * @property {string} [startedAt]
 * @property {string} [finishedAt]
 * @property {number} [durationMinutes]
 * @property {'in_progress'|'completed'|'cancelled'} status
 * @property {string} [notes]
 * @property {number} [totalVolumeKg]
 * @property {number} [exercisesCompleted]
 * @property {number} [setsCompleted]
 * @property {number} [xpEarned]
 * @property {number} prsCount
 * @property {Array<Object>} [prsDetail]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} SetLog
 * @property {string} id
 * @property {string} sessionId
 * @property {string} studentEmail
 * @property {string} exerciseId
 * @property {string} [exerciseName]
 * @property {number} setNumber
 * @property {number} [weightKg]
 * @property {number} [reps]
 * @property {number} [durationSeconds]
 * @property {number} [bodyweightKg]
 * @property {number} [addedWeightKg]
 * @property {string} [bandAssistanceLevel]
 * @property {string} [bandColor]
 * @property {string} [assistanceType]
 * @property {'both'|'right'|'left'} side
 * @property {number} [rir]
 * @property {number} [rpe]
 * @property {number} [restSeconds]
 * @property {boolean} isPr
 * @property {string} [prType]
 * @property {string} [notes]
 * @property {boolean} completed
 * @property {string} createdAt
 */

/**
 * @typedef {Object} ExercisePersonalRecord
 * @property {string} id
 * @property {string} studentEmail
 * @property {string} exerciseId
 * @property {string} [exerciseName]
 * @property {string} recordType
 * @property {number} [value]
 * @property {number} [reps]
 * @property {number} [weightKg]
 * @property {number} [durationSeconds]
 * @property {string} [bandLevel]
 * @property {string} [bandColor]
 * @property {string} [context]
 * @property {string} achievedAt
 * @property {string} [sessionId]
 */

// ──────────────────────────────────────────────────────────────────────────────
// Body / Checkin
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} BodyMeasurement
 * @property {string} id
 * @property {string} studentEmail
 * @property {string} date
 * @property {number} [weightKg]
 * @property {number} [bodyFatPct]
 * @property {number} [armCircumference]
 * @property {number} [legCircumference]
 * @property {number} [chestCircumference]
 * @property {number} [waistCircumference]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Checkin
 * @property {string} id
 * @property {string} studentEmail
 * @property {string} date
 * @property {number} [xpEarned]
 */

// ──────────────────────────────────────────────────────────────────────────────
// Consultant / Recommendation
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ConsultantNote
 * @property {string} id
 * @property {string} studentEmail
 * @property {string} createdBy
 * @property {string} note
 * @property {string} noteType
 * @property {'baixa'|'media'|'alta'} priority
 * @property {string} [relatedRoutineId]
 * @property {string} [relatedSessionId]
 * @property {string} [relatedExerciseId]
 * @property {string} [relatedBodyMeasurementId]
 * @property {boolean} visibleToStudent
 * @property {string} createdAt
 */

/**
 * @typedef {Object} TrainingRecommendation
 * @property {'destructive'|'gold'|'success'|'info'} tone
 * @property {string} text
 * @property {string} [actionLabel]
 * @property {string} [actionRoute]
 */

export {};