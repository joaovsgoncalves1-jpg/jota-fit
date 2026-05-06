import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { motion } from 'framer-motion';
import { Target, CheckCircle, Clock, Swords } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import ChallengesTab from '@/components/student/ChallengesTab';

const CONDITION_LABELS = {
  workouts_completed: 'Treinos concluídos',
  streak_days: 'Dias de streak',
  bosses_defeated: 'Chefes derrotados',
  checkins_completed: 'Check-ins realizados',
  xp_earned: 'XP acumulado',
};

export default function StudentMissionsPage() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState('missions');

  const { data: missions } = useQuery({
    queryKey: ['all-missions'],
    queryFn: () => base44.entities.Mission.list(),
  });

  const { data: missionProgress } = useQuery({
    queryKey: ['my-mission-progress', user?.email],
    queryFn: () => base44.entities.MissionProgress.filter({ student_email: user?.email }),
    enabled: !!user?.email,
  });

  const myMissions = (missions || []).filter(m => {
    if (m.for_all) return true;
    return m.target_emails?.includes(user?.email);
  });

  const activeMissions = myMissions.filter(m => {
    const mp = missionProgress?.find(p => p.mission_id === m.id);
    return !mp?.completed;
  });

  const completedMissions = myMissions.filter(m => {
    const mp = missionProgress?.find(p => p.mission_id === m.id);
    return mp?.completed;
  });

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-5 h-5 text-primary" />
        <h1 className="font-display text-lg font-bold">MISSÕES & DESAFIOS</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 rounded-xl p-1">
        <button
          onClick={() => setTab('missions')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all
            ${tab === 'missions' ? 'bg-card text-primary shadow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Target className="w-4 h-4" /> Missões
        </button>
        <button
          onClick={() => setTab('challenges')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all
            ${tab === 'challenges' ? 'bg-card text-primary shadow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Swords className="w-4 h-4" /> Desafios
        </button>
      </div>

      {tab === 'missions' && (
        <div className="space-y-6">
          {/* Active Missions */}
          <div>
            <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Ativas ({activeMissions.length})
            </h2>
            <div className="space-y-3">
              {activeMissions.map((mission, i) => {
                const mp = missionProgress?.find(p => p.mission_id === mission.id);
                const progress = mp?.current_progress || 0;
                const percentage = Math.min(100, (progress / mission.condition_value) * 100);

                return (
                  <motion.div
                    key={mission.id}
                    className="bg-card rounded-2xl border border-border p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-sm">{mission.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{mission.description}</p>
                      </div>
                      <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-1 rounded-full shrink-0 ml-2">
                        +{mission.xp_reward} XP
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">
                          {CONDITION_LABELS[mission.condition_type] || mission.condition_type}
                        </span>
                        <span className="text-xs font-bold">{progress}/{mission.condition_value}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                    {mission.end_date && (
                      <p className="text-[10px] text-muted-foreground mt-2">Até: {mission.end_date}</p>
                    )}
                  </motion.div>
                );
              })}
              {activeMissions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma missão ativa</p>
              )}
            </div>
          </div>

          {completedMissions.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" /> Concluídas ({completedMissions.length})
              </h2>
              <div className="space-y-2">
                {completedMissions.map(mission => (
                  <div key={mission.id} className="bg-card/50 rounded-xl border border-success/20 p-3 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{mission.name}</p>
                    </div>
                    <span className="text-xs font-bold text-gold">+{mission.xp_reward} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'challenges' && <ChallengesTab />}
    </div>
  );
}