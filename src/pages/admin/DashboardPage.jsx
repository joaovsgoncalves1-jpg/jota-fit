import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateLevel } from '@/lib/gamification';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Dumbbell, Swords, Flame, AlertTriangle, Plus, Trophy, Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';
import StreakBadge from '@/components/game/StreakBadge';

export default function DashboardPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.StudentProfile.list(),
  });

  const { data: workoutLogs } = useQuery({
    queryKey: ['all-workout-logs'],
    queryFn: () => base44.entities.WorkoutLog.list('-created_date', 200),
  });

  const { data: checkins } = useQuery({
    queryKey: ['all-checkins'],
    queryFn: () => base44.entities.Checkin.list('-created_date', 200),
  });

  const { data: bossProgress } = useQuery({
    queryKey: ['all-boss-progress'],
    queryFn: () => base44.entities.BossProgress.list(),
  });

  const activeStudents = (profiles || []).filter(p => p.active);
  const recentCheckins = (checkins || []).filter(c => c.date >= weekAgo);
  const studentsWithRecentCheckin = new Set(recentCheckins.map(c => c.student_email));
  const recentWorkouts = (workoutLogs || []).filter(l => l.completion_date >= weekAgo);
  const bossesDefeated = (bossProgress || []).filter(bp => bp.defeated);

  // Inactive students (no checkin in 3+ days)
  const threeDaysAgo = format(subDays(new Date(), 3), 'yyyy-MM-dd');
  const inactiveStudents = activeStudents.filter(p => {
    return !p.last_checkin_date || p.last_checkin_date < threeDaysAgo;
  });

  // Top 5 ranking
  const topStudents = [...activeStudents].sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0)).slice(0, 5);

  // Average streak
  const avgStreak = activeStudents.length > 0
    ? Math.round(activeStudents.reduce((sum, p) => sum + (p.current_streak || 0), 0) / activeStudents.length)
    : 0;

  const stats = [
    { label: 'Alunos Ativos', value: activeStudents.length, icon: Users, color: 'text-primary' },
    { label: 'Treinos (7d)', value: recentWorkouts.length, icon: Dumbbell, color: 'text-success' },
    { label: 'Chefes Derrotados', value: bossesDefeated.length, icon: Swords, color: 'text-destructive' },
    { label: 'Streak Médio', value: `${avgStreak}d`, icon: Flame, color: 'text-primary' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">DASHBOARD</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "dd 'de' MMMM, yyyy")}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/alunos">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="w-4 h-4" /> Aluno
            </Button>
          </Link>
          <Link to="/treinos">
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Treino
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4 bg-card border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="font-display text-2xl font-bold">{stat.value}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inactive Alerts */}
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="font-bold text-sm">Alertas de Inatividade</h3>
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full ml-auto">
              {inactiveStudents.length}
            </span>
          </div>
          {inactiveStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Todos os alunos estão ativos! 🎉</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {inactiveStudents.map(student => (
                <Link key={student.id} to={`/aluno/${student.id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {student.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Último: {student.last_checkin_date || 'Nunca'}
                      </p>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Top 5 Ranking */}
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-gold" />
            <h3 className="font-bold text-sm">Top 5 Ranking</h3>
            <Link to="/ranking" className="text-xs text-primary ml-auto hover:underline">Ver tudo</Link>
          </div>
          <div className="space-y-2">
            {topStudents.map((student, i) => {
              const emojis = ['🥇', '🥈', '🥉', '4º', '5º'];
              return (
                <Link key={student.id} to={`/aluno/${student.id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                    <span className="text-sm w-6 text-center">{emojis[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.current_streak > 0 && (
                        <StreakBadge days={student.current_streak} size="sm" />
                      )}
                      <span className="font-display text-sm font-bold text-gold">{student.xp_total || 0}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}