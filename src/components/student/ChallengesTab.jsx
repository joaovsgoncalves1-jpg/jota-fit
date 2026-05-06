import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { format, differenceInDays, isPast } from 'date-fns';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import confetti from 'canvas-confetti';

const UNIT_LABELS = { reps: 'reps', seconds: 'seg', days: 'dias', minutes: 'min' };

function RegisterProgressModal({ challenge, progress, onClose, onSave }) {
  const [value, setValue] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-sm p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{challenge.badge_icon} Registrar Progresso</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Progresso atual: <span className="text-foreground font-bold">{progress?.current_value || 0}</span> / {challenge.target_value} {UNIT_LABELS[challenge.target_unit]}
          </p>
          <p className="text-xs text-muted-foreground mb-3">Adicionar quanto?</p>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={`Em ${UNIT_LABELS[challenge.target_unit]}...`}
            className="w-full bg-muted/20 border border-[#333] rounded-xl px-3 py-3 text-2xl font-bold text-center outline-none focus:border-primary/40"
            autoFocus
          />
        </div>
        <Button
          onClick={() => onSave(Number(value))}
          disabled={!value || Number(value) <= 0}
          className="w-full bg-primary font-bold rounded-xl"
        >
          Registrar
        </Button>
      </motion.div>
    </div>
  );
}

export default function ChallengesTab() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [registering, setRegistering] = useState(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: challenges } = useQuery({
    queryKey: ['all-challenges'],
    queryFn: () => base44.entities.Challenge.list('-created_date'),
  });

  const { data: myProgresses } = useQuery({
    queryKey: ['my-challenge-progresses', user?.email],
    queryFn: () => base44.entities.ChallengeProgress.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allProgresses } = useQuery({
    queryKey: ['all-challenge-progresses'],
    queryFn: () => base44.entities.ChallengeProgress.list(),
  });

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.StudentProfile.list(),
  });

  const { data: myProfile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
    select: data => data?.[0],
  });

  const saveMutation = useMutation({
    mutationFn: async ({ challenge, addValue }) => {
      const existing = myProgresses?.find(p => p.challenge_id === challenge.id);
      const currentValue = (existing?.current_value || 0) + addValue;
      const completed = currentValue >= challenge.target_value;

      if (existing) {
        await base44.entities.ChallengeProgress.update(existing.id, {
          current_value: currentValue,
          completed,
          completed_date: completed ? today : undefined,
        });
      } else {
        await base44.entities.ChallengeProgress.create({
          challenge_id: challenge.id,
          student_email: user.email,
          current_value: currentValue,
          completed,
          completed_date: completed ? today : undefined,
        });
        // Increment participants
        await base44.entities.Challenge.update(challenge.id, {
          participants_count: (challenge.participants_count || 0) + 1,
        });
      }

      if (completed && !existing?.completed) {
        // Award XP
        if (myProfile) {
          await base44.entities.StudentProfile.update(myProfile.id, {
            xp_total: (myProfile.xp_total || 0) + (challenge.xp_reward || 0),
          });
        }
        return { completed: true, challenge };
      }
      return { completed: false };
    },
    onSuccess: (data) => {
      qc.invalidateQueries();
      if (data?.completed) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        toast({ title: `Desafio completo! ${data.challenge.badge_icon} +${data.challenge.xp_reward} XP 🎉` });
      }
      setRegistering(null);
    },
  });

  const active = (challenges || []).filter(c => !isPast(new Date(c.end_date + 'T23:59:59')) && !isPast(new Date(c.start_date + 'T00:00:00') > new Date()));
  const expired = (challenges || []).filter(c => isPast(new Date(c.end_date + 'T23:59:59')));

  const ChallengeCard = ({ c, isExpired }) => {
    const myProgress = myProgresses?.find(p => p.challenge_id === c.id);
    const currentVal = myProgress?.current_value || 0;
    const pct = Math.min(100, Math.round((currentVal / (c.target_value || 1)) * 100));
    const daysLeft = differenceInDays(new Date(c.end_date), new Date());
    const completed = myProgress?.completed;

    const topParticipants = [...(allProgresses || [])]
      .filter(p => p.challenge_id === c.id)
      .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
      .slice(0, 5);

    return (
      <div className={`bg-[#1a1a1a] border rounded-2xl p-4 space-y-3 ${isExpired ? 'opacity-60 border-[#2a2a2a]' : 'border-[#333]'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{c.badge_icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{c.name}</h3>
                {!isExpired && <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-bold">Ativo</span>}
                {isExpired && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">{completed ? 'Completo' : 'Expirado'}</span>}
              </div>
              {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
            </div>
          </div>
        </div>

        {!isExpired && <div className="flex items-center gap-2 text-xs">
          <span className="text-primary font-bold">⏱ Restam {daysLeft} dias</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-gold font-bold">⚡ {c.xp_reward} XP</span>
        </div>}

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Seu progresso</span>
            <span className="font-bold text-foreground">{currentVal} / {c.target_value} {UNIT_LABELS[c.target_unit]} ({pct}%)</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${completed ? 'bg-success' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Top 5 */}
        {topParticipants.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-bold mb-2">🏆 Top Participantes</p>
            <div className="space-y-1">
              {topParticipants.map((tp, i) => {
                const prof = profiles?.find(p => p.email === tp.student_email);
                const tpPct = Math.min(100, Math.round(((tp.current_value || 0) / (c.target_value || 1)) * 100));
                return (
                  <div key={tp.id} className="flex items-center gap-2">
                    <span className="text-xs w-4 text-muted-foreground">{i + 1}</span>
                    <p className="text-xs font-bold truncate flex-1">{prof?.name?.split(' ')[0] || tp.student_email.split('@')[0]}</p>
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${tpPct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{tpPct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isExpired && !completed && (
          <Button
            onClick={() => setRegistering(c)}
            className="w-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-bold rounded-xl"
            variant="ghost"
          >
            Registrar Progresso
          </Button>
        )}
        {completed && <div className="text-center text-success font-bold text-sm">✅ Desafio Completo!</div>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {(challenges || []).length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">Nenhum desafio disponível</p>
        </div>
      )}

      {active.map(c => <ChallengeCard key={c.id} c={c} isExpired={false} />)}

      {expired.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-bold mb-2">Desafios Encerrados</p>
          {expired.map(c => <ChallengeCard key={c.id} c={c} isExpired={true} />)}
        </div>
      )}

      {registering && (
        <RegisterProgressModal
          challenge={registering}
          progress={myProgresses?.find(p => p.challenge_id === registering.id)}
          onClose={() => setRegistering(null)}
          onSave={(val) => saveMutation.mutate({ challenge: registering, addValue: val })}
        />
      )}
    </div>
  );
}