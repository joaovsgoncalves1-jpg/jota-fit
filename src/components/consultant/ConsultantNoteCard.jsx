import React from 'react';
import { format } from 'date-fns';

const TYPE_LABELS = {
  geral: { label: 'Geral', color: 'bg-muted/40 text-muted-foreground' },
  ajuste_de_treino: { label: 'Ajuste de Treino', color: 'bg-primary/15 text-primary' },
  feedback_tecnico: { label: 'Feedback Técnico', color: 'bg-blue-400/15 text-blue-400' },
  progressao: { label: 'Progressão', color: 'bg-success/15 text-success' },
  recuperacao: { label: 'Recuperação', color: 'bg-gold/15 text-gold' },
  dieta_observacao: { label: 'Dieta', color: 'bg-purple-400/15 text-purple-400' },
  motivacional: { label: 'Motivacional', color: 'bg-success/15 text-success' },
  alerta: { label: 'Alerta', color: 'bg-destructive/15 text-destructive' },
  revisao_semanal: { label: 'Revisão Semanal', color: 'bg-gold/15 text-gold' },
};

const PRIORITY_DOT = {
  baixa: 'bg-muted-foreground',
  media: 'bg-gold',
  alta: 'bg-destructive',
};

export default function ConsultantNoteCard({ note }) {
  const typeInfo = TYPE_LABELS[note.note_type] || TYPE_LABELS.geral;

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[note.priority] || 'bg-muted-foreground'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {note.created_at ? format(new Date(note.created_at), 'dd/MM/yyyy') : ''}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{note.note}</p>
        </div>
      </div>
    </div>
  );
}