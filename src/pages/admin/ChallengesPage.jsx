import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { Plus, Trash2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const UNITS = ['reps', 'seconds', 'days', 'minutes'];
const UNIT_LABELS = { reps: 'Repetições', seconds: 'Segundos', days: 'Dias', minutes: 'Minutos' };

function ChallengeForm({ onSave, onCancel, currentUser }) {
  const [form, setForm] = useState({
    name: '', description: '', exercise_type: '', target_value: 100,
    target_unit: 'reps', start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '', xp_reward: 200, badge_icon: '🏅',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-base">Novo Desafio</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Nome *</label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="30 Dias de Prancha" className="bg-muted/20 border-[#333]" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Emoji Badge</label>
          <Input value={form.badge_icon} onChange={e => set('badge_icon', e.target.value)} className="bg-muted/20 border-[#333]" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tipo de exercício</label>
          <Input value={form.exercise_type} onChange={e => set('exercise_type', e.target.value)} placeholder="prancha" className="bg-muted/20 border-[#333]" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Meta</label>
          <Input type="number" value={form.target_value} onChange={e => set('target_value', Number(e.target.value))} className="bg-muted/20 border-[#333]" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Unidade</label>
          <select value={form.target_unit} onChange={e => set('target_unit', e.target.value)} className="w-full bg-muted/20 border border-[#333] rounded-md px-3 py-2 text-sm text-foreground outline-none">
            {UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Início *</label>
          <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="bg-muted/20 border-[#333]" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Fim *</label>
          <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="bg-muted/20 border-[#333]" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">XP Recompensa</label>
          <Input type="number" value={form.xp_reward} onChange={e => set('xp_reward', Number(e.target.value))} className="bg-muted/20 border-[#333]" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="w-full bg-muted/20 border border-[#333] rounded-md px-3 py-2 text-sm outline-none resize-none text-foreground" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button onClick={() => onSave({ ...form, created_by: currentUser?.email })} disabled={!form.name || !form.end_date} className="flex-1 bg-primary">Criar Desafio</Button>
      </div>
    </div>
  );
}

function ParticipantsModal({ challenge, onClose }) {
  const { data: progresses } = useQuery({
    queryKey: ['challenge-progress', challenge.id],
    queryFn: () => base44.entities.ChallengeProgress.filter({ challenge_id: challenge.id }),
  });
  const { data: profiles } = useQuery({ queryKey: ['all-profiles'], queryFn: () => base44.entities.StudentProfile.list() });

  const sorted = [...(progresses || [])].sort((a, b) => (b.current_value || 0) - (a.current_value || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{challenge.badge_icon} {challenge.name}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {sorted.map((p, i) => {
            const profile = profiles?.find(pr => pr.email === p.student_email);
            const pct = Math.min(100, Math.round(((p.current_value || 0) / (challenge.target_value || 1)) * 100));
            return (
              <div key={p.id} className="flex items-center gap-3 bg-muted/20 rounded-xl px-3 py-2">
                <span className="font-display font-black text-sm w-5 text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{profile?.name || p.student_email.split('@')[0]}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{p.current_value || 0}/{challenge.target_value}</span>
                  </div>
                </div>
                {p.completed && <span className="text-xs">✅</span>}
              </div>
            );
          })}
          {sorted.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum participante ainda</p>}
        </div>
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [viewingParticipants, setViewingParticipants] = useState(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: challenges } = useQuery({
    queryKey: ['all-challenges'],
    queryFn: () => base44.entities.Challenge.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Challenge.create(data),
    onSuccess: async (challenge) => {
      // Notify all active students
      const profiles = await base44.entities.StudentProfile.filter({ active: true });
      await Promise.all(profiles.map(p =>
        base44.entities.Notification.create({
          student_email: p.email,
          title: `🏅 Novo Desafio: ${challenge.name}`,
          message: challenge.description || `Participe e ganhe ${challenge.xp_reward} XP!`,
          type: 'challenge',
          icon: challenge.badge_icon || '🏅',
          action_url: '/missoes',
          read: false,
        })
      ));
      qc.invalidateQueries({ queryKey: ['all-challenges'] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Challenge.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-challenges'] }),
  });

  const getStatus = (c) => {
    if (isFuture(new Date(c.start_date))) return { label: 'Rascunho', color: 'text-muted-foreground bg-muted' };
    if (isPast(new Date(c.end_date + 'T23:59:59'))) return { label: 'Expirado', color: 'text-destructive bg-destructive/10' };
    return { label: 'Ativo', color: 'text-success bg-success/10' };
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-black">DESAFIOS</h1>
          <p className="text-xs text-muted-foreground">Gerencie desafios entre alunos</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-primary font-bold rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Novo Desafio
        </Button>
      </div>

      {showForm && (
        <ChallengeForm onSave={(data) => createMutation.mutate(data)} onCancel={() => setShowForm(false)} currentUser={user} />
      )}

      <div className="grid gap-3">
        {(challenges || []).map(c => {
          const status = getStatus(c);
          const daysLeft = differenceInDays(new Date(c.end_date), new Date());
          return (
            <div key={c.id} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{c.badge_icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{c.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${status.color}`}>{status.label}</span>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>🎯 Meta: {c.target_value} {UNIT_LABELS[c.target_unit]}</span>
                      <span>⚡ {c.xp_reward} XP</span>
                      {status.label === 'Ativo' && <span className="text-primary font-bold">⏱ {daysLeft}d restantes</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewingParticipants(c)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted/30 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> Participantes
                  </button>
                  <button onClick={() => deleteMutation.mutate(c.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {(challenges || []).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Nenhum desafio criado ainda</p>
          </div>
        )}
      </div>

      {viewingParticipants && (
        <ParticipantsModal challenge={viewingParticipants} onClose={() => setViewingParticipants(null)} />
      )}
    </div>
  );
}