/**
 * JotaRoutineForm — modal para criar/editar/duplicar rotina do aluno (visão Jota).
 * mode: 'create' | 'edit' | 'duplicate'
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { routineService } from '@/services';

const DAYS = [
  { key: 'seg', label: 'Seg' }, { key: 'ter', label: 'Ter' }, { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' }, { key: 'sex', label: 'Sex' }, { key: 'sab', label: 'Sáb' }, { key: 'dom', label: 'Dom' },
];

export default function JotaRoutineForm({ studentEmail, routine, mode = 'create', onClose }) {
  const queryClient = useQueryClient();
  const isEdit = mode === 'edit';
  const isDuplicate = mode === 'duplicate';

  const [name, setName] = useState(
    isDuplicate ? `${routine?.name || ''} (cópia)` : routine?.name || ''
  );
  const [description, setDescription] = useState(routine?.description || '');
  const [consultantNote, setConsultantNote] = useState(routine?.consultantNote || '');
  const [days, setDays] = useState(routine?.daysOfWeek || []);

  const toggleDay = (d) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description,
        daysOfWeek: days,
        consultantNote,
        studentEmail,
        createdByRole: 'jota',
      };
      if (isEdit && routine) return routineService.updateRoutine(routine.id, payload);

      const newRoutine = await routineService.createRoutine({ ...payload, isActive: false });
      if (isDuplicate && routine?.id) {
        await routineService.duplicateRoutineExercises(routine.id, newRoutine.id);
      }
      return newRoutine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      onClose();
    },
  });

  const title = isEdit ? 'Editar Rotina' : isDuplicate ? 'Duplicar Rotina' : 'Nova Rotina do Jota';

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-card">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>
        <div className="px-4 pb-8">
          <div className="flex items-center justify-between py-3">
            <h2 className="font-bold text-base">⭐ {title}</h2>
            <button onClick={onClose} className="p-2 rounded-xl bg-muted/40">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nome *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex: Upper A — Força + Puxada"
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-3 text-sm outline-none focus:border-primary/50" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Descrição</label>
              <input value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Foco, padrões, contexto..."
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-3 text-sm outline-none focus:border-primary/50" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nota para o aluno</label>
              <textarea value={consultantNote} onChange={e => setConsultantNote(e.target.value)}
                rows={3}
                placeholder="Ex: Prioridade na puxada. RIR 2 nas últimas séries."
                className="w-full bg-muted/20 border border-border rounded-xl px-3 py-3 text-sm outline-none focus:border-primary/50 resize-none" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-2">Dias da semana</label>
              <div className="flex gap-2">
                {DAYS.map(d => (
                  <button key={d.key} onClick={() => toggleDay(d.key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all
                      ${days.includes(d.key) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/20 border-border text-muted-foreground'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={!name.trim() || saveMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-4 rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-40"
            >
              <Check className="w-5 h-5" />
              {saveMutation.isPending ? 'Salvando…' : isEdit ? 'Salvar' : isDuplicate ? 'Duplicar' : 'Criar Rotina'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}