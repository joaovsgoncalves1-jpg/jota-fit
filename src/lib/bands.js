/**
 * Sistema central de elásticos do Jota Fit.
 * Elástico = ferramenta de progressão. Menos assistência = mais força real.
 */

// Ordem do mais assistido (mais força do elástico) para o menos assistido.
export const BAND_ORDER = ['muito_forte', 'forte', 'medio', 'leve'];

export const BAND_LABEL = {
  muito_forte: 'Muito forte',
  forte: 'Forte',
  medio: 'Médio',
  leve: 'Leve',
};

// Cores comuns no mercado brasileiro (mini bands / power bands).
// Ordem: do mais assistido para o mais leve.
export const BAND_COLORS = [
  { key: 'preto',    label: 'Preto',    hex: '#1f2937', kgRange: '40-80kg' },
  { key: 'roxo',     label: 'Roxo',     hex: '#7c3aed', kgRange: '30-50kg' },
  { key: 'verde',    label: 'Verde',    hex: '#16a34a', kgRange: '20-35kg' },
  { key: 'azul',     label: 'Azul',     hex: '#2563eb', kgRange: '15-25kg' },
  { key: 'vermelho', label: 'Vermelho', hex: '#dc2626', kgRange: '10-15kg' },
  { key: 'laranja',  label: 'Laranja',  hex: '#f97316', kgRange: '5-10kg'  },
  { key: 'amarelo',  label: 'Amarelo',  hex: '#facc15', kgRange: '3-7kg'   },
];

/**
 * Retorna índice do elástico (0 = mais forte / mais assistência).
 * Sem elástico = BAND_ORDER.length (mais difícil ainda).
 */
export function bandIndex(level) {
  if (!level) return BAND_ORDER.length;
  const idx = BAND_ORDER.indexOf(level);
  return idx === -1 ? BAND_ORDER.length : idx;
}

/**
 * Compara dois níveis. Retorna +1 se A é mais leve (= mais força), -1 se mais assistido.
 */
export function compareBands(a, b) {
  return bandIndex(a) - bandIndex(b);
}

/**
 * Sugere o próximo nível mais leve.
 */
export function nextLighterBand(level) {
  const idx = BAND_ORDER.indexOf(level);
  if (idx === -1) return null;
  if (idx === BAND_ORDER.length - 1) return null; // já é o mais leve, próximo passo = sem elástico
  return BAND_ORDER[idx + 1];
}

/**
 * Lista de exercícios principais que se beneficiam fortemente de elástico.
 * Usado para destacar dicas de progressão.
 */
export const BAND_PROGRESSION_EXERCISES = [
  'pull-up', 'pullup', 'barra-fixa',
  'dips', 'mergulho', 'paralelas',
  'muscle-up', 'muscleup',
  'front-lever',
  'back-lever',
  'planche', 'planche-lean',
  'pistol-squat',
  'nordic-curl', 'nordico',
];

export function isBandProgressionExercise(exercise) {
  if (!exercise) return false;
  const slug = (exercise.slug || '').toLowerCase();
  const name = (exercise.name || '').toLowerCase();
  return BAND_PROGRESSION_EXERCISES.some(k => slug.includes(k) || name.includes(k));
}

/**
 * Retorna critérios "quando trocar" para o nível atual.
 */
export function getProgressionTips(currentLevel, trackingType = 'assisted_bodyweight') {
  if (trackingType === 'hold_time') {
    return {
      lighter: currentLevel
        ? `Quando segurar 3×20s firmes com elástico ${BAND_LABEL[currentLevel]}, troque para ${BAND_LABEL[nextLighterBand(currentLevel)] || 'sem elástico'}.`
        : 'Tente progressões mais avançadas.',
      noBand: 'Quando segurar 3×10s com elástico Leve, tente sem elástico.',
    };
  }
  return {
    lighter: currentLevel
      ? `Quando fizer 3×8 limpas com elástico ${BAND_LABEL[currentLevel]}, troque para ${BAND_LABEL[nextLighterBand(currentLevel)] || 'sem elástico'}.`
      : 'Tente progressões mais avançadas.',
    noBand: 'Quando fizer 3×5 com elástico Leve, tente 1 rep sem elástico.',
  };
}