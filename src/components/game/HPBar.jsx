import React from 'react';
import { motion } from 'framer-motion';

export default function HPBar({ current, total, label, showDamage, size = 'md' }) {
  const percentage = Math.max(0, Math.min(100, (current / total) * 100));
  const barColor = percentage > 50 ? 'bg-success' : percentage > 25 ? 'bg-primary' : 'bg-destructive';
  const heights = { sm: 'h-2', md: 'h-4', lg: 'h-6' };

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="text-xs font-display font-bold text-foreground">
            {current} / {total} HP
          </span>
        </div>
      )}
      <div className={`w-full ${heights[size]} bg-muted rounded-full overflow-hidden relative`}>
        <motion.div
          className={`${heights[size]} ${barColor} rounded-full relative`}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
        </motion.div>
        {showDamage && (
          <motion.div
            className="absolute top-1/2 right-4 -translate-y-1/2 text-destructive font-display font-bold text-sm"
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [2, 1, 1, 0.8], y: [0, 0, -10, -20] }}
            transition={{ duration: 1.5 }}
          >
            -{showDamage}
          </motion.div>
        )}
      </div>
    </div>
  );
}