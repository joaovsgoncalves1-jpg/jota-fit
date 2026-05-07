import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Plus, ChevronDown, ChevronUp, Trophy, TrendingUp } from 'lucide-react';

const LEVEL_BADGE = {
  beginner: 'bg-success/20 text-success',
  intermediate: 'bg-primary/20 text-primary',
  advanced: 'bg-destructive/20 text-destructive',
};
const LEVEL_LABEL = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };

const TYPE_LABEL = {
  musculacao: '🏋️ Musculação', calistenia: '💪 Calistenia', mobilidade: '🤸 Mobilidade',
  cardio: '🏃 Cardio', skill: '⭐ Skill', aquecimento: '🔥 Aquecimento', ativacao: '⚡ Ativação',
};

const BAND_LABEL = { leve: 'Leve', medio: 'Médio', forte: 'Forte', muito_forte: 'Muito forte' };

function getYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
  return m ? m[1] : null;
}

function ExerciseHistory({ exerciseId, email }) {
  const { data: sets } = useQuery({
    queryKey: ['exercise-sets', exerciseId, email],
    queryFn: () => base44.entities.SetLog.filter({ student_email: email, exercise_id: exerciseId }),
    enabled: !!exerciseId && !!email,
  });
  const { data: prs } = useQuery({
    queryKey: ['exercise-prs', exerciseId, email],
    queryFn: () => base44.entities.ExercisePersonalRecord.filter({ student_email: email, exercise_id: exerciseId }),
    enabled: !!exerciseId && !!email,
  });

  if (!sets || sets.length === 0) {
    return (
      <div className="bg-muted/20 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">Nenhum histórico ainda</p>
        <p className="text-xs text-muted-foreground mt-1">Após o primeiro treino sua evolução aparecerá aqui</p>
      </div>
    );
  }

  // Group by session
  const sessions = {};
  sets.forEach(s => {
    const key = s.session_id || s.created_date?.slice(0, 10) || 'unknown';
    if (!sessions[key]) sessions[key] = [];
    sessions[key].push(s);
  });
  const sortedSessions = Object.entries(sessions).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 3);

  const maxPR = prs?.find(p => p.record_type === 'max_weight');

  return (
    <div className="space-y-3">
      {maxPR && (
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-gold shrink-0" />
          <div>
            <p className="text-xs font-bold text-gold">Recorde Pessoal</p>
            <p className="text-sm font-bold">{maxPR.weight_kg}kg × {maxPR.reps} reps</p>
          </div>
        </div>
      )}
      {sortedSessions.map(([key, sessionSets]) => {
        const date = sessionSets[0]?.created_date?.slice(0, 10) || key;
        return (
          <div key={key} className="bg-muted/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-2">{date}</p>
            <div className="space-y-1">
              {sessionSets.sort((a, b) => a.set_number - b.set_number).map((s, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Série {s.set_number}</span>
                  <span className="font-bold">
                    {s.weight_kg ? `${s.weight_kg}kg × ${s.reps}` :
                     s.reps ? `${s.reps} reps` :
                     s.duration_seconds ? `${s.duration_seconds}s` :
                     s.band_assistance_level ? `Elástico ${BAND_LABEL[s.band_assistance_level]} × ${s.reps || '—'}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ExerciseDetailSheet({ exercise, open, onClose, onAddToRoutine, isFavorite, onToggleFav }) {
  const { user } = useCurrentUser();
  const [showHistory, setShowHistory] = useState(false);
  const ytId = getYoutubeId(exercise?.video_url);

  return (
    <AnimatePresence>
      {open && exercise && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-40" onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[92vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-card z-10">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            <div className="px-4 pb-10">
              {/* Top bar */}
              <div className="flex items-start justify-between py-3 gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {exercise.is_jota_original && (
                      <span className="text-[10px] font-black bg-gold/20 text-gold px-2 py-0.5 rounded-md">⭐ JOTA</span>
                    )}
                    {exercise.uses_band && (
                      <span className="text-[10px] font-black bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md">🪢 ELÁSTICO</span>
                    )}
                  </div>
                  <h2 className="font-display font-black text-xl leading-tight">{exercise.name}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={onToggleFav}
                    className={`p-2.5 rounded-xl transition-all ${isFavorite ? 'bg-red-400/10 text-red-400' : 'bg-muted/40 text-muted-foreground'}`}>
                    <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={onClose} className="p-2.5 rounded-xl bg-muted/40 text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap mb-4">
                {exercise.difficulty && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${LEVEL_BADGE[exercise.difficulty]}`}>
                    {LEVEL_LABEL[exercise.difficulty]}
                  </span>
                )}
                {exercise.exercise_type && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-muted/40 text-muted-foreground">
                    {TYPE_LABEL[exercise.exercise_type] || exercise.exercise_type}
                  </span>
                )}
                {exercise.primary_muscle && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                    {exercise.primary_muscle}
                  </span>
                )}
                {(exercise.equipment || exercise.equipment_needed || []).slice(0, 2).map(eq => (
                  <span key={eq} className="text-xs px-2.5 py-1 rounded-lg bg-muted/30 text-muted-foreground">{eq}</span>
                ))}
              </div>

              {/* Media */}
              {ytId ? (
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-muted/20">
                  <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full"
                    allow="autoplay; encrypted-media" allowFullScreen />
                </div>
              ) : exercise.gif_url ? (
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-muted/20">
                  <img src={exercise.gif_url} alt={exercise.name} className="w-full h-full object-contain" />
                </div>
              ) : exercise.image_url ? (
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-muted/20">
                  <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="rounded-2xl mb-4 aspect-video bg-muted/10 border border-border flex flex-col items-center justify-center gap-2">
                  <p className="text-4xl">💪</p>
                  <p className="text-xs text-muted-foreground">Tutorial em breve</p>
                </div>
              )}

              {/* Stats grid */}
              {(exercise.sets_recommended || exercise.rest_seconds || exercise.tracking_type) && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {exercise.sets_recommended && (
                    <div className="bg-muted/20 rounded-xl p-3 text-center">
                      <p className="font-display font-black text-primary text-sm">{exercise.sets_recommended}</p>
                      <p className="text-[10px] text-muted-foreground">Séries/Reps</p>
                    </div>
                  )}
                  {exercise.rest_seconds && (
                    <div className="bg-muted/20 rounded-xl p-3 text-center">
                      <p className="font-display font-black text-gold text-sm">{exercise.rest_seconds}s</p>
                      <p className="text-[10px] text-muted-foreground">Descanso</p>
                    </div>
                  )}
                  {exercise.tracking_type && (
                    <div className="bg-muted/20 rounded-xl p-3 text-center">
                      <p className="font-display font-black text-foreground text-[10px]">
                        {exercise.tracking_type === 'weight_reps' ? '⚖️ Carga' :
                         exercise.tracking_type === 'hold_time' ? '⏱ Tempo' :
                         exercise.tracking_type === 'assisted_bodyweight' ? '🪢 Elástico' : '💪 Reps'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Registro</p>
                    </div>
                  )}
                </div>
              )}

              {/* Muscles */}
              {(exercise.muscle_groups?.length > 0 || exercise.secondary_muscles?.length > 0) && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Músculos</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(exercise.muscle_groups || []).map(m => (
                      <span key={m} className="text-xs bg-muted/30 text-foreground px-2 py-1 rounded-lg">{m}</span>
                    ))}
                    {(exercise.secondary_muscles || []).map(m => (
                      <span key={m} className="text-xs bg-muted/20 text-muted-foreground px-2 py-1 rounded-lg">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {exercise.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{exercise.description}</p>
              )}

              {/* Instructions */}
              {exercise.instructions && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Como executar</p>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{exercise.instructions}</p>
                </div>
              )}

              {/* Band details */}
              {exercise.uses_band && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 mb-4 space-y-1.5">
                  <p className="text-xs font-bold text-green-400 mb-2">🪢 Informações do Elástico</p>
                  {exercise.band_usage_type && <p className="text-xs text-foreground">Uso: <span className="text-muted-foreground">{exercise.band_usage_type}</span></p>}
                  {exercise.band_assistance_level && <p className="text-xs text-foreground">Intensidade: <span className="text-muted-foreground">{BAND_LABEL[exercise.band_assistance_level]}</span></p>}
                  {exercise.band_anchor_point && <p className="text-xs text-foreground">Ancoragem: <span className="text-muted-foreground">{exercise.band_anchor_point}</span></p>}
                  {exercise.band_purpose && <p className="text-xs text-foreground">Propósito: <span className="text-muted-foreground">{exercise.band_purpose}</span></p>}
                </div>
              )}

              {/* Tips */}
              {exercise.tips && (
                <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 mb-3">
                  <p className="text-xs font-bold text-gold mb-1">💡 Dica de execução</p>
                  <p className="text-sm">{exercise.tips}</p>
                </div>
              )}

              {/* Mistakes */}
              {exercise.common_mistakes && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 mb-4">
                  <p className="text-xs font-bold text-destructive mb-1">⚠️ Erros comuns</p>
                  <p className="text-sm">{exercise.common_mistakes}</p>
                </div>
              )}

              {/* History toggle */}
              {user?.email && (
                <div className="mb-4">
                  <button onClick={() => setShowHistory(s => !s)}
                    className="w-full flex items-center justify-between bg-muted/20 border border-border rounded-xl px-4 py-3 hover:bg-muted/30 transition-all">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold">Meu histórico neste exercício</span>
                    </div>
                    {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2">
                        <ExerciseHistory exerciseId={exercise.id} email={user.email} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => onAddToRoutine && onAddToRoutine(exercise)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-4 rounded-2xl hover:bg-primary/90 transition-all"
              >
                <Plus className="w-5 h-5" /> Adicionar à Rotina
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}