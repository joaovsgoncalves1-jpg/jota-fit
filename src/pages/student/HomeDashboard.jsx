import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { calculateLevel } from '@/lib/gamification';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { BookOpen, ListChecks, TrendingUp, Play, Flame, Zap, Trophy, ChevronRight, Map, Activity, BarChart2 } from 'lucide-react';
import LevelProgress from '@/components/game/LevelProgress';
import { useMemo } from 'react';
import { startOfWeek, addDays } from 'date-fns';
import { fatigueLevel, FATIGUE_COLOR, FATIGUE_BG, ACTIVITY_MUSCLE_IMPACT, applyIntensityMultiplier, generateRecommendations } from '@/lib/trainingLoad';
import RecommendationCard from '@/components/home/RecommendationCard';

function ActiveRoutineCard({ navigate }) {
  const { user } = useCurrentUser();
  const { data: routines } = useQuery({
    queryKey: ['my-routines', user?.email],
    queryFn: () => base44.entities.Routine.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });
  const active = (routines || []).find(r => r.is_active) || (routines || [])[0];

  if (!active) return (
    <button
      onClick={() => navigate('/rotina')}
      className="w-full bg-card border border-dashed border-border rounded-2xl p-5 text-center hover:border-primary/30 transition-all"
    >
      <ListChecks className="w-7 h-7 mx-auto mb-2 text-muted-foreground opacity-40" />
      <p className="text-sm text-muted-foreground">Nenhuma rotina criada</p>
      <p className="text-xs text-primary font-bold mt-1">Criar minha rotina →</p>
    </button>
  );

  return (
    <button
      onClick={() => navigate(`/treino/${active.id}`)}
      className="w-full bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 rounded-2xl p-4 text-left hover:border-primary/50 transition-all active:scale-[0.98] group"
    >
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.35)] group-active:shadow-none transition-all">
          <Play className="w-7 h-7 text-white" fill="white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">Treino de hoje</p>
          <p className="font-display font-black text-base text-foreground leading-tight">{active.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {(active.days_of_week || []).join(', ') || 'Qualquer dia'} · {active.created_by === 'jota' ? '⭐ Plano Jota' : 'Minha rotina'}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-primary shrink-0" />
      </div>
    </button>
  );
}

function RecentPRCard({ email }) {
  const { data: prs } = useQuery({
    queryKey: ['my-prs', email],
    queryFn: () => base44.entities.ExercisePersonalRecord.filter({ student_email: email }),
    enabled: !!email,
  });
  const latest = prs?.sort((a, b) => (b.achieved_at || '').localeCompare(a.achieved_at || ''))[0];
  if (!latest) return null;

  const prLabel = () => {
    if (latest.record_type === 'max_weight') return `${latest.weight_kg}kg × ${latest.reps} reps`;
    if (latest.record_type === 'max_reps') return `${latest.reps} reps livres`;
    if (latest.record_type === 'max_duration') return `${latest.duration_seconds}s`;
    if (latest.record_type === 'band_reduction') return `Elástico ${latest.band_level}`;
    if (latest.record_type === 'first_without_band') return 'Primeira sem elástico!';
    return latest.context || 'Novo recorde';
  };

  return (
    <div className="bg-card border border-gold/20 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gold font-bold uppercase tracking-wider">Último PR</p>
          <p className="font-bold text-sm text-foreground truncate">{latest.exercise_name}</p>
          <p className="text-xs text-muted-foreground">{prLabel()}</p>
        </div>
      </div>
    </div>
  );
}

