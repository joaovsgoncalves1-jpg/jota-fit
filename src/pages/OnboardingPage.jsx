import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Flame, Dumbbell, Trophy, Target, Swords, Zap } from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    emoji: '🔥',
    title: 'BEM-VINDO AO\nJOTA FIT',
    subtitle: 'Aqui treinar é uma batalha. Cada sessão causa dano real nos chefes. Cada check-in mantém sua chama viva.',
    cta: 'ENTRAR NA ARENA',
    color: 'from-primary/20 to-transparent',
  },
  {
    id: 'system',
    emoji: null,
    title: 'COMO FUNCIONA',
    subtitle: null,
    features: [
      { icon: '⚡', label: 'Ganhe XP', desc: 'Cada treino concluído te recompensa com experiência.' },
      { icon: '🔥', label: 'Streak diário', desc: 'Faça check-in todo dia e mantenha sua sequência.' },
      { icon: '⚔️', label: 'Derrote Chefes', desc: 'Seus treinos causam dano a chefes. Derrote-os para desbloquear skills.' },
      { icon: '🏆', label: 'Suba no Ranking', desc: 'Compete com outros alunos no placar global.' },
    ],
    cta: 'ENTENDI, QUERO MAIS',
    color: 'from-gold/10 to-transparent',
  },
  {
    id: 'name',
    emoji: '⚔️',
    title: 'QUAL É O\nSEU NOME\nDE GUERRA?',
    subtitle: 'Como você quer ser conhecido no ranking?',
    cta: 'CONFIRMAR IDENTIDADE',
    color: 'from-epic/20 to-transparent',
  },
  {
    id: 'ready',
    emoji: '🚀',
    title: 'VOCÊ ESTÁ\nPRONTO\nPARA LUTAR',
    subtitle: 'Sua jornada começa agora. O primeiro chefe já está te esperando.',
    cta: 'COMEÇAR JORNADA',
    color: 'from-success/20 to-transparent',
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ['my-profile-onboarding', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  // If profile already exists, skip onboarding
  React.useEffect(() => {
    if (existing && existing.length > 0) {
      navigate('/');
    }
  }, [existing]);

  const current = STEPS[step];
  const isNameStep = current.id === 'name';
  const isLastStep = current.id === 'ready';

  const handleNext = async () => {
    if (isNameStep && !name.trim()) return;

    if (isLastStep) {
      setCreating(true);
      await base44.entities.StudentProfile.create({
        email: user?.email,
        name: name || user?.full_name || 'Guerreiro',
        xp_total: 0,
        current_streak: 0,
        max_streak: 0,
        active: true,
      });
      navigate('/');
      return;
    }

    setStep(s => s + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-12 pb-4">
        {STEPS.map((_, i) => (
          <motion.div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/40' : 'w-4 bg-muted'}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="flex-1 flex flex-col px-6 pt-4"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* Glow BG */}
          <div className={`absolute inset-0 bg-gradient-radial ${current.color} pointer-events-none`} />

          {/* Emoji / Icon */}
          {current.emoji && (
            <motion.div
              className="text-7xl text-center mb-8"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            >
              {current.emoji}
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            className="font-display font-black text-4xl text-foreground leading-none mb-4 whitespace-pre-line"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {current.title}
          </motion.h1>

          {/* Subtitle */}
          {current.subtitle && (
            <motion.p
              className="text-muted-foreground text-base leading-relaxed mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {current.subtitle}
            </motion.p>
          )}

          {/* Features list */}
          {current.features && (
            <motion.div
              className="space-y-3 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              {current.features.map((f, i) => (
                <motion.div
                  key={f.label}
                  className="flex items-center gap-4 bg-card/60 border border-border rounded-2xl p-4"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <p className="font-bold text-sm">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Name input */}
          {isNameStep && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={user?.full_name || 'Seu nome de guerra...'}
                className="h-14 text-lg text-center bg-card/60 border-border rounded-2xl font-bold"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleNext()}
              />
            </motion.div>
          )}

          {/* Ready step extras */}
          {isLastStep && (
            <motion.div
              className="grid grid-cols-3 gap-3 mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
            >
              {[
                { val: '0', label: 'XP Inicial', icon: '⚡' },
                { val: 'Nv.1', label: 'Nível', icon: '🔥' },
                { val: '?', label: 'Seu Chefe', icon: '⚔️' },
              ].map(stat => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-3 text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <p className="font-display font-black text-primary text-lg">{stat.val}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          )}

          <div className="flex-1" />

          {/* CTA Button */}
          <motion.div
            className="pb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleNext}
              disabled={isNameStep && !name.trim() || creating}
              className="w-full h-14 text-base font-display font-black tracking-wider rounded-2xl bg-primary hover:bg-primary/90 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                {creating ? 'CRIANDO PERFIL...' : current.cta}
                {!creating && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-gold/20 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}