// src/pages/LearnerProgramDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

export default function LearnerProgramDetail() {
  const { programId } = useParams();
  const [program, setProgram] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const progRef = doc(db, "programs", programId);
        const progSnap = await getDoc(progRef);
        if (!progSnap.exists()) {
          setError("Programme introuvable.");
          setLoading(false);
          return;
        }
        setProgram({ id: progSnap.id, ...progSnap.data() });

        const qMod = query(
          collection(db, "modules"),
          where("programId", "==", programId)
        );
        const modSnap = await getDocs(qMod);
        const modList = modSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setModules(modList);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les modules.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [programId]);

  if (loading) return <div style={{ padding: 24 }}>Chargement...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;
  if (!program) return <div style={{ padding: 24 }}>Programme introuvable.</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        padding: 24,
      }}
    >
      <Link
        to="/learner/programs"
        style={{ fontSize: 13, color: "var(--color-primary)" }}
      >
        ← Retour aux programmes
      </Link>

      <h1 style={{ fontSize: 24, margin: "8px 0 4px" }}>{program.name}</h1>
      {program.description && (
        <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 16 }}>
          {program.description}
        </p>
      )}

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Modules</h2>
      {modules.length === 0 ? (
        <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
          Aucun module pour l’instant.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {modules.map((mod) => (
            <Link
              key={mod.id}
              to={`/learner/programs/${programId}/modules/${mod.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
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
                <div
                  style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 4 }}
                >
                  Module {mod.order || 0}
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 6 }}>{mod.title}</h3>
                {mod.description && (
                  <p
                    style={{
                      color: "var(--color-muted)",
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    {mod.description}
                  </p>
                )}
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--color-primary)",
                    fontWeight: 500,
                  }}
                >
                  Voir le contenu →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
