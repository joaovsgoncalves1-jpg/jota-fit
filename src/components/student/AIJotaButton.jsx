import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AIJotaButton({ profile, skills, skillProgress, workoutLogs, workouts }) {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [customRequest, setCustomRequest] = useState('');
  const [response, setResponse] = useState('');

  const { data: instructorArr } = useQuery({
    queryKey: ['instructor-profile'],
    queryFn: () => base44.entities.InstructorProfile.list(),
    enabled: open,
  });
  const instructor = instructorArr?.[0];

  const askMutation = useMutation({
    mutationFn: async () => {
      const lastWorkout = workoutLogs?.[0];
      const lastWorkoutName = workouts?.find(w => w.id === lastWorkout?.workout_id)?.name || 'nenhum';
      const completedSkillNames = (skillProgress || [])
        .filter(sp => sp.status === 'completed')
        .map(sp => skills?.find(s => s.id === sp.skill_id)?.name)
        .filter(Boolean).join(', ') || 'nenhuma';
      const inProgressSkills = (skillProgress || [])
        .filter(sp => sp.status === 'in_progress')
        .map(sp => skills?.find(s => s.id === sp.skill_id)?.name)
        .filter(Boolean).join(', ') || 'nenhuma';

      const manifesto = instructor?.manifesto || `
Filosofia: Progressão > intensidade. Consistência > perfeição.
Método: Sempre começar com a versão mais fácil e progredir gradualmente.
Estilo de resposta: Direto, sem frescura, mas empático. Como um amigo treinado.
Erros comuns: Pular progressões, ignorar descanso, não registrar progresso.
Adaptação: Se não consegue 3x8, regredir. Se 3x12 fácil, progredir.
Tom: Motivador, informal, como o Jota falaria com seu aluno.
`;

      const prompt = `
Você é o Jota (João Victor), instrutor de calistenia do Jota Fit. Use seu manifesto abaixo para responder.

MANIFESTO DO JOTA:
${manifesto}

DADOS DO ALUNO:
- Nome: ${profile?.name || 'Aluno'}
- Nível: ${profile?.fitness_level || 'beginner'}
- XP Total: ${profile?.xp_total || 0}
- Streak atual: ${profile?.current_streak || 0} dias
- Skills concluídas: ${completedSkillNames}
- Skills em progresso: ${inProgressSkills}
- Último treino: ${lastWorkoutName}
- Peso: ${profile?.weight_kg ? profile.weight_kg + 'kg' : 'não informado'}

PEDIDO DO ALUNO:
${customRequest || 'Me sugira um treino baseado no meu nível atual'}

Responda COMO O JOTA (informal, direto, motivador, máx 5 linhas). Sugira exercícios concretos com séries e repetições quando relevante. Use linguagem do Jota: "Fala!", "Bora!", "manda ver".
`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });

      // Save to AIRequest
      await base44.entities.AIRequest.create({
        student_email: user.email,
        request_text: customRequest || 'Sugestão de treino automática',
        ai_response: result,
        status: 'ai_answered',
        is_premium: profile?.plan_type === 'premium',
      });

      return result;
    },
    onSuccess: (data) => {
      setResponse(data);
    },
  });

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="border-primary/30 text-primary hover:bg-primary/10 font-bold gap-2"
      >
        <Sparkles className="w-4 h-4" /> Pedir sugestão pro Jota
      </Button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-md p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="font-bold">Pedir pro Jota</h3>
                    <p className="text-xs text-muted-foreground">IA baseada no método do Jota</p>
                  </div>
                </div>
                <button onClick={() => { setOpen(false); setResponse(''); setCustomRequest(''); }}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {!response ? (
                <>
                  <textarea
                    value={customRequest}
                    onChange={e => setCustomRequest(e.target.value)}
                    placeholder="Ex: 'Tô focado em barra. O que sugere?' ou deixe em branco pra sugestão automática"
                    rows={3}
                    className="w-full bg-muted/20 border border-[#333] rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/30 resize-none text-foreground"
                  />
                  <Button
                    onClick={() => askMutation.mutate()}
                    disabled={askMutation.isPending}
                    className="w-full bg-primary font-bold rounded-xl gap-2"
                  >
                    {askMutation.isPending ? (
                      <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Jota pensando...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Enviar pergunta</>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-muted/20 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🔥</span>
                      <span className="font-bold text-primary text-sm">Jota responde:</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{response}</p>
                  </div>
                  <Button
                    onClick={() => { setResponse(''); setCustomRequest(''); }}
                    variant="outline"
                    className="w-full"
                  >
                    Fazer outra pergunta
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}