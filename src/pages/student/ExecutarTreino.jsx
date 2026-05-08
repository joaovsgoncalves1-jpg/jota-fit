/**
 * ExecutarTreino — Treino em andamento
 * Modelo: Routine → RoutineExercise → WorkoutSession → SetLog → ExercisePersonalRecord
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutHeader from '@/components/treino/WorkoutHeader';
import ExerciseCard from '@/components/treino/ExerciseCard';
import WorkoutSummaryModal from '@/components/treino/WorkoutSummaryModal';

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

  // ── Queries ──
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

  const { data: allHistoricalSets } = useQuery({
    queryKey: ['historical-sets', user?.email],
    queryFn: () => base44.entities.SetLog.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allPRs } = useQuery({
    queryKey: ['my-prs', user?.email],
    queryFn: () => base44.entities.ExercisePersonalRecord.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  // ── Create session ──
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
      const durationMinutes = Math.max(1, Math.round((new Date() - startTime.current) / 60000));
      const setLogs = await base44.entities.SetLog.filter({ session_id: sessionId });
      const totalVolume = setLogs.reduce((acc, s) => acc + ((s.weight_kg || 0) * (s.reps || 1)), 0);
      const prSets = setLogs.filter(s => s.is_pr);
      const prsCount = prSets.length;
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

      // Fetch the actual PR records created in this session for richer cards
      let prRecords = [];
      if (prsCount > 0) {
        const allMyPRs = await base44.entities.ExercisePersonalRecord.filter({ student_email: user?.email });
        prRecords = (allMyPRs || []).filter(p => p.session_id === sessionId);
      }

      return {
        xpEarned,
        prsCount,
        prs: prRecords,
        durationMinutes,
        totalVolume: Math.round(totalVolume),
        setsCompleted: setLogs.length,
        exercisesCompleted: (routineExercises || []).length,
        routineName: routine?.name,
        streak: profile?.current_streak || 0,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      setSummary(data);
    },
  });

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
      {/* PR Toast Queue */}
      <AnimatePresence>
        {prQueue[0] && (
          <PRToast
            key={prQueue[0] + prQueue.length}
            exerciseName={prQueue[0]}
            onDone={() => setPrQueue(prev => prev.slice(1))}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <WorkoutHeader
        routine={routine}
        sortedExercises={sortedExercises}
        sessionId={sessionId}
        finishing={finishing || finishMutation.isPending}
        onFinish={() => { setFinishing(true); finishMutation.mutate(); }}
      />

      {/* Exercise List */}
      <div className="p-3 space-y-3 pb-20">
        {sortedExercises.map((re, idx) => {
          const ex = exercises?.find(e => e.id === re.exercise_id);
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

      {/* Summary modal on finish */}
      <WorkoutSummaryModal
        open={!!summary}
        summary={summary}
        onClose={handleCloseSummary}
      />
    </div>
  );
}