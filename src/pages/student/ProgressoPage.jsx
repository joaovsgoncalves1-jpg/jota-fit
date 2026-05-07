import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, TrendingUp, Dumbbell, Trophy, Flame, Calendar, ChevronDown, ChevronUp, Target, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateLevel } from '@/lib/gamification';

const CHART_STYLE = {
  grid: { stroke: 'hsl(0 0% 16%)', strokeDasharray: '3 3' },
  axis: { tick: { fill: 'hsl(0 0% 60%)', fontSize: 10 }, axisLine: { stroke: 'hsl(0 0% 16%)' }, tickLine: false },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="font-bold" style={{ color: p.color }}>{p.value} {p.unit || ''}</p>
      ))}
    </div>
  );
};

const BODY_FIELDS = [
  { key: 'weight_kg', label: 'Peso', unit: 'kg', emoji: '⚖️' },
  { key: 'body_fat_pct', label: 'Gordura', unit: '%', emoji: '📊' },
  { key: 'arm_circumference', label: 'Bíceps', unit: 'cm', emoji: '💪' },
  { key: 'chest_circumference', label: 'Peito', unit: 'cm', emoji: '🫀' },
  { key: 'waist_circumference', label: 'Cintura', unit: 'cm', emoji: '📏' },
  { key: 'leg_circumference', label: 'Coxa', unit: 'cm', emoji: '🦵' },
];

