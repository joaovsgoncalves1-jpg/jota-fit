import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Swords } from 'lucide-react';
import HPBar from '@/components/game/HPBar';

const NODE_STATUS = {
  completed: {
    ring: 'ring-2 ring-success shadow-[0_0_12px_rgba(34,197,94,0.3)]',
    bg: 'bg-success/20',
    textColor: 'text-success',
  },
  active: {
    ring: 'ring-2 ring-primary shadow-[0_0_14px_rgba(249,115,22,0.4)]',
    bg: 'bg-primary/20',
    textColor: 'text-primary',
  },
  available: {
    ring: 'ring-1 ring-gold/40',
    bg: 'bg-gold/10',
    textColor: 'text-gold',
  },
  locked: {
    ring: 'ring-1 ring-border opacity-40',
    bg: 'bg-muted/30',
    textColor: 'text-muted-foreground',
  },
};

function NodeStatus({ node, skillProgress }) {
  const sp = skillProgress.find(p => p.skill_key === node.key);
  if (sp?.status === 'completed') return 'completed';
  if (sp?.status === 'in_progress') return 'active';
  if (node.isMVP) return 'available';
  return 'locked';
}

function SkillNode({ node, skillProgress, isLast }) {
  const status = NodeStatus({ node, skillProgress });
  const cfg = NODE_STATUS[status];

  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${cfg.bg} ${cfg.ring}`}>
        {node.emoji}
        {status === 'completed' && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center text-[10px]">✓</div>
        )}
        {status === 'active' && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-primary/20"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          />
        )}
      </div>
      <p className={`text-[9px] font-bold mt-1.5 text-center leading-tight max-w-[60px] ${cfg.textColor}`}>
        {node.name}
      </p>
      {!isLast && (
        <div className={`w-0.5 h-4 mt-1 rounded-full ${status === 'locked' ? 'bg-border/40' : 'bg-border'}`} />
      )}
    </div>
  );
}

function SubPathSection({ subPath, skillProgress, bosses, bossProgress, dbSkills }) {
  const [open, setOpen] = useState(false);

  // Find boss from DB
  const boss = bosses.find(b => b.name === subPath.boss);
  const bp = boss ? bossProgress.find(p => p.boss_id === boss.id) : null;
  const bossDefeated = bp?.defeated;
  const bossCurrentHP = bp ? bp.current_hp : boss?.hp_total;

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 text-left bg-muted/20 hover:bg-muted/30 transition-all"
      >
        <span className="text-xl">{subPath.nodes[subPath.nodes.length - 1]?.emoji}</span>
        <div className="flex-1">
          <p className="font-bold text-sm">{subPath.label}</p>
          {boss && !bossDefeated && (
            <p className="text-[10px] text-destructive font-bold">⚔️ {subPath.boss}</p>
          )}
          {bossDefeated && (
            <p className="text-[10px] text-success font-bold">✅ Boss derrotado!</p>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3">
              {/* Boss HP */}
              {boss && !bossDefeated && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-2.5 mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Swords className="w-3.5 h-3.5 text-destructive" />
                    <p className="text-xs font-bold text-destructive">{boss.name}</p>
                    <span className="ml-auto text-[10px] text-gold font-bold">+{boss.xp_bonus} XP</span>
                  </div>
                  <HPBar current={bossCurrentHP} total={boss.hp_total} size="sm" />
                </div>
              )}

              {/* Node chain */}
              <div className="flex flex-col items-center pt-2">
                {subPath.nodes.map((node, i) => (
                  <SkillNode
                    key={node.key}
                    node={node}
                    skillProgress={skillProgress}
                    isLast={i === subPath.nodes.length - 1}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SkillPathSection({ path, skillProgress, bosses, bossProgress, dbSkills }) {
  const [open, setOpen] = useState(false);

  // Find boss from DB for main paths
  const boss = path.boss ? bosses.find(b => b.name === path.boss) : null;
  const bp = boss ? bossProgress.find(p => p.boss_id === boss.id) : null;
  const bossDefeated = bp?.defeated;
  const bossCurrentHP = bp ? bp.current_hp : boss?.hp_total;

  // Compute completion for main nodes
  const allNodes = path.nodes || path.subPaths?.flatMap(sp => sp.nodes) || [];
  const completedInPath = allNodes.filter(n =>
    skillProgress.some(sp => sp.skill_key === n.key && sp.status === 'completed')
  ).length;
  const completionPct = allNodes.length > 0 ? Math.round((completedInPath / allNodes.length) * 100) : 0;

  return (
    <div className={`bg-card border ${path.borderColor} rounded-2xl overflow-hidden`}>
      {/* Path header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 text-left flex items-center gap-3"
      >
        <div className={`w-12 h-12 rounded-xl ${path.bgColor} flex items-center justify-center text-2xl shrink-0`}>
          {path.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`font-display font-black text-base ${path.color}`}>{path.label}</p>
            <p className="text-xs text-muted-foreground font-bold">{completedInPath}/{allNodes.length}</p>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${completionPct === 100 ? 'bg-success' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          {/* Boss mini */}
          {boss && !bossDefeated && (
            <p className="text-[10px] text-destructive font-bold mt-1.5">⚔️ {path.boss}</p>
          )}
          {bossDefeated && (
            <p className="text-[10px] text-success font-bold mt-1.5">🏆 Boss derrotado!</p>
          )}
        </div>
        <div className="shrink-0 ml-2">
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-3">
              {/* Main boss HP bar */}
              {boss && !bossDefeated && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Swords className="w-4 h-4 text-destructive" />
                    <p className="text-sm font-bold text-destructive">{path.bossEmoji} {boss.name}</p>
                    <span className="ml-auto text-xs text-gold font-bold">+{boss.xp_bonus} XP</span>
                  </div>
                  <HPBar current={bossCurrentHP} total={boss.hp_total} size="sm" />
                  <p className="text-[10px] text-muted-foreground mt-1.5">Treine skills desta categoria para causar dano</p>
                </div>
              )}

              {/* Sub-paths (Alavancas, Dinâmicas) */}
              {path.subPaths && (
                <div className="space-y-2">
                  {path.subPaths.map(sp => (
                    <SubPathSection
                      key={sp.label}
                      subPath={sp}
                      skillProgress={skillProgress}
                      bosses={bosses}
                      bossProgress={bossProgress}
                      dbSkills={dbSkills}
                    />
                  ))}
                </div>
              )}

              {/* Main node chain */}
              {path.nodes && (
                <div className="flex flex-col items-center">
                  {path.nodes.map((node, i) => (
                    <SkillNode
                      key={node.key}
                      node={node}
                      skillProgress={skillProgress}
                      isLast={i === path.nodes.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}