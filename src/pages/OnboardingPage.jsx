import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Check, Dumbbell, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const TOTAL_STEPS = 5;

const LEVELS = [
  { id: 'beginner', emoji: '🟢', label: 'Iniciante', desc: 'Estou começando na calistenia' },
  { id: 'intermediate', emoji: '🟡', label: 'Intermediário', desc: 'Já faço flexões e barras' },
  { id: 'advanced', emoji: '🔴', label: 'Avançado', desc: 'Skills avançadas como muscle-up' },
];

const GOALS = [
  { id: 'strength', emoji: '💪', label: 'Ganhar força e massa' },
  { id: 'fat_loss', emoji: '🔥', label: 'Perder gordura' },
  { id: 'skills', emoji: '🤸', label: 'Aprender skills' },
  { id: 'health', emoji: '❤️', label: 'Saúde e disposição' },
];

const DAYS = [
  { id: 'mon', label: 'Seg' }, { id: 'tue', label: 'Ter' }, { id: 'wed', label: 'Qua' },
  { id: 'thu', label: 'Qui' }, { id: 'fri', label: 'Sex' }, { id: 'sat', label: 'Sáb' }, { id: 'sun', label: 'Dom' },
];

const TIMES = [
  { id: 'morning', label: '🌅 Manhã' },
  { id: 'afternoon', label: '☀️ Tarde' },
  { id: 'evening', label: '🌙 Noite' },
];

