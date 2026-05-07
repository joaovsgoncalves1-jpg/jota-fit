import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Search, Filter, Heart, Plus, X, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExerciseDetailSheet from '@/components/biblioteca/ExerciseDetailSheet';
import AddToRoutineModal from '@/components/biblioteca/AddToRoutineModal';

const PATTERNS = [
  { key: '', label: 'Todos' },
  { key: 'puxar', label: '↗ Puxar' },
  { key: 'empurrar', label: '↙ Empurrar' },
  { key: 'core', label: '🔥 Core' },
  { key: 'pernas', label: '🦵 Pernas' },
  { key: 'mobilidade', label: '🤸 Mobilidade' },
  { key: 'skill', label: '⭐ Skill' },
];

const LEVELS = [
  { key: '', label: 'Nível' },
  { key: 'beginner', label: 'Iniciante' },
  { key: 'intermediate', label: 'Intermediário' },
  { key: 'advanced', label: 'Avançado' },
];

const EQUIPMENT = [
  { key: '', label: 'Equipamento' },
  { key: 'sem_equipamento', label: 'Sem equipamento' },
  { key: 'barra', label: 'Barra' },
  { key: 'paralelas', label: 'Paralelas' },
  { key: 'elastico', label: 'Elástico' },
  { key: 'argolas', label: 'Argolas' },
];

const LEVEL_BADGE = {
  beginner: 'bg-success/20 text-success',
  intermediate: 'bg-primary/20 text-primary',
  advanced: 'bg-destructive/20 text-destructive',
};

const LEVEL_LABEL = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export default function BibliotecaPage() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pattern, setPattern] = useState('');
  const [level, setLevel] = useState('');
  const [equipment, setEquipment] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [addToRoutineExercise, setAddToRoutineExercise] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jotafit_favs') || '[]'); } catch { return []; }
  });

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['all-exercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const filtered = useMemo(() => {
    let list = exercises || [];
    if (search) list = list.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()));
    if (pattern) list = list.filter(e => e.movement_pattern === pattern);
    if (level) list = list.filter(e => e.difficulty === level);
    if (equipment) list = list.filter(e => (e.equipment_needed || []).includes(equipment));
    return list;
  }, [exercises, search, pattern, level, equipment]);

  const toggleFav = (id) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('jotafit_favs', JSON.stringify(next));
      return next;
    });
  };

  const hasFilters = pattern || level || equipment;

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <h1 className="font-display text-xl font-black">BIBLIOTECA</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar exercício..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Pattern scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {PATTERNS.map(p => (
            <button
              key={p.key}
              onClick={() => setPattern(p.key)}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                ${pattern === p.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Secondary filters toggle */}
        <button
          onClick={() => setShowFilters(s => !s)}
          className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
            ${hasFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'}`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros {hasFilters ? '•' : ''}
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 flex-wrap pt-1">
                {LEVELS.filter(l => l.key).map(l => (
                  <button key={l.key} onClick={() => setLevel(level === l.key ? '' : l.key)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                      ${level === l.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}>
                    {l.label}
                  </button>
                ))}
                {EQUIPMENT.filter(e => e.key).map(e => (
                  <button key={e.key} onClick={() => setEquipment(equipment === e.key ? '' : e.key)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                      ${equipment === e.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}>
                    {e.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-muted-foreground">{filtered.length} exercícios</p>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map((ex, i) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <button
                className="w-full p-4 text-left"
                onClick={() => setSelectedExercise(ex)}
              >
                <div className="flex items-start gap-3">
                  {/* Thumb */}
                  <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden">
                    {ex.image_url
                      ? <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" />
                      : <span className="text-xl">💪</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{ex.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {ex.difficulty && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${LEVEL_BADGE[ex.difficulty] || 'bg-muted text-muted-foreground'}`}>
                          {LEVEL_LABEL[ex.difficulty] || ex.difficulty}
                        </span>
                      )}
                      {ex.sets_recommended && (
                        <span className="text-[10px] text-muted-foreground">{ex.sets_recommended}</span>
                      )}
                    </div>
                    {ex.muscle_groups?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {ex.muscle_groups.slice(0, 3).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); toggleFav(ex.id); }}
                      className={`p-1.5 rounded-lg transition-all ${favorites.includes(ex.id) ? 'text-red-400 bg-red-400/10' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Heart className="w-4 h-4" fill={favorites.includes(ex.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setAddToRoutineExercise(ex); }}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-sm font-bold">Nenhum exercício encontrado</p>
              <p className="text-xs mt-1">Tente outro filtro ou termo</p>
            </div>
          )}
        </div>
      )}

      {/* Detail sheet */}
      <ExerciseDetailSheet
        exercise={selectedExercise}
        open={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onAddToRoutine={(ex) => { setSelectedExercise(null); setAddToRoutineExercise(ex); }}
        isFavorite={selectedExercise ? favorites.includes(selectedExercise.id) : false}
        onToggleFav={() => selectedExercise && toggleFav(selectedExercise.id)}
      />

      {/* Add to routine modal */}
      <AddToRoutineModal
        exercise={addToRoutineExercise}
        open={!!addToRoutineExercise}
        onClose={() => setAddToRoutineExercise(null)}
      />
    </div>
  );
}