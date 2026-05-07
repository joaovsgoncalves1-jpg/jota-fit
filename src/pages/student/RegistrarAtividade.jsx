import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACTIVITY_LABELS, ACTIVITY_ICONS } from '@/lib/trainingLoad';

const ACTIVITIES = [
  { type: 'corrida', label: 'Corrida', icon: '🏃' },
  { type: 'caminhada', label: 'Caminhada', icon: '🚶' },
  { type: 'bike', label: 'Bike', icon: '🚴' },
  { type: 'natacao', label: 'Natação', icon: '🏊' },
  { type: 'HIIT', label: 'HIIT', icon: '🔥' },
  { type: 'mobilidade', label: 'Mobilidade', icon: '🤸' },
  { type: 'recuperacao_ativa', label: 'Recuperação', icon: '💆' },
  { type: 'calistenia_tecnica', label: 'Skill técnica', icon: '🤼' },
  { type: 'condicionamento', label: 'Condicionamento', icon: '⚡' },
  { type: 'luta', label: 'Luta/Esporte', icon: '🥊' },
  { type: 'outro', label: 'Outro', icon: '🏋️' },
];

const INTENSITIES = [
  { value: 'leve', label: 'Leve', color: 'border-success/40 bg-success/10 text-success' },
  { value: 'moderado', label: 'Moderado', color: 'border-gold/40 bg-gold/10 text-gold' },
  { value: 'intenso', label: 'Intenso', color: 'border-primary/40 bg-primary/10 text-primary' },
  { value: 'maximo', label: 'Máximo', color: 'border-destructive/40 bg-destructive/10 text-destructive' },
];

const NUM_FIELDS = {
  corrida: ['duration_minutes', 'distance_km'],
  caminhada: ['duration_minutes', 'distance_km'],
  bike: ['duration_minutes', 'distance_km'],
  natacao: ['duration_minutes', 'distance_km'],
  HIIT: ['duration_minutes', 'rounds'],
  mobilidade: ['duration_minutes'],
  alongamento: ['duration_minutes'],
  recuperacao_ativa: ['duration_minutes'],
  calistenia_tecnica: ['duration_minutes'],
  condicionamento: ['duration_minutes'],
  luta: ['duration_minutes'],
  esporte: ['duration_minutes'],
  outro: ['duration_minutes'],
};

const FIELD_LABELS = {
  duration_minutes: { label: 'Duração (min)', placeholder: '45' },
  distance_km: { label: 'Distância (km)', placeholder: '5' },
  rounds: { label: 'Rounds', placeholder: '10' },
};

export default function RegistrarAtividade() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState('select'); // select | form
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({
    intensity: 'moderado',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    skill_practiced: '',
    region_worked: '',
  });
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const numFields = NUM_FIELDS[selectedType] || ['duration_minutes'];
      const payload = {
        student_email: user.email,
        activity_type: selectedType,
        date: form.date,
        intensity: form.intensity,
        notes: form.notes || undefined,
        skill_practiced: form.skill_practiced || undefined,
        region_worked: form.region_worked || undefined,
      };
      numFields.forEach(f => {
        if (form[f]) payload[f] = parseFloat(form[f]);
      });
      // auto calc pace
      if (payload.duration_minutes && payload.distance_km && payload.distance_km > 0) {
        payload.pace_min_per_km = parseFloat((payload.duration_minutes / payload.distance_km).toFixed(2));
        payload.average_speed_kmh = parseFloat((payload.distance_km / (payload.duration_minutes / 60)).toFixed(2));
      }
      return base44.entities.HybridActivity.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hybrid-activities'] });
      setSaved(true);
      setTimeout(() => navigate(-1), 1200);
    },
  });

  const numFields = selectedType ? (NUM_FIELDS[selectedType] || ['duration_minutes']) : [];

  if (saved) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-success" />
          </div>
          <p className="font-display font-black text-xl text-success">Atividade Registrada!</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
        <button onClick={() => step === 'form' ? setStep('select') : navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display font-black text-base">REGISTRAR ATIVIDADE</h1>
          <p className="text-xs text-muted-foreground">
            {step === 'select' ? 'Escolha o tipo' : ACTIVITY_LABELS[selectedType]}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="p-4 grid grid-cols-3 gap-3">
            {ACTIVITIES.map(a => (
              <button key={a.type} onClick={() => { setSelectedType(a.type); setStep('form'); }}
                className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl py-5 px-2 hover:border-primary/30 hover:bg-primary/5 active:scale-95 transition-all">
                <span className="text-3xl">{a.icon}</span>
                <p className="text-xs font-bold text-center leading-tight">{a.label}</p>
              </button>
            ))}
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="p-4 space-y-4">
            {/* Selected activity */}
            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4">
              <span className="text-3xl">{ACTIVITY_ICONS[selectedType]}</span>
              <div>
                <p className="font-bold">{ACTIVITY_LABELS[selectedType]}</p>
                <p className="text-xs text-muted-foreground">Preencha os dados abaixo</p>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Data</label>
              <input type="date" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
            </div>

            {/* Numeric fields */}
            <div className="grid grid-cols-2 gap-3">
              {numFields.map(f => (
                <div key={f}>
                  <label className="text-xs text-muted-foreground block mb-1.5">{FIELD_LABELS[f]?.label || f}</label>
                  <input type="number" step="0.1" placeholder={FIELD_LABELS[f]?.placeholder || '0'}
                    value={form[f] || ''}
                    onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-center outline-none focus:border-primary/50" />
                </div>
              ))}
            </div>

            {/* Pace display */}
            {form.duration_minutes && form.distance_km && parseFloat(form.distance_km) > 0 && (
              ['corrida', 'caminhada', 'bike'].includes(selectedType) && (
                <div className="bg-muted/30 rounded-xl px-4 py-3 flex justify-around text-center">
                  <div>
                    <p className="font-display font-black text-gold text-base">
                      {(parseFloat(form.duration_minutes) / parseFloat(form.distance_km)).toFixed(1)}'
                    </p>
                    <p className="text-[10px] text-muted-foreground">pace/km</p>
                  </div>
                  <div>
                    <p className="font-display font-black text-primary text-base">
                      {(parseFloat(form.distance_km) / (parseFloat(form.duration_minutes) / 60)).toFixed(1)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">km/h</p>
                  </div>
                </div>
              )
            )}

            {/* Skill practiced (for calistenia_tecnica) */}
            {selectedType === 'calistenia_tecnica' && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Skill praticada</label>
                <input type="text" placeholder="Ex: Handstand, Front Lever..."
                  value={form.skill_practiced}
                  onChange={e => setForm(p => ({ ...p, skill_practiced: e.target.value }))}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
              </div>
            )}

            {/* Region for mobilidade */}
            {selectedType === 'mobilidade' && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Região trabalhada</label>
                <input type="text" placeholder="Ex: Ombro, Quadril, Tornozelo..."
                  value={form.region_worked}
                  onChange={e => setForm(p => ({ ...p, region_worked: e.target.value }))}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
              </div>
            )}

            {/* Intensity */}
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Intensidade</label>
              <div className="grid grid-cols-4 gap-2">
                {INTENSITIES.map(i => (
                  <button key={i.value} onClick={() => setForm(p => ({ ...p, intensity: i.value }))}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all
                      ${form.intensity === i.value ? i.color : 'border-border bg-card text-muted-foreground hover:border-border/60'}`}>
                    {i.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Observações (opcional)</label>
              <textarea placeholder="Como foi? Alguma observação..."
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50 resize-none" />
            </div>

            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm">
              {mutation.isPending ? 'Salvando...' : 'Registrar Atividade'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}