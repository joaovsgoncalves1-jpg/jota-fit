/**
 * WorkoutSummaryModal — resumo motivacional ao concluir o treino.
 * Mostra: duração, séries, volume, PRs, XP, streak, mensagem.
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Dumbbell, TrendingUp, Trophy, Zap, Flame, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import PRCard from './PRCard';

const MOTIVATIONAL_MESSAGES = [
  'Mais um passo na sua evolução. 💪',
  'Você está ficando mais forte a cada treino. 🔥',
  'Disciplina batendo motivação. Continua assim!',
  'Treino dado, progresso garantido. 🚀',
  'Pequenas melhoras viram grandes conquistas.',
  'Hoje você foi melhor que ontem. ⚡',
  'Cada série conta. Cada rep importa.',
  'O Jota tá orgulhoso desse trampo. ⭐',
];

const PR_MESSAGES = [
  'Você quebrou seus limites hoje! 🏆',
  'NOVOS RECORDES! Sua evolução tá em outro nível. 🔥',
  'PR é prova viva: o trabalho funciona. 💪',
];

function StatTile({ icon: Icon, label, value, sub, color = 'text-foreground', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-muted/20 border border-border/40 rounded-2xl p-3 text-center"
    >
      <Icon className={`w-4 h-4 mx-auto mb-1.5 ${color}`} />
      <p className={`font-display font-black text-lg leading-none ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

export default function WorkoutSummaryModal({ open, summary, onClose }) {
  useEffect(() => {
    if (!open || !summary) return;
    // Confetti — bigger if there are PRs
    const intensity = summary.prsCount > 0 ? 1.5 : 1;
    const end = Date.now() + (1500 * intensity);
    const colors = summary.prsCount > 0
      ? ['#fbbf24', '#f97316', '#22c55e', '#7c3aed']
      : ['#f97316', '#fbbf24'];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [open, summary]);

  if (!summary) return null;

  const message = summary.prsCount > 0
    ? PR_MESSAGES[Math.floor(Math.random() * PR_MESSAGES.length)]
    : MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

  const durationStr = summary.durationMinutes >= 60
    ? `${Math.floor(summary.durationMinutes / 60)}h${String(summary.durationMinutes % 60).padStart(2, '0')}`
    : `${summary.durationMinutes}min`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[92vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-card z-10">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            <div className="px-5 pb-8">
              {/* Trophy/header */}
              <div className="text-center pt-2 pb-4">
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                  className="text-6xl mb-3"
                >
                  {summary.prsCount > 0 ? '🏆' : '💪'}
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="font-display font-black text-2xl text-primary tracking-wide"
                >
                  TREINO FINALIZADO
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="text-sm text-muted-foreground mt-1"
                >
                  {summary.routineName}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                  className="text-base font-bold mt-3 px-4"
                >
                  {message}
                </motion.p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <StatTile icon={Clock} label="Duração" value={durationStr} color="text-foreground" delay={0.5} />
                <StatTile icon={Dumbbell} label="Séries" value={summary.setsCompleted} sub={`de ${summary.exercisesCompleted} ex.`} color="text-foreground" delay={0.55} />
                {summary.totalVolume > 0 && (
                  <StatTile icon={TrendingUp} label="Volume" value={`${summary.totalVolume}kg`} color="text-blue-400" delay={0.6} />
                )}
                <StatTile icon={Zap} label="XP ganho" value={`+${summary.xpEarned}`} color="text-gold" delay={0.65} />
                {summary.prsCount > 0 && (
                  <StatTile icon={Trophy} label="PRs batidos" value={summary.prsCount} color="text-gold" delay={0.7} />
                )}
                {summary.streak > 0 && (
                  <StatTile icon={Flame} label="Streak" value={`${summary.streak}`} sub="dias" color="text-primary" delay={0.75} />
                )}
              </div>

              {/* PR cards */}
              {summary.prs?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-black uppercase tracking-wider text-gold mb-2 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> Recordes desbloqueados
                  </p>
                  <div className="space-y-2">
                    {summary.prs.map((pr, i) => (
                      <PRCard key={pr.id || i} pr={pr} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl text-sm hover:bg-primary/90 transition-all active:scale-[0.97] shadow-[0_0_24px_rgba(249,115,22,0.3)]"
              >
                CONTINUAR
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}