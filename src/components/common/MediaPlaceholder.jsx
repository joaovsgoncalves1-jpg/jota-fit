/**
 * MediaPlaceholder — placeholder premium para quando um exercício não tem
 * vídeo, GIF, imagem ou thumbnail.
 *
 * Variants:
 *  - 'thumb'  → quadrado pequeno (lista, card)
 *  - 'square' → médio (avatar de exercício)
 *  - 'wide'   → 16:9 (detalhe / iframe-fallback)
 */
import React from 'react';

const PATTERN_EMOJI = {
  empurrar_horizontal: '→', empurrar_vertical: '↑',
  puxar_horizontal: '←', puxar_vertical: '↑',
  agachamento: '🦵', hinge: '🍑', lunge: '🚶',
  core_flexao: '🔥', core_anti_extensao: '🔥', core_anti_rotacao: '🔥', core: '🔥',
  isometria: '⏱', skill: '⭐', mobilidade: '🤸',
  panturrilha: '🦶', abducao_quadril: '↔', aducao_quadril: '↔',
  puxar: '↗', empurrar: '↙', pernas: '🦵',
};

const TYPE_EMOJI = {
  musculacao: '🏋️', calistenia: '💪', mobilidade: '🤸',
  cardio: '🏃', skill: '⭐', alongamento: '🧘',
  aquecimento: '🔥', ativacao: '⚡', reabilitacao: '🩹',
};

function pickEmoji(exercise) {
  if (!exercise) return '💪';
  return (
    PATTERN_EMOJI[exercise.movementPattern] ||
    PATTERN_EMOJI[exercise.movement_pattern] ||
    TYPE_EMOJI[exercise.exerciseType] ||
    TYPE_EMOJI[exercise.exercise_type] ||
    '💪'
  );
}

export default function MediaPlaceholder({ exercise, variant = 'thumb', label, className = '' }) {
  const emoji = pickEmoji(exercise);

  if (variant === 'wide') {
    return (
      <div className={`rounded-2xl aspect-video bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 flex flex-col items-center justify-center gap-2 ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-card/60 border border-border/40 flex items-center justify-center">
          <span className="text-3xl">{emoji}</span>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          {label || 'Tutorial em breve'}
        </p>
      </div>
    );
  }

  if (variant === 'square') {
    return (
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-muted/40 to-muted/15 border border-border/40 flex items-center justify-center ${className}`}>
        <span className="text-2xl">{emoji}</span>
      </div>
    );
  }

  // thumb
  return (
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-muted/40 to-muted/15 border border-border/40 flex items-center justify-center ${className}`}>
      <span className="text-xl">{emoji}</span>
    </div>
  );
}