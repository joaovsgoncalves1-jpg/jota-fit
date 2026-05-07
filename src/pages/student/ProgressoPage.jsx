import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { format, subDays } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, TrendingUp, Trophy, Flame, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateLevel } from '@/lib/gamification';

const FIELDS = [
  { key: 'weight_kg', label: 'Peso', unit: 'kg', emoji: '⚖️' },
  { key: 'body_fat_pct', label: 'Gordura', unit: '%', emoji: '📊' },
  { key: 'arm_circumference', label: 'Bíceps', unit: 'cm', emoji: '💪' },
  { key: 'chest_circumference', label: 'Peito', unit: 'cm', emoji: '🫀' },
  { key: 'waist_circumference', label: 'Cintura', unit: 'cm', emoji: '📏' },
  { key: 'leg_circumference', label: 'Coxa', unit: 'cm', emoji: '🦵' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="text-sm font-bold" style={{ color: p.color }}>{p.value}</p>
      ))}
    </div>
  );
};

const PR_TYPE_LABEL = {
  max_weight: '⚖️ Maior carga',
  max_reps: '💪 Maior reps',
  max_volume: '📈 Maior volume',
  max_duration: '⏱ Maior tempo',
  first_rep: '🎉 Primeira vez',
  band_reduction: '🪢 Elástico mais leve',
  first_without_band: '🔓 Sem elástico',
};

