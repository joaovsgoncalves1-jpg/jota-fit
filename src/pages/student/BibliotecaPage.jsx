import React, { useState, useMemo } from 'react';
import { useCurrentUser, useExercises } from '@/services';
import { Search, Filter, Heart, Plus, X, ChevronDown, ChevronUp, Dumbbell, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExerciseDetailSheet from '@/components/biblioteca/ExerciseDetailSheet';
import AddToRoutineModal from '@/components/biblioteca/AddToRoutineModal';
import QuickFilterChips from '@/components/biblioteca/QuickFilterChips';
import MediaPlaceholder from '@/components/common/MediaPlaceholder';
import EmptyState from '@/components/common/EmptyState';

const MOVEMENT_FILTERS = [
  { key: '', label: 'Todos' },
  { key: 'puxar_vertical', label: '↑ Puxar' },
  { key: 'empurrar_horizontal', label: '→ Empurrar' },
  { key: 'agachamento', label: '🦵 Pernas' },
  { key: 'hinge', label: '🍑 Quadril' },
  { key: 'panturrilha', label: '🦶 Panturrilha' },
  { key: 'abducao_quadril', label: '↔ Abdução' },
  { key: 'core_flexao', label: '🔥 Core' },
  { key: 'isometria', label: '⏱ Isometria' },
  { key: 'mobilidade', label: '🤸 Mobilidade' },
  { key: 'skill', label: '⭐ Skill' },
  // legado
  { key: 'puxar', label: '↗ Puxar+' },
  { key: 'empurrar', label: '↙ Empurrar+' },
  { key: 'core', label: '🔥 Core+' },
  { key: 'pernas', label: '🦵 Pernas+' },
];

const LEVEL_FILTERS = [
  { key: 'beginner', label: 'Iniciante' },
  { key: 'intermediate', label: 'Intermediário' },
  { key: 'advanced', label: 'Avançado' },
];

const LOCATION_FILTERS = [
  { key: 'academia', label: '🏋️ Academia' },
  { key: 'casa', label: '🏠 Casa' },
  { key: 'parque', label: '🌳 Parque' },
  { key: 'barra', label: 'Barra fixa' },
  { key: 'paralelas', label: 'Paralelas' },
  { key: 'argolas', label: 'Argolas' },
  { key: 'solo', label: 'Solo' },
];

const TRACKING_FILTERS = [
  { key: 'weight_reps', label: '⚖️ Carga × Reps' },
  { key: 'bodyweight_reps', label: '💪 Peso corporal' },
  { key: 'assisted_bodyweight', label: '🪢 Assistido' },
  { key: 'hold_time', label: '⏱ Hold' },
  { key: 'mobility_time', label: '🤸 Mobilidade' },
];

const MUSCLE_FILTERS = [
  { key: '', label: 'Músculo' },
  { key: 'Peitoral', label: 'Peitoral' },
  { key: 'Costas', label: 'Costas' },
  { key: 'Dorsal', label: 'Dorsal' },
  { key: 'Ombros', label: 'Ombros' },
  { key: 'Bíceps', label: 'Bíceps' },
  { key: 'Tríceps', label: 'Tríceps' },
  { key: 'Abdômen', label: 'Abdômen' },
  { key: 'Glúteos', label: 'Glúteos' },
  { key: 'Quadríceps', label: 'Quadríceps' },
  { key: 'Posterior de coxa', label: 'Posterior' },
  { key: 'Panturrilhas', label: 'Panturrilha' },
  { key: 'Core', label: 'Core' },
];

const EQUIPMENT_FILTERS = [
  { key: '', label: 'Equip.' },
  { key: 'sem_equipamento', label: 'Sem equip.' },
  { key: 'peso corporal', label: 'Peso corporal' },
  { key: 'barra', label: 'Barra' },
  { key: 'paralelas', label: 'Paralelas' },
  { key: 'halteres', label: 'Halteres' },
  { key: 'barra livre', label: 'Barra livre' },
  { key: 'cabos/polia', label: 'Cabo/Polia' },
  { key: 'maquina', label: 'Máquina' },
  { key: 'elastico', label: 'Elástico' },
  { key: 'argolas', label: 'Argolas' },
  { key: 'kettlebell', label: 'Kettlebell' },
];

const TYPE_FILTERS = [
  { key: '', label: 'Tipo' },
  { key: 'musculacao', label: '🏋️ Musculação' },
  { key: 'calistenia', label: '💪 Calistenia' },
  { key: 'mobilidade', label: '🤸 Mobilidade' },
  { key: 'cardio', label: '🏃 Cardio' },
  { key: 'skill', label: '⭐ Skill' },
  { key: 'aquecimento', label: '🔥 Aquecimento' },
  { key: 'ativacao', label: '⚡ Ativação' },
];

const LEVEL_BADGE = {
  beginner: 'bg-success/20 text-success',
  intermediate: 'bg-primary/20 text-primary',
  advanced: 'bg-destructive/20 text-destructive',
};
const LEVEL_LABEL = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };

