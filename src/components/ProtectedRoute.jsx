// src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, userRole, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/login" />;

  // Redirection automatique selon le rôle
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/dashboard';
  const isApprenantRoute = location.pathname.startsWith('/apprenant');

  // Si apprenant essaie d'accéder à une route admin → rediriger vers dashboard apprenant
  if (userRole === 'learner' && isAdminRoute) {
    return <Navigate to="/apprenant/dashboard" replace />;
  }

  // Si admin essaie d'accéder à une route apprenant → rediriger vers dashboard admin
  if (userRole === 'admin' && isApprenantRoute) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
