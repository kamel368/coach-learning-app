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
import { Plus, FileText, HelpCircle, BrainCircuit, ListTree, Eye, Edit2, FileEdit, Trash2, GripVertical, BookOpen, Users, Copy } from "lucide-react";

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

  const handleDuplicateChapter = async (chapter) => {
    try {
      const newChapter = {
        ...chapter,
        title: `${chapter.title} (copie)`,
        order: chapters.length,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      delete newChapter.id; // Retirer l'ancien ID

      const modulesRef = collection(db, "programs", program.id, "modules");
      const docRef = await addDoc(modulesRef, newChapter);
      
      setChapters((prev) => [...prev, { id: docRef.id, ...newChapter }]);
      alert(`✅ Chapitre "${newChapter.title}" dupliqué avec succès !`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la duplication du chapitre.");
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

  const allowDrop = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    // Ajouter classe drop-zone si pas déjà présente
    if (!e.currentTarget.classList.contains("drop-zone-active")) {
      e.currentTarget.classList.add("drop-zone-active");
    }
  };

  const onDragLeave = (e) => {
    // Retirer la classe drop-zone quand on quitte l'élément
    e.currentTarget.classList.remove("drop-zone-active");
  };

  const onDragEnd = (e) => {
    // Nettoyer toutes les classes drag à la fin
    e.target.classList.remove("dragging-chapter", "dragging-lesson");
    document.querySelectorAll(".drop-zone-active").forEach(el => {
      el.classList.remove("drop-zone-active");
    });
  };

  const onChapterDragStart = (e, chapterId) => {
    e.dataTransfer.setData("chapterId", chapterId);
    e.dataTransfer.effectAllowed = "move";
    
    // Ajouter classe dragging
    setTimeout(() => {
      e.target.classList.add("dragging-chapter");
    }, 0);
  };

  const onChapterDrop = async (e, targetChapterId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("chapterId");
    if (!draggedId || draggedId === targetChapterId) return;

    // Retirer les classes drag
    document.querySelectorAll(".dragging-chapter, .drop-zone-active").forEach(el => {
      el.classList.remove("dragging-chapter", "drop-zone-active");
    });

    const ordered = [...chapters];
    const draggedIndex = ordered.findIndex((c) => c.id === draggedId);
    const targetIndex = ordered.findIndex((c) => c.id === targetChapterId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const [moved] = ordered.splice(draggedIndex, 1);
    ordered.splice(targetIndex, 0, moved);

    const updated = ordered.map((c, index) => ({ ...c, order: index + 1 }));
    setChapters(updated);

    // Animation succès
    e.target.classList.add("just-dropped", "drop-success");
    setTimeout(() => {
      e.target.classList.remove("just-dropped", "drop-success");
    }, 600);

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
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation(); // Important : empêcher la propagation au chapitre
    
    // Ajouter classe dragging
    setTimeout(() => {
      e.target.classList.add("dragging-lesson");
    }, 0);
  };

  const onLessonDrop = async (e, targetLessonId, chapterId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedId = e.dataTransfer.getData("lessonId");
    const draggedChapterId = e.dataTransfer.getData("chapterId");
    if (!draggedId || draggedId === targetLessonId || draggedChapterId !== chapterId) return;

    // Retirer les classes drag
    document.querySelectorAll(".dragging-lesson, .drop-zone-active").forEach(el => {
      el.classList.remove("dragging-lesson", "drop-zone-active");
    });

    const lessons = lessonsByChapter[chapterId] || [];
    const ordered = [...lessons];
    const draggedIndex = ordered.findIndex((l) => l.id === draggedId);
    const targetIndex = ordered.findIndex((l) => l.id === targetLessonId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const [moved] = ordered.splice(draggedIndex, 1);
    ordered.splice(targetIndex, 0, moved);

    const updated = ordered.map((l, index) => ({ ...l, order: index + 1 }));
    setLessonsByChapter((prev) => ({ ...prev, [chapterId]: updated }));

    // Animation succès
    e.target.classList.add("just-dropped", "drop-success");
    setTimeout(() => {
      e.target.classList.remove("just-dropped", "drop-success");
    }, 600);

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
      {/* Style global pour drag & drop animations */}
      <style>
        {`
          /* ========================================
             DRAG & DROP ANIMATIONS
             ======================================== */
          
          /* Curseur pendant le drag */
          [draggable="true"]:active {
            cursor: grabbing !important;
          }

          /* Élément en cours de drag */
          .dragging-chapter,
          .dragging-lesson {
            opacity: 0.6;
            transform: scale(1.05) rotate(-2deg);
            box-shadow: 0 20px 40px rgba(79, 127, 255, 0.4) !important;
            border: 2px dashed #4F7FFF !important;
            background: #FFFFFF !important;
            cursor: grabbing !important;
            z-index: 1000;
            transition: none !important;
          }

          /* Animation pulsation sur l'icône drag au hover */
          @keyframes pulse-drag {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }

          .drag-handle:hover {
            animation: pulse-drag 0.6s ease-in-out infinite;
          }

          /* Espace qui s'ouvre (drop zone) */
          .drop-zone-active {
            position: relative;
            margin-bottom: 32px !important;
            transition: margin-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .drop-zone-active::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: -20px;
            height: 4px;
            background: linear-gradient(90deg, #4F7FFF, #60A5FA);
            border-radius: 2px;
            box-shadow: 0 0 12px rgba(79, 127, 255, 0.6);
            animation: pulse-line 1s ease-in-out infinite;
          }

          @keyframes pulse-line {
            0%, 100% {
              opacity: 1;
              transform: scaleX(1);
            }
            50% {
              opacity: 0.7;
              transform: scaleX(0.98);
            }
          }

          /* Animation après dépôt (bounce) */
          @keyframes drop-bounce {
            0% {
              transform: translateY(-8px);
              opacity: 0.8;
            }
            60% {
              transform: translateY(2px);
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .just-dropped {
            animation: drop-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          /* Flash vert après succès */
          @keyframes success-flash {
            0%, 100% {
              background: #FFFFFF;
            }
            50% {
              background: rgba(16, 185, 129, 0.1);
              border-color: #10B981;
            }
          }

          .drop-success {
            animation: success-flash 0.6s ease;
          }
        `}
      </style>

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
          
          {/* Compteur de chapitres */}
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              fontWeight: 700,
              color: "#6B7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ListTree size={14} color="#6B7280" />
            Chapitres ({chapters.length})
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
          {/* Boutons d'actions globaux */}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            marginBottom: 24,
            flexWrap: 'wrap' 
          }}>
            {/* Bouton Ajouter un chapitre */}
            <button
              onClick={handleAddChapter}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              <BookOpen size={16} />
              Ajouter un chapitre
            </button>

            {/* Bouton QCM */}
            <button
              onClick={() => navigate(`/admin/quizzes?programId=${programId}`)}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              <HelpCircle size={16} />
              QCM
            </button>

            {/* Bouton Jeux de rôle */}
            <button
              onClick={() => navigate(`/admin/ai-exercises?programId=${programId}`)}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
              }}
            >
              <Users size={16} />
              Jeux de rôle
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
                  onDragLeave={onDragLeave}
                  onDragEnd={onDragEnd}
                  style={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    padding: 12,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {/* Header du chapitre */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    marginBottom: 12 
                  }}>
                    {/* Icône drag */}
                    <GripVertical 
                      size={20} 
                      style={{ color: '#9ca3af', cursor: 'grab' }} 
                    />
                    
                    {/* Titre */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: 16, 
                        fontWeight: 600, 
                        margin: 0,
                        color: '#1f2937'
                      }}>
                        {chapter.title}
                      </h3>
                      {chapter.description && (
                        <p style={{ 
                          fontSize: 13, 
                          color: '#6b7280', 
                          margin: '4px 0 0 0' 
                        }}>
                          {chapter.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ 
                      display: 'flex', 
                      gap: 8,
                      alignItems: 'center' 
                    }}>
                      {/* Bouton Leçons */}
                      <button
                        onClick={() => navigate(`/admin/programs/${programId}/modules/${chapter.id}/lessons`)}
                        style={{
                          padding: '8px 12px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#3b82f6',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#eff6ff';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                        title="Gérer les leçons"
                      >
                        <FileText size={16} />
                        Leçons
                      </button>

                      {/* Bouton Renommer */}
                      <button
                        onClick={() => handleRenameChapter(chapter)}
                        style={{
                          padding: '8px 12px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#6b7280',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                          e.currentTarget.style.color = '#1f2937';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.color = '#6b7280';
                        }}
                        title="Renommer"
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* Bouton Dupliquer */}
                      <button
                        onClick={() => handleDuplicateChapter(chapter)}
                        style={{
                          padding: '8px 12px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#6b7280',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                          e.currentTarget.style.color = '#1f2937';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.color = '#6b7280';
                        }}
                        title="Dupliquer"
                      >
                        <Copy size={16} />
                      </button>

                      {/* Bouton Supprimer */}
                      <button
                        onClick={() => handleDeleteChapter(chapter.id)}
                        style={{
                          padding: '8px 12px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#ef4444',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fef2f2';
                          e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Onglet Apprenants */}
      {activeTab === "learners" && (
        <div style={{ marginTop: 16, fontSize: 14, color: "#6b7280" }}>
          Gestion des apprenants à venir...
        </div>
      )}
    </div>
  );
}
