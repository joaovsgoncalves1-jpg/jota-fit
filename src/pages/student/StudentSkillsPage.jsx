import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { motion } from 'framer-motion';
import { TreePine, Lock, CheckCircle, Swords } from 'lucide-react';
import HPBar from '@/components/game/HPBar';
import { CATEGORY_LABELS } from '@/lib/gamification';

export default function StudentSkillsPage() {
  const { user } = useCurrentUser();

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

  const getSkillStatus = (skill) => {
    const sp = skillProgress?.find(p => p.skill_id === skill.id);
    if (sp?.status === 'completed') return 'completed';
    if (sp?.status === 'in_progress') return 'in_progress';
    
    // Check prerequisite
    if (skill.prerequisite_skill_id) {
      const prereqProgress = skillProgress?.find(p => p.skill_id === skill.prerequisite_skill_id);
      if (!prereqProgress || prereqProgress.status !== 'completed') return 'locked';
    }
    
    // First skill or prereq completed
    if (!skill.prerequisite_skill_id || skillProgress?.find(p => p.skill_id === skill.prerequisite_skill_id)?.status === 'completed') {
      return 'available';
    }
    return 'locked';
  };

  const getActiveBoss = (skill) => {
    const skillBosses = (bosses || []).filter(b => b.skill_id === skill.id).sort((a, b) => (a.order_in_skill || 1) - (b.order_in_skill || 1));
    for (const boss of skillBosses) {
      const bp = bossProgress?.find(p => p.boss_id === boss.id);
      if (!bp || !bp.defeated) return { boss, progress: bp };
    }
    return null;
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <TreePine className="w-5 h-5 text-success" />
        <h1 className="font-display text-lg font-bold">ÁRVORE DE SKILLS</h1>
      </div>

      <div className="space-y-3">
        {sortedSkills.map((skill, index) => {
          const status = getSkillStatus(skill);
          const activeBoss = getActiveBoss(skill);
          const skillBosses = (bosses || []).filter(b => b.skill_id === skill.id);
          const defeatedBosses = skillBosses.filter(b => bossProgress?.find(p => p.boss_id === b.id)?.defeated);

          return (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              {/* Connector line */}
              {index > 0 && (
                <div className="absolute -top-3 left-7 w-0.5 h-3 bg-border" />
              )}

              <div className={`bg-card rounded-2xl border p-4 transition-all
                ${status === 'completed' ? 'border-success/40 bg-success/5' : 
                  status === 'in_progress' || status === 'available' ? 'border-primary/40' : 
                  'border-border opacity-50'}`}
              >
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                    ${status === 'completed' ? 'bg-success/20' : 
                      status === 'in_progress' || status === 'available' ? 'bg-primary/20' : 
                      'bg-muted'}`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : status === 'locked' ? (
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    ) : (
                      <Swords className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">{skill.name}</h3>
                      {skill.category && (
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          {CATEGORY_LABELS[skill.category] || skill.category}
                        </span>
                      )}
                    </div>
                    {skill.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                    )}

                    {/* Boss progress */}
                    {status !== 'locked' && activeBoss && (
                      <div className="mt-3 bg-muted/30 rounded-xl p-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-destructive">⚔️ {activeBoss.boss.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            Chefe {defeatedBosses.length + 1}/{skillBosses.length}
                          </span>
                        </div>
                        <HPBar
                          current={activeBoss.progress ? activeBoss.progress.current_hp : activeBoss.boss.hp_total}
                          total={activeBoss.boss.hp_total}
                          size="sm"
                        />
                      </div>
                    )}

                    {status === 'completed' && (
                      <p className="text-xs text-success font-bold mt-2">✅ Concluída</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {sortedSkills.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <TreePine className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Nenhuma skill criada ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}