export default function ProgressoPage() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('resumo');

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: sessions } = useQuery({
    queryKey: ['my-sessions', user?.email],
    queryFn: () => base44.entities.WorkoutSession.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: prs } = useQuery({
    queryKey: ['my-prs', user?.email],
    queryFn: () => base44.entities.ExercisePersonalRecord.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: measurements, refetch: refetchMeasurements } = useQuery({
    queryKey: ['body-measurements', user?.email],
    queryFn: () => base44.entities.BodyMeasurement.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  React.useEffect(() => {
    const existing = measurements?.find(m => m.date === selectedDate);
    setFormData(existing || {});
  }, [selectedDate, measurements]);

  const myProfile = profile?.[0];
  const levelInfo = calculateLevel(myProfile?.xp_total || 0);

  const sortedSessions = useMemo(() =>
    [...(sessions || [])].sort((a, b) => (b.started_at || '').localeCompare(a.started_at || '')),
    [sessions]
  );

  const sortedPRs = useMemo(() =>
    [...(prs || [])].sort((a, b) => (b.achieved_at || '').localeCompare(a.achieved_at || '')),
    [prs]
  );

  // Weekly volume data
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const label = format(subDays(new Date(), 6 - i), 'dd/MM');
      const daySessions = (sessions || []).filter(s => s.started_at?.slice(0, 10) === d);
      const volume = daySessions.reduce((acc, s) => acc + (s.total_volume_kg || 0), 0);
      const trained = daySessions.length > 0;
      return { label, volume: Math.round(volume), trained };
    });
  }, [sessions]);

  const sorted = useMemo(() => [...(measurements || [])].sort((a, b) => a.date?.localeCompare(b.date || '')), [measurements]);
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  const weightData = useMemo(() => {
    return sorted.filter(m => m.weight_kg).slice(-30).map(m => ({
      date: m.date?.slice(5) || '',
      peso: m.weight_kg,
    }));
  }, [sorted]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const existing = measurements?.find(m => m.date === selectedDate);
      const payload = { ...data, student_email: user?.email, date: selectedDate };
      if (existing) return base44.entities.BodyMeasurement.update(existing.id, payload);
      return base44.entities.BodyMeasurement.create(payload);
    },
    onSuccess: () => {
      refetchMeasurements();
      setShowForm(false);
    },
  });

  const handleSave = () => {
    const numericData = {};
    FIELDS.forEach(f => {
      const v = parseFloat(formData[f.key]);
      if (!isNaN(v)) numericData[f.key] = v;
    });
    saveMutation.mutate({ ...numericData, notes: formData.notes });
  };

  const totalSessions = sessions?.length || 0;
  const totalSets = sortedSessions.reduce((acc, s) => acc + (s.sets_completed || 0), 0);
  const totalVolume = sortedSessions.reduce((acc, s) => acc + (s.total_volume_kg || 0), 0);

  const TABS = [
    { key: 'resumo', label: '📊 Resumo' },
    { key: 'prs', label: '🏆 PRs' },
    { key: 'historico', label: '📋 Histórico' },
    { key: 'corpo', label: '⚖️ Corpo' },
  ];

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="px-4 pt-4 pb-3">
        <h1 className="font-display text-xl font-black mb-3">PROGRESSO</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/20 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-all
                ${activeTab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* RESUMO */}
      {activeTab === 'resumo' && (
        <div className="px-4 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">Treinos</p>
              <p className="font-display font-black text-2xl text-primary">{totalSessions}</p>
              <p className="text-xs text-muted-foreground">concluídos</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">Streak</p>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-primary" />
                <p className="font-display font-black text-2xl text-primary">{myProfile?.current_streak || 0}</p>
              </div>
              <p className="text-xs text-muted-foreground">dias seguidos</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">Volume total</p>
              <p className="font-display font-black text-2xl text-gold">{Math.round(totalVolume).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">kg levantados</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">Nível</p>
              <p className="font-display font-black text-2xl text-foreground">{levelInfo.level}</p>
              <p className="text-xs text-muted-foreground">{levelInfo.title}</p>
            </div>
          </div>

          {/* Weekly volume */}
          {weeklyData.some(d => d.volume > 0) && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-sm font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Volume — últimos 7 dias
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(0 0% 16%)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(0 0% 64%)', fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(0 0% 64%)', fontSize: 10 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="volume" name="Volume (kg)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent PRs preview */}
          {sortedPRs.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-sm font-bold mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gold" /> PRs Recentes
              </p>
              <div className="space-y-2">
                {sortedPRs.slice(0, 3).map((pr, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">{pr.exercise_name}</p>
                      <p className="text-[10px] text-muted-foreground">{PR_TYPE_LABEL[pr.record_type]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gold">
                        {pr.weight_kg ? `${pr.weight_kg}kg × ${pr.reps}` :
                         pr.reps ? `${pr.reps} reps` :
                         pr.duration_seconds ? `${pr.duration_seconds}s` : pr.context || '—'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{pr.achieved_at}</p>
                    </div>
                  </div>
                ))}
              </div>
              {sortedPRs.length > 3 && (
                <button onClick={() => setActiveTab('prs')} className="text-xs text-primary font-bold mt-2">
                  Ver todos →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* PRs */}
      {activeTab === 'prs' && (
        <div className="px-4 space-y-3">
          {sortedPRs.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-sm font-bold text-muted-foreground">Seus PRs aparecerão aqui</p>
              <p className="text-xs text-muted-foreground mt-1">Registre seus treinos para acompanhar evolução</p>
            </div>
          ) : sortedPRs.map((pr, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-card border border-gold/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{pr.exercise_name}</p>
                <p className="text-[10px] text-gold font-bold">{PR_TYPE_LABEL[pr.record_type] || pr.record_type}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-gold">
                  {pr.weight_kg ? `${pr.weight_kg}kg` : pr.reps ? `${pr.reps} reps` :
                   pr.duration_seconds ? `${pr.duration_seconds}s` : '✓'}
                </p>
                {pr.weight_kg && pr.reps && <p className="text-[10px] text-muted-foreground">× {pr.reps} reps</p>}
                <p className="text-[10px] text-muted-foreground">{pr.achieved_at}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* HISTÓRICO */}
      {activeTab === 'historico' && (
        <div className="px-4 space-y-3">
          {sortedSessions.length === 0 ? (
            <div className="text-center py-16">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-sm font-bold text-muted-foreground">Nenhum treino registrado</p>
              <p className="text-xs text-muted-foreground mt-1">Conclua seu primeiro treino para ver o histórico</p>
            </div>
          ) : sortedSessions.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.2) }}
              className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm">{s.routine_name || 'Treino'}</p>
                  <p className="text-xs text-muted-foreground">{s.started_at?.slice(0, 10) || '—'}</p>
                </div>
                <span className="text-xs font-bold text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-lg">+{s.xp_earned || 0} XP</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="font-display font-black text-base text-foreground">{s.duration_minutes || '—'}'</p>
                  <p className="text-[10px] text-muted-foreground">Duração</p>
                </div>
                <div className="text-center">
                  <p className="font-display font-black text-base text-foreground">{s.sets_completed || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">Séries</p>
                </div>
                <div className="text-center">
                  <p className="font-display font-black text-base text-primary">{s.total_volume_kg || '—'}kg</p>
                  <p className="text-[10px] text-muted-foreground">Volume</p>
                </div>
              </div>
              {s.prs_count > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-gold font-bold">
                  <Trophy className="w-3 h-3" /> {s.prs_count} PR{s.prs_count > 1 ? 's' : ''} nesse treino!
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* CORPO */}
      {activeTab === 'corpo' && (
        <div className="px-4 space-y-4">
          {/* Form toggle */}
          <button onClick={() => setShowForm(s => !s)}
            className="w-full flex items-center justify-between bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">{measurements?.some(m => m.date === today) ? '✏️ Editar medição' : '➕ Registrar medição'}</span>
            </div>
            {showForm ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                  <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                    className="bg-secondary border-border rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {FIELDS.map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-muted-foreground mb-1 block">{f.emoji} {f.label} ({f.unit})</label>
                      <Input type="number" step="0.1" placeholder="—"
                        value={formData[f.key] || ''}
                        onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                        className="bg-secondary border-border rounded-xl text-center" />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSave} disabled={saveMutation.isPending}
                  className="w-full h-12 rounded-2xl font-bold">
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Weight chart */}
          {weightData.length > 1 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-sm font-bold mb-3">⚖️ Evolução do Peso</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weightData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(0 0% 16%)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(0 0% 64%)', fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(0 0% 64%)', fontSize: 10 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="peso" stroke="#D4A853" strokeWidth={2.5}
                    dot={{ fill: '#D4A853', r: 3 }} activeDot={{ r: 5 }} unit="kg" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Latest stats */}
          {latest && (
            <div className="grid grid-cols-3 gap-2">
              {FIELDS.filter(f => latest[f.key]).map(f => (
                <div key={f.key} className="bg-card border border-border rounded-2xl p-3 text-center">
                  <p className="text-lg">{f.emoji}</p>
                  <p className="font-display font-black text-gold text-base">
                    {latest[f.key]}<span className="text-xs font-normal text-muted-foreground ml-0.5">{f.unit}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">{f.label}</p>
                  {first && first.id !== latest.id && first[f.key] && (
                    <p className={`text-[10px] font-bold mt-0.5 ${latest[f.key] > first[f.key] ? 'text-success' : 'text-destructive'}`}>
                      {latest[f.key] > first[f.key] ? '+' : ''}{(latest[f.key] - first[f.key]).toFixed(1)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {sorted.length === 0 && (
            <div className="text-center py-12">
              <Scale className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">Registre sua primeira medição</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}