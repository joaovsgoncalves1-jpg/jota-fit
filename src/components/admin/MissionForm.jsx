import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function MissionForm({ open, onClose, mission }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', description: '', condition_type: 'workouts_completed', condition_value: 5,
    xp_reward: 300, start_date: '', end_date: '', for_all: true,
  });

  useEffect(() => {
    if (mission) {
      setForm({
        name: mission.name || '',
        description: mission.description || '',
        condition_type: mission.condition_type || 'workouts_completed',
        condition_value: mission.condition_value || 5,
        xp_reward: mission.xp_reward || 300,
        start_date: mission.start_date || '',
        end_date: mission.end_date || '',
        for_all: mission.for_all !== false,
      });
    } else {
      setForm({ name: '', description: '', condition_type: 'workouts_completed', condition_value: 5, xp_reward: 300, start_date: '', end_date: '', for_all: true });
    }
  }, [mission, open]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (mission) return base44.entities.Mission.update(mission.id, data);
      return base44.entities.Mission.create(data);
    },
    onSuccess: () => {
      toast.success(mission ? 'Missão atualizada!' : 'Missão criada!');
      queryClient.invalidateQueries({ queryKey: ['all-missions'] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>{mission ? 'Editar Missão' : 'Nova Missão'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Nome</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5" placeholder="Ex: Guerreiro da Semana" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de Condição</Label>
              <Select value={form.condition_type} onValueChange={v => setForm(f => ({ ...f, condition_type: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workouts_completed">Treinos concluídos</SelectItem>
                  <SelectItem value="streak_days">Dias de streak</SelectItem>
                  <SelectItem value="bosses_defeated">Chefes derrotados</SelectItem>
                  <SelectItem value="checkins_completed">Check-ins</SelectItem>
                  <SelectItem value="xp_earned">XP acumulado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Alvo</Label>
              <Input type="number" value={form.condition_value} onChange={e => setForm(f => ({ ...f, condition_value: parseInt(e.target.value) || 0 }))} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>XP Recompensa</Label>
            <Input type="number" value={form.xp_reward} onChange={e => setForm(f => ({ ...f, xp_reward: parseInt(e.target.value) || 0 }))} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data Início</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="mt-1.5" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form.for_all} onCheckedChange={v => setForm(f => ({ ...f, for_all: v }))} />
            <span className="text-sm">Para todos os alunos</span>
          </label>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!form.name || mutation.isPending}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {mutation.isPending ? 'Salvando...' : (mission ? 'Salvar' : 'Criar Missão')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}