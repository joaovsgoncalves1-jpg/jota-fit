import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Flame } from 'lucide-react';
import XPBadge from '@/components/game/XPBadge';
import HomeDashboard from './HomeDashboard';
import {
  useCurrentUser,
  useTodayCheckin, useMyProfile, useRegisterCheckin,
} from '@/services';

export default function CheckinPage() {
  const { user } = useCurrentUser();
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const { data: todayCheckin } = useTodayCheckin(user?.email);
  const { data: profile } = useMyProfile(user?.email);
  const checkinMutation = useRegisterCheckin();

  const alreadyCheckedIn = !!todayCheckin || justCheckedIn;

  const handleCheckin = () => {
    if (!user?.email || !profile) return;
    checkinMutation.mutate(
      { email: user.email, profile },
      {
        onSuccess: ({ xpEarned }) => {
          setXpAmount(xpEarned);
          setShowXP(true);
          setJustCheckedIn(true);
          setTimeout(() => setShowXP(false), 2500);
        },
      }
    );
  };

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
            onClick={handleCheckin}
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
                🔥 Streak: {profile?.currentStreak || 1} dias · Volte amanhã!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <HomeDashboard />
    </div>
  );
}