# Entidades Base44 → Firebase (fases)

Total no `jota-fit`: **47 entidades** em `base44/entities/`.

Migrar tudo de uma vez = projeto grande. Fases abaixo para projeto **parado / pouco foco**.

---

## Fase 0 — MVP (só isto já “sai da Base44”)

| Entidade | Por quê |
|----------|---------|
| `User` | Auth / perfil base |
| `StudentProfile` | Aluno do Jota |
| `Routine` | Treino atribuído |
| `RoutineExercise` | Exercícios da rotina |
| `Exercise` | Catálogo |
| `WorkoutLog` ou `SetLog` | Registrar treino feito |
| `Checkin` | Consistência / streak |

**7 coleções** — suficiente para: login, ver treino do dia, marcar feito.

---

## Fase 1 — Core fitness

`Plan`, `WeeklyPlan`, `WeeklyPlanItem`, `Workout`, `WorkoutSession`, `WorkoutAssignment`, `ExerciseMedia`, `ExerciseProgression`, `BodyMeasurement`, `TrainingLoad`

---

## Fase 2 — Gamificação

`Mission`, `MissionProgress`, `Achievement`, `AchievementUnlock`, `LevelConfig`, `XPConfig`, `Skill`, `SkillProgress`, `LearningPath`, `StudentPathProgress`, `Boss`, `BossProgress`, `Challenge`, `ChallengeProgress`, `ShareableBadge`

---

## Fase 3 — Social / coach

`Post`, `Comment`, `Notification`, `Feedback`, `ConsultantNote`, `InstructorProfile`, `TrainingRecommendation`, `HybridActivity`, `MuscleFatigue`, `ExercisePersonalRecord`, `ExerciseSubstitution`

---

## Fase 4 — IA

`AIRequest` + endpoint Gemini (do Pro)

---

## Remover do repo quando Fase 0 estiver ok

- Pasta `base44/` inteira
- `@base44/sdk`, `@base44/vite-plugin`
- Env `VITE_BASE44_*`
- README que manda publicar só na Base44