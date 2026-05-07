import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';

export default function WorkoutHeader({ routine, sortedExercises, sessionId, onFinish, finishing }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
      <button
        onClick={() => window.history.back()}
        className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="font-display font-black text-sm truncate leading-tight">{routine?.name}</h1>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{sortedExercises.length} exercícios</span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" /> {mm}:{ss}
          </span>
          {!sessionId && <span className="text-muted-foreground/60">· iniciando…</span>}
        </div>
      </div>

      <button
        onClick={onFinish}
        disabled={finishing || !sessionId}
        className="flex items-center gap-1.5 bg-success/20 text-success border border-success/30 text-xs font-bold px-3 py-2 rounded-xl hover:bg-success/30 transition-all disabled:opacity-50"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        {finishing ? 'Salvando…' : 'Finalizar'}
      </button>
    </div>
  );
}