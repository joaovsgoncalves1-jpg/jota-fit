import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function VictoryAnimation({ show, bossName, skillName, xpBonus, onClose }) {
  useEffect(() => {
    if (show) {
      // Fire confetti
      const end = Date.now() + 2000;
      const colors = ['#f97316', '#fbbf24', '#22c55e', '#7c3aed'];
      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="text-center px-8 py-12 max-w-sm mx-4"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              className="text-7xl mb-6"
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              ⚔️
            </motion.div>

            <motion.h2
              className="font-display text-2xl font-black text-primary mb-2 tracking-wider"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              CHEFE DERROTADO!
            </motion.h2>

            <motion.p
              className="text-foreground text-lg font-bold mb-1"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {bossName}
            </motion.p>

            {skillName && (
              <motion.div
                className="mt-4 bg-success/10 border border-success/30 rounded-xl px-4 py-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p className="text-success font-bold text-sm">🏆 Skill Desbloqueada</p>
                <p className="text-foreground font-display text-lg mt-1">{skillName}</p>
              </motion.div>
            )}

            {xpBonus > 0 && (
              <motion.div
                className="mt-4 font-display text-gold text-xl font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 1 }}
              >
                +{xpBonus} XP BÔNUS
              </motion.div>
            )}

            <motion.button
              className="mt-8 bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl text-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2 }}
              onClick={onClose}
            >
              CONTINUAR
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}