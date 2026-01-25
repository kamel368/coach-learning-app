// src/components/Navbar.jsx
import { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function Navbar() {
  const { user, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  // Ne pas afficher la navbar sur les pages publiques
  const publicRoutes = ["/login", "/register"];
  if (publicRoutes.includes(location.pathname)) return null;

  if (!user) return null;

  const isAdmin = userRole === "admin";

  return (
    <nav
      style={{
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Logo */}
      <Link
        to={isAdmin ? "/admin" : "/apprenant/dashboard"}
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "white",
          textDecoration: "none",
        }}
      >
        🎓 Coach Learning
      </Link>

      {/* Menu */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {isAdmin ? (
          <>
            <Link to="/admin" style={{ color: "white", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              🏠 Dashboard
            </Link>
            <Link to="/admin/roles-metier" style={{ color: "white", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Rôles Métier
            </Link>
            <Link to="/admin/programs" style={{ color: "white", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Programmes
            </Link>
            <Link to="/admin/chapters" style={{ color: "white", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Chapitres
            </Link>
            <Link to="/admin/lessons" style={{ color: "white", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Leçons
            </Link>
            <Link to="/admin/quizzes" style={{ color: "white", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Exercices
            </Link>
            <Link to="/admin/ai-exercises" style={{ color: "white", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Exercices IA
            </Link>
            <Link to="/admin/users" style={{ color: "white", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              👥 Utilisateurs
            </Link>
          </>
        ) : (
          <Link to="/apprenant/dashboard" style={{ color: "white", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
            📚 Mes Programmes
          </Link>
        )}

        <span style={{ fontSize: 13, opacity: 0.9 }}>{user.email}</span>
        <button
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            background: "rgba(255,255,255,0.2)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
