/**
 * recommendationService — gera recomendações automáticas para alunos.
 *
 * Por enquanto é puramente client-side / heurística.
 * No futuro, pode delegar a uma backend function que use IA/análises.
 */
import { format, parseISO, differenceInDays, subDays } from 'date-fns';

/**
 * Gera recomendações para um aluno com base em rotina, sessões, PRs e perfil.
 * Todos os parâmetros estão no formato neutro (camelCase).
 *
 * @param {Object} ctx
 * @param {import('./types').StudentProfile} ctx.profile
 * @param {import('./types').Routine} [ctx.activeRoutine]
 * @param {import('./types').WorkoutSession[]} [ctx.sessions]
 * @param {import('./types').ExercisePersonalRecord[]} [ctx.prs]
 * @returns {import('./types').TrainingRecommendation[]}
 */
export function buildRecommendations({ profile, activeRoutine, sessions = [], prs = [] }) {
  const recs = [];
  if (!profile) return recs;

  const completed = sessions.filter(s => s.status === 'completed' || !s.status);
  const lastDate = completed[0]?.finishedAt?.slice(0, 10) || completed[0]?.startedAt?.slice(0, 10);
  const daysSince = lastDate ? differenceInDays(new Date(), parseISO(lastDate)) : null;
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const weekFreq = completed.filter(s =>
    (s.finishedAt?.slice(0, 10) || s.startedAt?.slice(0, 10) || '') >= weekAgo
  ).length;
  const recentPRs = prs.slice(0, 5);

  if (!activeRoutine) {
    recs.push({ tone: 'destructive', text: 'Aluno está sem rotina ativa. Crie ou ative uma para ele.' });
  }
  if (daysSince !== null && daysSince >= 7) {
    recs.push({ tone: 'destructive', text: `Sem treino há ${daysSince} dias. Vale enviar uma mensagem de retomada.` });
  }
  if (weekFreq < 2 && (profile.weeklyTrainingFrequencyGoal || 3) >= 3) {
    recs.push({ tone: 'gold', text: `Frequência abaixo da meta (${weekFreq}/${profile.weeklyTrainingFrequencyGoal || 3}). Avalie ajustar volume ou agenda.` });
  }
  if (recentPRs.length === 0 && completed.length > 8) {
    recs.push({ tone: 'gold', text: 'Sem PRs registrados em muitas sessões. Reveja se as cargas/progressões estão certas.' });
  }
  if (profile.injuriesOrLimitations) {
    recs.push({ tone: 'destructive', text: `Atenção a limitação: "${profile.injuriesOrLimitations}".` });
  }
  if (recs.length === 0) {
    recs.push({ tone: 'success', text: 'Tudo no caminho — aluno consistente e progredindo.' });
  }

  return recs;
}

/**
 * Computa indicadores rápidos para a lista de alunos do Painel Jota.
 */
export function computeStudentSnapshot({ profile, sessions = [], prs = [], activeRoutine }) {
  const completed = sessions.filter(s => s.status === 'completed' || !s.status);
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const weekFreq = completed.filter(s =>
    (s.finishedAt?.slice(0, 10) || s.startedAt?.slice(0, 10) || '') >= weekAgo
  ).length;
  const lastDate = [...completed]
    .sort((a, b) => (b.finishedAt || b.startedAt || '').localeCompare(a.finishedAt || a.startedAt || ''))[0]
    ?.finishedAt?.slice(0, 10) || null;
  const daysSince = lastDate ? differenceInDays(new Date(), parseISO(lastDate)) : null;
  const recentPR = [...prs].sort((a, b) => (b.achievedAt || '').localeCompare(a.achievedAt || ''))[0];
  const hasAlert = !activeRoutine || daysSince === null || daysSince >= 7
    || (weekFreq < 2 && (profile.weeklyTrainingFrequencyGoal || 3) >= 3);

  return { weekFreq, lastDate, daysSince, recentPR, hasAlert, activeRoutine };
}