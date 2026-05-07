import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Play, CheckCircle, XCircle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { ACTIVITY_ICONS } from '@/lib/trainingLoad';

const DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const DAY_LABELS = { seg: 'SEG', ter: 'TER', qua: 'QUA', qui: 'QUI', sex: 'SEX', sab: 'SÁB', dom: 'DOM' };

const STATUS_COLORS = {
  planned: 'border-border text-muted-foreground',
  completed: 'border-success/40 bg-success/10 text-success',
  skipped: 'border-destructive/30 bg-destructive/10 text-destructive',
  moved: 'border-gold/30 bg-gold/10 text-gold',
};

const ITEM_TYPE_ICON = {
  routine: '🏋️',
  hybrid_activity: '🏃',
  mobility: '🤸',
  rest: '😴',
  recovery: '💆',
  skill_block: '🤼',
};

export default function MinhaSemanaPlan() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: plans } = useQuery({
    queryKey: ['weekly-plans', user?.email],
    queryFn: () => base44.entities.WeeklyPlan.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const currentPlan = plans?.find(p => p.week_start === weekStart) || plans?.[0];

  const { data: planItems } = useQuery({
    queryKey: ['weekly-plan-items', currentPlan?.id],
    queryFn: () => base44.entities.WeeklyPlanItem.filter({ weekly_plan_id: currentPlan.id }),
    enabled: !!currentPlan?.id,
  });

  const { data: sessions } = useQuery({
    queryKey: ['my-sessions', user?.email],
    queryFn: () => base44.entities.WorkoutSession.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: hybridActivities } = useQuery({
    queryKey: ['hybrid-activities', user?.email],
    queryFn: () => base44.entities.HybridActivity.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: routines } = useQuery({
    queryKey: ['my-routines', user?.email],
    queryFn: () => base44.entities.Routine.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const createPlanMutation = useMutation({
    mutationFn: () => base44.entities.WeeklyPlan.create({
      student_email: user.email,
      week_start: weekStart,
      created_by: 'student',
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weekly-plans'] }),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.WeeklyPlanItem.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weekly-plan-items'] }),
  });

  // Map activities and sessions by day
  const dayActivity = useMemo(() => {
    const map = {};
    const wStart = new Date(weekStart + 'T12:00:00');
    DAYS.forEach((d, i) => {
      const dayDate = format(addDays(wStart, i), 'yyyy-MM-dd');
      map[d] = {
        date: dayDate,
        sessions: (sessions || []).filter(s => (s.finished_at || s.created_date || '').slice(0, 10) === dayDate),
        activities: (hybridActivities || []).filter(a => a.date === dayDate),
        isToday: dayDate === today,
      };
    });
    return map;
  }, [sessions, hybridActivities, weekStart, today]);

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-black">MINHA SEMANA</h1>
          <p className="text-xs text-muted-foreground">Semana de {format(new Date(weekStart + 'T12:00:00'), "dd/MM", { locale: ptBR })}</p>
        </div>
        <button onClick={() => navigate('/registrar-atividade')}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl">
          <Plus className="w-3.5 h-3.5" /> Atividade
        </button>
      </div>

      {/* Week grid */}
      <div className="px-4 space-y-2">
        {DAYS.map((day, i) => {
          const info = dayActivity[day] || {};
          const items = (planItems || []).filter(p => p.day_of_week === day);
          const hasSessions = info.sessions?.length > 0;
          const hasActivities = info.activities?.length > 0;
          const isEmpty = !hasSessions && !hasActivities && items.length === 0;

          return (
            <motion.div key={day} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`rounded-2xl border overflow-hidden
                ${info.isToday ? 'border-primary/40 bg-primary/5' : isEmpty ? 'border-dashed border-border/50' : 'border-border bg-card'}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-display font-black text-sm
                  ${info.isToday ? 'bg-primary text-primary-foreground' : isEmpty ? 'bg-muted/30 text-muted-foreground' : 'bg-muted/40 text-foreground'}`}>
                  {DAY_LABELS[day]}
                </div>
                <div className="flex-1 min-w-0">
                  {hasSessions && info.sessions.map((s, si) => (
                    <div key={si} className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">🏋️</span>
                      <p className="text-sm font-bold truncate">{s.routine_name || 'Treino'}</p>
                      {s.xp_earned && <span className="text-[10px] text-gold font-bold ml-auto shrink-0">+{s.xp_earned}XP</span>}
                    </div>
                  ))}
                  {hasActivities && info.activities.map((a, ai) => (
                    <div key={ai} className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">{ACTIVITY_ICONS[a.activity_type] || '🏃'}</span>
                      <p className="text-sm font-bold truncate capitalize">{a.activity_type}</p>
                      {a.duration_minutes && <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{a.duration_minutes}'</span>}
                    </div>
                  ))}
                  {!hasSessions && !hasActivities && (
                    <p className="text-xs text-muted-foreground">{info.isToday ? 'Sem treino registrado hoje' : 'Descanso'}</p>
                  )}
                </div>
                {info.isToday && (
                  <button onClick={() => navigate('/rotina')}
                    className="shrink-0 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                    <Play className="w-3 h-3" fill="currentColor" /> Treinar
                  </button>
                )}
              </div>

              {/* Summary bar */}
              {(hasSessions || hasActivities) && (
                <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
                  {info.sessions?.map((s, si) => s.duration_minutes && (
                    <span key={si} className="text-[10px] bg-muted/40 rounded-md px-2 py-0.5 text-muted-foreground">
                      {s.duration_minutes}' força
                    </span>
                  ))}
                  {info.activities?.map((a, ai) => (
                    <span key={ai} className="text-[10px] bg-muted/40 rounded-md px-2 py-0.5 text-muted-foreground">
                      {a.duration_minutes ? `${a.duration_minutes}'` : ''} {a.activity_type} · {a.intensity}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Quick register CTA */}
      <div className="mx-4 mt-4 bg-card border border-dashed border-primary/30 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Registrar atividade complementar</p>
          <p className="text-xs text-muted-foreground">Corrida, mobilidade, HIIT, etc.</p>
        </div>
        <button onClick={() => navigate('/registrar-atividade')}
          className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> + Atividade
        </button>
      </div>
    </div>
  );
}