import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { motion } from 'framer-motion';
import SkillPathSection from '@/components/skills/SkillPathSection';

// ─── Static skill tree definition ────────────────────────────────────────────
// These are display-only paths. Real progress comes from DB via skillProgress.
export const SKILL_PATHS = [
  {
    id: 'fundacao',
    label: 'Fundação',
    emoji: '🏛️',
    color: 'text-blue-400',
    borderColor: 'border-blue-400/30',
    bgColor: 'bg-blue-400/10',
    nodes: [
      { key: 'checkin_inicial', name: 'Check-in Inicial', emoji: '✅', mvp: true },
      { key: 'controle_corporal', name: 'Controle Corporal Básico', emoji: '🧠', mvp: true },
      { key: 'mobilidade_punho', name: 'Mobilidade de Punho e Ombro', emoji: '🤸', mvp: false },
      { key: 'hollow_body', name: 'Hollow Body', emoji: '🌊', mvp: false },
      { key: 'prancha_forte', name: 'Prancha Forte', emoji: '🧱', mvp: false },
    ],
  },
  {
    id: 'puxada',
    label: 'Força de Puxada',
    emoji: '💪',
    color: 'text-primary',
    borderColor: 'border-primary/30',
    bgColor: 'bg-primary/10',
    boss: 'Minotauro da Barra',
    bossEmoji: '🐂',
    nodes: [
      { key: 'remada_australiana', name: 'Remada Australiana', emoji: '↗️', mvp: false },
      { key: 'hang_ativo', name: 'Hang Ativo', emoji: '🙌', mvp: false },
      { key: 'pullup_negativa', name: 'Pull-up Negativa', emoji: '⬇️', mvp: false },
      { key: 'pullup_assistida', name: 'Pull-up Assistida', emoji: '🪜', mvp: false },
      { key: 'pullup', name: 'Pull-up Estrita', emoji: '💥', mvp: true, isMVP: true },
      { key: 'pullup_explosiva', name: 'Pull-up Explosiva', emoji: '⚡', mvp: false },
      { key: 'pullup_peito', name: 'Pull-up Peito na Barra', emoji: '🔝', mvp: false },
    ],
  },
  {
    id: 'empurrada',
    label: 'Força de Empurrada',
    emoji: '🤜',
    color: 'text-orange-400',
    borderColor: 'border-orange-400/30',
    bgColor: 'bg-orange-400/10',
    boss: 'Soldado da Base',
    bossEmoji: '⚔️',
    nodes: [
      { key: 'flexao_inclinada', name: 'Flexão Inclinada', emoji: '📐', mvp: false },
      { key: 'flexao', name: 'Flexão Tradicional', emoji: '🙌', mvp: true, isMVP: true },
      { key: 'flexao_diamante', name: 'Flexão Diamante', emoji: '💎', mvp: false },
      { key: 'dips_assistido', name: 'Dips Assistido', emoji: '🪜', mvp: false },
      { key: 'dips', name: 'Dips Estrito', emoji: '🔱', mvp: true, isMVP: true },
      { key: 'pike_pushup', name: 'Pike Push-up', emoji: '🔺', mvp: false },
      { key: 'hspu_negativa', name: 'Handstand Push-up Negativa', emoji: '🙃', mvp: false },
    ],
  },
  {
    id: 'core',
    label: 'Core & Compressão',
    emoji: '🔥',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-400/30',
    bgColor: 'bg-yellow-400/10',
    boss: 'Mestre da Compressão',
    bossEmoji: '🧿',
    nodes: [
      { key: 'hollow_hold', name: 'Hollow Hold', emoji: '🌊', mvp: false },
      { key: 'knee_raise', name: 'Knee Raise', emoji: '🦵', mvp: false },
      { key: 'leg_raise', name: 'Leg Raise', emoji: '📏', mvp: false },
      { key: 'lsit_tuck', name: 'L-sit Tuck', emoji: '🪑', mvp: false },
      { key: 'lsit_one_leg', name: 'L-sit One Leg', emoji: '🦶', mvp: false },
      { key: 'lsit', name: 'L-sit Completo', emoji: '✊', mvp: true, isMVP: true },
      { key: 'toes_to_bar', name: 'Toes-to-Bar', emoji: '🎯', mvp: false },
    ],
  },
  {
    id: 'invertido',
    label: 'Equilíbrio Invertido',
    emoji: '🙃',
    color: 'text-purple-400',
    borderColor: 'border-purple-400/30',
    bgColor: 'bg-purple-400/10',
    boss: 'Sentinela Invertido',
    bossEmoji: '🔮',
    nodes: [
      { key: 'wall_handstand', name: 'Wall Handstand', emoji: '🧱', mvp: false },
      { key: 'chest_wall_hs', name: 'Chest-to-Wall Handstand', emoji: '🤲', mvp: false },
      { key: 'shoulder_taps', name: 'Shoulder Taps', emoji: '👇', mvp: false },
      { key: 'hs_kickup', name: 'Handstand Kick-up', emoji: '🚀', mvp: false },
      { key: 'hs_assistido', name: 'Handstand Livre Assistido', emoji: '🛟', mvp: false },
      { key: 'handstand', name: 'Handstand Livre', emoji: '🌟', mvp: true, isMVP: true },
      { key: 'hspu', name: 'Handstand Push-up', emoji: '💫', mvp: false },
    ],
  },
  {
    id: 'alavancas',
    label: 'Alavancas',
    emoji: '⚖️',
    color: 'text-red-400',
    borderColor: 'border-red-400/30',
    bgColor: 'bg-red-400/10',
    subPaths: [
      {
        label: 'Front Lever',
        boss: 'Dragão da Alavanca',
        bossEmoji: '🐉',
        nodes: [
          { key: 'tuck_front_lever', name: 'Tuck Front Lever', emoji: '🌀', mvp: false },
          { key: 'adv_tuck_fl', name: 'Advanced Tuck Front Lever', emoji: '🌀', mvp: false },
          { key: 'one_leg_fl', name: 'One Leg Front Lever', emoji: '🦵', mvp: false },
          { key: 'straddle_fl', name: 'Straddle Front Lever', emoji: '🦅', mvp: false },
          { key: 'front_lever', name: 'Full Front Lever', emoji: '🐉', mvp: true, isMVP: true },
        ],
      },
      {
        label: 'Back Lever',
        boss: 'Guardião das Costas',
        bossEmoji: '🛡️',
        nodes: [
          { key: 'skin_the_cat', name: 'Skin the Cat', emoji: '😼', mvp: false },
          { key: 'tuck_back_lever', name: 'Tuck Back Lever', emoji: '🔄', mvp: false },
          { key: 'adv_tuck_bl', name: 'Advanced Tuck Back Lever', emoji: '🔄', mvp: false },
          { key: 'straddle_bl', name: 'Straddle Back Lever', emoji: '🦅', mvp: false },
          { key: 'back_lever', name: 'Full Back Lever', emoji: '🛡️', mvp: false },
        ],
      },
    ],
  },
  {
    id: 'dinamicas',
    label: 'Skills Dinâmicas',
    emoji: '⚡',
    color: 'text-green-400',
    borderColor: 'border-green-400/30',
    bgColor: 'bg-green-400/10',
    subPaths: [
      {
        label: 'Muscle-up',
        boss: 'Titã da Transição',
        bossEmoji: '🦁',
        nodes: [
          { key: 'pullup_explosiva2', name: 'Pull-up Explosiva', emoji: '⚡', mvp: false },
          { key: 'pullup_peito2', name: 'Pull-up Peito na Barra', emoji: '🔝', mvp: false },
          { key: 'transicao_assistida', name: 'Transição Assistida', emoji: '🪜', mvp: false },
          { key: 'muscleup_elastico', name: 'Muscle-up com Elástico', emoji: '🪢', mvp: false },
          { key: 'muscleup_negativo', name: 'Muscle-up Negativo', emoji: '⬇️', mvp: false },
          { key: 'muscleup', name: 'Muscle-up Estrito', emoji: '🦁', mvp: true, isMVP: true },
        ],
      },
      {
        label: 'Explosão',
        boss: 'Guerreiro Unilateral',
        bossEmoji: '🦊',
        nodes: [
          { key: 'clap_pushup', name: 'Clap Push-up', emoji: '👏', mvp: false },
          { key: 'high_pullup', name: 'High Pull-up', emoji: '🔝', mvp: false },
          { key: 'bar_dip_exp', name: 'Bar Dip Explosivo', emoji: '💥', mvp: false },
          { key: 'muscleup_limpo', name: 'Muscle-up Limpo', emoji: '✨', mvp: false },
        ],
      },
    ],
  },
];

