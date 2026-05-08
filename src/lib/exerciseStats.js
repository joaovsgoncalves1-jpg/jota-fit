/**
 * Estatísticas e helpers para histórico de exercícios e PRs.
 * Pure functions — sem side effects.
 */

const BAND_LABEL = { leve: 'Leve', medio: 'Médio', forte: 'Forte', muito_forte: 'Muito forte' };
const BAND_ORDER = ['muito_forte', 'forte', 'medio', 'leve']; // do mais assistido pro mais leve

/**
 * Agrupa SetLogs por sessão.
 * Retorna array ordenado: [{sessionId, date, sets: [...]}], mais recente primeiro.
 */
export function groupSetsBySession(sets) {
  if (!sets?.length) return [];
  const map = {};
  sets.forEach(s => {
    const key = s.session_id || `nosession-${s.created_date?.slice(0, 10)}`;
    if (!map[key]) {
      map[key] = { sessionId: s.session_id, date: s.created_date?.slice(0, 10), sets: [] };
    }
    map[key].sets.push(s);
  });
  return Object.values(map)
    .map(g => ({ ...g, sets: g.sets.sort((a, b) => (a.set_number || 0) - (b.set_number || 0)) }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

/**
 * Calcula stats agregadas a partir de SetLogs e PRs do exercício.
 */
export function computeExerciseStats(sets, prs) {
  const safe = sets || [];

  const maxWeight = safe.reduce((max, s) => Math.max(max, s.weight_kg || 0), 0);
  const maxReps = safe.reduce((max, s) => Math.max(max, s.reps || 0), 0);
  const maxDuration = safe.reduce((max, s) => Math.max(max, s.duration_seconds || 0), 0);

  // Best volume by SESSION (sum of weight*reps in each session)
  const bySession = groupSetsBySession(safe);
  let bestVolume = 0;
  let bestVolumeDate = null;
  bySession.forEach(g => {
    const vol = g.sets.reduce((a, s) => a + ((s.weight_kg || 0) * (s.reps || 0)), 0);
    if (vol > bestVolume) {
      bestVolume = vol;
      bestVolumeDate = g.date;
    }
  });

  // Best weight set (with reps shown)
  const bestWeightSet = safe.reduce((best, s) => {
    if ((s.weight_kg || 0) > (best?.weight_kg || 0)) return s;
    return best;
  }, null);

  // Best band evolution: lowest assistance achieved + reps at that level
  const bandSets = safe.filter(s => s.band_assistance_level);
  let bestBand = null;
  let bestBandReps = 0;
  let firstWithoutBand = false;
  if (bandSets.length || safe.some(s => s.reps && !s.band_assistance_level && !s.weight_kg)) {
    // Find the lightest band ever used
    let minIdx = 99;
    bandSets.forEach(s => {
      const idx = BAND_ORDER.indexOf(s.band_assistance_level);
      if (idx >= 0 && idx > -1) {
        if (idx > minIdx || minIdx === 99) {
          // higher idx = lighter band
        }
      }
    });
    // Simpler: find the highest BAND_ORDER index that appears
    bandSets.forEach(s => {
      const idx = BAND_ORDER.indexOf(s.band_assistance_level);
      if (idx > -1 && (bestBand === null || idx > BAND_ORDER.indexOf(bestBand))) {
        bestBand = s.band_assistance_level;
      }
    });
    if (bestBand) {
      bestBandReps = Math.max(...bandSets
        .filter(s => s.band_assistance_level === bestBand)
        .map(s => s.reps || 0), 0);
    }
    // First without band: any rep set without band but with reps
    firstWithoutBand = (prs || []).some(p => p.record_type === 'first_without_band');
  }

  // Last PR date
  const sortedPRs = [...(prs || [])].sort((a, b) => (b.achieved_at || '').localeCompare(a.achieved_at || ''));
  const lastPR = sortedPRs[0] || null;

  // Last session
  const lastSession = bySession[0] || null;
  // Last 3 sessions
  const last3Sessions = bySession.slice(0, 3);

  return {
    totalSessions: bySession.length,
    totalSets: safe.length,
    maxWeight,
    maxReps,
    maxDuration,
    bestVolume,
    bestVolumeDate,
    bestWeightSet,
    bestBand,
    bestBandReps,
    firstWithoutBand,
    lastPR,
    lastPRDate: lastPR?.achieved_at || null,
    lastSession,
    last3Sessions,
  };
}

/**
 * Formata um conjunto de séries da sessão como string "26×8 | 26×7 | 24×6"
 */
export function formatSessionSets(sessionSets) {
  return (sessionSets || []).map(s => {
    if (s.weight_kg && s.reps) return `${s.weight_kg}×${s.reps}`;
    if (s.band_assistance_level && s.reps) return `${BAND_LABEL[s.band_assistance_level]} ${s.reps}r`;
    if (s.reps) return `${s.reps}r`;
    if (s.duration_seconds) return `${s.duration_seconds}s`;
    return '—';
  }).join(' | ');
}

/**
 * Gera mensagem motivacional para um PR.
 * Ex: "Novo PR no Supino Inclinado: 26kg × 8 reps."
 */
export function formatPRMessage(pr, exerciseName) {
  const name = exerciseName || pr.exercise_name || 'Exercício';
  switch (pr.record_type) {
    case 'max_weight':
      return `Novo PR no ${name}: ${pr.weight_kg}kg × ${pr.reps} reps.`;
    case 'max_reps':
      if (pr.weight_kg) return `Novo recorde de reps no ${name}: ${pr.reps} reps a ${pr.weight_kg}kg.`;
      return `Novo recorde de reps no ${name}: ${pr.reps} reps.`;
    case 'max_volume':
      return `Novo recorde de volume no ${name}: ${pr.value}kg totais.`;
    case 'max_duration':
      return `${name}: novo hold de ${pr.duration_seconds} segundos.`;
    case 'band_reduction':
      return `Você evoluiu no ${name}: agora com elástico ${BAND_LABEL[pr.band_level] || pr.band_level}.`;
    case 'first_without_band':
      return `🎉 Primeira repetição do ${name} sem elástico!`;
    case 'first_rep':
      return `Primeira execução registrada do ${name}!`;
    default:
      return `Novo recorde no ${name}.`;
  }
}

/**
 * Retorna metadados visuais para um tipo de PR.
 */
export function getPRMeta(prType) {
  const map = {
    max_weight:        { emoji: '⚖️', label: 'Carga máxima',     color: 'text-primary',     bg: 'bg-primary/10',     border: 'border-primary/30' },
    max_reps:          { emoji: '🔥', label: 'Reps máximas',     color: 'text-success',     bg: 'bg-success/10',     border: 'border-success/30' },
    max_volume:        { emoji: '📈', label: 'Volume máximo',    color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/30' },
    max_duration:      { emoji: '⏱️', label: 'Tempo máximo',     color: 'text-purple-400',  bg: 'bg-purple-400/10',  border: 'border-purple-400/30' },
    band_reduction:    { emoji: '🪢', label: 'Elástico mais leve', color: 'text-green-400', bg: 'bg-green-400/10',   border: 'border-green-400/30' },
    first_without_band:{ emoji: '🎉', label: 'Sem elástico!',    color: 'text-gold',        bg: 'bg-gold/10',        border: 'border-gold/30' },
    first_rep:         { emoji: '🌟', label: 'Primeira vez',     color: 'text-foreground',  bg: 'bg-muted/30',       border: 'border-border' },
  };
  return map[prType] || map.first_rep;
}

export { BAND_LABEL };