import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { motion } from 'framer-motion';
import { CheckCircle, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import XPBadge from '@/components/game/XPBadge';
import StreakBadge from '@/components/game/StreakBadge';
import { format } from 'date-fns';

export default function CheckinPage() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todayCheckin, isLoading: loadingCheckin } = useQuery({
    queryKey: ['checkin-today', user?.email, today],
    queryFn: () => base44.entities.Checkin.filter({ student_email: user?.email, date: today }),
    enabled: !!user?.email,
  });

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: xpConfigs } = useQuery({
    queryKey: ['xp-configs'],
    queryFn: () => base44.entities.XPConfig.list(),
  });

  const myProfile = profile?.[0];
  const alreadyCheckedIn = todayCheckin && todayCheckin.length > 0;

  const checkinMutation = useMutation({
    mutationFn: async () => {
      const checkinXP = xpConfigs?.find(c => c.action_type === 'checkin')?.xp_value || 50;
      
      // Create check-in record
      await base44.entities.Checkin.create({
        student_email: user.email,
        date: today,
        xp_earned: checkinXP,
      });

      // Calculate new streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
      
      let newStreak = 1;
      if (myProfile?.last_checkin_date === yesterdayStr) {
        newStreak = (myProfile?.current_streak || 0) + 1;
      }

      // Update profile
      await base44.entities.StudentProfile.update(myProfile.id, {
        xp_total: (myProfile?.xp_total || 0) + checkinXP,
        current_streak: newStreak,
        max_streak: Math.max(newStreak, myProfile?.max_streak || 0),
        last_checkin_date: today,
      });

      return { xp: checkinXP, streak: newStreak };
    },
    onSuccess: (data) => {
      setXpAmount(data.xp);
      setShowXP(true);
      setTimeout(() => setShowXP(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['checkin-today'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <XPBadge amount={xpAmount} show={showXP} />

      <motion.div
        className="text-center max-w-sm w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Streak display */}
        <div className="mb-8">
          <StreakBadge days={myProfile?.current_streak || 0} size="lg" />
          {myProfile?.max_streak > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Recorde: {myProfile.max_streak} dias
            </p>
          )}
        </div>

        {/* Check-in button */}
        {alreadyCheckedIn ? (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="space-y-4"
          >
            <div className="w-32 h-32 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mx-auto">
              <CheckCircle className="w-16 h-16 text-success" />
            </div>
            <h2 className="font-display text-xl font-bold text-success">CHECK-IN FEITO!</h2>
            <p className="text-muted-foreground text-sm">Você já fez seu check-in hoje. Volte amanhã para manter sua streak!</p>
          </motion.div>
        ) : (
          <motion.div className="space-y-6">
            <button
              onClick={() => checkinMutation.mutate()}
              disabled={checkinMutation.isPending}
              className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-primary/70 border-4 border-primary/30 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] active:scale-95 transition-all disabled:opacity-50"
            >
              {checkinMutation.isPending ? (
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Flame className="w-16 h-16 text-white" />
              )}
            </button>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">CHECK-IN</h2>
              <p className="text-muted-foreground text-sm mt-1">Toque para registrar sua presença hoje</p>
            </div>
          </motion.div>
        )}

        {/* Today's date */}
        <p className="text-xs text-muted-foreground mt-8">
          {format(new Date(), "dd 'de' MMMM, yyyy")}
        </p>
      </motion.div>
    </div>
  );
}