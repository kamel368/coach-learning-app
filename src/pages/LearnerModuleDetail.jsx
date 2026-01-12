// src/pages/LearnerModuleDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import Breadcrumb from "../components/Breadcrumb";

export default function LearnerModuleDetail() {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [moduleData, setModuleData] = useState(null);
  const [program, setProgram] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Historique des tentatives
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Chargement des tentatives
  useEffect(() => {
    async function fetchAttempts() {
      try {
        const user = auth.currentUser;
        if (!user || !moduleId) {
          setAttempts([]);
          setLoadingAttempts(false);
          return;
        }

        const attemptsRef = collection(db, "quizAttempts");
        const q = query(
          attemptsRef,
          where("userId", "==", user.uid),
          where("moduleId", "==", moduleId),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setAttempts(list);
      } catch (error) {
        console.error("Erreur chargement tentatives:", error);
        setAttempts([]);
      } finally {
        setLoadingAttempts(false);
      }
    }

    if (moduleId) {
      fetchAttempts();
    }
  }, [moduleId]);

  // Données du module, programme, leçons, QCM
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Module
        const modRef = doc(db, "modules", moduleId);
        const modSnap = await getDoc(modRef);
        if (!modSnap.exists()) {
          setError("Module introuvable.");
          setLoading(false);
          return;
        }
        const modData = { id: modSnap.id, ...modSnap.data() };
        setModuleData(modData);

        // Programme parent
        const progRef = doc(db, "programs", modData.programId);
        const progSnap = await getDoc(progRef);
        if (progSnap.exists()) {
          setProgram({ id: progSnap.id, ...progSnap.data() });
        }

        // Leçons (TinyMCE HTML)
        const qLessons = query(
          collection(db, "lessons"),
          where("moduleId", "==", moduleId)
        );
        const lessonSnap = await getDocs(qLessons);
        const lessonList = lessonSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setLessons(lessonList);

        // QCM
        const qQuiz = query(
          collection(db, "quizzes"),
          where("moduleId", "==", moduleId)
        );
        const quizSnap = await getDocs(qQuiz);
        if (!quizSnap.empty) {
          const qDoc = quizSnap.docs[0];
          setQuiz({ id: qDoc.id, ...qDoc.data() });
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de charger le contenu du module.");
      } finally {
        setLoading(false);
      }
    };

    if (moduleId) {
      fetchData();
    }
  }, [moduleId]);

  if (loading) return <div style={{ padding: 24 }}>Chargement...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;
  if (!moduleData) return <div style={{ padding: 24 }}>Module introuvable.</div>;

  const lastAttempt = attempts.length > 0 ? attempts[0] : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        padding: 24,
      }}
    >
      <Breadcrumb
        items={[
          { label: "Mes programmes", path: "/learner/programs" },
          program && { label: program.name, path: `/learner/programs/${program.id}` },
          { label: moduleData.title },
        ].filter(Boolean)}
      />

      <h1 style={{ fontSize: 24, margin: "8px 0 4px" }}>{moduleData.title}</h1>
      {moduleData.description && (
        <p
          style={{
            color: "var(--color-muted)",
            fontSize: 14,
            marginBottom: 8,
          }}
        >
          {moduleData.description}
        </p>
      )}
      {program && (
        <p
          style={{
            color: "var(--color-muted)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          Programme : {program.name}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Leçons */}
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Leçons</h2>
          {lessons.length === 0 ? (
            <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
              Aucune leçon dans ce module pour l'instant.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "var(--radius-md)",
                    padding: 12,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--color-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Leçon {lesson.order || 0}
                  </div>
                  <h3 style={{ fontSize: 16, marginBottom: 6 }}>
                    {lesson.title}
                  </h3>
                  <div
                    style={{
                      color: "var(--color-muted)",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: lesson.content || "",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QCM */}
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Évaluation</h2>
          {quiz ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "var(--radius-md)",
                padding: 16,
                border: "1px solid #e5e7eb",
              }}
            >
              <h3 style={{ fontSize: 16, marginBottom: 6 }}>{quiz.title}</h3>
              <p
                style={{
                  color: "var(--color-muted)",
                  fontSize: 14,
                  marginBottom: 10,
                }}
              >
                Score minimum pour validation : {quiz.passingScore || 80}%.
              </p>

              <Link
                to={`/learner/modules/${moduleId}/quiz`}
                style={{
                  display: "inline-block",
                  padding: "8px 14px",
                  background:
                    "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                  color: "white",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Passer le QCM
              </Link>

              {/* Bouton exercices IA avec gating */}
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  disabled={!lastAttempt || !lastAttempt.passed}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor:
                      !lastAttempt || !lastAttempt.passed
                        ? "not-allowed"
                        : "pointer",
                    opacity: !lastAttempt || !lastAttempt.passed ? 0.5 : 1,
                    background:
                      !lastAttempt || !lastAttempt.passed
                        ? "#E5E7EB"
                        : "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                    color:
                      !lastAttempt || !lastAttempt.passed ? "#6B7280" : "white",
                  }}
                  onClick={() => {
                    if (!lastAttempt || !lastAttempt.passed) return;
                    navigate(`/learner/modules/${moduleId}/ai-exercises`);
                  }}
                >
                  Accéder aux exercices IA
                </button>
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#6B7280",
                  }}
                >
                  Les exercices IA se débloquent après un score d'au moins 80% au
                  QCM.
                </p>
              </div>

              {/* Dernier score + accordéon historique */}
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  borderRadius: 12,
                  backgroundColor: "#F3F4FF",
                  border: "1px solid #E0E3FF",
                }}
              >
                {loadingAttempts ? (
                  <p style={{ margin: 0 }}>Chargement des tentatives...</p>
                ) : attempts.length === 0 ? (
                  <p style={{ margin: 0 }}>
                    Pas encore de tentative sur ce QCM.
                  </p>
                ) : (
                  <div>
                    {/* Dernière tentative */}
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      Dernier score : {lastAttempt.score}%{" "}
                      {lastAttempt.passed ? "✅ Réussi" : "❌ Non réussi"}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 8px",
                        fontSize: "0.9rem",
                        color: "#4B5563",
                      }}
                    >
                      Condition de validation du module : 80% ou plus.
                    </p>

                    {/* Accordéon historique */}
                    <button
                      type="button"
                      onClick={() => setIsHistoryOpen((prev) => !prev)}
                      style={{
                        marginTop: 8,
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #CBD5F5",
                        background: "rgba(255,255,255,0.7)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#1F2933",
                      }}
                    >
                      <span>Voir l'historique des tentatives</span>
                      <span
                        style={{
                          display: "inline-block",
                          transition: "transform 0.2s ease",
                          transform: isHistoryOpen
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        }}
                      >
                        ▾
                      </span>
                    </button>

                    {isHistoryOpen && (
                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: "1px solid #E0E3FF",
                          maxHeight: 180,
                          overflowY: "auto",
                        }}
                      >
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: 16,
                            fontSize: "0.85rem",
                            listStyle: "disc",
                          }}
                        >
                          {attempts.map((a) => (
                            <li key={a.id} style={{ marginBottom: 4 }}>
                              {a.score}% – {a.passed ? "Réussi" : "Échoué"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
              Aucun QCM n'est encore associé à ce module.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