const PATTERN_EMOJI = {
  empurrar_horizontal: '→', empurrar_vertical: '↑', puxar_horizontal: '←', puxar_vertical: '↑',
  agachamento: '🦵', hinge: '🍑', lunge: '🚶', core_flexao: '🔥', isometria: '⏱', skill: '⭐',
  mobilidade: '🤸', puxar: '↗', empurrar: '↙', core: '🔥', pernas: '🦵',
};

export default function BibliotecaPage() {
  const { user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [movement, setMovement] = useState('');
  const [muscle, setMuscle] = useState('');
  const [equipment, setEquipment] = useState('');
  const [exType, setExType] = useState('');
  const [level, setLevel] = useState('');
  const [location, setLocation] = useState('');
  const [tracking, setTracking] = useState('');
  const [onlyBand, setOnlyBand] = useState(false);
  const [onlyJota, setOnlyJota] = useState(false);
  const [quickFilter, setQuickFilter] = useState(''); // calistenia | musculacao | band | jota
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [addToRoutineExercise, setAddToRoutineExercise] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jotafit_favs') || '[]'); } catch { return []; }
  });

  const { data: exercises, isLoading } = useExercises();

  const filtered = useMemo(() => {
    let list = exercises || [];

    // Quick filter (top chips)
    if (quickFilter === 'calistenia') list = list.filter(e => e.exerciseType === 'calistenia');
    else if (quickFilter === 'musculacao') list = list.filter(e => e.exerciseType === 'musculacao');
    else if (quickFilter === 'band') list = list.filter(e => e.usesBand);
    else if (quickFilter === 'jota') list = list.filter(e => e.verifiedByJota || e.isJotaOriginal);

    const q = search.toLowerCase();
    if (q) list = list.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.primaryMuscle?.toLowerCase().includes(q) ||
      (e.muscleGroups || []).some(m => m.toLowerCase().includes(q)) ||
      (e.secondaryMuscles || []).some(m => m.toLowerCase().includes(q))
    );
    if (movement) list = list.filter(e => e.movementPattern === movement);
    if (muscle) list = list.filter(e =>
      e.primaryMuscle === muscle ||
      (e.muscleGroups || []).includes(muscle) ||
      (e.secondaryMuscles || []).includes(muscle)
    );
    if (equipment) list = list.filter(e => (e.equipment || []).includes(equipment));
    if (exType) list = list.filter(e => e.exerciseType === exType);
    if (level) list = list.filter(e => e.difficulty === level);
    if (location) list = list.filter(e => (e.location || []).includes(location));
    if (tracking) list = list.filter(e => e.trackingType === tracking);
    if (onlyBand) list = list.filter(e => e.usesBand);
    if (onlyJota) list = list.filter(e => e.verifiedByJota || e.isJotaOriginal);
    return list;
  }, [exercises, search, movement, muscle, equipment, exType, level, location, tracking, onlyBand, onlyJota, quickFilter]);

  const toggleFav = (id) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('jotafit_favs', JSON.stringify(next));
      return next;
    });
  };

  const hasFilters = movement || muscle || equipment || exType || level || location || tracking || onlyBand || onlyJota;
  const clearFilters = () => {
    setMovement(''); setMuscle(''); setEquipment(''); setExType('');
    setLevel(''); setLocation(''); setTracking('');
    setOnlyBand(false); setOnlyJota(false);
  };
  const advancedCount = [muscle, equipment, exType, level, location, tracking, onlyBand && 'b', onlyJota && 'j'].filter(Boolean).length;

  // Show only first 12 unique movement keys
  const movementOptions = MOVEMENT_FILTERS.filter(m => {
    if (!m.key) return true;
    return (exercises || []).some(e => e.movement_pattern === m.key);
  }).slice(0, 12);

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-black">BIBLIOTECA</h1>
          <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg">
            {filtered.length} exercícios
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou músculo..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Quick filters: Calistenia · Musculação · Elástico · Jota */}
        <QuickFilterChips active={quickFilter} onToggle={setQuickFilter} />

        {/* Movement chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {movementOptions.map(p => (
            <button
              key={p.key}
              onClick={() => setMovement(movement === p.key ? '' : p.key)}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                ${movement === p.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filter toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
              ${advancedCount > 0 ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Mais filtros{advancedCount > 0 ? ` (${advancedCount})` : ''}
            {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground ml-auto">
              Limpar
            </button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-1 pb-2">
                {/* Type */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-1.5">Tipo</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {TYPE_FILTERS.filter(f => f.key).map(f => (
                      <button key={f.key} onClick={() => setExType(exType === f.key ? '' : f.key)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                          ${exType === f.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Muscle */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-1.5">Músculo</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {MUSCLE_FILTERS.filter(f => f.key).map(f => (
                      <button key={f.key} onClick={() => setMuscle(muscle === f.key ? '' : f.key)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                          ${muscle === f.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Equipment */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-1.5">Equipamento</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {EQUIPMENT_FILTERS.filter(f => f.key).map(f => (
                      <button key={f.key} onClick={() => setEquipment(equipment === f.key ? '' : f.key)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                          ${equipment === f.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Level */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-1.5">Nível</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {LEVEL_FILTERS.map(f => (
                      <button key={f.key} onClick={() => setLevel(level === f.key ? '' : f.key)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                          ${level === f.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Location */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-1.5">Local</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {LOCATION_FILTERS.map(f => (
                      <button key={f.key} onClick={() => setLocation(location === f.key ? '' : f.key)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                          ${location === f.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Tracking */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-1.5">Como registra</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {TRACKING_FILTERS.map(f => (
                      <button key={f.key} onClick={() => setTracking(tracking === f.key ? '' : f.key)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                          ${tracking === f.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Toggles */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setOnlyBand(b => !b)}
                    className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all
                      ${onlyBand ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-card border-border text-muted-foreground'}`}
                  >
                    🪢 Apenas com elástico
                  </button>
                  <button
                    onClick={() => setOnlyJota(j => !j)}
                    className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all
                      ${onlyJota ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-card border-border text-muted-foreground'}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verificado pelo Jota
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exercise list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map((ex, i) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.25) }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <button className="w-full p-3.5 text-left" onClick={() => setSelectedExercise(ex)}>
                <div className="flex items-center gap-3">
                  {/* Thumb / icon */}
                  {ex.gifUrl || ex.imageUrl || ex.thumbnailUrl ? (
                    <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={ex.gifUrl || ex.imageUrl || ex.thumbnailUrl}
                        alt={ex.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <MediaPlaceholder exercise={ex} variant="thumb" className="shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {ex.isJotaOriginal && (
                        <span className="text-[9px] font-black bg-gold/20 text-gold px-1.5 py-0.5 rounded-md">JOTA</span>
                      )}
                      {ex.verifiedByJota && !ex.isJotaOriginal && (
                        <span className="text-[9px] font-black bg-gold/15 text-gold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> JOTA
                        </span>
                      )}
                      {ex.usesBand && (
                        <span className="text-[9px] font-black bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-md">🪢</span>
                      )}
                    </div>
                    <p className="font-bold text-sm leading-tight">{ex.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {ex.difficulty && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${LEVEL_BADGE[ex.difficulty]}`}>
                          {LEVEL_LABEL[ex.difficulty]}
                        </span>
                      )}
                      {(ex.primaryMuscle || (ex.muscleGroups || [])[0]) && (
                        <span className="text-[10px] text-muted-foreground">
                          {ex.primaryMuscle || ex.muscleGroups[0]}
                        </span>
                      )}
                      {ex.setsRecommended && (
                        <span className="text-[10px] text-muted-foreground">· {ex.setsRecommended}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
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

          {filtered.length === 0 && !isLoading && (
            <EmptyState
              icon={Dumbbell}
              title="Nenhum exercício encontrado"
              description="Tente outro músculo, equipamento ou limpe os filtros para ver tudo."
              action={hasFilters ? { label: 'Limpar filtros', onClick: clearFilters } : null}
              tone="subtle"
            />
          )}
        </div>
      )}

      <ExerciseDetailSheet
        exercise={selectedExercise}
        open={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onAddToRoutine={(ex) => { setSelectedExercise(null); setAddToRoutineExercise(ex); }}
        onSwitchExercise={(ex) => setSelectedExercise(ex)}
        isFavorite={selectedExercise ? favorites.includes(selectedExercise.id) : false}
        onToggleFav={() => selectedExercise && toggleFav(selectedExercise.id)}
      />

      <AddToRoutineModal
        exercise={addToRoutineExercise}
        open={!!addToRoutineExercise}
        onClose={() => setAddToRoutineExercise(null)}
      />
    </div>
  );
}