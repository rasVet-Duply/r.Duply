import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth, loginWithRedirect } from 'zitejs/auth';
import { Toaster } from '@project/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import { FarmProvider, useFarm } from './lib/farm';
import { ThemeProvider } from './lib/theme';
import { LangProvider } from './lib/i18n';
import Landing from './pages/Landing';
import Login from './pages/Login';
import JoinLink from './pages/JoinLink';
import Onboarding from './pages/Onboarding';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Animals from './pages/Animals';
import AnimalPage from './pages/AnimalPage';
import Production from './pages/Production';
import Finance from './pages/Finance';
import Waste from './pages/Waste';
import Team from './pages/Team';
import Settings from './pages/Settings';


const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-accent" />
  </div>
);

function RequireAuth() {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && !user) loginWithRedirect();
  }, [isLoading, user]);
  if (isLoading || !user) return <Spinner />;
  return (
    <FarmProvider>
      <Outlet />
    </FarmProvider>
  );
}

function RequireFarm() {
  const { me, loading } = useFarm();
  if (loading) return <Spinner />;
  if (!me?.farm) return <Navigate to="/onboarding" replace />;
  return <Layout />;
}

export default function App() {
  return (
    <ThemeProvider>
    <LangProvider>{(lang) => (
    <BrowserRouter>
      <Toaster />
      <Routes key={lang}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join/:code" element={<JoinLink />} />
        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<RequireFarm />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/animals" element={<Animals />} />
            <Route path="/animals/:id" element={<AnimalPage />} />
            <Route path="/production" element={<Production />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/waste" element={<Waste />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    )}</LangProvider>
    </ThemeProvider>
  );
}
