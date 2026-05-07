import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const NOTE_TYPES = [
  { value: 'geral', label: 'Geral' },
  { value: 'ajuste_de_treino', label: 'Ajuste de Treino' },
  { value: 'feedback_tecnico', label: 'Feedback Técnico' },
  { value: 'progressao', label: 'Progressão' },
  { value: 'recuperacao', label: 'Recuperação' },
  { value: 'dieta_observacao', label: 'Dieta' },
  { value: 'motivacional', label: 'Motivacional' },
  { value: 'alerta', label: 'Alerta' },
  { value: 'revisao_semanal', label: 'Revisão Semanal' },
];

export default function AddConsultantNoteModal({ studentEmail, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    note: '',
    note_type: 'geral',
    priority: 'media',
    visible_to_student: true,
  });

  const mutation = useMutation({
    mutationFn: () => base44.entities.ConsultantNote.create({
      student_email: studentEmail,
      ...form,
      created_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-notes', studentEmail] });
      onClose();
    },
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
          className="relative w-full max-w-lg bg-card border border-border rounded-t-3xl md:rounded-3xl p-6 z-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-base">NOVA NOTA</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Tipo</label>
            <select value={form.note_type} onChange={e => setForm(p => ({ ...p, note_type: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50">
              {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Prioridade</label>
            <div className="flex gap-2">
              {['baixa', 'media', 'alta'].map(p => (
                <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold capitalize transition-all
                    ${form.priority === p ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border bg-secondary text-muted-foreground'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Nota</label>
            <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="Ex: Pull-up evoluiu bem. Próxima semana testar elástico leve..."
              rows={4}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary/50 resize-none" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="visible" checked={form.visible_to_student}
              onChange={e => setForm(p => ({ ...p, visible_to_student: e.target.checked }))}
              className="w-4 h-4 accent-primary" />
            <label htmlFor="visible" className="text-xs text-muted-foreground">Visível para o aluno</label>
          </div>

          <button onClick={() => mutation.mutate()} disabled={!form.note || mutation.isPending}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl disabled:opacity-50 transition-all">
            {mutation.isPending ? 'Salvando...' : 'Salvar Nota'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}