/**
 * JotaStatusSelector — botão + dropdown para alterar consultant_status do aluno.
 */
import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useUpdateConsultantStatus } from '@/services';

const OPTIONS = [
  { value: 'ativo',     label: 'Ativo',     dot: 'bg-success' },
  { value: 'lead',      label: 'Lead',      dot: 'bg-blue-400' },
  { value: 'pausado',   label: 'Pausado',   dot: 'bg-gold' },
  { value: 'encerrado', label: 'Encerrado', dot: 'bg-muted-foreground' },
];

export default function JotaStatusSelector({ profile }) {
  const [open, setOpen] = useState(false);
  const current = profile.consultantStatus || 'ativo';

  const mutation = useUpdateConsultantStatus();

  const handleChange = (status) => {
    mutation.mutate({ profileId: profile.id, status }, { onSuccess: () => setOpen(false) });
  };

  const currentOpt = OPTIONS.find(o => o.value === current) || OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-bold bg-card border border-border rounded-xl px-3 py-2 hover:border-primary/30 transition-all"
      >
        <span className={`w-2 h-2 rounded-full ${currentOpt.dot}`} />
        <span className="capitalize">{currentOpt.label}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleChange(opt.value)}
                disabled={mutation.isPending}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/40 transition-colors text-left"
              >
                <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                <span className="capitalize flex-1">{opt.label}</span>
                {opt.value === current && <Check className="w-3 h-3 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}