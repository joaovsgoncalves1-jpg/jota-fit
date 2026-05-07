import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateLevel } from '@/lib/gamification';
import { motion } from 'framer-motion';
import { ArrowLeft, Dumbbell, Trophy, Flame, Star, MessageSquare, Plus, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import LevelProgress from '@/components/game/LevelProgress';
import { Card } from '@/components/ui/card';

export default function StudentDetailPage() {
  const pathParts = window.location.pathname.split('/');
  const studentEmail = decodeURIComponent(pathParts[pathParts.length - 1]);

  const queryClient = useQueryClient();
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineNote, setRoutineNote] = useState('');

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.StudentProfile.list(),
  });

  const student = profiles?.find(p => p.email === studentEmail || p.id === studentEmail);

  const { data: sessions } = useQuery({
    queryKey: ['student-sessions', student?.email],
    queryFn: () => base44.entities.WorkoutSession.filter({ student_email: student?.email }),
    enabled: !!student?.email,
  });

  const { data: prs } = useQuery({
    queryKey: ['student-prs', student?.email],
    queryFn: () => base44.entities.ExercisePersonalRecord.filter({ student_email: student?.email }),
    enabled: !!student?.email,
  });

  const { data: routines } = useQuery({
    queryKey: ['student-routines', student?.email],
    queryFn: () => base44.entities.Routine.filter({ student_email: student?.email }),
    enabled: !!student?.email,
  });

  const { data: measurements } = useQuery({
    queryKey: ['student-measurements', student?.email],
    queryFn: () => base44.entities.BodyMeasurement.filter({ student_email: student?.email }),
    enabled: !!student?.email,
  });

  const createNoteMutation = useMutation({
    mutationFn: () => base44.entities.Feedback.create({
      student_email: student?.email,
      text: noteText,
      admin_email: 'jota',
    }),
    onSuccess: () => {
      setNoteText('');
      setShowNoteForm(false);
      queryClient.invalidateQueries();
    },
  });

  const createRoutineMutation = useMutation({
    mutationFn: () => base44.entities.Routine.create({
      name: routineName,
      student_email: student?.email,
      consultant_note: routineNote,
      created_by: 'jota',
      is_active: false,
    }),
    onSuccess: () => {
      setRoutineName('');
      setRoutineNote('');
      setShowRoutineForm(false);
      queryClient.invalidateQueries({ queryKey: ['student-routines'] });
    },
  });

  if (!student) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const levelInfo = calculateLevel(student.xp_total || 0);
  const recentSessions = [...(sessions || [])].sort((a, b) => (b.created_date || '').localeCompare(a.created_date || '')).slice(0, 5);
  const recentPRs = [...(prs || [])].sort((a, b) => (b.achieved_at || '').localeCompare(a.achieved_at || '')).slice(0, 3);
  const activeRoutine = (routines || []).find(r => r.is_active) || (routines || [])[0];
  const latestMeasure = [...(measurements || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];

  // Weekly frequency
  const thisWeekSessions = (sessions || []).filter(s => {
    const d = s.finished_at?.slice(0, 10) || s.created_date?.slice(0, 10) || '';
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo.toISOString().slice(0, 10);
  }).length;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      {/* Back */}
      <Link to="/admin/students" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* Profile Header */}
      <motion.div className="bg-card rounded-2xl border border-border p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-gold flex items-center justify-center text-xl font-display font-black text-white shrink-0">
            {student.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{student.name}</h1>
            <p className="text-sm text-muted-foreground">{student.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2 py-1 rounded-lg font-bold">
                🔥 {student.current_streak || 0} dias
              </span>
              <span className="text-xs bg-gold/10 border border-gold/20 text-gold px-2 py-1 rounded-lg font-bold">
                Nv.{levelInfo.level} — {levelInfo.title}
              </span>
              {student.plan_type && (
                <span className="text-xs bg-muted/30 text-muted-foreground px-2 py-1 rounded-lg">
                  {student.plan_type}
                </span>
              )}
            </div>
            <div className="mt-3">
              <LevelProgress levelInfo={levelInfo} size="sm" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Treinos', value: sessions?.length || 0, icon: '💪' },
          { label: 'Esta semana', value: thisWeekSessions, icon: '📅' },
          { label: 'PRs', value: prs?.length || 0, icon: '🏆' },
          { label: 'Streak máx.', value: student.max_streak || 0, icon: '🔥' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <span className="text-xl">{stat.icon}</span>
            <p className="font-display text-lg font-bold mt-1">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={() => setShowNoteForm(s => !s)}
          className="flex-1 flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary font-bold py-3 rounded-2xl hover:bg-primary/20 transition-all text-sm">
          <MessageSquare className="w-4 h-4" /> Adicionar orientação
        </button>
        <button onClick={() => setShowRoutineForm(s => !s)}
          className="flex-1 flex items-center justify-center gap-2 bg-gold/10 border border-gold/30 text-gold font-bold py-3 rounded-2xl hover:bg-gold/20 transition-all text-sm">
          <Plus className="w-4 h-4" /> Criar rotina
        </button>
      </div>

      {/* Note form */}
      {showNoteForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/20 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold">Orientação para {student.name}</p>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
            placeholder="Ex: Aumenta o peso no supino na próxima semana. Você está pronto."
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none" />
          <button onClick={() => createNoteMutation.mutate()} disabled={!noteText.trim() || createNoteMutation.isPending}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40">
            {createNoteMutation.isPending ? 'Enviando...' : 'Enviar orientação'}
          </button>
        </motion.div>
      )}

      {/* Routine form */}
      {showRoutineForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-gold/20 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold">⭐ Nova Rotina para {student.name}</p>
          <input value={routineName} onChange={e => setRoutineName(e.target.value)}
            placeholder="Nome da rotina (ex: Upper A — Força + Puxada)"
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50" />
          <textarea value={routineNote} onChange={e => setRoutineNote(e.target.value)} rows={2}
            placeholder="Nota para o aluno (objetivo, foco, dicas...)"
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none" />
          <button onClick={() => createRoutineMutation.mutate()} disabled={!routineName.trim() || createRoutineMutation.isPending}
            className="w-full bg-gold text-background font-bold py-3 rounded-xl hover:bg-gold/90 transition-all disabled:opacity-40">
            {createRoutineMutation.isPending ? 'Criando...' : 'Criar Rotina do Jota'}
          </button>
        </motion.div>
      )}

      {/* Rotinas */}
      {(routines || []).length > 0 && (
        <Card className="p-4 bg-card border-border">
          <p className="font-bold text-sm mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-gold" /> Rotinas
          </p>
          <div className="space-y-2">
            {(routines || []).map(r => (
              <div key={r.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{r.name}</p>
                  <div className="flex items-center gap-2">
                    {r.created_by === 'jota' && <span className="text-[10px] text-gold font-bold">⭐ Jota</span>}
                    {r.is_active && <span className="text-[10px] text-primary font-bold">Ativa</span>}
                  </div>
                </div>
                {r.consultant_note && <p className="text-xs text-muted-foreground italic max-w-[150px] text-right truncate">"{r.consultant_note}"</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent PRs */}
      {recentPRs.length > 0 && (
        <Card className="p-4 bg-card border-border">
          <p className="font-bold text-sm mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" /> PRs Recentes
          </p>
          <div className="space-y-2">
            {recentPRs.map(pr => (
              <div key={pr.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold">{pr.exercise_name}</p>
                  <p className="text-xs text-gold">
                    {pr.record_type === 'max_weight' ? `${pr.weight_kg}kg × ${pr.reps}` :
                     pr.record_type === 'max_reps' ? `${pr.reps} reps` : pr.context || '—'}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground">{pr.achieved_at}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card className="p-4 bg-card border-border">
        <p className="font-bold text-sm mb-3 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-primary" /> Treinos Recentes
        </p>
        <div className="space-y-2">
          {recentSessions.map(s => (
            <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{s.routine_name || 'Treino'}</p>
                <p className="text-xs text-muted-foreground">
                  {s.finished_at?.slice(0, 10) || s.created_date?.slice(0, 10)}
                  {s.duration_minutes ? ` · ${s.duration_minutes}'` : ''}
                  {s.sets_completed ? ` · ${s.sets_completed} séries` : ''}
                </p>
              </div>
              <div className="text-right">
                {s.xp_earned && <p className="text-xs font-bold text-gold">+{s.xp_earned} XP</p>}
                {s.prs_count > 0 && <p className="text-[10px] text-gold">🏆 {s.prs_count} PR</p>}
              </div>
            </div>
          ))}
          {recentSessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum treino concluído ainda</p>
          )}
        </div>
      </Card>

      {/* Body measurements */}
      {latestMeasure && (
        <Card className="p-4 bg-card border-border">
          <p className="font-bold text-sm mb-3">📏 Última Medição — {latestMeasure.date}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Peso', key: 'weight_kg', unit: 'kg' },
              { label: 'Gordura', key: 'body_fat_pct', unit: '%' },
              { label: 'Bíceps', key: 'arm_circumference', unit: 'cm' },
            ].filter(f => latestMeasure[f.key]).map(f => (
              <div key={f.key} className="text-center">
                <p className="font-bold text-base">{latestMeasure[f.key]}<span className="text-xs text-muted-foreground">{f.unit}</span></p>
                <p className="text-[10px] text-muted-foreground">{f.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Account info */}
      <Card className="p-4 bg-card border-border">
        <p className="font-bold text-sm mb-3">Informações</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cadastro</span>
            <span>{student.created_date?.split('T')[0]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Último check-in</span>
            <span>{student.last_checkin_date || 'Nunca'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">XP total</span>
            <span className="text-gold font-bold">{(student.xp_total || 0).toLocaleString()}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}