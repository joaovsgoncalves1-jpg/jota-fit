import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Plus, ExternalLink } from 'lucide-react';

const LEVEL_BADGE = {
  beginner: 'bg-success/20 text-success',
  intermediate: 'bg-primary/20 text-primary',
  advanced: 'bg-destructive/20 text-destructive',
};
const LEVEL_LABEL = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };

function getYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
  return m ? m[1] : null;
}

export default function ExerciseDetailSheet({ exercise, open, onClose, onAddToRoutine, isFavorite, onToggleFav }) {
  const ytId = getYoutubeId(exercise?.video_url);

  return (
    <AnimatePresence>
      {open && exercise && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            <div className="px-4 pb-8">
              {/* Top bar */}
              <div className="flex items-center justify-between py-3">
                <h2 className="font-display font-black text-lg pr-4">{exercise.name}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={onToggleFav} className={`p-2 rounded-xl transition-all ${isFavorite ? 'bg-red-400/10 text-red-400' : 'bg-muted/40 text-muted-foreground'}`}>
                    <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={onClose} className="p-2 rounded-xl bg-muted/40 text-muted-foreground hover:text-foreground transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-2 flex-wrap mb-4">
                {exercise.difficulty && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${LEVEL_BADGE[exercise.difficulty] || 'bg-muted text-muted-foreground'}`}>
                    {LEVEL_LABEL[exercise.difficulty] || exercise.difficulty}
                  </span>
                )}
                {(exercise.equipment_needed || []).map(eq => (
                  <span key={eq} className="text-xs font-bold px-2 py-1 rounded-lg bg-muted/40 text-muted-foreground">{eq}</span>
                ))}
                {exercise.movement_pattern && (
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-primary/10 text-primary">{exercise.movement_pattern}</span>
                )}
              </div>

              {/* Video */}
              {ytId && (
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-muted/20">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              )}
              {!ytId && exercise.image_url && (
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-muted/20">
                  <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Description */}
              {exercise.description && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{exercise.description}</p>
                </div>
              )}

              {/* Stats grid */}
              {(exercise.sets_recommended || exercise.rest_seconds) && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {exercise.sets_recommended && (
                    <div className="bg-muted/20 rounded-xl p-3 text-center">
                      <p className="font-display font-black text-primary text-base">{exercise.sets_recommended}</p>
                      <p className="text-xs text-muted-foreground">Séries/Reps</p>
                    </div>
                  )}
                  {exercise.rest_seconds && (
                    <div className="bg-muted/20 rounded-xl p-3 text-center">
                      <p className="font-display font-black text-gold text-base">{exercise.rest_seconds}s</p>
                      <p className="text-xs text-muted-foreground">Descanso</p>
                    </div>
                  )}
                </div>
              )}

              {/* Muscle groups */}
              {exercise.muscle_groups?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Músculos</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {exercise.muscle_groups.map(m => (
                      <span key={m} className="text-xs bg-muted/30 text-foreground px-2 py-1 rounded-lg">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {exercise.tips && (
                <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 mb-3">
                  <p className="text-xs font-bold text-gold mb-1">💡 Dica de execução</p>
                  <p className="text-sm text-foreground">{exercise.tips}</p>
                </div>
              )}

              {/* Common mistakes */}
              {exercise.common_mistakes && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 mb-4">
                  <p className="text-xs font-bold text-destructive mb-1">⚠️ Erros comuns</p>
                  <p className="text-sm text-foreground">{exercise.common_mistakes}</p>
                </div>
              )}

              {/* Add to routine CTA */}
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