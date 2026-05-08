/**
 * PR Detection Logic
 * Compara uma nova série com o histórico de SetLogs do mesmo exercício.
 * Retorna { isPR: boolean, prType: string, value } ou null.
 *
 * Tipos de PR suportados:
 * - max_weight, max_reps, max_volume, max_duration
 * - band_reduction (trocou pra elástico mais leve)
 * - first_without_band (primeira sem elástico)
 * - max_reps_with_band (mais reps no MESMO nível de elástico)
 * - max_duration_with_band (mais tempo no MESMO nível, holds com elástico)
 * - first_rep (primeira execução do exercício)
 */
import { BAND_ORDER, bandIndex } from './bands';

export function detectPR(newSet, historicalSets, trackingType) {
  if (!historicalSets || historicalSets.length === 0) {
    return buildPR(newSet, trackingType, true);
  }

  switch (trackingType) {
    case 'weight_reps': {
      const maxWeight = Math.max(...historicalSets.map(s => s.weight_kg || 0));
      if ((newSet.weight_kg || 0) > maxWeight) {
        return { isPR: true, prType: 'max_weight', value: newSet.weight_kg };
      }
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
      const newIdx = bandIndex(newSet.band_assistance_level);
      const minHistIdx = Math.min(
        ...historicalSets.map(s => bandIndex(s.band_assistance_level))
      );

      // 1) Sem elástico pela primeira vez
      if (newIdx === BAND_ORDER.length && minHistIdx < BAND_ORDER.length && (newSet.reps || 0) > 0) {
        return { isPR: true, prType: 'first_without_band', value: newSet.reps };
      }

      // 2) Trocou pra elástico mais leve
      if (newIdx > minHistIdx && newIdx < BAND_ORDER.length && (newSet.reps || 0) > 0) {
        return { isPR: true, prType: 'band_reduction', value: newIdx };
      }

      // 3) Mesmo elástico, mais reps
      const sameBandSets = historicalSets.filter(
        s => (s.band_assistance_level || '') === (newSet.band_assistance_level || '')
      );
      if (sameBandSets.length > 0) {
        const maxReps = Math.max(...sameBandSets.map(s => s.reps || 0));
        if ((newSet.reps || 0) > maxReps) {
          // Sem elástico = max_reps; com elástico = max_reps_with_band
          const prType = newSet.band_assistance_level ? 'max_reps_with_band' : 'max_reps';
          return { isPR: true, prType, value: newSet.reps };
        }
      }
      break;
    }
    case 'hold_time': {
      const newIdx = bandIndex(newSet.band_assistance_level);
      const minHistIdx = Math.min(
        ...historicalSets.map(s => bandIndex(s.band_assistance_level))
      );

      // 1) Hold sem elástico pela primeira vez
      if (newIdx === BAND_ORDER.length && minHistIdx < BAND_ORDER.length && (newSet.duration_seconds || 0) > 0) {
        return { isPR: true, prType: 'first_without_band', value: newSet.duration_seconds };
      }

      // 2) Trocou pra elástico mais leve em hold
      if (newIdx > minHistIdx && newIdx < BAND_ORDER.length && (newSet.duration_seconds || 0) > 0) {
        return { isPR: true, prType: 'band_reduction', value: newIdx };
      }

      // 3) Mesmo nível (ou sem elástico), mais tempo
      const sameBandSets = historicalSets.filter(
        s => (s.band_assistance_level || '') === (newSet.band_assistance_level || '')
      );
      const maxDur = sameBandSets.length
        ? Math.max(...sameBandSets.map(s => s.duration_seconds || 0))
        : Math.max(...historicalSets.map(s => s.duration_seconds || 0));
      if ((newSet.duration_seconds || 0) > maxDur) {
        const prType = newSet.band_assistance_level ? 'max_duration_with_band' : 'max_duration';
        return { isPR: true, prType, value: newSet.duration_seconds };
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
  if (!isFirst) return null;
  if (['weight_reps', 'unilateral'].includes(trackingType) && set.weight_kg > 0) {
    return { isPR: true, prType: 'max_weight', value: set.weight_kg };
  }
  if (['bodyweight_reps', 'assisted_bodyweight'].includes(trackingType) && set.reps > 0) {
    const prType = set.band_assistance_level ? 'max_reps_with_band' : 'max_reps';
    return { isPR: true, prType, value: set.reps };
  }
  if (trackingType === 'hold_time' && set.duration_seconds > 0) {
    const prType = set.band_assistance_level ? 'max_duration_with_band' : 'max_duration';
    return { isPR: true, prType, value: set.duration_seconds };
  }
  return null;
}

export function buildPRRecord({ studentEmail, exerciseId, exerciseName, set, prResult, sessionId }) {
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
    band_color: set.band_color,
    achieved_at: today,
    session_id: sessionId,
  };
}