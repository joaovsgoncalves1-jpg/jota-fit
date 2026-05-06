import React from 'react';

export default function StreakBadge({ days, size = 'md' }) {
  const active = days > 0;
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full font-bold ${sizes[size]}
      ${active 
        ? 'bg-primary/15 text-primary' 
        : 'bg-muted text-muted-foreground'
      }`}
    >
      <span className={active ? '' : 'grayscale opacity-50'}>🔥</span>
      <span>{days} {days === 1 ? 'dia' : 'dias'}</span>
    </div>
  );
}