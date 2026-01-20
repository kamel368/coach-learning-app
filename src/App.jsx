// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from "./components/Sidebar";
import { useState, useEffect } from "react";

// Pages Auth
import Login from "./pages/login";
import { Menu } from "lucide-react";

// Pages Admin
import Dashboard from "./pages/Dashboard";
import AdminRolesMetier from "./pages/AdminRolesMetier";
import AdminPrograms from "./pages/AdminPrograms";
import AdminProgramDetail from "./pages/AdminProgramDetail";
import AdminQuiz from "./pages/AdminQuiz";
import AdminAIExercises from "./pages/AdminAIExercises";
import AdminUsers from "./pages/AdminUsers";

// ✅ Nouvelle page Teachizy-like
import LessonEditorPage from "./pages/LessonEditorPage";

// ✅ Builder d'exercices
import ExerciseEditorPage from "./pages/admin/ExerciseEditorPage";

// ✅ Page temporaire de nettoyage Firebase
import CleanupPage from "./pages/CleanupPage";

// Pages Apprenant - V2
import ApprenantLayout from './components/apprenant/ApprenantLayout';
import ApprenantDashboard from './pages/apprenant/ApprenantDashboard';
import ApprenantProgramDetail from './pages/apprenant/ApprenantProgramDetail';
import ApprenantModuleDetail from './pages/apprenant/ApprenantModuleDetail';
import ApprenantLessonViewer from './pages/apprenant/ApprenantLessonViewer';
import ApprenantExercises from './pages/apprenant/ApprenantExercises';
import ApprenantExercisesResults from './pages/apprenant/ApprenantExercisesResults';
import ApprenantModuleEvaluation from './pages/apprenant/ApprenantModuleEvaluation';
import ApprenantModuleEvaluationResults from './pages/apprenant/ApprenantModuleEvaluationResults';
import ApprenantProgramEvaluation from './pages/apprenant/ApprenantProgramEvaluation';
import ApprenantProgramEvaluationResults from './pages/apprenant/ApprenantProgramEvaluationResults';
import ApprenantHistorique from './pages/apprenant/ApprenantHistorique';
import ApprenantBadges from './pages/apprenant/ApprenantBadges';
import ExerciseDebugPage from './pages/apprenant/ExerciseDebugPage';

