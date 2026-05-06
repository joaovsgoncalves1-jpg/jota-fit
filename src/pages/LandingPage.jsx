import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ChevronRight, Star, Zap, Target, BarChart3, Instagram } from 'lucide-react';

const TRACKS = [
  { emoji: '🟢', name: 'Calistenia Básica', desc: 'Do zero à primeira barra', level: 'Iniciante' },
  { emoji: '🟡', name: 'Intermediária', desc: 'Muscle-up, handstand, L-sit', level: 'Intermediário' },
  { emoji: '🔴', name: 'Avançada', desc: 'Planche, front lever, back lever', level: 'Avançado' },
  { emoji: '🔵', name: 'Treino Híbrido', desc: 'Calistenia + musculação', level: 'Todos os níveis' },
];

const HOW_CARDS = [
  { icon: '🎯', title: 'Treinos sob medida', desc: 'Cada treino é pensado pro seu nível e objetivos. Sem treino genérico.' },
  { icon: '⚔️', title: 'Gamificação real', desc: 'XP, níveis, bosses, conquistas. Treinar vira um jogo que você quer vencer.' },
  { icon: '📊', title: 'Acompanhamento', desc: 'Medidas, evolução, histórico. Você vê cada centímetro de progresso.' },
];

const TESTIMONIALS = [
  { name: 'Rafael M.', text: 'Em 3 meses fiz minha primeira barra. O método do Jota é diferente de tudo que já vi.', stars: 5 },
  { name: 'Ana C.', text: 'A gamificação muda tudo! Fico ansiosa pra treinar pra subir de nível. 🔥', stars: 5 },
  { name: 'Lucas P.', text: 'Finalmente um app que se preocupa com progressão real. Recomendo demais.', stars: 5 },
];

const PLANS = [
  {
    name: 'Free', price_monthly: 0, price_yearly: 0, popular: false,
    features: ['3 treinos/semana', 'Check-in diário', 'Skills básicas', 'Ranking'],
    missing: ['Medidas corporais', 'Missões premium', 'Personalização', 'Feedback semanal'],
    cta: 'Começar grátis', href: '/onboarding',
  },
  {
    name: 'Pro', price_monthly: 29, price_yearly: 290, popular: true,
    features: ['Treinos ilimitados', 'Medidas corporais', 'Missões premium', 'Todos os skills'],
    missing: ['Personalização do Jota', 'Feedback semanal'],
    cta: 'Assinar Pro', href: '/planos',
  },
  {
    name: 'Premium', price_monthly: 59, price_yearly: 590, popular: false,
    features: ['Tudo do Pro', 'Treinos montados pelo Jota', 'Feedback semanal', 'Suporte direto'],
    missing: [],
    cta: 'Assinar Premium', href: '/planos',
  },
];

