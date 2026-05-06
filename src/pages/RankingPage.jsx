import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { calculateLevel } from '@/lib/gamification';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Zap, TreePine, ChevronDown } from 'lucide-react';
import StreakBadge from '@/components/game/StreakBadge';
import LevelProgress from '@/components/game/LevelProgress';

export default function RankingPage() {
  const { user } = useCurrentUser();
  const [expanded, setExpanded] = useState(null);

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.StudentProfile.list('-xp_total'),
  });

  const { data: levelConfigs } = useQuery({
    queryKey: ['level-configs'],
    queryFn: () => base44.entities.LevelConfig.list(),
  });

  const { data: skillProgress } = useQuery({
    queryKey: ['all-skill-progress'],
    queryFn: () => base44.entities.SkillProgress.list(),
  });

  const { data: workoutLogs } = useQuery({
    queryKey: ['all-workout-logs-ranking'],
    queryFn: () => base44.entities.WorkoutLog.list(),
  });

  const sorted = [...(profiles || [])].sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0));

  const getStats = (email) => {
    const completedSkills = (skillProgress || []).filter(sp => sp.student_email === email && sp.status === 'completed').length;
    const totalWorkouts = (workoutLogs || []).filter(wl => wl.student_email === email).length;
    return { completedSkills, totalWorkouts };
  };

  const myRank = sorted.findIndex(p => p.email === user?.email) + 1;
  const myProfile = sorted.find(p => p.email === user?.email);

  const podiumOrder = [1, 0, 2]; // silver, gold, bronze
  const podiumHeights = ['h-24', 'h-32', 'h-20'];
  const podiumEmojis = ['🥇', '🥈', '🥉'];
  const podiumGlows = [
    'ring-2 ring-gold shadow-[0_0_20px_rgba(251,191,36,0.4)]',
    'ring-1 ring-gray-400',
    'ring-1 ring-amber-700',
  ];
  const podiumLabelColors = ['text-gold', 'text-gray-400', 'text-amber-600'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-6 pb-2 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            <h1 className="font-display text-xl font-black tracking-widest">RANKING</h1>
          </div>
          {myRank > 0 && (
            <div className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full">
              Você: #{myRank}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Classificação por XP acumulado</p>
      </div>

      {/* My position highlight */}
      {myProfile && myRank > 3 && (
        <div className="px-4 mb-4 max-w-lg mx-auto">
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-display font-black text-xs text-primary-foreground">
              {myProfile.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary">Sua posição</p>
              <LevelProgress levelInfo={calculateLevel(myProfile.xp_total || 0, levelConfigs)} />
            </div>
            <span className="font-display font-black text-primary text-lg">#{myRank}</span>
          </div>
        </div>
      )}

      {/* Podium */}
      {sorted.length >= 3 && (
        <div className="px-4 max-w-lg mx-auto">
          <div className="flex items-end justify-center gap-2 mb-6">
            {podiumOrder.map((pos, displayPos) => {
              const p = sorted[pos];
              if (!p) return null;
              const lvl = calculateLevel(p.xp_total || 0, levelConfigs);
              const isMe = p.email === user?.email;
              return (
                <motion.div
                  key={p.id}
                  className="flex flex-col items-center flex-1"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: displayPos * 0.12, type: 'spring', stiffness: 200 }}
                >
                  {/* Avatar */}
                  <motion.div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-display font-black text-xl mb-1
                      ${isMe ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}
                      ${displayPos === 0 ? podiumGlows[0] : displayPos === 1 ? '' : podiumGlows[2]}`}
                    animate={displayPos === 1 ? { y: [0, -4, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  >
                    {p.name?.[0]?.toUpperCase() || '?'}
                  </motion.div>
                  <p className="text-xs font-bold text-center truncate w-full px-1">{p.name?.split(' ')[0]}</p>
                  <p className={`text-[10px] font-bold ${podiumLabelColors[displayPos]}`}>Nv.{lvl.level}</p>

                  {/* Podium base */}
                  <div className={`w-full ${podiumHeights[displayPos]} rounded-t-xl mt-2 flex flex-col items-center justify-center gap-1
                    ${displayPos === 1 ? 'bg-gradient-to-b from-gold/20 to-gold/5 border border-gold/30' :
                      displayPos === 0 ? 'bg-gradient-to-b from-gray-400/10 to-transparent border border-gray-400/20' :
                      'bg-gradient-to-b from-amber-700/10 to-transparent border border-amber-700/20'}`}
                  >
                    <span className="text-2xl">{podiumEmojis[displayPos]}</span>
                    <div className="flex items-center gap-0.5">
                      <Zap className="w-3 h-3 text-gold" />
                      <span className="font-display text-xs font-bold text-gold">{(p.xp_total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="px-4 pb-8 max-w-lg mx-auto space-y-2">
        {sorted.map((p, index) => {
          const lvl = calculateLevel(p.xp_total || 0, levelConfigs);
          const isMe = p.email === user?.email;
          const { completedSkills, totalWorkouts } = getStats(p.email);
          const isExpanded = expanded === p.id;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
            >
              <button
                className={`w-full text-left rounded-2xl border transition-all overflow-hidden
                  ${isMe ? 'bg-primary/10 border-primary/30' : 'bg-card border-border hover:border-muted-foreground/30'}`}
                onClick={() => setExpanded(isExpanded ? null : p.id)}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Position */}
                  <div className={`w-8 text-center font-display font-black text-sm shrink-0
                    ${index === 0 ? 'text-gold' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {index < 3 ? podiumEmojis[index] : `${index + 1}`}
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 relative
                    ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {p.name?.[0]?.toUpperCase() || '?'}
                    {completedSkills >= 3 && (
                      <span className="absolute -top-1 -right-1 text-xs">👑</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm truncate">{p.name}</span>
                      {isMe && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold shrink-0">VOCÊ</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">Nv.{lvl.level} {lvl.title}</span>
                      {completedSkills > 0 && (
                        <span className="text-[10px] text-success flex items-center gap-0.5">
                          <TreePine className="w-2.5 h-2.5" />{completedSkills}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-2 shrink-0">
                    {p.current_streak > 1 && (
                      <div className="hidden sm:flex items-center gap-0.5 text-primary text-xs font-bold">
                        <Flame className="w-3 h-3" />{p.current_streak}
                      </div>
                    )}
                    <div className="text-right">
                      <div className="font-display text-sm font-black text-gold">{(p.xp_total || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">XP</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded row */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pt-1 border-t border-border/50 grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="font-display font-black text-primary">{totalWorkouts}</div>
                          <div className="text-[10px] text-muted-foreground">Treinos</div>
                        </div>
                        <div>
                          <div className="font-display font-black text-success">{completedSkills}</div>
                          <div className="text-[10px] text-muted-foreground">Skills</div>
                        </div>
                        <div>
                          <div className="font-display font-black text-gold">{p.max_streak || 0}</div>
                          <div className="text-[10px] text-muted-foreground">Streak máx.</div>
                        </div>
                      </div>
                      <div className="px-4 pb-3">
                        <LevelProgress levelInfo={lvl} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          );
        })}

        {sorted.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Nenhum aluno registrado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}