/**
 * consultantService — notas do consultor e ações de coach.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from './_base/baseClient';
import { toConsultantNote, mapArray } from './_base/mappers';

const mapNotes = mapArray(toConsultantNote);

export async function listNotes(studentEmail) {
  if (!studentEmail) return [];
  const list = await db.ConsultantNote.filter({ student_email: studentEmail });
  return mapNotes(list).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );
}

export async function createNote({ studentEmail, note, noteType = 'geral', priority = 'media', visibleToStudent = true, createdBy }) {
  const created = await db.ConsultantNote.create({
    student_email: studentEmail,
    note, note_type: noteType, priority,
    visible_to_student: visibleToStudent,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  });
  return toConsultantNote(created);
}

export async function deleteNote(id) {
  return db.ConsultantNote.delete(id);
}

// ──────────────────────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────────────────────

export function useConsultantNotes(studentEmail) {
  return useQuery({
    queryKey: ['consultant', 'notes', studentEmail],
    queryFn: () => listNotes(studentEmail),
    enabled: !!studentEmail,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNote,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['consultant', 'notes', vars.studentEmail] }),
  });
}