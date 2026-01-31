// src/App.jsx
import './lib/supabase';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ToastContainer from "./components/Toast/ToastContainer";
import ProtectedRoute from "./components/ProtectedRoute";

// Script d'audit des exercices (disponible via window.auditExercises dans la console)
import './scripts/auditExercises';
import './scripts/migrateToMultiTenant';
import './scripts/migrateExercises';
import './scripts/verifyBeforeCleanup';
import './scripts/cleanupOldStructure';
import './scripts/resetDatabasePartial';
import './scripts/resetDatabaseTotal';
import './scripts/cleanupModulesCollections';
import './utils/migrateProgramStatus';
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from "./components/Sidebar";
import { useState, useEffect } from "react";

// Pages Auth
import Login from "./pages/login";
import RegisterPage from "./pages/RegisterPage";
import { Menu } from "lucide-react";

// Pages Super Admin
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import SuperAdminOrganizations from "./pages/superadmin/SuperAdminOrganizations";
import SuperAdminUsers from "./pages/superadmin/SuperAdminUsers";
import SuperAdminSettings from "./pages/superadmin/SuperAdminSettings";

// Pages Admin
import Dashboard from "./pages/Dashboard";
import AdminPrograms from "./pages/AdminPrograms";
import AdminProgramDetail from "./pages/AdminProgramDetail";
import AuditPage from "./pages/admin/AuditPage";
import CreateTestExercises from "./pages/admin/CreateTestExercises";
import AdminUsers from "./pages/AdminUsers";
import MigrationPage from "./pages/admin/MigrationPage";
import EmployeeDetailPage from "./pages/admin/EmployeeDetailPage";

// ✅ Nouvelle page Teachizy-like
import LessonEditorPage from "./pages/LessonEditorPage";

// ✅ Builder d'exercices
import ExerciseEditorPage from "./pages/admin/ExerciseEditorPage";
import ExerciseEditorPageTemp from "./pages/admin/ExerciseEditorPageTemp";

// ✅ Page temporaire de nettoyage Firebase
import CleanupPage from "./pages/CleanupPage";

// ✅ Page de test Supabase Auth
import SupabaseTest from "./pages/SupabaseTest";
import SupabaseRLSTest from "./pages/SupabaseRLSTest";

// Pages Apprenant - V2
import ApprenantLayout from './components/apprenant/ApprenantLayout';
import ApprenantDashboard from './pages/apprenant/ApprenantDashboard';
import ApprenantProgramDetail from './pages/apprenant/ApprenantProgramDetail';
import ApprenantChapterDetail from './pages/apprenant/ApprenantChapterDetail';
import ApprenantLessonViewer from './pages/apprenant/ApprenantLessonViewer';
import ApprenantExercises from './pages/apprenant/ApprenantExercises';
import ApprenantExercisesResults from './pages/apprenant/ApprenantExercisesResults';
import ApprenantChapterEvaluation from './pages/apprenant/ApprenantChapterEvaluation';
import ApprenantChapterEvaluationResults from './pages/apprenant/ApprenantChapterEvaluationResults';
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
  location.pathname.startsWith('/superadmin') || // ✅ Masquer sidebar sur pages super admin
  location.pathname === '/login' ||
  location.pathname === '/register' ||
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
          <Route path="/register" element={<RegisterPage />} />
          
          {/* ✅ Page de test Supabase Auth */}
          <Route path="/supabase-test" element={<SupabaseTest />} />
          
          {/* ✅ Page de test RLS Supabase */}
          <Route path="/supabase-rls-test" element={<SupabaseRLSTest />} />

          {/* Routes Super Admin avec layout spécifique */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="organizations" element={<SuperAdminOrganizations />} />
            <Route path="users" element={<SuperAdminUsers />} />
            <Route path="settings" element={<SuperAdminSettings />} />
          </Route>

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
          <Route
            path="/admin/programs"
            element={
              <ProtectedRoute>
                <AdminPrograms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute>
                <AuditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-test-exercises"
            element={
              <ProtectedRoute>
                <CreateTestExercises />
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
            path="/admin/programs/:programId/chapters/:chapterId/lessons/:lessonId/edit"
            element={
              <ProtectedRoute>
                <LessonEditorPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ Builder d'exercices (PLEIN ÉCRAN) */}
          <Route
            path="/admin/programs/:programId/chapters/:chapterId/exercises"
            element={
              <ProtectedRoute>
                <ExerciseEditorPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ Éditeur d'exercice temporaire Supabase */}
          <Route
            path="/admin/exercise/:exerciseId"
            element={
              <ProtectedRoute>
                <ExerciseEditorPageTemp />
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
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees/:employeeId"
            element={
              <ProtectedRoute>
                <EmployeeDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/migration"
            element={
              <ProtectedRoute>
                <MigrationPage />
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
            
            {/* ✅ Détail d'un chapitre */}
            <Route path="programs/:programId/chapters/:chapterId" element={
              <ProtectedRoute>
                <ApprenantChapterDetail />
              </ProtectedRoute>
            } />
            
            {/* ✅ Exercices d'un chapitre */}
            <Route path="programs/:programId/chapters/:chapterId/exercises" element={
              <ProtectedRoute>
                <ApprenantExercises />
              </ProtectedRoute>
            } />
            
            {/* 🔍 DEBUG exercices */}
            <Route path="programs/:programId/chapters/:chapterId/exercises/debug" element={
              <ProtectedRoute>
                <ExerciseDebugPage />
              </ProtectedRoute>
            } />
            
            {/* ✅ Résultats des exercices */}
            <Route path="programs/:programId/chapters/:chapterId/exercises/results" element={
              <ProtectedRoute>
                <ApprenantExercisesResults />
              </ProtectedRoute>
            } />
            
            {/* 🏆 Évaluation complète du chapitre */}
            <Route path="evaluation/:programId/:chapterId" element={
              <ProtectedRoute>
                <ApprenantChapterEvaluation />
              </ProtectedRoute>
            } />
            
            {/* 🏆 Résultats évaluation chapitre */}
            <Route path="evaluation/:programId/:chapterId/results" element={
              <ProtectedRoute>
                <ApprenantChapterEvaluationResults />
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
            <Route path="programs/:programId/chapters/:chapterId/lessons/:lessonId" element={
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

      {/* Toast Container pour les notifications */}
      <ToastContainer />
    </div>
  );
}


function App() {
  return (
    <AuthProvider>
      <SupabaseAuthProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </SupabaseAuthProvider>
    </AuthProvider>
  );
}

export default App;
