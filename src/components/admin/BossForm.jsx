import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function BossForm({ open, onClose, boss, skillId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', description: '', hp_total: 500, xp_bonus: 500, order_in_skill: 1,
  });

  useEffect(() => {
    if (boss) {
      setForm({
        name: boss.name || '',
        description: boss.description || '',
        hp_total: boss.hp_total || 500,
        xp_bonus: boss.xp_bonus || 500,
        order_in_skill: boss.order_in_skill || 1,
      });
    } else {
      setForm({ name: '', description: '', hp_total: 500, xp_bonus: 500, order_in_skill: 1 });
    }
  }, [boss, open]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (boss) return base44.entities.Boss.update(boss.id, data);
      return base44.entities.Boss.create({ ...data, skill_id: skillId });
    },
    onSuccess: () => {
      toast.success(boss ? 'Chefe atualizado!' : 'Chefe criado!');
      queryClient.invalidateQueries({ queryKey: ['all-bosses'] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{boss ? 'Editar Chefe' : 'Novo Chefe'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Nome do Chefe</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5" placeholder="Ex: Dragão da Prancha" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>HP Total</Label>
              <Input type="number" value={form.hp_total} onChange={e => setForm(f => ({ ...f, hp_total: parseInt(e.target.value) || 0 }))} className="mt-1.5" />
            </div>
            <div>
              <Label>XP Bônus</Label>
              <Input type="number" value={form.xp_bonus} onChange={e => setForm(f => ({ ...f, xp_bonus: parseInt(e.target.value) || 0 }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={form.order_in_skill} onChange={e => setForm(f => ({ ...f, order_in_skill: parseInt(e.target.value) || 1 }))} className="mt-1.5" />
            </div>
          </div>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!form.name || !form.hp_total || mutation.isPending}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {mutation.isPending ? 'Salvando...' : (boss ? 'Salvar' : 'Criar Chefe')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}