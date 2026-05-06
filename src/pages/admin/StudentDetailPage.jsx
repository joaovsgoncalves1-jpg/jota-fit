import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateLevel } from '@/lib/gamification';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Dumbbell, Trophy, Flame, Swords, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import LevelProgress from '@/components/game/LevelProgress';
import StreakBadge from '@/components/game/StreakBadge';
import HPBar from '@/components/game/HPBar';
import { Card } from '@/components/ui/card';

export default function StudentDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const studentId = pathParts[pathParts.length - 1];

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.StudentProfile.list(),
  });

  const student = profiles?.find(p => p.id === studentId);

  const { data: levelConfigs } = useQuery({
    queryKey: ['level-configs'],
    queryFn: () => base44.entities.LevelConfig.list(),
  });

  const { data: workoutLogs } = useQuery({
    queryKey: ['student-logs', student?.email],
    queryFn: () => base44.entities.WorkoutLog.filter({ student_email: student?.email }),
    enabled: !!student?.email,
  });

  const { data: checkins } = useQuery({
    queryKey: ['student-checkins', student?.email],
    queryFn: () => base44.entities.Checkin.filter({ student_email: student?.email }),
    enabled: !!student?.email,
  });

  const { data: skillProgress } = useQuery({
    queryKey: ['student-skill-progress', student?.email],
    queryFn: () => base44.entities.SkillProgress.filter({ student_email: student?.email }),
    enabled: !!student?.email,
  });

  const { data: bossProgress } = useQuery({
    queryKey: ['student-boss-progress', student?.email],
    queryFn: () => base44.entities.BossProgress.filter({ student_email: student?.email }),
    enabled: !!student?.email,
  });

  const { data: bosses } = useQuery({
    queryKey: ['all-bosses'],
    queryFn: () => base44.entities.Boss.list(),
  });

  const { data: skills } = useQuery({
    queryKey: ['all-skills'],
    queryFn: () => base44.entities.Skill.list(),
  });

  const { data: workouts } = useQuery({
    queryKey: ['all-workouts'],
    queryFn: () => base44.entities.Workout.list(),
  });

  const { data: achievementUnlocks } = useQuery({
    queryKey: ['student-achievements', student?.email],
    queryFn: () => base44.entities.AchievementUnlock.filter({ student_email: student?.email }),
    enabled: !!student?.email,
  });

  if (!student) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Carregando...</p>
      </div>
    );
  }

  const levelInfo = calculateLevel(student.xp_total || 0, levelConfigs);
  const completedSkills = (skillProgress || []).filter(sp => sp.status === 'completed');
  const currentBossProgressItem = (bossProgress || []).find(bp => !bp.defeated);
  const currentBoss = currentBossProgressItem ? bosses?.find(b => b.id === currentBossProgressItem.boss_id) : null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/alunos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* Profile Header */}
      <motion.div
        className="bg-card rounded-2xl border border-border p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center text-2xl font-display font-black text-white shrink-0">
            {student.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{student.name}</h1>
            <p className="text-sm text-muted-foreground">{student.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <StreakBadge days={student.current_streak || 0} size="sm" />
              <span className="text-xs text-muted-foreground">Recorde: 🔥 {student.max_streak || 0}</span>
            </div>
            <div className="mt-3">
              <LevelProgress levelInfo={levelInfo} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'XP Total', value: student.xp_total || 0, icon: '⚡' },
          { label: 'Treinos', value: workoutLogs?.length || 0, icon: '💪' },
          { label: 'Check-ins', value: checkins?.length || 0, icon: '✅' },
          { label: 'Skills', value: completedSkills.length, icon: '🏆' },
        ].map((stat, i) => (
          <Card key={stat.label} className="p-3 text-center bg-card border-border">
            <span className="text-lg">{stat.icon}</span>
            <p className="font-display text-lg font-bold mt-1">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Current Boss */}
      {currentBoss && currentBossProgressItem && (
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-2 mb-3">
            <Swords className="w-4 h-4 text-destructive" />
            <h3 className="font-bold text-sm">Chefe Atual</h3>
          </div>
          <p className="font-display font-bold mb-2">{currentBoss.name}</p>
          <HPBar current={currentBossProgressItem.current_hp} total={currentBoss.hp_total} label="HP" />
        </Card>
      )}

      {/* Recent Workouts */}
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Treinos Recentes</h3>
        </div>
        <div className="space-y-2">
          {(workoutLogs || []).slice(0, 10).map(log => {
            const workout = workouts?.find(w => w.id === log.workout_id);
            return (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{workout?.name || 'Treino'}</p>
                  <p className="text-xs text-muted-foreground">{log.completion_date}</p>
                </div>
                <span className="text-xs font-bold text-gold">+{log.xp_earned} XP</span>
              </div>
            );
          })}
          {(!workoutLogs || workoutLogs.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum treino concluído</p>
          )}
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-card border-border">
        <h3 className="font-bold text-sm mb-3">Informações</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cadastro</span>
            <span>{student.created_date?.split('T')[0]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Último check-in</span>
            <span>{student.last_checkin_date || 'Nunca'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Conquistas</span>
            <span>{achievementUnlocks?.length || 0}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}