function StatCard({ emoji, label, value, sub, color = 'text-foreground' }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 text-center">
      <p className="text-xl mb-1">{emoji}</p>
      <p className={`font-display font-black text-lg leading-tight ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function ProgressoPage() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [activeTab, setActiveTab] = useState('treinos');
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: sessionsRaw } = useQuery({
    queryKey: ['my-sessions', user?.email],
    queryFn: () => base44.entities.WorkoutSession.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });
  // Only completed sessions feed the progress model
  const sessions = (sessionsRaw || []).filter(s => s.status === 'completed' || !s.status);

  const { data: prs } = useQuery({
    queryKey: ['my-prs', user?.email],
    queryFn: () => base44.entities.ExercisePersonalRecord.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: measurements } = useQuery({
    queryKey: ['body-measurements', user?.email],
    queryFn: () => base44.entities.BodyMeasurement.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const [expandedSession, setExpandedSession] = useState(null);

  const { data: allSetLogs } = useQuery({
    queryKey: ['all-set-logs', user?.email],
    queryFn: () => base44.entities.SetLog.filter({ student_email: user?.email }),
    enabled: !!user?.email && activeTab === 'historico',
  });

  const myProfile = profile?.[0];
  const levelInfo = calculateLevel(myProfile?.xp_total || 0);

  // Compute weekly sessions
  const weeklyData = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const weekStart = subDays(new Date(), (7 - i) * 7);
      const weekEnd = subDays(new Date(), (6 - i) * 7);
      const label = format(weekStart, 'dd/MM');
      const count = (sessions || []).filter(s => {
        const d = s.finished_at?.slice(0, 10) || s.created_date?.slice(0, 10) || '';
        return d >= format(weekStart, 'yyyy-MM-dd') && d <= format(weekEnd, 'yyyy-MM-dd');
      }).length;
      return { label, treinos: count };
    });
    return weeks;
  }, [sessions]);

  // Volume data
  const volumeData = useMemo(() => {
    return (sessions || [])
      .filter(s => s.total_volume_kg > 0)
      .sort((a, b) => (a.created_date || '').localeCompare(b.created_date || ''))
      .slice(-10)
      .map(s => ({
        label: (s.finished_at || s.created_date || '').slice(5, 10),
        volume: s.total_volume_kg || 0,
      }));
  }, [sessions]);

  // Measurements
  const sortedMeasurements = useMemo(
    () => [...(measurements || [])].sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    [measurements]
  );
  const latestMeasure = sortedMeasurements[sortedMeasurements.length - 1];
  const firstMeasure = sortedMeasurements[0];

  const weightData = useMemo(() => {
    return sortedMeasurements
      .filter(m => m.weight_kg)
      .slice(-12)
      .map(m => ({ label: m.date?.slice(5), peso: m.weight_kg }));
  }, [sortedMeasurements]);

  // Stats
  const totalSessions = sessions?.length || 0;
  const thisWeekSessions = (sessions || []).filter(s => {
    const d = s.finished_at?.slice(0, 10) || '';
    return d >= format(subDays(new Date(), 7), 'yyyy-MM-dd');
  }).length;
  const streak = myProfile?.current_streak || 0;
  const maxStreak = myProfile?.max_streak || 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existing = measurements?.find(m => m.date === selectedDate);
      const numericData = {};
      BODY_FIELDS.forEach(f => {
        const v = parseFloat(formData[f.key]);
        if (!isNaN(v)) numericData[f.key] = v;
      });
      const payload = { ...numericData, notes: formData.notes, student_email: user?.email, date: selectedDate };
      if (existing) return base44.entities.BodyMeasurement.update(existing.id, payload);
      return base44.entities.BodyMeasurement.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-measurements'] });
      setShowMeasureForm(false);
      setFormData({});
    },
  });

  React.useEffect(() => {
    const existing = measurements?.find(m => m.date === selectedDate);
    setFormData(existing || {});
  }, [selectedDate, measurements]);

  const recentPRs = [...(prs || [])].sort((a, b) => (b.achieved_at || '').localeCompare(a.achieved_at || '')).slice(0, 5);

  const TABS = [
    { key: 'treinos', label: 'Treinos' },
    { key: 'prs', label: 'PRs' },
    { key: 'corpo', label: 'Corpo' },
    { key: 'historico', label: 'Histórico' },
  ];

  return (
    <div className="max-w-lg mx-auto pb-10">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="font-display text-xl font-black">PROGRESSO</h1>
        <p className="text-xs text-muted-foreground">Sua evolução real ao longo do tempo</p>
      </div>

      {/* Summary stats */}
      <div className="px-4 grid grid-cols-4 gap-2 mb-4">
        <StatCard emoji="🏋️" label="Treinos" value={totalSessions} color="text-primary" />
        <StatCard emoji="🔥" label="Streak" value={streak} sub={`max ${maxStreak}`} color="text-primary" />
        <StatCard emoji="⚡" label="XP" value={(myProfile?.xp_total || 0).toLocaleString()} color="text-gold" />
        <StatCard emoji="🏆" label="PRs" value={prs?.length || 0} color="text-gold" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 rounded-xl p-1 mx-4 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all
              ${activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4">
        {/* TREINOS TAB */}
        {activeTab === 'treinos' && (
          <>
            {/* Weekly frequency */}
            {totalSessions > 0 ? (
              <>
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-sm font-bold mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Frequência Semanal
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">{thisWeekSessions} treino(s) esta semana</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid {...CHART_STYLE.grid} />
                      <XAxis dataKey="label" {...CHART_STYLE.axis} />
                      <YAxis {...CHART_STYLE.axis} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="treinos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} unit=" treinos" name="Treinos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Volume chart */}
                {volumeData.length > 1 && (
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <p className="text-sm font-bold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" /> Volume Total (kg)
                    </p>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={volumeData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid {...CHART_STYLE.grid} />
                        <XAxis dataKey="label" {...CHART_STYLE.axis} />
                        <YAxis {...CHART_STYLE.axis} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="volume" stroke="hsl(var(--chart-2))" strokeWidth={2.5}
                          dot={{ fill: 'hsl(var(--chart-2))', r: 4 }} unit="kg" name="Volume" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recent sessions */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-primary" /> Treinos Recentes
                  </p>
                  <div className="space-y-2">
                    {[...(sessions || [])].sort((a, b) => (b.created_date || '').localeCompare(a.created_date || '')).slice(0, 8).map(s => (
                      <div key={s.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">{s.routine_name || 'Treino'}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.finished_at?.slice(0, 10) || s.created_date?.slice(0, 10)} ·{' '}
                            {s.duration_minutes ? `${s.duration_minutes}'` : ''}{' '}
                            {s.sets_completed ? `· ${s.sets_completed} séries` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          {s.xp_earned && <p className="text-xs font-bold text-gold">+{s.xp_earned} XP</p>}
                          {s.total_volume_kg > 0 && <p className="text-[10px] text-muted-foreground">{s.total_volume_kg}kg</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <Dumbbell className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="font-bold text-base mb-1">Nenhum treino concluído ainda</p>
                <p className="text-sm text-muted-foreground">Após o primeiro treino, sua evolução aparecerá aqui</p>
              </div>
            )}
          </>
        )}

        {/* PRs TAB */}
        {activeTab === 'prs' && (
          <>
            {recentPRs.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Seus recordes pessoais</p>
                {recentPRs.map((pr, i) => {
                  const label = () => {
                    if (pr.record_type === 'max_weight') return `${pr.weight_kg}kg × ${pr.reps} reps`;
                    if (pr.record_type === 'max_reps') return `${pr.reps} reps`;
                    if (pr.record_type === 'max_duration') return `${pr.duration_seconds}s`;
                    if (pr.record_type === 'band_reduction') return `Elástico ${pr.band_level}`;
                    if (pr.record_type === 'first_without_band') return '🎉 Primeira sem elástico!';
                    return pr.context || '—';
                  };
                  return (
                    <motion.div key={pr.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 bg-card border border-gold/20 rounded-2xl p-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{pr.exercise_name}</p>
                        <p className="text-xs text-gold font-bold">{label()}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground shrink-0">{pr.achieved_at}</p>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <Trophy className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="font-bold text-base mb-1">Nenhum PR registrado ainda</p>
                <p className="text-sm text-muted-foreground">Seus recordes aparecerão aqui conforme você treina</p>
              </div>
            )}
          </>
        )}

        {/* CORPO TAB */}
        {activeTab === 'corpo' && (
          <>
            {/* Measure form toggle */}
            <button onClick={() => setShowMeasureForm(s => !s)}
              className="w-full flex items-center justify-between bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">
                  {measurements?.some(m => m.date === today) ? '✏️ Editar medição de hoje' : '➕ Registrar medição'}
                </span>
              </div>
              {showMeasureForm ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            <AnimatePresence>
              {showMeasureForm && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="bg-card border border-border rounded-2xl p-4 space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Data</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {BODY_FIELDS.map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-muted-foreground block mb-1">{f.emoji} {f.label} ({f.unit})</label>
                        <input type="number" step="0.1" placeholder="—"
                          value={formData[f.key] || ''}
                          onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full bg-secondary border border-border rounded-xl px-2 py-2 text-sm text-center outline-none focus:border-primary/50" />
                      </div>
                    ))}
                  </div>
                  <input placeholder="📝 Observações..."
                    value={formData.notes || ''}
                    onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50" />
                  <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                    className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50">
                    {saveMutation.isPending ? 'Salvando...' : 'Salvar medição'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Latest measures grid */}
            {latestMeasure && (
              <div className="grid grid-cols-3 gap-2">
                {BODY_FIELDS.filter(f => latestMeasure[f.key]).map(f => {
                  const diff = firstMeasure && firstMeasure.id !== latestMeasure.id && firstMeasure[f.key]
                    ? (latestMeasure[f.key] - firstMeasure[f.key]).toFixed(1)
                    : null;
                  return (
                    <div key={f.key} className="bg-card border border-border rounded-2xl p-3 text-center">
                      <p className="text-lg">{f.emoji}</p>
                      <p className="font-display font-black text-gold text-base">
                        {latestMeasure[f.key]}<span className="text-xs font-normal text-muted-foreground ml-0.5">{f.unit}</span>
                      </p>
                      {diff !== null && (
                        <p className={`text-[10px] font-bold ${parseFloat(diff) > 0 ? 'text-success' : 'text-destructive'}`}>
                          {parseFloat(diff) > 0 ? '+' : ''}{diff}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">{f.label}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Weight chart */}
            {weightData.length > 1 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-gold" /> Evolução de peso
                </p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={weightData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid {...CHART_STYLE.grid} />
                    <XAxis dataKey="label" {...CHART_STYLE.axis} />
                    <YAxis {...CHART_STYLE.axis} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="peso" stroke="#D4A853" strokeWidth={2.5}
                      dot={{ fill: '#D4A853', r: 4 }} unit="kg" name="Peso" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {sortedMeasurements.length === 0 && (
              <div className="text-center py-12">
                <Scale className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-sm text-muted-foreground">Nenhuma medição ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Registre seu peso e medidas para acompanhar evolução</p>
              </div>
            )}
          </>
        )}

        {/* HISTÓRICO TAB — SetLog por sessão */}
        {activeTab === 'historico' && (
          <>
            {sessions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Sessões completas</p>
                {[...sessions]
                  .sort((a, b) => (b.finished_at || b.created_date || '').localeCompare(a.finished_at || a.created_date || ''))
                  .slice(0, 20)
                  .map(s => {
                    const isExp = expandedSession === s.id;
                    const sessionSets = (allSetLogs || []).filter(l => l.session_id === s.id)
                      .sort((a, b) => a.set_number - b.set_number);
                    const groupedByExercise = sessionSets.reduce((acc, l) => {
                      if (!acc[l.exercise_name]) acc[l.exercise_name] = [];
                      acc[l.exercise_name].push(l);
                      return acc;
                    }, {});
                    return (
                      <div key={s.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                        <button onClick={() => setExpandedSession(isExp ? null : s.id)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left">
                          <div>
                            <p className="font-bold text-sm">{s.routine_name || 'Treino'}</p>
                            <p className="text-xs text-muted-foreground">
                              {(s.finished_at || s.created_date || '').slice(0, 10)}
                              {s.duration_minutes ? ` · ${s.duration_minutes}'` : ''}
                              {s.sets_completed ? ` · ${s.sets_completed} séries` : ''}
                              {s.total_volume_kg > 0 ? ` · ${s.total_volume_kg}kg` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {s.xp_earned > 0 && <span className="text-xs font-bold text-gold">+{s.xp_earned} XP</span>}
                            {s.prs_count > 0 && <span className="text-xs font-bold text-gold">🏆×{s.prs_count}</span>}
                            {isExp ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExp && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="border-t border-border/40 px-4 pb-3 pt-2 space-y-3">
                                {sessionSets.length === 0 && (
                                  <p className="text-xs text-muted-foreground">Sem séries registradas (sessão anterior)</p>
                                )}
                                {Object.entries(groupedByExercise).map(([exName, sets]) => (
                                  <div key={exName}>
                                    <p className="text-xs font-bold mb-1">{exName}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {sets.map((sl, i) => (
                                        <span key={sl.id}
                                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border
                                            ${sl.is_pr ? 'bg-gold/15 border-gold/30 text-gold' : 'bg-muted/30 border-border/40 text-muted-foreground'}`}>
                                          {sl.is_pr && '🏆 '}
                                          {sl.weight_kg ? `${sl.weight_kg}kg×${sl.reps}` :
                                           sl.reps ? `${sl.reps}r` :
                                           sl.duration_seconds ? `${sl.duration_seconds}s` : '—'}
                                          {sl.band_assistance_level ? ` [${sl.band_assistance_level}]` : ''}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-16">
                <History className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="font-bold text-base mb-1">Nenhuma sessão ainda</p>
                <p className="text-sm text-muted-foreground">Seu histórico completo aparecerá aqui</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}