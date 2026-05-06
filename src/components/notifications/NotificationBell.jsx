import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS = {
  achievement: '🏆',
  mission: '🎯',
  workout_reminder: '💪',
  challenge: '🏅',
  admin_message: '📢',
  streak: '🔥',
};

function RelTime({ date }) {
  if (!date) return <span>Agora</span>;
  try {
    return <span>{formatDistanceToNow(new Date(date), { addSuffix: false, locale: ptBR })}</span>;
  } catch { return <span>Agora</span>; }
}

export default function NotificationBell() {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['my-notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ student_email: user?.email }),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const unread = (notifications || []).filter(n => !n.read).length;
  const latest = [...(notifications || [])].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10);

  const markReadMutation = useMutation({
    mutationFn: async (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-notifications', user?.email] }),
  });

  const markAllRead = async () => {
    await Promise.all((notifications || []).filter(n => !n.read).map(n => base44.entities.Notification.update(n.id, { read: true })));
    qc.invalidateQueries({ queryKey: ['my-notifications', user?.email] });
  };

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n) => {
    markReadMutation.mutate(n.id);
    if (n.action_url) navigate(n.action_url);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-muted/30 transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-black rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
            <h3 className="font-bold text-sm">Notificações</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
                </button>
              )}
              <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#222]">
            {latest.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem notificações</p>
            ) : latest.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <span className="text-lg shrink-0 mt-0.5">{n.icon || TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground truncate">{n.message.slice(0, 80)}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5"><RelTime date={n.created_date} /></p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-primary rounded-full mt-1 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="border-t border-[#333] px-4 py-2">
            <button
              onClick={() => { navigate('/notificacoes'); setOpen(false); }}
              className="text-xs text-primary hover:underline w-full text-center"
            >
              Ver todas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}