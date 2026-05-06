import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Dumbbell, Plus, Trash2, Pencil, Users, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import WorkoutForm from '@/components/admin/WorkoutForm';
import AssignWorkoutDialog from '@/components/admin/AssignWorkoutDialog';

export default function WorkoutsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [assignWorkout, setAssignWorkout] = useState(null);

  const { data: workouts } = useQuery({
    queryKey: ['all-workouts'],
    queryFn: () => base44.entities.Workout.list(),
  });

  const { data: skills } = useQuery({
    queryKey: ['all-skills'],
    queryFn: () => base44.entities.Skill.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workout.delete(id),
    onSuccess: () => {
      toast.success('Treino deletado');
      queryClient.invalidateQueries({ queryKey: ['all-workouts'] });
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold">TREINOS</h1>
        </div>
        <Button
          onClick={() => { setEditingWorkout(null); setFormOpen(true); }}
          className="gap-1.5 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Novo Treino
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(workouts || []).map((workout, i) => {
          const skill = skills?.find(s => s.id === workout.skill_id);
          return (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="p-4 bg-card border-border h-full">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-sm">{workout.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAssignWorkout(workout)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      title="Atribuir"
                    >
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => { setEditingWorkout(workout); setFormOpen(true); }}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(workout.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
                {workout.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{workout.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap mt-auto">
                  <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full font-bold">
                    +{workout.xp_reward || 100} XP
                  </span>
                  {workout.boss_damage > 0 && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold">
                      ⚔️ {workout.boss_damage} DMG
                    </span>
                  )}
                  {skill && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {skill.name}
                    </span>
                  )}
                </div>
                {workout.exercises && workout.exercises.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {workout.exercises.length} exercício{workout.exercises.length > 1 ? 's' : ''}
                  </p>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {(!workouts || workouts.length === 0) && (
        <div className="text-center py-16 text-muted-foreground">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Nenhum treino criado</p>
        </div>
      )}

      <WorkoutForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingWorkout(null); }}
        workout={editingWorkout}
        skills={skills || []}
      />

      <AssignWorkoutDialog
        workout={assignWorkout}
        open={!!assignWorkout}
        onClose={() => setAssignWorkout(null)}
      />
    </div>
  );
}