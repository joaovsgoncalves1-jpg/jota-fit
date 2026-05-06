import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, CheckCircle, Dumbbell, TreePine, Trophy, Target, Flame, TrendingUp
} from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateLevel } from '@/lib/gamification';

const NAV_ITEMS = [
  { path: '/', label: 'Check-in', icon: CheckCircle },
  { path: '/treinos', label: 'Treinos', icon: Dumbbell },
  { path: '/skills', label: 'Skills', icon: TreePine },
  { path: '/progresso', label: 'Progresso', icon: TrendingUp },
  { path: '/ranking', label: 'Ranking', icon: Trophy },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useCurrentUser();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => base44.entities.StudentProfile.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const myProfile = profile?.[0];
  const levelInfo = calculateLevel(myProfile?.xp_total || 0);

  // Redirect to onboarding if no profile exists
  useEffect(() => {
    if (!loadingProfile && profile && profile.length === 0 && user?.role !== 'admin') {
      navigate('/onboarding');
    }
  }, [loadingProfile, profile, user]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-bold tracking-wider">JOTA FIT</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-gold/10 text-gold px-2.5 py-1 rounded-full font-bold">
              <span>⚡</span>
              <span>{myProfile?.xp_total || 0} XP</span>
            </div>
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
              <span>Nv.{levelInfo.level}</span>
            </div>
            {myProfile?.current_streak > 0 && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                <span>🔥</span>
                <span>{myProfile.current_streak}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-xl border-t border-border">
        <div className="flex justify-around py-2 px-1 max-w-lg mx-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-medium transition-all
                  ${active 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                  }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_hsl(var(--primary))]' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}