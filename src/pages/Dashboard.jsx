import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)" }}>


      <main style={{ padding: "24px 24px 40px" }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Bienvenue sur Coach Learning</h1>
        <p style={{ color: "var(--color-muted)", marginBottom: 24, fontSize: 14 }}>
          Visualisez vos formations, catégories et simulations IA.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "var(--radius-md)",
              padding: 16,
              boxShadow: "var(--shadow-soft)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Catégories</h2>
            <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 12 }}>
              Créez des familles de contenus pour vos formations.
            </p>
            <Link
              to="/admin/categories"
              style={{
                fontSize: 14,
                color: "var(--color-primary)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Gérer les catégories →
            </Link>
            
          </div>
          <div
  style={{
    background: "#ffffff",
    borderRadius: "var(--radius-md)",
    padding: 16,
    boxShadow: "var(--shadow-soft)",
    border: "1px solid #e5e7eb",
  }}
>
  <h2 style={{ fontSize: 18, marginBottom: 8 }}>Programmes</h2>
  <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 12 }}>
    Créez des parcours de formation par thématique.
  </p>
  <Link
    to="/admin/programs"
    style={{
      fontSize: 14,
      color: "var(--color-primary)",
      textDecoration: "none",
      fontWeight: 500,
    }}
  >
    Gérer les programmes →
  </Link>
  
</div>
<div
  style={{
    background: "#ffffff",
    borderRadius: "var(--radius-md)",
    padding: 16,
    boxShadow: "var(--shadow-soft)",
    border: "1px solid #e5e7eb",
  }}
>
  <h2 style={{ fontSize: 18, marginBottom: 8 }}>Modules</h2>
  <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 12 }}>
    Définissez les modules à l’intérieur de vos programmes.
  </p>
  <Link
    to="/admin/modules"
    style={{
      fontSize: 14,
      color: "var(--color-primary)",
      textDecoration: "none",
      fontWeight: 500,
    }}
  >
    Gérer les modules →
  </Link>
</div>

<div
  style={{
    background: "#ffffff",
    borderRadius: "var(--radius-md)",
    padding: 16,
    boxShadow: "var(--shadow-soft)",
    border: "1px solid #e5e7eb",
  }}
>
  <h2 style={{ fontSize: 18, marginBottom: 8 }}>Leçons</h2>
  <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 12 }}>
    Ajoutez le contenu pédagogique à vos modules.
  </p>
  <Link
    to="/admin/lessons"
    style={{
      fontSize: 14,
      color: "var(--color-primary)",
      textDecoration: "none",
      fontWeight: 500,
    }}
  >
    Gérer les leçons →
  </Link>
</div>

<div
  style={{
    background: "#ffffff",
    borderRadius: "var(--radius-md)",
    padding: 16,
    boxShadow: "var(--shadow-soft)",
    border: "1px solid #e5e7eb",
  }}
>
  <h2 style={{ fontSize: 18, marginBottom: 8 }}>QCM</h2>
  <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 12 }}>
    Créez des QCM pour valider les connaissances avant les simulations IA.
  </p>
  <Link
    to="/admin/quizzes"
    style={{
      fontSize: 14,
      color: "var(--color-primary)",
      textDecoration: "none",
      fontWeight: 500,
    }}
  >
    Gérer les QCM →
  </Link>
</div>

<div
  style={{
    background: "#ffffff",
    borderRadius: "var(--radius-md)",
    padding: 16,
    boxShadow: "var(--shadow-soft)",
    border: "1px solid #e5e7eb",
  }}
>
  <h2 style={{ fontSize: 18, marginBottom: 8 }}>Mes programmes</h2>
  <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 12 }}>
    Accédez aux programmes de formation disponibles.
  </p>
  <Link
    to="/learner/programs"
    style={{
      fontSize: 14,
      color: "var(--color-primary)",
      textDecoration: "none",
      fontWeight: 500,
    }}
  >
    Voir les programmes →
  </Link>
</div>


        </div>
      </main>
    </div>
  );
}
