// src/pages/AdminProgramDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { Plus, FileText, HelpCircle, BrainCircuit, ListTree } from "lucide-react";

export default function AdminProgramDetail() {
  const { programId } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState("");

  const [chapters, setChapters] = useState([]); // modules
  const [lessonsByChapter, setLessonsByChapter] = useState({}); // { moduleId: [lessons] }
  const [quizzes, setQuizzes] = useState([]);
  const [aiExercises, setAiExercises] = useState([]);

  const [activeTab, setActiveTab] = useState("content"); // content | learners
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [openLessonMenuId, setOpenLessonMenuId] = useState(null);

  // --------- Chargement initial ---------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Programme
        const programRef = doc(db, "programs", programId);
        const programSnap = await getDoc(programRef);
        if (!programSnap.exists()) {
          setError("Programme introuvable.");
          setLoading(false);
          return;
        }
        setProgram({ id: programSnap.id, ...programSnap.data() });

        // Modules (chapitres)
        const modulesRef = collection(db, "programs", programId, "modules");
        const modulesSnap = await getDocs(modulesRef);
        const modulesList = modulesSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setChapters(modulesList);

        // Leçons par module
        const lessonsMap = {};
        for (const mod of modulesList) {
          const lessonsRef = collection(
            db,
            "programs",
            programId,
            "modules",
            mod.id,
            "lessons"
          );
          const lessonsSnap = await getDocs(lessonsRef);
          lessonsMap[mod.id] = lessonsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        setLessonsByChapter(lessonsMap);

        // (Optionnel) QCM et exercices IA si tu veux aussi les structurer par programme
        const quizzesSnap = await getDocs(collection(db, "quizzes"));
        setQuizzes(
          quizzesSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((q) => q.programId === programId)
        );

        const aiSnap = await getDocs(collection(db, "aiExercises"));
        setAiExercises(
          aiSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((a) => a.programId === programId)
        );
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement du programme.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [programId]);

  const formatDate = (ts) => {
    if (!ts) return "—";
    try {
      const date =
        ts instanceof Timestamp ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getStatusDotColor = (s) => {
    if (s === "published") return "#22c55e";
    if (s === "disabled") return "#ef4444";
    return "#facc15";
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setProgram((prev) => (prev ? { ...prev, name: value } : prev));
  };

  const saveTitle = async () => {
    if (!program) return;
    try {
      const ref = doc(db, "programs", program.id);
      await updateDoc(ref, {
        name: program.name || "",
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du titre.");
    }
  };

  const handleStatusChange = async (e) => {
    if (!program) return;
    const newStatus = e.target.value;
    try {
      setStatusSaving(true);
      const ref = doc(db, "programs", program.id);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      setProgram((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (err) {
      console.error(err);
      alert("Erreur lors du changement de statut.");
    } finally {
      setStatusSaving(false);
    }
  };

  // --------- Créations ---------

  const handleAddChapter = async () => {
    if (!program) return;
    const title = window.prompt("Nom du chapitre ?");
    if (!title) return;
    try {
      const nextOrder = (chapters.length || 0) + 1;
      const ref = await addDoc(
        collection(db, "programs", program.id, "modules"),
        {
          title,
          order: nextOrder,
          createdAt: Timestamp.now(),
        }
      );
      const newChapter = {
        id: ref.id,
        title,
        order: nextOrder,
        createdAt: Timestamp.now(),
      };
      setChapters((prev) =>
        [...prev, newChapter].sort((a, b) => (a.order || 0) - (b.order || 0))
      );
      setLessonsByChapter((prev) => ({ ...prev, [ref.id]: [] }));
      setExpandedChapters((prev) => {
        const next = new Set(prev);
        next.add(ref.id);
        return next;
      });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du chapitre.");
    }
  };

  const handleAddLessonForChapter = async (chapterId) => {
  if (!program) return;

  const title = window.prompt("Titre de la leçon ?");
  if (!title) return;

  const currentLessons = lessonsByChapter[chapterId] || [];
  const nextOrder = currentLessons.length + 1;

  try {
    const ref = await addDoc(
      collection(
        db,
        "programs",
        program.id,
        "modules",
        chapterId,
        "lessons"
      ),
      {
        title,
        order: nextOrder,
        status: "draft",
        editorData: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    );

    const newLesson = {
      id: ref.id,
      title,
      order: nextOrder,
      status: "draft",
    };

    setLessonsByChapter((prev) => ({
      ...prev,
      [chapterId]: [...currentLessons, newLesson].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      ),
    }));

    // ✅ On envoie aussi le titre à la page d’édition
    navigate(
      `/admin/programs/${program.id}/modules/${chapterId}/lessons/${ref.id}/edit`,
      {
        state: {
          initialTitle: title,
        },
      }
    );
  } catch (err) {
    console.error(err);
    alert("Erreur lors de la création de la leçon.");
  }
};

  // Les QCM / IA restent pour l'instant à plat, basés sur programId + moduleId
  const handleAddQuizForChapter = async (chapterId) => {
    if (!program) return;
    const title = window.prompt("Nom du QCM ?");
    if (!title) return;

    const existingForChapter = quizzes.filter((q) => q.moduleId === chapterId);
    const nextOrder = (existingForChapter.length || 0) + 1;

    try {
      const ref = await addDoc(collection(db, "quizzes"), {
        programId: program.id,
        moduleId: chapterId,
        title,
        order: nextOrder,
        createdAt: Timestamp.now(),
      });
      setQuizzes((prev) => [
        ...prev,
        {
          id: ref.id,
          programId: program.id,
          moduleId: chapterId,
          title,
          order: nextOrder,
        },
      ]);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du QCM.");
    }
  };

  const handleAddAIExerciseForChapter = async (chapterId) => {
    if (!program) return;
    const title = window.prompt("Nom de l'exercice IA ?");
    if (!title) return;

    const existingForChapter = aiExercises.filter((e) => e.moduleId === chapterId);
    const nextOrder = (existingForChapter.length || 0) + 1;

    try {
      const ref = await addDoc(collection(db, "aiExercises"), {
        programId: program.id,
        moduleId: chapterId,
        title,
        order: nextOrder,
        createdAt: Timestamp.now(),
      });
      setAiExercises((prev) => [
        ...prev,
        {
          id: ref.id,
          programId: program.id,
          moduleId: chapterId,
          title,
          order: nextOrder,
        },
      ]);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'exercice IA.");
    }
  };

  // --------- Renommer / Supprimer ---------

  const handleRenameChapter = async (chapter) => {
    const current = chapter.title || "";
    const newTitle = window.prompt("Nouveau nom du chapitre ?", current);
    if (!newTitle || newTitle === current) return;

    try {
      const ref = doc(db, "programs", program.id, "modules", chapter.id);
      await updateDoc(ref, {
        title: newTitle,
        updatedAt: Timestamp.now(),
      });
      setChapters((prev) =>
        prev.map((c) => (c.id === chapter.id ? { ...c, title: newTitle } : c))
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du chapitre.");
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm("Supprimer ce chapitre (les leçons associées resteront en base si tu ne les traites pas) ?")) return;
    try {
      const ref = doc(db, "programs", program.id, "modules", chapterId);
      await deleteDoc(ref);
      setChapters((prev) => prev.filter((c) => c.id !== chapterId));
      setLessonsByChapter((prev) => {
        const copy = { ...prev };
        delete copy[chapterId];
        return copy;
      });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression du chapitre.");
    }
  };

  const handleRenameLesson = async (chapterId, lesson) => {
    const current = lesson.title || "";
    const newTitle = window.prompt("Nouveau titre de la leçon ?", current);
    if (!newTitle || newTitle === current) return;

    try {
      const ref = doc(
        db,
        "programs",
        program.id,
        "modules",
        chapterId,
        "lessons",
        lesson.id
      );
      await updateDoc(ref, {
        title: newTitle,
        updatedAt: Timestamp.now(),
      });
      setLessonsByChapter((prev) => ({
        ...prev,
        [chapterId]: (prev[chapterId] || []).map((l) =>
          l.id === lesson.id ? { ...l, title: newTitle } : l
        ),
      }));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de la leçon.");
    }
  };

  const handleDeleteLesson = async (chapterId, lessonId) => {
    if (!window.confirm("Supprimer cette leçon ?")) return;
    try {
      const ref = doc(
        db,
        "programs",
        program.id,
        "modules",
        chapterId,
        "lessons",
        lessonId
      );
      await deleteDoc(ref);
      setLessonsByChapter((prev) => ({
        ...prev,
        [chapterId]: (prev[chapterId] || []).filter((l) => l.id !== lessonId),
      }));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression de la leçon.");
    }
  };

  // --------- Drag & drop ---------

  const allowDrop = (e) => e.preventDefault();

  const onChapterDragStart = (e, chapterId) => {
    e.dataTransfer.setData("chapterId", chapterId);
  };

  const onChapterDrop = async (e, targetChapterId) => {
    const draggedId = e.dataTransfer.getData("chapterId");
    if (!draggedId || draggedId === targetChapterId) return;

    const ordered = [...chapters];
    const draggedIndex = ordered.findIndex((c) => c.id === draggedId);
    const targetIndex = ordered.findIndex((c) => c.id === targetChapterId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const [moved] = ordered.splice(draggedIndex, 1);
    ordered.splice(targetIndex, 0, moved);

    const updated = ordered.map((c, index) => ({ ...c, order: index + 1 }));
    setChapters(updated);

    try {
      await Promise.all(
        updated.map((c) =>
          updateDoc(doc(db, "programs", program.id, "modules", c.id), {
            order: c.order,
            updatedAt: Timestamp.now(),
          })
        )
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors du réordonnancement des chapitres.");
    }
  };

  const onLessonDragStart = (e, lessonId, chapterId) => {
    e.dataTransfer.setData("lessonId", lessonId);
    e.dataTransfer.setData("chapterId", chapterId);
  };

  const onLessonDrop = async (e, targetLessonId, chapterId) => {
    const draggedId = e.dataTransfer.getData("lessonId");
    const draggedChapterId = e.dataTransfer.getData("chapterId");
    if (!draggedId || draggedId === targetLessonId || draggedChapterId !== chapterId) return;

    const lessons = lessonsByChapter[chapterId] || [];
    const ordered = [...lessons];
    const draggedIndex = ordered.findIndex((l) => l.id === draggedId);
    const targetIndex = ordered.findIndex((l) => l.id === targetLessonId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const [moved] = ordered.splice(draggedIndex, 1);
    ordered.splice(targetIndex, 0, moved);

    const updated = ordered.map((l, index) => ({ ...l, order: index + 1 }));
    setLessonsByChapter((prev) => ({ ...prev, [chapterId]: updated }));

    try {
      await Promise.all(
        updated.map((l) =>
          updateDoc(
            doc(
              db,
              "programs",
              program.id,
              "modules",
              chapterId,
              "lessons",
              l.id
            ),
            {
              order: l.order,
              updatedAt: Timestamp.now(),
            }
          )
        )
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors du réordonnancement des leçons.");
    }
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const handleLessonMenuToggle = (lessonId) => {
    setOpenLessonMenuId((prev) => (prev === lessonId ? null : lessonId));
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: "var(--color-muted)" }}>
        Chargement du programme...
      </div>
    );
  }

  if (!program) {
    return (
      <div style={{ padding: 24, color: "#dc2626" }}>
        Programme introuvable.
      </div>
    );
  }

  // --------- Rendu ---------
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      {/* Header programme */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={program.name || ""}
            onChange={handleTitleChange}
            onBlur={saveTitle}
            style={{
              fontSize: 24,
              fontWeight: 600,
              border: "none",
              background: "transparent",
              outline: "none",
              padding: 4,
            }}
          />
          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              color: "var(--color-muted)",
            }}
          >
            Créé le {formatDate(program.createdAt)} • Dernière mise à jour le{" "}
            {formatDate(program.updatedAt)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Prévisualisation programme (URL à adapter) */}
          <button
            type="button"
            onClick={() => navigate(`/programs/${program.id}/preview`)}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              background: "#f3f4f6",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Prévisualiser le programme
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "999px",
                background: getStatusDotColor(program.status),
              }}
            />
            <span>Statut :</span>
          </div>
          <select
            value={program.status || "draft"}
            onChange={handleStatusChange}
            disabled={statusSaving}
            style={{
              padding: "6px 8px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              fontSize: 13,
            }}
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="disabled">Désactivé</option>
          </select>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: activeTab === "content" ? 600 : 400,
            background:
              activeTab === "content"
                ? "var(--color-surface)"
                : "transparent",
          }}
        >
          Contenus
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("learners")}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: activeTab === "learners" ? 600 : 400,
            background:
              activeTab === "learners"
                ? "var(--color-surface)"
                : "transparent",
          }}
        >
          Apprenants
        </button>
      </div>

      {activeTab === "content" && (
        <div>
          {/* Bouton ajouter chapitre */}
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={handleAddChapter}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ListTree className="w-4 h-4" />
              Ajouter un chapitre
            </button>
          </div>

          {/* Liste des chapitres avec drag & drop */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {chapters.map((chapter) => {
              const lessons = lessonsByChapter[chapter.id] || [];
              const quizzesForChapter = quizzes.filter(
                (q) => q.moduleId === chapter.id
              );
              const aiForChapter = aiExercises.filter(
                (e) => e.moduleId === chapter.id
              );
              const expanded = expandedChapters.has(chapter.id);

              return (
                <div
                  key={chapter.id}
                  draggable
                  onDragStart={(e) => onChapterDragStart(e, chapter.id)}
                  onDrop={(e) => onChapterDrop(e, chapter.id)}
                  onDragOver={allowDrop}
                  style={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    padding: 12,
                  }}
                >
                  {/* Header du chapitre */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                      onClick={() => toggleChapter(chapter.id)}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "transform 0.15s ease",
                          fontSize: 14,
                          color: "#6b7280",
                        }}
                      >
                        ▶
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>
                        {chapter.title}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleRenameChapter(chapter)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          border: "1px solid #d1d5db",
                          background: "#f9fafb",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Renommer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChapter(chapter.id)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          fontSize: 11,
                          color: "#b91c1c",
                          cursor: "pointer",
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Actions chapitre */}
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleAddLessonForChapter(chapter.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "1px solid #3b82f6",
                        background: "#eff6ff",
                        color: "#1e40af",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#dbeafe";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#eff6ff";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <FileText className="w-3 h-3" />
                      Leçon
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuizForChapter(chapter.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "1px solid #10b981",
                        background: "#d1fae5",
                        color: "#065f46",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#a7f3d0";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#d1fae5";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <HelpCircle className="w-3 h-3" />
                      QCM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddAIExerciseForChapter(chapter.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "1px solid #8b5cf6",
                        background: "#ede9fe",
                        color: "#5b21b6",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#ddd6fe";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#ede9fe";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <BrainCircuit className="w-3 h-3" />
                      Exercice IA
                    </button>
                  </div>

                  {/* Contenus du chapitre */}
                  {expanded && (
                    <div style={{ marginTop: 10 }}>
                      {/* Leçons */}
                      {lessons.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              marginBottom: 4,
                            }}
                          >
                            Leçons
                          </div>
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            {lessons.map((l) => (
                              <li
                                key={l.id}
                                draggable
                                onDragStart={(e) =>
                                  onLessonDragStart(e, l.id, chapter.id)
                                }
                                onDrop={(e) =>
                                  onLessonDrop(e, l.id, chapter.id)
                                }
                                onDragOver={allowDrop}
                                style={{
                                  padding: 6,
                                  borderRadius: 6,
                                  border: "1px solid #e5e7eb",
                                  background: "#f9fafb",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: 13,
                                }}
                              >
                                <span>{l.title}</span>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <div style={{ position: "relative" }}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleLessonMenuToggle(l.id)
                                      }
                                      style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: "999px",
                                        border: "1px solid #d1d5db",
                                        background: "#ffffff",
                                        fontSize: 16,
                                        lineHeight: "1",
                                        cursor: "pointer",
                                      }}
                                    >
                                      ⋯
                                    </button>

                                    {openLessonMenuId === l.id && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          right: 0,
                                          marginTop: 4,
                                          minWidth: 180,
                                          borderRadius: 8,
                                          border: "1px solid #e5e7eb",
                                          background: "#ffffff",
                                          boxShadow:
                                            "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
                                          zIndex: 20,
                                        }}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigate(
                                              `/admin/programs/${program.id}/modules/${chapter.id}/lessons/${l.id}/edit`
                                            );
                                            setOpenLessonMenuId(null);
                                          }}
                                          style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "6px 10px",
                                            border: "none",
                                            background: "transparent",
                                            textAlign: "left",
                                            fontSize: 13,
                                            cursor: "pointer",
                                          }}
                                        >
                                          Modifier (éditeur)
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            // À adapter à ta vraie route de preview leçon
                                            navigate(
                                              `/programs/${program.id}/modules/${chapter.id}/lessons/${l.id}/preview`
                                            );
                                            setOpenLessonMenuId(null);
                                          }}
                                          style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "6px 10px",
                                            border: "none",
                                            background: "transparent",
                                            textAlign: "left",
                                            fontSize: 13,
                                            cursor: "pointer",
                                          }}
                                        >
                                          Prévisualiser la leçon
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleRenameLesson(chapter.id, l);
                                            setOpenLessonMenuId(null);
                                          }}
                                          style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "6px 10px",
                                            border: "none",
                                            background: "transparent",
                                            textAlign: "left",
                                            fontSize: 13,
                                            cursor: "pointer",
                                          }}
                                        >
                                          Renommer
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleDeleteLesson(
                                              chapter.id,
                                              l.id
                                            );
                                            setOpenLessonMenuId(null);
                                          }}
                                          style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "6px 10px",
                                            border: "none",
                                            background: "transparent",
                                            textAlign: "left",
                                            fontSize: 13,
                                            color: "#b91c1c",
                                            cursor: "pointer",
                                          }}
                                        >
                                          Supprimer
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* QCM */}
                      {quizzesForChapter.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              marginBottom: 4,
                            }}
                          >
                            QCM
                          </div>
                          {/* Rendu QCM à adapter si besoin */}
                        </div>
                      )}

                      {/* Exercices IA */}
                      {aiForChapter.length > 0 && (
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              marginBottom: 4,
                            }}
                          >
                            Exercices IA
                          </div>
                          {/* Rendu IA à adapter si besoin */}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "learners" && (
        <div style={{ marginTop: 16, fontSize: 14, color: "var(--color-muted)" }}>
          Gestion des apprenants à venir...
        </div>
      )}
    </div>
  );
}
