import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Target, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import MissionForm from '@/components/admin/MissionForm';

const CONDITION_LABELS = {
  workouts_completed: 'Treinos concluídos',
  streak_days: 'Dias de streak',
  bosses_defeated: 'Chefes derrotados',
  checkins_completed: 'Check-ins realizados',
  xp_earned: 'XP acumulado',
};

export default function MissionsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMission, setEditingMission] = useState(null);

  const { data: missions } = useQuery({
    queryKey: ['all-missions'],
    queryFn: () => base44.entities.Mission.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Mission.delete(id),
    onSuccess: () => {
      toast.success('Missão deletada');
      queryClient.invalidateQueries({ queryKey: ['all-missions'] });
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold">MISSÕES</h1>
        </div>
        <Button
          onClick={() => { setEditingMission(null); setFormOpen(true); }}
          className="gap-1.5 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Nova Missão
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(missions || []).map((mission, i) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="p-4 bg-card border-border">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-sm">{mission.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingMission(mission); setFormOpen(true); }}
                    className="p-1.5 hover:bg-muted rounded-lg"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(mission.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
              {mission.description && (
                <p className="text-xs text-muted-foreground mb-2">{mission.description}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {CONDITION_LABELS[mission.condition_type] || mission.condition_type}: {mission.condition_value}
                </span>
                <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full font-bold">
                  +{mission.xp_reward} XP
                </span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {mission.for_all ? 'Todos' : 'Específico'}
                </span>
              </div>
              {(mission.start_date || mission.end_date) && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  {mission.start_date && `De: ${mission.start_date}`} {mission.end_date && `Até: ${mission.end_date}`}
                </p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {(!missions || missions.length === 0) && (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Nenhuma missão criada</p>
        </div>
      )}

      <MissionForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingMission(null); }}
        mission={editingMission}
      />
    </div>
  );
}