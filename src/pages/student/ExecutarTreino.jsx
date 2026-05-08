/**
 * ExecutarTreino — Treino em andamento
 * Modelo: Routine → RoutineExercise → WorkoutSession → SetLog → ExercisePersonalRecord
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutHeader from '@/components/treino/WorkoutHeader';
import ExerciseCard from '@/components/treino/ExerciseCard';
import WorkoutSummaryModal from '@/components/treino/WorkoutSummaryModal';
import {
  useCurrentUser,
  useRoutine, useRoutineExercises, useExercises,
  useMyProfile,
  useStudentSets, useStudentPRs,
  workoutService, studentService,
} from '@/services';

// XP formula
function calcXP(setCount, volumeKg) {
  return Math.min(300, Math.max(50, Math.round(setCount * 7 + volumeKg * 0.05)));
}

// PR Toast
function PRToast({ exerciseName, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-gold/20 border border-gold/40 text-gold font-bold text-sm px-4 py-2.5 rounded-2xl shadow-xl whitespace-nowrap"
    >
      <Trophy className="w-4 h-4" /> 🏆 PR! {exerciseName}
    </motion.div>
  );
}

export default function ExecutarTreino() {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const [sessionId, setSessionId] = useState(null);
  const sessionCreated = useRef(false);
  const startTime = useRef(new Date());
  const [finishing, setFinishing] = useState(false);
  const [prQueue, setPrQueue] = useState([]);
  const [summary, setSummary] = useState(null);

  const { data: routine } = useRoutine(routineId);
  const { data: routineExercises } = useRoutineExercises(routineId);
  const { data: exercises } = useExercises();
  const { data: profile } = useMyProfile(user?.email);
  const { data: allHistoricalSets } = useStudentSets(user?.email);
  const { data: allPRs } = useStudentPRs(user?.email);

  // Cria sessão ao montar
  useEffect(() => {
    if (!user?.email || !routineId || !routine || sessionCreated.current) return;
    sessionCreated.current = true;
    workoutService.startSession({
      studentEmail: user.email,
      routineId,
      routineName: routine.name,
    }).then(s => setSessionId(s.id));
  }, [user?.email, routineId, routine]);

  const handleFinish = async () => {
    setFinishing(true);
    try {
      const durationMinutes = Math.max(1, Math.round((new Date() - startTime.current) / 60000));
      const setLogs = await workoutService.listSetsBySession(sessionId);
      const totalVolume = setLogs.reduce((acc, s) => acc + ((s.weightKg || 0) * (s.reps || 1)), 0);
      const prSets = setLogs.filter(s => s.isPr);
      const prsCount = prSets.length;
      const xpEarned = calcXP(setLogs.length, totalVolume) + prsCount * 25;

      await workoutService.finishSession(sessionId, {
        durationMinutes,
        totalVolumeKg: Math.round(totalVolume),
        setsCompleted: setLogs.length,
        exercisesCompleted: (routineExercises || []).length,
        xpEarned,
        prsCount,
      });

      if (profile?.id) {
        await studentService.updateProfile(profile.id, {
          xpTotal: (profile.xpTotal || 0) + xpEarned,
        });
      }

      // Busca os PR records criados nesta sessão
      let prRecords = [];
      if (prsCount > 0) {
        prRecords = await workoutService.getPRsForSession(sessionId);
      }

      queryClient.invalidateQueries();
      setSummary({
        xpEarned, prsCount, prs: prRecords,
        durationMinutes,
        totalVolume: Math.round(totalVolume),
        setsCompleted: setLogs.length,
        exercisesCompleted: (routineExercises || []).length,
        routineName: routine?.name,
        streak: profile?.currentStreak || 0,
      });
    } finally {
      setFinishing(false);
    }
  };

  const handleCloseSummary = () => {
    setSummary(null);
    navigate('/rotina');
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
      <AnimatePresence>
        {prQueue[0] && (
          <PRToast
            key={prQueue[0] + prQueue.length}
            exerciseName={prQueue[0]}
            onDone={() => setPrQueue(prev => prev.slice(1))}
          />
        )}
      </AnimatePresence>

      <WorkoutHeader
        routine={routine}
        sortedExercises={sortedExercises}
        sessionId={sessionId}
        finishing={finishing}
        onFinish={handleFinish}
      />

      <div className="p-3 space-y-3 pb-20">
        {sortedExercises.map((re) => {
          const ex = exercises?.find(e => e.id === re.exerciseId);
          return (
            <ExerciseCard
              key={re.id}
              routineExercise={re}
              exercise={ex}
              sessionId={sessionId}
              studentEmail={user?.email}
              allHistoricalSets={allHistoricalSets}
              allPRs={allPRs}
              onPR={name => setPrQueue(prev => [...prev, name])}
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

      <WorkoutSummaryModal
        open={!!summary}
        summary={summary}
        onClose={handleCloseSummary}
      />
    </div>
  );
}