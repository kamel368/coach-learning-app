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
import { Plus, FileText, HelpCircle, BrainCircuit, ListTree, Eye, Edit2, FileEdit, Trash2, GripVertical, Pencil, MoreVertical, ChevronDown, Layers, ArrowLeft } from "lucide-react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);

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

        // (Optionnel) Exercices et exercices IA si tu veux aussi les structurer par programme
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

  // Fermer le menu mobile au clic outside
  useEffect(() => {
    const handleClickOutside = () => setMobileMenuOpen(null);
    
    if (mobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mobileMenuOpen]);

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

  // Les Exercices / IA restent pour l'instant à plat, basés sur programId + moduleId
  const handleAddQuizForChapter = async (chapterId) => {
    if (!program) return;
    const title = window.prompt("Nom des exercices ?");
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
      alert("Erreur lors de la création des exercices.");
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

      {/* Bouton retour */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => navigate('/admin/programs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f9fafb';
            e.currentTarget.style.color = '#1f2937';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          <ArrowLeft size={16} />
          Retour aux programmes
        </button>
      </div>

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
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 12,
            maxHeight: 'calc(100vh - 280px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: 4
          }}>
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
                  {/* ✅ HEADER MODERNISÉ DU CHAPITRE */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    gap: 16,
                    position: 'relative'
                  }}>
                    
                    {/* Partie gauche : Drag + Nom du module */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      flex: 1,
                      minWidth: 0
                    }}>
                      {/* Icône Drag & Drop */}
                      <div
                        className="drag-handle"
                        style={{
                          cursor: 'grab',
                          color: '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.2s ease',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#4F7FFF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9CA3AF';
                        }}
                        title="Glisser pour réordonner"
                      >
                        <GripVertical size={20} strokeWidth={2.5} />
                      </div>

                      {/* Bouton nom du module avec chevron */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChapter(chapter.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#1e293b',
                          padding: 0,
                          minWidth: 0,
                          flex: 1,
                          textAlign: 'left',
                          outline: 'none',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        {/* Icône du module */}
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Layers size={18} color="#ffffff" />
                        </div>
                        
                        {/* Nom */}
                        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {chapter.title}
                        </span>
                        
                        {/* Nombre de leçons */}
                        <span style={{ 
                          fontSize: 14, 
                          color: '#94a3b8',
                          fontWeight: 400,
                          flexShrink: 0
                        }}>
                          ({lessons.length})
                        </span>
                        
                        {/* Chevron */}
                        <ChevronDown 
                          size={16}
                          style={{
                            color: '#94a3b8',
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            flexShrink: 0
                          }}
                        />
                      </button>
                    </div>

                    {/* Partie droite : Actions */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      flexShrink: 0
                    }}>
                      
                      {/* Boutons d'ajout - Desktop uniquement */}
                      <div 
                        className="desktop-only"
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexShrink: 0
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddLessonForChapter(chapter.id);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#eff6ff',
                            color: '#3b82f6',
                            border: '1px solid #bfdbfe',
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#dbeafe';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#eff6ff';
                          }}
                        >
                          <FileText size={14} />
                          Leçon
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigation vers le builder d'exercices
                            navigate(`/admin/programs/${program.id}/chapters/${chapter.id}/exercises`);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#dbeafe',
                            color: '#1e40af',
                            border: '1px solid #bfdbfe',
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#bfdbfe';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#dbeafe';
                          }}
                        >
                          <HelpCircle size={14} />
                          🎯 Exercices
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddAIExerciseForChapter(chapter.id);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#faf5ff',
                            color: '#a855f7',
                            border: '1px solid #e9d5ff',
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f3e8ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#faf5ff';
                          }}
                        >
                          <BrainCircuit size={14} />
                          Exercice IA
                        </button>
                      </div>

                      {/* Divider vertical - Desktop uniquement */}
                      <div 
                        className="desktop-only"
                        style={{
                          display: 'flex',
                          width: 1,
                          height: 24,
                          background: '#e2e8f0',
                          flexShrink: 0
                        }}
                      />

                      {/* Icônes actions - Desktop */}
                      <div 
                        className="desktop-only"
                        style={{
                          display: 'flex',
                          gap: 4,
                          flexShrink: 0
                        }}
                      >
                        {/* Renommer */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameChapter(chapter);
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            fontSize: 18
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.1)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          title="Renommer le module"
                        >
                          ✏️
                        </button>

                        {/* Supprimer */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(chapter.id);
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
                            border: '1px solid #fecaca',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            fontSize: 18
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                            e.currentTarget.style.borderColor = '#ef4444';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)';
                            e.currentTarget.style.borderColor = '#fecaca';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          title="Supprimer le module"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Menu hamburger - Mobile uniquement */}
                      <div className="mobile-only" style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileMenuOpen(mobileMenuOpen === chapter.id ? null : chapter.id);
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            cursor: 'pointer'
                          }}
                        >
                          <MoreVertical size={20} color="#64748b" />
                        </button>

                        {/* Menu dropdown mobile */}
                        {mobileMenuOpen === chapter.id && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: 8,
                            zIndex: 1000,
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            padding: 8,
                            minWidth: 200
                          }}
                          onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                handleAddLessonForChapter(chapter.id);
                                setMobileMenuOpen(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 14
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                              }}
                            >
                              <FileText size={16} color="#64748b" />
                              Ajouter une leçon
                            </button>

                            <button
                              onClick={() => {
                                handleAddQuizForChapter(chapter.id);
                                setMobileMenuOpen(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 14
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                              }}
                            >
                              <HelpCircle size={16} color="#64748b" />
                              Ajouter des exercices
                            </button>

                            <button
                              onClick={() => {
                                handleAddAIExerciseForChapter(chapter.id);
                                setMobileMenuOpen(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 14
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                              }}
                            >
                              <BrainCircuit size={16} color="#64748b" />
                              Ajouter Exercice IA
                            </button>

                            <div style={{
                              height: 1,
                              background: '#e2e8f0',
                              margin: '8px 0'
                            }} />

                            <button
                              onClick={() => {
                                handleRenameChapter(chapter);
                                setMobileMenuOpen(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 14
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                              }}
                            >
                              <Pencil size={16} color="#64748b" />
                              Renommer
                            </button>

                            <button
                              onClick={() => {
                                handleDeleteChapter(chapter.id);
                                setMobileMenuOpen(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 14,
                                color: '#ef4444'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#fef2f2';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                              }}
                            >
                              <Trash2 size={16} color="#ef4444" />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenus du chapitre */}
                  {expanded && (
                    <div style={{ marginTop: 10 }}>
                      {/* Leçons */}
                      {lessons.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              marginBottom: 8,
                              color: "#6B7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <FileText size={14} color="#6B7280" />
                            Leçons ({lessons.length})
                          </div>
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
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
                                onDragLeave={onDragLeave}
                                onDragEnd={onDragEnd}
                                style={{
                                  padding: "14px 18px",
                                  borderRadius: "10px",
                                  border: "1px solid #E5E7EB",
                                  background: "#FFFFFF",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: "14px",
                                  cursor: "default",
                                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "linear-gradient(to right, rgba(79, 127, 255, 0.03), rgba(79, 127, 255, 0.01))";
                                  e.currentTarget.style.border = "1px solid rgba(79, 127, 255, 0.2)";
                                  e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(79, 127, 255, 0.1), 0 4px 12px rgba(79, 127, 255, 0.12)";
                                  e.currentTarget.style.transform = "translateX(4px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#FFFFFF";
                                  e.currentTarget.style.border = "1px solid #E5E7EB";
                                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)";
                                  e.currentTarget.style.transform = "translateX(0)";
                                }}
                              >
                                {/* Partie gauche : Icône drag + Titre */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    flex: 1,
                                  }}
                                >
                                  {/* Icône Drag & Drop */}
                                  <div
                                    className="drag-handle"
                                    style={{
                                      cursor: "grab",
                                      color: "#9CA3AF",
                                      display: "flex",
                                      alignItems: "center",
                                      flexShrink: 0,
                                      transition: "color 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = "#4F7FFF";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = "#9CA3AF";
                                    }}
                                    title="Glisser pour réordonner"
                                  >
                                    <GripVertical size={18} strokeWidth={2.5} />
                                  </div>

                                  {/* Icône FileText + Titre */}
                                  <div
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "8px",
                                      background: "linear-gradient(135deg, #3B82F620, #3B82F610)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <FileText size={16} color="#3B82F6" />
                                  </div>
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color: "#111827",
                                      fontSize: "14px",
                                    }}
                                  >
                                    {l.title}
                                  </span>
                                </div>

                                {/* ACTIONS - TAILLES CORRIGÉES */}
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                  }}
                                >
                                  {/* Bouton Voir/Prévisualiser */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/programs/${program.id}/modules/${chapter.id}/lessons/${l.id}/preview`
                                      );
                                    }}
                                    title="Prévisualiser la leçon"
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      border: "none",
                                      background: "#F9FAFB",
                                      borderRadius: "8px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                      color: "#6B7280",
                                      flexShrink: 0,
                                      padding: 0,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "#4F7FFF";
                                      e.currentTarget.style.color = "#FFFFFF";
                                      e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(79, 127, 255, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "#F9FAFB";
                                      e.currentTarget.style.color = "#6B7280";
                                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    <Eye size={20} strokeWidth={2.5} />
                                  </button>

                                  {/* Bouton Modifier (éditeur) */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/admin/programs/${program.id}/modules/${chapter.id}/lessons/${l.id}/edit`
                                      );
                                    }}
                                    title="Modifier (éditeur)"
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      border: "none",
                                      background: "#F9FAFB",
                                      borderRadius: "8px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                      color: "#6B7280",
                                      flexShrink: 0,
                                      padding: 0,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "#10B981";
                                      e.currentTarget.style.color = "#FFFFFF";
                                      e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(16, 185, 129, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "#F9FAFB";
                                      e.currentTarget.style.color = "#6B7280";
                                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    <Edit2 size={20} strokeWidth={2.5} />
                                  </button>

                                  {/* Bouton Renommer */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRenameLesson(chapter.id, l);
                                    }}
                                    title="Renommer"
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      border: "none",
                                      background: "#F9FAFB",
                                      borderRadius: "8px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                      color: "#6B7280",
                                      flexShrink: 0,
                                      padding: 0,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "#F59E0B";
                                      e.currentTarget.style.color = "#FFFFFF";
                                      e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(245, 158, 11, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "#F9FAFB";
                                      e.currentTarget.style.color = "#6B7280";
                                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    <FileEdit size={20} strokeWidth={2.5} />
                                  </button>

                                  {/* Bouton Supprimer */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteLesson(chapter.id, l.id);
                                    }}
                                    title="Supprimer"
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      border: "none",
                                      background: "#F9FAFB",
                                      borderRadius: "8px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                      color: "#6B7280",
                                      flexShrink: 0,
                                      padding: 0,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "#EF4444";
                                      e.currentTarget.style.color = "#FFFFFF";
                                      e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(239, 68, 68, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "#F9FAFB";
                                      e.currentTarget.style.color = "#6B7280";
                                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    <Trash2 size={20} strokeWidth={2.5} />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* EXERCICES */}
                      {quizzesForChapter.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              marginBottom: 4,
                            }}
                          >
                            EXERCICES
                          </div>
                          {/* Rendu Exercices à adapter si besoin */}
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
