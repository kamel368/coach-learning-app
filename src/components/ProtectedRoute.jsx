import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userRole, loading, isSuperAdmin } = useAuth();
  const location = useLocation();

  // Attendre le chargement
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Chargement...</div>
      </div>
    );
  }

  // Non connecté → Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Super Admin a accès à tout
  if (isSuperAdmin) {
    return children;
  }

  // Vérifier le rôle si des rôles sont spécifiés
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Rediriger selon le rôle
    if (userRole === 'learner') {
      return <Navigate to="/apprenant/dashboard" replace />;
    } else if (userRole === 'admin' || userRole === 'trainer') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Redirection automatique selon le rôle (si pas de allowedRoles spécifié)
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/dashboard';
  const isApprenantRoute = location.pathname.startsWith('/apprenant');

  // Si apprenant essaie d'accéder à une route admin → rediriger vers dashboard apprenant
  if (userRole === 'learner' && isAdminRoute) {
    return <Navigate to="/apprenant/dashboard" replace />;
  }

  // Si admin essaie d'accéder à une route apprenant → rediriger vers dashboard admin
  if ((userRole === 'admin' || userRole === 'trainer') && isApprenantRoute) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
