import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { format } from 'date-fns';
import { ArrowLeft, Play, CheckCircle, Plus, Minus, Copy, Timer, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TRACKING_LABEL = {
  weight_reps: { a: 'kg', b: 'reps' },
  bodyweight_reps: { a: null, b: 'reps' },
  assisted_bodyweight: { a: 'elástico', b: 'reps' },
  hold_time: { a: null, b: 'segundos' },
  time_distance: { a: 'km', b: 'minutos' },
  unilateral: { a: 'kg', b: 'reps/lado' },
};

const BAND_LEVELS = ['muito_forte', 'forte', 'medio', 'leve'];
const BAND_LABEL = { muito_forte: 'Muito forte', forte: 'Forte', medio: 'Médio', leve: 'Leve' };

function RestTimer({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onDone(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const pct = ((seconds - remaining) / seconds) * 100;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl p-8 flex flex-col items-center gap-4 w-64">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descanso</p>
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display font-black text-3xl text-primary">{remaining}</span>
          </div>
        </div>
        <button onClick={onDone} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Pular descanso
        </button>
      </div>
    </motion.div>
  );
}

function SetRow({ set, index, trackingType, onUpdate, onCopyLast, lastSet, isCompleted }) {
  const tracking = TRACKING_LABEL[trackingType] || TRACKING_LABEL.weight_reps;

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all
        ${isCompleted ? 'bg-success/10 border border-success/20' : 'bg-muted/20 border border-border/40'}`}>
      <span className={`font-display font-black text-sm w-6 shrink-0 ${isCompleted ? 'text-success' : 'text-primary'}`}>
        {isCompleted ? '✓' : index + 1}
      </span>

      {tracking.a && (
        <div className="flex items-center gap-1 flex-1">
          {trackingType === 'assisted_bodyweight' ? (
            <select value={set.band || ''} onChange={e => onUpdate({ ...set, band: e.target.value })}
              className="w-full bg-transparent border border-border/60 rounded-lg px-2 py-1 text-xs outline-none">
              <option value="">Sem elástico</option>
              {BAND_LEVELS.map(b => <option key={b} value={b}>{BAND_LABEL[b]}</option>)}
            </select>
          ) : (
            <>
              <button onClick={() => onUpdate({ ...set, valueA: Math.max(0, (set.valueA || 0) - (trackingType === 'hold_time' ? 5 : 2.5)) })}
                className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <Minus className="w-3 h-3" />
              </button>
              <input type="number" step="0.5" value={set.valueA || ''}
                onChange={e => onUpdate({ ...set, valueA: parseFloat(e.target.value) || 0 })}
                placeholder={tracking.a}
                className="w-16 text-center bg-transparent border border-border/60 rounded-lg py-1 text-sm font-bold outline-none focus:border-primary/50" />
              <button onClick={() => onUpdate({ ...set, valueA: (set.valueA || 0) + (trackingType === 'hold_time' ? 5 : 2.5) })}
                className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <Plus className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 flex-1">
        <button onClick={() => onUpdate({ ...set, valueB: Math.max(0, (set.valueB || 0) - 1) })}
          className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground">
          <Minus className="w-3 h-3" />
        </button>
        <input type="number" value={set.valueB || ''}
          onChange={e => onUpdate({ ...set, valueB: parseInt(e.target.value) || 0 })}
          placeholder={tracking.b}
          className="w-14 text-center bg-transparent border border-border/60 rounded-lg py-1 text-sm font-bold outline-none focus:border-primary/50" />
        <button onClick={() => onUpdate({ ...set, valueB: (set.valueB || 0) + 1 })}
          className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground">
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {lastSet && !isCompleted && (
        <button onClick={onCopyLast} title="Copiar última série"
          className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0">
          <Copy className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
}

function ExerciseBlock({ routineExercise, exercise, sessionId, studentEmail, restSeconds }) {
  const queryClient = useQueryClient();
  const trackingType = exercise?.tracking_type || 'weight_reps';
  const targetSets = routineExercise.sets || 3;
  const [sets, setSets] = useState(() =>
    Array.from({ length: targetSets }, (_, i) => ({ id: i, valueA: routineExercise.target_weight_kg || 0, valueB: 0, band: routineExercise.band_assistance_level || '' }))
  );
  const [completedSets, setCompletedSets] = useState([]);
  const [showRest, setShowRest] = useState(false);
  const [restDur, setRestDur] = useState(restSeconds || exercise?.rest_seconds || 90);
  const [expanded, setExpanded] = useState(true);

  const { data: lastSetsData } = useQuery({
    queryKey: ['last-sets', studentEmail, exercise?.id],
    queryFn: () => base44.entities.SetLog.filter({ student_email: studentEmail, exercise_id: exercise?.id }),
    enabled: !!exercise?.id && !!studentEmail,
  });

  const lastSession = useMemo(() => {
    if (!lastSetsData?.length) return null;
    const sorted = [...lastSetsData].sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
    const lastId = sorted[0]?.session_id;
    return lastSetsData.filter(s => s.session_id === lastId).sort((a, b) => a.set_number - b.set_number);
  }, [lastSetsData]);

  const logSetMutation = useMutation({
    mutationFn: (setData) => base44.entities.SetLog.create({
      session_id: sessionId,
      student_email: studentEmail,
      exercise_id: exercise?.id,
      exercise_name: exercise?.name,
      set_number: setData.setIndex + 1,
      weight_kg: trackingType === 'weight_reps' ? setData.valueA : undefined,
      reps: ['weight_reps', 'bodyweight_reps', 'assisted_bodyweight', 'unilateral'].includes(trackingType) ? setData.valueB : undefined,
      duration_seconds: ['hold_time', 'time_distance'].includes(trackingType) ? setData.valueA : undefined,
      band_assistance_level: setData.band || undefined,
      completed: true,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['last-sets'] }),
  });

  const completeSet = (setIndex) => {
    const s = sets[setIndex];
    logSetMutation.mutate({ ...s, setIndex });
    setCompletedSets(prev => [...prev, setIndex]);
    if (setIndex < sets.length - 1) setShowRest(true);
  };

  const allDone = completedSets.length >= sets.length;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${allDone ? 'border-success/30 bg-success/5' : 'border-border bg-card'}`}>
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${allDone ? 'bg-success/20' : 'bg-primary/15'}`}>
          {allDone ? <CheckCircle className="w-5 h-5 text-success" /> : <span className="text-base">{exercise?.tracking_type === 'hold_time' ? '⏱' : '🏋️'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{exercise?.name || 'Exercício'}</p>
          <p className="text-[11px] text-muted-foreground">
            {completedSets.length}/{sets.length} séries · {routineExercise.target_reps || routineExercise.reps || '—'}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              {/* Last session hint */}
              {lastSession && (
                <div className="text-[10px] text-muted-foreground bg-muted/20 rounded-lg px-3 py-1.5">
                  Última vez: {lastSession.map(s => `${s.weight_kg ? s.weight_kg + 'kg × ' : ''}${s.reps || s.duration_seconds + 's'}`).join(' | ')}
                </div>
              )}

              {sets.map((set, i) => (
                <div key={set.id} className="space-y-1">
                  <SetRow
                    set={set} index={i} trackingType={trackingType}
                    onUpdate={updated => setSets(prev => prev.map((s, si) => si === i ? updated : s))}
                    onCopyLast={() => {
                      if (lastSession?.[i]) {
                        setSets(prev => prev.map((s, si) => si === i ? {
                          ...s,
                          valueA: lastSession[i].weight_kg || lastSession[i].duration_seconds || 0,
                          valueB: lastSession[i].reps || 0,
                          band: lastSession[i].band_assistance_level || '',
                        } : s));
                      }
                    }}
                    lastSet={lastSession?.[i]}
                    isCompleted={completedSets.includes(i)}
                  />
                  {!completedSets.includes(i) && (
                    <button onClick={() => completeSet(i)}
                      className="w-full text-xs font-bold py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all">
                      ✓ Concluir série {i + 1}
                    </button>
                  )}
                </div>
              ))}

              {/* Add set */}
              <button onClick={() => setSets(prev => [...prev, { id: Date.now(), valueA: prev[prev.length - 1]?.valueA || 0, valueB: 0, band: '' }])}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1">
                <Plus className="w-3 h-3" /> Adicionar série
              </button>

              {routineExercise.notes && (
                <p className="text-xs text-muted-foreground italic px-1">{routineExercise.notes}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showRest && (
        <RestTimer seconds={restDur} onDone={() => setShowRest(false)} />
      )}
    </div>
  );
}

export default function ExecutarTreino() {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState(null);
  const [startTime] = useState(new Date());
  const [finishing, setFinishing] = useState(false);

  const { data: routine } = useQuery({
    queryKey: ['routine', routineId],
    queryFn: () => base44.entities.Routine.filter({ id: routineId }),
    enabled: !!routineId,
    select: d => d?.[0],
  });

  const { data: routineExercises } = useQuery({
    queryKey: ['routine-exercises', routineId],
    queryFn: () => base44.entities.RoutineExercise.filter({ routine_id: routineId }),
    enabled: !!routineId,
  });

  const { data: exercises } = useQuery({
    queryKey: ['all-exercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
    select: d => d?.[0],
  });

  // Create session on mount
  useEffect(() => {
    if (!user?.email || !routineId) return;
    base44.entities.WorkoutSession.create({
      student_email: user.email,
      routine_id: routineId,
      routine_name: routine?.name || 'Treino',
      started_at: new Date().toISOString(),
      status: 'in_progress',
    }).then(s => setSessionId(s.id));
  }, [user?.email, routineId]);

  const finishMutation = useMutation({
    mutationFn: async () => {
      const durationMinutes = Math.round((new Date() - startTime) / 60000);
      const setLogs = await base44.entities.SetLog.filter({ session_id: sessionId });
      const totalVolume = setLogs.reduce((acc, s) => acc + ((s.weight_kg || 0) * (s.reps || 1)), 0);
      const xpEarned = Math.min(200, Math.max(50, Math.round(setLogs.length * 8)));

      await base44.entities.WorkoutSession.update(sessionId, {
        finished_at: new Date().toISOString(),
        status: 'completed',
        duration_minutes: durationMinutes,
        total_volume_kg: Math.round(totalVolume),
        sets_completed: setLogs.length,
        exercises_completed: (routineExercises || []).length,
        xp_earned: xpEarned,
      });

      if (profile?.id) {
        await base44.entities.StudentProfile.update(profile.id, {
          xp_total: (profile.xp_total || 0) + xpEarned,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      navigate('/rotina');
    },
  });

  const sortedExercises = useMemo(() =>
    [...(routineExercises || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [routineExercises]
  );

  if (!routine) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-black text-base truncate">{routine.name}</h1>
          <p className="text-[11px] text-muted-foreground">{sortedExercises.length} exercícios</p>
        </div>
        <button
          onClick={() => { setFinishing(true); finishMutation.mutate(); }}
          disabled={finishMutation.isPending || finishing || !sessionId}
          className="flex items-center gap-1.5 bg-success/20 text-success border border-success/30 text-xs font-bold px-3 py-2 rounded-xl hover:bg-success/30 transition-all disabled:opacity-50">
          <CheckCircle className="w-3.5 h-3.5" />
          {finishing ? 'Salvando...' : 'Finalizar'}
        </button>
      </div>

      {/* Exercise list */}
      <div className="p-4 space-y-3 pb-12">
        {sortedExercises.map((re) => {
          const ex = exercises?.find(e => e.id === re.exercise_id);
          return (
            <ExerciseBlock
              key={re.id}
              routineExercise={re}
              exercise={ex}
              sessionId={sessionId}
              studentEmail={user?.email}
              restSeconds={re.rest_seconds || ex?.rest_seconds || 90}
            />
          );
        })}

        {sortedExercises.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">Nenhum exercício nesta rotina.</p>
            <button onClick={() => navigate('/biblioteca')}
              className="mt-3 text-primary text-sm font-bold hover:underline">
              Adicionar da Biblioteca →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}