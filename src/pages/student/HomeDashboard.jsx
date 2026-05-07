import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { calculateLevel } from '@/lib/gamification';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { BookOpen, ListChecks, Swords, CheckCircle, ChevronRight, Flame, Zap, TrendingUp, Play } from 'lucide-react';
import HPBar from '@/components/game/HPBar';
import LevelProgress from '@/components/game/LevelProgress';

function ActiveRoutineCard({ navigate }) {
  const { user } = useCurrentUser();
  const { data: routines } = useQuery({
    queryKey: ['my-routines', user?.email],
    queryFn: () => base44.entities.Routine.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });
  const active = (routines || []).find(r => r.is_active) || (routines || [])[0];
  if (!active) return (
    <button onClick={() => navigate('/rotina')} className="w-full bg-card border border-dashed border-border rounded-2xl p-5 text-center hover:border-primary/30 transition-all">
      <ListChecks className="w-7 h-7 mx-auto mb-2 text-muted-foreground opacity-40" />
      <p className="text-sm text-muted-foreground">Nenhuma rotina criada</p>
      <p className="text-xs text-primary font-bold mt-1">Criar minha rotina →</p>
    </button>
  );
  return (
    <button onClick={() => navigate(`/treino/${active.id}`)}
      className="w-full flex items-center gap-3 bg-card border border-primary/30 rounded-2xl p-4 text-left hover:border-primary/50 transition-all active:scale-[0.98]">
      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
        <Play className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{active.name}</p>
        <p className="text-xs text-muted-foreground">
          {(active.days_of_week || []).join(', ') || 'Qualquer dia'}
        </p>
      </div>
      <span className="text-xs font-bold text-primary">Iniciar →</span>
    </button>
  );
}

export default function HomeDashboard() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: skillProgress } = useQuery({
    queryKey: ['my-skill-progress', user?.email],
    queryFn: () => base44.entities.SkillProgress.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: skills } = useQuery({
    queryKey: ['all-skills'],
    queryFn: () => base44.entities.Skill.list(),
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

  const { data: checkin } = useQuery({
    queryKey: ['checkin-today', user?.email, today],
    queryFn: () => base44.entities.Checkin.filter({ student_email: user?.email, date: today }),
    enabled: !!user?.email,
  });

  const myProfile = profile?.[0];
  const levelInfo = calculateLevel(myProfile?.xp_total || 0);
  const checkedInToday = checkin && checkin.length > 0;

  // Active skill & boss
  const activeSkillProgress = skillProgress?.find(s => s.status === 'in_progress');
  const activeSkill = skills?.find(s => s.id === activeSkillProgress?.skill_id);
  let activeBoss = null;
  let activeBossProgress = null;
  if (activeSkill) {
    const skillBosses = (bosses || []).filter(b => b.skill_id === activeSkill.id).sort((a, b) => (a.order_in_skill || 1) - (b.order_in_skill || 1));
    for (const boss of skillBosses) {
      const bp = bossProgress?.find(p => p.boss_id === boss.id);
      if (!bp || !bp.defeated) { activeBoss = boss; activeBossProgress = bp; break; }
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = myProfile?.name?.split(' ')[0] || 'Atleta';

  return (
    <div className="max-w-lg mx-auto p-4 pb-6 space-y-4">

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
        <p className="text-muted-foreground text-sm">{greeting},</p>
        <h1 className="font-display text-2xl font-black text-foreground">{firstName} 💪</h1>
      </motion.div>

      {/* LEVEL CARD */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-gradient-to-br from-card to-card/80 border border-border rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Nível {levelInfo.level}</p>
            <p className="font-display font-black text-lg text-primary">{levelInfo.title}</p>
          </div>
          <div className="flex items-center gap-3">
            {myProfile?.current_streak > 0 && (
              <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5">
                <Flame className="w-4 h-4 text-primary" />
                <span className="font-display font-black text-sm text-primary">{myProfile.current_streak}</span>
              </div>
            )}
            <div className="flex items-center gap-1 bg-gold/10 border border-gold/20 rounded-xl px-3 py-1.5">
              <Zap className="w-4 h-4 text-gold" />
              <span className="font-display font-black text-sm text-gold">{(myProfile?.xp_total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <LevelProgress levelInfo={levelInfo} size="sm" />
      </motion.div>

      {/* CHECK-IN STRIP */}
      <motion.button
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        onClick={() => navigate('/')}
        className={`w-full flex items-center justify-between rounded-2xl p-4 border transition-all
          ${checkedInToday
            ? 'bg-success/10 border-success/30 cursor-default'
            : 'bg-primary/10 border-primary/30 hover:bg-primary/20 active:scale-[0.98]'
          }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${checkedInToday ? 'bg-success/20' : 'bg-primary/20'}`}>
            {checkedInToday
              ? <CheckCircle className="w-5 h-5 text-success" />
              : <Flame className="w-5 h-5 text-primary" />
            }
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">{checkedInToday ? 'Check-in feito hoje!' : 'Fazer check-in'}</p>
            <p className="text-xs text-muted-foreground">{checkedInToday ? `Streak: 🔥 ${myProfile?.current_streak || 0} dias` : '+50 XP ao registrar presença'}</p>
          </div>
        </div>
        {!checkedInToday && <ChevronRight className="w-5 h-5 text-primary" />}
      </motion.button>

      {/* ROTINA ATIVA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rotina Ativa</p>
          <button onClick={() => navigate('/rotina')} className="text-xs text-primary font-bold flex items-center gap-0.5">Ver todas <ChevronRight className="w-3 h-3" /></button>
        </div>
        <ActiveRoutineCard navigate={navigate} />
      </motion.div>

      {/* BOSS ATUAL */}
      {activeBoss && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Jornada — Chefe Atual</p>
          <button onClick={() => navigate('/jornada')} className="w-full bg-card border border-destructive/20 rounded-2xl p-4 text-left hover:border-destructive/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <Swords className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{activeBoss.name}</p>
                <p className="text-xs text-muted-foreground">Skill: {activeSkill?.name}</p>
              </div>
              <span className="text-xs text-destructive font-bold">{activeBoss.xp_bonus} XP</span>
            </div>
            <HPBar
              current={activeBossProgress ? activeBossProgress.current_hp : activeBoss.hp_total}
              total={activeBoss.hp_total}
              size="sm"
            />
          </button>
        </motion.div>
      )}

      {/* ATALHOS RÁPIDOS */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Acesso Rápido</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Biblioteca', icon: <BookOpen className="w-6 h-6" />, path: '/biblioteca', color: 'text-blue-400' },
            { label: 'Montar Rotina', icon: <ListChecks className="w-6 h-6" />, path: '/rotina', color: 'text-primary' },
            { label: 'Progresso', icon: <TrendingUp className="w-6 h-6" />, path: '/progresso', color: 'text-success' },
          ].map(s => (
            <button key={s.label} onClick={() => navigate(s.path)}
              className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-all active:scale-95"
            >
              <span className={s.color}>{s.icon}</span>
              <p className="text-xs font-bold text-center leading-tight">{s.label}</p>
            </button>
          ))}
        </div>
      </motion.div>

    </div>
  );
}