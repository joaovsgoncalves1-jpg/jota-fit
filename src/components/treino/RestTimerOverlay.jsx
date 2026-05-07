import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward } from 'lucide-react';

export default function RestTimerOverlay({ seconds, onDone }) {
  const [rem, setRem] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (paused || finished) return;
    intervalRef.current = setInterval(() => {
      setRem(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setFinished(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused, finished]);

  useEffect(() => {
    if (finished) {
      // vibrate if supported
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, [finished]);

  const pct = Math.max(0, ((seconds - rem) / seconds) * 100);
  const circumference = 2 * Math.PI * 52;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm pb-10"
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className={`w-full max-w-sm mx-4 rounded-3xl border p-6 flex flex-col items-center gap-5
          ${finished ? 'bg-success/10 border-success/40' : 'bg-card border-border'}`}
      >
        <p className={`text-xs font-black uppercase tracking-widest ${finished ? 'text-success' : 'text-muted-foreground'}`}>
          {finished ? '✅ Descanso concluído!' : '⏸ Descanso'}
        </p>

        {/* Circular timer */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={finished ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              strokeLinecap="round"
              style={{ transition: paused ? 'none' : 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display font-black text-4xl leading-none ${finished ? 'text-success' : 'text-primary'}`}>
              {rem}
            </span>
            <span className="text-[10px] text-muted-foreground">seg</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 w-full">
          {!finished && (
            <button
              onClick={() => setPaused(p => !p)}
              className="flex-1 flex items-center justify-center gap-2 bg-muted/40 hover:bg-muted/60 text-foreground font-bold py-3 rounded-2xl transition-all text-sm"
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {paused ? 'Retomar' : 'Pausar'}
            </button>
          )}
          <button
            onClick={onDone}
            className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-2xl transition-all text-sm
              ${finished
                ? 'bg-success text-white hover:bg-success/90'
                : 'bg-muted/40 hover:bg-muted/60 text-muted-foreground'}`}
          >
            <SkipForward className="w-4 h-4" />
            {finished ? 'Próxima série' : 'Pular'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}