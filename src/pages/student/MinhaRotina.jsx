import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Edit2, Trash2, ChevronDown, ChevronUp, Star, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoutineFormModal from '@/components/rotina/RoutineFormModal';

const DAYS_LABEL = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };

export default function MinhaRotina() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  const { data: routines, isLoading } = useQuery({
    queryKey: ['my-routines', user?.email],
    queryFn: () => base44.entities.Routine.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allRoutineExercises } = useQuery({
    queryKey: ['all-routine-exercises'],
    queryFn: () => base44.entities.RoutineExercise.list(),
  });

  const { data: exercises } = useQuery({
    queryKey: ['all-exercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Routine.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-routines'] }),
  });

  const setActiveMutation = useMutation({
    mutationFn: async (routine) => {
      // Deactivate all
      for (const r of (routines || [])) {
        if (r.is_active) await base44.entities.Routine.update(r.id, { is_active: false });
      }
      await base44.entities.Routine.update(routine.id, { is_active: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-routines'] }),
  });

  const sorted = [...(routines || [])].sort((a, b) => b.is_active - a.is_active);

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="font-display text-xl font-black">MINHA ROTINA</h1>
        <button
          onClick={() => { setEditingRoutine(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Rotina
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 px-8">
          <p className="text-4xl mb-4">📋</p>
          <p className="font-bold text-base mb-1">Nenhuma rotina criada</p>
          <p className="text-sm text-muted-foreground mb-4">Crie sua primeira rotina e adicione exercícios da biblioteca</p>
          <button
            onClick={() => { setEditingRoutine(null); setShowForm(true); }}
            className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all"
          >
            Criar Rotina
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {sorted.map((routine, i) => {
            const routineExercises = (allRoutineExercises || [])
              .filter(re => re.routine_id === routine.id)
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            const isExpanded = expanded === routine.id;

            return (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card rounded-2xl border overflow-hidden transition-all
                  ${routine.is_active ? 'border-primary/40 shadow-[0_0_20px_rgba(249,115,22,0.08)]' : 'border-border'}`}
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      ${routine.is_active ? 'bg-primary/20' : 'bg-muted/40'}`}>
                      {routine.is_active ? <Star className="w-5 h-5 text-primary" fill="currentColor" /> : <Star className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base">{routine.name}</p>
                        {routine.is_active && (
                          <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-md">ATIVA</span>
                        )}
                      </div>
                      {routine.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{routine.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {(routine.days_of_week || []).map(d => (
                          <span key={d} className="text-[10px] font-bold bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-md">
                            {DAYS_LABEL[d] || d}
                          </span>
                        ))}
                        <span className="text-[10px] text-muted-foreground">{routineExercises.length} exercícios</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/treino/${routine.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" /> Iniciar Treino
                    </button>
                    {!routine.is_active && (
                      <button
                        onClick={() => setActiveMutation.mutate(routine)}
                        className="flex items-center justify-center gap-1.5 bg-muted/40 text-muted-foreground text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingRoutine(routine); setShowForm(true); }}
                      className="flex items-center justify-center bg-muted/40 text-muted-foreground px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (window.confirm('Excluir rotina?')) deleteMutation.mutate(routine.id); }}
                      className="flex items-center justify-center bg-destructive/10 text-destructive px-3 py-2.5 rounded-xl hover:bg-destructive/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : routine.id)}
                      className="flex items-center justify-center bg-muted/40 text-muted-foreground px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Exercise list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-2">
                        {routineExercises.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum exercício. Adicione da biblioteca!
                          </p>
                        ) : routineExercises.map((re, idx) => {
                          const ex = exercises?.find(e => e.id === re.exercise_id);
                          return (
                            <div key={re.id} className="flex items-center gap-3 bg-muted/20 rounded-xl px-3 py-2.5">
                              <span className="font-display font-black text-xs text-primary w-5 shrink-0">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{ex?.name || 'Exercício'}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {re.sets && `${re.sets}x`} {re.reps || ''}
                                  {re.rest_seconds ? ` · ${re.rest_seconds}s desc.` : ''}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {showForm && (
        <RoutineFormModal
          routine={editingRoutine}
          onClose={() => { setShowForm(false); setEditingRoutine(null); }}
          studentEmail={user?.email}
        />
      )}
    </div>
  );
}