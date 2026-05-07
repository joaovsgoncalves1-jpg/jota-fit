import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateLevel } from '@/lib/gamification';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Flame, Trophy, Calendar, ChevronDown, ChevronUp,
  Edit2, Plus, Check, X, Dumbbell, TrendingUp, Star
} from 'lucide-react';

const BAND_LABEL = { leve: 'Leve', medio: 'Médio', forte: 'Forte', muito_forte: 'Muito forte' };

function FrequencyDots({ sessions, days = 14 }) {
  const today = new Date();
  const dots = Array.from({ length: days }, (_, i) => {
    const d = format(subDays(today, days - 1 - i), 'yyyy-MM-dd');
    const active = (sessions || []).some(s => s.started_at?.startsWith(d));
    return { d, active };
  });
  return (
    <div className="flex gap-0.5">
      {dots.map(({ d, active }) => (
        <div key={d} className={`w-3 h-3 rounded-sm ${active ? 'bg-success' : 'bg-muted/40'}`} title={d} />
      ))}
    </div>
  );
}

function ConsultantNoteEditor({ routine, onSave }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(routine.consultant_note || '');
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Routine.update(routine.id, { consultant_note: note }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-routines-admin'] }); setEditing(false); },
  });

  if (!editing) return (
    <button onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors">
      <Edit2 className="w-3 h-3" />
      {routine.consultant_note ? `"${routine.consultant_note.slice(0, 40)}${routine.consultant_note.length > 40 ? '…' : ''}"` : 'Adicionar nota do consultor'}
    </button>
  );

  return (
    <div className="flex gap-2 mt-1">
      <input value={note} onChange={e => setNote(e.target.value)}
        placeholder="Nota para o aluno..."
        className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary/50" />
      <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
        className="p-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-all">
        <Check className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-all">
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

function StudentCard({ profile, routines, sessions, prs, allExercises }) {
  const [expanded, setExpanded] = useState(false);
  const levelInfo = calculateLevel(profile.xp_total || 0);

  const activeRoutine = (routines || []).find(r => r.is_active) || routines?.[0];

  const recentSessions = useMemo(() => {
    return (sessions || [])
      .filter(s => s.student_email === profile.email && s.status === 'completed')
      .sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''))
      .slice(0, 5);
  }, [sessions, profile.email]);

  const recentPRs = useMemo(() => {
    return (prs || [])
      .filter(p => p.student_email === profile.email)
      .sort((a, b) => (b.achieved_at || '').localeCompare(a.achieved_at || ''))
      .slice(0, 3);
  }, [prs, profile.email]);

  const lastSeen = recentSessions[0]?.started_at?.split('T')[0];
  const daysSince = lastSeen ? differenceInDays(new Date(), parseISO(lastSeen)) : null;
  const isInactive = daysSince === null || daysSince >= 7;

  return (
    <div className={`bg-card rounded-2xl border overflow-hidden transition-all ${isInactive ? 'border-destructive/20' : 'border-border'}`}>
      <button onClick={() => setExpanded(e => !e)} className="w-full p-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center text-sm font-display font-black text-white shrink-0">
            {profile.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm">{profile.name}</p>
              {isInactive && <span className="text-[9px] font-bold bg-destructive/15 text-destructive px-1.5 py-0.5 rounded">Inativo {daysSince}d</span>}
              {profile.current_streak > 0 && (
                <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                  <Flame className="w-3 h-3" /> {profile.current_streak}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Nv.{levelInfo.level} · {levelInfo.title} · {(profile.xp_total || 0).toLocaleString()} XP</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FrequencyDots sessions={recentSessions} days={10} />
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-4">

              {/* Rotina ativa */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Star className="w-3 h-3" /> Rotina Ativa
                </p>
                {activeRoutine ? (
                  <div className="bg-muted/20 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{activeRoutine.name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${activeRoutine.created_by === 'jota' ? 'bg-gold/20 text-gold' : 'bg-muted/40 text-muted-foreground'}`}>
                        {activeRoutine.created_by === 'jota' ? '⭐ Jota' : 'Aluno'}
                      </span>
                    </div>
                    <ConsultantNoteEditor routine={activeRoutine} />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem rotina ativa</p>
                )}
              </div>

              {/* Últimos treinos */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Dumbbell className="w-3 h-3" /> Últimos Treinos
                </p>
                {recentSessions.length > 0 ? (
                  <div className="space-y-1.5">
                    {recentSessions.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-xs bg-muted/10 rounded-lg px-2.5 py-2">
                        <span className="text-muted-foreground">{s.started_at?.split('T')[0]}</span>
                        <span className="font-medium truncate max-w-[120px]">{s.routine_name || 'Treino'}</span>
                        <span className="text-gold font-bold">+{s.xp_earned} XP</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhum treino ainda</p>
                )}
              </div>

              {/* PRs recentes */}
              {recentPRs.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Trophy className="w-3 h-3" /> PRs Recentes
                  </p>
                  <div className="space-y-1">
                    {recentPRs.map(pr => (
                      <div key={pr.id} className="flex items-center gap-2 text-xs bg-gold/5 border border-gold/15 rounded-lg px-2.5 py-1.5">
                        <Trophy className="w-3 h-3 text-gold shrink-0" />
                        <span className="font-medium truncate flex-1">{pr.exercise_name}</span>
                        <span className="text-gold font-bold shrink-0">
                          {pr.record_type === 'max_weight' ? `${pr.weight_kg}kg×${pr.reps}` :
                           pr.record_type === 'band_reduction' ? `El.${pr.band_level}` : pr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PainelJota() {
  const [search, setSearch] = useState('');
  const [filterInactive, setFilterInactive] = useState(false);

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
    queryFn: () => base44.entities.WorkoutSession.list('-started_at', 200),
  });

  const { data: prs } = useQuery({
    queryKey: ['all-prs-admin'],
    queryFn: () => base44.entities.ExercisePersonalRecord.list('-achieved_at', 300),
  });

  const { data: exercises } = useQuery({
    queryKey: ['all-exercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const stats = useMemo(() => {
    const total = (profiles || []).length;
    const today = format(new Date(), 'yyyy-MM-dd');
    const active7 = (profiles || []).filter(p => {
      const last = (sessions || []).filter(s => s.student_email === p.email)
        .sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''))[0];
      if (!last) return false;
      return differenceInDays(new Date(), parseISO(last.started_at?.split('T')[0])) < 7;
    }).length;
    const todayCount = (sessions || []).filter(s => s.started_at?.startsWith(today)).length;
    return { total, active7, todayCount };
  }, [profiles, sessions]);

  const filteredProfiles = useMemo(() => {
    return (profiles || []).filter(p => {
      if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) && !p.email?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterInactive) {
        const last = (sessions || []).filter(s => s.student_email === p.email)
          .sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''))[0];
        const daysSince = last ? differenceInDays(new Date(), parseISO(last.started_at?.split('T')[0])) : 999;
        if (daysSince < 7) return false;
      }
      return true;
    }).sort((a, b) => {
      // Most recent activity first
      const aLast = (sessions || []).filter(s => s.student_email === a.email).sort((x, y) => (y.started_at || '').localeCompare(x.started_at || ''))[0];
      const bLast = (sessions || []).filter(s => s.student_email === b.email).sort((x, y) => (y.started_at || '').localeCompare(x.started_at || ''))[0];
      return (bLast?.started_at || '').localeCompare(aLast?.started_at || '');
    });
  }, [profiles, sessions, search, filterInactive]);

  const studentRoutines = (email) => (routines || []).filter(r => r.student_email === email);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-black">PAINEL JOTA</h1>
          <p className="text-xs text-muted-foreground">Visão geral dos alunos</p>
        </div>
        <div className="text-2xl">⭐</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Alunos', value: stats.total, icon: Users, color: 'text-primary' },
          { label: 'Ativos 7d', value: stats.active7, icon: TrendingUp, color: 'text-success' },
          { label: 'Hoje', value: stats.todayCount, icon: Dumbbell, color: 'text-gold' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className={`font-display font-black text-xl ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar aluno..."
          className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50"
        />
        <button
          onClick={() => setFilterInactive(f => !f)}
          className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${filterInactive ? 'bg-destructive/20 border-destructive/40 text-destructive' : 'bg-card border-border text-muted-foreground hover:border-destructive/30'}`}>
          Inativos
        </button>
      </div>

      {/* Student list */}
      <div className="space-y-2">
        {filteredProfiles.map(profile => (
          <StudentCard
            key={profile.id}
            profile={profile}
            routines={studentRoutines(profile.email)}
            sessions={sessions}
            prs={prs}
            allExercises={exercises}
          />
        ))}
        {filteredProfiles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum aluno encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}