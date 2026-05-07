import React from 'react';
import { motion } from 'framer-motion';
import { FATIGUE_BG, FATIGUE_COLOR } from '@/lib/trainingLoad';

const SEVERITY_MAP = {
  low: 'baixa',
  medium: 'moderada',
  high: 'alta',
};

export default function RecommendationCard({ title, message, severity = 'medium', icon }) {
  const level = SEVERITY_MAP[severity] || 'moderada';
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${FATIGUE_BG[level]}`}>
      {icon && <span className="text-xl shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${FATIGUE_COLOR[level]}`}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
}