function WeekLoadMini({ email, navigate }) {
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(addDays(new Date(weekStart + 'T12:00:00'), 6), 'yyyy-MM-dd');

  const { data: sessions } = useQuery({
    queryKey: ['my-sessions', email],
    queryFn: () => base44.entities.WorkoutSession.filter({ student_email: email }),
    enabled: !!email,
  });
  const { data: activities } = useQuery({
    queryKey: ['hybrid-activities', email],
    queryFn: () => base44.entities.HybridActivity.filter({ student_email: email }),
    enabled: !!email,
  });

  const weekSessions = useMemo(() =>
    (sessions || []).filter(s => (s.finished_at || s.created_date || '').slice(0, 10) >= weekStart),
    [sessions, weekStart]);
  const weekActivities = useMemo(() =>
    (activities || []).filter(a => a.date >= weekStart && a.date <= weekEnd),
    [activities, weekStart, weekEnd]);

  const totalSessions = weekSessions.length + weekActivities.length;
  const cardioCount = weekActivities.filter(a => ['corrida', 'caminhada', 'bike', 'natacao', 'HIIT'].includes(a.activity_type)).length;
  const legsScore = useMemo(() => {
    let s = 0;
    weekSessions.forEach(sess => {
      if ((sess.routine_name || '').toLowerCase().match(/lower|perna|leg/)) s += 35;
    });
    weekActivities.forEach(a => {
      if (['corrida', 'caminhada', 'bike', 'HIIT'].includes(a.activity_type)) {
        const mult = { leve: 0.5, moderado: 1, intenso: 1.5, maximo: 2 }[a.intensity] || 1;
        s += Math.round(30 * mult);
      }
    });
    return Math.min(100, s);
  }, [weekSessions, weekActivities]);

  const recs = generateRecommendations({ pernas: legsScore }, weekSessions, weekActivities);

  return (
    <>
      <button onClick={() => navigate('/carga-semana')}
        className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/20 transition-all">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> Carga da Semana
          </p>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="font-display font-black text-xl text-primary">{totalSessions}</p>
            <p className="text-[10px] text-muted-foreground">sessões</p>
          </div>
          <div className="text-center">
            <p className="font-display font-black text-xl text-blue-400">{cardioCount}</p>
            <p className="text-[10px] text-muted-foreground">cardio</p>
          </div>
          {legsScore > 0 && (
            <div className={`ml-auto text-right`}>
              <p className={`text-xs font-bold ${FATIGUE_COLOR[fatigueLevel(legsScore)]}`}>
                Pernas {fatigueLevel(legsScore)}
              </p>
              <p className="text-[10px] text-muted-foreground">fadiga</p>
            </div>
          )}
        </div>
      </button>
      {recs.slice(0, 1).map((r, i) => (
        <RecommendationCard key={i} title={r.title} message={r.message} severity={r.severity === 'low' ? 'low' : r.severity === 'high' ? 'high' : 'medium'} icon={r.icon} />
      ))}
    </>
  );
}

export default function HomeDashboard() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const myProfile = profile?.[0];
  const levelInfo = calculateLevel(myProfile?.xp_total || 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = myProfile?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Atleta';

  const SHORTCUTS = [
    { label: 'Biblioteca', icon: BookOpen, path: '/biblioteca', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { label: 'Rotina', icon: ListChecks, path: '/rotina', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    { label: 'Semana', icon: Activity, path: '/minha-semana', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
    { label: 'Jornada', icon: Map, path: '/jornada', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  ];

  return (
    <div className="max-w-lg mx-auto p-4 pb-6 space-y-4">

      {/* GREETING */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-muted-foreground text-sm">{greeting},</p>
        <h1 className="font-display text-2xl font-black text-foreground">{firstName} 💪</h1>
      </motion.div>

      {/* STATS ROW */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="bg-card border border-border rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Nível {levelInfo.level}</p>
            <p className="font-display font-black text-base text-primary leading-tight">{levelInfo.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {(myProfile?.current_streak || 0) > 0 && (
              <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-xl px-2.5 py-1.5">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span className="font-display font-black text-sm text-primary">{myProfile.current_streak}</span>
              </div>
            )}
            <div className="flex items-center gap-1 bg-gold/10 border border-gold/20 rounded-xl px-2.5 py-1.5">
              <Zap className="w-3.5 h-3.5 text-gold" />
              <span className="font-display font-black text-sm text-gold">{(myProfile?.xp_total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <LevelProgress levelInfo={levelInfo} size="sm" />
      </motion.div>

      {/* TREINO DE HOJE */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <ActiveRoutineCard navigate={navigate} />
      </motion.div>

      {/* PR RECENTE */}
      {user?.email && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <RecentPRCard email={user.email} />
        </motion.div>
      )}

      {/* CARGA + RECOMENDAÇÃO */}
      {user?.email && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="space-y-2">
          <WeekLoadMini email={user.email} navigate={navigate} />
        </motion.div>
      )}

      {/* ATALHOS */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Acesso rápido</p>
        <div className="grid grid-cols-4 gap-2">
          {SHORTCUTS.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => navigate(s.path)}
                className={`flex flex-col items-center gap-2 ${s.bg} border ${s.border} rounded-2xl py-4 px-2 hover:opacity-90 transition-all active:scale-95`}
              >
                <Icon className={`w-5 h-5 ${s.color}`} />
                <p className={`text-[10px] font-bold ${s.color} text-center leading-tight`}>{s.label}</p>
              </button>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}