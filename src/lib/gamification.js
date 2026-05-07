// Utility functions for gamification calculations

export function calculateLevel(xp, levelConfigs) {
  if (!levelConfigs || levelConfigs.length === 0) {
    // Default levels if none configured
    const defaultLevels = [
      { level: 1, title: 'Iniciante', xp_threshold: 0 },
      { level: 2, title: 'Aprendiz', xp_threshold: 500 },
      { level: 3, title: 'Guerreiro', xp_threshold: 1200 },
      { level: 4, title: 'Veterano', xp_threshold: 2500 },
      { level: 5, title: 'Elite', xp_threshold: 5000 },
      { level: 6, title: 'Mestre', xp_threshold: 8000 },
      { level: 7, title: 'Lenda', xp_threshold: 12000 },
      { level: 8, title: 'Titã', xp_threshold: 18000 },
      { level: 9, title: 'Semideus', xp_threshold: 25000 },
      { level: 10, title: 'Imortal', xp_threshold: 35000 },
    ];
    levelConfigs = defaultLevels;
  }

  const sorted = [...levelConfigs].sort((a, b) => b.xp_threshold - a.xp_threshold);
  for (const lvl of sorted) {
    if (xp >= lvl.xp_threshold) {
      const nextLevel = levelConfigs.find(l => l.level === lvl.level + 1);
      return {
        level: lvl.level,
        title: lvl.title,
        currentXP: xp,
        xpForCurrentLevel: lvl.xp_threshold,
        xpForNextLevel: nextLevel ? nextLevel.xp_threshold : null,
        progress: nextLevel 
          ? ((xp - lvl.xp_threshold) / (nextLevel.xp_threshold - lvl.xp_threshold)) * 100
          : 100
      };
    }
  }
  return { level: 1, title: 'Iniciante', currentXP: xp, xpForCurrentLevel: 0, xpForNextLevel: 500, progress: (xp / 500) * 100 };
}

export function getStreakStatus(lastCheckinDate) {
  if (!lastCheckinDate) return { active: false, days: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastCheckinDate);
  last.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
  return { active: diffDays <= 1, days: diffDays };
}

export const CATEGORY_ICONS = {
  forca: 'Dumbbell',
  mobilidade: 'Move',
  equilibrio: 'Scale',
  resistencia: 'Heart',
  potencia: 'Zap',
  flexibilidade: 'Stretch',
};

export const CATEGORY_LABELS = {
  forca: 'Força',
  mobilidade: 'Mobilidade',
  equilibrio: 'Equilíbrio',
  resistencia: 'Resistência',
  potencia: 'Potência',
  flexibilidade: 'Flexibilidade',
};

/**
 * XP earned per workout session.
 * Formula: base por série + bônus por volume + bônus por PR
 * Gamification hooks should react to WorkoutSession.status === 'completed'
 * and WorkoutSession.xp_earned to credit the student.
 */
export function calcSessionXP(setsCount, volumeKg, prsCount = 0) {
  return Math.min(300, Math.max(50, Math.round(setsCount * 7 + volumeKg * 0.05 + prsCount * 25)));
}

export const RARITY_COLORS = {
  common: 'text-muted-foreground',
  rare: 'text-blue-400',
  epic: 'text-epic',
  legendary: 'text-gold',
};