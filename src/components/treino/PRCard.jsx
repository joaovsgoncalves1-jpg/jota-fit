/**
 * PRCard — card visual para um PR alcançado, com mensagem motivacional formatada.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { formatPRMessage, getPRMeta } from '@/lib/exerciseStats';

export default function PRCard({ pr, index = 0 }) {
  const meta = getPRMeta(pr.record_type);
  const message = formatPRMessage(pr);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', damping: 16 }}
      className={`flex items-center gap-3 ${meta.bg} border ${meta.border} rounded-2xl p-3`}
    >
      <div className={`w-10 h-10 rounded-xl bg-card/60 flex items-center justify-center shrink-0 text-xl`}>
        {meta.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Trophy className={`w-3 h-3 ${meta.color}`} />
          <p className={`text-[10px] font-black uppercase tracking-wider ${meta.color}`}>
            {meta.label}
          </p>
        </div>
        <p className="text-sm font-bold leading-snug mt-0.5">{message}</p>
      </div>
    </motion.div>
  );
}