import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { format, subDays, isAfter } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Bell, MessageSquare, Trophy, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateLevel } from '@/lib/gamification';

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const PIE_COLORS = ['#F97316', '#22C55E', '#A855F7', '#EAB308', '#3B82F6', '#EC4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl px-3 py-2 text-xs">
      <p className="font-bold">{label}</p>
      <p className="text-gold">{payload[0]?.value} check-ins</p>
    </div>
  );
};

function MetricCard({ icon, label, value, color, sub }) {
  return (
    <div className={`bg-[#1a1a1a] border border-[#333] rounded-2xl p-4`}>
      <div className={`text-3xl mb-1`}>{icon}</div>
      <p className={`font-display font-black text-2xl ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function FeedbackModal({ student, onClose, onSend }) {
  const [text, setText] = useState('');
  const { data: logs } = useQuery({
    queryKey: ['student-logs-feedback', student.email],
    queryFn: () => base44.entities.WorkoutLog.filter({ student_email: student.email }),
  });
  const recentLogs = (logs || []).slice(0, 5);
  const totalXP = recentLogs.reduce((s, l) => s + (l.xp_earned || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Feedback para {student.name}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="bg-muted/20 rounded-xl p-3 text-sm space-y-1">
          <p className="font-bold text-xs text-muted-foreground mb-2">Resumo da semana</p>
          <p>🏋️ {recentLogs.length} treinos recentes</p>
          <p>⚡ {totalXP} XP ganhos</p>
          <p>🔥 Streak: {student.current_streak || 0} dias</p>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escreva seu feedback personalizado..."
          rows={4}
          className="w-full bg-muted/20 border border-[#333] rounded-xl px-3 py-2 text-sm outline-none resize-none"
        />
        <Button onClick={() => onSend(text)} disabled={!text.trim()} className="w-full bg-primary font-bold rounded-xl">
          Enviar Feedback
        </Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const today = format(new Date(), 'yyyy-MM-dd');
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const { data: profiles } = useQuery({ queryKey: ['all-profiles'], queryFn: () => base44.entities.StudentProfile.list() });
  const { data: checkins } = useQuery({ queryKey: ['all-checkins'], queryFn: () => base44.entities.Checkin.list() });
  const { data: workoutLogs } = useQuery({ queryKey: ['all-workout-logs'], queryFn: () => base44.entities.WorkoutLog.list() });
  const { data: levelConfigs } = useQuery({ queryKey: ['level-configs'], queryFn: () => base44.entities.LevelConfig.list() });
  const { data: aiRequests } = useQuery({ queryKey: ['ai-requests'], queryFn: () => base44.entities.AIRequest.list() });

  const activeStudents = (profiles || []).filter(p => p.active !== false);
  const checkinsToday = (checkins || []).filter(c => c.date === today).length;
  const workoutsThisWeek = (workoutLogs || []).filter(l => l.completion_date >= sevenDaysAgo).length;
  const totalXP = (profiles || []).reduce((sum, p) => sum + (p.xp_total || 0), 0);

  // Chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const day = DAYS_SHORT[new Date(date + 'T12:00:00').getDay()];
    const count = (checkins || []).filter(c => c.date === date).length;
    return { day, count };
  });

  // Top 5
  const top5 = [...(profiles || [])].sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0)).slice(0, 5);

  // Level distribution
  const levelDist = (profiles || []).reduce((acc, p) => {
    const lvl = calculateLevel(p.xp_total || 0, levelConfigs);
    const key = `Nv.${lvl.level}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const levelPieData = Object.entries(levelDist).map(([name, value]) => ({ name, value }));

  // Inactive
  const inactiveStudents = activeStudents.filter(p => {
    if (!p.last_checkin_date) return true;
    return !isAfter(new Date(p.last_checkin_date), subDays(new Date(), 7));
  });

  // New levels (last 24h logs that crossed level threshold) - simplified
  const recentLevelUps = (profiles || []).filter(p => {
    const lvl = calculateLevel(p.xp_total || 0, levelConfigs);
    return lvl.level >= 2;
  }).slice(0, 3);

  // Premium students
  const premiumStudents = activeStudents.filter(p => p.plan_type === 'premium');

  // Pending AI requests
  const pendingRequests = (aiRequests || []).filter(r => r.status !== 'manual_answered' && r.is_premium);

  // Retention
  const studentsWithCheckin = new Set((checkins || []).filter(c => c.date >= sevenDaysAgo).map(c => c.student_email)).size;
  const retentionPct = activeStudents.length > 0 ? Math.round((studentsWithCheckin / activeStudents.length) * 100) : 0;
  const retentionColor = retentionPct >= 60 ? 'bg-success text-success' : retentionPct >= 40 ? 'bg-gold text-gold' : 'bg-destructive text-destructive';

  const sendReminderMutation = useMutation({
    mutationFn: (email) => base44.entities.Notification.create({
      student_email: email, title: 'Sentimos sua falta! 💪',
      message: 'Volte a treinar. Um passo de cada vez!', type: 'workout_reminder', icon: '💪', action_url: '/', read: false,
    }),
    onSuccess: () => qc.invalidateQueries(),
  });

  const sendAllReminders = () => {
    inactiveStudents.forEach(p => sendReminderMutation.mutate(p.email));
  };

  const sendFeedbackMutation = useMutation({
    mutationFn: async ({ student, text }) => {
      await base44.entities.Feedback.create({
        student_email: student.email,
        text,
        week_summary: `${(workoutLogs || []).filter(l => l.student_email === student.email && l.completion_date >= sevenDaysAgo).length} treinos esta semana`,
      });
      await base44.entities.Notification.create({
        student_email: student.email, title: '💬 Novo feedback do Jota!',
        message: text.slice(0, 80), type: 'admin_message', icon: '💬', action_url: '/perfil', read: false,
      });
    },
    onSuccess: () => { qc.invalidateQueries(); setFeedbackTarget(null); },
  });

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-black">PAINEL DO JOTA 🔥</h1>
          <p className="text-xs text-muted-foreground">Centro de comando — {format(new Date(), 'dd/MM/yyyy')}</p>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon="👥" label="Alunos Ativos" value={activeStudents.length} color="text-success" />
        <MetricCard icon="✅" label="Check-ins Hoje" value={checkinsToday} color="text-gold" />
        <MetricCard icon="🏋️" label="Treinos Semana" value={workoutsThisWeek} color="text-blue-400" />
        <MetricCard icon="⚡" label="XP da Turma" value={totalXP.toLocaleString()} color="text-epic" sub="Total acumulado" />
      </div>

      {/* ALERTAS */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 space-y-3">
        <h2 className="font-bold text-sm">⚡ Alertas do Dia</h2>
        {inactiveStudents.length > 0 && (
          <div className="flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <p className="text-sm"><span className="font-bold text-destructive">{inactiveStudents.length}</span> alunos sem treinar há 3+ dias</p>
            <Button size="sm" onClick={sendAllReminders} className="bg-destructive text-destructive-foreground text-xs rounded-lg">
              <Bell className="w-3 h-3 mr-1" /> Lembrar todos
            </Button>
          </div>
        )}
        {pendingRequests.length > 0 && (
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
            <p className="text-sm"><span className="font-bold text-primary">{pendingRequests.length}</span> pedidos de feedback Premium pendentes</p>
            <Button size="sm" onClick={() => navigate('/admin/ai-requests')} className="bg-primary text-xs rounded-lg">
              <MessageSquare className="w-3 h-3 mr-1" /> Responder
            </Button>
          </div>
        )}
        {inactiveStudents.length === 0 && pendingRequests.length === 0 && (
          <p className="text-sm text-success text-center py-2">🎉 Tudo em dia! Nenhum alerta.</p>
        )}
      </div>

      {/* PREMIUM STUDENTS */}
      {premiumStudents.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
          <h2 className="font-bold text-sm mb-3">👑 Alunos Premium</h2>
          <div className="space-y-2">
            {premiumStudents.map(p => {
              const lvl = calculateLevel(p.xp_total || 0, levelConfigs);
              const weeklyLogs = (workoutLogs || []).filter(l => l.student_email === p.email && l.completion_date >= sevenDaysAgo);
              return (
                <div key={p.id} className="flex items-center gap-3 bg-gold/5 border border-gold/20 rounded-xl px-3 py-2.5">
                  <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center font-bold text-gold text-sm">
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Nv.{lvl.level} • 🔥{p.current_streak}d • {weeklyLogs.length} treinos/semana</p>
                  </div>
                  <Button size="sm" onClick={() => setFeedbackTarget(p)} className="bg-gold text-accent-foreground text-xs rounded-lg shrink-0">
                    <MessageSquare className="w-3 h-3 mr-1" /> Feedback
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
          <h2 className="font-bold text-sm mb-4">Check-ins 7 Dias</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={last7} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#D4A853" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
          <h2 className="font-bold text-sm mb-4">Top 5 por XP</h2>
          <div className="space-y-2">
            {top5.map((p, i) => {
              const lvl = calculateLevel(p.xp_total || 0, levelConfigs);
              return (
                <div key={p.id} className={`flex items-center gap-2 p-2 rounded-xl ${i === 0 ? 'bg-gold/10 border border-gold/20' : 'bg-muted/20'}`}>
                  <span className="text-sm w-5 shrink-0">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}</span>
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">Nv.{lvl.level}</p>
                  </div>
                  <span className="font-display text-xs font-black text-gold shrink-0">{(p.xp_total||0).toLocaleString()} XP</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PIE + INACTIVE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
          <h2 className="font-bold text-sm mb-2">Distribuição de Níveis</h2>
          {levelPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={levelPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent*100)}%`} labelLine={false}>
                  {levelPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>}
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
          <h2 className="font-bold text-sm mb-3">Inativos 7+ dias ({inactiveStudents.length})</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {inactiveStudents.slice(0, 8).map(p => {
              const days = p.last_checkin_date ? Math.floor((new Date() - new Date(p.last_checkin_date)) / 86400000) : null;
              return (
                <div key={p.id} className="flex items-center gap-2 bg-muted/20 rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{p.name?.[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{days ? `${days}d sem check-in` : 'Nunca'}</p>
                  </div>
                  <button onClick={() => sendReminderMutation.mutate(p.email)} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                    <Bell className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            {inactiveStudents.length === 0 && <p className="text-sm text-success text-center py-6">🎉 Todos ativos!</p>}
          </div>
        </div>
      </div>

      {/* RETENTION */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold">Retenção Semanal</h2>
          <span className={`font-display font-black text-2xl ${retentionPct >= 60 ? 'text-success' : retentionPct >= 40 ? 'text-gold' : 'text-destructive'}`}>{retentionPct}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
          <div className={`h-full rounded-full transition-all ${retentionPct >= 60 ? 'bg-success' : retentionPct >= 40 ? 'bg-gold' : 'bg-destructive'}`} style={{ width: `${retentionPct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{studentsWithCheckin} de {activeStudents.length} alunos treinaram nos últimos 7 dias</p>
      </div>

      {/* ATALHOS */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
        <h2 className="font-bold text-sm mb-3">⚡ Atalhos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Criar Treino', icon: '🏋️', path: '/admin/workouts' },
            { label: 'Criar Missão', icon: '🎯', path: '/admin/missions' },
            { label: 'Criar Skill', icon: '🌳', path: '/admin/skills' },
            { label: 'Criar Desafio', icon: '⚔️', path: '/admin/challenges' },
          ].map(s => (
            <button key={s.label} onClick={() => navigate(s.path)}
              className="flex flex-col items-center gap-2 bg-muted/30 hover:bg-muted/50 rounded-xl p-3 transition-colors">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-xs font-bold text-center">{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      {feedbackTarget && (
        <FeedbackModal
          student={feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
          onSend={(text) => sendFeedbackMutation.mutate({ student: feedbackTarget, text })}
        />
      )}
    </div>
  );
}