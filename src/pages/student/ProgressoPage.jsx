import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Scale, TrendingDown, Dumbbell, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

const FIELDS = [
  { key: 'weight_kg', label: 'Peso', unit: 'kg', emoji: '⚖️' },
  { key: 'body_fat_pct', label: 'Gordura', unit: '%', emoji: '📊' },
  { key: 'arm_circumference', label: 'Bíceps', unit: 'cm', emoji: '💪' },
  { key: 'leg_circumference', label: 'Coxa', unit: 'cm', emoji: '🦵' },
  { key: 'chest_circumference', label: 'Peito', unit: 'cm', emoji: '🫀' },
  { key: 'waist_circumference', label: 'Cintura', unit: 'cm', emoji: '📏' },
];

const CHART_STYLE = {
  CartesianGrid: { stroke: 'hsl(0 0% 16%)', strokeDasharray: '3 3' },
  Axis: { tick: { fill: 'hsl(0 0% 64%)', fontSize: 11 }, axisLine: { stroke: 'hsl(0 0% 16%)' } },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="text-sm font-bold" style={{ color: p.color }}>{p.value} {p.unit || ''}</p>
      ))}
    </div>
  );
};

export default function ProgressoPage() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [selectedDate, setSelectedDate] = useState(today);
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);

  const { data: measurements } = useQuery({
    queryKey: ['body-measurements', user?.email],
    queryFn: () => base44.entities.BodyMeasurement.filter({ student_email: user?.email }),
    enabled: !!user?.email,
    onSuccess: (data) => {
      const existing = data?.find(m => m.date === selectedDate);
      if (existing) setFormData(existing);
    }
  });

  // Sync form when date or data changes
  React.useEffect(() => {
    const existing = measurements?.find(m => m.date === selectedDate);
    setFormData(existing || {});
  }, [selectedDate, measurements]);

  const sorted = useMemo(() => [...(measurements || [])].sort((a, b) => a.date.localeCompare(b.date)), [measurements]);
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  // Last 30 days weight data
  const weightData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
      const m = measurements?.find(m => m.date === d);
      return { date: format(subDays(new Date(), 29 - i), 'dd/MM'), weight: m?.weight_kg || null };
    }).filter(d => d.weight !== null);
    return days;
  }, [measurements]);

  // Body measures comparison
  const comparisonData = useMemo(() => {
    if (!first || !latest || first.id === latest.id) return [];
    return [
      { name: 'Bíceps', first: first.arm_circumference, atual: latest.arm_circumference },
      { name: 'Coxa', first: first.leg_circumference, atual: latest.leg_circumference },
      { name: 'Peito', first: first.chest_circumference, atual: latest.chest_circumference },
      { name: 'Cintura', first: first.waist_circumference, atual: latest.waist_circumference },
    ].filter(d => d.first || d.atual);
  }, [first, latest]);

  // Achievements
  const achievements = useMemo(() => {
    const list = [];
    if (first && latest && first.id !== latest.id) {
      const wDiff = (first.weight_kg || 0) - (latest.weight_kg || 0);
      if (wDiff > 0) list.push({ emoji: '📉', text: `Perdeu ${wDiff.toFixed(1)} kg` });
      const aDiff = (latest.arm_circumference || 0) - (first.arm_circumference || 0);
      if (aDiff > 0) list.push({ emoji: '💪', text: `Ganhou ${aDiff.toFixed(1)} cm no braço` });
    }
    // Check 7 consecutive days
    if (sorted.length >= 7) {
      let consecutive = 1;
      for (let i = sorted.length - 1; i > 0; i--) {
        const diff = differenceInDays(parseISO(sorted[i].date), parseISO(sorted[i - 1].date));
        if (diff === 1) consecutive++;
        else break;
      }
      if (consecutive >= 7) list.push({ emoji: '🎯', text: 'Registrou 7 medições seguidas' });
    }
    return list;
  }, [first, latest, sorted]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const existing = measurements?.find(m => m.date === selectedDate);
      const payload = { ...data, student_email: user?.email, date: selectedDate };
      if (existing) return base44.entities.BodyMeasurement.update(existing.id, payload);
      return base44.entities.BodyMeasurement.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['body-measurements']);
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

  const isEditing = measurements?.some(m => m.date === selectedDate);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5 pb-8">
      <div className="flex items-center gap-2">
        <Scale className="w-5 h-5 text-primary" />
        <h1 className="font-display text-lg font-black">PROGRESSO CORPORAL</h1>
      </div>

      {/* Form toggle */}
      <button
        onClick={() => setShowForm(s => !s)}
        className="w-full flex items-center justify-between bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{isEditing ? '✏️ Editar medição' : '➕ Registrar medição'}</span>
          <span className="text-xs text-muted-foreground">{selectedDate === today ? 'hoje' : selectedDate}</span>
        </div>
        {showForm ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-4 space-y-4"
        >
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Data</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-secondary border-border rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.emoji} {f.label} ({f.unit})</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="—"
                  value={formData[f.key] || ''}
                  onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                  className="bg-secondary border-border rounded-xl text-center"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">📝 Notas</label>
            <Input
              placeholder="Observações..."
              value={formData.notes || ''}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              className="bg-secondary border-border rounded-xl"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full h-12 rounded-2xl font-bold bg-primary hover:bg-primary/90"
          >
            {saveMutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar medição' : 'Salvar medição'}
          </Button>
        </motion.div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Conquistas</p>
          {achievements.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 bg-gold/10 border border-gold/20 rounded-2xl p-3"
            >
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-sm font-bold text-gold">{a.text}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Weight chart */}
      {weightData.length > 1 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-bold mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-gold" /> Peso — últimos 30 dias
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid {...CHART_STYLE.CartesianGrid} />
              <XAxis dataKey="date" {...CHART_STYLE.Axis} />
              <YAxis {...CHART_STYLE.Axis} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#D4A853"
                strokeWidth={2.5}
                dot={{ fill: '#D4A853', r: 4 }}
                activeDot={{ r: 6 }}
                unit="kg"
                name="Peso"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Measures comparison */}
      {comparisonData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-bold mb-4 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary" /> Medidas — Primeira vs Atual
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid {...CHART_STYLE.CartesianGrid} />
              <XAxis dataKey="name" {...CHART_STYLE.Axis} />
              <YAxis {...CHART_STYLE.Axis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(0 0% 64%)' }} />
              <Bar dataKey="first" name="Primeira" fill="hsl(0 0% 40%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="atual" name="Atual" fill="#D4A853" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Latest stats grid */}
      {latest && (
        <div className="grid grid-cols-3 gap-2">
          {FIELDS.filter(f => latest[f.key]).map(f => (
            <div key={f.key} className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className="text-lg">{f.emoji}</p>
              <p className="font-display font-black text-gold text-base">{latest[f.key]}<span className="text-xs font-normal text-muted-foreground ml-0.5">{f.unit}</span></p>
              <p className="text-[10px] text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Scale className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Nenhuma medição registrada ainda</p>
          <p className="text-xs mt-1">Adicione sua primeira medição acima</p>
        </div>
      )}
    </div>
  );
}