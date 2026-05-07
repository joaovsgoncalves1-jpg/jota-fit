/**
 * ExecutarTreino — Treino em andamento
 * Modelo: Routine → RoutineExercise → WorkoutSession → SetLog → ExercisePersonalRecord
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { detectPR, buildPRRecord } from '@/lib/prDetection';
import { ArrowLeft, CheckCircle, Plus, Minus, Copy, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────
const TRACKING_META = {
  weight_reps:         { labelA: 'kg',       labelB: 'reps',    step: 2.5 },
  bodyweight_reps:     { labelA: null,        labelB: 'reps',    step: 1   },
  assisted_bodyweight: { labelA: 'elástico',  labelB: 'reps',    step: 1   },
  hold_time:           { labelA: null,        labelB: 'seg',     step: 5   },
  time_distance:       { labelA: 'km',        labelB: 'min',     step: 0.1 },
  unilateral:          { labelA: 'kg',        labelB: 'reps',    step: 2.5 },
};

const BAND_LEVELS = ['muito_forte', 'forte', 'medio', 'leve'];
const BAND_LABEL  = { muito_forte: 'Muito forte', forte: 'Forte', medio: 'Médio', leve: 'Leve' };

// XP formula: base por série + bônus por volume
function calcXP(setCount, volumeKg) {
  return Math.min(300, Math.max(50, Math.round(setCount * 7 + volumeKg * 0.05)));
}

// ─── RestTimer ────────────────────────────────────────────────────────────────
function RestTimer({ seconds, onDone }) {
  const [rem, setRem] = useState(seconds);
  useEffect(() => {
    if (rem <= 0) { onDone(); return; }
    const t = setTimeout(() => setRem(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [rem]);
  const pct = ((seconds - rem) / seconds) * 100;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
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
            <span className="font-display font-black text-3xl text-primary">{rem}</span>
          </div>
        </div>
        <button onClick={onDone} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Pular descanso
        </button>
      </div>
    </motion.div>
  );
}

// ─── PRToast ─────────────────────────────────────────────────────────────────
function PRToast({ exerciseName, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return (
    <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gold/20 border border-gold/40 text-gold font-bold text-sm px-4 py-2.5 rounded-2xl shadow-xl">
      <Trophy className="w-4 h-4" /> PR! {exerciseName}
    </motion.div>
  );
}

// ─── SetRow ───────────────────────────────────────────────────────────────────
function SetRow({ set, index, trackingType, onUpdate, onCopyLast, hasLast, isCompleted, isPR }) {
  const meta = TRACKING_META[trackingType] || TRACKING_META.weight_reps;

  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all
      ${isCompleted
        ? isPR ? 'bg-gold/10 border border-gold/30' : 'bg-success/10 border border-success/20'
        : 'bg-muted/20 border border-border/40'}`}>

      <span className={`font-display font-black text-sm w-6 shrink-0
        ${isCompleted ? (isPR ? 'text-gold' : 'text-success') : 'text-primary'}`}>
        {isCompleted ? (isPR ? '🏆' : '✓') : index + 1}
      </span>

      {/* Value A: weight / band */}
      {meta.labelA && (
        <div className="flex items-center gap-1 flex-1">
          {trackingType === 'assisted_bodyweight' ? (
            <select value={set.band || ''} onChange={e => onUpdate({ ...set, band: e.target.value })}
              disabled={isCompleted}
              className="w-full bg-transparent border border-border/60 rounded-lg px-2 py-1 text-xs outline-none disabled:opacity-60">
              <option value="">Sem elástico</option>
              {BAND_LEVELS.map(b => <option key={b} value={b}>{BAND_LABEL[b]}</option>)}
            </select>
          ) : (
            <>
              <button disabled={isCompleted} onClick={() => onUpdate({ ...set, valueA: Math.max(0, (set.valueA || 0) - meta.step) })}
                className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40">
                <Minus className="w-3 h-3" />
              </button>
              <input type="number" step={meta.step} value={set.valueA ?? ''} disabled={isCompleted}
                onChange={e => onUpdate({ ...set, valueA: parseFloat(e.target.value) || 0 })}
                placeholder={meta.labelA}
                className="w-16 text-center bg-transparent border border-border/60 rounded-lg py-1 text-sm font-bold outline-none focus:border-primary/50 disabled:opacity-60" />
              <button disabled={isCompleted} onClick={() => onUpdate({ ...set, valueA: (set.valueA || 0) + meta.step })}
                className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40">
                <Plus className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Value B: reps / time */}
      <div className="flex items-center gap-1 flex-1">
        <button disabled={isCompleted} onClick={() => onUpdate({ ...set, valueB: Math.max(0, (set.valueB || 0) - 1) })}
          className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40">
          <Minus className="w-3 h-3" />
        </button>
        <input type="number" value={set.valueB ?? ''} disabled={isCompleted}
          onChange={e => onUpdate({ ...set, valueB: parseInt(e.target.value) || 0 })}
          placeholder={meta.labelB}
          className="w-14 text-center bg-transparent border border-border/60 rounded-lg py-1 text-sm font-bold outline-none focus:border-primary/50 disabled:opacity-60" />
        <button disabled={isCompleted} onClick={() => onUpdate({ ...set, valueB: (set.valueB || 0) + 1 })}
          className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40">
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {hasLast && !isCompleted && (
        <button onClick={onCopyLast} title="Copiar da última sessão"
          className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0">
          <Copy className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── ExerciseBlock ────────────────────────────────────────────────────────────
function ExerciseBlock({ routineExercise, exercise, sessionId, studentEmail, allHistoricalSets, onPR }) {
  const queryClient = useQueryClient();
  const trackingType = exercise?.tracking_type || 'weight_reps';
  const targetSets = routineExercise.sets || 3;
  const restSec = routineExercise.rest_seconds || exercise?.rest_seconds || 90;

  const [sets, setSets] = useState(() =>
    Array.from({ length: targetSets }, (_, i) => ({
      id: i,
      valueA: routineExercise.target_weight_kg || 0,
      valueB: 0,
      band: routineExercise.band_assistance_level || '',
    }))
  );
  const [completedSets, setCompletedSets] = useState([]); // array of { index, isPR }
  const [showRest, setShowRest] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Historical sets for this exercise (for PR detection & "last session" hint)
  const historicalSets = useMemo(
    () => (allHistoricalSets || []).filter(s => s.exercise_id === exercise?.id),
    [allHistoricalSets, exercise?.id]
  );

  // Group by session to find "last session" sets
  const lastSessionSets = useMemo(() => {
    if (!historicalSets.length) return null;
    const sorted = [...historicalSets].sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
    const lastSessionId = sorted[0]?.session_id;
    return historicalSets
      .filter(s => s.session_id === lastSessionId)
      .sort((a, b) => a.set_number - b.set_number);
  }, [historicalSets]);

  const logSetMutation = useMutation({
    mutationFn: async (setData) => {
      // Build SetLog payload
      const payload = {
        session_id: sessionId,
        student_email: studentEmail,
        exercise_id: exercise?.id,
        exercise_name: exercise?.name,
        set_number: setData.setIndex + 1,
        completed: true,
      };

      if (['weight_reps', 'unilateral'].includes(trackingType)) {
        payload.weight_kg = setData.valueA || 0;
        payload.reps = setData.valueB || 0;
      } else if (['bodyweight_reps', 'assisted_bodyweight'].includes(trackingType)) {
        payload.reps = setData.valueB || 0;
        payload.band_assistance_level = setData.band || undefined;
      } else if (trackingType === 'hold_time') {
        payload.duration_seconds = setData.valueB || 0;
      } else if (trackingType === 'time_distance') {
        payload.duration_seconds = (setData.valueB || 0) * 60;
        payload.weight_kg = setData.valueA || 0; // distance
      }

      // Detect PR before saving (compare against all historical)
      const prResult = detectPR(payload, historicalSets, trackingType);

      if (prResult?.isPR) {
        payload.is_pr = true;
        payload.pr_type = prResult.prType;
      }

      const savedSet = await base44.entities.SetLog.create(payload);

      // Save PR record
      if (prResult?.isPR && sessionId) {
        await base44.entities.ExercisePersonalRecord.create(
          buildPRRecord({
            studentEmail,
            exerciseId: exercise?.id,
            exerciseName: exercise?.name,
            set: payload,
            prResult,
            sessionId,
            trackingType,
          })
        );
      }

      return { savedSet, isPR: prResult?.isPR || false };
    },
    onSuccess: ({ isPR }) => {
      queryClient.invalidateQueries({ queryKey: ['historical-sets', studentEmail] });
      if (isPR) onPR(exercise?.name);
    },
  });

  const completeSet = (setIndex) => {
    if (!sessionId) return;
    const s = sets[setIndex];
    logSetMutation.mutate(
      { ...s, setIndex },
      {
        onSuccess: ({ isPR }) => {
          setCompletedSets(prev => [...prev, { index: setIndex, isPR }]);
          if (setIndex < sets.length - 1) setShowRest(true);
        },
      }
    );
  };

  const completedIndexes = completedSets.map(c => c.index);
  const allDone = completedIndexes.length >= sets.length;

  const lastSessionHint = lastSessionSets
    ? lastSessionSets
        .map(s => {
          if (s.weight_kg && s.reps) return `${s.weight_kg}kg×${s.reps}`;
          if (s.reps) return `${s.reps} reps`;
          if (s.duration_seconds) return `${s.duration_seconds}s`;
          return null;
        })
        .filter(Boolean)
        .join(' | ')
    : null;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all
      ${allDone ? 'border-success/30 bg-success/5' : 'border-border bg-card'}`}>

      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
          ${allDone ? 'bg-success/20' : 'bg-primary/15'}`}>
          {allDone
            ? <CheckCircle className="w-5 h-5 text-success" />
            : <span className="text-base">{trackingType === 'hold_time' ? '⏱' : '🏋️'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{exercise?.name || 'Exercício'}</p>
          <p className="text-[11px] text-muted-foreground">
            {completedIndexes.length}/{sets.length} séries
            {routineExercise.target_reps ? ` · ${routineExercise.target_reps}` : ''}
          </p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              {lastSessionHint && (
                <div className="text-[10px] text-muted-foreground bg-muted/20 rounded-lg px-3 py-1.5">
                  Última vez: {lastSessionHint}
                </div>
              )}

              {sets.map((set, i) => {
                const completion = completedSets.find(c => c.index === i);
                const isCompleted = !!completion;
                const isPR = completion?.isPR || false;
                return (
                  <div key={set.id} className="space-y-1">
                    <SetRow
                      set={set} index={i} trackingType={trackingType}
                      isCompleted={isCompleted} isPR={isPR}
                      hasLast={!!lastSessionSets?.[i]}
                      onUpdate={updated => setSets(prev => prev.map((s, si) => si === i ? updated : s))}
                      onCopyLast={() => {
                        const last = lastSessionSets?.[i];
                        if (!last) return;
                        setSets(prev => prev.map((s, si) => si === i ? {
                          ...s,
                          valueA: last.weight_kg || 0,
                          valueB: last.reps || last.duration_seconds || 0,
                          band: last.band_assistance_level || '',
                        } : s));
                      }}
                    />
                    {!isCompleted && (
                      <button
                        onClick={() => completeSet(i)}
                        disabled={logSetMutation.isPending || !sessionId}
                        className="w-full text-xs font-bold py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-40">
                        ✓ Concluir série {i + 1}
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => setSets(prev => [...prev, {
                  id: Date.now(),
                  valueA: prev[prev.length - 1]?.valueA || 0,
                  valueB: 0, band: '',
                }])}
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

      {showRest && <RestTimer seconds={restSec} onDone={() => setShowRest(false)} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExecutarTreino() {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const [sessionId, setSessionId] = useState(null);
  const sessionCreated = useRef(false);
  const startTime = useRef(new Date());
  const [finishing, setFinishing] = useState(false);
  const [prQueue, setPrQueue] = useState([]); // exercise names with new PRs

  // ── Data queries ──
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

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
    select: d => d?.[0],
  });

  // All historical SetLogs for this student — used for PR detection across all exercises
  const { data: allHistoricalSets } = useQuery({
    queryKey: ['historical-sets', user?.email],
    queryFn: () => base44.entities.SetLog.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  // ── Create session once routine name is available ──
  useEffect(() => {
    if (!user?.email || !routineId || !routine || sessionCreated.current) return;
    sessionCreated.current = true;
    base44.entities.WorkoutSession.create({
      student_email: user.email,
      routine_id: routineId,
      routine_name: routine.name,
      started_at: new Date().toISOString(),
      status: 'in_progress',
    }).then(s => setSessionId(s.id));
  }, [user?.email, routineId, routine]);

  // ── Finish workout ──
  const finishMutation = useMutation({
    mutationFn: async () => {
      const durationMinutes = Math.round((new Date() - startTime.current) / 60000);
      const setLogs = await base44.entities.SetLog.filter({ session_id: sessionId });
      const totalVolume = setLogs.reduce((acc, s) => acc + ((s.weight_kg || 0) * (s.reps || 1)), 0);
      const prsCount = setLogs.filter(s => s.is_pr).length;
      const xpEarned = calcXP(setLogs.length, totalVolume) + prsCount * 25;

      await base44.entities.WorkoutSession.update(sessionId, {
        finished_at: new Date().toISOString(),
        status: 'completed',
        duration_minutes: durationMinutes,
        total_volume_kg: Math.round(totalVolume),
        sets_completed: setLogs.length,
        exercises_completed: (routineExercises || []).length,
        xp_earned: xpEarned,
        prs_count: prsCount,
      });

      if (profile?.id) {
        await base44.entities.StudentProfile.update(profile.id, {
          xp_total: (profile.xp_total || 0) + xpEarned,
        });
      }

      return { xpEarned, prsCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      navigate('/rotina');
    },
  });

  const handlePR = (exerciseName) => {
    setPrQueue(prev => [...prev, exerciseName]);
  };

  const sortedExercises = useMemo(
    () => [...(routineExercises || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [routineExercises]
  );

  if (!routine) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* PR Toast Queue */}
      <AnimatePresence>
        {prQueue[0] && (
          <PRToast key={prQueue[0] + prQueue.length} exerciseName={prQueue[0]}
            onDone={() => setPrQueue(prev => prev.slice(1))} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-black text-base truncate">{routine.name}</h1>
          <p className="text-[11px] text-muted-foreground">
            {sortedExercises.length} exercícios
            {!sessionId && <span className="text-muted-foreground/60"> · iniciando…</span>}
          </p>
        </div>
        <button
          onClick={() => { setFinishing(true); finishMutation.mutate(); }}
          disabled={finishMutation.isPending || finishing || !sessionId}
          className="flex items-center gap-1.5 bg-success/20 text-success border border-success/30 text-xs font-bold px-3 py-2 rounded-xl hover:bg-success/30 transition-all disabled:opacity-50">
          <CheckCircle className="w-3.5 h-3.5" />
          {finishing ? 'Salvando…' : 'Finalizar'}
        </button>
      </div>

      {/* Exercise List */}
      <div className="p-4 space-y-3 pb-16">
        {sortedExercises.map(re => {
          const ex = exercises?.find(e => e.id === re.exercise_id);
          return (
            <ExerciseBlock
              key={re.id}
              routineExercise={re}
              exercise={ex}
              sessionId={sessionId}
              studentEmail={user?.email}
              allHistoricalSets={allHistoricalSets}
              onPR={handlePR}
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