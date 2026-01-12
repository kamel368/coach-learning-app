// src/pages/LearnerPrograms.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import Breadcrumb from "../components/Breadcrumb";

export default function LearnerPrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const user = auth.currentUser;
        console.log("User:", user?.uid);

        if (!user) {
          setError("Tu dois être connecté.");
          setLoading(false);
          return;
        }

        // 1. Charger tous les programmes
        const progSnap = await getDocs(collection(db, "programs"));
        console.log("Programs loaded:", progSnap.size);
        const progList = progSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // 2. Charger tous les modules
        const modulesSnap = await getDocs(collection(db, "modules"));
        console.log("Modules loaded:", modulesSnap.size);
        const allModules = modulesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // 3. Charger toutes les tentatives de l'utilisateur
        const attemptsRef = collection(db, "quizAttempts");
        const qAttempts = query(
          attemptsRef,
          where("userId", "==", user.uid)
        );
        const attemptsSnap = await getDocs(qAttempts);
        console.log("Attempts loaded:", attemptsSnap.size);

        // Garder la dernière tentative par moduleId
        const attemptsMap = {};
        attemptsSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (!attemptsMap[data.moduleId]) {
            attemptsMap[data.moduleId] = data;
          }
        });

        // 4. Enrichir les programmes avec leurs modules + statuts
        const enrichedPrograms = progList.map((prog) => {
          const modules = allModules
            .filter((m) => m.programId === prog.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((m) => {
              const attempt = attemptsMap[m.id];
              return {
                ...m,
                status: attempt
                  ? attempt.passed
                    ? "validated"
                    : "in-progress"
                  : "locked",
                lastScore: attempt?.score || null,
              };
            });

          const validated = modules.filter((m) => m.status === "validated").length;
          const total = modules.length;
          const progress = total > 0 ? Math.round((validated / total) * 100) : 0;

          return {
            ...prog,
            modules,
            progress,
            validated,
            total,
          };
        });

        console.log("Enriched programs:", enrichedPrograms);
        setPrograms(enrichedPrograms);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Impossible de charger les programmes : " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Chargement...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;

  // Calcul progression globale
  const totalModules = programs.reduce((sum, p) => sum + p.total, 0);
  const totalValidated = programs.reduce((sum, p) => sum + p.validated, 0);
  const globalProgress = totalModules > 0 ? Math.round((totalValidated / totalModules) * 100) : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        padding: 24,
      }}
    >
      <Breadcrumb items={[{ label: "Mes Programmes" }]} />

      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Mes Programmes</h1>
      <p style={{ fontSize: 14, color: "var(--color-muted)", marginBottom: 24 }}>
        Consulte tes formations et suis ta progression.
      </p>

      {/* Progression globale */}
      {totalModules > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
            color: "white",
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 8, fontWeight: 600 }}>
            Ta progression globale
          </h2>
          <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 12 }}>
            {globalProgress}%
          </div>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
            {totalValidated} / {totalModules} modules validés
          </div>
          <div
            style={{
              width: "100%",
              height: 12,
              background: "rgba(255,255,255,0.3)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${globalProgress}%`,
                height: "100%",
                background: "white",
                borderRadius: 999,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Liste des programmes */}
      {programs.length === 0 ? (
        <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
          Aucun programme disponible pour l'instant.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {programs.map((prog) => (
            <div
              key={prog.id}
              style={{
                background: "#ffffff",
                borderRadius: 16,
                padding: 24,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2 style={{ fontSize: 22, marginBottom: 6, fontWeight: 600 }}>
                    {prog.name}
                  </h2>
                  {prog.description && (
                    <p style={{ fontSize: 14, color: "var(--color-muted)", margin: 0 }}>
                      {prog.description}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    padding: "8px 16px",
                    background: "#F3F4FF",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#667eea",
                  }}
                >
                  {prog.progress}% complété
                </div>
              </div>

              {/* Modules du programme */}
              {prog.modules.length === 0 ? (
                <p style={{ fontSize: 14, color: "var(--color-muted)" }}>
                  Aucun module dans ce programme.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {prog.modules.map((mod) => (
                    <Link
                      key={mod.id}
                      to={`/learner/modules/${mod.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 16px",
                        background: "#F9FAFB",
                        borderRadius: 12,
                        textDecoration: "none",
                        color: "var(--color-text)",
                        border: "1px solid #f3f4f6",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F3F4FF";
                        e.currentTarget.style.borderColor = "#E0E3FF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#F9FAFB";
                        e.currentTarget.style.borderColor = "#f3f4f6";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Icône statut */}
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            background:
                              mod.status === "validated"
                                ? "#D1FAE5"
                                : mod.status === "in-progress"
                                ? "#FEF3C7"
                                : "#F3F4F6",
                          }}
                        >
                          {mod.status === "validated"
                            ? "✅"
                            : mod.status === "in-progress"
                            ? "⏳"
                            : "🔒"}
                        </div>

                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                            {mod.title}
                          </div>
                          <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
                            {mod.status === "validated"
                              ? `Validé · Score: ${mod.lastScore}%`
                              : mod.status === "in-progress"
                              ? `En cours · Dernier score: ${mod.lastScore}%`
                              : "Pas encore commencé"}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 20, color: "#9CA3AF" }}>›</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
