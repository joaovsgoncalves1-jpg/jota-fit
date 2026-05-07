import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function RestTimerBar({ seconds, onSkip }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onSkip(); return; }
    const t = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  const pct = Math.max(0, (remaining / seconds) * 100);
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto bg-card border border-primary/40 rounded-2xl p-3 shadow-2xl z-50 flex items-center gap-3"
    >
      <div className="relative w-12 h-12 shrink-0">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
            strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display font-black text-[11px] text-primary">
          {min > 0 ? `${min}:${String(sec).padStart(2, '0')}` : sec}
        </span>
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm">Descanso ativo</p>
        <p className="text-xs text-muted-foreground">Respire e prepare para a próxima série</p>
      </div>
      <button onClick={onSkip} className="text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/40 px-3 py-2 rounded-lg transition-all">
        Pular ⏭
      </button>
    </motion.div>
  );
}