function StepDot({ index, current }) {
  const state = index < current ? 'done' : index === current ? 'active' : 'idle';
  return (
    <motion.div
      className={`flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300
        ${state === 'done' ? 'w-7 h-7 bg-success text-success-foreground' :
          state === 'active' ? 'w-7 h-7 bg-primary text-primary-foreground ring-4 ring-primary/30' :
          'w-6 h-6 bg-muted text-muted-foreground'}`}
    >
      {state === 'done' ? <Check className="w-3.5 h-3.5" /> : index + 1}
    </motion.div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [goals, setGoals] = useState([]);
  const [trainingDays, setTrainingDays] = useState([]);
  const [preferredTime, setPreferredTime] = useState('');
  const [name, setName] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [selectedWorkouts, setSelectedWorkouts] = useState([]);
  const [saving, setSaving] = useState(false);

  const { data: workouts } = useQuery({
    queryKey: ['all-workouts'],
    queryFn: () => base44.entities.Workout.list(),
  });

  const { data: existingProfile } = useQuery({
    queryKey: ['my-profile-onboarding', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (existingProfile && existingProfile.length > 0 && existingProfile[0].onboarding_completed) {
      navigate('/');
    }
    if (user?.full_name) setName(user.full_name);
  }, [existingProfile, user]);

  // Suggest workouts based on level
  const suggestedWorkouts = (workouts || []).slice(0, 4);

  const toggleGoal = (id) => {
    setGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const toggleDay = (id) => {
    setTrainingDays(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const toggleWorkout = (id) => {
    setSelectedWorkouts(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  };

  const canProceed = () => {
    if (step === 0) return !!fitnessLevel;
    if (step === 1) return goals.length > 0;
    if (step === 2) return trainingDays.length > 0 && !!preferredTime;
    if (step === 3) return !!name.trim();
    if (step === 4) return selectedWorkouts.length > 0;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];

    const existing = existingProfile?.[0];
    const profileData = {
      email: user?.email,
      name: name.trim(),
      fitness_level: fitnessLevel,
      goals,
      training_days: trainingDays,
      preferred_time: preferredTime,
      weight_kg: parseFloat(weightKg) || undefined,
      target_weight_kg: parseFloat(targetWeight) || undefined,
      xp_total: existing?.xp_total || 0,
      current_streak: existing?.current_streak || 0,
      max_streak: existing?.max_streak || 0,
      active: true,
      onboarding_completed: true,
    };

    if (existing) {
      await base44.entities.StudentProfile.update(existing.id, profileData);
    } else {
      await base44.entities.StudentProfile.create(profileData);
    }

    // Create workout assignments
    for (const wid of selectedWorkouts) {
      await base44.entities.WorkoutAssignment.create({
        workout_id: wid,
        student_email: user?.email,
        recurring: trainingDays.length > 0,
        recurring_days: trainingDays,
        scheduled_date: trainingDays.includes(dayOfWeek) ? undefined : today,
      });
    }

    queryClient.invalidateQueries();
    toast({ title: 'Bem-vindo à sua jornada RPG! 💪', description: 'Sua aventura começa agora!' });
    navigate('/');
  };

  const stepVariants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };
  const [dir, setDir] = useState(1);

  const goNext = () => { setDir(1); setStep(s => s + 1); };
  const goBack = () => { setDir(-1); setStep(s => s - 1); };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header progress */}
      <div className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <React.Fragment key={i}>
              <StepDot index={i} current={step} />
              {i < TOTAL_STEPS - 1 && (
                <div className={`h-0.5 flex-1 max-w-[32px] rounded transition-all duration-500 ${i < step ? 'bg-success' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">Passo {step + 1} de {TOTAL_STEPS}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden px-5">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full"
          >

            {/* STEP 0 — Level */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h1 className="font-display font-black text-3xl text-foreground leading-tight">Qual seu nível?</h1>
                  <p className="text-muted-foreground text-sm mt-1">Isso ajuda a personalizar seus treinos</p>
                </div>
                <div className="space-y-3">
                  {LEVELS.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setFitnessLevel(l.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all
                        ${fitnessLevel === l.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground/30'}`}
                    >
                      <span className="text-3xl">{l.emoji}</span>
                      <div>
                        <p className="font-bold text-foreground">{l.label}</p>
                        <p className="text-xs text-muted-foreground">{l.desc}</p>
                      </div>
                      {fitnessLevel === l.id && <Check className="w-5 h-5 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1 — Goals */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h1 className="font-display font-black text-3xl text-foreground leading-tight">Qual seu objetivo?</h1>
                  <p className="text-muted-foreground text-sm mt-1">Escolha até 3 objetivos</p>
                </div>
                <div className="space-y-3">
                  {GOALS.map(g => {
                    const sel = goals.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all
                          ${sel ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground/30'}
                          ${!sel && goals.length >= 3 ? 'opacity-40' : ''}`}
                      >
                        <span className="text-2xl">{g.emoji}</span>
                        <span className="font-bold text-foreground">{g.label}</span>
                        {sel && <Check className="w-5 h-5 text-primary ml-auto" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center">{goals.length}/3 selecionados</p>
              </div>
            )}

            {/* STEP 2 — Schedule */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h1 className="font-display font-black text-3xl text-foreground leading-tight">Quando você treina?</h1>
                  <p className="text-muted-foreground text-sm mt-1">Selecione seus dias e horário</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Dias da semana</p>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map(d => (
                      <button
                        key={d.id}
                        onClick={() => toggleDay(d.id)}
                        className={`w-12 h-12 rounded-2xl text-sm font-bold border-2 transition-all
                          ${trainingDays.includes(d.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/30'}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Horário preferido</p>
                  <div className="flex gap-2">
                    {TIMES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setPreferredTime(t.id)}
                        className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all
                          ${preferredTime === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground hover:border-primary/30'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — About */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h1 className="font-display font-black text-3xl text-foreground leading-tight">Sobre você</h1>
                  <p className="text-muted-foreground text-sm mt-1">Informações básicas do seu perfil</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">⚔️ Nome de guerra</label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Seu nome no ranking..."
                      className="h-12 bg-card border-border rounded-2xl text-base"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">⚖️ Peso atual (kg)</label>
                      <Input
                        type="number"
                        value={weightKg}
                        onChange={e => setWeightKg(e.target.value)}
                        placeholder="70"
                        className="h-12 bg-card border-border rounded-2xl text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">🎯 Peso alvo (kg)</label>
                      <Input
                        type="number"
                        value={targetWeight}
                        onChange={e => setTargetWeight(e.target.value)}
                        placeholder="65"
                        className="h-12 bg-card border-border rounded-2xl text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 — First workout */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h1 className="font-display font-black text-3xl text-foreground leading-tight">Seu primeiro treino!</h1>
                  <p className="text-muted-foreground text-sm mt-1">Escolha os treinos para começar</p>
                </div>
                <div className="space-y-3">
                  {suggestedWorkouts.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-8">Nenhum treino cadastrado ainda</p>
                  )}
                  {suggestedWorkouts.map(w => {
                    const sel = selectedWorkouts.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        onClick={() => toggleWorkout(w.id)}
                        className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all
                          ${sel ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground/30'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sel ? 'bg-primary' : 'bg-muted'}`}>
                          <Dumbbell className={`w-5 h-5 ${sel ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground">{w.name}</p>
                          {w.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{w.description}</p>}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-bold text-gold flex items-center gap-0.5">
                              <Zap className="w-3 h-3" />+{w.xp_reward || 100} XP
                            </span>
                            {w.exercises?.length > 0 && (
                              <span className="text-xs text-muted-foreground">{w.exercises.length} exercícios</span>
                            )}
                          </div>
                        </div>
                        {sel && <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-5 pb-10 pt-4 flex gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={goBack}
            className="h-14 px-5 rounded-2xl border-border font-bold"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <Button
          onClick={step < TOTAL_STEPS - 1 ? goNext : handleFinish}
          disabled={!canProceed() || saving}
          className="flex-1 h-14 rounded-2xl font-display font-black text-base bg-primary hover:bg-primary/90 disabled:opacity-40 tracking-wide"
        >
          {saving ? 'Salvando...' :
            step < TOTAL_STEPS - 1 ? (
              <span className="flex items-center gap-2">Próximo <ChevronRight className="w-5 h-5" /></span>
            ) : (
              '🚀 COMEÇAR MINHA JORNADA!'
            )
          }
        </Button>
      </div>
    </div>
  );
}