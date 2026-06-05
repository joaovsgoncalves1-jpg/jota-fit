# Services Layer — Jota Fit

Camada de abstração entre a UI e o backend. Hoje usa Base44 por baixo, mas a interface pública é neutra para permitir migração futura para Supabase / API própria sem reescrever a UI.

## Estrutura

```
src/services/
  _base/
    baseClient.js     ← único ponto que importa do Base44
    mappers.js        ← Base44 ↔ formato neutro (camelCase)
  types.js            ← JSDoc dos tipos do domínio
  authService.js
  studentService.js
  exerciseService.js
  routineService.js
  workoutService.js
  progressService.js
  recommendationService.js
  consultantService.js
  index.js            ← barrel exports
```

## Regras

1. **Páginas e componentes NÃO devem importar de `@/api/base44Client` diretamente.** Sempre passar pelos services.
2. Toda I/O retorna no formato neutro (camelCase, datas ISO, ids como string).
3. Cada service expõe:
   - **Funções puras assíncronas** (ex: `getActiveRoutine(email)`) — base para qualquer migração.
   - **Hooks React Query** (ex: `useStudentRoutines(email)`) — açúcar opcional para as telas.
4. Mutations atualizam o cache via `invalidateQueries`.

## Migração (em andamento na branch `migrate/own-backend`)

**Híbrido MVP:** `VITE_USE_FIREBASE_DATA=true` → dados no Firestore via `firestoreEntity.js`; login ainda Base44.

1. `baseClient.js` escolhe implementação de `db`.
2. `mappers.js` inalterado.
3. Páginas usam só services (nunca `@/api/base44Client` direto).

## Tipos

Ver `services/types.js` para a documentação de cada modelo (StudentProfile, Exercise, Routine, RoutineExercise, WorkoutSession, SetLog, ExercisePersonalRecord, ConsultantNote, TrainingRecommendation, BodyMeasurement, Checkin, AppUser).