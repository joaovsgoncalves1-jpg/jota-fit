/**
 * PR Detection Logic
 * Compares a new set against historical SetLog data for the same exercise.
 * Returns { isPR: boolean, prType: string } or null.
 *
 * Model: Routine → RoutineExercise → WorkoutSession → SetLog → ExercisePersonalRecord
 */

export function detectPR(newSet, historicalSets, trackingType) {
  if (!historicalSets || historicalSets.length === 0) {
    // First ever set for this exercise = instant PR
    return buildPR(newSet, trackingType, true);
  }

  switch (trackingType) {
    case 'weight_reps': {
      const maxWeight = Math.max(...historicalSets.map(s => s.weight_kg || 0));
      if ((newSet.weight_kg || 0) > maxWeight) {
        return { isPR: true, prType: 'max_weight', value: newSet.weight_kg };
      }
      // Same weight but more reps
      const sameWeightSets = historicalSets.filter(s => s.weight_kg === newSet.weight_kg);
      if (sameWeightSets.length > 0) {
        const maxRepsAtWeight = Math.max(...sameWeightSets.map(s => s.reps || 0));
        if ((newSet.reps || 0) > maxRepsAtWeight) {
          return { isPR: true, prType: 'max_reps', value: newSet.reps };
        }
      }
      break;
    }
    case 'bodyweight_reps': {
      const maxReps = Math.max(...historicalSets.map(s => s.reps || 0));
      if ((newSet.reps || 0) > maxReps) {
        return { isPR: true, prType: 'max_reps', value: newSet.reps };
      }
      break;
    }
    case 'assisted_bodyweight': {
      const bandOrder = ['muito_forte', 'forte', 'medio', 'leve', ''];
      const newBandIdx = bandOrder.indexOf(newSet.band_assistance_level || '');
      const minHistBandIdx = Math.min(...historicalSets.map(s => {
        const idx = bandOrder.indexOf(s.band_assistance_level || '');
        return idx === -1 ? 99 : idx;
      }));
      // Higher index = weaker band = improvement
      if (newBandIdx > minHistBandIdx) {
        return { isPR: true, prType: newBandIdx === bandOrder.length - 1 ? 'first_without_band' : 'band_reduction', value: newBandIdx };
      }
      // Same band, more reps
      const sameBandSets = historicalSets.filter(s => (s.band_assistance_level || '') === (newSet.band_assistance_level || ''));
      if (sameBandSets.length > 0) {
        const maxReps = Math.max(...sameBandSets.map(s => s.reps || 0));
        if ((newSet.reps || 0) > maxReps) {
          return { isPR: true, prType: 'max_reps', value: newSet.reps };
        }
      }
      break;
    }
    case 'hold_time': {
      const maxDur = Math.max(...historicalSets.map(s => s.duration_seconds || 0));
      if ((newSet.duration_seconds || 0) > maxDur) {
        return { isPR: true, prType: 'max_duration', value: newSet.duration_seconds };
      }
      break;
    }
    case 'unilateral': {
      const maxWeight = Math.max(...historicalSets.map(s => s.weight_kg || 0));
      if ((newSet.weight_kg || 0) > maxWeight) {
        return { isPR: true, prType: 'max_weight', value: newSet.weight_kg };
      }
      break;
    }
    default:
      break;
  }

  return null;
}

function buildPR(set, trackingType, isFirst) {
  if (isFirst) {
    if (['weight_reps', 'unilateral'].includes(trackingType) && set.weight_kg > 0) {
      return { isPR: true, prType: 'max_weight', value: set.weight_kg };
    }
    if (['bodyweight_reps', 'assisted_bodyweight'].includes(trackingType) && set.reps > 0) {
      return { isPR: true, prType: 'max_reps', value: set.reps };
    }
    if (trackingType === 'hold_time' && set.duration_seconds > 0) {
      return { isPR: true, prType: 'max_duration', value: set.duration_seconds };
    }
  }
  return null;
}

export function buildPRRecord({ studentEmail, exerciseId, exerciseName, set, prResult, sessionId, trackingType }) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    student_email: studentEmail,
    exercise_id: exerciseId,
    exercise_name: exerciseName,
    record_type: prResult.prType,
    value: prResult.value,
    weight_kg: set.weight_kg,
    reps: set.reps,
    duration_seconds: set.duration_seconds,
    band_level: set.band_assistance_level,
    achieved_at: today,
    session_id: sessionId,
  };
}