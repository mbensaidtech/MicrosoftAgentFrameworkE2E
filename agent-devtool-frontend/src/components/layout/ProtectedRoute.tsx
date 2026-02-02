import { Navigate } from 'react-router-dom';
import { useProfile } from '../../lib/hooks/useProfile';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { hasProfile } = useProfile();

  if (!hasProfile) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
