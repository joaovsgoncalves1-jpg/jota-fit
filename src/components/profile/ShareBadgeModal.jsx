import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { motion } from 'framer-motion';
import { X, Download, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export default function ShareBadgeModal({ achievement, profile, onClose }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const shareText = `🏆 Desbloquei ${achievement.name} no Jota Fit! 💪 @jotav.fit #JotaFit #Calistenia`;
  const [copied, setCopied] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ShareableBadge.create({
        student_email: user.email,
        achievement_id: achievement.id,
        achievement_name: achievement.name,
        achievement_emoji: achievement.icon,
        student_name: profile.name,
        share_text: shareText,
        shared: true,
        shared_at: new Date().toISOString(),
      });
    },
    onSuccess: () => qc.invalidateQueries(),
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    saveMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: shareText, title: `Conquista: ${achievement.name}` });
      saveMutation.mutate();
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-background border border-border rounded-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold">Compartilhar conquista</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Badge Preview */}
        <div className="p-6 bg-[#0a0a0a]">
          <div className="aspect-square max-w-xs mx-auto bg-[#111] border-2 border-gold/50 rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl shadow-gold/10">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">🔥</span>
              <span className="font-display font-black text-primary tracking-widest text-sm">JOTA FIT</span>
            </div>
            <div className="text-7xl mb-4">{achievement.icon || '🏅'}</div>
            <p className="font-display font-black text-xl text-gold text-center leading-tight">{achievement.name}</p>
            <p className="text-sm text-muted-foreground mt-2">{profile.name}</p>
            <div className="mt-6 border-t border-border/50 pt-4 w-full text-center">
              <p className="text-xs text-muted-foreground">@jotav.fit • jota.fit</p>
            </div>
          </div>
        </div>

        {/* Share text */}
        <div className="px-5 py-3 bg-muted/20 mx-5 rounded-xl my-4 text-sm text-muted-foreground">
          {shareText}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          <Button onClick={handleShare} className="w-full bg-primary font-bold rounded-xl gap-2">
            <Share2 className="w-4 h-4" /> Compartilhar
          </Button>
          <Button onClick={handleCopy} variant="outline" className="w-full font-bold rounded-xl gap-2">
            <Copy className="w-4 h-4" /> {copied ? 'Copiado! ✅' : 'Copiar texto'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}