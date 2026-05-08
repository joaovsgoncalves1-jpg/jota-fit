/**
 * BandSelector — seletor de nível + cor de elástico, compacto, usado em SetRow.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { BAND_ORDER, BAND_LABEL, BAND_COLORS } from '@/lib/bands';

export default function BandSelector({ level, color, onChangeLevel, onChangeColor, disabled, compact = true }) {
  const [open, setOpen] = useState(false);

  const selectedColor = BAND_COLORS.find(c => c.key === color);

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-1.5 bg-muted/30 border border-border/60 rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-primary/60 disabled:opacity-40 transition-colors ${
          level ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedColor && (
            <span
              className="w-3 h-3 rounded-full border border-white/10 shrink-0"
              style={{ backgroundColor: selectedColor.hex }}
            />
          )}
          <span className="truncate">
            {level ? `🪢 ${BAND_LABEL[level]}${color ? ` · ${selectedColor?.label || color}` : ''}` : '🪢 Sem elástico'}
          </span>
        </div>
        <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full mt-1 z-40 bg-card border border-border rounded-xl shadow-2xl p-2 max-h-72 overflow-y-auto"
            >
              {/* Level */}
              <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground px-1 mb-1">
                Nível
              </p>
              <div className="grid grid-cols-2 gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => { onChangeLevel(''); onChangeColor?.(''); setOpen(false); }}
                  className={`text-[10px] font-bold py-2 rounded-lg border transition-all ${
                    !level ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-muted/30 border-border/40 text-muted-foreground'
                  }`}
                >
                  Sem elástico
                </button>
                {BAND_ORDER.map(b => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => onChangeLevel(b)}
                    className={`text-[10px] font-bold py-2 rounded-lg border transition-all ${
                      level === b ? 'bg-green-500/15 border-green-500/40 text-green-400' : 'bg-muted/30 border-border/40 text-muted-foreground'
                    }`}
                  >
                    {BAND_LABEL[b]}
                  </button>
                ))}
              </div>

              {/* Color */}
              {level && onChangeColor && (
                <>
                  <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground px-1 mb-1">
                    Cor
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {BAND_COLORS.map(c => (
                      <button
                        type="button"
                        key={c.key}
                        onClick={() => { onChangeColor(c.key); setOpen(false); }}
                        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-all ${
                          color === c.key ? 'border-primary/60 bg-primary/10' : 'border-border/40 bg-muted/20'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white/10"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[9px] font-bold text-foreground leading-tight">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}