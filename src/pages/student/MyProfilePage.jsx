import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { calculateLevel } from '@/lib/gamification';
import { motion } from 'framer-motion';
import { LogOut, Edit, Share2, TrendingUp, Dumbbell, Flame, Trophy, ChevronRight, Lock } from 'lucide-react';
import LevelProgress from '@/components/game/LevelProgress';
import { useNavigate, Link } from 'react-router-dom';
import ShareBadgeModal from '@/components/profile/ShareBadgeModal';

const RARITY_STYLES = {
  common: 'border-muted-foreground/30 bg-muted/20 text-muted-foreground',
  rare: 'border-blue-400/40 bg-blue-400/10 text-blue-400',
  epic: 'border-epic/40 bg-epic/10 text-epic',
  legendary: 'border-gold/50 bg-gold/10 text-gold shadow-md shadow-gold/10',
};

const PLAN_BADGES = {
  free: { label: 'Free', color: 'bg-muted text-muted-foreground' },
  pro: { label: 'Pro ⭐', color: 'bg-primary/20 text-primary' },
  premium: { label: 'Premium 👑', color: 'bg-gold/20 text-gold' },
};

export default function MyProfilePage() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [shareAchievement, setShareAchievement] = useState(null);

  const { data: profileArr } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  const { data: levelConfigs } = useQuery({ queryKey: ['level-configs'], queryFn: () => base44.entities.LevelConfig.list() });
  const { data: skillProgress } = useQuery({
    queryKey: ['my-skill-progress', user?.email],
    queryFn: () => base44.entities.SkillProgress.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });
  const { data: skills } = useQuery({ queryKey: ['all-skills'], queryFn: () => base44.entities.Skill.list() });
  const { data: achievements } = useQuery({ queryKey: ['all-achievements'], queryFn: () => base44.entities.Achievement.list() });
  const { data: unlockedAchievements } = useQuery({
    queryKey: ['my-achievements', user?.email],
    queryFn: () => base44.entities.AchievementUnlock.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });
  const { data: workoutLogs } = useQuery({
    queryKey: ['my-workout-logs', user?.email],
    queryFn: () => base44.entities.WorkoutLog.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });
  const { data: workouts } = useQuery({ queryKey: ['all-workouts'], queryFn: () => base44.entities.Workout.list() });
  const { data: checkins } = useQuery({
    queryKey: ['my-checkins', user?.email],
    queryFn: () => base44.entities.Checkin.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });
  const { data: measurements } = useQuery({
    queryKey: ['my-measurements', user?.email],
    queryFn: () => base44.entities.BodyMeasurement.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });
  const { data: allProfiles } = useQuery({ queryKey: ['all-profiles'], queryFn: () => base44.entities.StudentProfile.list('-xp_total') });
  const { data: feedbacks } = useQuery({
    queryKey: ['my-feedbacks', user?.email],
    queryFn: () => base44.entities.Feedback.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const myProfile = profileArr?.[0];
  const levelInfo = calculateLevel(myProfile?.xp_total || 0, levelConfigs);
  const plan = myProfile?.plan_type || 'free';
  const planBadge = PLAN_BADGES[plan];

  const totalWorkouts = workoutLogs?.length || 0;
  const totalCheckins = checkins?.length || 0;
  const completedSkills = skillProgress?.filter(s => s.status === 'completed').length || 0;

  // Ranking
  const sortedProfiles = [...(allProfiles || [])].sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0));
  const myRank = sortedProfiles.findIndex(p => p.email === user?.email) + 1;
  const nearbyProfiles = sortedProfiles.slice(Math.max(0, myRank - 2), myRank + 2);

  const latestMeasurement = (measurements || []).sort((a, b) => b.date?.localeCompare(a.date))[0];

  if (!myProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-8 space-y-5">

      {/* HEADER */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-gold/20 border border-primary/20 flex items-center justify-center font-display font-black text-2xl text-primary">
              {myProfile.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="font-display font-black text-xl">{myProfile.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${planBadge.color}`}>{planBadge.label}</span>
                {myProfile.current_streak > 0 && (
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">🔥 {myProfile.current_streak} dias</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/perfil/editar')} className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
              <Edit className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => base44.auth.logout()} className="p-2 rounded-xl bg-muted hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <LevelProgress levelInfo={levelInfo} />
        {plan !== 'premium' && (
          <Link to="/planos" className="mt-3 flex items-center justify-between bg-gold/5 border border-gold/20 rounded-xl px-3 py-2 text-xs text-gold font-bold hover:bg-gold/10 transition-colors">
            <span>✨ Fazer upgrade de plano</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Treinos', value: totalWorkouts, icon: <Dumbbell className="w-4 h-4" /> },
          { label: 'Check-ins', value: totalCheckins, icon: <Flame className="w-4 h-4" /> },
          { label: 'Streak máx.', value: myProfile.max_streak || 0, icon: '🔥' },
          { label: 'XP Total', value: (myProfile.xp_total || 0).toLocaleString(), icon: <Trophy className="w-4 h-4" /> },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="text-primary mx-auto flex justify-center mb-1">{s.icon}</div>
            <p className="font-display font-black text-base leading-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* SKILLS */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">🌳 Skills ({completedSkills}/{skills?.length || 0})</h2>
        <div className="grid grid-cols-3 gap-2">
          {(skills || []).slice(0, 9).map(skill => {
            const sp = skillProgress?.find(s => s.skill_id === skill.id);
            const isCompleted = sp?.status === 'completed';
            const isProgress = sp?.status === 'in_progress';
            const isLocked = !sp;
            return (
              <div key={skill.id} className={`rounded-xl p-2 text-center border text-xs font-bold
                ${isCompleted ? 'bg-success/10 border-success/30 text-success' :
                  isProgress ? 'bg-gold/10 border-gold/30 text-gold' :
                  'bg-muted/30 border-border text-muted-foreground'}`}>
                {isCompleted ? '✅' : isProgress ? '🎯' : <Lock className="w-3 h-3 mx-auto mb-0.5" />}
                <p className="mt-0.5 truncate text-[10px]">{skill.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONQUISTAS */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h2 className="font-bold text-sm mb-3">🏆 Conquistas ({unlockedAchievements?.length || 0}/{achievements?.length || 0})</h2>
        <div className="grid grid-cols-4 gap-2">
          {(achievements || []).map(ach => {
            const unlocked = unlockedAchievements?.find(u => u.achievement_id === ach.id);
            return (
              <motion.div
                key={ach.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => unlocked && setShareAchievement({ achievement: ach, profile: myProfile })}
                className={`rounded-xl p-2 text-center border text-xs cursor-pointer
                  ${unlocked ? RARITY_STYLES[ach.rarity || 'common'] : 'bg-muted/20 border-border opacity-40'}`}
              >
                <div className="text-xl mb-0.5">{ach.icon || '🏅'}</div>
                <p className="text-[9px] font-bold truncate leading-tight">{ach.name}</p>
                {unlocked && <Share2 className="w-2.5 h-2.5 mx-auto mt-1 opacity-60" />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* MEDIDAS */}
      {latestMeasurement && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Medidas</h2>
            <Link to="/progresso" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver completo <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Peso', value: latestMeasurement.weight_kg, unit: 'kg' },
              { label: 'Gordura', value: latestMeasurement.body_fat_pct, unit: '%' },
              { label: 'Cintura', value: latestMeasurement.waist_circumference, unit: 'cm' },
            ].filter(m => m.value).map(m => (
              <div key={m.label} className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="font-display font-black text-base">{m.value}{m.unit}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTÓRICO */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h2 className="font-bold text-sm mb-3">📋 Últimos Treinos</h2>
        <div className="space-y-2">
          {(workoutLogs || []).slice(0, 5).map(log => {
            const workout = workouts?.find(w => w.id === log.workout_id);
            return (
              <div key={log.id} className="flex items-center justify-between bg-muted/20 rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{workout?.name || 'Treino'}</p>
                  <p className="text-xs text-muted-foreground">{log.completion_date}</p>
                </div>
                <span className="text-xs font-bold text-gold">+{log.xp_earned} XP</span>
              </div>
            );
          })}
          {(workoutLogs || []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum treino registrado</p>
          )}
        </div>
      </div>

      {/* RANKING */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h2 className="font-bold text-sm mb-3">🏆 Ranking — #{myRank}</h2>
        <div className="space-y-2">
          {nearbyProfiles.map((p, i) => {
            const rank = sortedProfiles.indexOf(p) + 1;
            const isMe = p.email === user?.email;
            return (
              <div key={p.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${isMe ? 'bg-primary/10 border border-primary/20' : 'bg-muted/20'}`}>
                <span className="font-display font-black text-sm w-5 text-muted-foreground">{rank}</span>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {p.name?.[0]?.toUpperCase()}
                </div>
                <p className="flex-1 text-sm font-bold truncate">{p.name} {isMe && <span className="text-[10px] text-primary">você</span>}</p>
                <span className="font-display text-sm font-black text-gold">{(p.xp_total || 0).toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FEEDBACK (Premium) */}
      {plan === 'premium' && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-bold text-sm mb-3">💬 Feedback do Jota</h2>
          {(feedbacks || []).slice(0, 3).map(fb => (
            <div key={fb.id} className="bg-muted/20 rounded-xl p-3 mb-2">
              <p className="text-xs text-muted-foreground mb-1">{fb.created_date?.slice(0, 10)}</p>
              <p className="text-sm">{fb.text}</p>
            </div>
          ))}
          {(feedbacks || []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum feedback ainda. Em breve! 💪</p>
          )}
        </div>
      )}
      {plan !== 'premium' && (
        <Link to="/planos" className="block bg-card border border-gold/20 rounded-2xl p-4 text-center hover:border-gold/40 transition-colors">
          <p className="text-sm font-bold text-gold">👑 Upgrade para Premium</p>
          <p className="text-xs text-muted-foreground mt-1">Receba feedback semanal personalizado do Jota</p>
        </Link>
      )}

      {shareAchievement && (
        <ShareBadgeModal
          achievement={shareAchievement.achievement}
          profile={shareAchievement.profile}
          onClose={() => setShareAchievement(null)}
        />
      )}
    </div>
  );
}