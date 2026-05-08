/**
 * QuickFilterChips — chips de destaque no topo da Biblioteca.
 * Calistenia · Musculação · Elástico · Verificado Jota
 */
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const CHIPS = [
  { key: 'calistenia',  label: 'Calistenia',  emoji: '💪',  active: 'bg-blue-500/15 border-blue-500/40 text-blue-400' },
  { key: 'musculacao',  label: 'Musculação',  emoji: '🏋️',  active: 'bg-primary/15 border-primary/40 text-primary' },
  { key: 'band',        label: 'Elástico',    emoji: '🪢',  active: 'bg-green-500/15 border-green-500/40 text-green-400' },
  { key: 'jota',        label: 'Jota',        icon: CheckCircle2, active: 'bg-gold/15 border-gold/40 text-gold' },
];

export default function QuickFilterChips({ active, onToggle }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {CHIPS.map(c => {
        const isOn = active === c.key;
        const Icon = c.icon;
        return (
          <button
            key={c.key}
            onClick={() => onToggle(isOn ? '' : c.key)}
            className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-2xl border transition-all
              ${isOn ? c.active : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
          >
            {Icon ? <Icon className="w-3.5 h-3.5" /> : <span className="text-sm leading-none">{c.emoji}</span>}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}