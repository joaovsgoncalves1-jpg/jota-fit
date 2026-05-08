/**
 * BandGuide — guia completo de uso do elástico para um exercício.
 * Aparece no detalhe do exercício quando uses_band = true ou tracking = assisted_bodyweight.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Anchor, ArrowDownToLine, AlertTriangle, Sparkles, Target, Zap } from 'lucide-react';
import { BAND_LABEL, BAND_COLORS, getProgressionTips } from '@/lib/bands';

const BAND_INTENSITY_BAR = { muito_forte: 100, forte: 75, medio: 50, leve: 25 };

function Section({ icon: Icon, title, color = 'text-foreground', children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <p className={`text-[10px] font-black uppercase tracking-wider ${color}`}>{title}</p>
      </div>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

export default function BandGuide({ exercise }) {
  if (!exercise) return null;
  const level = exercise.band_assistance_level;
  const tips = getProgressionTips(level, exercise.tracking_type);

  // Sugestão de cor baseada no nível (heurística)
  const suggestedColors = {
    muito_forte: ['preto', 'roxo'],
    forte: ['roxo', 'verde'],
    medio: ['verde', 'azul'],
    leve: ['azul', 'vermelho', 'laranja'],
  }[level] || [];

  const intensityPct = BAND_INTENSITY_BAR[level] || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-green-500/25 rounded-2xl p-4 mb-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">🪢</span>
            <p className="text-xs font-black uppercase tracking-wider text-green-400">
              Guia do Elástico
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Menos assistência = mais força real. Use o elástico como ponte, não como muleta.
          </p>
        </div>
      </div>

      {/* Recommended level + intensity bar */}
      {level && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Nível recomendado
            </p>
            <span className="text-xs font-black text-green-400">{BAND_LABEL[level]}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${intensityPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-green-500 to-green-400"
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-bold">
            <span>Mais leve</span>
            <span>Mais assistência</span>
          </div>
        </div>
      )}

      {/* Color suggestion */}
      {suggestedColors.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Cores sugeridas
          </p>
          <div className="flex gap-2 flex-wrap">
            {suggestedColors.map(key => {
              const c = BAND_COLORS.find(b => b.key === key);
              if (!c) return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-1.5 bg-muted/20 border border-border/40 rounded-lg px-2 py-1"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/10"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-[11px] font-bold">{c.label}</span>
                  <span className="text-[10px] text-muted-foreground">{c.kgRange}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug">
            * Marcas variam. Use a cor que te dá a assistência certa, não a "padrão".
          </p>
        </div>
      )}

      {/* Anchor + positioning */}
      {(exercise.band_anchor_point || exercise.band_purpose) && (
        <div className="grid gap-3">
          {exercise.band_anchor_point && (
            <Section icon={Anchor} title="Ancoragem" color="text-foreground">
              {exercise.band_anchor_point}
            </Section>
          )}
          {exercise.band_purpose && (
            <Section icon={Target} title="Como posicionar" color="text-foreground">
              {exercise.band_purpose}
            </Section>
          )}
        </div>
      )}

      {/* How to reduce */}
      <Section icon={ArrowDownToLine} title="Como reduzir assistência" color="text-green-400">
        <ul className="space-y-1 text-[13px]">
          <li>• Mantenha o mesmo nível até dominar (3 séries firmes).</li>
          <li>• Reduza para o próximo nível mais leve.</li>
          <li>• Aceite que reps vão cair — é sinal de força sendo construída.</li>
          <li>• Última etapa: tente 1 rep sem elástico.</li>
        </ul>
      </Section>

      {/* Triggers */}
      <div className="grid grid-cols-1 gap-2">
        <div className="bg-green-500/8 border border-green-500/25 rounded-xl p-2.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-green-400 mb-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Quando trocar pra mais leve
          </p>
          <p className="text-[12px] leading-relaxed">{tips.lighter}</p>
        </div>
        <div className="bg-gold/8 border border-gold/25 rounded-xl p-2.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-gold mb-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Quando tentar sem elástico
          </p>
          <p className="text-[12px] leading-relaxed">{tips.noBand}</p>
        </div>
      </div>

      {/* Common mistakes */}
      <Section icon={AlertTriangle} title="Erros comuns com elástico" color="text-destructive">
        <ul className="space-y-1 text-[13px]">
          <li>• Usar elástico forte demais e "quicar" no fundo.</li>
          <li>• Pular a fase de cada nível antes de dominá-lo.</li>
          <li>• Trocar de elástico toda sessão (sem padrão).</li>
          <li>• Não registrar cor/nível — perde rastreio de progressão.</li>
        </ul>
      </Section>

      {/* Final motivational message */}
      <div className="bg-gradient-to-r from-green-500/15 to-primary/15 border border-green-500/30 rounded-xl p-3 text-center">
        <p className="text-sm font-black text-foreground tracking-wide">
          💪 MENOS ASSISTÊNCIA = MAIS FORÇA REAL
        </p>
      </div>
    </motion.div>
  );
}