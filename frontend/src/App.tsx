import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ZoneDetail from './pages/ZoneDetail';
import CitizenReport from './pages/CitizenReport';
import AlertsPanel from './pages/AlertsPanel';
import ReportsQueue from './pages/ReportsQueue';
import NotificationsPage from './pages/NotificationsPage';
import Profile from './pages/Profile';
import Layout from './components/Layout';

function ProtectedRoute({ children, authorityOnly = false }: { children: React.ReactNode; authorityOnly?: boolean }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (authorityOnly && user.role !== 'authority') return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="zones/:id" element={<ZoneDetail />} />
        <Route path="report" element={<CitizenReport />} />
        <Route path="alerts" element={<AlertsPanel />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="reports" element={<ProtectedRoute authorityOnly><ReportsQueue /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
