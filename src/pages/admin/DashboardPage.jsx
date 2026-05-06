import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { format, subDays, isAfter } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, CheckCircle, Dumbbell, Star, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateLevel } from '@/lib/gamification';

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const PIE_COLORS = ['#F97316', '#22C55E', '#A855F7', '#EAB308', '#3B82F6', '#EC4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl px-3 py-2 text-xs">
      <p className="font-bold text-foreground">{label}</p>
      <p className="text-gold">{payload[0]?.value} check-ins</p>
    </div>
  );
};

function MetricCard({ icon, label, value, color }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="font-display font-black text-3xl leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const { data: profiles } = useQuery({ queryKey: ['all-profiles'], queryFn: () => base44.entities.StudentProfile.list() });
  const { data: checkins } = useQuery({ queryKey: ['all-checkins'], queryFn: () => base44.entities.Checkin.list() });
  const { data: workoutLogs } = useQuery({ queryKey: ['all-workout-logs'], queryFn: () => base44.entities.WorkoutLog.list() });
  const { data: levelConfigs } = useQuery({ queryKey: ['level-configs'], queryFn: () => base44.entities.LevelConfig.list() });

  // Metrics
  const activeStudents = (profiles || []).filter(p => p.active !== false).length;
  const checkinsToday = (checkins || []).filter(c => c.date === today).length;
  const workoutsThisWeek = (workoutLogs || []).filter(l => l.completion_date >= sevenDaysAgo).length;
  const totalXP = (profiles || []).reduce((sum, p) => sum + (p.xp_total || 0), 0);

  // Last 7 days check-in chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const day = DAYS_SHORT[new Date(date + 'T12:00:00').getDay()];
    const count = (checkins || []).filter(c => c.date === date).length;
    return { day, count };
  });

  // Top 5 by XP
  const top5 = [...(profiles || [])].sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0)).slice(0, 5);

  // Level distribution
  const levelDist = (profiles || []).reduce((acc, p) => {
    const lvl = calculateLevel(p.xp_total || 0, levelConfigs);
    const key = `Nv.${lvl.level} ${lvl.title}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const levelPieData = Object.entries(levelDist).map(([name, value]) => ({ name, value }));

  // Inactive students (no check-in in 7+ days)
  const inactiveStudents = (profiles || []).filter(p => {
    if (!p.active) return false;
    const lastCheckin = p.last_checkin_date;
    if (!lastCheckin) return true;
    return !isAfter(new Date(lastCheckin), subDays(new Date(), 7));
  });

  // Retention
  const studentsCheckedInLast7 = new Set((checkins || []).filter(c => c.date >= sevenDaysAgo).map(c => c.student_email)).size;
  const retentionPct = activeStudents > 0 ? Math.round((studentsCheckedInLast7 / activeStudents) * 100) : 0;
  const retentionColor = retentionPct >= 60 ? 'bg-success' : retentionPct >= 40 ? 'bg-gold' : 'bg-destructive';
  const retentionText = retentionPct >= 60 ? 'text-success' : retentionPct >= 40 ? 'text-gold' : 'text-destructive';

  const sendReminderMutation = useMutation({
    mutationFn: async (email) => {
      await base44.entities.Notification.create({
        student_email: email,
        title: 'Sentimos sua falta! 💪',
        message: 'Volte a treinar, você está a um passo de quebrar seu streak!',
        type: 'workout_reminder',
        icon: '💪',
        action_url: '/',
        read: false,
      });
    },
    onSuccess: () => qc.invalidateQueries(),
  });

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-5 pb-8">
      <div>
        <h1 className="font-display text-xl font-black">DASHBOARD</h1>
        <p className="text-xs text-muted-foreground">Visão geral da plataforma</p>
      </div>

      {/* Row 1: Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon="👥" label="Alunos Ativos" value={activeStudents} color="bg-success/10" />
        <MetricCard icon="✅" label="Check-ins Hoje" value={checkinsToday} color="bg-gold/10" />
        <MetricCard icon="🏋️" label="Treinos esta Semana" value={workoutsThisWeek} color="bg-blue-500/10" />
        <MetricCard icon="⭐" label="XP Total da Turma" value={totalXP.toLocaleString()} color="bg-epic/10" />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Check-ins Chart */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
          <h2 className="font-bold text-sm mb-4">Check-ins Últimos 7 Dias</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last7} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#D4A853" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
          <h2 className="font-bold text-sm mb-4">Top 5 Alunos por XP</h2>
          <div className="space-y-2">
            {top5.map((p, i) => {
              const lvl = calculateLevel(p.xp_total || 0, levelConfigs);
              return (
                <div key={p.id} className={`flex items-center gap-3 p-2 rounded-xl ${i === 0 ? 'bg-gold/10 border border-gold/20' : 'bg-muted/20'}`}>
                  <span className={`font-display font-black text-sm w-5 ${i === 0 ? 'text-gold' : 'text-muted-foreground'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Nv.{lvl.level} {lvl.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-sm font-black text-gold">{(p.xp_total || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Pie + Inactive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Level Distribution */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
          <h2 className="font-bold text-sm mb-4">Distribuição de Níveis</h2>
          {levelPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={levelPieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                  {levelPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
          )}
        </div>

        {/* Inactive Students */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
          <h2 className="font-bold text-sm mb-4">Alunos Inativos (7+ dias)</h2>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {inactiveStudents.length === 0 ? (
              <p className="text-sm text-success text-center py-8">🎉 Todos ativos!</p>
            ) : inactiveStudents.map(p => {
              const daysSince = p.last_checkin_date
                ? Math.floor((new Date() - new Date(p.last_checkin_date)) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <div key={p.id} className="flex items-center gap-3 bg-muted/20 rounded-xl px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{daysSince !== null ? `${daysSince}d sem check-in` : 'Nunca fez check-in'}</p>
                  </div>
                  <button
                    onClick={() => sendReminderMutation.mutate(p.email)}
                    className="shrink-0 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="Enviar lembrete"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 4: Retention */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Retenção Semanal</h2>
          <span className={`font-display font-black text-2xl ${retentionText}`}>{retentionPct}%</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-3">
          <div className={`h-full rounded-full transition-all ${retentionColor}`} style={{ width: `${retentionPct}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className={`font-bold ${retentionText}`}>{studentsCheckedInLast7}</span> de {' '}
          <span className="font-bold text-foreground">{activeStudents}</span> alunos fizeram check-in nos últimos 7 dias.
        </p>
      </div>
    </div>
  );
}