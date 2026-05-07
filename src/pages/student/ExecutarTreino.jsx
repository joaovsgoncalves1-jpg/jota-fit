import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { format } from 'date-fns';
import { CheckCircle, ChevronLeft, Timer, Play, Pause, SkipForward, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import XPBadge from '@/components/game/XPBadge';

export default function ExecutarTreino() {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [restTimer, setRestTimer] = useState(null); // seconds remaining
  const [timerRunning, setTimerRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const intervalRef = useRef(null);

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

  const myProfile = profile?.[0];

  const sortedExercises = [...(routineExercises || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  const current = sortedExercises[currentIdx];
  const currentEx = exercises?.find(e => e.id === current?.exercise_id);

  // Timer logic
  useEffect(() => {
    if (timerRunning && restTimer > 0) {
      intervalRef.current = setInterval(() => {
        setRestTimer(t => {
          if (t <= 1) { setTimerRunning(false); clearInterval(intervalRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const startRest = (seconds) => {
    setRestTimer(seconds);
    setTimerRunning(true);
  };

  const finishMutation = useMutation({
    mutationFn: async () => {
      const xp = 100 + completed.size * 10;
      await base44.entities.WorkoutLog.create({
        student_email: user.email,
        routine_id: routineId,
        completion_date: today,
        xp_earned: xp,
        exercises_completed: completed.size,
      });
      if (myProfile) {
        await base44.entities.StudentProfile.update(myProfile.id, {
          xp_total: (myProfile.xp_total || 0) + xp,
          last_checkin_date: today,
        });
      }
      return xp;
    },
    onSuccess: (xp) => {
      setXpEarned(xp);
      setShowXP(true);
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
  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <XPBadge amount={xpEarned} show={showXP} />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          className="w-24 h-24 rounded-3xl bg-success/20 border border-success/40 flex items-center justify-center mb-6"
        >
          <Trophy className="w-12 h-12 text-success" />
        </motion.div>
        <h1 className="font-display font-black text-3xl text-success mb-2">TREINO FEITO!</h1>
        <p className="text-muted-foreground mb-2">{completed.size} de {sortedExercises.length} exercícios concluídos</p>
        <p className="font-display font-black text-gold text-2xl mb-8">+{xpEarned} XP ⚡</p>
        <button
          onClick={() => navigate('/rotina')}
          className="bg-primary text-primary-foreground font-bold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all w-full max-w-xs"
        >
          Ver Rotinas
        </button>
        <button onClick={() => navigate('/')} className="mt-3 text-sm text-muted-foreground hover:text-foreground">
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-muted/40 hover:bg-muted/60 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{routine.name}</p>
          <p className="text-xs text-muted-foreground">{currentIdx + 1} / {sortedExercises.length}</p>
        </div>
        {/* Progress bar */}
        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${((completed.size) / sortedExercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {sortedExercises.map((re, idx) => {
          const ex = exercises?.find(e => e.id === re.exercise_id);
          const isDone = completed.has(re.id);
          const isCurrent = idx === currentIdx;

          return (
            <motion.div
              key={re.id}
              className={`rounded-2xl border overflow-hidden transition-all
                ${isDone ? 'border-success/30 bg-success/5 opacity-70' :
                  isCurrent ? 'border-primary/50 bg-card shadow-[0_0_16px_rgba(249,115,22,0.08)]' :
                  'border-border bg-card/60'}`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-display font-black text-sm
                    ${isDone ? 'bg-success/20 text-success' : isCurrent ? 'bg-primary/20 text-primary' : 'bg-muted/40 text-muted-foreground'}`}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${isDone ? 'line-through text-muted-foreground' : ''}`}>{ex?.name || 'Exercício'}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {re.sets && <span className="text-xs font-bold text-primary">{re.sets} séries</span>}
                      {re.reps && <span className="text-xs text-muted-foreground">{re.reps} reps</span>}
                      {re.rest_seconds && <span className="text-xs text-muted-foreground">· {re.rest_seconds}s desc.</span>}
                    </div>
                    {re.notes && <p className="text-xs text-muted-foreground mt-1">{re.notes}</p>}
                    {isCurrent && ex?.tips && (
                      <p className="text-xs text-gold mt-2 bg-gold/5 border border-gold/20 rounded-lg px-2 py-1.5">
                        💡 {ex.tips}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons for current */}
                {isCurrent && !isDone && (
                  <div className="mt-3 flex gap-2">
                    {re.rest_seconds && (
                      <button
                        onClick={() => startRest(re.rest_seconds)}
                        className="flex items-center gap-1.5 bg-muted/40 text-muted-foreground text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        {restTimer !== null && restTimer > 0 ? `${Math.floor(restTimer / 60)}:${String(restTimer % 60).padStart(2, '0')}` : 'Timer'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setCompleted(prev => new Set([...prev, re.id]));
                        if (idx < sortedExercises.length - 1) setCurrentIdx(idx + 1);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-all text-sm"
                    >
                      <CheckCircle className="w-4 h-4" /> Concluir Exercício
                    </button>
                  </div>
                )}
                {isCurrent && isDone && idx < sortedExercises.length - 1 && (
                  <button
                    onClick={() => setCurrentIdx(idx + 1)}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-muted/40 text-sm font-bold py-2.5 rounded-xl hover:bg-muted/60 transition-all"
                  >
                    <SkipForward className="w-4 h-4" /> Próximo
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rest timer overlay */}
      <AnimatePresence>
        {timerRunning && restTimer !== null && restTimer > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-card border border-primary/40 rounded-2xl px-6 py-4 shadow-xl flex items-center gap-4"
          >
            <Timer className="w-5 h-5 text-primary" />
            <span className="font-display font-black text-2xl text-primary">
              {Math.floor(restTimer / 60)}:{String(restTimer % 60).padStart(2, '0')}
            </span>
            <button onClick={() => { setTimerRunning(false); setRestTimer(null); }} className="text-xs text-muted-foreground hover:text-foreground">Pular</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finish button */}
      <div className="px-4 py-4 border-t border-border">
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