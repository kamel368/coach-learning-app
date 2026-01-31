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
import { Plus, FileText, HelpCircle, BrainCircuit, ListTree, Eye, EyeOff, Edit2, FileEdit, Trash2, GripVertical, Pencil, ChevronDown, Layers, ArrowLeft, Copy } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAuth } from "../context/AuthContext";
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { getPrograms } from '../services/supabase/programs';
import { getChaptersByProgram, createChapter, updateChapter, deleteChapter } from '../services/supabase/chapters';
import { getLessonsByChapter, createLesson, deleteLesson, reorderLessons, getLesson } from '../services/supabase/lessons';
import ChapterModal from '../components/ChapterModal';

export default function AdminProgramDetail() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { organizationId, user } = useAuth();

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]); // Liste des catégories
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [chapters, setChapters] = useState([]); // chapters
  const [lessonsByChapter, setLessonsByChapter] = useState({}); // { chapterId: [lessons] }
  const [quizzes, setQuizzes] = useState([]);
  const [aiExercises, setAiExercises] = useState([]);

  const [expandedChapters, setExpandedChapters] = useState(new Set());

  // États Supabase
  const [useSupabase, setUseSupabase] = useState(false);
  const { user: supabaseUser, organizationId: supabaseOrgId } = useSupabaseAuth();

  // États modal
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  // État pour l'expansion des leçons

  // --------- Détection automatique de la source ---------
  useEffect(() => {
    // Détection automatique : si on a un user Supabase et pas de données Firebase, basculer sur Supabase
    const autoDetectSource = async () => {
      if (supabaseUser && supabaseOrgId && programId) {
        // Essayer de charger depuis Supabase d'abord
        const { data: programs } = await getPrograms(supabaseOrgId);
        const foundInSupabase = programs?.some(p => p.id === programId);
        
        if (foundInSupabase) {
          console.log('✅ Programme trouvé dans Supabase, bascule auto');
          setUseSupabase(true);
          return;
        }
      }
      
      // Sinon, rester sur Firebase
      setUseSupabase(false);
    };

    autoDetectSource();
  }, [programId, supabaseUser, supabaseOrgId]);

  // --------- Chargement initial ---------
  useEffect(() => {
    if (useSupabase) {
      // Mode Supabase
      if (supabaseOrgId && programId) {
        loadSupabaseData();
      }
    } else {
      // Mode Firebase (code existant)
      if (!programId || !organizationId) return; // Attendre programId et organizationId
      load();
    }
  }, [programId, organizationId, supabaseOrgId, useSupabase]);

  const load = async () => {
      try {
        setLoading(true);

        // Programme - charger depuis l'organisation
        let programSnap;
        
        if (organizationId) {
          // Nouvelle structure
          const programRef = doc(db, "organizations", organizationId, "programs", programId);
          programSnap = await getDoc(programRef);
          console.log('📚 Programme chargé depuis /organizations/' + organizationId + '/programs/' + programId);
        } else {
          // Fallback ancienne structure
          const programRef = doc(db, "programs", programId);
          programSnap = await getDoc(programRef);
          console.log('⚠️ Fallback: Programme depuis /programs/' + programId);
        }
        
        if (!programSnap.exists()) {
          setError("Programme introuvable.");
          setLoading(false);
          return;
        }
        setProgram({ id: programSnap.id, ...programSnap.data() });

        // Charger les catégories
        let categoriesSnap;
        if (organizationId) {
          categoriesSnap = await getDocs(collection(db, "organizations", organizationId, "categories"));
        } else {
          categoriesSnap = await getDocs(collection(db, "categories"));
        }

        const categoriesList = categoriesSnap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setCategories(categoriesList);
        console.log('📂 Catégories chargées:', categoriesList.length);

        // Chapitres (chapitres) - charger depuis l'organisation
        const modulesRef = organizationId
          ? collection(db, "organizations", organizationId, "programs", programId, "chapitres")
          : collection(db, "programs", programId, "chapitres");
        
        const modulesSnap = await getDocs(modulesRef);
        const modulesList = modulesSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setChapters(modulesList);
        
        console.log('📂 Chapitres chargés:', modulesList.length);

        // Leçons par chapitre - charger depuis l'organisation
        const lessonsMap = {};
        for (const mod of modulesList) {
          const lessonsRef = organizationId
            ? collection(db, "organizations", organizationId, "programs", programId, "chapitres", mod.id, "lessons")
            : collection(db, "programs", programId, "chapitres", mod.id, "lessons");
          
          const lessonsSnap = await getDocs(lessonsRef);
          lessonsMap[mod.id] = lessonsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        setLessonsByChapter(lessonsMap);
        
        console.log('📄 Leçons chargées par chapitre');

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

  const loadSupabaseData = async () => {
    if (!supabaseOrgId || !programId) return;

    try {
      setLoading(true);

      // Charger le programme
      const { data: programs, error: progError } = await getPrograms(supabaseOrgId);
      
      if (progError) {
        console.error('Erreur chargement programme:', progError);
        setLoading(false);
        return;
      }

      const foundProgram = programs?.find(p => p.id === programId);
      
      if (!foundProgram) {
        console.error('Programme non trouvé');
        navigate('/admin/programs');
        return;
      }

      setProgram(foundProgram);

      // Charger les chapitres
      const { data: chaptersData, error: chaptersError } = await getChaptersByProgram(programId);
      
      if (chaptersError) {
        console.error('Erreur chargement chapitres:', chaptersError);
        setChapters([]); // Initialiser à vide en cas d'erreur
      } else {
        // Pour chaque chapitre, charger ses leçons
        const chaptersWithLessons = await Promise.all(
          (chaptersData || []).map(async (chapter) => {
            const { data: lessonsData, error: lessonsError } = await getLessonsByChapter(chapter.id);
            
            if (lessonsError) {
              console.error(`Erreur chargement leçons chapitre ${chapter.id}:`, lessonsError);
              return { ...chapter, lessons: [], lessonsCount: 0 };
            }
            
            return {
              ...chapter,
              lessons: lessonsData || [],
              lessonsCount: (lessonsData || []).length
            };
          })
        );
        
        setChapters(chaptersWithLessons);
        console.log('✅ Chapitres avec leçons chargés:', chaptersWithLessons);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const handleCreateLesson = async (chapterId) => {
    try {
      console.log('➕ Création d\'une nouvelle leçon pour le chapitre:', chapterId);
      
      // Compter les leçons existantes pour définir l'ordre
      const chapter = chapters.find(m => m.id === chapterId);
      const nextOrder = (chapter?.lessons?.length || 0) + 1;
      
      // Créer la nouvelle leçon
      const { data: newLesson, error } = await createLesson({
        chapter_id: chapterId,
        title: 'Nouvelle leçon',
        editor_data: [],
        order: nextOrder,
        duration_minutes: 10,
        hidden: false
      });
      
      if (error) {
        console.error('❌ Erreur création leçon:', error);
        alert('Erreur lors de la création de la leçon');
        return;
      }
      
      console.log('✅ Leçon créée:', newLesson.id);
      
      // Recharger les données
      await loadSupabaseData();
      
      // Naviguer vers l'éditeur
      navigate(`/admin/programs/${programId}/chapters/${chapterId}/lessons/${newLesson.id}/edit`);
      
    } catch (error) {
      console.error('❌ Exception création leçon:', error);
      alert('Erreur lors de la création de la leçon');
    }
  };

  const handleDragEnd = async (result, chapterId) => {
    if (!result.destination) return;
    
    const chapter = chapters.find(m => m.id === chapterId);
    if (!chapter || !chapter.lessons) return;
    
    const lessons = Array.from(chapter.lessons);
    const [removed] = lessons.splice(result.source.index, 1);
    lessons.splice(result.destination.index, 0, removed);
    
    // Mettre à jour les ordres
    const updatedLessons = lessons.map((lesson, index) => ({
      ...lesson,
      order: index + 1
    }));
    
    // Mettre à jour l'état local immédiatement
    setChapters(chapters.map(m => 
      m.id === chapterId ? { ...m, lessons: updatedLessons } : m
    ));
    
    // Sauvegarder dans Supabase
    try {
      await reorderLessons(updatedLessons.map(l => ({ id: l.id, order: l.order })));
      console.log('✅ Ordre des leçons mis à jour');
    } catch (error) {
      console.error('❌ Erreur réorganisation:', error);
      await loadSupabaseData(); // Recharger en cas d'erreur
    }
  };


  const handleOpenChapterModal = (chapter = null) => {
    setEditingChapter(chapter);
    setIsChapterModalOpen(true);
  };

  const handleSaveChapter = async (chapterData) => {
    try {
      if (editingChapter) {
        // Modification
        const { error } = await updateChapter(editingChapter.id, chapterData);
        if (error) throw error;
        console.log('✅ Chapitre modifié');
      } else {
        // Création
        const { error } = await createChapter({
          ...chapterData,
          program_id: programId
        });
        if (error) throw error;
        console.log('✅ Chapitre créé');
      }

      // Recharger les données
      await loadSupabaseData();
    } catch (error) {
      console.error('Erreur sauvegarde chapitre:', error);
      throw error;
    }
  };

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

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setProgram((prev) => (prev ? { ...prev, name: value } : prev));
  };

  const saveTitle = async () => {
    if (!program) return;
    try {
      const ref = organizationId
        ? doc(db, "organizations", organizationId, "programs", program.id)
        : doc(db, "programs", program.id);
      
      await updateDoc(ref, {
        name: program.name || "",
        updatedAt: Timestamp.now(),
      });
      
      console.log('✅ Titre du programme mis à jour');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du titre.");
    }
  };

  const handleToggleChapterHidden = async (chapterId, hidden) => {
    try {
      const ref = organizationId
        ? doc(db, "organizations", organizationId, "programs", program.id, "chapitres", chapterId)
        : doc(db, "programs", program.id, "chapitres", chapterId);
      
      await updateDoc(ref, {
        hidden: hidden,
        updatedAt: Timestamp.now(),
      });
      
      setChapters((prev) =>
        prev.map((c) => (c.id === chapterId ? { ...c, hidden: hidden } : c))
      );
      
      console.log('✅ Chapitre', hidden ? 'masqué' : 'affiché');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de la visibilité.");
    }
  };

  const handleToggleLessonHidden = async (chapterId, lessonId, hidden) => {
    try {
      const ref = organizationId
        ? doc(db, "organizations", organizationId, "programs", program.id, "chapitres", chapterId, "lessons", lessonId)
        : doc(db, "programs", program.id, "chapitres", chapterId, "lessons", lessonId);
      
      await updateDoc(ref, {
        hidden: hidden,
        updatedAt: Timestamp.now(),
      });
      
      setLessonsByChapter((prev) => ({
        ...prev,
        [chapterId]: (prev[chapterId] || []).map((l) =>
          l.id === lessonId ? { ...l, hidden: hidden } : l
        ),
      }));
      
      console.log('✅ Leçon', hidden ? 'masquée' : 'affichée');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de la visibilité.");
    }
  };

  const handleCategoryChange = async (e) => {
    if (!program) return;
    const newCategoryId = e.target.value || null;
    
    try {
      const ref = organizationId
        ? doc(db, "organizations", organizationId, "programs", program.id)
        : doc(db, "programs", program.id);
      
      await updateDoc(ref, {
        categoryId: newCategoryId,
        updatedAt: Timestamp.now(),
      });
      
      setProgram((prev) => (prev ? { ...prev, categoryId: newCategoryId } : prev));
      console.log('✅ Catégorie mise à jour:', newCategoryId || 'Aucune');
    } catch (err) {
      console.error(err);
      alert("Erreur lors du changement de catégorie.");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsCreatingCategory(true);
    
    try {
      const categoryRef = organizationId
        ? collection(db, 'organizations', organizationId, 'categories')
        : collection(db, 'categories');
        
      const docRef = await addDoc(categoryRef, {
        label: newCategoryName.trim(),
        organizationId,
        createdAt: Timestamp.now(),
        createdBy: user?.uid
      });
      
      // Ajouter la nouvelle catégorie à la liste
      const newCategory = {
        id: docRef.id,
        label: newCategoryName.trim()
      };
      setCategories([...categories, newCategory]);
      
      // Sélectionner automatiquement la nouvelle catégorie
      const ref = organizationId
        ? doc(db, "organizations", organizationId, "programs", program.id)
        : doc(db, "programs", program.id);
      
      await updateDoc(ref, {
        categoryId: docRef.id,
        updatedAt: Timestamp.now(),
      });
      
      setProgram((prev) => (prev ? { ...prev, categoryId: docRef.id } : prev));
      
      // Fermer la modal
      setShowCategoryModal(false);
      setNewCategoryName('');
      
      console.log('✅ Catégorie créée et assignée:', docRef.id);
      
    } catch (error) {
      console.error('❌ Erreur création catégorie:', error);
      alert("Erreur lors de la création de la catégorie.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // --------- Créations ---------

  const handleAddChapter = async () => {
    if (!program) return;
    const title = window.prompt("Nom du chapitre ?");
    if (!title) return;
    try {
      const nextOrder = (chapters.length || 0) + 1;
      
      const modulesCollection = organizationId
        ? collection(db, "organizations", organizationId, "programs", program.id, "chapitres")
        : collection(db, "programs", program.id, "chapitres");
      
      const ref = await addDoc(modulesCollection, {
        title,
        order: nextOrder,
        createdAt: Timestamp.now(),
      });
      
      console.log('✅ Chapitre créé:', ref.id);
      
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
    const lessonsCollection = organizationId
      ? collection(db, "organizations", organizationId, "programs", program.id, "chapitres", chapterId, "lessons")
      : collection(db, "programs", program.id, "chapitres", chapterId, "lessons");
    
    const ref = await addDoc(lessonsCollection, {
      title,
        order: nextOrder,
        editorData: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    );

    const newLesson = {
      id: ref.id,
      title,
      order: nextOrder,
    };

    setLessonsByChapter((prev) => ({
      ...prev,
      [chapterId]: [...currentLessons, newLesson].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      ),
    }));

    // ✅ On envoie aussi le titre à la page d’édition
    navigate(
      `/admin/programs/${program.id}/chapters/${chapterId}/lessons/${ref.id}/edit`,
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

  // Les Exercices / IA restent pour l'instant à plat, basés sur programId + chapterId
  const handleAddQuizForChapter = async (chapterId) => {
    if (!program) return;
    const title = window.prompt("Nom des exercices ?");
    if (!title) return;

    const existingForChapter = quizzes.filter((q) => q.chapterId === chapterId);
    const nextOrder = (existingForChapter.length || 0) + 1;

    try {
      const ref = await addDoc(collection(db, "quizzes"), {
        programId: program.id,
        chapterId: chapterId,
        title,
        order: nextOrder,
        createdAt: Timestamp.now(),
      });
      setQuizzes((prev) => [
        ...prev,
        {
          id: ref.id,
          programId: program.id,
          chapterId: chapterId,
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

    const existingForChapter = aiExercises.filter((e) => e.chapterId === chapterId);
    const nextOrder = (existingForChapter.length || 0) + 1;

    try {
      const ref = await addDoc(collection(db, "aiExercises"), {
        programId: program.id,
        chapterId: chapterId,
        title,
        order: nextOrder,
        createdAt: Timestamp.now(),
      });
      setAiExercises((prev) => [
        ...prev,
        {
          id: ref.id,
          programId: program.id,
          chapterId: chapterId,
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
      const ref = organizationId
        ? doc(db, "organizations", organizationId, "programs", program.id, "chapitres", chapter.id)
        : doc(db, "programs", program.id, "chapitres", chapter.id);
      
      await updateDoc(ref, {
        title: newTitle,
        updatedAt: Timestamp.now(),
      });
      
      setChapters((prev) =>
        prev.map((c) => (c.id === chapter.id ? { ...c, title: newTitle } : c))
      );
      
      console.log('✅ Chapitre renommé');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du chapitre.");
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm("Supprimer ce chapitre (les leçons associées resteront en base si tu ne les traites pas) ?")) return;
    
    try {
      if (useSupabase) {
        // Mode Supabase
        const { error } = await deleteChapter(chapterId);
        if (error) throw error;
        
        console.log('✅ Chapitre supprimé (Supabase)');
        await loadSupabaseData();
      } else {
        // Mode Firebase
        const ref = organizationId
          ? doc(db, "organizations", organizationId, "programs", program.id, "chapitres", chapterId)
          : doc(db, "programs", program.id, "chapitres", chapterId);
        
        await deleteDoc(ref);
        
        setChapters((prev) => prev.filter((c) => c.id !== chapterId));
        setLessonsByChapter((prev) => {
          const copy = { ...prev };
          delete copy[chapterId];
          return copy;
        });
        
        console.log('✅ Chapitre supprimé (Firebase)');
      }
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
      const ref = organizationId
        ? doc(db, "organizations", organizationId, "programs", program.id, "chapitres", chapterId, "lessons", lesson.id)
        : doc(db, "programs", program.id, "chapitres", chapterId, "lessons", lesson.id);
      
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
      
      console.log('✅ Leçon renommée');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de la leçon.");
    }
  };

  const handleDeleteLesson = async (chapterId, lessonId) => {
    if (!window.confirm("Supprimer cette leçon ?")) return;
    
    try {
      // Mode Firebase uniquement
      const ref = organizationId
        ? doc(db, "organizations", organizationId, "programs", program.id, "chapitres", chapterId, "lessons", lessonId)
        : doc(db, "programs", program.id, "chapitres", chapterId, "lessons", lessonId);
      
      await deleteDoc(ref);
      
      setLessonsByChapter((prev) => ({
        ...prev,
        [chapterId]: (prev[chapterId] || []).filter((l) => l.id !== lessonId),
      }));
      
      console.log('✅ Leçon supprimée (Firebase)');
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
        updated.map((c) => {
          const chapterRef = organizationId
            ? doc(db, "organizations", organizationId, "programs", program.id, "chapitres", c.id)
            : doc(db, "programs", program.id, "chapitres", c.id);
          
          return updateDoc(chapterRef, {
            order: c.order,
            updatedAt: Timestamp.now(),
          });
        })
      );
      console.log('✅ Ordre des chapitres sauvegardé');
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
              "chapitres",
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

      {/* Toggle Firebase/Supabase */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: useSupabase ? '#e7f3ff' : '#fff5e6',
        borderRadius: 8,
        marginBottom: 20,
        border: `2px solid ${useSupabase ? '#3b82f6' : '#f59e0b'}`
      }}>
        <div style={{ fontSize: 24 }}>
          {useSupabase ? '🔷' : '🔥'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
            Source : {useSupabase ? 'Supabase (PostgreSQL)' : 'Firebase (Firestore)'}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {useSupabase 
              ? `Organisation: ${supabaseOrgId || 'Non connecté'}` 
              : `Organisation: ${organizationId || 'Chargement...'}`
            }
          </div>
        </div>
        <button
          onClick={() => setUseSupabase(!useSupabase)}
          style={{
            padding: '8px 16px',
            background: useSupabase ? '#3b82f6' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14
          }}
        >
          → {useSupabase ? 'Firebase' : 'Supabase'}
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
          flexWrap: "wrap",
        }}
      >
        {/* Sélecteur Catégorie avec bouton créer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
              }}
            >
              <span style={{ fontSize: 16 }}>📁</span>
              <span>Catégorie :</span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                value={program.categoryId || ""}
                onChange={handleCategoryChange}
                style={{
                  padding: "6px 8px",
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                  minWidth: "150px",
                }}
              >
                <option value="">Sans catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryModal(true);
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid #d1d5db',
                  background: '#f3f4f6',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#3b82f6',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                title="Créer une nouvelle catégorie"
              >
                <span style={{ fontSize: 14 }}>+</span>
                <span>Créer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton ajouter chapitre */}
      <div style={{ marginBottom: 16 }}>
        {useSupabase ? (
          <button
            onClick={() => handleOpenChapterModal()}
            style={{
              marginBottom: 16,
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ➕ Ajouter un chapitre
          </button>
        ) : (
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
        )}
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
                (q) => q.chapterId === chapter.id
              );
              const aiForChapter = aiExercises.filter(
                (e) => e.chapterId === chapter.id
              );
              const expanded = expandedChapters.has(chapter.id);

              return (
                <>
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
                    
                    {/* Partie gauche : Drag + Nom du chapitre */}
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

                      {/* Bouton nom du chapitre avec chevron */}
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
                        {/* Icône du chapitre */}
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
                        
                        {/* Badge "Masqué" si hidden */}
                        {chapter.hidden && (
                          <span style={{
                            padding: '4px 10px',
                            background: '#FEE2E2',
                            border: '1px solid #FCA5A5',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#DC2626',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            flexShrink: 0
                          }}>
                            ❌ Masqué
                          </span>
                        )}
                        
                        {/* Nombre de leçons */}
                        <span style={{ 
                          fontSize: 14, 
                          color: '#94a3b8',
                          fontWeight: 400,
                          flexShrink: 0
                        }}>
                          ({useSupabase ? (chapter.lessonsCount || 0) : (lessons.length)})
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

                    {/* Toggle Visibilité Chapitre - Desktop uniquement */}
                    <button
                      type="button"
                      className="desktop-only"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleChapterHidden(chapter.id, !chapter.hidden);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: chapter.hidden ? '#FEE2E2' : '#DCFCE7',
                        border: `1px solid ${chapter.hidden ? '#FCA5A5' : '#86EFAC'}`,
                        borderRadius: 8,
                        marginLeft: 'auto',
                        marginRight: 12,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        color: chapter.hidden ? '#DC2626' : '#16A34A',
                        transition: 'all 0.2s',
                        boxShadow: chapter.hidden 
                          ? '0 2px 4px rgba(239, 68, 68, 0.15)' 
                          : '0 2px 4px rgba(16, 185, 129, 0.15)'
                      }}
                      onMouseEnter={(e) => {
                        if (chapter.hidden) {
                          e.currentTarget.style.background = '#10B981';
                          e.currentTarget.style.borderColor = '#10B981';
                          e.currentTarget.style.color = '#FFFFFF';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                        } else {
                          e.currentTarget.style.background = '#EF4444';
                          e.currentTarget.style.borderColor = '#EF4444';
                          e.currentTarget.style.color = '#FFFFFF';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = chapter.hidden ? '#FEE2E2' : '#DCFCE7';
                        e.currentTarget.style.borderColor = chapter.hidden ? '#FCA5A5' : '#86EFAC';
                        e.currentTarget.style.color = chapter.hidden ? '#DC2626' : '#16A34A';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = chapter.hidden 
                          ? '0 2px 4px rgba(239, 68, 68, 0.15)' 
                          : '0 2px 4px rgba(16, 185, 129, 0.15)';
                      }}
                      title={chapter.hidden ? 'Afficher le chapitre' : 'Masquer le chapitre'}
                    >
                      {chapter.hidden ? (
                        <>
                          <EyeOff size={14} strokeWidth={2.5} />
                          <span>MASQUÉ</span>
                        </>
                      ) : (
                        <>
                          <Eye size={14} strokeWidth={2.5} />
                          <span>EN LIGNE</span>
                        </>
                      )}
                    </button>

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
                            
                            if (useSupabase) {
                              // Mode Supabase: Créer une nouvelle leçon
                              handleCreateLesson(chapter.id);
                            } else {
                              // Mode Firebase: Ancien comportement
                              handleAddLessonForChapter(chapter.id);
                            }
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#eff6ff',
                            color: '#3b82f6',
                            border: '2px solid #3b82f6',
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 600,
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
                          title={useSupabase ? 'Créer une nouvelle leçon' : 'Ajouter une leçon'}
                        >
                          <FileText size={14} />
                          Leçon +
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
                          Exercices
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

                      {/* Icônes actions - Desktop (Supabase) */}
                      {useSupabase && (
                        <div 
                          className="desktop-only"
                          style={{
                            display: 'flex',
                            gap: 8,
                            flexShrink: 0
                          }}
                        >
                          {/* Bouton Crayon - Éditer le chapitre */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChapterModal(chapter);
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'white',
                              border: '2px solid #e5e7eb',
                              borderRadius: 8,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#eff6ff';
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.15)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            title="Éditer le chapitre"
                          >
                            <Pencil size={18} color="#6b7280" strokeWidth={2} />
                          </button>

                          {/* Bouton Poubelle - Supprimer le chapitre */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChapter(chapter.id);
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'white',
                              border: '2px solid #fee2e2',
                              borderRadius: 8,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fef2f2';
                              e.currentTarget.style.borderColor = '#ef4444';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.15)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#fee2e2';
                              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            title="Supprimer le chapitre"
                          >
                            <Trash2 size={18} color="#ef4444" strokeWidth={2} />
                          </button>
                        </div>
                      )}

                      {/* Icônes actions - Desktop (Firebase uniquement) */}
                      {!useSupabase && (
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
                            title="Renommer le chapitre"
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
                            title="Supprimer le chapitre"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Liste des leçons (toujours visible en mode Supabase) */}
                  {useSupabase && chapter.lessons && chapter.lessons.length > 0 && (
                    <div style={{
                      marginTop: 24,
                      paddingTop: 16,
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: 12,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        📖 LEÇONS ({chapter.lessons.length})
                      </div>
                      
                      <DragDropContext onDragEnd={(result) => handleDragEnd(result, chapter.id)}>
                        <Droppable droppableId={chapter.id}>
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                            >
                              {chapter.lessons
                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                .map((lesson, lessonIndex) => (
                                  <Draggable
                                    key={lesson.id}
                                    draggableId={lesson.id}
                                    index={lessonIndex}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        style={{
                                          ...provided.draggableProps.style,
                                          padding: '12px 16px',
                                          background: snapshot.isDragging ? '#f0f9ff' : 'white',
                                          border: `1px solid ${snapshot.isDragging ? '#3b82f6' : '#e5e7eb'}`,
                                          borderRadius: 8,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 12,
                                          transition: 'background 0.2s'
                                        }}
                                      >
                                        {/* Drag Handle */}
                                        <div
                                          {...provided.dragHandleProps}
                                          style={{
                                            cursor: 'grab',
                                            color: '#9ca3af',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: 18
                                          }}
                                        >
                                          ⋮⋮
                                        </div>
                                        
                                        {/* Icône Leçon */}
                                        <div style={{
                                          width: 32,
                                          height: 32,
                                          background: '#eff6ff',
                                          borderRadius: 6,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                          fontSize: 16
                                        }}>
                                          📖
                                        </div>
                                        
                                        {/* Titre */}
                                        <div style={{ flex: 1 }}>
                                          <div style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: '#1f2937'
                                          }}>
                                            {lesson.title}
                                          </div>
                                        </div>
                                        
                                        {/* Boutons d'action */}
                                        <button
                                          onClick={() => navigate(`/admin/programs/${programId}/chapters/${chapter.id}/lessons/${lesson.id}/edit`)}
                                          style={{
                                            width: 32,
                                            height: 32,
                                            padding: 0,
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 6,
                                            transition: 'background 0.2s'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                          title="Éditer"
                                        >
                                          <Pencil size={16} color="#6b7280" />
                                        </button>
                                        
                                        <button
                                          onClick={async () => {
                                            try {
                                              console.log('🔄 Duplication de la leçon:', lesson.id);
                                              
                                              const { data: originalLesson, error: fetchError } = await getLesson(lesson.id);
                                              if (fetchError) throw fetchError;
                                              
                                              const { data: duplicatedLesson, error: createError } = await createLesson({
                                                chapter_id: chapter.id,
                                                title: `${originalLesson.title} (copie)`,
                                                editor_data: originalLesson.editor_data,
                                                order: (chapter.lessons.length || 0) + 1,
                                                duration_minutes: originalLesson.duration_minutes,
                                                hidden: originalLesson.hidden
                                              });
                                              
                                              if (createError) throw createError;
                                              
                                              console.log('✅ Leçon dupliquée:', duplicatedLesson.id);
                                              await loadSupabaseData();
                                              
                                            } catch (error) {
                                              console.error('❌ Erreur duplication:', error);
                                              alert('Erreur lors de la duplication de la leçon');
                                            }
                                          }}
                                          style={{
                                            width: 32,
                                            height: 32,
                                            padding: 0,
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 6,
                                            transition: 'background 0.2s'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                          title="Dupliquer"
                                        >
                                          <Copy size={16} color="#6b7280" />
                                        </button>
                                        
                                        <button
                                          onClick={async () => {
                                            if (window.confirm('Supprimer cette leçon ?')) {
                                              try {
                                                const { error } = await deleteLesson(lesson.id);
                                                if (error) throw error;
                                                console.log('✅ Leçon supprimée');
                                                await loadSupabaseData();
                                              } catch (error) {
                                                console.error('❌ Erreur suppression:', error);
                                                alert('Erreur lors de la suppression');
                                              }
                                            }
                                          }}
                                          style={{
                                            width: 32,
                                            height: 32,
                                            padding: 0,
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 6,
                                            transition: 'background 0.2s'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                          title="Supprimer"
                                        >
                                          <Trash2 size={16} color="#ef4444" />
                                        </button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  )}

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
                                  
                                  {/* Badge "Masquée" si hidden */}
                                  {l.hidden && (
                                    <span style={{
                                      padding: '3px 8px',
                                      background: '#FEE2E2',
                                      border: '1px solid #FCA5A5',
                                      borderRadius: 4,
                                      fontSize: 10,
                                      fontWeight: 600,
                                      color: '#DC2626',
                                      marginLeft: 8
                                    }}>
                                      MASQUÉE
                                    </span>
                                  )}
                                </div>

                                {/* ACTIONS - TAILLES CORRIGÉES */}
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                  }}
                                >
                                  {/* Bouton Toggle Visibilité */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleLessonHidden(chapter.id, l.id, !l.hidden);
                                    }}
                                    title={l.hidden ? "Afficher la leçon" : "Masquer la leçon"}
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      border: "none",
                                      background: l.hidden ? "#FEE2E2" : "#F9FAFB",
                                      borderRadius: "8px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                      color: l.hidden ? "#DC2626" : "#6B7280",
                                      flexShrink: 0,
                                      padding: 0,
                                    }}
                                    onMouseEnter={(e) => {
                                      if (l.hidden) {
                                        e.currentTarget.style.background = "#10B981";
                                        e.currentTarget.style.color = "#FFFFFF";
                                      } else {
                                        e.currentTarget.style.background = "#EF4444";
                                        e.currentTarget.style.color = "#FFFFFF";
                                      }
                                      e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                                      e.currentTarget.style.boxShadow = l.hidden 
                                        ? "0 4px 8px rgba(16, 185, 129, 0.3)"
                                        : "0 4px 8px rgba(239, 68, 68, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = l.hidden ? "#FEE2E2" : "#F9FAFB";
                                      e.currentTarget.style.color = l.hidden ? "#DC2626" : "#6B7280";
                                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    {l.hidden ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                                  </button>

                                  {/* Bouton Modifier (éditeur) */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/admin/programs/${program.id}/chapters/${chapter.id}/lessons/${l.id}/edit`
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

                </>
            );})}
          </div>

      {/* Modal création catégorie */}
      {showCategoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20
          }}
          onClick={() => {
            setShowCategoryModal(false);
            setNewCategoryName('');
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 450,
              background: 'white',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#111827',
              marginBottom: 8
            }}>
              Nouvelle catégorie
            </h3>
            <p style={{
              fontSize: 14,
              color: '#6B7280',
              marginBottom: 20,
              lineHeight: 1.5
            }}>
              Créez une nouvelle catégorie pour organiser vos programmes.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6
              }}>
                Nom de la catégorie *
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Sécurité routière"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 24
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  background: '#F9FAFB',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || isCreatingCategory}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: !newCategoryName.trim() || isCreatingCategory ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: !newCategoryName.trim() || isCreatingCategory ? 0.7 : 1
                }}
              >
                {isCreatingCategory ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chapitre */}
      <ChapterModal
        isOpen={isChapterModalOpen}
        onClose={() => {
          setIsChapterModalOpen(false);
          setEditingChapter(null);
        }}
        onSave={handleSaveChapter}
        chapter={editingChapter}
        defaultOrder={(chapters?.length || 0) + 1}
      />
    </div>
  );
}
