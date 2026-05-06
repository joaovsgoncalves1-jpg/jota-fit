import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Lightbulb, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Iniciante', color: 'text-success bg-success/20 border-success/30', dot: 'bg-success' },
  intermediate: { label: 'Intermediário', color: 'text-gold bg-gold/20 border-gold/30', dot: 'bg-gold' },
  advanced: { label: 'Avançado', color: 'text-destructive bg-destructive/20 border-destructive/30', dot: 'bg-destructive' },
};

const MUSCLE_COLORS = [
  'bg-primary/20 text-primary',
  'bg-gold/20 text-gold',
  'bg-success/20 text-success',
  'bg-epic/20 text-epic',
  'bg-destructive/20 text-destructive',
];

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function ExerciseModal({ exercise, open, onClose }) {
  if (!exercise) return null;
  const diff = DIFFICULTY_CONFIG[exercise.difficulty] || DIFFICULTY_CONFIG.beginner;
  const ytId = getYouTubeId(exercise.video_url);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {/* Video / Thumbnail */}
            <div className="w-full aspect-video bg-[#0d0d0d] relative overflow-hidden">
              {ytId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={exercise.name}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Dumbbell className="w-10 h-10 opacity-30" />
                  <p className="text-xs">Sem vídeo disponível</p>
                </div>
              )}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name + difficulty */}
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display font-black text-xl text-foreground leading-tight flex-1">{exercise.name}</h2>
                {exercise.difficulty && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${diff.color}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${diff.dot}`} />
                    {diff.label}
                  </span>
                )}
              </div>

              {/* Muscle groups */}
              {exercise.muscle_groups?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {exercise.muscle_groups.map((m, i) => (
                    <span key={m} className={`text-xs font-bold px-2.5 py-1 rounded-full ${MUSCLE_COLORS[i % MUSCLE_COLORS.length]}`}>
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {exercise.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{exercise.description}</p>
              )}

              {/* Sets + rest */}
              <div className="grid grid-cols-2 gap-3">
                {exercise.sets_recommended && (
                  <div className="bg-muted rounded-2xl p-3 text-center">
                    <p className="font-display font-black text-gold text-lg">{exercise.sets_recommended}</p>
                    <p className="text-[10px] text-muted-foreground">Séries x Reps</p>
                  </div>
                )}
                {exercise.rest_seconds && (
                  <div className="bg-muted rounded-2xl p-3 text-center">
                    <p className="font-display font-black text-primary text-lg">{exercise.rest_seconds}s</p>
                    <p className="text-[10px] text-muted-foreground">Descanso</p>
                  </div>
                )}
              </div>

              {/* Equipment */}
              {exercise.equipment_needed?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Equipamento</p>
                  <div className="flex flex-wrap gap-2">
                    {exercise.equipment_needed.map(eq => (
                      <span key={eq} className="text-xs bg-secondary px-3 py-1 rounded-full text-foreground border border-border">
                        🏋️ {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {exercise.tips && (
                <div className="bg-gold/10 border border-gold/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-gold" />
                    <p className="text-xs font-bold text-gold uppercase tracking-wide">Dicas de Execução</p>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{exercise.tips}</p>
                </div>
              )}

              <Button onClick={onClose} className="w-full h-12 rounded-2xl font-bold bg-primary hover:bg-primary/90">
                Fechar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}