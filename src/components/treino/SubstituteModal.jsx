import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Search, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubstituteModal({ routineExercise, currentExercise, onClose, onSubstituted }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('today'); // 'today' | 'permanent'
  const [selected, setSelected] = useState(null);

  const { data: exercises } = useQuery({
    queryKey: ['all-exercises'],
    queryFn: () => base44.entities.Exercise.list(),
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
    onSuccess: () => { onSubstituted(selected); onClose(); },
  });

  // Suggested substitutes first, then all by same muscle
  const suggested = (substitutions || [])
    .map(s => exercises?.find(e => e.id === s.substitute_exercise_id))
    .filter(Boolean);

  const sameMuscle = (exercises || []).filter(e =>
    e.id !== currentExercise?.id &&
    e.primary_muscle === currentExercise?.primary_muscle &&
    !suggested.find(s => s.id === e.id)
  );

  const filtered = [...suggested, ...sameMuscle].filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col"
    >
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="p-1.5 rounded-lg bg-muted/40">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-sm">Substituir exercício</p>
          <p className="text-xs text-muted-foreground truncate">{currentExercise?.name}</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Mode toggle */}
        <div className="flex gap-1 bg-muted/30 rounded-xl p-1">
          {[{ key: 'today', label: 'Só hoje' }, { key: 'permanent', label: 'Permanentemente' }].map(m => (
            <button key={m.key} onClick={() => setMode(m.key)}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${mode === m.key ? 'bg-card text-foreground shadow' : 'text-muted-foreground'}`}>
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'permanent' && (
          <p className="text-xs text-destructive/80 bg-destructive/10 px-3 py-2 rounded-lg">
            ⚠️ Isso vai alterar permanentemente sua rotina.
          </p>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar exercício..."
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-6">
        {suggested.length > 0 && !search && (
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-1">Sugeridos</p>
        )}
        {filtered.map(ex => (
          <button
            key={ex.id}
            onClick={() => setSelected(ex)}
            className={`w-full text-left flex items-center gap-3 rounded-xl px-3 py-3 border transition-all
              ${selected?.id === ex.id ? 'border-primary/50 bg-primary/10' : 'border-border bg-card hover:border-primary/20'}`}
          >
            <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 text-lg">
              {ex.exercise_type === 'calistenia' ? '🤸' : ex.uses_band ? '🪢' : '💪'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{ex.name}</p>
              <p className="text-[10px] text-muted-foreground">{ex.primary_muscle} · {ex.difficulty}</p>
            </div>
            {suggested.find(s => s.id === ex.id) && (
              <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded shrink-0">SUGERIDO</span>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="px-4 pb-6 pt-2 border-t border-border">
          <button
            onClick={() => {
              if (mode === 'today') {
                onSubstituted(selected);
                onClose();
              } else {
                permanentMutation.mutate(selected.id);
              }
            }}
            disabled={permanentMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black py-3.5 rounded-2xl hover:bg-primary/90 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            {mode === 'today' ? `Substituir por ${selected.name} hoje` : `Salvar permanentemente`}
          </button>
        </div>
      )}
    </motion.div>
  );
}