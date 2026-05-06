import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkoutForm({ open, onClose, workout, skills }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', description: '', skill_id: '', boss_damage: 25, xp_reward: 100, exercises: [],
  });

  useEffect(() => {
    if (workout) {
      setForm({
        name: workout.name || '',
        description: workout.description || '',
        skill_id: workout.skill_id || '',
        boss_damage: workout.boss_damage || 25,
        xp_reward: workout.xp_reward || 100,
        exercises: workout.exercises || [],
      });
    } else {
      setForm({ name: '', description: '', skill_id: '', boss_damage: 25, xp_reward: 100, exercises: [] });
    }
  }, [workout, open]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (workout) {
        return base44.entities.Workout.update(workout.id, data);
      }
      return base44.entities.Workout.create(data);
    },
    onSuccess: () => {
      toast.success(workout ? 'Treino atualizado!' : 'Treino criado!');
      queryClient.invalidateQueries({ queryKey: ['all-workouts'] });
      onClose();
    },
  });

  const addExercise = () => {
    setForm(f => ({
      ...f,
      exercises: [...f.exercises, { name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '' }],
    }));
  };

  const updateExercise = (index, field, value) => {
    setForm(f => ({
      ...f,
      exercises: f.exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex),
    }));
  };

  const removeExercise = (index) => {
    setForm(f => ({ ...f, exercises: f.exercises.filter((_, i) => i !== index) }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workout ? 'Editar Treino' : 'Novo Treino'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Nome do Treino</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>XP Recompensa</Label>
              <Input type="number" value={form.xp_reward} onChange={e => setForm(f => ({ ...f, xp_reward: parseInt(e.target.value) || 0 }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Dano ao Chefe</Label>
              <Input type="number" value={form.boss_damage} onChange={e => setForm(f => ({ ...f, boss_damage: parseInt(e.target.value) || 0 }))} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Skill Associada</Label>
            <Select value={form.skill_id} onValueChange={v => setForm(f => ({ ...f, skill_id: v }))}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {skills.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Exercícios</Label>
              <Button variant="outline" size="sm" onClick={addExercise} className="gap-1">
                <Plus className="w-3 h-3" /> Exercício
              </Button>
            </div>
            <div className="space-y-3">
              {form.exercises.map((ex, i) => (
                <div key={i} className="bg-muted/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-display font-bold text-primary">{i + 1}</span>
                    <Input
                      placeholder="Nome do exercício"
                      value={ex.name}
                      onChange={e => updateExercise(i, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <button onClick={() => removeExercise(i)} className="p-1 hover:bg-destructive/10 rounded">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px]">Séries</Label>
                      <Input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label className="text-[10px]">Reps</Label>
                      <Input value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-[10px]">Descanso (s)</Label>
                      <Input type="number" value={ex.rest_seconds} onChange={e => updateExercise(i, 'rest_seconds', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                  <Input placeholder="Observações" value={ex.notes || ''} onChange={e => updateExercise(i, 'notes', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => mutation.mutate({
              ...form,
              skill_id: form.skill_id === 'none' ? '' : form.skill_id,
            })}
            disabled={!form.name || mutation.isPending}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {mutation.isPending ? 'Salvando...' : (workout ? 'Salvar Alterações' : 'Criar Treino')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}