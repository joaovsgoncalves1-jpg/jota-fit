import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { motion } from 'framer-motion';
import { CheckCircle, Flame } from 'lucide-react';
import XPBadge from '@/components/game/XPBadge';
import { format } from 'date-fns';
import HomeDashboard from './HomeDashboard';

export default function CheckinPage() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todayCheckin } = useQuery({
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
  const alreadyCheckedIn = (todayCheckin && todayCheckin.length > 0) || justCheckedIn;

  const checkinMutation = useMutation({
    mutationFn: async () => {
      const checkinXP = xpConfigs?.find(c => c.action_type === 'checkin')?.xp_value || 50;
      await base44.entities.Checkin.create({ student_email: user.email, date: today, xp_earned: checkinXP });
      const yesterday = format(new Date(new Date().setDate(new Date().getDate() - 1)), 'yyyy-MM-dd');
      const newStreak = myProfile?.last_checkin_date === yesterday ? (myProfile?.current_streak || 0) + 1 : 1;
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
      setJustCheckedIn(true);
      setTimeout(() => setShowXP(false), 2500);
      queryClient.invalidateQueries({ queryKey: ['checkin-today'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <XPBadge amount={xpAmount} show={showXP} />

      {!alreadyCheckedIn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pt-4 pb-2"
        >
          <button
            onClick={() => checkinMutation.mutate()}
            disabled={checkinMutation.isPending}
            className="w-full flex items-center gap-4 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/40 rounded-2xl p-4 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] shrink-0"
            >
              {checkinMutation.isPending ? (
                <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Flame className="w-8 h-8 text-white" />
              )}
            </motion.div>
            <div className="text-left">
              <p className="font-display font-black text-lg text-primary">FAZER CHECK-IN</p>
              <p className="text-sm text-muted-foreground">Registre sua presença e ganhe XP 🔥</p>
            </div>
          </button>
        </motion.div>
      )}

      {alreadyCheckedIn && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-4 pt-4 pb-2"
        >
          <div className="w-full flex items-center gap-4 bg-success/10 border border-success/30 rounded-2xl p-4">
            <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <p className="font-display font-black text-base text-success">CHECK-IN FEITO! ✅</p>
              <p className="text-sm text-muted-foreground">
                🔥 Streak: {myProfile?.current_streak || 1} dias · Volte amanhã!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <HomeDashboard />
    </div>
  );
}