/** Modelo PPL híbrido — exercícios resolvidos por palavras-chave na biblioteca */
export const PPL_HYBRID_MARKER = 'ppl_hybrid_v1';

export const PPL_ROUTINE_TEMPLATES = [
  {
    slot: 'push1',
    name: 'Push 1 — Cali + academia',
    description: 'Empurrar: peito, ombro, tríceps.',
    daysOfWeek: ['seg'],
    exercises: [
      { keywords: ['flexão', 'push-up', 'push up'], sets: 4, targetReps: '8-12', restSeconds: 90 },
      { keywords: ['supino', 'bench'], sets: 3, targetReps: '8-10', restSeconds: 120 },
      { keywords: ['pike'], sets: 3, targetReps: '6-10', restSeconds: 90 },
      { keywords: ['paralela', 'mergulho', 'dip'], sets: 3, targetReps: '6-10', restSeconds: 90 },
      { keywords: ['prancha', 'plank'], sets: 3, targetReps: '40s', restSeconds: 45 },
    ],
  },
  {
    slot: 'pull1',
    name: 'Pull 1 — Barra + costas',
    description: 'Puxar: costas, bíceps, grip.',
    daysOfWeek: ['ter'],
    exercises: [
      { keywords: ['escapular', 'ativação'], sets: 2, targetReps: '12', restSeconds: 45 },
      { keywords: ['barra fixa', 'pull-up', 'pull up', 'chin'], sets: 4, targetReps: '4-8', restSeconds: 120 },
      { keywords: ['remada australiana', 'remada invertida'], sets: 4, targetReps: '8-12', restSeconds: 90 },
      { keywords: ['puxada', 'lat pulldown', 'polia'], sets: 3, targetReps: '10-12', restSeconds: 90 },
      { keywords: ['dead hang', 'hang'], sets: 2, targetReps: '30s', restSeconds: 60 },
    ],
  },
  {
    slot: 'legs',
    name: 'Pernas — 1x na semana',
    description: 'Quadríceps, posterior, glúteo.',
    daysOfWeek: ['qua'],
    exercises: [
      { keywords: ['agachamento', 'squat'], sets: 4, targetReps: '6-10', restSeconds: 150 },
      { keywords: ['leg press'], sets: 3, targetReps: '10-12', restSeconds: 120 },
      { keywords: ['afundo', 'búlgaro', 'split squat'], sets: 3, targetReps: '8-10/lado', restSeconds: 90 },
      { keywords: ['stiff', 'rdl', 'levantamento terra romeno'], sets: 3, targetReps: '10-12', restSeconds: 90 },
    ],
  },
  {
    slot: 'push2',
    name: 'Push 2 — Volume',
    description: 'Segunda sessão de empurrar.',
    daysOfWeek: ['qui'],
    exercises: [
      { keywords: ['paralela', 'mergulho', 'dip'], sets: 4, targetReps: '6-10', restSeconds: 90 },
      { keywords: ['flexão', 'push-up'], sets: 3, targetReps: 'max', restSeconds: 90 },
      { keywords: ['supino', 'bench'], sets: 3, targetReps: '10-12', restSeconds: 90 },
      { keywords: ['prancha'], sets: 2, targetReps: '45s', restSeconds: 45 },
    ],
  },
  {
    slot: 'pull2',
    name: 'Pull 2 — Posterior',
    description: 'Segunda sessão de puxar.',
    daysOfWeek: ['sex'],
    exercises: [
      { keywords: ['remada'], sets: 4, targetReps: '10-12', restSeconds: 90 },
      { keywords: ['face pull', 'face-pull'], sets: 3, targetReps: '12-15', restSeconds: 60 },
      { keywords: ['barra fixa', 'pull-up'], sets: 3, targetReps: 'max', restSeconds: 120 },
      { keywords: ['hang', 'dead hang'], sets: 3, targetReps: '25s', restSeconds: 60 },
    ],
  },
];