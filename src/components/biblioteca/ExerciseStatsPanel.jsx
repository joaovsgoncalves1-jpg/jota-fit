/**
 * ExerciseStatsPanel — painel completo de histórico e PRs de um exercício.
 * Mostra: última sessão, últimas 3 sessões, melhores marcas, evolução com elástico, último PR.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Calendar, TrendingUp, Award } from 'lucide-react';
import { computeExerciseStats, formatSessionSets, BAND_LABEL } from '@/lib/exerciseStats';
import { format, parseISO } from 'date-fns';

function StatTile({ emoji, label, value, sub, color = 'text-foreground' }) {
  if (value === null || value === undefined || value === 0) return null;
  return (
    <div className="bg-muted/20 border border-border/40 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{emoji}</span>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <p className={`font-display font-black text-base leading-tight ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ExerciseStatsPanel({ exerciseId, email, trackingType }) {
  const { data: sets, isLoading: loadingSets } = useQuery({
    queryKey: ['exercise-sets', exerciseId, email],
    queryFn: () => base44.entities.SetLog.filter({ student_email: email, exercise_id: exerciseId }),
    enabled: !!exerciseId && !!email,
  });
  const { data: prs, isLoading: loadingPRs } = useQuery({
    queryKey: ['exercise-prs', exerciseId, email],
    queryFn: () => base44.entities.ExercisePersonalRecord.filter({ student_email: email, exercise_id: exerciseId }),
    enabled: !!exerciseId && !!email,
  });

  if (loadingSets || loadingPRs) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!sets?.length) {
    return (
      <div className="bg-muted/20 rounded-xl p-5 text-center">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
        <p className="text-sm font-bold">Nenhum histórico ainda</p>
        <p className="text-xs text-muted-foreground mt-0.5">Após o primeiro treino sua evolução aparecerá aqui</p>
      </div>
    );
  }

  const stats = computeExerciseStats(sets, prs);
  const isCalisthenicsBand = trackingType === 'assisted_bodyweight' || stats.bestBand;
  const isHoldTime = trackingType === 'hold_time' || stats.maxDuration > 0;

  const fmtDate = (iso) => {
    if (!iso) return '';
    try { return format(parseISO(iso), 'dd/MM'); } catch { return iso?.slice(5, 10); }
  };

  return (
    <div className="space-y-3">
      {/* Last PR highlight */}
      {stats.lastPR && (
        <div className="bg-gradient-to-r from-gold/15 to-gold/5 border border-gold/30 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gold uppercase tracking-wide">Último PR · {fmtDate(stats.lastPRDate)}</p>
            <p className="text-sm font-bold leading-tight">
              {stats.lastPR.record_type === 'max_weight' && `${stats.lastPR.weight_kg}kg × ${stats.lastPR.reps} reps`}
              {stats.lastPR.record_type === 'max_reps' && `${stats.lastPR.reps} reps`}
              {stats.lastPR.record_type === 'max_duration' && `${stats.lastPR.duration_seconds}s de hold`}
              {stats.lastPR.record_type === 'band_reduction' && `Elástico ${BAND_LABEL[stats.lastPR.band_level] || stats.lastPR.band_level}`}
              {stats.lastPR.record_type === 'first_without_band' && 'Primeira sem elástico! 🎉'}
              {stats.lastPR.record_type === 'first_rep' && 'Primeira execução'}
            </p>
          </div>
        </div>
      )}

      {/* Best marks grid */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <Award className="w-3 h-3" /> Suas melhores marcas
        </p>
        <div className="grid grid-cols-2 gap-2">
          {stats.maxWeight > 0 && (
            <StatTile
              emoji="⚖️"
              label="Carga máxima"
              value={`${stats.maxWeight}kg`}
              sub={stats.bestWeightSet ? `× ${stats.bestWeightSet.reps} reps` : null}
              color="text-primary"
            />
          )}
          {stats.maxReps > 0 && (
            <StatTile
              emoji="🔥"
              label="Reps máximas"
              value={`${stats.maxReps} reps`}
              color="text-success"
            />
          )}
          {stats.bestVolume > 0 && (
            <StatTile
              emoji="📈"
              label="Maior volume"
              value={`${Math.round(stats.bestVolume)}kg`}
              sub={stats.bestVolumeDate ? `em ${fmtDate(stats.bestVolumeDate)}` : null}
              color="text-blue-400"
            />
          )}
          {isHoldTime && stats.maxDuration > 0 && (
            <StatTile
              emoji="⏱️"
              label="Hold máximo"
              value={`${stats.maxDuration}s`}
              color="text-purple-400"
            />
          )}
          {isCalisthenicsBand && stats.bestBand && (
            <StatTile
              emoji="🪢"
              label="Elástico mais leve"
              value={BAND_LABEL[stats.bestBand]}
              sub={stats.bestBandReps > 0 ? `${stats.bestBandReps} reps` : null}
              color="text-green-400"
            />
          )}
          {stats.firstWithoutBand && (
            <StatTile
              emoji="🎉"
              label="Sem elástico"
              value="Conquistado"
              color="text-gold"
            />
          )}
        </div>
      </div>

      {/* Last session */}
      {stats.lastSession && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Última sessão · {fmtDate(stats.lastSession.date)}
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
            <p className="text-sm font-bold">{formatSessionSets(stats.lastSession.sets)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{stats.lastSession.sets.length} séries</p>
          </div>
        </div>
      )}

      {/* Last 3 sessions */}
      {stats.last3Sessions.length > 1 && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Últimas sessões</p>
          <div className="space-y-1.5">
            {stats.last3Sessions.map((g, i) => (
              <div key={g.sessionId || i} className="bg-muted/20 rounded-xl p-2.5 flex items-center justify-between gap-3">
                <span className="text-[10px] text-muted-foreground shrink-0 w-12">{fmtDate(g.date)}</span>
                <span className="text-xs font-bold flex-1 text-right truncate">{formatSessionSets(g.sets)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 pt-1">
        <span>{stats.totalSessions} sessões registradas</span>
        <span>{stats.totalSets} séries totais</span>
      </div>
    </div>
  );
}