import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Layouts
import AdminLayout from '@/components/layout/AdminLayout';
import StudentLayout from '@/components/layout/StudentLayout';

// Admin pages
import DashboardPage from '@/pages/admin/DashboardPage';
import StudentsPage from '@/pages/admin/StudentsPage';
import StudentDetailPage from '@/pages/admin/StudentDetailPage';
import WorkoutsPage from '@/pages/admin/WorkoutsPage';
import SkillsPage from '@/pages/admin/SkillsPage';
import MissionsPage from '@/pages/admin/MissionsPage';

// Student pages
import CheckinPage from '@/pages/student/CheckinPage';
import StudentWorkoutsPage from '@/pages/student/StudentWorkoutsPage';
import StudentSkillsPage from '@/pages/student/StudentSkillsPage';
import StudentMissionsPage from '@/pages/student/StudentMissionsPage';
import MyProfilePage from '@/pages/student/MyProfilePage';
import ProgressoPage from '@/pages/student/ProgressoPage';
import FeedPage from '@/pages/student/FeedPage';
import NotificacoesPage from '@/pages/student/NotificacoesPage';

// Admin pages extra
import ChallengesPage from '@/pages/admin/ChallengesPage';

// Shared
import RankingPage from '@/pages/RankingPage';
import OnboardingPage from '@/pages/OnboardingPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user: currentUser } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">🔥</span>
          </div>
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <Routes>
      {/* Admin routes */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/students" element={<StudentsPage />} />
        <Route path="/admin/students/:studentEmail" element={<StudentDetailPage />} />
        <Route path="/admin/workouts" element={<WorkoutsPage />} />
        <Route path="/admin/skills" element={<SkillsPage />} />
        <Route path="/admin/missions" element={<MissionsPage />} />
        <Route path="/admin/ranking" element={<RankingPage />} />
        <Route path="/admin/challenges" element={<ChallengesPage />} />
      </Route>

      {/* Onboarding */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Student routes */}
      <Route element={<StudentLayout />}>
        <Route path="/" element={<CheckinPage />} />
        <Route path="/treinos" element={<StudentWorkoutsPage />} />
        <Route path="/skills" element={<StudentSkillsPage />} />
        <Route path="/missoes" element={<StudentMissionsPage />} />
        <Route path="/perfil" element={<MyProfilePage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/progresso" element={<ProgressoPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/notificacoes" element={<NotificacoesPage />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App