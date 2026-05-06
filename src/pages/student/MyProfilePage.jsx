import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { calculateLevel } from '@/lib/gamification';
import LevelProgress from '@/components/game/LevelProgress';
import StreakBadge from '@/components/game/StreakBadge';
import HPBar from '@/components/game/HPBar';
import { motion } from 'framer-motion';
import { Trophy, Swords, Dumbbell, Star, LogOut } from 'lucide-react';
import { CATEGORY_LABELS } from '@/lib/gamification';

export default function MyProfilePage() {
  const { user } = useCurrentUser();

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: levelConfigs } = useQuery({
    queryKey: ['level-configs'],
    queryFn: () => base44.entities.LevelConfig.list(),
  });

  const { data: skillProgress } = useQuery({
    queryKey: ['my-skill-progress', user?.email],
    queryFn: () => base44.entities.SkillProgress.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: bossProgress } = useQuery({
    queryKey: ['my-boss-progress', user?.email],
    queryFn: () => base44.entities.BossProgress.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: bosses } = useQuery({
    queryKey: ['all-bosses'],
    queryFn: () => base44.entities.Boss.list(),
  });

  const { data: skills } = useQuery({
    queryKey: ['all-skills'],
    queryFn: () => base44.entities.Skill.list(),
  });

  const { data: workoutLogs } = useQuery({
    queryKey: ['my-workout-logs', user?.email],
    queryFn: () => base44.entities.WorkoutLog.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: achievementUnlocks } = useQuery({
    queryKey: ['my-achievements', user?.email],
    queryFn: () => base44.entities.AchievementUnlock.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: achievements } = useQuery({
    queryKey: ['all-achievements'],
    queryFn: () => base44.entities.Achievement.list(),
  });

  const myProfile = profile?.[0];
  const levelInfo = calculateLevel(myProfile?.xp_total || 0, levelConfigs);
  const completedSkills = skillProgress?.filter(sp => sp.status === 'completed') || [];
  const currentBossProgress = bossProgress?.find(bp => !bp.defeated);
  const currentBoss = currentBossProgress ? bosses?.find(b => b.id === currentBossProgress.boss_id) : null;

  const unlockedAchievementIds = new Set((achievementUnlocks || []).map(au => au.achievement_id));

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div
        className="bg-card rounded-2xl border border-border p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-gold mx-auto mb-4 flex items-center justify-center text-3xl font-display font-black text-white">
          {myProfile?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <h1 className="text-xl font-bold text-foreground">{myProfile?.name || user?.full_name || 'Carregando...'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{levelInfo.title}</p>

        <div className="mt-4">
          <LevelProgress levelInfo={levelInfo} />
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          <StreakBadge days={myProfile?.current_streak || 0} />
          <div className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
            Recorde: 🔥 {myProfile?.max_streak || 0}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'XP Total', value: myProfile?.xp_total || 0, icon: '⚡', color: 'text-gold' },
          { label: 'Treinos', value: workoutLogs?.length || 0, icon: '💪', color: 'text-primary' },
          { label: 'Skills', value: completedSkills.length, icon: '🏆', color: 'text-success' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-card rounded-xl border border-border p-3 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <span className="text-xl">{stat.icon}</span>
            <p className={`font-display font-bold text-lg mt-1 ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Current Boss */}
      {currentBoss && currentBossProgress && (
        <motion.div
          className="bg-card rounded-2xl border border-border p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Swords className="w-5 h-5 text-destructive" />
            <h3 className="font-bold text-sm">Chefe Atual</h3>
          </div>
          <p className="font-display font-bold text-foreground mb-2">{currentBoss.name}</p>
          <HPBar
            current={currentBossProgress.current_hp}
            total={currentBoss.hp_total}
            label="HP"
            size="md"
          />
        </motion.div>
      )}

      {/* Achievements */}
      <motion.div
        className="bg-card rounded-2xl border border-border p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-gold" />
          <h3 className="font-bold text-sm">Conquistas</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {unlockedAchievementIds.size}/{achievements?.length || 0}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {(achievements || []).slice(0, 8).map(ach => {
            const unlocked = unlockedAchievementIds.has(ach.id);
            return (
              <div
                key={ach.id}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1
                  ${unlocked 
                    ? 'bg-gold/10 border border-gold/30' 
                    : 'bg-muted/50 border border-border opacity-40'
                  }`}
              >
                <span className="text-lg">{unlocked ? '🏅' : '🔒'}</span>
                <span className="text-[8px] text-muted-foreground mt-0.5 line-clamp-2">{ach.name}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Logout */}
      <button
        onClick={() => base44.auth.logout()}
        className="flex items-center gap-2 text-muted-foreground hover:text-destructive text-sm mx-auto py-4 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>
    </div>
  );
}