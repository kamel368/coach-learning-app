// src/pages/AdminModules.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";

export default function AdminModules() {
  const [programs, setPrograms] = useState([]);
  const [modules, setModules] = useState([]);

  const [selectedProgram, setSelectedProgram] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Charger programmes + modules
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
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données.");
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedProgram) {
      setError("Choisissez un programme.");
      return;
    }
    if (!title.trim()) {
      setError("Le nom du chapitre est obligatoire.");
      return;
    }

    const orderNumber = order ? Number(order) : 1;

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "modules"), {
        programId: selectedProgram,
        title,
        description,
        order: orderNumber,
        createdAt: Timestamp.now(),
      });

      setModules((prev) => [
        ...prev,
        {
          id: docRef.id,
          programId: selectedProgram,
          title,
          description,
          order: orderNumber,
        },
      ]);

      setTitle("");
      setDescription("");
      setOrder("");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création du chapitre.");
    } finally {
      setLoading(false);
    }
  };

  const getProgramName = (programId) => {
    const prog = programs.find((p) => p.id === programId);
    return prog ? prog.name : "Programme inconnu";
  };

  // Tri des chapitres : par programme puis par ordre
  const sortedModules = [...modules].sort((a, b) => {
    const progA = a.programId || "";
    const progB = b.programId || "";

    if (progA === progB) {
      return (a.order || 0) - (b.order || 0);
    }

    return progA.localeCompare(progB);
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Chapitres</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 360px) minmax(0, 1fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Formulaire */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            boxShadow: "var(--shadow-soft)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Nouveau chapitre</h2>
          <p style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 16 }}>
            Ajoutez un chapitre à un programme.
          </p>

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Programme
          </label>
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#ffffff",
            }}
          >
            <option value="">Choisir un programme</option>
            {programs.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.name}
              </option>
            ))}
          </select>

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Nom du chapitre
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            Description (facultatif)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            Ordre dans le programme (1, 2, 3…)
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            min={1}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#ffffff",
            }}
          />

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
            {loading ? "Création..." : "Créer le chapitre"}
          </button>
        </form>

        {/* Liste des chapitres */}
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Liste des chapitres</h2>
          {sortedModules.length === 0 ? (
            <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
              Aucun chapitre pour l’instant.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {sortedModules.map((mod) => (
                <li
                  key={mod.id}
                  style={{
                    marginBottom: 10,
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--color-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Programme : {getProgramName(mod.programId)} • Ordre{" "}
                    {mod.order || 0}
                  </div>
                  <div style={{ fontWeight: 500 }}>{mod.title}</div>
                  {mod.description && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--color-muted)",
                        marginTop: 4,
                      }}
                    >
                      {mod.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
