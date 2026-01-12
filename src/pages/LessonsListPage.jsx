// src/pages/LessonsListPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export default function LessonsListPage() {
  const { programId, moduleId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [lessons, setLessons] = useState([]);

  const lessonsCollectionRef = collection(
    db,
    "programs",
    programId,
    "modules",
    moduleId,
    "lessons"
  );

  useEffect(() => {
    const q = query(lessonsCollectionRef, orderBy("order", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLessons(data);
    });

    return () => unsub();
  }, [lessonsCollectionRef]);

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoadingCreate(true);

      const order = lessons.length;

      const docRef = await addDoc(lessonsCollectionRef, {
        title: title.trim(),
        status,
        order,
        editorData: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setTitle("");

      navigate(
        `/admin/programs/${programId}/modules/${moduleId}/lessons/${docRef.id}/edit`
      );
    } finally {
      setLoadingCreate(false);
    }
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
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Leçons du module</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 340px) minmax(0, 1fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            boxShadow: "var(--shadow-soft)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Nouvelle leçon</h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-muted)",
              marginBottom: 16,
            }}
          >
            Créez une leçon, puis éditez son contenu riche dans la page suivante.
          </p>

          <form onSubmit={handleCreateLesson}>
            <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
              Titre de la leçon
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
              placeholder="Ex : Leçon 3 - Intersections"
            />

            <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
              Statut
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                marginBottom: 16,
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "#ffffff",
              }}
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>

            <button
              type="submit"
              disabled={loadingCreate}
              style={{
                width: "100%",
                padding: "8px 12px",
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
              {loadingCreate ? "Création..." : "Créer et éditer"}
            </button>
          </form>

          <hr style={{ margin: "16px 0", borderColor: "#e5e7eb" }} />

          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Leçons existantes</h3>

          {lessons.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-muted)" }}>
              Aucune leçon pour ce module.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    marginBottom: 8,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    navigate(
                      `/admin/programs/${programId}/modules/${moduleId}/lessons/${lesson.id}/edit`
                    )
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {lesson.title}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#f3f4f6",
                      }}
                    >
                      {lesson.status === "draft" ? "Brouillon" : "Publié"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            padding: 24,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Éditeur Teachizy</h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--color-muted)",
              marginBottom: 8,
            }}
          >
            Une fois la leçon créée, vous serez redirigé vers une page
            d’édition riche (Editor.js) inspirée de Teachizy.
          </p>
          <p style={{ fontSize: 14, color: "var(--color-muted)" }}>
            Cliquez sur une leçon existante pour modifier son contenu.
          </p>
        </div>
      </div>
    </div>
  );
}
