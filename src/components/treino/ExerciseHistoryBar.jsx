import React, { useMemo } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';

const BAND_LABEL = { muito_forte: 'Muito forte', forte: 'Forte', medio: 'Médio', leve: 'Leve' };

function formatSet(s) {
  if (s.weight_kg && s.reps) return `${s.weight_kg}kg×${s.reps}`;
  if (s.reps && s.band_assistance_level) return `El.${BAND_LABEL[s.band_assistance_level]?.split(' ')[0]}×${s.reps}`;
  if (s.reps) return `${s.reps} reps`;
  if (s.duration_seconds) return `${s.duration_seconds}s`;
  return '—';
}

export default function ExerciseHistoryBar({ exerciseId, allSets, prs }) {
  const { lastSets, bestSet, suggestion, last3Sessions } = useMemo(() => {
    if (!allSets || !exerciseId) return { lastSets: [], bestSet: null, suggestion: null, last3Sessions: [] };

    const exSets = allSets
      .filter(s => s.exercise_id === exerciseId)
      .sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''));

    if (exSets.length === 0) return { lastSets: [], bestSet: null, suggestion: null, last3Sessions: [] };

    // Group by session
    const bySession = {};
    exSets.forEach(s => {
      const sid = s.session_id || 'unknown';
      if (!bySession[sid]) bySession[sid] = [];
      bySession[sid].push(s);
    });
    const sessions = Object.values(bySession).sort((a, b) =>
      (b[0].created_date || '').localeCompare(a[0].created_date || '')
    );

    const lastSession = sessions[0] || [];
    const lastSets = [...lastSession].sort((a, b) => a.set_number - b.set_number);

    // Best single set
    const withWeight = exSets.filter(s => s.weight_kg);
    const bestSet = withWeight.length > 0
      ? withWeight.reduce((best, s) => (!best || s.weight_kg > best.weight_kg || (s.weight_kg === best.weight_kg && s.reps > best.reps)) ? s : best, null)
      : null;

    // Last 3 sessions compact summary
    const last3Sessions = sessions.slice(0, 3).map(sess => {
      const sorted = [...sess].sort((a, b) => a.set_number - b.set_number);
      return sorted.map(s => formatSet(s)).join(' / ');
    });

    // Suggestion
    let suggestion = null;
    if (lastSets.length > 0) {
      const avgReps = lastSets.reduce((sum, s) => sum + (s.reps || 0), 0) / lastSets.length;
      const weight = lastSets[0]?.weight_kg;
      const targetReps = lastSets[0]?.reps || 0;
      const allHit = lastSets.every(s => (s.reps || 0) >= targetReps);

      if (weight) {
        if (allHit && avgReps >= targetReps) {
          const nextW = weight + (weight >= 40 ? 2.5 : 2.5);
          suggestion = `Última vez: ${weight}kg×${lastSets.map(s => s.reps).join('/')}. Tente ${nextW}kg hoje ou mantenha ${weight}kg e bata todas as reps.`;
        } else {
          suggestion = `Última vez: ${weight}kg×${lastSets.map(s => s.reps).join('/')}. Foque em completar todas as séries com ${weight}kg.`;
        }
      } else if (lastSets[0]?.reps) {
        suggestion = `Última vez: ${lastSets.map(s => s.reps).join('/')} reps. Tente bater ou superar.`;
      } else if (lastSets[0]?.band_assistance_level) {
        const current = lastSets[0].band_assistance_level;
        const lighter = { muito_forte: 'forte', forte: 'medio', medio: 'leve', leve: null };
        const next = lighter[current];
        suggestion = next
          ? `Usou elástico ${BAND_LABEL[current]}. Se conseguiu todas as reps, tente o ${BAND_LABEL[next]}!`
          : `Elástico Leve! Tente 1 rep sem elástico se sentir força.`;
      }
    }

    return { lastSets, bestSet, suggestion, last3Sessions };
  }, [allSets, exerciseId]);

  const exPR = prs?.find(p => p.exercise_id === exerciseId && p.record_type === 'max_weight');

  if (lastSets.length === 0 && !exPR) {
    return (
      <div className="bg-muted/10 border border-border/30 rounded-xl px-3 py-2.5 text-xs text-muted-foreground">
        Primeira vez neste exercício — registre sua série! 🎯
      </div>
    );
  }

  return (
    <div className="bg-muted/10 border border-border/30 rounded-xl p-3 space-y-2">
      {/* Last session */}
      {lastSets.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-bold text-muted-foreground w-14 shrink-0 pt-0.5">ÚLTIMA</span>
          <span className="text-xs font-bold text-foreground">{lastSets.map(s => formatSet(s)).join(' · ')}</span>
        </div>
      )}

      {/* PR */}
      {exPR && (
        <div className="flex items-center gap-2">
          <Trophy className="w-3 h-3 text-gold shrink-0" />
          <span className="text-xs font-bold text-gold">PR: {exPR.weight_kg}kg × {exPR.reps} reps</span>
        </div>
      )}

      {/* Last 3 sessions */}
      {last3Sessions.length > 1 && (
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-bold text-muted-foreground w-14 shrink-0 pt-0.5">3 SEM.</span>
          <div className="space-y-0.5">
            {last3Sessions.map((s, i) => (
              <p key={i} className="text-[10px] text-muted-foreground">{s}</p>
            ))}
          </div>
        </div>
      )}

      {/* Suggestion */}
      {suggestion && (
        <div className="flex items-start gap-2 bg-primary/8 border border-primary/20 rounded-lg px-2 py-1.5">
          <TrendingUp className="w-3 h-3 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-primary leading-snug">{suggestion}</p>
        </div>
      )}
    </div>
  );
}