import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const DEFAULT_PLANS = [
  {
    name: 'free', display_name: 'Free', price_monthly: 0, price_yearly: 0,
    features: ['3 treinos por semana', 'Check-in diário', 'Skills básicas', 'Ranking global'],
    missing: ['Medidas corporais', 'Missões premium', 'Treinos personalizados', 'Feedback semanal'],
  },
  {
    name: 'pro', display_name: 'Pro', price_monthly: 29, price_yearly: 290,
    features: ['Treinos ilimitados', 'Medidas corporais', 'Missões premium', 'Todas as skills', 'Desafios'],
    missing: ['Treinos personalizados pelo Jota', 'Feedback semanal do Jota'],
    popular: true,
  },
  {
    name: 'premium', display_name: 'Premium', price_monthly: 59, price_yearly: 590,
    features: ['Tudo do Pro', 'Treinos montados pelo Jota', 'Feedback semanal personalizado', 'Suporte direto', 'Acesso prioritário'],
    missing: [],
    best: true,
  },
];

export default function PlanosPage() {
  const { user } = useCurrentUser();
  const [billing, setBilling] = useState('monthly');

  const { data: profileArr } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  const myProfile = profileArr?.[0];
  const currentPlan = myProfile?.plan_type || 'free';

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center py-10">
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-display font-black text-xl mb-6 tracking-widest">
            🔥 JOTA FIT
          </Link>
          <h1 className="font-display text-3xl font-black mb-3">Escolha seu plano</h1>
          <p className="text-muted-foreground mb-6">Evolua mais rápido com o plano certo</p>
          {/* Toggle */}
          <div className="inline-flex items-center bg-muted rounded-xl p-1 gap-1">
            <button onClick={() => setBilling('monthly')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${billing === 'monthly' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}>Mensal</button>
            <button onClick={() => setBilling('yearly')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${billing === 'yearly' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}>
              Anual <span className="text-success text-xs ml-1">-17%</span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid sm:grid-cols-3 gap-5">
          {DEFAULT_PLANS.map((plan, i) => {
            const isCurrent = currentPlan === plan.name;
            const price = billing === 'monthly' ? plan.price_monthly : plan.price_yearly;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`relative bg-card rounded-2xl p-6 flex flex-col
                  ${plan.popular ? 'border-2 border-gold shadow-xl shadow-gold/10' : plan.best ? 'border-2 border-primary' : 'border border-border'}`}
              >
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-accent-foreground text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">⭐ MAIS POPULAR</div>}
                {plan.best && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">🏆 MELHOR RESULTADO</div>}

                {isCurrent && (
                  <div className="absolute top-4 right-4 bg-success/10 text-success text-[10px] font-black px-2 py-1 rounded-full border border-success/20">ATUAL</div>
                )}

                <h3 className="font-display font-black text-xl mb-1">{plan.display_name}</h3>
                <div className="mb-5">
                  {price === 0 ? (
                    <span className="font-display text-4xl font-black">Grátis</span>
                  ) : (
                    <>
                      <span className="font-display text-4xl font-black">R${price}</span>
                      <span className="text-muted-foreground text-sm">/{billing === 'monthly' ? 'mês' : 'ano'}</span>
                    </>
                  )}
                  {billing === 'yearly' && price > 0 && (
                    <p className="text-xs text-success mt-1">≈ R${Math.round(price / 12)}/mês</p>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <X className="w-4 h-4 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all
                    ${isCurrent ? 'bg-muted text-muted-foreground cursor-default' :
                      plan.popular ? 'bg-gold text-accent-foreground hover:bg-gold/90' :
                      plan.best ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
                      'bg-muted text-foreground hover:bg-muted/80'}`}
                >
                  {isCurrent ? 'Plano atual' : price === 0 ? 'Começar grátis' : `Assinar ${plan.display_name}`}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Feature comparison */}
        <div className="mt-12 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold">Comparativo completo</h2>
          </div>
          {[
            ['Treinos por semana', '3', 'Ilimitado', 'Ilimitado'],
            ['Check-in diário', '✅', '✅', '✅'],
            ['Skills & gamificação', '✅', '✅', '✅'],
            ['Medidas corporais', '❌', '✅', '✅'],
            ['Missões premium', '❌', '✅', '✅'],
            ['Desafios entre alunos', '❌', '✅', '✅'],
            ['Treinos personalizados', '❌', '❌', '✅'],
            ['Feedback semanal do Jota', '❌', '❌', '✅'],
          ].map(([feat, ...vals]) => (
            <div key={feat} className="grid grid-cols-4 px-5 py-3 border-b border-border/50 last:border-0 items-center">
              <span className="text-sm text-muted-foreground">{feat}</span>
              {vals.map((v, i) => (
                <div key={i} className="text-center text-sm font-medium">{v}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}