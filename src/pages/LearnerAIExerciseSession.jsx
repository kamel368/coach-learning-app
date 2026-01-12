// src/pages/LearnerAIExerciseSession.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Breadcrumb from "../components/Breadcrumb";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function LearnerAIExerciseSession() {
  const { moduleId, exerciseId } = useParams();

  const [exercise, setExercise] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Charger l'exercice
  useEffect(() => {
    async function fetchExercise() {
      try {
        const exRef = doc(db, "aiExercises", exerciseId);
        const exSnap = await getDoc(exRef);

        if (!exSnap.exists()) {
          setError("Exercice introuvable.");
          setLoading(false);
          return;
        }

        const exData = { id: exSnap.id, ...exSnap.data() };
        setExercise(exData);

        // Modèle officiel janvier 2025
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash"
        });
        
        chatRef.current = model.startChat({
          history: [],
          generationConfig: {
            maxOutputTokens: 500,
          },
        });

        // Message d'accueil de l'IA
        const result = await chatRef.current.sendMessage(
          `${exData.prompt}\n\nDémarre la conversation en te présentant brièvement et en lançant le scénario.`
        );
        const aiResponse = result.response.text();

        setMessages([{ role: "ai", text: aiResponse }]);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger l'exercice : " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchExercise();
  }, [exerciseId]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !chatRef.current) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setSending(true);

    try {
      const result = await chatRef.current.sendMessage(userMessage);
      const aiResponse = result.response.text();

      setMessages((prev) => [...prev, { role: "ai", text: aiResponse }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Erreur : impossible de contacter l'IA." },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Chargement...</div>;
  if (error)
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "red", marginBottom: 12 }}>{error}</p>
        <Link
          to={`/learner/modules/${moduleId}/ai-exercises`}
          style={{ fontSize: 14, color: "var(--color-primary)" }}
        >
          ← Retour aux exercices
        </Link>
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
    <Breadcrumb
  items={[
    { label: "Mes programmes", path: "/learner/programs" },
    moduleData && { label: moduleData.title, path: `/learner/modules/${moduleId}` },
    { label: "Exercices IA" },
  ].filter(Boolean)}
/>

      <h1 style={{ fontSize: 24, margin: "8px 0 4px" }}>
        {exercise?.title || "Exercice IA"}
      </h1>
      {exercise?.description && (
        <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 16 }}>
          {exercise.description}
        </p>
      )}

      {/* Zone de chat */}
      <div
        style={{
          maxWidth: 720,
          background: "#ffffff",
          borderRadius: "var(--radius-md)",
          border: "1px solid #e5e7eb",
          boxShadow: "var(--shadow-soft)",
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 200px)",
        }}
      >
        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "75%",
                padding: "10px 14px",
                borderRadius: 12,
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))"
                    : "#F3F4FF",
                color: msg.role === "user" ? "white" : "var(--color-text)",
                fontSize: 14,
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          style={{
            borderTop: "1px solid #e5e7eb",
            padding: 12,
            display: "flex",
            gap: 8,
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tape ta réponse..."
            disabled={sending}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            style={{
              padding: "8px 16px",
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
              color: "white",
              border: "none",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              cursor: sending || !input.trim() ? "not-allowed" : "pointer",
              opacity: sending || !input.trim() ? 0.6 : 1,
            }}
          >
            {sending ? "..." : "Envoyer"}
          </button>
        </form>
      </div>
    </div>
  );
}
