/**
 * ProgressionPath — visual "Você está aqui" de progressão de calistenia.
 * Mostra: anterior · atual · próximo + requisito + tipo + nota do Jota.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronRight, ChevronLeft, MapPin, Lock, Trophy, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const TYPE_LABEL = {
  linear: 'Progressão Linear',
  skill: 'Skill',
  band_reduction: 'Redução de Elástico',
  load: 'Aumento de Carga',
  volume: 'Aumento de Volume',
  skill_unlock: 'Destrava Skill',
};

const TYPE_BADGE = {
  linear: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  skill: 'bg-epic/15 text-epic border-epic/30',
  band_reduction: 'bg-green-500/15 text-green-400 border-green-500/30',
  load: 'bg-primary/15 text-primary border-primary/30',
  volume: 'bg-gold/15 text-gold border-gold/30',
  skill_unlock: 'bg-epic/15 text-epic border-epic/30',
};

function StepCard({ exercise, label, isCurrent, isLocked, onClick }) {
  const Icon = isCurrent ? MapPin : isLocked ? Lock : Trophy;
  const colorCls = isCurrent
    ? 'bg-primary/15 border-primary text-primary shadow-[0_0_20px_rgba(249,115,22,0.25)]'
    : isLocked
    ? 'bg-muted/20 border-border/40 text-muted-foreground'
    : 'bg-success/10 border-success/40 text-success';

  return (
    <button
      type="button"
      disabled={!exercise || isCurrent}
      onClick={onClick}
      className={`flex-1 min-w-0 rounded-2xl border-2 p-3 text-left transition-all ${colorCls} ${
        !isCurrent && exercise ? 'hover:border-primary/60 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xs font-bold leading-tight line-clamp-2 ${isCurrent ? 'text-foreground' : ''}`}>
        {exercise?.name || '—'}
      </p>
    </button>
  );
}

export default function ProgressionPath({ exerciseId, onSelectExercise }) {
  // Fetch progression for current exercise
  const { data: progression, isLoading } = useQuery({
    queryKey: ['exercise-progression', exerciseId],
    queryFn: async () => {
      const list = await base44.entities.ExerciseProgression.filter({ exercise_id: exerciseId });
      return list?.[0] || null;
    },
    enabled: !!exerciseId,
  });

  // Resolve previous and next exercises (suporta legado snake_case OU camelCase)
  const prevId = progression?.previous_exercise_id || progression?.previousExerciseId;
  const nextId = progression?.next_exercise_id || progression?.nextExerciseId;
  const progType = progression?.progression_type || progression?.progressionType;
  const requirement = progression?.requirement_to_unlock || progression?.requirementToUnlock;
  const notes = progression?.notes;
  const difficultyOrder = progression?.difficulty_order || progression?.difficultyOrder || 0;

  const { data: relatedExercises } = useQuery({
    queryKey: ['progression-related', prevId, nextId, exerciseId],
    queryFn: async () => {
      const ids = [prevId, exerciseId, nextId].filter(Boolean);
      if (!ids.length) return [];
      try {
        const list = await base44.entities.Exercise.filter({ id: { $in: ids } });
        return list || [];
      } catch {
        return [];
      }
    },
    enabled: !!progression && (!!prevId || !!nextId),
  });

  if (isLoading) return null;
  if (!progression) return null;
  // Sem prev nem next → não há trilha pra mostrar
  if (!prevId && !nextId) return null;

  const findEx = (id) => (relatedExercises || []).find(e => e.id === id);
  const prev = findEx(prevId);
  const current = findEx(exerciseId);
  const next = findEx(nextId);

  const typeLabel = TYPE_LABEL[progType] || progType;
  const typeBadge = TYPE_BADGE[progType] || 'bg-muted/20 text-muted-foreground border-border/40';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <p className="text-xs font-black uppercase tracking-wider">Sua trilha</p>
        </div>
        {progType && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${typeBadge}`}>
            {typeLabel}
          </span>
        )}
      </div>

      {/* Steps row */}
      <div className="grid grid-cols-3 gap-2 items-stretch">
        <StepCard
          exercise={prev}
          label="Anterior"
          isLocked={false}
          onClick={() => prev && onSelectExercise?.(prev)}
        />
        <StepCard
          exercise={current}
          label="Você está aqui"
          isCurrent
        />
        <StepCard
          exercise={next}
          label="Próximo"
          isLocked={!!next}
          onClick={() => next && onSelectExercise?.(next)}
        />
      </div>

      {/* Connector arrows */}
      <div className="grid grid-cols-3 gap-2 -mt-1">
        <div className="flex justify-end pr-1">
          {prev && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />}
        </div>
        <div />
        <div className="flex justify-start pl-1">
          {next && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />}
        </div>
      </div>

      {/* Requirement to unlock next */}
      {requirement && next && (
        <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2">
          <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">
              Para destravar {next.name}
            </p>
            <p className="text-sm font-bold text-foreground">{requirement}</p>
          </div>
        </div>
      )}

      {/* Note from Jota */}
      {notes && (
        <div className="mt-2 bg-gold/5 border border-gold/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gold mb-1">⭐ Nota do Jota</p>
          <p className="text-xs text-foreground leading-relaxed">{notes}</p>
        </div>
      )}

      {/* Final-step celebration */}
      {!next && difficultyOrder > 1 && (
        <div className="mt-3 bg-success/10 border border-success/30 rounded-xl p-3 text-center">
          <p className="text-xs font-black text-success">🏆 Topo da progressão!</p>
        </div>
      )}
    </motion.div>
  );
}