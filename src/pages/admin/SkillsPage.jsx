import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TreePine, Plus, Pencil, Trash2, Shield, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { CATEGORY_LABELS } from '@/lib/gamification';
import SkillForm from '@/components/admin/SkillForm';
import BossForm from '@/components/admin/BossForm';

export default function SkillsPage() {
  const queryClient = useQueryClient();
  const [skillFormOpen, setSkillFormOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [bossFormOpen, setBossFormOpen] = useState(false);
  const [editingBoss, setEditingBoss] = useState(null);
  const [bossSkillId, setBossSkillId] = useState(null);

  const { data: skills } = useQuery({
    queryKey: ['all-skills'],
    queryFn: () => base44.entities.Skill.list(),
  });

  const { data: bosses } = useQuery({
    queryKey: ['all-bosses'],
    queryFn: () => base44.entities.Boss.list(),
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id) => base44.entities.Skill.delete(id),
    onSuccess: () => {
      toast.success('Skill deletada');
      queryClient.invalidateQueries({ queryKey: ['all-skills'] });
    },
  });

  const deleteBossMutation = useMutation({
    mutationFn: (id) => base44.entities.Boss.delete(id),
    onSuccess: () => {
      toast.success('Chefe deletado');
      queryClient.invalidateQueries({ queryKey: ['all-bosses'] });
    },
  });

  const sortedSkills = [...(skills || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TreePine className="w-5 h-5 text-success" />
          <h1 className="font-display text-xl font-bold">SKILLS & CHEFES</h1>
        </div>
        <Button
          onClick={() => { setEditingSkill(null); setSkillFormOpen(true); }}
          className="gap-1.5 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Nova Skill
        </Button>
      </div>

      <div className="space-y-4">
        {sortedSkills.map((skill, index) => {
          const skillBosses = (bosses || []).filter(b => b.skill_id === skill.id).sort((a, b) => (a.order_in_skill || 1) - (b.order_in_skill || 1));
          const prereq = skills?.find(s => s.id === skill.prerequisite_skill_id);

          return (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Connector */}
              {index > 0 && <div className="w-0.5 h-4 bg-border mx-8 -mb-1" />}

              <Card className="p-4 bg-card border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{skill.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {skill.category && (
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                            {CATEGORY_LABELS[skill.category] || skill.category}
                          </span>
                        )}
                        {prereq && (
                          <span className="text-[10px] text-muted-foreground">
                            Req: {prereq.name}
                          </span>
                        )}
                        <span className="text-[10px] text-gold font-bold">+{skill.xp_bonus || 200} XP</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingSkill(skill); setSkillFormOpen(true); }}
                      className="p-1.5 hover:bg-muted rounded-lg"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteSkillMutation.mutate(skill.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>

                {skill.description && (
                  <p className="text-xs text-muted-foreground mb-3">{skill.description}</p>
                )}

                {/* Bosses */}
                <div className="space-y-2">
                  {skillBosses.map(boss => (
                    <div key={boss.id} className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2">
                      <Swords className="w-4 h-4 text-destructive shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{boss.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {boss.hp_total} HP • +{boss.xp_bonus || 500} XP bônus
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => { setEditingBoss(boss); setBossSkillId(skill.id); setBossFormOpen(true); }}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteBossMutation.mutate(boss.id)}
                          className="p-1 hover:bg-destructive/10 rounded"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => { setEditingBoss(null); setBossSkillId(skill.id); setBossFormOpen(true); }}
                    className="flex items-center gap-2 text-xs text-primary hover:underline py-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar Chefe
                  </button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {sortedSkills.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <TreePine className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Nenhuma skill criada</p>
        </div>
      )}

      <SkillForm
        open={skillFormOpen}
        onClose={() => { setSkillFormOpen(false); setEditingSkill(null); }}
        skill={editingSkill}
        skills={skills || []}
      />

      <BossForm
        open={bossFormOpen}
        onClose={() => { setBossFormOpen(false); setEditingBoss(null); }}
        boss={editingBoss}
        skillId={bossSkillId}
      />
    </div>
  );
}