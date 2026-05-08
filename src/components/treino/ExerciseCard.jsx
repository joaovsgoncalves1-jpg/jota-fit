/**
 * ExerciseCard — card completo de um exercício no treino em andamento.
 * Mostra metadados, histórico, PR, sugestão, e permite registrar séries com mínima fricção.
 */
import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { detectPR, buildPRRecord } from '@/lib/prDetection';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle, Plus, Minus, Copy, Trophy, ChevronDown, ChevronUp,
  Timer, Info, Zap, Target
} from 'lucide-react';
import RestTimerOverlay from './RestTimerOverlay';
import BandSelector from './BandSelector';

// ─── Constants ────────────────────────────────────────────────────────────────
const TRACKING_META = {
  weight_reps:         { labelA: 'kg',       labelB: 'reps', stepA: 2.5, stepB: 1, isTime: false },
  bodyweight_reps:     { labelA: null,        labelB: 'reps', stepA: 0,   stepB: 1, isTime: false },
  assisted_bodyweight: { labelA: 'elástico',  labelB: 'reps', stepA: 0,   stepB: 1, isTime: false },
  hold_time:           { labelA: null,        labelB: 'seg',  stepA: 0,   stepB: 5, isTime: true  },
  time_distance:       { labelA: 'km',        labelB: 'min',  stepA: 0.1, stepB: 1, isTime: false },
  unilateral:          { labelA: 'kg',        labelB: 'reps', stepA: 2.5, stepB: 1, isTime: false },
};

import { BAND_LABEL } from '@/lib/bands';

