/**
 * Instala rotinas PPL híbrido (2x push, 2x pull, 1x pernas) para o aluno.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listAllExercises } from './exerciseService';
import * as routineService from './routineService';
import { PPL_HYBRID_MARKER, PPL_ROUTINE_TEMPLATES } from '@/lib/pplHybridTemplates';

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function findExerciseByKeywords(allExercises, keywords) {
  for (const kw of keywords) {
    const q = normalize(kw);
    const hit = allExercises.find((e) => normalize(e.name).includes(q));
    if (hit) return hit;
  }
  return null;
}

export async function hasPplHybridInstalled(studentEmail) {
  const routines = await routineService.listRoutinesByStudent(studentEmail);
  return routines.some(
    (r) => r.description?.includes(PPL_HYBRID_MARKER) || PPL_ROUTINE_TEMPLATES.some((t) => t.name === r.name)
  );
}

export async function installPplHybridForStudent(studentEmail) {
  if (!studentEmail) throw new Error('E-mail obrigatório');
  if (await hasPplHybridInstalled(studentEmail)) {
    return { skipped: true, message: 'PPL já instalado' };
  }

  const allExercises = await listAllExercises();
  const created = [];

  for (const tpl of PPL_ROUTINE_TEMPLATES) {
    const routine = await routineService.createRoutine({
      studentEmail,
      name: tpl.name,
      description: `${tpl.description} · ${PPL_HYBRID_MARKER}`,
      daysOfWeek: tpl.daysOfWeek,
      createdByRole: 'student',
      isActive: tpl.slot === 'push1',
    });

    const misses = [];
    let order = 0;
    for (const row of tpl.exercises) {
      const ex = findExerciseByKeywords(allExercises, row.keywords);
      if (!ex) {
        misses.push(row.keywords[0]);
        continue;
      }
      await routineService.addExerciseToRoutine(routine.id, {
        exerciseId: ex.id,
        order: order++,
        sets: row.sets,
        targetReps: row.targetReps,
        restSeconds: row.restSeconds,
      });
    }
    if (misses.length) {
      await routineService.updateRoutine(routine.id, {
        consultantNote: `Complete na Biblioteca: ${misses.join(', ')}`,
      });
    }
    created.push(routine);
  }

  return { skipped: false, routines: created };
}

export function useInstallPplHybrid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentEmail) => installPplHybridForStudent(studentEmail),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}