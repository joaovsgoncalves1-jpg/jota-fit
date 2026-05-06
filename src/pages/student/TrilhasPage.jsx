import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle, Lock, Target, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const DIFF_COLORS = {
  beginner: 'text-success border-success/30 bg-success/10',
  intermediate: 'text-gold border-gold/30 bg-gold/10',
  advanced: 'text-destructive border-destructive/30 bg-destructive/10',
  hybrid: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
};
const DIFF_LABELS = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado', hybrid: 'Híbrido' };

function PathRoadmap({ path, skills, skillProgress }) {
  const orderedSkills = (path.skills_order || []).map(id => skills?.find(s => s.id === id)).filter(Boolean);

  return (
    <div className="space-y-2 py-3">
      {orderedSkills.map((skill, i) => {
        const sp = skillProgress?.find(s => s.skill_id === skill.id);
        const isCompleted = sp?.status === 'completed';
        const isActive = sp?.status === 'in_progress';
        const isLocked = !isCompleted && !isActive && i > 0;

        return (
          <div key={skill.id} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm
              ${isCompleted ? 'bg-success/20 text-success' : isActive ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'}`}>
              {isCompleted ? '✅' : isActive ? '🎯' : isLocked ? '🔒' : `${i + 1}`}
            </div>
            {i < orderedSkills.length - 1 && (
              <div className="absolute left-[19px] mt-8 w-0.5 h-6 bg-border" style={{ position: 'relative', marginLeft: 0 }} />
            )}
            <div className="flex-1">
              <p className={`text-sm font-bold ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>{skill.name}</p>
              <p className="text-xs text-muted-foreground">{skill.category}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TrilhasPage() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [expandedPath, setExpandedPath] = useState(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: paths } = useQuery({
    queryKey: ['all-paths'],
    queryFn: () => base44.entities.LearningPath.list(),
  });

  const { data: skills } = useQuery({
    queryKey: ['all-skills'],
    queryFn: () => base44.entities.Skill.list(),
  });

  const { data: skillProgress } = useQuery({
    queryKey: ['my-skill-progress', user?.email],
    queryFn: () => base44.entities.SkillProgress.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: myPathProgress } = useQuery({
    queryKey: ['my-path-progress', user?.email],
    queryFn: () => base44.entities.StudentPathProgress.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const startPathMutation = useMutation({
    mutationFn: async (path) => {
      // Deactivate other paths
      const existing = myPathProgress?.filter(p => p.active);
      await Promise.all((existing || []).map(p => base44.entities.StudentPathProgress.update(p.id, { active: false })));

      // Check if already started
      const prev = myPathProgress?.find(p => p.path_id === path.id);
      if (prev) {
        await base44.entities.StudentPathProgress.update(prev.id, { active: true });
      } else {
        await base44.entities.StudentPathProgress.create({
          student_email: user.email,
          path_id: path.id,
          started_date: today,
          active: true,
        });
        // Start first skill
        const firstSkillId = path.skills_order?.[0];
        if (firstSkillId) {
          const sp = skillProgress?.find(s => s.skill_id === firstSkillId);
          if (!sp) {
            await base44.entities.SkillProgress.create({
              student_email: user.email,
              skill_id: firstSkillId,
              status: 'in_progress',
              started_date: today,
            });
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast({ title: 'Trilha iniciada! 🚀 Bora evoluir!' });
    },
  });

  const activePath = myPathProgress?.find(p => p.active);

  return (
    <div className="max-w-lg mx-auto p-4 pb-8 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="w-5 h-5 text-primary" />
        <h1 className="font-display text-lg font-black tracking-widest">TRILHAS</h1>
      </div>

      {activePath && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-3 text-sm font-bold text-primary flex items-center gap-2">
          <Target className="w-4 h-4" />
          Trilha ativa: {paths?.find(p => p.id === activePath.path_id)?.name}
        </div>
      )}

      <div className="space-y-4">
        {(paths || []).map((path, i) => {
          const myProgress = myPathProgress?.find(p => p.path_id === path.id);
          const isActive = myProgress?.active;
          const expanded = expandedPath === path.id;
          const orderedSkills = (path.skills_order || []).map(id => skills?.find(s => s.id === id)).filter(Boolean);
          const completedCount = orderedSkills.filter(s => skillProgress?.find(sp => sp.skill_id === s.id && sp.status === 'completed')).length;
          const pct = orderedSkills.length > 0 ? Math.round((completedCount / orderedSkills.length) * 100) : 0;

          return (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`bg-card rounded-2xl border overflow-hidden ${isActive ? 'border-primary/40' : 'border-border'}`}
            >
              <button className="w-full p-5 text-left" onClick={() => setExpandedPath(expanded ? null : path.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{path.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base">{path.name}</h3>
                        {isActive && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black">ATIVA</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{path.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIFF_COLORS[path.difficulty]}`}>
                          {DIFF_LABELS[path.difficulty]}
                        </span>
                        <span className="text-xs text-muted-foreground">~{path.estimated_weeks} semanas</span>
                        <span className="text-xs text-muted-foreground">{orderedSkills.length} skills</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform shrink-0 mt-1 ${expanded ? 'rotate-90' : ''}`} />
                </div>
                {myProgress && orderedSkills.length > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-bold">{completedCount}/{orderedSkills.length} skills ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </button>

              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-border px-5 pb-4"
                >
                  <PathRoadmap path={path} skills={skills} skillProgress={skillProgress} />
                  <Button
                    onClick={() => startPathMutation.mutate(path)}
                    disabled={startPathMutation.isPending || isActive}
                    className={`w-full mt-3 font-bold rounded-xl ${isActive ? 'bg-muted text-muted-foreground' : 'bg-primary'}`}
                  >
                    {isActive ? '✅ Trilha ativa' : myProgress ? '🔄 Retomar trilha' : '🚀 Começar trilha'}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {(paths || []).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Nenhuma trilha disponível</p>
          </div>
        )}
      </div>
    </div>
  );
}