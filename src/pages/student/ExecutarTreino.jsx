import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { format } from 'date-fns';
import { CheckCircle, ChevronLeft, Timer, Play, Pause, SkipForward, Trophy, Plus, Minus, Info, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Determine tracking type for display
function getTrackingType(re, ex) {
  if (re?.tracking_type) return re.tracking_type;
  if (ex?.tracking_type) return ex.tracking_type;
  if (ex?.uses_band) return 'assisted_bodyweight';
  if (ex?.exercise_type === 'calistenia') return 'bodyweight_reps';
  return 'weight_reps';
}

function SetInputRow({ setNum, trackingType, lastSet, onComplete }) {
  const [weight, setWeight] = useState(lastSet?.weight_kg?.toString() || '');
  const [reps, setReps] = useState(lastSet?.reps?.toString() || '');
  const [duration, setDuration] = useState(lastSet?.duration_seconds?.toString() || '');
  const [band, setBand] = useState(lastSet?.band_assistance_level || 'medio');
  const [done, setDone] = useState(false);

  const handleDone = () => {
    setDone(true);
    onComplete({
      set_number: setNum,
      weight_kg: parseFloat(weight) || undefined,
      reps: parseInt(reps) || undefined,
      duration_seconds: parseInt(duration) || undefined,
      band_assistance_level: trackingType === 'assisted_bodyweight' ? band : undefined,
    });
  };

  const BAND_OPTIONS = [
    { key: 'muito_forte', label: 'Muito forte', color: 'text-red-400' },
    { key: 'forte', label: 'Forte', color: 'text-orange-400' },
    { key: 'medio', label: 'Médio', color: 'text-yellow-400' },
    { key: 'leve', label: 'Leve', color: 'text-green-400' },
  ];

  if (done) {
    return (
      <div className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-xl p-3">
        <CheckCircle className="w-5 h-5 text-success shrink-0" />
        <div className="flex-1 text-sm font-bold text-success">
          Série {setNum}:
          {trackingType === 'weight_reps' && weight && reps && ` ${weight}kg × ${reps}`}
          {trackingType === 'bodyweight_reps' && reps && ` ${reps} reps`}
          {trackingType === 'assisted_bodyweight' && ` Elástico ${band} × ${reps || '—'}`}
          {trackingType === 'hold_time' && duration && ` ${duration}s`}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/20 border border-border rounded-xl p-3 space-y-3">
      <p className="text-xs font-bold text-muted-foreground">Série {setNum}</p>

      {/* Weight + Reps */}
      {trackingType === 'weight_reps' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Carga (kg)</label>
            <div className="flex items-center gap-1">
              <button onClick={() => setWeight(w => Math.max(0, parseFloat(w || 0) - 2.5).toString())} className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input value={weight} onChange={e => setWeight(e.target.value)} type="number" step="0.5"
                className="flex-1 bg-card border border-border rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-primary/50" />
              <button onClick={() => setWeight(w => (parseFloat(w || 0) + 2.5).toString())} className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Reps</label>
            <div className="flex items-center gap-1">
              <button onClick={() => setReps(r => Math.max(0, parseInt(r || 0) - 1).toString())} className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input value={reps} onChange={e => setReps(e.target.value)} type="number"
                className="flex-1 bg-card border border-border rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-primary/50" />
              <button onClick={() => setReps(r => (parseInt(r || 0) + 1).toString())} className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bodyweight reps */}
      {trackingType === 'bodyweight_reps' && (
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Reps</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setReps(r => Math.max(0, parseInt(r || 0) - 1).toString())} className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
              <Minus className="w-4 h-4" />
            </button>
            <input value={reps} onChange={e => setReps(e.target.value)} type="number"
              className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-lg text-center font-bold outline-none focus:border-primary/50" />
            <button onClick={() => setReps(r => (parseInt(r || 0) + 1).toString())} className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Assisted (band) */}
      {trackingType === 'assisted_bodyweight' && (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Elástico</label>
            <div className="grid grid-cols-4 gap-1">
              {BAND_OPTIONS.map(b => (
                <button key={b.key} onClick={() => setBand(b.key)}
                  className={`text-[10px] font-bold py-1.5 rounded-lg border transition-all
                    ${band === b.key ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-card border-border text-muted-foreground'}`}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Reps</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setReps(r => Math.max(0, parseInt(r || 0) - 1).toString())} className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
                <Minus className="w-4 h-4" />
              </button>
              <input value={reps} onChange={e => setReps(e.target.value)} type="number"
                className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-lg text-center font-bold outline-none focus:border-primary/50" />
              <button onClick={() => setReps(r => (parseInt(r || 0) + 1).toString())} className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold time */}
      {trackingType === 'hold_time' && (
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Tempo (segundos)</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setDuration(d => Math.max(0, parseInt(d || 0) - 5).toString())} className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
              <Minus className="w-4 h-4" />
            </button>
            <input value={duration} onChange={e => setDuration(e.target.value)} type="number"
              className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-lg text-center font-bold outline-none focus:border-primary/50" />
            <button onClick={() => setDuration(d => (parseInt(d || 0) + 5).toString())} className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <button onClick={handleDone}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-all">
        <CheckCircle className="w-4 h-4" /> Registrar série
      </button>
    </div>
  );
}

function RestTimer({ seconds, onSkip }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(t);
  }, []);
  const pct = Math.max(0, (remaining / seconds) * 100);
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  if (remaining <= 0) return null;
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto bg-card border border-primary/40 rounded-2xl p-4 shadow-2xl flex items-center gap-4 z-50"
    >
      <div className="relative w-14 h-14 shrink-0">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
            strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display font-black text-xs text-primary">
          {min > 0 ? `${min}:${String(sec).padStart(2, '0')}` : sec}
        </span>
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm">Descanso</p>
        <p className="text-xs text-muted-foreground">Próxima série em breve</p>
      </div>
      <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground font-bold px-3 py-2 rounded-lg bg-muted/30">
        Pular
      </button>
    </motion.div>
  );
}

export default function ExecutarTreino() {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const startTime = useRef(new Date());
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [setLogs, setSetLogs] = useState({}); // { routineExId: [setData...] }
  const [showRest, setShowRest] = useState(false);
  const [restSecs, setRestSecs] = useState(60);
  const [done, setDone] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);

  const { data: routine } = useQuery({
    queryKey: ['routine', routineId],
    queryFn: async () => {
      const list = await base44.entities.Routine.filter({ id: routineId });
      return list?.[0] || null;
    },
    enabled: !!routineId,
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
  });

  // Last session logs for reference
  const { data: recentSets } = useQuery({
    queryKey: ['recent-sets', user?.email],
    queryFn: () => base44.entities.SetLog.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const myProfile = profile?.[0];
  const sortedExercises = [...(routineExercises || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  const getLastSetsForExercise = (exerciseId) => {
    if (!recentSets) return [];
    const sets = recentSets.filter(s => s.exercise_id === exerciseId).sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
    if (sets.length === 0) return [];
    const latestSession = sets[0].session_id;
    return sets.filter(s => s.session_id === latestSession).sort((a, b) => a.set_number - b.set_number);
  };

  const handleSetComplete = (routineExId, exerciseId, setData) => {
    setSetLogs(prev => {
      const existing = prev[routineExId] || [];
      return { ...prev, [routineExId]: [...existing, setData] };
    });
    // Trigger rest timer
    const re = sortedExercises.find(r => r.id === routineExId);
    if (re?.rest_seconds) {
      setRestSecs(re.rest_seconds);
      setShowRest(true);
    }
  };

  const finishMutation = useMutation({
    mutationFn: async () => {
      const finishedAt = new Date();
      const durationMinutes = Math.round((finishedAt - startTime.current) / 60000);

      // Calculate totals
      let totalVolume = 0;
      let setsCompleted = 0;
      const allSets = Object.values(setLogs).flat();
      allSets.forEach(s => {
        setsCompleted++;
        if (s.weight_kg && s.reps) totalVolume += s.weight_kg * s.reps;
      });

      const xp = 100 + setsCompleted * 8 + Math.round(durationMinutes * 0.5);

      // Create session
      const session = await base44.entities.WorkoutSession.create({
        student_email: user.email,
        routine_id: routineId,
        routine_name: routine?.name,
        started_at: startTime.current.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration_minutes: durationMinutes,
        status: 'completed',
        total_volume_kg: Math.round(totalVolume),
        exercises_completed: sortedExercises.filter(re => setLogs[re.id]?.length > 0).length,
        sets_completed: setsCompleted,
        xp_earned: xp,
      });

      // Create set logs
      const prsFound = [];
      for (const [routineExId, sets] of Object.entries(setLogs)) {
        const re = sortedExercises.find(r => r.id === routineExId);
        if (!re) continue;
        for (const s of sets) {
          await base44.entities.SetLog.create({
            ...s,
            session_id: session.id,
            student_email: user.email,
            exercise_id: re.exercise_id,
            exercise_name: exercises?.find(e => e.id === re.exercise_id)?.name,
          });
        }
        // Simple PR check: max weight for this exercise
        if (sets.some(s => s.weight_kg)) {
          const maxW = Math.max(...sets.map(s => s.weight_kg || 0));
          const maxRepsAtMax = Math.max(...sets.filter(s => s.weight_kg === maxW).map(s => s.reps || 0));
          // Check if this beats existing PRs
          const existingPRs = await base44.entities.ExercisePersonalRecord.filter({
            student_email: user.email,
            exercise_id: re.exercise_id,
            record_type: 'max_weight',
          });
          const existingMax = existingPRs?.[0]?.value || 0;
          if (maxW > existingMax) {
            const exName = exercises?.find(e => e.id === re.exercise_id)?.name;
            await base44.entities.ExercisePersonalRecord.create({
              student_email: user.email,
              exercise_id: re.exercise_id,
              exercise_name: exName,
              record_type: 'max_weight',
              value: maxW,
              weight_kg: maxW,
              reps: maxRepsAtMax,
              achieved_at: format(finishedAt, 'yyyy-MM-dd'),
              session_id: session.id,
            });
            prsFound.push({ name: exName, weight: maxW, reps: maxRepsAtMax });
          }
        }
      }

      // Update profile XP + streak
      if (myProfile) {
        const today = format(finishedAt, 'yyyy-MM-dd');
        const yesterday = format(new Date(finishedAt.getTime() - 86400000), 'yyyy-MM-dd');
        const newStreak = myProfile.last_checkin_date === yesterday
          ? (myProfile.current_streak || 0) + 1
          : 1;
        await base44.entities.StudentProfile.update(myProfile.id, {
          xp_total: (myProfile.xp_total || 0) + xp,
          current_streak: newStreak,
          max_streak: Math.max(newStreak, myProfile.max_streak || 0),
          last_checkin_date: today,
        });
      }

      return { xp, durationMinutes, setsCompleted, totalVolume: Math.round(totalVolume), prs: prsFound };
    },
    onSuccess: (data) => {
      setSessionResult(data);
      setDone(true);
      queryClient.invalidateQueries();
    },
  });

  if (!routine || sortedExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Carregando treino...</p>
      </div>
    );
  }

  // Completion screen
  if (done && sessionResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          className="w-24 h-24 rounded-3xl bg-success/20 border border-success/40 flex items-center justify-center mb-6"
        >
          <Trophy className="w-12 h-12 text-success" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display font-black text-3xl text-success mb-1">TREINO FEITO!</h1>
          <p className="text-muted-foreground mb-6">{routine.name}</p>

          <div className="grid grid-cols-3 gap-3 mb-6 w-full max-w-xs mx-auto">
            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className="font-display font-black text-xl text-foreground">{sessionResult.durationMinutes}'</p>
              <p className="text-[10px] text-muted-foreground">Duração</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className="font-display font-black text-xl text-foreground">{sessionResult.setsCompleted}</p>
              <p className="text-[10px] text-muted-foreground">Séries</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className="font-display font-black text-xl text-gold">{sessionResult.totalVolume}kg</p>
              <p className="text-[10px] text-muted-foreground">Volume</p>
            </div>
          </div>

          <div className="bg-gold/10 border border-gold/30 rounded-2xl p-4 mb-4 flex items-center justify-center gap-3">
            <Zap className="w-6 h-6 text-gold" />
            <p className="font-display font-black text-gold text-2xl">+{sessionResult.xp} XP</p>
          </div>

          {sessionResult.prs.length > 0 && (
            <div className="space-y-2 mb-6">
              {sessionResult.prs.map((pr, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                  className="bg-gold/10 border border-gold/30 rounded-xl p-3 text-left flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-gold shrink-0" />
                  <div>
                    <p className="text-xs font-black text-gold">NOVO PR!</p>
                    <p className="text-sm font-bold">{pr.name}: {pr.weight}kg × {pr.reps} reps</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <button onClick={() => navigate('/')}
            className="w-full max-w-xs bg-primary text-primary-foreground font-bold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all">
            Voltar ao início
          </button>
        </motion.div>
      </div>
    );
  }

  const currentRE = sortedExercises[currentExIdx];
  const currentEx = exercises?.find(e => e.id === currentRE?.exercise_id);
  const trackingType = getTrackingType(currentRE, currentEx);
  const currentSets = setLogs[currentRE?.id] || [];
  const plannedSets = currentRE?.sets || 3;
  const lastSets = currentEx ? getLastSetsForExercise(currentEx.id) : [];

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border bg-card/80 sticky top-0 z-10 backdrop-blur-xl">
        <button onClick={() => { if (window.confirm('Sair do treino?')) navigate(-1); }}
          className="p-2 rounded-xl bg-muted/40 hover:bg-muted/60 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{routine.name}</p>
          <p className="text-xs text-muted-foreground">{currentExIdx + 1}/{sortedExercises.length} exercícios</p>
        </div>
        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(Object.keys(setLogs).length / sortedExercises.length) * 100}%` }} />
        </div>
      </div>

      {/* Exercise nav pills */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none border-b border-border/40">
        {sortedExercises.map((re, idx) => {
          const ex = exercises?.find(e => e.id === re.exercise_id);
          const isCurrent = idx === currentExIdx;
          const hasLog = (setLogs[re.id] || []).length > 0;
          return (
            <button key={re.id} onClick={() => setCurrentExIdx(idx)}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                ${isCurrent ? 'bg-primary text-primary-foreground border-primary' :
                  hasLog ? 'bg-success/10 border-success/30 text-success' :
                  'bg-card border-border text-muted-foreground'}`}>
              {idx + 1}. {ex?.name?.split(' ').slice(0, 2).join(' ') || 'Ex.'}
            </button>
          );
        })}
      </div>

      {/* Current exercise */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {currentEx && (
          <div className="bg-card border border-primary/20 rounded-2xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {currentEx.gif_url
                  ? <img src={currentEx.gif_url} alt={currentEx.name} className="w-full h-full object-cover" />
                  : currentEx.image_url
                  ? <img src={currentEx.image_url} alt={currentEx.name} className="w-full h-full object-cover" />
                  : <span className="text-2xl">💪</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-black text-base leading-tight">{currentEx.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {currentRE?.sets && <span className="text-xs font-bold text-primary">{currentRE.sets} séries</span>}
                  {(currentRE?.target_reps || currentRE?.reps) && (
                    <span className="text-xs text-muted-foreground">× {currentRE.target_reps || currentRE.reps}</span>
                  )}
                  {currentRE?.target_weight_kg && (
                    <span className="text-xs text-muted-foreground">@ {currentRE.target_weight_kg}kg</span>
                  )}
                  {currentRE?.rest_seconds && (
                    <span className="text-xs text-muted-foreground">· {currentRE.rest_seconds}s desc.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tips */}
            {currentEx.tips && (
              <div className="bg-gold/5 border border-gold/20 rounded-xl px-3 py-2 mb-3">
                <p className="text-xs text-gold">💡 {currentEx.tips}</p>
              </div>
            )}

            {/* Elástico info */}
            {currentEx.uses_band && currentEx.band_purpose && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl px-3 py-2 mb-3">
                <p className="text-xs text-green-400">🪢 {currentEx.band_purpose}</p>
              </div>
            )}
          </div>
        )}

        {/* Last session reference */}
        {lastSets.length > 0 && (
          <div className="bg-muted/20 border border-border/40 rounded-xl p-3">
            <p className="text-xs font-bold text-muted-foreground mb-2">📊 Última sessão</p>
            <div className="space-y-1">
              {lastSets.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Série {s.set_number}</span>
                  <span className="font-bold text-foreground">
                    {s.weight_kg ? `${s.weight_kg}kg × ${s.reps}` :
                     s.reps ? `${s.reps} reps` :
                     s.duration_seconds ? `${s.duration_seconds}s` :
                     s.band_assistance_level ? `Elástico ${s.band_assistance_level} × ${s.reps}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Set inputs */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">REGISTRAR SÉRIES ({currentSets.length}/{plannedSets})</p>
          {Array.from({ length: plannedSets }).map((_, idx) => {
            const lastSetForRef = lastSets[idx] || lastSets[lastSets.length - 1];
            return (
              <SetInputRow
                key={`${currentRE?.id}-${idx}`}
                setNum={idx + 1}
                trackingType={trackingType}
                lastSet={lastSetForRef}
                onComplete={(data) => handleSetComplete(currentRE?.id, currentEx?.id, data)}
              />
            );
          })}
        </div>

        {/* Nav buttons */}
        <div className="flex gap-2">
          {currentExIdx > 0 && (
            <button onClick={() => setCurrentExIdx(i => i - 1)}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted/30 transition-all">
              ← Anterior
            </button>
          )}
          {currentExIdx < sortedExercises.length - 1 && (
            <button onClick={() => setCurrentExIdx(i => i + 1)}
              className="flex-1 py-3 rounded-xl bg-muted/30 border border-border text-sm font-bold hover:bg-muted/50 transition-all">
              Próximo →
            </button>
          )}
        </div>
      </div>

      {/* Rest timer overlay */}
      <AnimatePresence>
        {showRest && (
          <RestTimer seconds={restSecs} onSkip={() => setShowRest(false)} />
        )}
      </AnimatePresence>

      {/* Finish button */}
      <div className="px-4 py-4 border-t border-border bg-background">
        <button
          onClick={() => finishMutation.mutate()}
          disabled={finishMutation.isPending}
          className="w-full bg-success text-white font-display font-black text-lg py-4 rounded-2xl hover:bg-success/90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <Trophy className="w-6 h-6" />
          {finishMutation.isPending ? 'Salvando...' : 'CONCLUIR TREINO'}
        </button>
      </div>
    </div>
  );
}