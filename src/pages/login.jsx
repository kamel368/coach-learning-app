// src/pages/login.jsx
import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);

    try {
      // 1. Connexion Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Vérifier si Super Admin EN PREMIER (priorité absolue)
      const superAdminDoc = await getDoc(doc(db, "platformAdmins", firebaseUser.uid));
      
      if (superAdminDoc.exists() && superAdminDoc.data().role === "superadmin") {
        console.log("🛡️ Super Admin détecté, redirection vers /superadmin/dashboard");
        navigate("/superadmin/dashboard");
        return;
      }

      // 3. Sinon, charger le rôle depuis Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      const userRole = userDoc.exists() ? userDoc.data().role : "learner";

      // 4. Rediriger selon le rôle
      console.log("🔄 Redirection utilisateur - Rôle:", userRole);
      if (userRole === "admin" || userRole === "trainer") {
        console.log("→ Redirection vers /admin");
        navigate("/admin");
      } else {
        console.log("→ Redirection vers /apprenant/dashboard");
        navigate("/apprenant/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Entre d'abord ton email pour réinitialiser le mot de passe.");
      return;
    }

    setError("");
    setResetMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage(
        "Email de réinitialisation envoyé ! Vérifie ta boîte mail (et les spams)."
      );
    } catch (err) {
      console.error(err);
      setError("Impossible d'envoyer l'email. Vérifie que l'adresse est correcte.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px 48px",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          width: "100%",
          maxWidth: 420,
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            textAlign: "center",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          🎓 Coach Learning
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "#6B7280",
            fontSize: 14,
            marginBottom: 32,
          }}
        >
          Connecte-toi pour accéder à tes formations
        </p>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "#FEE2E2",
              color: "#DC2626",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {resetMessage && (
          <div
            style={{
              padding: "12px 16px",
              background: "#D1FAE5",
              color: "#065F46",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {resetMessage}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
                color: "#374151",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid #D1D5DB",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
                color: "#374151",
              }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid #D1D5DB",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 16px",
              background: loading 
                ? "#9CA3AF" 
                : "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8,
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* Lien mot de passe oublié */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              fontSize: 14,
              textDecoration: "underline",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Mot de passe oublié ?
          </button>
        </div>

        {/* Lien inscription */}
        <p style={{ 
          textAlign: "center", 
          marginTop: 24, 
          color: "#64748b", 
          fontSize: 14 
        }}>
          Pas encore de compte ?{' '}
          <Link 
            to="/register" 
            style={{ 
              color: "#667eea", 
              fontWeight: 600, 
              textDecoration: "none" 
            }}
          >
            Créer mon espace
          </Link>
        </p>
      </div>
    </div>
  );
}