export default function LandingPage() {
  const [billing, setBilling] = useState('monthly');

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles-landing'],
    queryFn: () => base44.entities.StudentProfile.list(),
  });
  const studentCount = (profiles || []).length;

  return (
    <div className="min-h-screen bg-background text-foreground font-body">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="font-display font-black text-lg tracking-widest text-primary">JOTA FIT</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/onboarding" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
            <Link to="/onboarding" className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
              Começar agora
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            {studentCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6">
                💪 +{studentCount} alunos já evoluíram
              </div>
            )}
            <h1 className="font-display text-4xl sm:text-6xl font-black leading-tight tracking-tight">
              Aprenda calistenia<br />
              <span className="text-primary">do zero ao avançado</span><br />
              com o Jota
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-6 leading-relaxed">
              Treinos gamificados, acompanhamento real e uma jornada que te faz evoluir de verdade.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link to="/onboarding" className="w-full sm:w-auto bg-gold text-accent-foreground font-display font-black px-8 py-4 rounded-2xl text-base hover:bg-gold/90 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-gold/20">
                Começar agora <ChevronRight className="w-5 h-5" />
              </Link>
              <Link to="/trilhas" className="w-full sm:w-auto border border-border text-foreground font-bold px-8 py-4 rounded-2xl text-base hover:bg-muted transition-all flex items-center justify-center gap-2">
                Ver trilhas de treino
              </Link>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.7 }}
            className="relative mx-auto max-w-sm"
          >
            <div className="w-56 h-56 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-gold/20 flex items-center justify-center border-4 border-primary/20 shadow-2xl shadow-primary/20">
              <span className="text-8xl">🧗</span>
            </div>
            <div className="absolute -top-4 -right-4 bg-card border border-gold/30 rounded-2xl px-3 py-2 shadow-xl">
              <p className="text-xs font-bold text-gold">⚡ +250 XP</p>
            </div>
            <div className="absolute -bottom-2 -left-4 bg-card border border-primary/30 rounded-2xl px-3 py-2 shadow-xl">
              <p className="text-xs font-bold text-primary">🏆 Nível 7</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUEM É O JOTA */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col items-center md:items-start">
              <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-primary/20 to-gold/10 border-2 border-primary/20 flex items-center justify-center text-8xl shadow-2xl shadow-primary/10 mb-6">
                🏋️
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {['🎓 Ed. Física', '💪 Calistenia', '🎯 Método próprio'].map(b => (
                  <span key={b} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-sm font-bold">{b}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-primary tracking-widest uppercase mb-3">Quem é o Jota</p>
              <h2 className="font-display text-3xl font-black mb-4">João Victor — <span className="text-primary">Jota</span></h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                Estudante de Educação Física, apaixonado por calistenia há anos. Missão: te levar do primeiro pull-up ao muscle-up com método, consistência e gamificação.
              </p>
              <p className="text-muted-foreground leading-relaxed text-base mt-4">
                Criou o Jota Fit pra acabar com o treino sem sentido. Aqui, cada repetição conta. Cada dia de streak importa. Cada conquista é celebrada.
              </p>
              <a href="https://instagram.com/jotav.fit" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-6 text-primary font-bold hover:underline">
                <Instagram className="w-4 h-4" /> @jotav.fit
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-primary tracking-widest uppercase mb-2">Como funciona</p>
            <h2 className="font-display text-3xl font-black">Simples, direto, que funciona</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_CARDS.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 text-center"
              >
                <div className="text-4xl mb-4">{c.icon}</div>
                <h3 className="font-bold text-base mb-2">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRILHAS */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-primary tracking-widest uppercase mb-2">Trilhas de Aprendizado</p>
            <h2 className="font-display text-3xl font-black">Escolha seu caminho</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {TRACKS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-colors"
              >
                <span className="text-4xl">{t.emoji}</span>
                <div>
                  <h3 className="font-bold">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                  <span className="text-xs text-primary font-bold mt-1 inline-block">{t.level}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/trilhas" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
              Ver todas as trilhas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-primary tracking-widest uppercase mb-2">Depoimentos</p>
            <h2 className="font-display text-3xl font-black">Quem já evoluiu</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array(t.stars).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 fill-gold text-gold" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <p className="font-bold text-sm">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="py-24 px-6 bg-card/30" id="planos">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary tracking-widest uppercase mb-2">Planos</p>
            <h2 className="font-display text-3xl font-black mb-6">Escolha seu plano</h2>
            <div className="inline-flex items-center bg-muted rounded-xl p-1 gap-1">
              <button onClick={() => setBilling('monthly')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${billing === 'monthly' ? 'bg-card text-foreground shadow' : 'text-muted-foreground'}`}>Mensal</button>
              <button onClick={() => setBilling('yearly')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${billing === 'yearly' ? 'bg-card text-foreground shadow' : 'text-muted-foreground'}`}>
                Anual <span className="text-success text-xs ml-1">-17%</span>
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`relative bg-card rounded-2xl p-6 flex flex-col ${p.popular ? 'border-2 border-gold shadow-lg shadow-gold/10' : 'border border-border'}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-accent-foreground text-xs font-black px-4 py-1 rounded-full">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="font-display font-black text-lg mb-2">{p.name}</h3>
                <div className="mb-4">
                  {billing === 'monthly' ? (
                    <span className="font-display text-3xl font-black">{p.price_monthly === 0 ? 'Grátis' : `R$${p.price_monthly}`}</span>
                  ) : (
                    <span className="font-display text-3xl font-black">{p.price_yearly === 0 ? 'Grátis' : `R$${p.price_yearly}/ano`}</span>
                  )}
                  {p.price_monthly > 0 && billing === 'monthly' && <span className="text-muted-foreground text-sm">/mês</span>}
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {p.features.map(f => <li key={f} className="flex items-center gap-2 text-sm"><span className="text-success">✅</span>{f}</li>)}
                  {p.missing.map(f => <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><span>❌</span>{f}</li>)}
                </ul>
                <Link to={p.href} className={`w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${p.popular ? 'bg-gold text-accent-foreground hover:bg-gold/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-4xl font-black mb-4">Pronto pra começar?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Junte-se aos alunos que já estão evoluindo com o método Jota. Grátis pra começar.</p>
          <Link to="/onboarding" className="inline-flex items-center gap-2 bg-gold text-accent-foreground font-display font-black px-10 py-5 rounded-2xl text-lg hover:bg-gold/90 transition-all hover:scale-105 shadow-2xl shadow-gold/20">
            Começar agora 💪
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">🔥</span>
          <span className="font-display font-black tracking-widest text-primary">JOTA FIT</span>
        </div>
        <p className="text-sm text-muted-foreground">by João Victor • <a href="https://instagram.com/jotav.fit" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@jotav.fit</a></p>
        <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <Link to="/onboarding" className="hover:text-foreground">Entrar</Link>
          <Link to="/planos" className="hover:text-foreground">Planos</Link>
          <Link to="/trilhas" className="hover:text-foreground">Trilhas</Link>
        </div>
      </footer>
    </div>
  );
}