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

  // Vérifier le rôle si des rôles sont spécifiés
  if (allowedRoles.length > 0) {
    // Si 'superadmin' est dans les rôles requis, seul un Super Admin peut accéder
    if (allowedRoles.includes('superadmin') && !isSuperAdmin) {
      return <Navigate to="/login" replace />;
    }
    
    // Si Super Admin et que 'superadmin' est requis, laisser passer
    if (allowedRoles.includes('superadmin') && isSuperAdmin) {
      return children;
    }
    
    // Pour les autres rôles, vérifier normalement
    if (!allowedRoles.includes(userRole) && !isSuperAdmin) {
      // Rediriger selon le rôle
      if (userRole === 'learner') {
        return <Navigate to="/apprenant/dashboard" replace />;
      } else if (userRole === 'admin' || userRole === 'trainer') {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  // Super Admin a accès à tout (sauf si 'superadmin' était explicitement requis et traité plus haut)
  if (isSuperAdmin) {
    return children;
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
