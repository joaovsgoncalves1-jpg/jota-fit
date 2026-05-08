/**
 * EmptyState — estado vazio premium e reutilizável.
 * Mantém a identidade visual do app (cards arredondados, hierarquia tipográfica).
 *
 * Props:
 *  - icon: ícone Lucide (componente)
 *  - emoji: string (alternativa ao ícone)
 *  - title: principal
 *  - description: texto secundário
 *  - action: { label, onClick } opcional
 *  - tone: 'default' | 'subtle' (subtle = sem border, mais discreto)
 */
import React from 'react';

export default function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  tone = 'default',
  className = '',
}) {
  const toneCls = tone === 'subtle'
    ? 'bg-muted/15'
    : 'bg-card border border-border';

  return (
    <div className={`rounded-2xl ${toneCls} px-6 py-10 text-center ${className}`}>
      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center">
        {Icon ? (
          <Icon className="w-6 h-6 text-muted-foreground" />
        ) : (
          <span className="text-2xl">{emoji || '✨'}</span>
        )}
      </div>
      {title && <p className="font-bold text-sm mb-1">{title}</p>}
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}