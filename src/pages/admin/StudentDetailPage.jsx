/**
 * StudentDetailPage — Tela 2 do Painel do Consultor.
 * Perfil completo do aluno com todas as ações de consultoria.
 */
import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, differenceInDays, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Trophy, Dumbbell, Plus, MessageSquare, Star, Edit2, Copy,
  CheckCircle2, ChevronDown, ChevronUp, Flame, Target, Wrench, AlertTriangle,
  Activity, Scale, History, Power
} from 'lucide-react';
import { calculateLevel } from '@/lib/gamification';
import AddConsultantNoteModal from '@/components/consultant/AddConsultantNoteModal';
import ConsultantNoteCard from '@/components/consultant/ConsultantNoteCard';
import JotaRoutineForm from '@/components/consultant/JotaRoutineForm';
import JotaStatusSelector from '@/components/consultant/JotaStatusSelector';

const GOAL_LABEL = {
  hipertrofia: 'Hipertrofia', perda_de_gordura: 'Perda de gordura', recomposicao: 'Recomposição',
  forca: 'Força', calistenia: 'Calistenia', performance: 'Performance', saude: 'Saúde',
  condicionamento: 'Condicionamento', hibrido: 'Híbrido',
};

const PHASE_LABEL = {
  adaptacao: 'Adaptação', hipertrofia: 'Hipertrofia', forca: 'Força', cutting: 'Cutting',
  performance: 'Performance', skill: 'Skill', manutencao: 'Manutenção', recuperacao: 'Recuperação',
};

