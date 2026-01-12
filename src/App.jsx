// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from "./components/Sidebar";
import { useState } from "react";

// Pages Auth
import Login from "./pages/login";

// Pages Admin
import Dashboard from "./pages/Dashboard";
import AdminCategories from "./pages/AdminCategories";
import AdminPrograms from "./pages/AdminPrograms";
import AdminProgramDetail from "./pages/AdminProgramDetail";
import AdminModules from "./pages/AdminModules";
import AdminLessons from "./pages/AdminLessons";
import AdminQuiz from "./pages/AdminQuiz";
import AdminAIExercises from "./pages/AdminAIExercises";
import AdminUsers from "./pages/AdminUsers";

// ✅ Nouvelles pages Teachizy-like
import LessonsListPage from "./pages/LessonsListPage";
import LessonEditorPage from "./pages/LessonEditorPage";

// Pages Apprenant
import LearnerPrograms from "./pages/LearnerPrograms";
import LearnerProgramDetail from "./pages/LearnerProgramDetail";
import LearnerModuleDetail from "./pages/LearnerModuleDetail";
import LearnerQuiz from "./pages/LearnerQuiz";
import LearnerAIExercises from "./pages/LearnerAIExercises";
import LearnerAIExerciseSession from "./pages/LearnerAIExerciseSession";

function AppContent() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Pages en plein écran (sans sidebar principale)
  const isFullScreen = 
  (location.pathname.includes('/lessons/') && location.pathname.includes('/edit')) ||
  location.pathname === '/login' ||
  location.pathname === '/';

  return (
    <div>
      {!isFullScreen && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />}

      <div
        style={{
          marginLeft: isFullScreen ? 0 : (sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_COLLAPSED),
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
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute>
                <AdminCategories />
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
          <Route
            path="/admin/modules"
            element={
              <ProtectedRoute>
                <AdminModules />
              </ProtectedRoute>
            }
          />

          {/* Vue globale historique des leçons */}
          <Route
            path="/admin/lessons"
            element={
              <ProtectedRoute>
                <AdminLessons />
              </ProtectedRoute>
            }
          />

          {/* ✅ Nouvelle liste de leçons par module */}
          <Route
            path="/admin/programs/:programId/modules/:moduleId/lessons"
            element={
              <ProtectedRoute>
                <LessonsListPage />
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

          {/* Routes Apprenant */}
          <Route
            path="/learner/programs"
            element={
              <ProtectedRoute>
                <LearnerPrograms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/programs/:programId"
            element={
              <ProtectedRoute>
                <LearnerProgramDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/modules/:moduleId"
            element={
              <ProtectedRoute>
                <LearnerModuleDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/modules/:moduleId/quiz"
            element={
              <ProtectedRoute>
                <LearnerQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/modules/:moduleId/ai-exercises"
            element={
              <ProtectedRoute>
                <LearnerAIExercises />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/modules/:moduleId/ai-exercises/:exerciseId"
            element={
              <ProtectedRoute>
                <LearnerAIExerciseSession />
              </ProtectedRoute>
            }
          />
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
