import React, { useState } from 'react';
import { useCurrentUser } from '@/services';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Plus, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import ExerciseStatsPanel from './ExerciseStatsPanel';
import ProgressionPath from './ProgressionPath';
import BandGuide from './BandGuide';
import MediaPlaceholder from '@/components/common/MediaPlaceholder';

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

export default function ExerciseDetailSheet({ exercise, open, onClose, onAddToRoutine, onSwitchExercise, isFavorite, onToggleFav }) {
  const { user } = useCurrentUser();
  const [showHistory, setShowHistory] = useState(false);
  const ytId = getYoutubeId(exercise?.videoUrl);

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
                    {exercise.isJotaOriginal && (
                      <span className="text-[10px] font-black bg-gold/20 text-gold px-2 py-0.5 rounded-md">⭐ JOTA</span>
                    )}
                    {exercise.verifiedByJota && !exercise.isJotaOriginal && (
                      <span className="text-[10px] font-black bg-gold/15 text-gold px-2 py-0.5 rounded-md">✓ VERIFICADO PELO JOTA</span>
                    )}
                    {exercise.usesBand && (
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
                {exercise.exerciseType && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-muted/40 text-muted-foreground">
                    {TYPE_LABEL[exercise.exerciseType] || exercise.exerciseType}
                  </span>
                )}
                {exercise.primaryMuscle && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                    {exercise.primaryMuscle}
                  </span>
                )}
                {(exercise.equipment || []).slice(0, 2).map(eq => (
                  <span key={eq} className="text-xs px-2.5 py-1 rounded-lg bg-muted/30 text-muted-foreground">{eq}</span>
                ))}
              </div>

              {/* Media — placeholder premium se não houver mídia */}
              {ytId ? (
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-muted/20">
                  <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full"
                    allow="autoplay; encrypted-media" allowFullScreen />
                </div>
              ) : exercise.gifUrl ? (
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-muted/20">
                  <img src={exercise.gifUrl} alt={exercise.name} className="w-full h-full object-contain" />
                </div>
              ) : exercise.imageUrl || exercise.thumbnailUrl ? (
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-muted/20">
                  <img src={exercise.imageUrl || exercise.thumbnailUrl} alt={exercise.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <MediaPlaceholder exercise={exercise} variant="wide" className="mb-4" />
              )}

              {/* Stats grid */}
              {(exercise.setsRecommended || exercise.restSeconds || exercise.trackingType) && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {exercise.setsRecommended && (
                    <div className="bg-muted/20 rounded-xl p-3 text-center">
                      <p className="font-display font-black text-primary text-sm">{exercise.setsRecommended}</p>
                      <p className="text-[10px] text-muted-foreground">Séries/Reps</p>
                    </div>
                  )}
                  {exercise.restSeconds && (
                    <div className="bg-muted/20 rounded-xl p-3 text-center">
                      <p className="font-display font-black text-gold text-sm">{exercise.restSeconds}s</p>
                      <p className="text-[10px] text-muted-foreground">Descanso</p>
                    </div>
                  )}
                  {exercise.trackingType && (
                    <div className="bg-muted/20 rounded-xl p-3 text-center">
                      <p className="font-display font-black text-foreground text-[10px]">
                        {exercise.trackingType === 'weight_reps' ? '⚖️ Carga' :
                         exercise.trackingType === 'hold_time' ? '⏱ Tempo' :
                         exercise.trackingType === 'assisted_bodyweight' ? '🪢 Elástico' : '💪 Reps'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Registro</p>
                    </div>
                  )}
                </div>
              )}

              {/* Muscles */}
              {(exercise.muscleGroups?.length > 0 || exercise.secondaryMuscles?.length > 0) && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Músculos</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(exercise.muscleGroups || []).map(m => (
                      <span key={m} className="text-xs bg-muted/30 text-foreground px-2 py-1 rounded-lg">{m}</span>
                    ))}
                    {(exercise.secondaryMuscles || []).map(m => (
                      <span key={m} className="text-xs bg-muted/20 text-muted-foreground px-2 py-1 rounded-lg">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Progression path (calistenia / skill) */}
              <ProgressionPath
                exerciseId={exercise.id}
                onSelectExercise={(ex) => onSwitchExercise?.(ex)}
              />

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

              {/* Band guide — sistema central de elásticos */}
              {(exercise.usesBand || exercise.trackingType === 'assisted_bodyweight') && (
                <BandGuide exercise={exercise} />
              )}

              {/* Mistakes/Tips */}
              {exercise.commonMistakes && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 mb-3">
                  <p className="text-xs font-bold text-destructive mb-1">⚠️ Erros comuns</p>
                  <p className="text-sm">{exercise.commonMistakes}</p>
                </div>
              )}

              {exercise.tips && (
                <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 mb-3">
                  <p className="text-xs font-bold text-gold mb-1">💡 Dica de execução</p>
                  <p className="text-sm">{exercise.tips}</p>
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
                        <ExerciseStatsPanel exerciseId={exercise.id} email={user.email} trackingType={exercise.trackingType} />
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