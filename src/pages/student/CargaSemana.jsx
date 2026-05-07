import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { format, startOfWeek, addDays, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { ACTIVITY_MUSCLE_IMPACT, applyIntensityMultiplier, fatigueLevel, FATIGUE_COLOR, FATIGUE_BG, FATIGUE_BAR, ACTIVITY_LABELS } from '@/lib/trainingLoad';

const MUSCLE_GROUPS = [
  { key: 'pernas', label: 'Pernas', emoji: '🦵' },
  { key: 'costas', label: 'Costas', emoji: '🔙' },
  { key: 'peito', label: 'Peito', emoji: '💪' },
  { key: 'ombros', label: 'Ombros', emoji: '🔝' },
  { key: 'core', label: 'Core', emoji: '🔥' },
  { key: 'cardiovascular', label: 'Cardiovascular', emoji: '❤️' },
];

const MUSCLE_KEYWORDS = {
  pernas: ['pernas', 'quadriceps', 'posterior', 'gluteos', 'panturrilhas', 'lower', 'agachamento', 'leg', 'hinge'],
  costas: ['costas', 'pull', 'puxada', 'remada', 'back', 'dorsais', 'trapezio'],
  peito: ['peito', 'push', 'flexão', 'supino', 'peitoral', 'chest'],
  ombros: ['ombros', 'ombro', 'shoulder', 'deltoides', 'handstand', 'press'],
  core: ['core', 'abdomen', 'front lever', 'lsit', 'hollow', 'planche'],
  cardiovascular: ['cardiovascular', 'corrida', 'bike', 'natação', 'hiit', 'condicionamento'],
};

function sessionMuscleFatigue(session) {
  const fatigue = {};
  const name = (session.routine_name || '').toLowerCase();
  for (const [group, keywords] of Object.entries(MUSCLE_KEYWORDS)) {
    if (keywords.some(k => name.includes(k))) {
      fatigue[group] = (fatigue[group] || 0) + 30;
    }
  }
  // volume contribution
  if (session.sets_completed) {
    const vol = Math.min(session.sets_completed * 2.5, 40);
    Object.keys(fatigue).forEach(k => { fatigue[k] = Math.min(100, fatigue[k] + vol); });
  }
  return fatigue;
}

function activityMuscleFatigue(activity) {
  const base = ACTIVITY_MUSCLE_IMPACT[activity.activity_type] || {};
  const withIntensity = applyIntensityMultiplier(base, activity.intensity);
  // normalize keys: legs_fatigue_score -> pernas
  const keyMap = {
    legs_fatigue_score: 'pernas',
    back_fatigue_score: 'costas',
    chest_fatigue_score: 'peito',
    shoulders_fatigue_score: 'ombros',
    core_fatigue_score: 'core',
    cardiovascular_fatigue_score: 'cardiovascular',
  };
  const result = {};
  for (const [k, v] of Object.entries(withIntensity)) {
    const mapped = keyMap[k];
    if (mapped) result[mapped] = v;
  }
  return result;
}

export default function CargaSemana() {
  const { user } = useCurrentUser();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(addDays(new Date(weekStart + 'T12:00:00'), 6), 'yyyy-MM-dd');

  const { data: sessions } = useQuery({
    queryKey: ['my-sessions', user?.email],
    queryFn: () => base44.entities.WorkoutSession.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: activities } = useQuery({
    queryKey: ['hybrid-activities', user?.email],
    queryFn: () => base44.entities.HybridActivity.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const weekSessions = useMemo(() =>
    (sessions || []).filter(s => {
      const d = (s.finished_at || s.created_date || '').slice(0, 10);
      return d >= weekStart && d <= weekEnd;
    }), [sessions, weekStart, weekEnd]);

  const weekActivities = useMemo(() =>
    (activities || []).filter(a => a.date >= weekStart && a.date <= weekEnd),
    [activities, weekStart, weekEnd]);

  // Aggregate fatigue
  const fatigue = useMemo(() => {
    const total = {};
    weekSessions.forEach(s => {
      const f = sessionMuscleFatigue(s);
      Object.entries(f).forEach(([k, v]) => { total[k] = Math.min(100, (total[k] || 0) + v); });
    });
    weekActivities.forEach(a => {
      const f = activityMuscleFatigue(a);
      Object.entries(f).forEach(([k, v]) => { total[k] = Math.min(100, (total[k] || 0) + v); });
    });
    return total;
  }, [weekSessions, weekActivities]);

  // Load by modality
  const loads = useMemo(() => {
    const strLoad = weekSessions.length * 25;
    const cardioActivities = weekActivities.filter(a => ['corrida', 'caminhada', 'bike', 'natacao', 'HIIT', 'condicionamento'].includes(a.activity_type));
    const cardLoad = cardioActivities.reduce((acc, a) => {
      const mult = { leve: 10, moderado: 20, intenso: 35, maximo: 50 }[a.intensity] || 20;
      return acc + mult;
    }, 0);
    const skillActivities = weekActivities.filter(a => a.activity_type === 'calistenia_tecnica');
    const skillLoad = skillActivities.length * 20;
    const mobActivities = weekActivities.filter(a => ['mobilidade', 'alongamento', 'recuperacao_ativa'].includes(a.activity_type));
    const mobLoad = mobActivities.length * 10;
    return { strength: Math.min(100, strLoad), cardio: Math.min(100, cardLoad), skill: Math.min(100, skillLoad), mobility: Math.min(100, mobLoad) };
  }, [weekSessions, weekActivities]);

  const totalLoad = Math.round((loads.strength + loads.cardio + loads.skill + loads.mobility) / 4);
  const overallLevel = fatigueLevel(totalLoad);

  const LOAD_LABELS = { strength: 'Força 🏋️', cardio: 'Cardio 🏃', skill: 'Skill 🤼', mobility: 'Mobilidade 🤸' };

  // Recommendations
  const recs = useMemo(() => {
    const r = [];
    if ((fatigue.pernas || 0) >= 60) r.push({ icon: '🦵', text: 'Pernas com fadiga alta. Prefira upper body ou cardio leve hoje.', color: 'text-primary' });
    if ((fatigue.costas || 0) >= 55 && (fatigue.core || 0) >= 50) r.push({ icon: '🔁', text: 'Costas e core acumulados. Skills devem ser técnicas, não máximas.', color: 'text-gold' });
    if ((fatigue.ombros || 0) >= 65) r.push({ icon: '⚠️', text: 'Ombros com alta demanda. Faça mobilidade ou puxada leve.', color: 'text-destructive' });
    if (!weekActivities.some(a => ['mobilidade', 'alongamento'].includes(a.activity_type))) r.push({ icon: '🤸', text: 'Sem mobilidade esta semana. Adicione 10 minutos hoje.', color: 'text-blue-400' });
    if (weekSessions.length + weekActivities.length >= 4) r.push({ icon: '💪', text: `Boa consistência! ${weekSessions.length + weekActivities.length} sessões esta semana.`, color: 'text-success' });
    return r;
  }, [fatigue, weekSessions, weekActivities]);

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="px-4 pt-4 pb-3">
        <h1 className="font-display text-xl font-black">CARGA DA SEMANA</h1>
        <p className="text-xs text-muted-foreground">{weekSessions.length} treinos + {weekActivities.length} atividades</p>
      </div>

      {/* Overall */}
      <div className="mx-4 mb-4">
        <div className={`rounded-2xl border p-4 ${FATIGUE_BG[overallLevel]}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-sm">Carga geral da semana</p>
            <span className={`text-sm font-display font-black uppercase ${FATIGUE_COLOR[overallLevel]}`}>
              {overallLevel === 'baixa' ? 'Baixa' : overallLevel === 'moderada' ? 'Moderada' : overallLevel === 'alta' ? 'Alta' : 'Muito Alta'}
            </span>
          </div>
          <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden">
            <motion.div className={`h-full ${FATIGUE_BAR[overallLevel]} rounded-full`}
              animate={{ width: `${totalLoad}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>
      </div>

      {/* Load by modality */}
      <div className="mx-4 mb-4 bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-bold mb-3">Por modalidade</p>
        <div className="space-y-3">
          {Object.entries(loads).map(([key, val]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{LOAD_LABELS[key]}</span>
                <span className={`text-xs font-bold ${FATIGUE_COLOR[fatigueLevel(val)]}`}>
                  {fatigueLevel(val) === 'baixa' ? 'Baixa' : fatigueLevel(val) === 'moderada' ? 'Moderada' : fatigueLevel(val) === 'alta' ? 'Alta' : 'Muito Alta'}
                </span>
              </div>
              <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
                <motion.div className={`h-full ${FATIGUE_BAR[fatigueLevel(val)]} rounded-full`}
                  animate={{ width: `${val}%` }} transition={{ duration: 0.7, delay: 0.1 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Muscle fatigue */}
      <div className="mx-4 mb-4 bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-bold mb-3">Fadiga por região</p>
        <div className="grid grid-cols-3 gap-2">
          {MUSCLE_GROUPS.map(g => {
            const score = fatigue[g.key] || 0;
            const level = fatigueLevel(score);
            return (
              <div key={g.key} className={`rounded-xl border p-3 text-center ${FATIGUE_BG[level]}`}>
                <p className="text-xl mb-1">{g.emoji}</p>
                <p className={`text-xs font-bold ${FATIGUE_COLOR[level]}`}>
                  {level === 'baixa' ? 'Baixa' : level === 'moderada' ? 'Mod.' : level === 'alta' ? 'Alta' : 'Muito Alta'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{g.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="mx-4 space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Recomendações</p>
          {recs.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl px-4 py-3 flex items-start gap-3">
              <span className="text-xl shrink-0">{r.icon}</span>
              <p className={`text-sm font-medium ${r.color}`}>{r.text}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}