// src/pages/AdminAIExercises.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase";
import Breadcrumb from "../components/Breadcrumb";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

export default function AdminAIExercises() {
  const [programs, setPrograms] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");

  const [exercises, setExercises] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [order, setOrder] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Charger programmes
  useEffect(() => {
    async function fetchPrograms() {
      try {
        const snap = await getDocs(collection(db, "programs"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPrograms(list);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les programmes.");
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
  }, []);

  // Charger modules du programme sélectionné (sans orderBy sur order)
  useEffect(() => {
    async function fetchModules() {
      if (!selectedProgramId) {
        setModules([]);
        setSelectedModuleId("");
        setExercises([]);
        return;
      }

      try {
        const qModules = query(
          collection(db, "modules"),
          where("programId", "==", selectedProgramId)
        );
        const snap = await getDocs(qModules);
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.order || 0) - (b.order || 0)); // tri côté JS
        setModules(list);
        setSelectedModuleId("");
        setExercises([]);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les modules.");
      }
    }

    fetchModules();
  }, [selectedProgramId]);

  // Charger exercices IA du module sélectionné
  useEffect(() => {
    async function fetchExercises() {
      if (!selectedModuleId) {
        setExercises([]);
        return;
      }

      try {
        const qEx = query(
          collection(db, "aiExercises"),
          where("moduleId", "==", selectedModuleId),
          orderBy("order", "asc")
        );
        const snap = await getDocs(qEx);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setExercises(list);
      } catch (err) {
        console.error(err);
        // Si pas d'index, la collection peut être vide ou erreur index
        setExercises([]);
      }
    }

    fetchExercises();
  }, [selectedModuleId]);

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    if (!selectedModuleId) {
      alert("Sélectionne d'abord un module.");
      return;
    }
    if (!title.trim() || !prompt.trim()) {
      alert("Titre et prompt IA sont obligatoires.");
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, "aiExercises"), {
        moduleId: selectedModuleId,
        title: title.trim(),
        description: description.trim(),
        prompt: prompt.trim(),
        order: Number(order) || 1,
        createdAt: Timestamp.now(),
      });

      setTitle("");
      setDescription("");
      setPrompt("");
      setOrder(1);

      // Recharge la liste
      const qEx = query(
        collection(db, "aiExercises"),
        where("moduleId", "==", selectedModuleId),
        orderBy("order", "asc")
      );
      const snap = await getDocs(qEx);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExercises(list);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'exercice IA.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Chargement...</div>;

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
    { label: "Admin", path: "/admin" },
    { label: "Exercices IA" },
  ]}
/>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>
        Exercices IA par module
      </h1>
      <p style={{ fontSize: 14, color: "var(--color-muted)", marginBottom: 20 }}>
        Crée des scénarios d'exercices IA reliés à un module (role‑play, objection, etc.).
      </p>

      {error && (
        <div style={{ color: "red", marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Formulaire */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "var(--radius-md)",
            padding: 16,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Nouvel exercice IA</h2>

          {/* Sélection programme & module */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 4,
                fontWeight: 500,
              }}
            >
              Programme
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
            >
              <option value="">Sélectionne un programme</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 4,
                fontWeight: 500,
              }}
            >
              Module
            </label>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
              disabled={!selectedProgramId}
            >
              <option value="">
                {selectedProgramId
                  ? modules.length === 0
                    ? "Aucun module pour ce programme"
                    : "Sélectionne un module"
                  : "Choisis d'abord un programme"}
              </option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleCreateExercise}>
            <div style={{ marginBottom: 10 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Titre de l'exercice
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Gérer l'objection sur le prix"
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Description (vue par l'apprenant)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ex : Tu joues le rôle du commercial, l'IA joue un prospect difficile..."
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Prompt IA (consignes pour l'IA)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="Consignes que tu enverras plus tard à Gemini pour ce scénario."
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Ordre
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                min={1}
                style={{
                  width: 80,
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 4,
                padding: "8px 14px",
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                color: "white",
                borderRadius: 999,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Enregistrement..." : "Créer l'exercice IA"}
            </button>
          </form>
        </div>

        {/* Liste des exercices du module */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "var(--radius-md)",
            padding: 16,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>
            Exercices IA du module
          </h2>
          {!selectedModuleId ? (
            <p style={{ fontSize: 14, color: "var(--color-muted)" }}>
              Sélectionne un module pour voir ses exercices IA.
            </p>
          ) : exercises.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--color-muted)" }}>
              Aucun exercice IA pour ce module pour l'instant.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 10,
                    background: "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--color-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Ordre {ex.order || 0}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {ex.title}
                  </div>
                  {ex.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--color-muted)",
                        marginBottom: 4,
                      }}
                    >
                      {ex.description}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    Prompt IA (aperçu) :{" "}
                    {ex.prompt?.slice(0, 80) || "—"}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
