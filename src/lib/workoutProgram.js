/** PPL 2x + pernas 1x — descanso sáb/dom */
export const DEFAULT_PPL_SCHEDULE = [
  { weekday: 1, dayKey: 'seg', label: 'Push 1', slot: 'push1', rest: false },
  { weekday: 2, dayKey: 'ter', label: 'Pull 1', slot: 'pull1', rest: false },
  { weekday: 3, dayKey: 'qua', label: 'Pernas', slot: 'legs', rest: false },
  { weekday: 4, dayKey: 'qui', label: 'Push 2', slot: 'push2', rest: false },
  { weekday: 5, dayKey: 'sex', label: 'Pull 2', slot: 'pull2', rest: false },
  { weekday: 6, dayKey: 'sab', label: 'Descanso', slot: null, rest: true },
  { weekday: 0, dayKey: 'dom', label: 'Descanso', slot: null, rest: true },
];

export function getTodayScheduleEntry(date = new Date()) {
  const wd = date.getDay();
  return DEFAULT_PPL_SCHEDULE.find((d) => d.weekday === wd) || { rest: true, label: 'Descanso', slot: null, dayKey: null };
}

export function routineNameForSlot(slot) {
  const map = {
    push1: 'Push 1 — Cali + academia',
    push2: 'Push 2 — Volume',
    pull1: 'Pull 1 — Barra + costas',
    pull2: 'Pull 2 — Posterior',
    legs: 'Pernas — 1x na semana',
  };
  return map[slot] || null;
}