// ─── Legendary Skills (locked/aspirational) ──────────────────────────────────
export const LEGENDARY_SKILLS = [
  { key: 'planche', name: 'Planche', emoji: '🌌', boss: 'Imperador da Gravidade' },
  { key: 'human_flag', name: 'Human Flag', emoji: '🏳️', boss: 'Colosso Lateral' },
  { key: '90_pushup', name: '90° Push-up', emoji: '🔷', boss: 'Arquiteto da Força' },
  { key: 'one_arm_pullup', name: 'One Arm Pull-up', emoji: '👆', boss: 'Lenda da Barra' },
  { key: 'planche_pushup', name: 'Planche Push-up', emoji: '🌠', boss: 'Deus da Gravidade' },
];

export default function SkillsTreePage() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('mapa');

  const { data: skills } = useQuery({
    queryKey: ['all-skills'],
    queryFn: () => base44.entities.Skill.list(),
  });

  const { data: skillProgress } = useQuery({
    queryKey: ['my-skill-progress', user?.email],
    queryFn: () => base44.entities.SkillProgress.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: bosses } = useQuery({
    queryKey: ['all-bosses'],
    queryFn: () => base44.entities.Boss.list(),
  });

  const { data: bossProgress } = useQuery({
    queryKey: ['my-boss-progress', user?.email],
    queryFn: () => base44.entities.BossProgress.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  // Calculate overall stats from the static tree
  const allNodes = SKILL_PATHS.flatMap(p =>
    p.subPaths
      ? p.subPaths.flatMap(sp => sp.nodes)
      : p.nodes
  );
  const mvpNodes = allNodes.filter(n => n.isMVP);
  const completedMvp = mvpNodes.filter(n =>
    (skillProgress || []).some(sp => sp.skill_key === n.key && sp.status === 'completed')
  ).length;

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-black">MAPA DE EVOLUÇÃO</h1>
            <p className="text-xs text-muted-foreground">Sua jornada no calistenia</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-success/10 border border-success/30 rounded-xl px-3 py-1.5 text-center">
              <p className="font-display font-black text-success text-base leading-none">{completedMvp}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">Skills MVP</p>
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-xl px-3 py-1.5 text-center">
              <p className="font-display font-black text-primary text-base leading-none">{mvpNodes.length}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">Total MVP</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/30 rounded-xl p-1">
          {[
            { key: 'mapa', label: '🗺️ Mapa' },
            { key: 'lendarias', label: '🌌 Lendárias' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all
                ${activeTab === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mapa */}
      {activeTab === 'mapa' && (
        <div className="px-4 space-y-3 pt-2">
          {SKILL_PATHS.map((path, i) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SkillPathSection
                path={path}
                skillProgress={skillProgress || []}
                bosses={bosses || []}
                bossProgress={bossProgress || []}
                dbSkills={skills || []}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Lendárias */}
      {activeTab === 'lendarias' && (
        <div className="px-4 pt-2 space-y-3">
          <p className="text-xs text-muted-foreground text-center py-2">Skills aspiracionais — desbloqueie ao dominar todas as anteriores</p>
          {LEGENDARY_SKILLS.map((skill, i) => (
            <motion.div
              key={skill.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative bg-card border border-gold/20 rounded-2xl p-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-epic/5 pointer-events-none" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-3xl shrink-0">
                  {skill.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-black text-gold text-base">{skill.name}</p>
                    <span className="text-[9px] font-bold bg-gold/20 text-gold px-1.5 py-0.5 rounded-md">LENDÁRIA</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">⚔️ {skill.boss}</p>
                </div>
                <div className="text-2xl opacity-60">🔒</div>
              </div>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-0 bg-gold/40 rounded-full" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-right">Bloqueada até dominar as skills anteriores</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}