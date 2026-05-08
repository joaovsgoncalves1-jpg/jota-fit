/**
 * PainelJota — Tela 1 do Painel do Consultor.
 * Lista todos os alunos com info essencial e link pro perfil detalhado.
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { Users, TrendingUp, Dumbbell, AlertCircle, Search } from 'lucide-react';
import JotaStudentRow from '@/components/consultant/JotaStudentRow';

const FILTERS = [
  { key: 'all',       label: 'Todos' },
  { key: 'ativo',     label: 'Ativos' },
  { key: 'lead',      label: 'Leads' },
  { key: 'pausado',   label: 'Pausados' },
  { key: 'alert',     label: 'Com alerta' },
];

export default function PainelJota() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles-admin'],
    queryFn: () => base44.entities.StudentProfile.list(),
  });
  const { data: routines } = useQuery({
    queryKey: ['all-routines-admin'],
    queryFn: () => base44.entities.Routine.list(),
  });
  const { data: sessions } = useQuery({
    queryKey: ['all-sessions-admin'],
    queryFn: () => base44.entities.WorkoutSession.list('-started_at', 500),
  });
  const { data: prs } = useQuery({
    queryKey: ['all-prs-admin'],
    queryFn: () => base44.entities.ExercisePersonalRecord.list('-achieved_at', 500),
  });

  // Stats topo
  const stats = useMemo(() => {
    const total = (profiles || []).length;
    const today = format(new Date(), 'yyyy-MM-dd');
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const active7 = (profiles || []).filter(p => {
      return (sessions || []).some(s =>
        s.student_email === p.email &&
        (s.finished_at?.slice(0, 10) || s.started_at?.slice(0, 10) || '') >= sevenDaysAgo
      );
    }).length;
    const todayCount = (sessions || []).filter(s =>
      (s.finished_at?.startsWith(today) || s.started_at?.startsWith(today))
    ).length;
    const inactive = total - active7;
    return { total, active7, todayCount, inactive };
  }, [profiles, sessions]);

  // Build enriched list with computed alert state
  const enriched = useMemo(() => {
    return (profiles || []).map(p => {
      const studentSessions = (sessions || []).filter(s => s.student_email === p.email);
      const studentPRs = (prs || []).filter(r => r.student_email === p.email);
      const activeRoutine = (routines || []).find(r => r.student_email === p.email && r.is_active)
        || (routines || []).find(r => r.student_email === p.email);

      const lastDate = [...studentSessions]
        .filter(s => s.status === 'completed' || !s.status)
        .sort((a, b) => (b.finished_at || b.started_at || '').localeCompare(a.finished_at || a.started_at || ''))[0]
        ?.finished_at?.slice(0, 10) || null;
      const daysSince = lastDate ? differenceInDays(new Date(), parseISO(lastDate)) : null;
      const hasAlert = !activeRoutine || daysSince === null || daysSince >= 7;

      return { profile: p, studentSessions, studentPRs, activeRoutine, hasAlert, daysSince };
    });
  }, [profiles, sessions, prs, routines]);

  const filtered = useMemo(() => {
    return enriched.filter(({ profile, hasAlert }) => {
      if (search) {
        const q = search.toLowerCase();
        if (!profile.name?.toLowerCase().includes(q) && !profile.email?.toLowerCase().includes(q)) return false;
      }
      const status = profile.consultant_status || 'ativo';
      if (filter === 'all') return true;
      if (filter === 'alert') return hasAlert;
      return status === filter;
    }).sort((a, b) => {
      // Alunos com alerta primeiro
      if (a.hasAlert !== b.hasAlert) return a.hasAlert ? -1 : 1;
      // Depois por atividade recente
      return (b.daysSince ?? 999) - (a.daysSince ?? 999) * -1;
    });
  }, [enriched, search, filter]);

  const STATS = [
    { label: 'Alunos',    value: stats.total,      icon: Users,        color: 'text-primary' },
    { label: 'Ativos 7d', value: stats.active7,    icon: TrendingUp,   color: 'text-success' },
    { label: 'Hoje',      value: stats.todayCount, icon: Dumbbell,     color: 'text-gold' },
    { label: 'Inativos',  value: stats.inactive,   icon: AlertCircle,  color: 'text-destructive' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-black">PAINEL JOTA</h1>
          <p className="text-xs text-muted-foreground">Acompanhamento dos alunos</p>
        </div>
        <div className="text-2xl">⭐</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {STATS.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className={`font-display font-black text-lg ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar aluno por nome ou email..."
          className="w-full bg-card border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-primary/50"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
              ${filter === f.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map(({ profile, studentSessions, studentPRs, activeRoutine }) => (
          <JotaStudentRow
            key={profile.id}
            profile={profile}
            sessions={studentSessions}
            prs={studentPRs}
            activeRoutine={activeRoutine}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum aluno encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}