/**
 * JotaStudentRow — linha compacta da lista de alunos no Painel Jota.
 * Mostra: nome, objetivo, status, rotina ativa, freq semanal, streak, último treino, PR recente, alerta.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, differenceInDays, subDays } from 'date-fns';
import { Flame, Trophy, AlertCircle, ChevronRight, Star } from 'lucide-react';

const GOAL_LABEL = {
  hipertrofia: 'Hipertrofia',
  perda_de_gordura: 'Perda de gordura',
  recomposicao: 'Recomposição',
  forca: 'Força',
  calistenia: 'Calistenia',
  performance: 'Performance',
  saude: 'Saúde',
  condicionamento: 'Condicionamento',
  hibrido: 'Híbrido',
};

const STATUS_STYLE = {
  ativo:    'bg-success/15 text-success border-success/30',
  lead:     'bg-blue-400/15 text-blue-400 border-blue-400/30',
  pausado:  'bg-gold/15 text-gold border-gold/30',
  encerrado:'bg-muted/40 text-muted-foreground border-border',
};

export default function JotaStudentRow({ profile, sessions, prs, activeRoutine }) {
  const today = new Date();

  // Frequência últimos 7 dias
  const weekAgo = format(subDays(today, 7), 'yyyy-MM-dd');
  const weekFreq = (sessions || []).filter(s => {
    const d = s.finishedAt?.slice(0, 10) || s.startedAt?.slice(0, 10) || '';
    return d >= weekAgo && (s.status === 'completed' || !s.status);
  }).length;

  // Último treino
  const lastSession = [...(sessions || [])]
    .filter(s => s.status === 'completed' || !s.status)
    .sort((a, b) => (b.finishedAt || b.startedAt || '').localeCompare(a.finishedAt || a.startedAt || ''))[0];
  const lastDate = lastSession?.finishedAt?.slice(0, 10) || lastSession?.startedAt?.slice(0, 10);
  const daysSince = lastDate ? differenceInDays(today, parseISO(lastDate)) : null;

  // PR mais recente
  const recentPR = [...(prs || [])].sort(
    (a, b) => (b.achievedAt || '').localeCompare(a.achievedAt || '')
  )[0];

  // Alerta principal
  let alert = null;
  if (!activeRoutine) {
    alert = { text: 'Sem rotina ativa', tone: 'destructive' };
  } else if (daysSince === null) {
    alert = { text: 'Nunca treinou', tone: 'destructive' };
  } else if (daysSince >= 14) {
    alert = { text: `${daysSince}d sem treino`, tone: 'destructive' };
  } else if (daysSince >= 7) {
    alert = { text: `${daysSince}d sem treino`, tone: 'gold' };
  } else if (weekFreq < 2 && (profile.weeklyTrainingFrequencyGoal || 3) >= 3) {
    alert = { text: 'Freq. baixa', tone: 'gold' };
  }

  const status = profile.consultantStatus || 'ativo';
  const goalLabel = GOAL_LABEL[profile.mainGoal] || profile.mainGoal || '—';

  return (
    <Link
      to={`/admin/students/${encodeURIComponent(profile.email)}`}
      className="block bg-card border border-border rounded-2xl p-3 hover:border-primary/30 transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center text-sm font-display font-black text-white shrink-0">
          {profile.name?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Nome + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm leading-tight truncate max-w-[60%]">{profile.name}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${STATUS_STYLE[status]}`}>
              {status}
            </span>
            {profile.currentStreak > 0 && (
              <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                <Flame className="w-3 h-3" /> {profile.currentStreak}
              </span>
            )}
          </div>

          {/* Objetivo */}
          <p className="text-[11px] text-muted-foreground truncate">🎯 {goalLabel}</p>

          {/* Rotina ativa */}
          <div className="flex items-center gap-1 mt-1">
            <Star className={`w-3 h-3 ${activeRoutine ? 'text-gold' : 'text-muted-foreground/40'}`} />
            <p className={`text-[11px] truncate ${activeRoutine ? 'text-foreground' : 'text-muted-foreground'}`}>
              {activeRoutine ? activeRoutine.name : 'Sem rotina'}
            </p>
          </div>

          {/* Métricas */}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
            <span><b className="text-foreground">{weekFreq}</b>/sem</span>
            <span>
              {lastDate
                ? <>último: <b className="text-foreground">{daysSince === 0 ? 'hoje' : `${daysSince}d`}</b></>
                : 'sem treino'}
            </span>
            {recentPR && (
              <span className="flex items-center gap-0.5 text-gold">
                <Trophy className="w-2.5 h-2.5" />
                <span className="truncate max-w-[110px]">{recentPR.exerciseName}</span>
              </span>
            )}
          </div>

          {/* Alerta */}
          {alert && (
            <div className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border
              ${alert.tone === 'destructive'
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-gold/10 border-gold/30 text-gold'}`}>
              <AlertCircle className="w-2.5 h-2.5" /> {alert.text}
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </Link>
  );
}