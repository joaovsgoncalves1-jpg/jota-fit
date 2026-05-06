import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { calculateLevel } from '@/lib/gamification';
import { motion } from 'framer-motion';
import { Trophy, Medal, Flame } from 'lucide-react';
import StreakBadge from '@/components/game/StreakBadge';

export default function RankingPage() {
  const { user } = useCurrentUser();

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

  const sorted = [...(profiles || [])].sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0));

  const getCompletedSkills = (email) => {
    return (skillProgress || []).filter(sp => sp.student_email === email && sp.status === 'completed').length;
  };

  const podiumColors = ['text-gold', 'text-gray-400', 'text-amber-700'];
  const podiumEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-gold" />
        <h1 className="font-display text-lg font-bold">RANKING</h1>
      </div>

      {/* Podium (top 3) */}
      {sorted.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6 px-4">
          {[1, 0, 2].map(pos => {
            const p = sorted[pos];
            if (!p) return null;
            const lvl = calculateLevel(p.xp_total || 0, levelConfigs);
            const heights = ['h-28', 'h-20', 'h-16'];
            return (
              <motion.div
                key={p.id}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pos * 0.15 }}
              >
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-muted flex items-center justify-center text-xl font-display font-black mb-2 ${pos === 0 ? 'ring-2 ring-gold' : ''}`}>
                  {p.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-xs font-bold text-foreground truncate max-w-[80px]">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">Nv.{lvl.level}</span>
                <div className={`w-20 ${heights[pos]} bg-card border border-border rounded-t-xl mt-2 flex flex-col items-center justify-center`}>
                  <span className="text-2xl">{podiumEmojis[pos]}</span>
                  <span className="font-display text-xs font-bold text-gold mt-1">{p.xp_total || 0}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full ranking */}
      <div className="space-y-2">
        {sorted.map((p, index) => {
          const lvl = calculateLevel(p.xp_total || 0, levelConfigs);
          const isMe = p.email === user?.email;
          const completedSkills = getCompletedSkills(p.email);

          return (
            <motion.div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                ${isMe ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              {/* Position */}
              <div className={`w-8 text-center font-display font-bold text-sm
                ${index < 3 ? podiumColors[index] : 'text-muted-foreground'}`}>
                {index < 3 ? podiumEmojis[index] : `${index + 1}º`}
              </div>

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {p.name?.[0]?.toUpperCase() || '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm truncate">{p.name}</span>
                  {isMe && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">VOCÊ</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">Nv.{lvl.level} • {lvl.title}</span>
                  {completedSkills > 0 && (
                    <span className="text-[10px] text-success">🏆 {completedSkills}</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 shrink-0">
                {p.current_streak > 0 && (
                  <StreakBadge days={p.current_streak} size="sm" />
                )}
                <div className="text-right">
                  <span className="font-display text-sm font-bold text-gold">{p.xp_total || 0}</span>
                  <p className="text-[10px] text-muted-foreground">XP</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Nenhum aluno registrado ainda</p>
        </div>
      )}
    </div>
  );
}