import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * Generic reward/celebration modal
 * Props:
 *  open: bool
 *  onClose: fn
 *  type: 'level_up' | 'skill_unlock' | 'boss_defeat' | 'achievement' | 'streak'
 *  data: { title, subtitle, xp, emoji, rarity? }
 */
export default function RewardModal({ open, onClose, type = 'achievement', data = {} }) {
  useEffect(() => {
    if (!open) return;
    const duration = type === 'level_up' ? 3000 : 1800;
    const colors =
      type === 'level_up' ? ['#f97316', '#fbbf24', '#ffffff'] :
      type === 'boss_defeat' ? ['#ef4444', '#f97316', '#fbbf24'] :
      type === 'skill_unlock' ? ['#22c55e', '#16a34a', '#fbbf24'] :
      ['#a855f7', '#f97316', '#fbbf24'];

    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [open, type]);

  const configs = {
    level_up: {
      bg: 'from-gold/20 via-primary/10 to-background',
      ring: 'ring-gold',
      badge: 'bg-gold/20 text-gold',
      label: '⬆️ LEVEL UP!',
    },
    skill_unlock: {
      bg: 'from-success/20 via-success/5 to-background',
      ring: 'ring-success',
      badge: 'bg-success/20 text-success',
      label: '🌳 SKILL DESBLOQUEADA',
    },
    boss_defeat: {
      bg: 'from-destructive/20 via-primary/10 to-background',
      ring: 'ring-destructive',
      badge: 'bg-destructive/20 text-destructive',
      label: '⚔️ CHEFE DERROTADO!',
    },
    achievement: {
      bg: 'from-epic/20 via-epic/5 to-background',
      ring: 'ring-epic',
      badge: 'bg-epic/20 text-epic',
      label: '🏆 CONQUISTA DESBLOQUEADA',
    },
    streak: {
      bg: 'from-primary/20 via-primary/5 to-background',
      ring: 'ring-primary',
      badge: 'bg-primary/20 text-primary',
      label: '🔥 STREAK MANTIDA!',
    },
  };
  const cfg = configs[type] || configs.achievement;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Card */}
          <motion.div
            className={`relative w-full max-w-sm rounded-3xl border border-border bg-gradient-to-b ${cfg.bg} p-6 overflow-hidden`}
            initial={{ y: 100, scale: 0.85, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 80, scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: 2, ease: 'easeInOut' }}
            />

            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

            {/* Badge label */}
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${cfg.badge}`}>
              {cfg.label}
            </span>

            {/* Emoji */}
            {data.emoji && (
              <motion.div
                className="text-6xl text-center mb-3"
                animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                {data.emoji}
              </motion.div>
            )}

            {/* Title */}
            <motion.h2
              className="font-display font-black text-2xl text-foreground text-center leading-tight mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {data.title || 'Recompensa!'}
            </motion.h2>

            {data.subtitle && (
              <p className="text-muted-foreground text-sm text-center mb-4">{data.subtitle}</p>
            )}

            {/* XP reward */}
            {data.xp && (
              <motion.div
                className="flex justify-center mb-5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center gap-2 bg-gold/15 border border-gold/30 rounded-2xl px-6 py-3">
                  <span className="text-2xl">⚡</span>
                  <span className="font-display font-black text-gold text-2xl">+{data.xp} XP</span>
                </div>
              </motion.div>
            )}

            <Button
              onClick={onClose}
              className="w-full h-12 rounded-2xl font-display font-bold bg-primary hover:bg-primary/90"
            >
              INCRÍVEL! 🔥
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}