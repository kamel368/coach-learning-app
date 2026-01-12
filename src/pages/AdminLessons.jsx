// src/pages/AdminLessons.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import LessonEditor from "../components/LessonEditor";

export default function AdminLessons() {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);

  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [order, setOrder] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Charger programmes, modules, leçons
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

        const lessonSnap = await getDocs(collection(db, "lessons"));
        const lessonList = lessonSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLessons(lessonList);
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

  // ✅ Création + redirection vers la page d'édition riche
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedModule) {
      setError("Choisissez un module.");
      return;
    }
    if (!title.trim()) {
      setError("Le titre de la leçon est obligatoire.");
      return;
    }
    if (!content.trim()) {
      setError("Le contenu est obligatoire.");
      return;
    }

    const orderNumber = order ? Number(order) : 1;

    setLoading(true);
    try {
      // 1. Création Firestore dans la collection "lessons"
      const docRef = await addDoc(collection(db, "lessons"), {
        moduleId: selectedModule,
        title,
        content,
        order: orderNumber,
        createdAt: Timestamp.now(),
      });

      // 2. Mise à jour locale de la liste
      setLessons((prev) => [
        ...prev,
        {
          id: docRef.id,
          moduleId: selectedModule,
          title,
          content,
          order: orderNumber,
        },
      ]);

      setTitle("");
      setContent("");
      setOrder("");

      // 3. Récupérer le programId du module
      const moduleObj = modules.find((m) => m.id === selectedModule);
      const programId = moduleObj ? moduleObj.programId : null;

      // 4. Redirection vers l’éditeur riche
      if (programId) {
        navigate(
          `/admin/programs/${programId}/modules/${selectedModule}/lessons/${docRef.id}/edit`
        );
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création de la leçon.");
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

  // Tri sécurisé
  const sortedLessons = [...lessons].sort((a, b) => {
    const moduleA = a.moduleId || "";
    const moduleB = b.moduleId || "";

    if (moduleA === moduleB) {
      return (a.order || 0) - (b.order || 0);
    }

    return moduleA.localeCompare(moduleB);
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
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Leçons</h1>

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
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Nouvelle leçon</h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-muted)",
              marginBottom: 16,
            }}
          >
            Ajoutez du contenu (texte) à un module.
          </p>

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Programme (pour filtrer les modules)
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
            <option value="">Tous les programmes</option>
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
          />

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Contenu de la leçon
          </label>
          <div style={{ marginBottom: 12 }}>
            <LessonEditor
              initialContent={content}
              onChange={(html) => setContent(html)}
            />
          </div>

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Ordre dans le module (1, 2, 3…)
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
            <p
              style={{
                color: "#dc2626",
                marginBottom: 10,
                fontSize: 13,
              }}
            >
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
            {loading ? "Création..." : "Créer la leçon"}
          </button>
        </form>

        {/* Liste des leçons */}
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Liste des leçons</h2>
          {sortedLessons.length === 0 ? (
            <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
              Aucune leçon pour l’instant.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {sortedLessons.map((lesson) => (
                <li
                  key={lesson.id}
                  style={{
                    marginBottom: 10,
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                  }}
                >
                  <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
                    {getProgramNameForModule(lesson.moduleId)} •{" "}
                    {getModuleTitle(lesson.moduleId)} • Ordre{" "}
                    {lesson.order || 0}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{lesson.title}</div>
                      {lesson.content && (
                        <div
                          style={{
                            color: "var(--color-muted)",
                            fontSize: 13,
                            marginTop: 4,
                            maxHeight: 60,
                            overflow: "hidden",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: lesson.content,
                          }}
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const moduleObj = modules.find(
                          (m) => m.id === lesson.moduleId
                        );
                        const programId = moduleObj
                          ? moduleObj.programId
                          : null;

                        if (programId) {
                          navigate(
                            `/admin/programs/${programId}/modules/${lesson.moduleId}/lessons/${lesson.id}/edit`
                          );
                        } else {
                          // fallback : ancien éditeur
                          navigate(`/admin/lessons/edit?id=${lesson.id}`);
                        }
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid #D1D5DB",
                        background: "#F9FAFB",
                        fontSize: 12,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Modifier
                    </button>
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
