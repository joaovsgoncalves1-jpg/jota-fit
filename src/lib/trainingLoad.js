/**
 * Utilitários de cálculo de carga e fadiga
 */

// Calcula score de carga por intensidade e duração
export function calcLoadScore(intensity, durationMinutes) {
  const intensityMap = { leve: 1, moderado: 2, intenso: 3, maximo: 4, intenso: 3 };
  const base = intensityMap[intensity] || 2;
  return Math.round(base * (durationMinutes / 30) * 25);
}

// Grupos musculares afetados por tipo de atividade híbrida
export const ACTIVITY_MUSCLE_IMPACT = {
  corrida: { legs_fatigue_score: 35, cardiovascular_fatigue_score: 30 },
  caminhada: { legs_fatigue_score: 15, cardiovascular_fatigue_score: 10 },
  bike: { legs_fatigue_score: 30, cardiovascular_fatigue_score: 25 },
  natacao: { shoulders_fatigue_score: 25, back_fatigue_score: 20, cardiovascular_fatigue_score: 30 },
  HIIT: { legs_fatigue_score: 20, core_fatigue_score: 15, cardiovascular_fatigue_score: 40 },
  mobilidade: {},
  alongamento: {},
  luta: { core_fatigue_score: 20, shoulders_fatigue_score: 15, cardiovascular_fatigue_score: 25 },
  esporte: { legs_fatigue_score: 20, cardiovascular_fatigue_score: 25 },
  recuperacao_ativa: {},
  calistenia_tecnica: { back_fatigue_score: 25, core_fatigue_score: 25, shoulders_fatigue_score: 20 },
  condicionamento: { legs_fatigue_score: 15, cardiovascular_fatigue_score: 30 },
  outro: {},
};

// Intensidade modifica o impacto muscular
export function applyIntensityMultiplier(impactObj, intensity) {
  const mult = { leve: 0.5, moderado: 1, intenso: 1.5, maximo: 2 }[intensity] || 1;
  const result = {};
  for (const [k, v] of Object.entries(impactObj)) {
    result[k] = Math.round(v * mult);
  }
  return result;
}

// Calcula nível de fadiga a partir do score
export function fatigueLevel(score) {
  if (score >= 75) return 'muito_alta';
  if (score >= 50) return 'alta';
  if (score >= 25) return 'moderada';
  return 'baixa';
}

// Cor por nível de fadiga
export const FATIGUE_COLOR = {
  baixa: 'text-success',
  moderada: 'text-gold',
  alta: 'text-primary',
  muito_alta: 'text-destructive',
};

export const FATIGUE_BG = {
  baixa: 'bg-success/10 border-success/20',
  moderada: 'bg-gold/10 border-gold/20',
  alta: 'bg-primary/10 border-primary/20',
  muito_alta: 'bg-destructive/10 border-destructive/20',
};

export const FATIGUE_BAR = {
  baixa: 'bg-success',
  moderada: 'bg-gold',
  alta: 'bg-primary',
  muito_alta: 'bg-destructive',
};

// Gera recomendações simples baseadas em fadiga
export function generateRecommendations(fatigueMap, sessions, activities, today) {
  const recs = [];

  const legsScore = fatigueMap?.pernas || 0;
  const backScore = fatigueMap?.costas || 0;
  const coreScore = fatigueMap?.core || 0;
  const shouldersScore = fatigueMap?.ombros || 0;
  const cardioScore = fatigueMap?.cardiovascular || 0;

  // Perna pesada
  if (legsScore >= 60) {
    recs.push({
      type: 'reduce_intensity',
      title: 'Pernas cansadas 🦵',
      message: 'Suas pernas estão com fadiga alta. Prefira upper body ou cardio leve hoje.',
      severity: legsScore >= 80 ? 'high' : 'medium',
      muscle: 'pernas',
    });
  }

  // Costas/core + skill
  if (backScore >= 55 && coreScore >= 50) {
    recs.push({
      type: 'skill_light_day',
      title: 'Costas e core moderados 🔁',
      message: 'Costas e core acumulados. Front lever e muscle-up devem ser técnicos, não máximos.',
      severity: 'medium',
      muscle: 'costas',
    });
  }

  // Ombros sobrecarregados
  if (shouldersScore >= 65) {
    recs.push({
      type: 'add_mobility',
      title: 'Ombros com alta demanda ⚠️',
      message: 'Muita demanda de ombros acumulada. Priorize mobilidade ou puxada leve.',
      severity: 'high',
      muscle: 'ombros',
    });
  }

  // Cardio alto
  if (cardioScore >= 70) {
    recs.push({
      type: 'add_recovery',
      title: 'Sistema cardiovascular elevado ❤️',
      message: 'Cardio intenso recente. Considere recuperação ativa ou descanso.',
      severity: 'medium',
      muscle: 'cardiovascular',
    });
  }

  // Boa consistência
  if ((sessions?.length || 0) + (activities?.length || 0) >= 4) {
    recs.push({
      type: 'maintain_plan',
      title: 'Boa consistência! 💪',
      message: `Você já tem ${(sessions?.length || 0) + (activities?.length || 0)} sessões esta semana. Continue assim!`,
      severity: 'low',
      muscle: null,
    });
  }

  return recs;
}

export const ACTIVITY_LABELS = {
  corrida: 'Corrida 🏃',
  caminhada: 'Caminhada 🚶',
  bike: 'Bike 🚴',
  natacao: 'Natação 🏊',
  HIIT: 'HIIT 🔥',
  mobilidade: 'Mobilidade 🤸',
  alongamento: 'Alongamento 🧘',
  luta: 'Luta/Esporte 🥊',
  esporte: 'Esporte ⚽',
  recuperacao_ativa: 'Recuperação Ativa 💆',
  calistenia_tecnica: 'Calistenia Técnica 🤼',
  condicionamento: 'Condicionamento ⚡',
  outro: 'Outro',
};

export const ACTIVITY_ICONS = {
  corrida: '🏃',
  caminhada: '🚶',
  bike: '🚴',
  natacao: '🏊',
  HIIT: '🔥',
  mobilidade: '🤸',
  alongamento: '🧘',
  luta: '🥊',
  esporte: '⚽',
  recuperacao_ativa: '💆',
  calistenia_tecnica: '🤼',
  condicionamento: '⚡',
  outro: '🏋️',
};