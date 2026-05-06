import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CATEGORY_LABELS } from '@/lib/gamification';

export default function SkillForm({ open, onClose, skill, skills }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', description: '', category: 'forca', order: 0, prerequisite_skill_id: '', xp_bonus: 200,
  });

  useEffect(() => {
    if (skill) {
      setForm({
        name: skill.name || '',
        description: skill.description || '',
        category: skill.category || 'forca',
        order: skill.order || 0,
        prerequisite_skill_id: skill.prerequisite_skill_id || '',
        xp_bonus: skill.xp_bonus || 200,
      });
    } else {
      setForm({ name: '', description: '', category: 'forca', order: skills.length, prerequisite_skill_id: '', xp_bonus: 200 });
    }
  }, [skill, open]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (skill) return base44.entities.Skill.update(skill.id, data);
      return base44.entities.Skill.create(data);
    },
    onSuccess: () => {
      toast.success(skill ? 'Skill atualizada!' : 'Skill criada!');
      queryClient.invalidateQueries({ queryKey: ['all-skills'] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{skill ? 'Editar Skill' : 'Nova Skill'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Nome</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>XP Bônus</Label>
              <Input type="number" value={form.xp_bonus} onChange={e => setForm(f => ({ ...f, xp_bonus: parseInt(e.target.value) || 0 }))} className="mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Pré-requisito</Label>
              <Select value={form.prerequisite_skill_id || 'none'} onValueChange={v => setForm(f => ({ ...f, prerequisite_skill_id: v === 'none' ? '' : v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {skills.filter(s => s.id !== skill?.id).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!form.name || mutation.isPending}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {mutation.isPending ? 'Salvando...' : (skill ? 'Salvar' : 'Criar Skill')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}