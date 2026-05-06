import React from 'react';
import { motion } from 'framer-motion';

export default function LevelProgress({ levelInfo, size = 'md' }) {
  if (!levelInfo) return null;

  const { level, title, progress, xpForCurrentLevel, xpForNextLevel, currentXP } = levelInfo;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-primary text-sm">Nv.{level}</span>
          <span className="text-xs text-muted-foreground">{title}</span>
        </div>
        {xpForNextLevel && (
          <span className="text-xs text-muted-foreground">
            {currentXP} / {xpForNextLevel} XP
          </span>
        )}
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-gold rounded-full"
          initial={false}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}