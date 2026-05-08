/**
 * PainelJota — Tela 1 do Painel do Consultor.
 * Lista todos os alunos com info essencial e link pro perfil detalhado.
 */
import React, { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { Users, TrendingUp, Dumbbell, AlertCircle, Search } from 'lucide-react';
import JotaStudentRow from '@/components/consultant/JotaStudentRow';
import {
  useAllProfiles, useAllRoutines, useAllSessions, useAllPRs,
  recommendationService,
} from '@/services';

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

  const { data: profiles } = useAllProfiles();
  const { data: routines } = useAllRoutines();
  const { data: sessions } = useAllSessions({ limit: 500 });
  const { data: prs } = useAllPRs({ limit: 500 });

  // Stats topo
  const stats = useMemo(() => {
    const total = (profiles || []).length;
    const today = format(new Date(), 'yyyy-MM-dd');
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const active7 = (profiles || []).filter(p => {
      return (sessions || []).some(s =>
        s.studentEmail === p.email &&
        (s.finishedAt?.slice(0, 10) || s.startedAt?.slice(0, 10) || '') >= sevenDaysAgo
      );
    }).length;
    const todayCount = (sessions || []).filter(s =>
      (s.finishedAt?.startsWith(today) || s.startedAt?.startsWith(today))
    ).length;
    const inactive = total - active7;
    return { total, active7, todayCount, inactive };
  }, [profiles, sessions]);

  // Build enriched list with computed alert state
  const enriched = useMemo(() => {
    return (profiles || []).map(p => {
      const studentSessions = (sessions || []).filter(s => s.studentEmail === p.email);
      const studentPRs = (prs || []).filter(r => r.studentEmail === p.email);
      const activeRoutine = (routines || []).find(r => r.studentEmail === p.email && r.isActive)
        || (routines || []).find(r => r.studentEmail === p.email);
      const snap = recommendationService.computeStudentSnapshot({
        profile: p, sessions: studentSessions, prs: studentPRs, activeRoutine,
      });
      return { profile: p, studentSessions, studentPRs, ...snap };
    });
  }, [profiles, sessions, prs, routines]);

  const filtered = useMemo(() => {
    return enriched.filter(({ profile, hasAlert }) => {
      if (search) {
        const q = search.toLowerCase();
        if (!profile.name?.toLowerCase().includes(q) && !profile.email?.toLowerCase().includes(q)) return false;
      }
      const status = profile.consultantStatus || 'ativo';
      if (filter === 'all') return true;
      if (filter === 'alert') return hasAlert;
      return status === filter;
    }).sort((a, b) => {
      if (a.hasAlert !== b.hasAlert) return a.hasAlert ? -1 : 1;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-black">PAINEL JOTA</h1>
          <p className="text-xs text-muted-foreground">Acompanhamento dos alunos</p>
        </div>
        <div className="text-2xl">⭐</div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {STATS.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className={`font-display font-black text-lg ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar aluno por nome ou email..."
          className="w-full bg-card border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-primary/50"
        />
      </div>

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