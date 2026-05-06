import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, CheckCircle, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';
import AIJotaButton from '@/components/student/AIJotaButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import HPBar from '@/components/game/HPBar';
import XPBadge from '@/components/game/XPBadge';
import VictoryAnimation from '@/components/game/VictoryAnimation';
import WorkoutTimer from '@/components/workout/WorkoutTimer';
import ExerciseModal from '@/components/workout/ExerciseModal';

export default function StudentWorkoutsPage() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [victory, setVictory] = useState(null);
  const [activeTimerAssignment, setActiveTimerAssignment] = useState(null);
  const [exerciseModal, setExerciseModal] = useState(null); // exercise object
  const [exercises, setExercises] = useState({}); // keyed by exercise_id
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: assignments } = useQuery({
    queryKey: ['my-assignments', user?.email],
    queryFn: () => base44.entities.WorkoutAssignment.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: workouts } = useQuery({
    queryKey: ['all-workouts'],
    queryFn: () => base44.entities.Workout.list(),
  });

  const { data: workoutLogs } = useQuery({
    queryKey: ['my-workout-logs', user?.email],
    queryFn: () => base44.entities.WorkoutLog.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: bosses } = useQuery({
    queryKey: ['all-bosses'],
    queryFn: () => base44.entities.Boss.list(),
  });

  const { data: bossProgress } = useQuery({
    queryKey: ['my-boss-progress', user?.email],
    queryFn: () => base44.entities.BossProgress.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: skills } = useQuery({
    queryKey: ['all-skills'],
    queryFn: () => base44.entities.Skill.list(),
  });

  const { data: allExercises } = useQuery({
    queryKey: ['all-exercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const myProfile = profile?.[0];
  const todayLogs = workoutLogs?.filter(l => l.completion_date === today) || [];
  const completedWorkoutIds = new Set(todayLogs.map(l => l.workout_id));

  // Get today's workouts (by date or day of week)
  const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
  const todayAssignments = (assignments || []).filter(a => {
    if (a.scheduled_date === today) return true;
    if (a.recurring && a.recurring_days?.includes(dayOfWeek)) return true;
    return false;
  });

  const completeWorkoutMutation = useMutation({
    mutationFn: async (assignment) => {
      const workout = workouts?.find(w => w.id === assignment.workout_id);
      if (!workout) return;

      const timerXP = assignment._timerXP || 0;
      const xpReward = (workout.xp_reward || 100) + timerXP;
      const damage = workout.boss_damage || 0;

      // Find current active boss for this workout's skill
      let bossDefeated = false;
      let defeatedBossName = '';
      let unlockedSkillName = '';
      let defeatedBossXP = 0;
      let targetBossId = null;

      if (workout.skill_id && damage > 0) {
        // Find the active boss for the skill
        const skillBosses = (bosses || []).filter(b => b.skill_id === workout.skill_id).sort((a, b) => (a.order_in_skill || 1) - (b.order_in_skill || 1));
        
        for (const boss of skillBosses) {
          const bp = bossProgress?.find(p => p.boss_id === boss.id);
          if (!bp || !bp.defeated) {
            targetBossId = boss.id;
            const currentHP = bp ? bp.current_hp : boss.hp_total;
            const newHP = Math.max(0, currentHP - damage);

            if (bp) {
              await base44.entities.BossProgress.update(bp.id, {
                current_hp: newHP,
                defeated: newHP <= 0,
                defeated_date: newHP <= 0 ? today : undefined,
              });
            } else {
              await base44.entities.BossProgress.create({
                student_email: user.email,
                boss_id: boss.id,
                current_hp: newHP,
                defeated: newHP <= 0,
                defeated_date: newHP <= 0 ? today : undefined,
              });
            }

            if (newHP <= 0) {
              bossDefeated = true;
              defeatedBossName = boss.name;
              defeatedBossXP = boss.xp_bonus || 0;

              // Check if all bosses for this skill are defeated
              const allSkillBosses = skillBosses;
              const allDefeated = allSkillBosses.every(sb => {
                if (sb.id === boss.id) return true;
                const sbp = bossProgress?.find(p => p.boss_id === sb.id);
                return sbp?.defeated;
              });

              if (allDefeated) {
                const skill = skills?.find(s => s.id === workout.skill_id);
                unlockedSkillName = skill?.name || '';
                
                // Update skill progress
                const sp = (await base44.entities.SkillProgress.filter({ student_email: user.email, skill_id: workout.skill_id }))[0];
                if (sp) {
                  await base44.entities.SkillProgress.update(sp.id, { status: 'completed', completed_date: today });
                } else {
                  await base44.entities.SkillProgress.create({ student_email: user.email, skill_id: workout.skill_id, status: 'completed', completed_date: today });
                }
              }
            }
            break;
          }
        }
      }

      // Log the workout
      await base44.entities.WorkoutLog.create({
        workout_id: workout.id,
        student_email: user.email,
        completion_date: today,
        xp_earned: xpReward + defeatedBossXP,
        damage_dealt: damage,
        boss_id: targetBossId,
      });

      // Update profile XP
      const totalXP = xpReward + defeatedBossXP;
      await base44.entities.StudentProfile.update(myProfile.id, {
        xp_total: (myProfile?.xp_total || 0) + totalXP,
      });

      return { xp: totalXP, bossDefeated, defeatedBossName, unlockedSkillName, defeatedBossXP };
    },
    onSuccess: (data) => {
      if (data?.bossDefeated) {
        setVictory({
          bossName: data.defeatedBossName,
          skillName: data.unlockedSkillName,
          xpBonus: data.defeatedBossXP,
        });
      }
      setXpAmount(data?.xp || 0);
      setShowXP(true);
      setTimeout(() => setShowXP(false), 2000);
      queryClient.invalidateQueries();
    },
  });

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <ExerciseModal
        exercise={exerciseModal}
        open={!!exerciseModal}
        onClose={() => setExerciseModal(null)}
      />
      <XPBadge amount={xpAmount} show={showXP} />
      <VictoryAnimation
        show={!!victory}
        bossName={victory?.bossName}
        skillName={victory?.skillName}
        xpBonus={victory?.xpBonus || 0}
        onClose={() => setVictory(null)}
      />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-bold">TREINOS DO DIA</h1>
        </div>
        <AIJotaButton profile={myProfile} skills={skills} skillProgress={[]} workoutLogs={workoutLogs} workouts={workouts} />
      </div>

      {todayAssignments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Nenhum treino para hoje</p>
          <p className="text-xs mt-1">Dia de descanso! Não esqueça do check-in 🔥</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayAssignments.map(assignment => {
            const workout = workouts?.find(w => w.id === assignment.workout_id);
            if (!workout) return null;
            const completed = completedWorkoutIds.has(workout.id);
            const expanded = expandedWorkout === assignment.id;
            
            // Get boss info
            let currentBoss = null;
            let currentBP = null;
            if (workout.skill_id) {
              const skillBosses = (bosses || []).filter(b => b.skill_id === workout.skill_id).sort((a, b) => (a.order_in_skill || 1) - (b.order_in_skill || 1));
              for (const boss of skillBosses) {
                const bp = bossProgress?.find(p => p.boss_id === boss.id);
                if (!bp || !bp.defeated) {
                  currentBoss = boss;
                  currentBP = bp;
                  break;
                }
              }
            }

            return (
              <motion.div
                key={assignment.id}
                className={`bg-card rounded-2xl border overflow-hidden ${completed ? 'border-success/30' : 'border-border'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  className="w-full p-4 text-left"
                  onClick={() => setExpandedWorkout(expanded ? null : assignment.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {completed ? (
                        <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Dumbbell className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{workout.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gold font-bold">+{workout.xp_reward || 100} XP</span>
                          {workout.boss_damage > 0 && (
                            <span className="text-xs text-destructive font-bold">⚔️ {workout.boss_damage} DMG</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {workout.description && (
                          <p className="text-xs text-muted-foreground">{workout.description}</p>
                        )}

                        {/* Boss HP */}
                        {currentBoss && (
                          <div className="bg-muted/50 rounded-xl p-3">
                            <p className="text-xs font-bold text-destructive mb-2">⚔️ {currentBoss.name}</p>
                            <HPBar
                              current={currentBP ? currentBP.current_hp : currentBoss.hp_total}
                              total={currentBoss.hp_total}
                              size="sm"
                            />
                          </div>
                        )}

                        {/* Timer */}
                        {activeTimerAssignment === assignment.id ? (
                          <WorkoutTimer
                            exercises={workout.exercises || []}
                            onStart={() => {}}
                            onFinish={({ durationMinutes, xpBonus }) => {
                              setActiveTimerAssignment(null);
                              completeWorkoutMutation.mutate({ ...assignment, _timerXP: xpBonus, _durationMin: durationMinutes });
                            }}
                          />
                        ) : null}

                        {/* Exercises */}
                        {workout.exercises && workout.exercises.length > 0 && (
                          <div className="space-y-2">
                            {workout.exercises.map((ex, i) => {
                              const exData = allExercises?.find(e => e.id === ex.exercise_id) || ex;
                              const hasDetail = !!exData?.description || !!exData?.video_url || !!exData?.tips;
                              return (
                                <div
                                  key={i}
                                  className={`flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2 ${hasDetail ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                                  onClick={() => hasDetail && setExerciseModal(exData)}
                                >
                                  <span className="text-xs font-display font-bold text-primary w-6">{i + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">{exData.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {ex.sets && `${ex.sets}x`}{ex.reps || ''}
                                      {ex.rest_seconds ? ` • ${ex.rest_seconds}s desc.` : ''}
                                    </p>
                                  </div>
                                  {hasDetail && <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Complete button */}
                        {!completed && !activeTimerAssignment && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setActiveTimerAssignment(assignment.id)}
                              variant="outline"
                              className="flex-1 border-primary/30 text-primary hover:bg-primary/10 font-bold py-5 rounded-xl"
                            >
                              ⏱ Iniciar com Timer
                            </Button>
                            <Button
                              onClick={() => completeWorkoutMutation.mutate(assignment)}
                              disabled={completeWorkoutMutation.isPending}
                              className="flex-1 bg-primary hover:bg-primary/90 font-bold py-5 rounded-xl"
                            >
                              {completeWorkoutMutation.isPending ? '...' : '✅ Concluído'}
                            </Button>
                          </div>
                        )}
                        {completed && activeTimerAssignment === assignment.id && (
                          <Button
                            onClick={() => setActiveTimerAssignment(null)}
                            variant="outline"
                            className="w-full"
                          >Fechar timer</Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Completed history */}
      {workoutLogs && workoutLogs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Histórico Recente
          </h2>
          <div className="space-y-2">
            {workoutLogs.slice(0, 10).map(log => {
              const workout = workouts?.find(w => w.id === log.workout_id);
              return (
                <div key={log.id} className="flex items-center justify-between bg-card/50 rounded-xl px-3 py-2 border border-border/50">
                  <div>
                    <p className="text-sm font-medium">{workout?.name || 'Treino'}</p>
                    <p className="text-xs text-muted-foreground">{log.completion_date}</p>
                  </div>
                  <span className="text-xs font-bold text-gold">+{log.xp_earned} XP</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}