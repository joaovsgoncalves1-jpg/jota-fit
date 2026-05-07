import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const BAND_OPTIONS = [
  { key: 'muito_forte', label: 'Muito forte' },
  { key: 'forte', label: 'Forte' },
  { key: 'medio', label: 'Médio' },
  { key: 'leve', label: 'Leve' },
];

export default function AddToRoutineModal({ exercise, open, onClose }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [rest, setRest] = useState('90');
  const [band, setBand] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: routines } = useQuery({
    queryKey: ['my-routines', user?.email],
    queryFn: () => base44.entities.Routine.filter({ student_email: user?.email }),
    enabled: !!user?.email && open,
  });

  const { data: routineExercises } = useQuery({
    queryKey: ['all-routine-exercises'],
    queryFn: () => base44.entities.RoutineExercise.list(),
    enabled: open,
  });

  const trackingType = exercise?.tracking_type || 'weight_reps';
  const isBand = exercise?.uses_band || trackingType === 'assisted_bodyweight';
  const isTime = trackingType === 'hold_time';

  const addMutation = useMutation({
    mutationFn: () => {
      const routineREs = (routineExercises || []).filter(re => re.routine_id === selectedRoutine);
      const maxOrder = routineREs.reduce((max, re) => Math.max(max, re.order || 0), 0);
      return base44.entities.RoutineExercise.create({
        routine_id: selectedRoutine,
        exercise_id: exercise.id,
        order: maxOrder + 1,
        sets: parseInt(sets) || 3,
        target_reps: reps || undefined,
        reps: reps || undefined,
        target_weight_kg: parseFloat(weight) || undefined,
        target_duration_seconds: parseInt(duration) || undefined,
        rest_seconds: parseInt(rest) || 90,
        band_assistance_level: band || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-routine-exercises'] });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1200);
    },
  });

  const handleClose = () => { setSuccess(false); setSelectedRoutine(null); onClose(); };

  // Auto-fill defaults based on exercise
  const repsPlaceholder = isTime ? '—' : isBand ? '6-8' : trackingType === 'bodyweight_reps' ? '8-12' : '8-12';
  const repsLabel = isTime ? 'Duração alvo (s)' : 'Reps alvo';

  return (
    <AnimatePresence>
      {open && exercise && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50" onClick={handleClose} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[88vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-border rounded-full" /></div>
            <div className="px-4 pb-10">
              <div className="flex items-center justify-between py-3">
                <div>
                  <h2 className="font-bold text-base">Adicionar à Rotina</h2>
                  <p className="text-xs text-muted-foreground truncate">{exercise.name}</p>
                </div>
                <button onClick={handleClose} className="p-2 rounded-xl bg-muted/40">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {success ? (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center py-8 gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-success/20 border border-success/40 flex items-center justify-center">
                    <Check className="w-8 h-8 text-success" />
                  </div>
                  <p className="font-bold text-success">Adicionado!</p>
                </motion.div>
              ) : (
                <>
                  {/* Routine picker */}
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Escolha a rotina</p>
                  {(routines || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center bg-muted/20 rounded-xl">
                      Crie uma rotina primeiro em "Minha Rotina"
                    </p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {(routines || []).map(r => (
                        <button key={r.id} onClick={() => setSelectedRoutine(r.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                            ${selectedRoutine === r.id ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted/20'}`}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                            ${selectedRoutine === r.id ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                            {selectedRoutine === r.id && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{r.name}</p>
                            <div className="flex items-center gap-2">
                              {r.is_active && <span className="text-[10px] text-primary font-bold">Ativa</span>}
                              {r.created_by === 'jota' && <span className="text-[10px] text-gold font-bold">⭐ Jota</span>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Basic config */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Séries</label>
                      <input value={sets} onChange={e => setSets(e.target.value)} type="number"
                        className="w-full bg-muted/20 border border-border rounded-xl px-2 py-2 text-sm text-center outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">{repsLabel}</label>
                      <input value={isTime ? duration : reps}
                        onChange={e => isTime ? setDuration(e.target.value) : setReps(e.target.value)}
                        placeholder={repsPlaceholder}
                        className="w-full bg-muted/20 border border-border rounded-xl px-2 py-2 text-sm text-center outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Desc. (s)</label>
                      <input value={rest} onChange={e => setRest(e.target.value)} type="number"
                        className="w-full bg-muted/20 border border-border rounded-xl px-2 py-2 text-sm text-center outline-none focus:border-primary/50" />
                    </div>
                  </div>

                  {/* Band selector */}
                  {isBand && (
                    <div className="mb-3">
                      <label className="text-[10px] text-muted-foreground block mb-1.5">Elástico planejado</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {BAND_OPTIONS.map(b => (
                          <button key={b.key} onClick={() => setBand(band === b.key ? '' : b.key)}
                            className={`text-[10px] font-bold py-2 rounded-xl border transition-all
                              ${band === b.key ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-card border-border text-muted-foreground'}`}>
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weight (for weighted) */}
                  {trackingType === 'weight_reps' && (
                    <div className="mb-3">
                      <label className="text-[10px] text-muted-foreground block mb-1">Carga alvo (kg) — opcional</label>
                      <input value={weight} onChange={e => setWeight(e.target.value)} type="number" step="0.5"
                        placeholder="Ex: 20"
                        className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50" />
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mb-4">
                    <label className="text-[10px] text-muted-foreground block mb-1">Observações (opcional)</label>
                    <input value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Ex: manter escápulas ativas..."
                      className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50" />
                  </div>

                  <button
                    onClick={() => addMutation.mutate()}
                    disabled={!selectedRoutine || addMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-4 rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-40"
                  >
                    <Plus className="w-5 h-5" />
                    {addMutation.isPending ? 'Adicionando...' : 'Adicionar à Rotina'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}