function AppContent() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Pages en plein écran (sans sidebar principale)
  const isFullScreen = 
  (location.pathname.includes('/lessons/') && location.pathname.includes('/edit')) ||
  location.pathname.startsWith('/apprenant') || // ✅ Masquer sidebar sur pages apprenant
  location.pathname === '/login' ||
  location.pathname === '/';

  // Détecter la taille d'écran et ajuster le comportement
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Fermer la sidebar automatiquement sur mobile/tablette
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    // Initialiser
    handleResize();

    // Écouter les changements de taille
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fonction pour calculer le marginLeft en fonction de la taille d'écran
  const getMarginLeft = () => {
    if (isFullScreen) return 0;
    // Sur mobile/tablette (< 1024px), pas de margin car sidebar en overlay
    if (isMobile) return 0;
    return sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_COLLAPSED;
  };

  return (
    <div className="app-layout">
      {!isFullScreen && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}

      {/* Bouton toggle mobile - Visible uniquement sur tablette/mobile */}
      {!isFullScreen && isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1110,
            width: '44px',
            height: '44px',
            border: 'none',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            color: '#374151',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Menu size={24} />
        </button>
      )}

      <div
        className="main-content"
        style={{
          marginLeft: getMarginLeft(),
          minHeight: "100vh",
          background: "var(--color-bg)",
          transition: "margin-left 0.3s ease",
        }}
      >
        <Routes>
          {/* Toutes tes routes existantes... */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Routes Admin */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Redirection pour rétrocompatibilité */}
          <Route
            path="/admin/categories"
            element={<Navigate to="/admin/roles-metier" replace />}
          />
          <Route
            path="/admin/roles-metier"
            element={
              <ProtectedRoute>
                <AdminRolesMetier />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/programs"
            element={
              <ProtectedRoute>
                <AdminPrograms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/programs/:programId"
            element={
              <ProtectedRoute>
                <AdminProgramDetail />
              </ProtectedRoute>
            }
          />

          {/* ✅ Édition riche React-Quill d'une leçon (PLEIN ÉCRAN) */}
          <Route
            path="/admin/programs/:programId/modules/:moduleId/lessons/:lessonId/edit"
            element={
              <ProtectedRoute>
                <LessonEditorPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ Builder d'exercices (PLEIN ÉCRAN) */}
          <Route
            path="/admin/programs/:programId/modules/:moduleId/exercises"
            element={
              <ProtectedRoute>
                <ExerciseEditorPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ Page temporaire de nettoyage Firebase */}
          <Route
            path="/admin/cleanup"
            element={
              <ProtectedRoute>
                <CleanupPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/quizzes"
            element={
              <ProtectedRoute>
                <AdminQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-exercises"
            element={
              <ProtectedRoute>
                <AdminAIExercises />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          {/* Routes Apprenant - V2 */}
          <Route path="/apprenant" element={<ApprenantLayout />}>
            <Route path="dashboard" element={
              <ProtectedRoute>
                <ApprenantDashboard />
              </ProtectedRoute>
            } />
            
            {/* ✅ Détail d'un programme */}
            <Route path="programs/:programId" element={
              <ProtectedRoute>
                <ApprenantProgramDetail />
              </ProtectedRoute>
            } />
            
            {/* ✅ Détail d'un module */}
            <Route path="programs/:programId/modules/:moduleId" element={
              <ProtectedRoute>
                <ApprenantModuleDetail />
              </ProtectedRoute>
            } />
            
            {/* ✅ Exercices d'un module */}
            <Route path="programs/:programId/modules/:moduleId/exercises" element={
              <ProtectedRoute>
                <ApprenantExercises />
              </ProtectedRoute>
            } />
            
            {/* 🔍 DEBUG exercices */}
            <Route path="programs/:programId/modules/:moduleId/exercises/debug" element={
              <ProtectedRoute>
                <ExerciseDebugPage />
              </ProtectedRoute>
            } />
            
            {/* ✅ Résultats des exercices */}
            <Route path="programs/:programId/modules/:moduleId/exercises/results" element={
              <ProtectedRoute>
                <ApprenantExercisesResults />
              </ProtectedRoute>
            } />
            
            {/* 🏆 Évaluation complète du module */}
            <Route path="evaluation/:programId/:moduleId" element={
              <ProtectedRoute>
                <ApprenantModuleEvaluation />
              </ProtectedRoute>
            } />
            
            {/* 🏆 Résultats évaluation module */}
            <Route path="evaluation/:programId/:moduleId/results" element={
              <ProtectedRoute>
                <ApprenantModuleEvaluationResults />
              </ProtectedRoute>
            } />
            
            {/* 🏆 Évaluation complète du PROGRAMME */}
            <Route path="program-evaluation/:programId" element={
              <ProtectedRoute>
                <ApprenantProgramEvaluation />
              </ProtectedRoute>
            } />
            
            {/* 🏆 Résultats évaluation PROGRAMME */}
            <Route path="program-evaluation/:programId/results" element={
              <ProtectedRoute>
                <ApprenantProgramEvaluationResults />
              </ProtectedRoute>
            } />
            
            {/* ✅ Lecteur de leçon */}
            <Route path="programs/:programId/modules/:moduleId/lessons/:lessonId" element={
              <ProtectedRoute>
                <ApprenantLessonViewer />
              </ProtectedRoute>
            } />
            
            {/* 📊 Historique des tentatives */}
            <Route path="historique" element={
              <ProtectedRoute>
                <ApprenantHistorique />
              </ProtectedRoute>
            } />
            
            {/* 🏆 Badges et gamification */}
            <Route path="badges" element={
              <ProtectedRoute>
                <ApprenantBadges />
              </ProtectedRoute>
            } />
            
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* ✅ REDIRECTION : Anciennes routes /learner vers nouvelles routes /apprenant */}
          <Route path="/learner/*" element={<Navigate to="/apprenant/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}


function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
