import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function XPBadge({ amount, show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          initial={{ opacity: 0, y: 20, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.8 }}
          transition={{ duration: 0.6, ease: 'backOut' }}
        >
          <div className="bg-gold/20 border border-gold/40 backdrop-blur-md rounded-2xl px-6 py-3 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-display font-bold text-gold text-xl">+{amount} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}