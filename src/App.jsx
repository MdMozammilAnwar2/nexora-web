import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './store/auth';
import Layout from './components/Layout';
import { PageLoader } from './components/ui';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectView from './pages/ProjectView';
import Team from './pages/Team';
import Settings from './pages/Settings';

// HashRouter inside Electron (file://), BrowserRouter on the web
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { ready, user, init } = useAuth();
  useEffect(() => { init(); }, [init]);
  if (!ready) return <PageLoader />;

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: 14, fontSize: 14, fontWeight: 500 } }} />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Auth mode="login" />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Auth mode="register" />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectView />} />
          <Route path="team" element={<Protected role="admin"><Team /></Protected>} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
