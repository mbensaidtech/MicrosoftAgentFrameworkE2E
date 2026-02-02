import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProfilePage } from './pages/ProfilePage';
import { ChatPage } from './pages/ChatPage';
import { AgentsPage } from './pages/AgentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Layout } from './components/layout/Layout';
import { useProfile } from './lib/hooks/useProfile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { hasProfile } = useProfile();

  if (!hasProfile) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/chat" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents"
          element={
            <ProtectedRoute>
              <Layout>
                <AgentsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/profile" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
