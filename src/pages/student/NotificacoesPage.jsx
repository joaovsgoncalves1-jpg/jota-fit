import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS = {
  achievement: '🏆',
  mission: '🎯',
  workout_reminder: '💪',
  challenge: '🏅',
  admin_message: '📢',
  streak: '🔥',
};
const TYPE_LABELS = {
  achievement: 'Conquistas',
  mission: 'Missões',
  workout_reminder: 'Treino',
  challenge: 'Desafios',
  admin_message: 'Admin',
  streak: 'Streak',
};

export default function NotificacoesPage() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const { data: notifications } = useQuery({
    queryKey: ['my-notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const sorted = [...(notifications || [])].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const filtered = filter === 'all' ? sorted : sorted.filter(n => n.type === filter);

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-notifications', user?.email] }),
  });

  const deleteReadMutation = useMutation({
    mutationFn: async () => {
      const read = (notifications || []).filter(n => n.read);
      await Promise.all(read.map(n => base44.entities.Notification.delete(n.id)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-notifications', user?.email] }),
  });

  const markAllRead = async () => {
    await Promise.all((notifications || []).filter(n => !n.read).map(n => base44.entities.Notification.update(n.id, { read: true })));
    qc.invalidateQueries({ queryKey: ['my-notifications', user?.email] });
  };

  const handleClick = (n) => {
    if (!n.read) markReadMutation.mutate(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  const types = ['all', ...Object.keys(TYPE_ICONS)];

  return (
    <div className="max-w-lg mx-auto p-4 pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-black">NOTIFICAÇÕES</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} className="text-xs">
            <CheckCheck className="w-3.5 h-3.5 mr-1" /> Marcar lidas
          </Button>
          <Button variant="outline" size="sm" onClick={() => deleteReadMutation.mutate()} className="text-xs text-destructive border-destructive/30">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpar lidas
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filter === t ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'all' ? 'Todas' : `${TYPE_ICONS[t]} ${TYPE_LABELS[t]}`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(n => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={`w-full flex gap-3 p-4 rounded-2xl border text-left transition-all
              ${!n.read ? 'bg-primary/5 border-primary/20' : 'bg-[#1a1a1a] border-[#333] opacity-70 hover:opacity-100'}`}
          >
            <span className="text-2xl shrink-0">{n.icon || TYPE_ICONS[n.type] || '🔔'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
              {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">
                {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true, locale: ptBR }) : 'Agora'}
              </p>
            </div>
            {!n.read && <div className="w-2.5 h-2.5 bg-primary rounded-full mt-1 shrink-0" />}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        )}
      </div>
    </div>
  );
}