// Admin-only: cria as cadeias de progressão de calistenia mapeando exercícios por slug.
// Limpa progressões existentes e recria do zero. Retorna resumo.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CHAINS = [
  {
    skill: 'Pull-up',
    type: 'band_reduction',
    notes: 'Construa base com remada e reduza assistência do elástico até a barra livre.',
    steps: [
      { slug: 'australian-pullup', requirement: '3x12 limpas' },
      { slug: 'scapular-pullup', requirement: '3x10 com pausa' },
      { slug: 'barra-negativa', requirement: '4x3 descidas de 5s' },
      { slug: 'barra-assistida-elastico', requirement: '3x8 com elástico forte', note: 'Use elástico forte' },
      { slug: 'barra-assistida-elastico', requirement: '3x8 com elástico médio', note: 'Reduza para elástico médio' },
      { slug: 'barra-assistida-elastico', requirement: '3x6 com elástico leve', note: 'Reduza para elástico leve' },
      { slug: 'barra-fixa-pronada', requirement: '3x8 limpas' },
      { slug: 'pullup-com-carga', requirement: '5x5 com +5kg' },
    ],
  },
  {
    skill: 'Dips',
    type: 'band_reduction',
    notes: 'Do mergulho em banco até dips com carga.',
    steps: [
      { slug: 'mergulho-banco', requirement: '3x15 limpas' },
      { slug: 'mergulho-assistido-elastico', requirement: '3x8 com elástico forte', note: 'Comece com forte' },
      { slug: 'mergulho-assistido-elastico', requirement: '3x8 com elástico médio/leve', note: 'Reduza assistência' },
      { slug: 'mergulho-paralelas', requirement: '3x8 amplitude completa' },
      { slug: 'dips-com-carga', requirement: '4x6 com +10kg' },
    ],
  },
  {
    skill: 'Muscle-up',
    type: 'skill',
    notes: 'Pull-up + dip + transição. Pegada falsa é a chave.',
    steps: [
      { slug: 'pullup-explosiva', requirement: '4x3 com peito alto' },
      { slug: 'chest-to-bar', requirement: '3x5 limpas' },
      { slug: 'straight-bar-dip', requirement: '3x6 limpas' },
      { slug: 'transicao-baixa-muscleup', requirement: '3x5 com pegada falsa' },
      { slug: 'muscleup-elastico-forte', requirement: '3x5 com elástico forte' },
      { slug: 'muscleup-elastico-medio', requirement: '3x3-5 com elástico médio' },
      { slug: 'muscleup-negativo', requirement: '3x3 negativas de 5s' },
      { slug: 'muscle-up', requirement: '3x1-3 limpas' },
    ],
  },
  {
    skill: 'Front Lever',
    type: 'skill',
    notes: 'Construa core + escápulas. Progrida do tuck até o full em meses.',
    steps: [
      { slug: 'hollow-body-hold', requirement: '3x45s' },
      { slug: 'scapular-pullup', requirement: '3x12 com pausa' },
      { slug: 'front-lever-tuck', requirement: '3x15s firmes' },
      { slug: 'tuck-front-lever-elastico', requirement: '3x20s com assistência', note: 'Reduza elástico gradual' },
      { slug: 'advanced-tuck-front-lever', requirement: '3x10-15s' },
      { slug: 'one-leg-front-lever', requirement: '3x10s cada lado' },
      { slug: 'straddle-front-lever', requirement: '3x8s firmes' },
      { slug: 'full-front-lever', requirement: '3x3-8s' },
    ],
  },
  {
    skill: 'Handstand',
    type: 'skill',
    notes: 'Pratique 5-10 min por dia. Mobilidade de ombro é fundamental.',
    steps: [
      { slug: 'pike-hold', requirement: '3x30s' },
      { slug: 'wall-handstand-costas', requirement: '3x60s alinhado' },
      { slug: 'chest-to-wall-handstand', requirement: '3x60s perfeito' },
      { slug: 'shoulder-taps', requirement: '3x10 cada lado' },
      { slug: 'kickup-handstand', requirement: 'Encontrar equilíbrio em 5/8' },
      { slug: 'handstand-assistido', requirement: '3x30s com toque leve' },
      { slug: 'handstand-livre', requirement: '3x10s livre' },
    ],
  },
  {
    skill: 'L-Sit',
    type: 'skill',
    notes: 'Mobilidade de isquiotibiais ajuda muito.',
    steps: [
      { slug: 'tuck-hold', requirement: '3x20s firmes' },
      { slug: 'tuck-lsit', requirement: '3x20s com quadril alto' },
      { slug: 'one-leg-lsit', requirement: '3x12s cada lado' },
      { slug: 'l-sit-paralelas', requirement: '3x15s' },
      { slug: 'lsit-20s', requirement: '3x20s+ firmes' },
    ],
  },
  {
    skill: 'Pistol Squat',
    type: 'skill',
    notes: 'Mobilidade de tornozelo + força unilateral.',
    steps: [
      { slug: 'agachamento-livre-corpo', requirement: '3x25 firmes' },
      { slug: 'avanco-halteres', requirement: '3x12 cada lado' },
      { slug: 'shrimp-squat-assistido', requirement: '3x6 cada lado' },
      { slug: 'box-pistol-squat', requirement: '3x8 cada lado em banco baixo' },
      { slug: 'pistol-squat', requirement: '3x5 cada lado livre' },
    ],
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Load all exercises and build slug -> id map
    const exercises = await base44.asServiceRole.entities.Exercise.list('-created_date', 1000);
    const bySlug = {};
    for (const ex of exercises) {
      if (ex.slug) bySlug[ex.slug] = ex.id;
    }

    // Find missing slugs
    const missing = [];
    for (const chain of CHAINS) {
      for (const step of chain.steps) {
        if (!bySlug[step.slug]) missing.push({ skill: chain.skill, slug: step.slug });
      }
    }

    // Wipe existing progressions for these exercises only (clean slate for these chains)
    const allIds = new Set();
    for (const chain of CHAINS) {
      for (const step of chain.steps) {
        const id = bySlug[step.slug];
        if (id) allIds.add(id);
      }
    }
    const existing = await base44.asServiceRole.entities.ExerciseProgression.list('-created_date', 1000);
    let deleted = 0;
    for (const ep of existing) {
      if (allIds.has(ep.exercise_id)) {
        await base44.asServiceRole.entities.ExerciseProgression.delete(ep.id);
        deleted += 1;
      }
    }

    // Create progressions
    let created = 0;
    for (const chain of CHAINS) {
      const validSteps = chain.steps.filter(s => bySlug[s.slug]);
      for (let i = 0; i < validSteps.length; i++) {
        const step = validSteps[i];
        const exId = bySlug[step.slug];
        const prevId = i > 0 ? bySlug[validSteps[i - 1].slug] : null;
        const nextId = i < validSteps.length - 1 ? bySlug[validSteps[i + 1].slug] : null;

        await base44.asServiceRole.entities.ExerciseProgression.create({
          exercise_id: exId,
          previous_exercise_id: prevId || undefined,
          next_exercise_id: nextId || undefined,
          difficulty_order: i + 1,
          requirement_to_unlock: step.requirement,
          progression_type: chain.type,
          notes: [chain.notes, step.note].filter(Boolean).join(' — '),
        });
        created += 1;
      }
    }

    return Response.json({
      ok: true,
      chains: CHAINS.length,
      created,
      deleted,
      missing,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});