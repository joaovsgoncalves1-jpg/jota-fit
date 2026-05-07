import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Swords, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HPBar from '@/components/game/HPBar';
import confetti from 'canvas-confetti';

const MOTIVATIONAL = [
  'Cada rep conta. Você está evoluindo! 🔥',
  'Consistência é superpoder. Continue! 💪',
  'Dano causado. O chefe está tremendo! ⚔️',
  'Progresso real. Sem atalhos. Bora! 🚀',
  'Mais um treino. Mais um passo. 🎯',
];

export default function WorkoutRewardModal({ show, xp, damage, boss, bossAfterHP, onClose }) {
  useEffect(() => {
    if (show) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#F97316', '#EAB308', '#22C55E'] });
    }
  }, [show]);

  const quote = MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl w-full max-w-sm p-6 space-y-5"
          >
            {/* Close */}
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground">
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
                className="text-6xl mb-3"
              >🏆</motion.div>
              <h2 className="font-display text-2xl font-black text-foreground">TREINO CONCLUÍDO!</h2>
            </div>

            {/* XP */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-3 bg-gold/10 border border-gold/30 rounded-2xl p-4"
            >
              <Zap className="w-8 h-8 text-gold" />
              <div className="text-center">
                <p className="font-display font-black text-3xl text-gold">+{xp} XP</p>
                <p className="text-xs text-muted-foreground">Experiência ganha</p>
              </div>
            </motion.div>

            {/* Damage to boss */}
            {damage > 0 && boss && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Swords className="w-5 h-5 text-destructive" />
                    <span className="font-bold text-sm">{boss.name}</span>
                  </div>
                  <span className="text-destructive font-black font-display text-sm">-{damage} HP</span>
                </div>
                {bossAfterHP !== undefined && (
                  <HPBar current={Math.max(0, bossAfterHP)} total={boss.hp_total} size="sm" />
                )}
              </motion.div>
            )}

            {/* Quote */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-sm text-center text-muted-foreground italic"
            >
              "{quote}"
            </motion.p>

            <Button onClick={onClose} className="w-full h-12 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-base">
              Continuar 💪
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}