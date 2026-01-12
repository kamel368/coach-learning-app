// src/pages/LearnerAIExercises.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import Breadcrumb from "../components/Breadcrumb";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";

export default function LearnerAIExercises() {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [moduleData, setModuleData] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [lastAttempt, setLastAttempt] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const user = auth.currentUser;
        console.log("User:", user?.uid);
        console.log("ModuleId:", moduleId);

        if (!user) {
          setError("Tu dois être connecté.");
          setLoading(false);
          return;
        }

        // Module
        const modRef = doc(db, "modules", moduleId);
        const modSnap = await getDoc(modRef);
        console.log("Module exists:", modSnap.exists());

        if (!modSnap.exists()) {
          setError("Module introuvable.");
          setLoading(false);
          return;
        }
        setModuleData({ id: modSnap.id, ...modSnap.data() });

        // Dernière tentative QCM pour vérifier le gating 80%
        const attemptsRef = collection(db, "quizAttempts");
        const qAttempts = query(
          attemptsRef,
          where("userId", "==", user.uid),
          where("moduleId", "==", moduleId),
          orderBy("createdAt", "desc")
        );
        const attemptsSnap = await getDocs(qAttempts);
        console.log("Attempts found:", attemptsSnap.size);

        if (!attemptsSnap.empty) {
          const latest = {
            id: attemptsSnap.docs[0].id,
            ...attemptsSnap.docs[0].data(),
          };
          setLastAttempt(latest);
          console.log("Last attempt passed:", latest.passed);

          // Si pas réussi, on affiche un message mais on laisse voir la page
          if (!latest.passed) {
            setError(
              "Tu dois obtenir au moins 80% au QCM pour accéder aux exercices IA."
            );
            setLoading(false);
            return;
          }
        } else {
          setError(
            "Tu dois d'abord passer le QCM et obtenir au moins 80% pour accéder aux exercices IA."
          );
          setLoading(false);
          return;
        }

        // Exercices IA du module
        const qEx = query(
          collection(db, "aiExercises"),
          where("moduleId", "==", moduleId),
          orderBy("order", "asc")
        );
        const exSnap = await getDocs(qEx);
        console.log("Exercises found:", exSnap.size);

        const exList = exSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setExercises(exList);
      } catch (err) {
        console.error("Error loading AI exercises:", err);
        setError("Impossible de charger les exercices IA.");
      } finally {
        setLoading(false);
      }
    }

    if (moduleId) {
      fetchData();
    }
  }, [moduleId]);

  if (loading) return <div style={{ padding: 24 }}>Chargement...</div>;
  if (error)
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "red", marginBottom: 12 }}>{error}</p>
      <Breadcrumb
  items={[
    { label: "Mes programmes", path: "/learner/programs" },
    moduleData && { label: moduleData.title, path: `/learner/modules/${moduleId}` },
    { label: "Exercices IA" },
  ].filter(Boolean)}
/>
      </div>
    );

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
        to={`/learner/modules/${moduleId}`}
        style={{ fontSize: 13, color: "var(--color-primary)" }}
      >
        ← Retour au module
      </Link>

      <h1 style={{ fontSize: 24, margin: "8px 0 4px" }}>Exercices IA</h1>
      {moduleData && (
        <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 16 }}>
          Module : {moduleData.title}
        </p>
      )}

      {exercises.length === 0 ? (
        <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
          Aucun exercice IA disponible pour ce module pour l'instant.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 720,
          }}
        >
          {exercises.map((ex) => (
            <div
              key={ex.id}
              style={{
                background: "#ffffff",
                borderRadius: "var(--radius-md)",
                padding: 16,
                border: "1px solid #e5e7eb",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <h2 style={{ fontSize: 18, marginBottom: 8 }}>{ex.title}</h2>
              {ex.description && (
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--color-muted)",
                    marginBottom: 12,
                  }}
                >
                  {ex.description}
                </p>
              )}
              <button
                type="button"
                style={{
                  padding: "8px 14px",
                  background:
                    "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                  color: "white",
                  border: "none",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate(`/learner/modules/${moduleId}/ai-exercises/${ex.id}`)
                }
              >
                Lancer l'exercice
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
