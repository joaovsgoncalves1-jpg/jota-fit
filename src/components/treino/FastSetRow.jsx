import React, { useState, useRef } from 'react';
import { CheckCircle, Copy, Minus, Plus } from 'lucide-react';

const BAND_OPTIONS = [
  { key: 'muito_forte', label: 'M.Forte', color: 'text-red-400' },
  { key: 'forte', label: 'Forte', color: 'text-orange-400' },
  { key: 'medio', label: 'Médio', color: 'text-yellow-400' },
  { key: 'leve', label: 'Leve', color: 'text-green-400' },
];

function NumericStepper({ value, onChange, step = 1, min = 0, label, unit, large }) {
  return (
    <div>
      {label && <p className="text-[10px] text-muted-foreground mb-1">{label}</p>}
      <div className="flex items-center gap-1">
        <button
          onPointerDown={() => onChange(Math.max(min, parseFloat(value || 0) - step))}
          className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center active:bg-muted/70 transition-all shrink-0"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          type="number"
          inputMode="decimal"
          className={`flex-1 bg-card border border-border rounded-lg px-1 text-center outline-none focus:border-primary/60 font-bold ${large ? 'py-2 text-xl' : 'py-1.5 text-sm'}`}
        />
        <button
          onPointerDown={() => onChange(parseFloat(value || 0) + step)}
          className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center active:bg-muted/70 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {unit && <p className="text-[10px] text-muted-foreground text-center mt-0.5">{unit}</p>}
    </div>
  );
}

export default function FastSetRow({ setNum, trackingType, lastSet, onComplete, isActive }) {
  const [weight, setWeight] = useState(lastSet?.weight_kg?.toString() || '');
  const [reps, setReps] = useState(lastSet?.reps?.toString() || '');
  const [duration, setDuration] = useState(lastSet?.duration_seconds?.toString() || '');
  const [band, setBand] = useState(lastSet?.band_assistance_level || 'medio');
  const [done, setDone] = useState(false);

  const copyLast = () => {
    if (lastSet?.weight_kg) setWeight(lastSet.weight_kg.toString());
    if (lastSet?.reps) setReps(lastSet.reps.toString());
    if (lastSet?.duration_seconds) setDuration(lastSet.duration_seconds.toString());
    if (lastSet?.band_assistance_level) setBand(lastSet.band_assistance_level);
  };

  const handleDone = () => {
    setDone(true);
    onComplete({
      set_number: setNum,
      weight_kg: parseFloat(weight) || undefined,
      reps: parseInt(reps) || undefined,
      duration_seconds: parseInt(duration) || undefined,
      band_assistance_level: (trackingType === 'assisted_bodyweight') ? band : undefined,
    });
  };

  if (done) {
    return (
      <div className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-xl px-3 py-2.5">
        <CheckCircle className="w-5 h-5 text-success shrink-0" />
        <span className="text-sm font-bold text-success flex-1">
          Série {setNum}:&nbsp;
          {trackingType === 'weight_reps' && weight && reps && `${weight}kg × ${reps}`}
          {trackingType === 'bodyweight_reps' && reps && `${reps} reps`}
          {trackingType === 'assisted_bodyweight' && `El.${band} × ${reps || '—'}`}
          {trackingType === 'hold_time' && duration && `${duration}s`}
        </span>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-3 space-y-3 transition-all ${isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-primary">SÉRIE {setNum}</p>
        {lastSet && (
          <button onClick={copyLast} className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground bg-muted/40 px-2 py-1 rounded-lg transition-all">
            <Copy className="w-3 h-3" /> Copiar última
          </button>
        )}
      </div>

      {trackingType === 'weight_reps' && (
        <div className="grid grid-cols-2 gap-2">
          <NumericStepper value={weight} onChange={v => setWeight(v.toString())} step={2.5} label="Carga (kg)" />
          <NumericStepper value={reps} onChange={v => setReps(v.toString())} step={1} label="Reps" />
        </div>
      )}

      {trackingType === 'bodyweight_reps' && (
        <NumericStepper value={reps} onChange={v => setReps(v.toString())} step={1} label="Reps" large />
      )}

      {trackingType === 'assisted_bodyweight' && (
        <div className="space-y-2">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Elástico</p>
            <div className="grid grid-cols-4 gap-1">
              {BAND_OPTIONS.map(b => (
                <button key={b.key} onClick={() => setBand(b.key)}
                  className={`text-[10px] font-bold py-1.5 rounded-lg border transition-all
                    ${band === b.key ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-card border-border text-muted-foreground'}`}>
                  {b.label}
                </button>
              ))}
            </div>
            {band === 'leve' && (
              <p className="text-[10px] text-green-400 mt-1">💡 Menos assistência = mais força real. Tente sem elástico em breve!</p>
            )}
          </div>
          <NumericStepper value={reps} onChange={v => setReps(v.toString())} step={1} label="Reps" large />
        </div>
      )}

      {trackingType === 'hold_time' && (
        <NumericStepper value={duration} onChange={v => setDuration(v.toString())} step={5} label="Tempo (s)" large />
      )}

      <button onClick={handleDone}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black py-3 rounded-xl hover:bg-primary/90 active:scale-[0.97] transition-all text-sm">
        <CheckCircle className="w-4 h-4" /> Registrar série
      </button>
    </div>
  );
}