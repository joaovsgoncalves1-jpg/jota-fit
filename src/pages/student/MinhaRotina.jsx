import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Edit2, Trash2, ChevronDown, ChevronUp, Star, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoutineFormModal from '@/components/rotina/RoutineFormModal';
import {
  useCurrentUser,
  useStudentRoutines, useAllRoutineExercises,
  useExercises,
  useDeleteRoutine, useSetActiveRoutine,
} from '@/services';

const DAYS_LABEL = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };
const BAND_LABEL = { leve: 'Leve', medio: 'Médio', forte: 'Forte', muito_forte: 'Muito forte' };
const TRACKING_ICON = {
  weight_reps: '⚖️', bodyweight_reps: '💪', assisted_bodyweight: '🪢',
  hold_time: '⏱', time_distance: '🏃', unilateral: '↔️',
};

export default function MinhaRotina() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  const { data: routines, isLoading } = useStudentRoutines(user?.email);
  const { data: allRoutineExercises } = useAllRoutineExercises();
  const { data: exercises } = useExercises();
  const deleteMutation = useDeleteRoutine();
  const setActiveMutation = useSetActiveRoutine();

  // Sort: active first, then Jota routines, then others
  const sorted = [...(routines || [])].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    if (a.createdByRole === 'jota' && b.createdByRole !== 'jota') return -1;
    if (a.createdByRole !== 'jota' && b.createdByRole === 'jota') return 1;
    return 0;
  });

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-black">MINHA ROTINA</h1>
          <p className="text-xs text-muted-foreground">{(routines || []).length} rotinas</p>
        </div>
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
          <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="font-bold text-base mb-1">Nenhuma rotina criada</p>
          <p className="text-sm text-muted-foreground mb-6">
            Crie sua primeira rotina e adicione exercícios da biblioteca. Você está no caminho certo!
          </p>
          <button
            onClick={() => { setEditingRoutine(null); setShowForm(true); }}
            className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all"
          >
            Criar Primeira Rotina
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {sorted.map((routine, i) => {
            const routineExercises = (allRoutineExercises || [])
              .filter(re => re.routineId === routine.id)
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            const isExpanded = expanded === routine.id;
            const isJota = routine.createdByRole === 'jota';

            return (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border overflow-hidden transition-all
                  ${routine.isActive
                    ? 'border-primary/40 bg-gradient-to-br from-card to-primary/5 shadow-[0_0_20px_rgba(249,115,22,0.06)]'
                    : isJota
                    ? 'border-gold/30 bg-gradient-to-br from-card to-gold/5'
                    : 'border-border bg-card'
                  }`}
              >
                <div className="p-4">
                  {isJota && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] font-black bg-gold/20 text-gold px-2 py-0.5 rounded-md">⭐ PLANO DO JOTA</span>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      ${routine.isActive ? 'bg-primary/20' : isJota ? 'bg-gold/20' : 'bg-muted/40'}`}>
                      {routine.isActive
                        ? <Star className="w-5 h-5 text-primary" fill="currentColor" />
                        : isJota
                        ? <Star className="w-5 h-5 text-gold" />
                        : <Dumbbell className="w-5 h-5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-base">{routine.name}</p>
                        {routine.isActive && (
                          <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-md">ATIVA</span>
                        )}
                      </div>
                      {routine.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{routine.description}</p>
                      )}
                      {isJota && routine.consultantNote && (
                        <p className="text-xs text-gold/80 mt-1 italic">"{routine.consultantNote}"</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {(routine.daysOfWeek || []).map(d => (
                          <span key={d} className="text-[10px] font-bold bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-md">
                            {DAYS_LABEL[d] || d}
                          </span>
                        ))}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Dumbbell className="w-3 h-3" /> {routineExercises.length} ex.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/treino/${routine.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" fill="currentColor" /> Iniciar
                    </button>
                    {!routine.isActive && (
                      <button
                        onClick={() => setActiveMutation.mutate({ routineId: routine.id, studentEmail: user?.email })}
                        title="Definir como ativa"
                        className="flex items-center justify-center gap-1.5 bg-muted/40 text-muted-foreground text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isJota && (
                      <>
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
                      </>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : routine.id)}
                      className="flex items-center justify-center bg-muted/40 text-muted-foreground px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

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
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">Nenhum exercício ainda</p>
                            <p className="text-xs text-primary mt-1">Adicione da Biblioteca!</p>
                          </div>
                        ) : routineExercises.map((re, idx) => {
                          const ex = exercises?.find(e => e.id === re.exerciseId);
                          const trackingType = ex?.trackingType || 'weight_reps';
                          return (
                            <div key={re.id} className="flex items-center gap-3 bg-muted/20 rounded-xl px-3 py-2.5">
                              <span className="font-display font-black text-xs text-primary w-5 shrink-0">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{ex?.name || 'Exercício'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px]">{TRACKING_ICON[trackingType] || '💪'}</span>
                                  <p className="text-[10px] text-muted-foreground">
                                    {re.sets && `${re.sets}x`}
                                    {re.targetReps ? ` ${re.targetReps}` : ''}
                                    {re.targetWeightKg ? ` @ ${re.targetWeightKg}kg` : ''}
                                    {re.bandAssistanceLevel ? ` · Elástico ${BAND_LABEL[re.bandAssistanceLevel]}` : ''}
                                    {re.restSeconds ? ` · ${re.restSeconds}s` : ''}
                                  </p>
                                </div>
                                {re.notes && <p className="text-[10px] text-muted-foreground italic mt-0.5">{re.notes}</p>}
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