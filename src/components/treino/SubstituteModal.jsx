/**
 * SubstituteModal — substitui um exercício durante o treino.
 * - Modo "Só hoje" (snapshot do treino) ou "Permanentemente" (altera a rotina).
 * - Mostra para cada substituto: motivo, músculo principal, equipamento, dificuldade, padrão e nota.
 * - Sugeridos primeiro (vindos do ExerciseSubstitution mapeado pelo Jota), depois mesmo músculo.
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Search, RefreshCw, ArrowRight, Star, Wrench, Target, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const DIFF_LABEL = {
  easier: { label: 'Mais fácil', cls: 'bg-success/15 text-success border-success/30' },
  same:   { label: 'Equivalente', cls: 'bg-primary/15 text-primary border-primary/30' },
  harder: { label: 'Mais difícil', cls: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const PATTERN_LABEL = {
  empurrar_horizontal: 'Empurrar horizontal',
  empurrar_vertical: 'Empurrar vertical',
  puxar_horizontal: 'Puxar horizontal',
  puxar_vertical: 'Puxar vertical',
  agachamento: 'Agachamento',
  hinge: 'Hip hinge',
  lunge: 'Avanço',
  panturrilha: 'Panturrilha',
  core_flexao: 'Core',
  core_anti_extensao: 'Core (anti-extensão)',
  isometria: 'Isometria',
  skill: 'Skill',
  mobilidade: 'Mobilidade',
};

export default function SubstituteModal({ routineExercise, currentExercise, onClose, onSubstituted }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('today'); // 'today' | 'permanent'
  const [selected, setSelected] = useState(null);

  const { data: exercises } = useQuery({
    queryKey: ['all-exercises'],
    queryFn: () => base44.entities.Exercise.list('-created_date', 1000),
  });

  const { data: substitutions } = useQuery({
    queryKey: ['substitutions', currentExercise?.id],
    queryFn: () => base44.entities.ExerciseSubstitution.filter({ exercise_id: currentExercise?.id }),
    enabled: !!currentExercise?.id,
  });

  const permanentMutation = useMutation({
    mutationFn: async (newExerciseId) => {
      await base44.entities.RoutineExercise.update(routineExercise.id, { exercise_id: newExerciseId });
      queryClient.invalidateQueries({ queryKey: ['routine-exercises'] });
    },
    onSuccess: () => { onSubstituted(selected.exercise || selected); onClose(); },
  });

  // Build enriched suggested list with sub metadata
  const suggested = useMemo(() => {
    if (!exercises || !substitutions) return [];
    return substitutions
      .map(s => {
        const ex = exercises.find(e => e.id === s.substitute_exercise_id);
        return ex ? { exercise: ex, sub: s } : null;
      })
      .filter(Boolean);
  }, [exercises, substitutions]);

  const sameMuscle = useMemo(() => {
    if (!exercises) return [];
    return exercises
      .filter(e =>
        e.id !== currentExercise?.id &&
        e.primary_muscle === currentExercise?.primary_muscle &&
        !suggested.find(s => s.exercise.id === e.id)
      )
      .map(ex => ({ exercise: ex, sub: null }));
  }, [exercises, currentExercise, suggested]);

  const filtered = useMemo(() => {
    const all = [...suggested, ...sameMuscle];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(({ exercise: e }) =>
      e.name?.toLowerCase().includes(q) ||
      e.primary_muscle?.toLowerCase().includes(q)
    );
  }, [suggested, sameMuscle, search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-lg bg-muted/40">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Substituir exercício</p>
          <p className="text-xs text-muted-foreground truncate">{currentExercise?.name}</p>
        </div>
      </div>

      {/* Mode + search */}
      <div className="px-4 py-3 space-y-3 shrink-0">
        <div className="flex gap-1 bg-muted/30 rounded-xl p-1">
          {[
            { key: 'today', label: 'Só hoje' },
            { key: 'permanent', label: 'Permanentemente' }
          ].map(m => (
            <button key={m.key} onClick={() => setMode(m.key)}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${
                mode === m.key ? 'bg-card text-foreground shadow' : 'text-muted-foreground'
              }`}>
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'permanent' && (
          <p className="text-xs text-destructive/90 bg-destructive/10 px-3 py-2 rounded-lg">
            ⚠️ Isso vai alterar permanentemente sua rotina.
          </p>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar exercício ou músculo..."
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-32">
        {suggested.length > 0 && !search && (
          <div className="flex items-center gap-1.5 pt-1">
            <Star className="w-3 h-3 text-gold" fill="currentColor" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Sugeridos pelo Jota
            </p>
          </div>
        )}

        {filtered.map(({ exercise: ex, sub }) => {
          const isSelected = selected?.exercise?.id === ex.id;
          const diff = sub?.difficulty_match ? DIFF_LABEL[sub.difficulty_match] : null;
          const patternLabel = PATTERN_LABEL[ex.movement_pattern];

          return (
            <button
              key={ex.id}
              onClick={() => setSelected({ exercise: ex, sub })}
              className={`w-full text-left rounded-2xl p-3 border-2 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-[0_0_16px_rgba(249,115,22,0.18)]'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              {/* Top row */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0 text-lg">
                  {ex.exercise_type === 'calistenia' ? '🤸' : ex.uses_band ? '🪢' : '💪'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    {sub && (
                      <span className="text-[9px] font-black bg-gold/20 text-gold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5" fill="currentColor" /> JOTA
                      </span>
                    )}
                    {diff && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${diff.cls}`}>
                        {diff.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold leading-tight">{ex.name}</p>
                </div>
              </div>

              {/* Metadata grid (only for suggested with sub data, or always show muscle) */}
              <div className="mt-2.5 grid grid-cols-1 gap-1.5 text-[11px]">
                {/* Reason */}
                {sub?.reason && (
                  <div className="flex items-start gap-1.5 bg-primary/5 border border-primary/20 rounded-lg px-2 py-1.5">
                    <ArrowRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <p className="font-bold text-foreground leading-snug">{sub.reason}</p>
                  </div>
                )}

                {/* Inline meta: muscle, equipment, pattern */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground px-1">
                  {ex.primary_muscle && (
                    <span className="inline-flex items-center gap-1">
                      <Target className="w-3 h-3" /> <span className="font-medium text-foreground">{ex.primary_muscle}</span>
                    </span>
                  )}
                  {(sub?.equipment_context || (ex.equipment || ex.equipment_needed || [])[0]) && (
                    <span className="inline-flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      <span className="font-medium text-foreground">
                        {sub?.equipment_context || (ex.equipment || ex.equipment_needed || [])[0]}
                      </span>
                    </span>
                  )}
                  {patternLabel && (
                    <span className="inline-flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      <span className="font-medium text-foreground">{patternLabel}</span>
                    </span>
                  )}
                </div>

                {/* Practical note */}
                {sub?.notes && (
                  <p className="text-[11px] text-muted-foreground italic px-1 leading-snug">
                    💡 {sub.notes}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            Nenhum exercício encontrado.
          </p>
        )}
      </div>

      {/* CTA */}
      {selected && (
        <div className="px-4 pb-6 pt-3 border-t border-border bg-card/95 backdrop-blur-sm shrink-0">
          <button
            onClick={() => {
              if (mode === 'today') {
                onSubstituted(selected.exercise);
                onClose();
              } else {
                permanentMutation.mutate(selected.exercise.id);
              }
            }}
            disabled={permanentMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black py-3.5 rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            {mode === 'today'
              ? `Trocar por ${selected.exercise.name} hoje`
              : `Salvar permanentemente`}
          </button>
        </div>
      )}
    </motion.div>
  );
}