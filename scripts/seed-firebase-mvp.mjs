/**
 * Seed Firestore MVP (Fase 0).
 *
 * Requer: GOOGLE_APPLICATION_CREDENTIALS ou firebase login + projeto configurado.
 * Alternativa rápida: importar scripts/seed-data.mvp.json no console Firebase.
 *
 * Uso com Admin SDK:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="caminho\serviceAccount.json"
 *   node scripts/seed-firebase-mvp.mjs
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, 'seed-data.mvp.json'), 'utf8'));

async function main() {
  let admin;
  try {
    admin = await import('firebase-admin');
  } catch {
    console.log(`
[seed] firebase-admin não instalado.

Importe manualmente no Firebase Console (Firestore):
${join(__dirname, 'seed-data.mvp.json')}

Coleções: StudentProfile, Exercise, Routine, RoutineExercise
`);
    process.exit(0);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('[seed] Defina GOOGLE_APPLICATION_CREDENTIALS com o JSON da service account.');
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  const db = admin.firestore();
  const now = new Date().toISOString();

  for (const p of data.studentProfiles) {
    const ref = await db.collection('StudentProfile').add({
      ...p,
      created_date: now,
      updated_date: now,
    });
    console.log('StudentProfile', ref.id, p.email);
  }

  const exerciseIds = [];
  for (const ex of data.exercises) {
    const ref = await db.collection('Exercise').add({
      ...ex,
      created_date: now,
      updated_date: now,
    });
    exerciseIds.push(ref.id);
    console.log('Exercise', ref.id, ex.name);
  }

  for (const r of data.routines) {
    const routineRef = await db.collection('Routine').add({
      ...r,
      created_date: now,
      updated_date: now,
    });
    console.log('Routine', routineRef.id, r.name);

    for (const re of data.routineExercises) {
      const exerciseId = exerciseIds[re._exerciseIndex ?? 0];
      const { _exerciseIndex, ...rest } = re;
      await db.collection('RoutineExercise').add({
        ...rest,
        routine_id: routineRef.id,
        exercise_id: exerciseId,
        created_date: now,
        updated_date: now,
      });
    }
  }

  console.log('[seed] Concluído.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});