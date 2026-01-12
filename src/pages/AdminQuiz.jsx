// src/pages/AdminQuiz.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

export default function AdminQuiz() {
  const [programs, setPrograms] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedModule, setSelectedModule] = useState("");

  const [quizTitle, setQuizTitle] = useState("");
  const [passingScore, setPassingScore] = useState(80);

  const [questions, setQuestions] = useState([
    { text: "", answers: ["", "", "", ""], correctIndex: 0 },
  ]);

  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Charger programmes, modules, quizzes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const progSnap = await getDocs(collection(db, "programs"));
        const progList = progSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPrograms(progList);

        const modSnap = await getDocs(collection(db, "modules"));
        const modList = modSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setModules(modList);

        const quizSnap = await getDocs(collection(db, "quizzes"));
        const quizList = quizSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExistingQuizzes(quizList);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données.");
      }
    };

    fetchData();
  }, []);

  const filteredModules = selectedProgram
    ? modules.filter((m) => m.programId === selectedProgram)
    : modules;

  const handleQuestionTextChange = (index, value) => {
    const updated = [...questions];
    updated[index].text = value;
    setQuestions(updated);
  };

  const handleAnswerChange = (qIndex, aIndex, value) => {
    const updated = [...questions];
    updated[qIndex].answers[aIndex] = value;
    setQuestions(updated);
  };

  const handleCorrectIndexChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].correctIndex = Number(value);
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { text: "", answers: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedModule) {
      setError("Choisissez un module.");
      return;
    }
    if (!quizTitle.trim()) {
      setError("Le titre du QCM est obligatoire.");
      return;
    }

    // Validation basique des questions
    for (const q of questions) {
      if (!q.text.trim()) {
        setError("Chaque question doit avoir un intitulé.");
        return;
      }
      if (q.answers.some((a) => !a.trim())) {
        setError("Chaque question doit avoir 4 réponses renseignées.");
        return;
      }
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "quizzes"), {
        moduleId: selectedModule,
        title: quizTitle,
        passingScore: Number(passingScore) || 80,
        questions: questions.map((q, idx) => ({
          id: `q${idx + 1}`,
          text: q.text,
          answers: q.answers.map((a, aIdx) => ({
            id: `a${aIdx + 1}`,
            text: a,
            correct: aIdx === q.correctIndex,
          })),
        })),
        createdAt: Timestamp.now(),
      });

      setExistingQuizzes((prev) => [
        ...prev,
        {
          id: docRef.id,
          moduleId: selectedModule,
          title: quizTitle,
          passingScore: Number(passingScore) || 80,
          questions,
        },
      ]);

      // Reset
      setQuizTitle("");
      setPassingScore(80);
      setQuestions([{ text: "", answers: ["", "", "", ""], correctIndex: 0 }]);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création du QCM.");
    } finally {
      setLoading(false);
    }
  };

  const getModuleTitle = (moduleId) => {
    const mod = modules.find((m) => m.id === moduleId);
    return mod ? mod.title : "Module inconnu";
  };

  const getProgramNameForModule = (moduleId) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return "";
    const prog = programs.find((p) => p.id === mod.programId);
    return prog ? prog.name : "";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>QCM par module</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Formulaire QCM */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            boxShadow: "var(--shadow-soft)",
            border: "1px solid #e5e7eb",
            maxHeight: "80vh",
            overflow: "auto",
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Nouveau QCM</h2>
          <p style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 16 }}>
            Créez un QCM pour un module. Score minimum : 80 % par défaut.
          </p>

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Programme
          </label>
          <select
            value={selectedProgram}
            onChange={(e) => {
              setSelectedProgram(e.target.value);
              setSelectedModule("");
            }}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#ffffff",
            }}
          >
            <option value="">Filtrer par programme</option>
            {programs.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.name}
              </option>
            ))}
          </select>

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Module
          </label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#ffffff",
            }}
          >
            <option value="">Choisir un module</option>
            {filteredModules.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.title}
              </option>
            ))}
          </select>

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Titre du QCM
          </label>
          <input
            type="text"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#ffffff",
            }}
          />

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Score minimum requis (%)
          </label>
          <input
            type="number"
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
            min={0}
            max={100}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 16,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#ffffff",
            }}
          />

          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Questions</h3>
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 8,
                marginBottom: 10,
                background: "#f9fafb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Question {qIndex + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#dc2626",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Supprimer
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Intitulé de la question"
                value={q.text}
                onChange={(e) =>
                  handleQuestionTextChange(qIndex, e.target.value)
                }
                style={{
                  width: "100%",
                  padding: 6,
                  marginBottom: 8,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  fontSize: 13,
                }}
              />

              <div style={{ fontSize: 12, marginBottom: 4 }}>
                Réponses (cochez la bonne)
              </div>

              {q.answers.map((a, aIndex) => (
                <div
                  key={aIndex}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.correctIndex === aIndex}
                    onChange={() =>
                      handleCorrectIndexChange(qIndex, aIndex)
                    }
                  />
                  <input
                    type="text"
                    value={a}
                    onChange={(e) =>
                      handleAnswerChange(qIndex, aIndex, e.target.value)
                    }
                    style={{
                      flex: 1,
                      padding: 6,
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                      fontSize: 13,
                    }}
                  />
                </div>
              ))}
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            style={{
              padding: "6px 10px",
              marginBottom: 12,
              borderRadius: 999,
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            + Ajouter une question
          </button>

          {error && (
            <p style={{ color: "#dc2626", marginBottom: 10, fontSize: 13 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 14px",
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
              color: "white",
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {loading ? "Création..." : "Enregistrer le QCM"}
          </button>
        </form>

        {/* Liste des QCM existants */}
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>QCM existants</h2>
          {existingQuizzes.length === 0 ? (
            <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
              Aucun QCM pour l’instant.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {existingQuizzes.map((quiz) => (
                <li
                  key={quiz.id}
                  style={{
                    marginBottom: 10,
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                  }}
                >
                  <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
                    {getProgramNameForModule(quiz.moduleId)} •{" "}
                    {getModuleTitle(quiz.moduleId)} • Min {quiz.passingScore}%
                  </div>
                  <div style={{ fontWeight: 500 }}>{quiz.title}</div>
                  <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
                    {quiz.questions?.length || 0} question(s)
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
