import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Timer, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Props:
 *  exercises: array of exercise objects
 *  onFinish: fn({ durationMinutes, xpBonus }) called when workout ends
 *  onStart: fn() called when workout starts
 */
export default function WorkoutTimer({ exercises = [], onFinish, onStart }) {
  const [phase, setPhase] = useState('idle'); // idle | running | paused | resting | done
  const [elapsed, setElapsed] = useState(0); // total seconds
  const [restTime, setRestTime] = useState(0); // countdown
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [completedEx, setCompletedEx] = useState([]);
  const [customRest, setCustomRest] = useState('');

  const elapsedRef = useRef(0);
  const restRef = useRef(0);
  const phaseRef = useRef('idle');
  const tickRef = useRef(null);

  const beep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (phaseRef.current === 'running') {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      } else if (phaseRef.current === 'resting') {
        if (restRef.current > 0) {
          restRef.current -= 1;
          setRestTime(restRef.current);
          if (restRef.current === 0) {
            beep();
            phaseRef.current = 'running';
            setPhase('running');
          }
        }
      }
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [beep]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleStart = () => {
    phaseRef.current = 'running';
    setPhase('running');
    setCurrentExIdx(0);
    setCompletedEx([]);
    onStart?.();
  };

  const handlePause = () => {
    phaseRef.current = 'paused';
    setPhase('paused');
  };

  const handleResume = () => {
    phaseRef.current = 'running';
    setPhase('running');
  };

  const handleFinish = () => {
    phaseRef.current = 'done';
    setPhase('done');
    const mins = Math.max(1, Math.round(elapsedRef.current / 60));
    onFinish?.({ durationMinutes: mins, xpBonus: mins });
  };

  const startRest = (seconds) => {
    restRef.current = seconds;
    setRestTime(seconds);
    phaseRef.current = 'resting';
    setPhase('resting');
  };

  const markExerciseDone = () => {
    setCompletedEx(p => [...p, currentExIdx]);
    if (currentExIdx < exercises.length - 1) {
      setCurrentExIdx(i => i + 1);
    }
  };

  const totalEx = exercises.length;
  const doneCount = completedEx.length;
  const progress = totalEx > 0 ? (doneCount / totalEx) * 100 : 0;
  const currentEx = exercises[currentExIdx];

  if (phase === 'idle') {
    return (
      <div className="bg-[#0d0d0d] border border-border rounded-2xl p-5 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Timer className="w-4 h-4" />
          <span className="text-sm font-medium">Timer de Treino</span>
        </div>
        <Button
          onClick={handleStart}
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-display font-bold text-base tracking-wide"
        >
          <Play className="w-5 h-5" /> INICIAR TREINO
        </Button>
      </div>
    );
  }

  if (phase === 'done') {
    const mins = Math.max(1, Math.round(elapsedRef.current / 60));
    return (
      <div className="bg-[#0d0d0d] border border-success/30 rounded-2xl p-5 text-center space-y-3">
        <div className="text-3xl">🏁</div>
        <p className="font-display font-black text-success text-xl">TREINO ENCERRADO</p>
        <p className="text-muted-foreground text-sm">Duração: <span className="text-foreground font-bold">{fmt(elapsedRef.current)}</span></p>
        <p className="text-gold font-bold text-sm">+{mins} XP bônus por tempo</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d0d] border border-border rounded-2xl overflow-hidden">
      {/* Stopwatch */}
      <div className="px-5 pt-5 pb-3 text-center">
        <motion.div
          className="font-mono font-black text-[52px] leading-none"
          style={{ color: '#D4A853' }}
          animate={phase === 'resting' ? { scale: [1, 1.03, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          {phase === 'resting' ? fmt(restTime) : fmt(elapsed)}
        </motion.div>
        <p className="text-xs text-muted-foreground mt-1">
          {phase === 'resting' ? '⏳ Descanso' : phase === 'paused' ? '⏸ Pausado' : '⏱ Tempo total'}
        </p>
      </div>

      {/* Exercise progress */}
      {totalEx > 0 && (
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Exercício {Math.min(currentExIdx + 1, totalEx)} de {totalEx}</span>
            <span className="text-success font-bold">{doneCount} concluídos</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {currentEx && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm font-bold text-foreground truncate flex-1">{currentEx.name || currentEx.exercise_id || `Exercício ${currentExIdx + 1}`}</p>
              {currentEx.sets && <span className="text-xs text-gold font-bold ml-2">{currentEx.sets}x{currentEx.reps}</span>}
            </div>
          )}
          <button
            onClick={markExerciseDone}
            className="mt-2 w-full text-xs text-success border border-success/30 rounded-lg py-1.5 hover:bg-success/10 transition-colors font-bold flex items-center justify-center gap-1"
          >
            ✓ Marcar exercício como feito <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Rest timer buttons */}
      <div className="px-5 pb-3">
        <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide">Timer de descanso</p>
        <div className="flex gap-2">
          {[30, 60, 90].map(s => (
            <button
              key={s}
              onClick={() => startRest(s)}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all hover:border-primary/50"
            >
              {s}s
            </button>
          ))}
          <div className="flex gap-1 flex-1">
            <Input
              value={customRest}
              onChange={e => setCustomRest(e.target.value)}
              placeholder="s"
              className="h-9 text-xs text-center bg-secondary border-border rounded-xl"
              type="number"
              min="1"
            />
            <button
              onClick={() => { const v = parseInt(customRest); if (v > 0) startRest(v); }}
              className="px-2 py-2 rounded-xl bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="px-5 pb-5 flex gap-2">
        {phase === 'running' || phase === 'resting' ? (
          <Button
            onClick={handlePause}
            className="flex-1 h-12 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-bold"
          >
            <Pause className="w-5 h-5" /> Pausar
          </Button>
        ) : (
          <Button
            onClick={handleResume}
            className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 font-bold"
          >
            <Play className="w-5 h-5" /> Retomar
          </Button>
        )}
        <Button
          onClick={handleFinish}
          variant="outline"
          className="h-12 px-4 rounded-2xl border-destructive/50 text-destructive hover:bg-destructive/10 font-bold"
        >
          <Square className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}