function Section({ icon: Icon, title, action, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, danger }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-xs py-1">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className={`flex-1 ${danger ? 'text-destructive' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

export default function StudentDetailPage() {
  const { studentEmail: rawEmail } = useParams();
  const studentEmail = decodeURIComponent(rawEmail || '');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [routineForm, setRoutineForm] = useState(null); // { mode, routine }
  const [expandedSection, setExpandedSection] = useState({ sessions: false, prs: false, measures: false });

  // Tenta achar profile por email; se não bater, tenta por id (compat com link antigo)
  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.StudentProfile.list(),
  });
  const student = profiles?.find(p => p.email === studentEmail || p.id === studentEmail);
  const realEmail = student?.email;

  const { data: sessions } = useQuery({
    queryKey: ['student-sessions', realEmail],
    queryFn: () => base44.entities.WorkoutSession.filter({ student_email: realEmail }, '-started_at'),
    enabled: !!realEmail,
  });
  const { data: prs } = useQuery({
    queryKey: ['student-prs', realEmail],
    queryFn: () => base44.entities.ExercisePersonalRecord.filter({ student_email: realEmail }, '-achieved_at'),
    enabled: !!realEmail,
  });
  const { data: routines } = useQuery({
    queryKey: ['student-routines', realEmail],
    queryFn: () => base44.entities.Routine.filter({ student_email: realEmail }),
    enabled: !!realEmail,
  });
  const { data: measurements } = useQuery({
    queryKey: ['student-measurements', realEmail],
    queryFn: () => base44.entities.BodyMeasurement.filter({ student_email: realEmail }, '-date'),
    enabled: !!realEmail,
  });
  const { data: consultantNotes } = useQuery({
    queryKey: ['consultant-notes', realEmail],
    queryFn: () => base44.entities.ConsultantNote.filter({ student_email: realEmail }),
    enabled: !!realEmail,
  });

  const activateMutation = useMutation({
    mutationFn: async (routineId) => {
      // Desativa todas
      const all = await base44.entities.Routine.filter({ student_email: realEmail });
      await Promise.all((all || []).filter(r => r.is_active).map(r =>
        base44.entities.Routine.update(r.id, { is_active: false })
      ));
      // Ativa a escolhida
      return base44.entities.Routine.update(routineId, { is_active: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['student-routines'] }),
  });

  const completedSessions = (sessions || []).filter(s => s.status === 'completed' || !s.status);
  const recentPRs = (prs || []).slice(0, 5);

  // Frequência semanal
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const weekFreq = completedSessions.filter(s =>
    (s.finished_at?.slice(0, 10) || s.started_at?.slice(0, 10) || '') >= weekAgo
  ).length;
  const lastDate = completedSessions[0]?.finished_at?.slice(0, 10) || completedSessions[0]?.started_at?.slice(0, 10);
  const daysSince = lastDate ? differenceInDays(new Date(), parseISO(lastDate)) : null;
  const activeRoutine = (routines || []).find(r => r.is_active);

  // Recomendações automáticas — useMemo deve vir antes de qualquer early return
  const recommendations = useMemo(() => {
    if (!student) return [];
    const recs = [];
    if (!activeRoutine) recs.push({ tone: 'destructive', text: 'Aluno está sem rotina ativa. Crie ou ative uma para ele.' });
    if (daysSince !== null && daysSince >= 7) recs.push({ tone: 'destructive', text: `Sem treino há ${daysSince} dias. Vale enviar uma mensagem de retomada.` });
    if (weekFreq < 2 && (student.weekly_training_frequency_goal || 3) >= 3) recs.push({ tone: 'gold', text: `Frequência abaixo da meta (${weekFreq}/${student.weekly_training_frequency_goal || 3}). Avalie ajustar volume ou agenda.` });
    if (recentPRs.length === 0 && completedSessions.length > 8) recs.push({ tone: 'gold', text: 'Sem PRs registrados em muitas sessões. Reveja se as cargas/progressões estão certas.' });
    if (student.injuries_or_limitations) recs.push({ tone: 'destructive', text: `Atenção a limitação: "${student.injuries_or_limitations}".` });
    if (recs.length === 0) recs.push({ tone: 'success', text: 'Tudo no caminho — aluno consistente e progredindo.' });
    return recs;
  }, [activeRoutine, daysSince, weekFreq, student, recentPRs, completedSessions]);

  if (!student) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const levelInfo = calculateLevel(student.xp_total || 0);
  const recentSessions = completedSessions.slice(0, 5);
  const allSessionsForToggle = expandedSection.sessions ? completedSessions.slice(0, 30) : recentSessions;
  const allPRsForToggle = expandedSection.prs ? (prs || []).slice(0, 30) : recentPRs;
  const recentMeasures = (measurements || []).slice(0, 3);
  const allMeasuresForToggle = expandedSection.measures ? (measurements || []).slice(0, 20) : recentMeasures;
  const sortedNotes = [...(consultantNotes || [])].sort((a, b) =>
    (b.created_at || b.created_date || '').localeCompare(a.created_at || a.created_date || '')
  );
  const otherRoutines = (routines || []).filter(r => !r.is_active);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 pb-12 space-y-4">
      {/* Voltar */}
      <Link to="/admin/painel" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Voltar ao painel
      </Link>

      {/* Header com status selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-4"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-gold flex items-center justify-center text-base font-display font-black text-white shrink-0">
              {student.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{student.name}</h1>
              <p className="text-xs text-muted-foreground truncate">{student.email}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Nv.{levelInfo.level} · {levelInfo.title} · {(student.xp_total || 0).toLocaleString()} XP
              </p>
            </div>
          </div>
          <JotaStatusSelector profile={student} />
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="bg-muted/20 rounded-xl p-2 text-center">
            <p className="text-base">💪</p>
            <p className="font-display font-black text-base">{completedSessions.length}</p>
            <p className="text-[9px] text-muted-foreground">Treinos</p>
          </div>
          <div className="bg-muted/20 rounded-xl p-2 text-center">
            <p className="text-base">📅</p>
            <p className="font-display font-black text-base">{weekFreq}</p>
            <p className="text-[9px] text-muted-foreground">Esta sem.</p>
          </div>
          <div className="bg-muted/20 rounded-xl p-2 text-center">
            <p className="text-base">🔥</p>
            <p className="font-display font-black text-base text-primary">{student.current_streak || 0}</p>
            <p className="text-[9px] text-muted-foreground">Streak</p>
          </div>
          <div className="bg-muted/20 rounded-xl p-2 text-center">
            <p className="text-base">🏆</p>
            <p className="font-display font-black text-base text-gold">{(prs || []).length}</p>
            <p className="text-[9px] text-muted-foreground">PRs</p>
          </div>
        </div>
      </motion.div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setRoutineForm({ mode: 'create', routine: null })}
          className="flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary font-bold py-3 rounded-2xl hover:bg-primary/20 text-sm"
        >
          <Plus className="w-4 h-4" /> Nova rotina
        </button>
        <button
          onClick={() => setShowNoteModal(true)}
          className="flex items-center justify-center gap-2 bg-gold/10 border border-gold/30 text-gold font-bold py-3 rounded-2xl hover:bg-gold/20 text-sm"
        >
          <MessageSquare className="w-4 h-4" /> Nova nota
        </button>
      </div>

      {/* Recomendações */}
      <Section icon={AlertTriangle} title="Recomendações">
        <div className="space-y-2">
          {recommendations.map((r, i) => (
            <div
              key={i}
              className={`text-xs px-3 py-2 rounded-xl border
                ${r.tone === 'destructive' ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : r.tone === 'gold' ? 'bg-gold/10 border-gold/30 text-gold'
                : 'bg-success/10 border-success/30 text-success'}`}
            >
              {r.text}
            </div>
          ))}
        </div>
      </Section>

      {/* Dados básicos / Perfil de consultoria */}
      <Section icon={Target} title="Perfil de Consultoria">
        <div className="grid grid-cols-1 gap-y-0.5">
          <InfoRow label="Objetivo" value={GOAL_LABEL[student.main_goal] || student.main_goal} />
          <InfoRow label="Fase atual" value={PHASE_LABEL[student.current_phase] || student.current_phase} />
          <InfoRow label="Local" value={student.training_location} />
          <InfoRow label="Nível musc." value={student.experience_level_musculation} />
          <InfoRow label="Nível calist." value={student.experience_level_calisthenics} />
          <InfoRow label="Freq. meta" value={student.weekly_training_frequency_goal ? `${student.weekly_training_frequency_goal}x/sem` : null} />
          <InfoRow label="Peso" value={student.current_bodyweight_kg ? `${student.current_bodyweight_kg} kg` : null} />
          <InfoRow label="Altura" value={student.height_cm ? `${student.height_cm} cm` : null} />
          <InfoRow label="WhatsApp" value={student.whatsapp} />
        </div>
      </Section>

      {/* Equipamentos */}
      {(student.available_equipment || []).length > 0 && (
        <Section icon={Wrench} title="Equipamentos disponíveis">
          <div className="flex flex-wrap gap-1.5">
            {student.available_equipment.map(eq => (
              <span key={eq} className="text-[11px] bg-muted/30 text-foreground px-2 py-1 rounded-lg">{eq}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Lesões / limitações */}
      {(student.injuries_or_limitations || student.medical_notes || student.emergency_notes) && (
        <Section icon={AlertTriangle} title="Lesões e limitações">
          {student.injuries_or_limitations && <p className="text-xs text-destructive mb-2">⚠️ {student.injuries_or_limitations}</p>}
          {student.medical_notes && <p className="text-xs text-muted-foreground">{student.medical_notes}</p>}
          {student.emergency_notes && <p className="text-xs text-muted-foreground italic mt-1">Emergência: {student.emergency_notes}</p>}
        </Section>
      )}

      {/* Rotinas */}
      <Section icon={Star} title="Rotinas">
        {(routines || []).length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma rotina criada ainda.</p>
        ) : (
          <div className="space-y-2">
            {activeRoutine && (
              <RoutineCard
                routine={activeRoutine}
                isActive
                onEdit={() => setRoutineForm({ mode: 'edit', routine: activeRoutine })}
                onDuplicate={() => setRoutineForm({ mode: 'duplicate', routine: activeRoutine })}
              />
            )}
            {otherRoutines.map(r => (
              <RoutineCard
                key={r.id}
                routine={r}
                onActivate={() => activateMutation.mutate(r.id)}
                onEdit={() => setRoutineForm({ mode: 'edit', routine: r })}
                onDuplicate={() => setRoutineForm({ mode: 'duplicate', routine: r })}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Histórico de sessões */}
      <Section
        icon={Dumbbell}
        title="Últimas sessões"
        action={completedSessions.length > 5 && (
          <button
            onClick={() => setExpandedSection(s => ({ ...s, sessions: !s.sessions }))}
            className="text-[10px] font-bold text-primary flex items-center gap-1"
          >
            {expandedSection.sessions ? 'Recolher' : 'Ver mais'}
            {expandedSection.sessions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      >
        {allSessionsForToggle.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum treino concluído ainda.</p>
        ) : (
          <div className="space-y-1.5">
            {allSessionsForToggle.map(s => (
              <div key={s.id} className="flex items-center justify-between text-xs bg-muted/15 rounded-lg px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{s.routine_name || 'Treino'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(s.finished_at || s.started_at || s.created_date || '').slice(0, 10)}
                    {s.duration_minutes ? ` · ${s.duration_minutes}'` : ''}
                    {s.sets_completed ? ` · ${s.sets_completed} séries` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  {s.xp_earned > 0 && <p className="text-gold font-bold">+{s.xp_earned}</p>}
                  {s.prs_count > 0 && <p className="text-[9px] text-gold">🏆×{s.prs_count}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* PRs */}
      <Section
        icon={Trophy}
        title="PRs recentes"
        action={(prs || []).length > 5 && (
          <button
            onClick={() => setExpandedSection(s => ({ ...s, prs: !s.prs }))}
            className="text-[10px] font-bold text-primary flex items-center gap-1"
          >
            {expandedSection.prs ? 'Recolher' : 'Ver todos'}
            {expandedSection.prs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      >
        {allPRsForToggle.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum PR registrado ainda.</p>
        ) : (
          <div className="space-y-1.5">
            {allPRsForToggle.map(pr => (
              <div key={pr.id} className="flex items-center gap-2 text-xs bg-gold/5 border border-gold/20 rounded-lg px-2.5 py-1.5">
                <Trophy className="w-3 h-3 text-gold shrink-0" />
                <span className="font-medium truncate flex-1">{pr.exercise_name}</span>
                <span className="text-gold font-bold shrink-0">
                  {pr.record_type === 'max_weight' && pr.weight_kg ? `${pr.weight_kg}kg×${pr.reps}` :
                   pr.record_type === 'max_reps' ? `${pr.reps} reps` :
                   pr.record_type === 'max_duration' ? `${pr.duration_seconds}s` :
                   pr.record_type === 'band_reduction' ? `El.${pr.band_level}` : pr.value}
                </span>
                <span className="text-[9px] text-muted-foreground shrink-0">{pr.achieved_at}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Medidas corporais */}
      <Section
        icon={Scale}
        title="Medidas corporais"
        action={(measurements || []).length > 3 && (
          <button
            onClick={() => setExpandedSection(s => ({ ...s, measures: !s.measures }))}
            className="text-[10px] font-bold text-primary flex items-center gap-1"
          >
            {expandedSection.measures ? 'Recolher' : 'Ver todas'}
            {expandedSection.measures ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      >
        {allMeasuresForToggle.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma medição registrada.</p>
        ) : (
          <div className="space-y-1.5">
            {allMeasuresForToggle.map(m => (
              <div key={m.id} className="flex items-center gap-2 text-xs bg-muted/15 rounded-lg px-2.5 py-2">
                <span className="text-muted-foreground shrink-0 w-20">{m.date}</span>
                <div className="flex-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {m.weight_kg && <span>⚖️ {m.weight_kg}kg</span>}
                  {m.body_fat_pct && <span>📊 {m.body_fat_pct}%</span>}
                  {m.arm_circumference && <span>💪 {m.arm_circumference}cm</span>}
                  {m.chest_circumference && <span>🫀 {m.chest_circumference}cm</span>}
                  {m.waist_circumference && <span>📏 {m.waist_circumference}cm</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Notas do consultor */}
      <Section
        icon={MessageSquare}
        title="Notas do consultor"
        action={
          <button onClick={() => setShowNoteModal(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-primary">
            <Plus className="w-3 h-3" /> Nova
          </button>
        }
      >
        {sortedNotes.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma nota ainda.</p>
        ) : (
          <div className="space-y-2">
            {sortedNotes.slice(0, 6).map(n => <ConsultantNoteCard key={n.id} note={n} />)}
          </div>
        )}
      </Section>

      {/* Modais */}
      {showNoteModal && (
        <AddConsultantNoteModal
          studentEmail={realEmail}
          onClose={() => setShowNoteModal(false)}
        />
      )}
      <AnimatePresence>
        {routineForm && (
          <JotaRoutineForm
            studentEmail={realEmail}
            routine={routineForm.routine}
            mode={routineForm.mode}
            onClose={() => setRoutineForm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Routine card local ────────────────────────────────────────────────────────
function RoutineCard({ routine, isActive, onActivate, onEdit, onDuplicate }) {
  return (
    <div className={`rounded-xl p-3 border ${isActive ? 'bg-primary/5 border-primary/30' : 'bg-muted/15 border-border'}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isActive && (
              <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded">ATIVA</span>
            )}
            {routine.created_by === 'jota' && (
              <span className="text-[9px] font-bold bg-gold/20 text-gold px-1.5 py-0.5 rounded">⭐ JOTA</span>
            )}
            <p className="text-sm font-bold truncate">{routine.name}</p>
          </div>
          {(routine.days_of_week || []).length > 0 && (
            <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
              {routine.days_of_week.join(' · ')}
            </p>
          )}
          {routine.consultant_note && (
            <p className="text-[11px] text-muted-foreground italic mt-1 leading-snug">"{routine.consultant_note}"</p>
          )}
        </div>
      </div>
      <div className="flex gap-1.5 mt-2">
        {!isActive && onActivate && (
          <button onClick={onActivate}
            className="flex items-center gap-1 text-[10px] font-bold bg-success/15 text-success px-2 py-1 rounded-lg hover:bg-success/25">
            <Power className="w-3 h-3" /> Ativar
          </button>
        )}
        <button onClick={onEdit}
          className="flex items-center gap-1 text-[10px] font-bold bg-muted/40 text-muted-foreground px-2 py-1 rounded-lg hover:bg-muted/60 hover:text-foreground">
          <Edit2 className="w-3 h-3" /> Editar
        </button>
        <button onClick={onDuplicate}
          className="flex items-center gap-1 text-[10px] font-bold bg-muted/40 text-muted-foreground px-2 py-1 rounded-lg hover:bg-muted/60 hover:text-foreground">
          <Copy className="w-3 h-3" /> Duplicar
        </button>
      </div>
    </div>
  );
}