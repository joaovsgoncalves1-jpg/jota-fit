import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Swords, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import HPBar from '@/components/game/HPBar';
import { CATEGORY_LABELS } from '@/lib/gamification';

const CATEGORY_EMOJI = {
  forca: '💪',
  mobilidade: '🤸',
  equilibrio: '⚖️',
  resistencia: '❤️',
  potencia: '⚡',
  flexibilidade: '🧘',
};

const STATUS_CONFIG = {
  completed: {
    card: 'border-success/40 bg-success/5',
    icon: 'bg-success/20',
    badge: 'bg-success/20 text-success',
    label: '✅ Concluída',
  },
  in_progress: {
    card: 'border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(249,115,22,0.08)]',
    icon: 'bg-primary/20',
    badge: 'bg-primary/20 text-primary',
    label: '🎯 Em progresso',
  },
  available: {
    card: 'border-gold/30 bg-gold/5',
    icon: 'bg-gold/20',
    badge: 'bg-gold/20 text-gold',
    label: '⭐ Disponível',
  },
  locked: {
    card: 'border-border opacity-45',
    icon: 'bg-muted',
    badge: 'bg-muted text-muted-foreground',
    label: '🔒 Bloqueada',
  },
};

export default function SkillsTreePage() {
  const { user } = useCurrentUser();
  const [expanded, setExpanded] = useState(null);

  const { data: skills } = useQuery({
    queryKey: ['all-skills'],
    queryFn: () => base44.entities.Skill.list(),
  });

  const { data: skillProgress } = useQuery({
    queryKey: ['my-skill-progress', user?.email],
    queryFn: () => base44.entities.SkillProgress.filter({ student_email: user?.email }),
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

  const sortedSkills = [...(skills || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  const completedCount = (skillProgress || []).filter(s => s.status === 'completed').length;
  const inProgressCount = (skillProgress || []).filter(s => s.status === 'in_progress').length;

  const getSkillStatus = (skill) => {
    const sp = skillProgress?.find(p => p.skill_id === skill.id);
    if (sp?.status === 'completed') return 'completed';
    if (sp?.status === 'in_progress') return 'in_progress';
    if (skill.prerequisite_skill_id) {
      const prereq = skillProgress?.find(p => p.skill_id === skill.prerequisite_skill_id);
      if (!prereq || prereq.status !== 'completed') return 'locked';
    }
    return 'available';
  };

  const getActiveBoss = (skill) => {
    const skillBosses = (bosses || [])
      .filter(b => b.skill_id === skill.id)
      .sort((a, b) => (a.order_in_skill || 1) - (b.order_in_skill || 1));
    for (const boss of skillBosses) {
      const bp = bossProgress?.find(p => p.boss_id === boss.id);
      if (!bp || !bp.defeated) return { boss, progress: bp };
    }
    return null;
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-black">ÁRVORE DE SKILLS</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Desbloqueie habilidades reais do corpo</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-success/10 border border-success/30 rounded-xl px-3 py-1.5 text-center">
            <p className="font-display font-black text-success text-base leading-none">{completedCount}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Concluídas</p>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-xl px-3 py-1.5 text-center">
            <p className="font-display font-black text-primary text-base leading-none">{inProgressCount}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Em progresso</p>
          </div>
        </div>
      </div>

      {/* Skill Tree */}
      <div className="space-y-2">
        {sortedSkills.map((skill, index) => {
          const status = getSkillStatus(skill);
          const cfg = STATUS_CONFIG[status];
          const activeBoss = getActiveBoss(skill);
          const skillBosses = (bosses || []).filter(b => b.skill_id === skill.id);
          const defeatedCount = skillBosses.filter(b => bossProgress?.find(p => p.boss_id === b.id)?.defeated).length;
          const isExpanded = expanded === skill.id;
          const sp = skillProgress?.find(p => p.skill_id === skill.id);

          return (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              {/* Connector */}
              {index > 0 && (
                <div className="flex justify-start pl-[22px] mb-0">
                  <div className="w-0.5 h-2 bg-border" />
                </div>
              )}

              <div className={`bg-card rounded-2xl border overflow-hidden transition-all ${cfg.card}`}>
                <button
                  className="w-full p-4 text-left"
                  onClick={() => setExpanded(isExpanded ? null : skill.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cfg.icon}`}>
                      {status === 'completed' ? (
                        <CheckCircle className="w-6 h-6 text-success" />
                      ) : status === 'locked' ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <span className="text-2xl">{CATEGORY_EMOJI[skill.category] || '💪'}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm">{skill.name}</h3>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.badge}`}>
                          {CATEGORY_LABELS[skill.category] || skill.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{skill.description}</p>
                      {/* Boss mini info */}
                      {status !== 'locked' && skillBosses.length > 0 && (
                        <p className="text-[10px] text-destructive font-bold mt-1">
                          ⚔️ {defeatedCount}/{skillBosses.length} chefes derrotados
                        </p>
                      )}
                    </div>

                    {/* XP + expand */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {skill.xp_bonus > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gold">
                          <Zap className="w-3 h-3" />{skill.xp_bonus}
                        </div>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                        {/* Status badge */}
                        <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ${cfg.badge}`}>
                          {cfg.label}
                        </div>

                        {/* Active boss */}
                        {status !== 'locked' && activeBoss && (
                          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Swords className="w-4 h-4 text-destructive" />
                              <p className="text-sm font-bold text-destructive">{activeBoss.boss.name}</p>
                              <span className="text-[10px] text-muted-foreground ml-auto">+{activeBoss.boss.xp_bonus} XP</span>
                            </div>
                            <HPBar
                              current={activeBoss.progress ? activeBoss.progress.current_hp : activeBoss.boss.hp_total}
                              total={activeBoss.boss.hp_total}
                              size="sm"
                            />
                            <p className="text-[10px] text-muted-foreground mt-2">
                              Complete treinos desta skill para causar dano ao chefe
                            </p>
                          </div>
                        )}

                        {/* Defeated all bosses */}
                        {status !== 'locked' && skillBosses.length > 0 && !activeBoss && status !== 'completed' && (
                          <div className="bg-success/5 border border-success/20 rounded-xl p-3 text-sm text-success font-bold">
                            🎉 Todos os chefes derrotados!
                          </div>
                        )}

                        {/* Prerequisite */}
                        {status === 'locked' && skill.prerequisite_skill_id && (
                          <p className="text-xs text-muted-foreground">
                            🔒 Conclua a skill anterior para desbloquear
                          </p>
                        )}

                        {/* XP bonus */}
                        {skill.xp_bonus > 0 && (
                          <p className="text-xs text-gold font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Recompensa: {skill.xp_bonus} XP ao concluir
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}

        {sortedSkills.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <span className="text-5xl block mb-4">🌳</span>
            <p className="text-sm font-bold">Nenhuma skill criada ainda</p>
            <p className="text-xs mt-1">O instructor irá adicionar skills em breve</p>
          </div>
        )}
      </div>
    </div>
  );
}