// ─── NumericStepper ────────────────────────────────────────────────────────────
function NumericStepper({ value, step, min = 0, onChange, placeholder, disabled, wide }) {
  return (
    <div className={`flex items-center gap-1 ${wide ? 'flex-1' : ''}`}>
      <button
        disabled={disabled}
        onPointerDown={e => { e.preventDefault(); onChange(Math.max(min, (value || 0) - step)); }}
        className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground active:bg-muted/80 disabled:opacity-30 shrink-0 select-none"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="number"
        step={step}
        value={value ?? ''}
        disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        className="flex-1 text-center bg-muted/30 border border-border/60 rounded-xl py-2 text-sm font-bold outline-none focus:border-primary/60 disabled:opacity-40 min-w-0"
      />
      <button
        disabled={disabled}
        onPointerDown={e => { e.preventDefault(); onChange((value || 0) + step); }}
        className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground active:bg-muted/80 disabled:opacity-30 shrink-0 select-none"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── SetRow ───────────────────────────────────────────────────────────────────
function SetRow({ set, index, trackingType, usesBand, onUpdate, onComplete, onCopyLast, isCompleted, isPR, isCurrent, isLoading }) {
  const meta = TRACKING_META[trackingType] || TRACKING_META.weight_reps;
  const [showRir, setShowRir] = useState(false);

  const rowBg = isCompleted
    ? isPR ? 'bg-gold/10 border-gold/30' : 'bg-success/8 border-success/25'
    : isCurrent ? 'bg-primary/8 border-primary/30' : 'bg-muted/15 border-border/30';

  return (
    <div className={`rounded-2xl border p-3 transition-all ${rowBg}`}>
      {/* Set label */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className={`font-display font-black text-sm w-7 shrink-0 ${
          isCompleted ? (isPR ? 'text-gold' : 'text-success') : isCurrent ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {isCompleted ? (isPR ? '🏆' : '✓') : `S${index + 1}`}
        </span>
        <span className="text-xs text-muted-foreground flex-1">
          {isCompleted ? (isPR ? 'PR! Novo recorde!' : 'Concluída') : isCurrent ? 'Atual' : 'Pendente'}
        </span>
        {!isCompleted && onCopyLast && (
          <button
            onClick={onCopyLast}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg bg-muted/30 hover:bg-primary/10"
          >
            <Copy className="w-3 h-3" /> Última sessão
          </button>
        )}
      </div>

      {/* Inputs row */}
      <div className="flex gap-2 items-center">
        {/* Value A: weight */}
        {meta.labelA && meta.labelA !== 'elástico' && (
          <NumericStepper
            value={set.valueA}
            step={meta.stepA}
            onChange={v => onUpdate({ ...set, valueA: v })}
            placeholder={meta.labelA}
            disabled={isCompleted}
            wide
          />
        )}

        {/* Elastic band selector (level + color) */}
        {(trackingType === 'assisted_bodyweight' || usesBand) && (
          <div className="flex-1 min-w-0">
            <BandSelector
              level={set.band}
              color={set.bandColor}
              disabled={isCompleted}
              onChangeLevel={v => onUpdate({ ...set, band: v })}
              onChangeColor={v => onUpdate({ ...set, bandColor: v })}
            />
          </div>
        )}

        {/* Value B: reps / seconds */}
        <NumericStepper
          value={set.valueB}
          step={meta.stepB}
          onChange={v => onUpdate({ ...set, valueB: v })}
          placeholder={meta.labelB}
          disabled={isCompleted}
          wide
        />

        <div className="flex items-center gap-1 shrink-0">
          {/* RIR toggle */}
          {!isCompleted && (
            <button
              onClick={() => setShowRir(s => !s)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${showRir ? 'bg-primary/20 text-primary' : 'bg-muted/40 text-muted-foreground'}`}
              title="RIR / RPE"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* RIR/RPE inline */}
      <AnimatePresence>
        {showRir && !isCompleted && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 mt-2 pt-2 border-t border-border/30">
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground mb-1">RIR (reps na reserva)</p>
                <NumericStepper value={set.rir} step={1} min={0} onChange={v => onUpdate({ ...set, rir: v })} placeholder="RIR" disabled={false} wide />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground mb-1">RPE (0–10)</p>
                <NumericStepper value={set.rpe} step={0.5} min={0} onChange={v => onUpdate({ ...set, rpe: Math.min(10, v) })} placeholder="RPE" disabled={false} wide />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Concluir button */}
      {!isCompleted && isCurrent && (
        <button
          onClick={onComplete}
          disabled={isLoading}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black py-3 rounded-2xl text-sm hover:bg-primary/90 transition-all active:scale-[0.97] disabled:opacity-50 shadow-[0_0_20px_rgba(249,115,22,0.25)]"
        >
          {isLoading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <CheckCircle className="w-4 h-4" />
          }
          {isLoading ? 'Salvando…' : `✓ Concluir série ${index + 1}`}
        </button>
      )}
    </div>
  );
}

// ─── ExerciseCard (main) ──────────────────────────────────────────────────────
export default function ExerciseCard({ routineExercise, exercise, sessionId, studentEmail, allHistoricalSets, allPRs, onPR }) {
  const queryClient = useQueryClient();
  const trackingType = exercise?.tracking_type || 'weight_reps';
  const targetSets = routineExercise.sets || 3;
  const restSec = routineExercise.rest_seconds || exercise?.rest_seconds || 90;

  const [sets, setSets] = useState(() =>
    Array.from({ length: targetSets }, (_, i) => ({
      id: i,
      valueA: routineExercise.target_weight_kg || null,
      valueB: null,
      band: routineExercise.band_assistance_level || '',
      bandColor: '',
      rir: null,
      rpe: null,
    }))
  );
  const [completedSets, setCompletedSets] = useState([]); // [{index, isPR}]
  const [showRest, setShowRest] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // Historical sets for this exercise
  const historicalSets = useMemo(
    () => (allHistoricalSets || []).filter(s => s.exercise_id === exercise?.id),
    [allHistoricalSets, exercise?.id]
  );

  // Last session sets
  const lastSessionSets = useMemo(() => {
    if (!historicalSets.length) return null;
    const sorted = [...historicalSets].sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));
    const lastSid = sorted[0]?.session_id;
    return historicalSets
      .filter(s => s.session_id === lastSid)
      .sort((a, b) => a.set_number - b.set_number);
  }, [historicalSets]);

  // Best PR for this exercise
  const bestPR = useMemo(() => {
    const prs = (allPRs || []).filter(p => p.exercise_id === exercise?.id);
    if (!prs.length) return null;
    return prs.sort((a, b) => (b.achieved_at || '').localeCompare(a.achieved_at || ''))[0];
  }, [allPRs, exercise?.id]);

  // Suggestion for today
  const suggestion = useMemo(() => {
    if (!lastSessionSets?.length) return null;
    const last = lastSessionSets[0];
    if (trackingType === 'weight_reps' && last.weight_kg && last.reps) {
      const targetRep = routineExercise.target_reps ? parseInt(routineExercise.target_reps) : null;
      const metTarget = targetRep && last.reps >= targetRep;
      if (metTarget) return `Aumentar carga: tente ${last.weight_kg + 2.5}kg`;
      return `Manter ${last.weight_kg}kg, foco em técnica`;
    }
    if (trackingType === 'assisted_bodyweight' && last.band_assistance_level) {
      const sameBand = lastSessionSets.filter(s => s.band_assistance_level === last.band_assistance_level);
      const maxReps = Math.max(...sameBand.map(s => s.reps || 0));
      return `Bata ${maxReps + 1}+ reps com elástico ${BAND_LABEL[last.band_assistance_level]} ou tente mais leve`;
    }
    if (trackingType === 'hold_time' && last.duration_seconds) {
      const bandTxt = last.band_assistance_level ? ` (${BAND_LABEL[last.band_assistance_level]})` : '';
      return `Superar ${last.duration_seconds}s${bandTxt}`;
    }
    return null;
  }, [lastSessionSets, trackingType, routineExercise]);

  // Last session hint string
  const lastSessionHint = useMemo(() => {
    if (!lastSessionSets?.length) return null;
    return lastSessionSets.map(s => {
      const bandTxt = s.band_assistance_level ? `[${BAND_LABEL[s.band_assistance_level][0]}]` : '';
      if (s.weight_kg && s.reps) return `${s.weight_kg}×${s.reps}`;
      if (s.reps) return `${s.reps}r${bandTxt}`;
      if (s.duration_seconds) return `${s.duration_seconds}s${bandTxt}`;
      return null;
    }).filter(Boolean).join(' | ');
  }, [lastSessionSets]);

  // PR label
  const prLabel = useMemo(() => {
    if (!bestPR) return null;
    if (bestPR.record_type === 'max_weight') return `${bestPR.weight_kg}kg × ${bestPR.reps} reps`;
    if (bestPR.record_type === 'max_reps') return `${bestPR.reps} reps`;
    if (bestPR.record_type === 'max_duration') return `${bestPR.duration_seconds}s`;
    if (bestPR.record_type === 'band_reduction') return `Elástico ${BAND_LABEL[bestPR.band_level] || bestPR.band_level}`;
    return null;
  }, [bestPR]);

  const logSetMutation = useMutation({
    mutationFn: async (setData) => {
      const payload = {
        session_id: sessionId,
        student_email: studentEmail,
        exercise_id: exercise?.id,
        exercise_name: exercise?.name,
        set_number: setData.setIndex + 1,
        completed: true,
        rir: setData.rir || undefined,
        rpe: setData.rpe || undefined,
      };

      if (['weight_reps', 'unilateral'].includes(trackingType)) {
        payload.weight_kg = setData.valueA || 0;
        payload.reps = setData.valueB || 0;
      } else if (['bodyweight_reps', 'assisted_bodyweight'].includes(trackingType)) {
        payload.reps = setData.valueB || 0;
        payload.band_assistance_level = setData.band || undefined;
        payload.band_color = setData.bandColor || undefined;
      } else if (trackingType === 'hold_time') {
        payload.duration_seconds = setData.valueB || 0;
        payload.band_assistance_level = setData.band || undefined;
        payload.band_color = setData.bandColor || undefined;
      } else if (trackingType === 'time_distance') {
        payload.duration_seconds = (setData.valueB || 0) * 60;
        payload.weight_kg = setData.valueA || 0;
      }

      const prResult = detectPR(payload, historicalSets, trackingType);
      if (prResult?.isPR) {
        payload.is_pr = true;
        payload.pr_type = prResult.prType;
      }

      await base44.entities.SetLog.create(payload);

      if (prResult?.isPR && sessionId) {
        await base44.entities.ExercisePersonalRecord.create(
          buildPRRecord({ studentEmail, exerciseId: exercise?.id, exerciseName: exercise?.name, set: payload, prResult, sessionId })
        );
      }

      return { isPR: prResult?.isPR || false };
    },
    onSuccess: ({ isPR }, variables) => {
      queryClient.invalidateQueries({ queryKey: ['historical-sets', studentEmail] });
      if (isPR) onPR(exercise?.name);
      setCompletedSets(prev => [...prev, { index: variables.setIndex, isPR }]);
      // auto-start rest timer
      setShowRest(true);
    },
  });

  const completeSet = (setIndex) => {
    if (!sessionId) return;
    const s = sets[setIndex];
    logSetMutation.mutate({ ...s, setIndex });
  };

  const completedIndexes = completedSets.map(c => c.index);
  const allDone = completedIndexes.length >= sets.length;
  const currentSetIndex = sets.findIndex((_, i) => !completedIndexes.includes(i));

  // Copy entire last session to all pending sets
  const copyAllFromLastSession = () => {
    if (!lastSessionSets) return;
    setSets(prev => prev.map((s, i) => {
      if (completedIndexes.includes(i)) return s;
      const last = lastSessionSets[i] || lastSessionSets[lastSessionSets.length - 1];
      if (!last) return s;
      return {
        ...s,
        valueA: last.weight_kg || s.valueA,
        valueB: last.reps || last.duration_seconds || s.valueB,
        band: last.band_assistance_level || s.band,
        bandColor: last.band_color || s.bandColor,
      };
    }));
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all
      ${allDone ? 'border-success/30 bg-success/5' : 'border-border bg-card'}`}>

      {/* ── Header ── */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        {/* Thumbnail */}
        {exercise?.thumbnail_url || exercise?.gif_url ? (
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted/30">
            <img
              src={exercise.thumbnail_url || exercise.gif_url}
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0
            ${allDone ? 'bg-success/20' : 'bg-primary/15'}`}>
            {allDone
              ? <CheckCircle className="w-6 h-6 text-success" />
              : <span className="text-2xl">{trackingType === 'hold_time' ? '⏱' : '🏋️'}</span>}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-base leading-tight truncate">{exercise?.name || 'Exercício'}</h3>
            <button
              onClick={() => setShowInfo(s => !s)}
              className="shrink-0 w-5 h-5 rounded-full bg-muted/40 flex items-center justify-center hover:bg-muted/60"
            >
              <Info className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            <span className="text-[11px] text-muted-foreground">
              {completedIndexes.length}/{sets.length} séries
            </span>
            {routineExercise.target_reps && (
              <span className="text-[11px] text-muted-foreground">· {routineExercise.target_reps} reps</span>
            )}
            {routineExercise.target_weight_kg && (
              <span className="text-[11px] text-muted-foreground">· {routineExercise.target_weight_kg}kg</span>
            )}
            {restSec && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                · <Timer className="w-2.5 h-2.5" /> {restSec}s
              </span>
            )}
          </div>

          {/* Chips: last session + PR */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {lastSessionHint && (
              <span className="text-[10px] font-bold bg-muted/30 text-muted-foreground px-2 py-0.5 rounded-lg">
                Última: {lastSessionHint}
              </span>
            )}
            {prLabel && (
              <span className="text-[10px] font-bold bg-gold/15 text-gold px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                <Trophy className="w-2.5 h-2.5" /> PR: {prLabel}
              </span>
            )}
          </div>
        </div>

        <button onClick={() => setExpanded(e => !e)} className="shrink-0 mt-1">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {/* ── Info panel ── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1.5 border-t border-border/30 pt-3">
              {suggestion && (
                <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2">
                  <Target className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-primary font-medium">{suggestion}</p>
                </div>
              )}
              {(routineExercise.notes || exercise?.tips) && (
                <div className="bg-muted/20 rounded-xl px-3 py-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Notas do Jota</p>
                  <p className="text-xs text-foreground">{routineExercise.notes || exercise?.tips}</p>
                </div>
              )}
              {routineExercise.rir_target && (
                <p className="text-xs text-muted-foreground px-1">RIR alvo: {routineExercise.rir_target}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sets ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 pt-1 space-y-2">
              {/* Copy all from last session */}
              {lastSessionSets && completedIndexes.length === 0 && (
                <button
                  onClick={copyAllFromLastSession}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary bg-muted/20 hover:bg-primary/10 border border-border/40 rounded-xl py-2 transition-all"
                >
                  <Copy className="w-3 h-3" /> Copiar todas as séries da última sessão
                </button>
              )}

              {sets.map((set, i) => {
                const completion = completedSets.find(c => c.index === i);
                const isCompleted = !!completion;
                const isPR = completion?.isPR || false;
                const isCurrent = i === currentSetIndex;
                const lastForThisSet = lastSessionSets?.[i] || lastSessionSets?.[lastSessionSets.length - 1];

                return (
                  <SetRow
                    key={set.id}
                    set={set}
                    index={i}
                    trackingType={trackingType}
                    usesBand={!!exercise?.uses_band}
                    isCompleted={isCompleted}
                    isPR={isPR}
                    isCurrent={isCurrent && !isCompleted}
                    isLoading={logSetMutation.isPending}
                    onUpdate={updated => setSets(prev => prev.map((s, si) => si === i ? updated : s))}
                    onComplete={() => completeSet(i)}
                    onCopyLast={lastForThisSet && !isCompleted ? () => {
                      setSets(prev => prev.map((s, si) => si === i ? {
                        ...s,
                        valueA: lastForThisSet.weight_kg || s.valueA,
                        valueB: lastForThisSet.reps || lastForThisSet.duration_seconds || s.valueB,
                        band: lastForThisSet.band_assistance_level || s.band,
                        bandColor: lastForThisSet.band_color || s.bandColor,
                      } : s));
                    } : null}
                  />
                );
              })}

              {/* Add set */}
              <button
                onClick={() => setSets(prev => [...prev, {
                  id: Date.now(),
                  valueA: prev[prev.length - 1]?.valueA || null,
                  valueB: null,
                  band: prev[prev.length - 1]?.band || '',
                  bandColor: prev[prev.length - 1]?.bandColor || '',
                  rir: null, rpe: null,
                }])}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary bg-muted/10 hover:bg-primary/10 rounded-xl py-2 transition-all border border-dashed border-border/40"
              >
                <Plus className="w-3 h-3" /> Adicionar série
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest Timer */}
      <AnimatePresence>
        {showRest && (
          <RestTimerOverlay seconds={restSec} onDone={() => setShowRest(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}