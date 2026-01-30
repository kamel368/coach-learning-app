// src/pages/AdminPrograms.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { 
  Plus, 
  Eye,
  EyeOff,
  Edit2, 
  Trash2, 
  BookOpen, 
  Filter,
  X,
  Briefcase,
  Folder,
  GraduationCap,
  FileText,
  Settings,
  TrendingUp,
  Award,
  Target,
  Laptop,
  ListTree,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getPrograms as getSupabasePrograms } from '../services/supabase/programs';
import { getCategories as getSupabaseCategories } from '../services/supabase/categories';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

// Labels de statut (temporaire - sera remplacé par badges Eye/EyeOff)
const statusLabels = {
  published: "Publié",
  disabled: "Désactivé",
  draft: "Brouillon",
};

export default function AdminPrograms() {
  const navigate = useNavigate();
  const { user, organizationId } = useAuth();

  // ✅ États pour le toggle Firebase/Supabase
  const [useSupabase, setUseSupabase] = useState(false); // false = Firebase, true = Supabase
  const { organizationId: supabaseOrgId } = useSupabaseAuth();

  const [programs, setPrograms] = useState([]);
  const [categories, setCategories] = useState([]); // catégories
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");

  // Popup (création uniquement)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState(false); // false = non publié, true = publié
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  
  // Modal création catégorie
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Hover state pour les boutons
  const [hoveredButton, setHoveredButton] = useState(null);

  // Filtres
  const [sortBy, setSortBy] = useState("default"); // default | name | metier | status | createdAt | updatedAt
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // Compteurs de chapitres
  const [chaptersCount, setChaptersCount] = useState({}); // { programId: count }

  // Fonction pour compter les chapitres d'un programme
  const fetchChaptersCount = async (programId) => {
    try {
      const modulesRef = organizationId
        ? collection(db, "organizations", organizationId, "programs", programId, "chapitres")
        : collection(db, "programs", programId, "chapitres");
      const modulesSnap = await getDocs(modulesRef);
      return modulesSnap.size; // Nombre de documents
    } catch (err) {
      console.error(`Erreur comptage chapitres pour ${programId}:`, err);
      return 0;
    }
  };

  // Charger programmes + rôles métier + compteurs chapitres
  useEffect(() => {
    if (useSupabase) {
      // Mode Supabase : attendre supabaseOrgId
      if (supabaseOrgId) {
        fetchData();
      }
    } else {
      // Mode Firebase : attendre organizationId
      if (organizationId) {
        fetchData();
      }
    }
  }, [organizationId, supabaseOrgId, useSupabase]); // Ajouter useSupabase aux dépendances
    
  const fetchData = async () => {
    try {
      setLoadingList(true);
      setError("");

      // ========== MODE SUPABASE ==========
      if (useSupabase) {
        console.log('🔷 [AdminPrograms] Chargement depuis SUPABASE');
        
        if (!supabaseOrgId) {
          console.error('❌ Pas d\'organization_id Supabase');
          setError("Organization ID manquant (Supabase)");
          setLoadingList(false);
          return;
        }

        // Charger programmes depuis Supabase
        const { data: supabasePrograms, error: progError } = await getSupabasePrograms(supabaseOrgId);
        
        if (progError) {
          console.error('❌ Erreur Supabase programmes:', progError);
          setError("Erreur lors du chargement des programmes (Supabase)");
          setLoadingList(false);
          return;
        }

        // Transformer les données Supabase pour correspondre au format attendu
        const transformedPrograms = (supabasePrograms || []).map(prog => ({
          id: prog.id,
          name: prog.title, // Supabase utilise "title", Firebase utilise "name"
          description: prog.description,
          categoryId: prog.category_id,
          status: prog.hidden ? 'draft' : 'published', // Approximation
          hidden: prog.hidden,
          createdAt: { seconds: new Date(prog.created_at).getTime() / 1000 },
          updatedAt: { seconds: new Date(prog.updated_at).getTime() / 1000 }
        }));

        setPrograms(transformedPrograms);
        console.log('✅ Programmes Supabase chargés:', transformedPrograms.length);

        // Charger catégories depuis Supabase
        const { data: supabaseCategories, error: catError } = await getSupabaseCategories(supabaseOrgId);
        
        if (catError) {
          console.error('❌ Erreur Supabase catégories:', catError);
        } else {
          const transformedCategories = (supabaseCategories || []).map(cat => ({
            id: cat.id,
            name: cat.name,
            label: cat.name, // Alias pour compatibilité
            description: cat.description,
            color: cat.color
          }));
          setCategories(transformedCategories);
          console.log('✅ Catégories Supabase chargées:', transformedCategories.length);
        }

        // Compter les chapitres (on garde Firebase pour l'instant car pas encore migré)
        const countsPromises = transformedPrograms.map(async (prog) => {
          const count = await fetchChaptersCount(prog.id);
          return { id: prog.id, count };
        });
        
        const countsResults = await Promise.all(countsPromises);
        const countsMap = countsResults.reduce((acc, { id, count }) => {
          acc[id] = count;
          return acc;
        }, {});
        
        setChaptersCount(countsMap);

      } 
      // ========== MODE FIREBASE (code existant) ==========
      else {
        console.log('🔥 [AdminPrograms] Chargement depuis FIREBASE');
        
        if (!organizationId) {
          console.error('❌ Pas d\'organizationId Firebase');
          setLoadingList(false);
          return;
        }

        // CODE FIREBASE EXISTANT (ne pas modifier)
        let progSnap;
        if (organizationId) {
          // Nouvelle structure : /organizations/{orgId}/programs
          progSnap = await getDocs(collection(db, "organizations", organizationId, "programs"));
          console.log('📚 Programmes chargés depuis /organizations/' + organizationId + '/programs');
        } else {
          // Fallback ancienne structure (ne devrait plus arriver)
          progSnap = await getDocs(collection(db, "programs"));
          console.log('⚠️ Fallback: Programmes chargés depuis /programs (pas d\'organizationId)');
        }
        
        const progList = progSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setPrograms(progList);

        // Charger les catégories depuis l'organisation de l'utilisateur
        let catSnap;
        if (organizationId) {
          catSnap = await getDocs(collection(db, "organizations", organizationId, "categories"));
          console.log('📂 Catégories depuis /organizations/' + organizationId + '/categories');
        } else {
          catSnap = await getDocs(collection(db, "categories"));
          console.log('⚠️ Fallback: Catégories depuis /categories');
        }
        
        const catList = catSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setCategories(catList);

        // Charger les compteurs de chapitres
        const countsPromises = progList.map(async (prog) => {
          const count = await fetchChaptersCount(prog.id);
          return { id: prog.id, count };
        });
        
        const countsResults = await Promise.all(countsPromises);
        const countsMap = countsResults.reduce((acc, { id, count }) => {
          acc[id] = count;
          return acc;
        }, {});
        
        setChaptersCount(countsMap);
      }

    } catch (err) {
      console.error('❌ Erreur fetchData:', err);
      setError("Erreur lors du chargement: " + err.message);
    } finally {
      setLoadingList(false);
    }
  };

  const getCategoryLabel = (id) => {
    if (!id) return "Sans catégorie";
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.label : "Catégorie inconnue";
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    try {
      const date =
        ts instanceof Timestamp ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // Helper pour récupérer l'icône Lucide du métier
  const getMetierIcon = (categoryLabel) => {
    const iconMap = {
      "Moniteur": Laptop,
      "Moniteur Auto-École": Laptop,
      "Secrétariat": FileText,
      "Commercial": Briefcase,
      "Enseignant": GraduationCap,
      "Direction": Target,
      "Laveur": Settings,
      "Laveur de Voiture": Settings,
      "Manager": Award,
      "Vendeur": TrendingUp,
    };
    return iconMap[categoryLabel] || Folder;
  };

  // Couleurs pour les dégradés des icônes métier
  const getMetierColor = (categoryLabel) => {
    const colorMap = {
      "Moniteur": "#3B82F6",
      "Moniteur Auto-École": "#3B82F6",
      "Secrétariat": "#8B5CF6",
      "Commercial": "#10B981",
      "Enseignant": "#F59E0B",
      "Direction": "#EF4444",
      "Laveur": "#06B6D4",
      "Laveur de Voiture": "#06B6D4",
      "Manager": "#EC4899",
      "Vendeur": "#14B8A6",
    };
    return colorMap[categoryLabel] || "#6B7280";
  };

  // Fonction de tri
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  // Ouvrir popup création
  const handleAdd = () => {
    setName("");
    setDescription("");
    setCategoryId("");
    setStatus("draft");
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setName("");
    setDescription("");
    setCategoryId("");
    setStatus("draft");
    setFormError("");
  };
  
  // Créer une nouvelle catégorie
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
      setCategoryId(docRef.id);
      
      // Fermer la modal
      setShowCategoryModal(false);
      setNewCategoryName('');
      
      console.log('✅ Catégorie créée avec succès:', docRef.id);
      
    } catch (error) {
      console.error('❌ Erreur création catégorie:', error);
      setFormError("Erreur lors de la création de la catégorie.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Création + redirection vers page détail
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Le nom du programme est obligatoire.");
      return;
    }
    // ✅ categoryId n'est plus obligatoire

    try {
      setSaving(true);
      const now = Timestamp.now();
      
      // Créer dans l'organisation de l'utilisateur
      const programsCollection = organizationId 
        ? collection(db, "organizations", organizationId, "programs")
        : collection(db, "programs");
      
      const ref = await addDoc(programsCollection, {
        name,
        description,
        categoryId: categoryId || null, // ✅ null si pas de catégorie
        status: status || "draft",
        createdAt: now,
        updatedAt: now,
      });
      
      console.log('✅ Programme créé:', ref.id, 'dans', organizationId ? `/organizations/${organizationId}/programs` : '/programs');

      const newProgram = {
        id: ref.id,
        name,
        description,
        categoryId: categoryId || null,
        status: status || "draft",
        createdAt: now,
        updatedAt: now,
      };

      setPrograms((prev) => [...prev, newProgram]);
      
      // Initialiser le compteur de chapitres à 0 pour le nouveau programme
      setChaptersCount((prev) => ({ ...prev, [ref.id]: 0 }));

      closeModal();

      // redirection vers la page de détail
      navigate(`/admin/programs/${ref.id}`);
    } catch (err) {
      console.error(err);
      setFormError("Erreur lors de l'enregistrement du programme.");
    } finally {
      setSaving(false);
    }
  };

  // Icône modifier => page de détail
  const handleEditRedirect = (program) => {
    navigate(`/admin/programs/${program.id}`);
  };

  // Suppression
  const handleDelete = async (program, e) => {
    e.stopPropagation();
    const ok = window.confirm(
      `Supprimer le programme "${program.name}" ? Cette action est définitive.`
    );
    if (!ok) return;

    try {
      // Supprimer depuis l'organisation de l'utilisateur
      const programDocRef = organizationId
        ? doc(db, "organizations", organizationId, "programs", program.id)
        : doc(db, "programs", program.id);
        
      await deleteDoc(programDocRef);
      setPrograms((prev) => prev.filter((p) => p.id !== program.id));
      console.log('✅ Programme supprimé:', program.id);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression du programme.");
    }
  };

  // Toggle visibilité
  const handleToggleHidden = async (program) => {
    const newHidden = !program.hidden;
    
    try {
      const programDocRef = organizationId
        ? doc(db, "organizations", organizationId, "programs", program.id)
        : doc(db, "programs", program.id);
        
      await updateDoc(programDocRef, {
        hidden: newHidden,
        updatedAt: Timestamp.now()
      });
      
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === program.id ? { ...p, hidden: newHidden } : p
        )
      );
      
      console.log(`✅ Programme ${newHidden ? 'masqué' : 'affiché'}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de la visibilité.");
    }
  };

  // Filtres + tri
  const filteredPrograms = programs.filter((p) => {
    if (filterStatus === "visible" && p.hidden === true) {
      return false;
    }
    if (filterStatus === "hidden" && p.hidden !== true) {
      return false;
    }
    if (filterCategory !== "all" && p.categoryId !== filterCategory) {
      return false;
    }
    return true;
  });

  const sortedPrograms = [...filteredPrograms].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = (a.name || "").localeCompare(b.name || "");
        break;
      case "metier":
        comparison = getCategoryLabel(a.categoryId).localeCompare(getCategoryLabel(b.categoryId));
        break;
      case "status":
        // Tri : en ligne d'abord, puis masqués
        comparison = (a.hidden ? 1 : 0) - (b.hidden ? 1 : 0);
        break;
      case "createdAt":
        comparison = (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        break;
      case "updatedAt":
        comparison = (a.updatedAt?.seconds || 0) - (b.updatedAt?.seconds || 0);
        break;
      default:
        return 0;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh", 
      background: "#F9FAFB", 
      width: "100%", 
      maxWidth: "100%", 
      boxSizing: "border-box", 
      overflow: "hidden" 
    }}>
      <style>
        {`
          /* ========================================
             RESET & BASE - SYSTÈME ADAPTATIF
             ======================================== */

          * {
            box-sizing: border-box;
          }

          /* Table Card Container */
          .table-card {
            background: white;
            border-radius: 16px;
            overflow-x: auto; /* ✅ Scroll horizontal par défaut */
            overflow-y: visible;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            -webkit-overflow-scrolling: touch; /* Smooth scroll iOS */
            position: relative;
          }
          
          /* ✅ Indicateur de scroll - Ombre à droite */
          .table-card::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 10px; /* Éviter de couvrir le scrollbar */
            width: 30px;
            background: linear-gradient(to left, rgba(0, 0, 0, 0.1), transparent);
            pointer-events: none;
            opacity: 1;
            transition: opacity 0.3s ease;
          }

          /* Table Base - ADAPTATIF */
          .programs-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: auto;
            min-width: clamp(700px, 80vw, 900px); /* S'adapte à la largeur viewport */
          }

          /* En-têtes */
          .programs-table thead {
            background: linear-gradient(to bottom, #F9FAFB, white);
            border-bottom: 2px solid #E5E7EB;
          }

          .programs-table th {
            padding: clamp(0.75rem, 2vw, 1.25rem) clamp(2rem, 4vw, 3rem) clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 2.5vw, 1.5rem);
            text-align: left;
            font-weight: 600;
            font-size: clamp(0.7rem, 1.5vw, 0.8rem);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6B7280;
            cursor: pointer;
            user-select: none;
            transition: all 0.2s ease;
            position: relative;
            white-space: nowrap;
          }

          .programs-table th:hover {
            background: rgba(79, 127, 255, 0.05);
            color: #4F7FFF;
          }

          /* Icône de tri - SVG inline */
          .programs-table th.sortable::after {
            content: '';
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            width: 14px;
            height: 14px;
            opacity: 0.3;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 16 4 4 4-4'/%3E%3Cpath d='m15 8 4-4 4 4'/%3E%3C/svg%3E");
            background-size: contain;
            background-repeat: no-repeat;
          }

          .programs-table th.sortable:hover::after {
            opacity: 0.7;
          }

          .programs-table th.sortable.active::after {
            opacity: 1;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%234F7FFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 16 4 4 4-4'/%3E%3C/svg%3E");
          }

          .programs-table th.sortable.active.desc::after {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%234F7FFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m15 8 4-4 4 4'/%3E%3C/svg%3E");
          }

          /* Colonne Actions sans tri */
          .programs-table th:last-child {
            padding-right: 1.5rem;
            cursor: default;
          }

          .programs-table th:last-child::after {
            display: none;
          }

          /* Lignes du tableau */
          .programs-table tbody tr {
            border-bottom: 1px solid #F3F4F6;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          }

          .programs-table tbody tr:hover {
            background: linear-gradient(to right, rgba(79, 127, 255, 0.03), rgba(79, 127, 255, 0.01));
            box-shadow: inset 0 0 0 2px rgba(79, 127, 255, 0.1);
            transform: scale(1.002);
          }

          /* Cellules - Force sur une ligne - ADAPTATIF */
          .programs-table td {
            padding: clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 2.5vw, 1.5rem);
            font-size: clamp(0.75rem, 1.5vw, 0.9rem);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            vertical-align: middle;
          }

          /* Programme (nom + icône) - Une ligne - ADAPTATIF */
          .program-name {
            display: flex;
            align-items: center;
            gap: clamp(0.5rem, 1.5vw, 0.875rem);
            min-width: clamp(150px, 20vw, 250px);
            max-width: clamp(200px, 30vw, 400px);
          }

          .program-icon {
            width: clamp(28px, 4vw, 42px);
            height: clamp(28px, 4vw, 42px);
            min-width: clamp(28px, 4vw, 42px);
            border-radius: clamp(6px, 1.5vw, 10px);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.3s ease;
          }

          .program-icon svg {
            width: clamp(14px, 2.5vw, 22px);
            height: clamp(14px, 2.5vw, 22px);
          }

          .program-details {
            flex: 1;
            min-width: 0; /* Important pour text-overflow */
            overflow: hidden;
          }

          .program-details h3 {
            font-size: clamp(0.75rem, 1.5vw, 0.95rem);
            font-weight: 600;
            color: #111827;
            margin: 0;
            
            /* ✅ ELLIPSIS FORCÉ */
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
            
            /* ✅ LARGEUR MAX PAR DÉFAUT */
            max-width: 200px;
          }

          .program-details p {
            font-size: clamp(0.7rem, 1.2vw, 0.8rem);
            color: #6B7280;
            margin: 0.25rem 0 0 0;
            
            /* ✅ ELLIPSIS FORCÉ */
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
            
            /* ✅ LARGEUR MAX PAR DÉFAUT */
            max-width: 200px;
          }

          /* Métier Tag - Une ligne - ADAPTATIF */
          .metier-tag {
            display: inline-flex;
            align-items: center;
            gap: clamp(0.3rem, 1vw, 0.5rem);
            padding: clamp(0.35rem, 1vw, 0.5rem) clamp(0.5rem, 1.5vw, 0.875rem);
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            font-size: clamp(0.7rem, 1.3vw, 0.85rem);
            color: #374151;
            white-space: nowrap;
            min-width: fit-content;
          }

          .metier-tag svg {
            width: clamp(12px, 2vw, 16px);
            height: clamp(12px, 2vw, 16px);
            flex-shrink: 0;
          }

          /* Status Badge - Une ligne - ADAPTATIF */
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: clamp(0.25rem, 0.8vw, 0.375rem);
            padding: clamp(0.35rem, 1vw, 0.5rem) clamp(0.6rem, 1.5vw, 1rem);
            border-radius: 8px;
            font-size: clamp(0.65rem, 1.2vw, 0.8rem);
            font-weight: 600;
            white-space: nowrap;
            min-width: fit-content;
          }

          .status-badge.published {
            background: rgba(16, 185, 129, 0.1);
            color: #10B981;
          }

          .status-badge.draft {
            background: rgba(245, 158, 11, 0.1);
            color: #F59E0B;
          }

          .status-badge.disabled {
            background: rgba(239, 68, 68, 0.1);
            color: #EF4444;
          }

          .status-dot {
            width: clamp(4px, 1vw, 6px);
            height: clamp(4px, 1vw, 6px);
            border-radius: 50%;
            background: currentColor;
            flex-shrink: 0;
          }

          /* Date - Une ligne - ADAPTATIF */
          .date-cell {
            font-size: clamp(0.7rem, 1.3vw, 0.875rem);
            color: #374151;
            font-weight: 500;
            white-space: nowrap;
            min-width: clamp(70px, 10vw, 90px);
          }

          /* ACTIONS - TOUJOURS VISIBLES */
          .actions {
            display: flex;
            gap: 0.5rem;
            opacity: 1;
            align-items: center;
            justify-content: flex-end;
          }

          .action-btn {
            width: clamp(28px, 4vw, 40px);
            height: clamp(28px, 4vw, 40px);
            min-width: clamp(28px, 4vw, 40px);
            border: none;
            background: #F9FAFB;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #6B7280;
            flex-shrink: 0;
          }

          /* FORCER l'affichage des icônes SVG - ADAPTATIF */
          .action-btn svg {
            width: clamp(14px, 2.5vw, 20px) !important;
            height: clamp(14px, 2.5vw, 20px) !important;
            min-width: clamp(14px, 2.5vw, 20px) !important;
            min-height: clamp(14px, 2.5vw, 20px) !important;
            display: block !important;
            stroke: currentColor !important;
            fill: none !important;
            stroke-width: 2 !important;
          }

          .action-btn:hover {
            transform: translateY(-2px) scale(1.05);
          }

          .action-btn:not(.edit):not(.delete):hover {
            background: #4F7FFF !important;
            color: white !important;
            box-shadow: 0 4px 8px rgba(79, 127, 255, 0.3);
          }

          .action-btn.edit:hover {
            background: #10B981;
            color: white;
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
          }

          .action-btn.delete:hover {
            background: #EF4444;
            color: white;
            box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
          }

          /* Styles pour les filtres */
          .filters-container {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 24px;
            padding: 20px;
            background: #FFFFFF;
            border-radius: 12px;
            border: 1px solid #E5E7EB;
          }

          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .filter-label {
            font-size: 12px;
            font-weight: 600;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .filter-select {
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #E5E7EB;
            background-color: #F9FAFB;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
            cursor: pointer;
          }

          .filter-select:focus {
            border-color: #3B82F6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          /* Header */
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 32px;
            flex-wrap: wrap;
            gap: 16px;
          }

          .header-title {
            font-size: 32px;
            font-weight: 700;
            color: #111827;
            margin: 0;
          }

          .header-subtitle {
            font-size: 14px;
            color: #6B7280;
            margin-top: 4px;
          }

          .add-button {
            padding: 12px 24px;
            background: linear-gradient(135deg, #3B82F6, #60A5FA);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .add-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          }

          /* Modal styles */
          .modal-backdrop {
            position: fixed;
            inset: 0;
            background-color: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50;
            padding: 20px;
          }

          .modal {
            position: relative;
            z-index: 51;
            width: 100%;
            max-width: 500px;
            background-color: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-title {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
          }

          .modal-subtitle {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 20px;
            line-height: 1.5;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
          }

          .form-input, .form-textarea, .form-select {
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid #E5E7EB;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
            box-sizing: border-box;
          }

          .form-input:focus, .form-textarea:focus, .form-select:focus {
            border-color: #3B82F6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-textarea {
            resize: vertical;
            font-family: inherit;
          }

          .form-select {
            background-color: white;
            cursor: pointer;
          }

          .error-message {
            padding: 12px;
            background: #FEE2E2;
            border: 1px solid #FCA5A5;
            border-radius: 8px;
            color: #DC2626;
            font-size: 13px;
            margin-bottom: 16px;
          }

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 24px;
          }

          .cancel-button {
            padding: 10px 20px;
            border-radius: 8px;
            border: 1px solid #E5E7EB;
            background-color: #F9FAFB;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .submit-button {
            padding: 10px 24px;
            border-radius: 8px;
            border: none;
            background: linear-gradient(135deg, #3B82F6, #60A5FA);
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .submit-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          /* ========================================
             RESPONSIVE - BREAKPOINTS AJUSTÉS
             ======================================== */

          /* ========================================
             MACBOOK PRO 13" - OPTIMISATION ULTRA-COMPACTE
             Objectif : Tout le tableau visible sans scroll horizontal
             ======================================== */
          @media (min-width: 1280px) and (max-width: 1440px) {
            .admin-programs-container {
              padding: 1rem; /* ✅ Réduire padding global */
            }
            
            /* ✅ PAS DE SCROLL - TOUT VISIBLE */
            .table-card {
              overflow-x: visible;
            }
            
            /* ✅ TABLEAU SANS MIN-WIDTH - S'ADAPTE À L'ÉCRAN */
            .programs-table {
              min-width: auto;
              width: 100%;
              table-layout: fixed; /* ✅ Colonnes de largeur fixe */
            }
            
            /* ✅ CACHER DESCRIPTIONS PROGRAMME */
            .program-details p {
              display: none !important;
            }
            
            /* ✅ COLONNE PROGRAMME - ULTRA COMPACT */
            .program-name {
              min-width: 140px;
              max-width: 140px;
              gap: 0.5rem;
            }
            
            .program-icon {
              width: 32px;
              height: 32px;
              min-width: 32px;
            }
            
            .program-icon svg {
              width: 16px;
              height: 16px;
            }
            
            .program-details h3 {
              font-size: 0.8rem;
              max-width: 100px;
              line-height: 1.3;
            }
            
            /* ✅ COLONNE MÉTIER - COMPACT */
            .metier-tag {
              font-size: 0.75rem;
              padding: 0.35rem 0.6rem;
              gap: 0.35rem;
            }
            
            .metier-tag svg {
              width: 13px;
              height: 13px;
            }
            
            /* ✅ COLONNE STATUT - COMPACT */
            .status-badge {
              font-size: 0.7rem;
              padding: 0.35rem 0.7rem;
              gap: 0.25rem;
            }
            
            .status-dot {
              width: 5px;
              height: 5px;
            }
            
            /* ✅ COLONNE DATE - COMPACT */
            .date-cell {
              font-size: 0.75rem;
              min-width: 85px;
            }
            
            /* ✅ COLONNE CHAPITRES - TRÈS COMPACT */
            .chapters-cell {
              font-size: 0.75rem;
              gap: 4px;
            }
            
            .chapters-icon {
              width: 22px;
              height: 22px;
              min-width: 22px;
            }
            
            .chapters-icon svg {
              width: 11px;
              height: 11px;
            }
            
            /* ✅ COLONNE ACTIONS - MINI BOUTONS */
            .actions {
              gap: 0.35rem;
            }
            
            .action-btn {
              width: 30px;
              height: 30px;
              min-width: 30px;
            }
            
            .action-btn svg {
              width: 15px !important;
              height: 15px !important;
            }
            
            /* ✅ PADDING CELLULES ULTRA-RÉDUIT */
            .programs-table th,
            .programs-table td {
              padding: 0.75rem 0.65rem;
            }
            
            /* ✅ EN-TÊTES PLUS COMPACTS */
            .programs-table th {
              font-size: 0.65rem;
              padding-right: 1.75rem; /* Espace pour icône tri */
            }
            
            /* ✅ LARGEURS FIXES DES COLONNES (table-layout: fixed) */
            .programs-table th:nth-child(1), /* Programme */
            .programs-table td:nth-child(1) {
              width: 28%;
            }
            
            .programs-table th:nth-child(2), /* Métier */
            .programs-table td:nth-child(2) {
              width: 18%;
            }
            
            .programs-table th:nth-child(3), /* Statut */
            .programs-table td:nth-child(3) {
              width: 13%;
            }
            
            .programs-table th:nth-child(4), /* Créé le */
            .programs-table td:nth-child(4) {
              width: 12%;
            }
            
            .programs-table th:nth-child(5), /* Chapitres */
            .programs-table td:nth-child(5) {
              width: 14%;
            }
            
            .programs-table th:nth-child(6), /* Actions */
            .programs-table td:nth-child(6) {
              width: 15%;
            }
            
            /* ✅ HEADER PLUS COMPACT */
            .header-title {
              font-size: 1.5rem;
            }
            
            .header-subtitle {
              font-size: 0.8rem;
            }
            
            .add-button {
              padding: 0.65rem 1rem;
              font-size: 0.85rem;
            }
            
            .add-button svg {
              width: 18px;
              height: 18px;
            }
            
            /* ✅ FILTRES PLUS COMPACTS */
            .filters-container {
              padding: 1rem;
              gap: 0.75rem;
            }
            
            .filter-label {
              font-size: 0.65rem;
            }
            
            .filter-select {
              font-size: 0.8rem;
              padding: 0.5rem 0.75rem;
            }
          }

          /* Large Desktop (> 1600px) - Tailles maximales */
          @media (min-width: 1600px) {
            .admin-programs-container {
              padding: 3rem;
              max-width: 1800px;
              margin: 0 auto;
            }
            
            .programs-table {
              min-width: 100%;
            }
            
            /* ✅ LARGEURS AJUSTÉES POUR GRAND ÉCRAN */
            .program-name {
              min-width: 220px;
              max-width: 380px;
            }
            
            .program-details h3 {
              max-width: 300px;
              font-size: 1rem;
            }
            
            .program-details p {
              max-width: 300px;
              font-size: 0.85rem;
            }
          }

          /* Desktop Standard (1200px - 1599px) - Tailles standards */
          @media (min-width: 1200px) and (max-width: 1599px) {
            .admin-programs-container {
              padding: 2.5rem;
            }
            
            /* ✅ LARGEURS MOYENNES */
            .program-name {
              min-width: 200px;
              max-width: 300px;
            }
            
            .program-details h3 {
              max-width: 220px;
              font-size: 0.9rem;
            }
            
            .program-details p {
              max-width: 220px;
              font-size: 0.8rem;
            }
          }

          /* Tablette Paysage (992px - 1199px) */
          @media (min-width: 992px) and (max-width: 1199px) {
            .admin-programs-container {
              padding: 2rem;
            }
            
            /* ✅ CACHER DESCRIPTIONS */
            .program-details p {
              display: none !important;
            }
            
            /* ✅ LARGEURS RÉDUITES */
            .program-name {
              min-width: 180px;
              max-width: 250px;
            }
            
            .program-details h3 {
              max-width: 180px;
              font-size: 0.85rem;
            }
            
            .programs-table {
              min-width: 900px;
            }
            
            /* Réduire taille icône programme */
            .program-icon {
              width: 38px;
              height: 38px;
              min-width: 38px;
            }
            
            /* Ajuster padding cellules */
            .programs-table th, .programs-table td {
              padding: 1rem 1.25rem;
            }
            
            .metier-tag {
              font-size: 0.8rem;
              padding: 0.4rem 0.75rem;
            }
            
            .status-badge {
              font-size: 0.75rem;
              padding: 0.4rem 0.85rem;
            }
            
            .date-cell {
              font-size: 0.8rem;
            }
          }

          /* Tablette Portrait (768px - 991px) */
          @media (min-width: 768px) and (max-width: 991px) {
            .admin-programs-container {
              padding: 1.5rem;
            }
            
            .header {
              flex-direction: column;
              align-items: stretch;
            }
            
            .add-button {
              width: 100%;
              justify-content: center;
            }
            
            /* ✅ CACHER DESCRIPTIONS */
            .program-details p {
              display: none !important;
            }
            
            /* ✅ LARGEURS COMPACTES */
            .program-name {
              min-width: 160px;
              max-width: 220px;
            }
            
            .program-details h3 {
              max-width: 150px;
              font-size: 0.8rem;
            }
            
            .filters-container {
              flex-direction: column;
            }
            
            .filter-group {
              width: 100%;
            }
            
            .programs-table {
              min-width: 800px;
            }
            
            /* Forcer scroll horizontal */
            .table-card {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }
            
            /* Réduire espacements */
            .programs-table th, .programs-table td {
              padding: 0.875rem 1rem;
            }
          }

          /* Mobile Paysage (576px - 767px) */
          @media (min-width: 576px) and (max-width: 767px) {
            .admin-programs-container {
              padding: 1rem;
            }
            
            .header {
              flex-direction: column;
              align-items: stretch;
            }
            
            .add-button {
              width: 100%;
              justify-content: center;
            }
            
            /* ✅ CACHER DESCRIPTIONS */
            .program-details p {
              display: none !important;
            }
            
            /* ✅ LARGEURS MINIMALES */
            .program-name {
              min-width: 140px;
              max-width: 180px;
            }
            
            .program-details h3 {
              max-width: 120px;
              font-size: 0.75rem;
            }
            
            .filters-container {
              flex-direction: column;
              padding: 1rem;
            }
            
            .filter-group {
              width: 100%;
            }
            
            .programs-table {
              min-width: 750px;
            }
            
            /* Cacher colonne "Créé le" */
            .programs-table th:nth-child(4),
            .programs-table td:nth-child(4) {
              display: none;
            }
            
            /* Forcer scroll horizontal */
            .table-card {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }
            
            .programs-table th {
              font-size: 0.7rem;
              padding: 1rem 0.75rem;
              padding-right: 2rem;
            }
            
            .programs-table td {
              padding: 1rem 0.75rem;
            }
            
            /* Programme mobile */
            .program-icon {
              width: 32px;
              height: 32px;
              min-width: 32px;
            }
            
            .program-icon svg {
              width: 18px;
              height: 18px;
            }
            
            /* Actions mobile */
            .action-btn {
              width: 32px;
              height: 32px;
              min-width: 32px;
            }
            
            .action-btn svg {
              width: 16px !important;
              height: 16px !important;
            }
          }

          /* Mobile Portrait (< 576px) */
          @media (max-width: 575px) {
            .admin-programs-container {
              padding: 1rem;
            }
            
            .header {
              flex-direction: column;
              align-items: stretch;
              gap: 1rem;
            }
            
            .header-title {
              font-size: 1.5rem;
            }
            
            .add-button {
              width: 100%;
              justify-content: center;
              font-size: 0.875rem;
            }
            
            /* ✅ CACHER DESCRIPTIONS */
            .program-details p {
              display: none !important;
            }
            
            /* ✅ LARGEURS ULTRA-COMPACTES */
            .program-name {
              min-width: 120px;
              max-width: 160px;
            }
            
            .program-details h3 {
              max-width: 100px;
              font-size: 0.7rem;
            }
            
            .filters-container {
              flex-direction: column;
              padding: 1rem;
              gap: 0.75rem;
            }
            
            .filter-group {
              width: 100%;
              flex-direction: column;
              align-items: stretch;
            }
            
            .filter-select {
              width: 100%;
            }
            
            .programs-table {
              min-width: 700px;
            }
            
            /* Cacher colonnes non essentielles */
            .programs-table th:nth-child(4),
            .programs-table td:nth-child(4) {
              display: none;
            }
            
            /* Cacher bouton supprimer */
            .action-btn.delete {
              display: none;
            }
            
            /* Forcer scroll horizontal */
            .table-card {
              overflow-x: auto;
              border-radius: 12px;
              -webkit-overflow-scrolling: touch;
            }
            
            .programs-table {
              font-size: 0.85rem;
            }
            
            .programs-table th {
              font-size: 0.7rem;
              padding: 1rem 0.75rem;
              padding-right: 2rem;
            }
            
            .programs-table td {
              padding: 1rem 0.75rem;
            }
            
            /* Programme mobile */
            .program-icon {
              width: 32px;
              height: 32px;
              min-width: 32px;
            }
            
            .program-icon svg {
              width: 18px;
              height: 18px;
            }
            
            /* Métier mobile */
            .metier-tag {
              font-size: 0.75rem;
              padding: 0.35rem 0.65rem;
              gap: 0.4rem;
            }
            
            .metier-tag svg {
              width: 14px;
              height: 14px;
            }
            
            /* Status mobile */
            .status-badge {
              font-size: 0.7rem;
              padding: 0.35rem 0.75rem;
            }
            
            .status-dot {
              width: 5px;
              height: 5px;
            }
            
            /* Date mobile */
            .date-cell {
              font-size: 0.75rem;
              min-width: 80px;
            }
            
            /* Actions mobile */
            .action-btn {
              width: 32px;
              height: 32px;
              min-width: 32px;
            }
            
            .action-btn svg {
              width: 16px !important;
              height: 16px !important;
            }
            
            /* Ajustement hauteur lignes mobile */
            .programs-table tbody tr {
              min-height: 60px;
            }
            
            .programs-table tbody tr:hover {
              transform: scale(1); /* Désactiver zoom sur mobile */
            }
          }


          /* ========================================
             SCROLLBAR PERSONNALISÉE - VISIBLE ET ÉLÉGANTE
             ======================================== */
          .table-card::-webkit-scrollbar {
            height: 10px; /* ✅ Plus haut pour meilleure visibilité */
          }

          .table-card::-webkit-scrollbar-track {
            background: #F3F4F6;
            border-radius: 6px;
            margin: 0 12px; /* Espacement sur les côtés */
          }

          .table-card::-webkit-scrollbar-thumb {
            background: #3B82F6; /* ✅ Bleu pour meilleure visibilité */
            border-radius: 6px;
            border: 2px solid #F3F4F6; /* Bordure pour contraste */
          }

          .table-card::-webkit-scrollbar-thumb:hover {
            background: #2563EB; /* Bleu foncé au hover */
          }

          /* Pour Firefox */
          .table-card {
            scrollbar-width: thin;
            scrollbar-color: #3B82F6 #F3F4F6; /* ✅ Bleu pour Firefox */
          }

          /* Empty state */
          .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px;
            background: linear-gradient(135deg, #F9FAFB, #F3F4F6);
            border: 2px dashed #D1D5DB;
            border-radius: 16px;
            text-align: center;
          }

          .empty-state-content {
            max-width: 400px;
          }

          .empty-state-title {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            margin: 16px 0 8px;
          }

          .empty-state-text {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 24px;
          }

          /* Actions - Une ligne */
          .actions {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            justify-content: flex-end;
            white-space: nowrap;
            min-width: fit-content;
          }

          .action-btn {
            width: 40px;
            height: 40px;
            min-width: 40px; /* ✅ Empêcher rétrécissement */
            border: none;
            background: #F9FAFB;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #6B7280;
            flex-shrink: 0;
          }

          .action-btn svg {
            width: 20px !important;
            height: 20px !important;
            min-width: 20px !important;
            min-height: 20px !important;
            display: block !important;
            stroke: currentColor !important;
            fill: none !important;
            stroke-width: 2 !important;
          }

          .action-btn:hover {
            transform: translateY(-2px) scale(1.05);
          }

          .action-btn:not(.edit):not(.delete):hover {
            background: #4F7FFF !important;
            color: white !important;
            box-shadow: 0 4px 8px rgba(79, 127, 255, 0.3);
          }

          .action-btn.edit:hover {
            background: #10B981;
            color: white;
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
          }

          .action-btn.delete:hover {
            background: #EF4444;
            color: white;
            box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
          }

          /* ========================================
             CELLULE CHAPITRES
             ======================================== */
          .chapters-cell {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            white-space: nowrap;
            min-width: fit-content;
          }

          .chapters-icon {
            width: 28px;
            height: 28px;
            min-width: 28px;
            border-radius: 6px;
            background: linear-gradient(135deg, #8B5CF620, #8B5CF610);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .chapters-text {
            white-space: nowrap;
          }

          /* ========================================
             RESPONSIVE CHAPITRES
             ======================================== */

          /* Tablettes (< 1200px) */
          @media (max-width: 1200px) {
            .chapters-cell {
              font-size: 0.8rem;
              gap: 6px;
            }
            
            .chapters-icon {
              width: 24px;
              height: 24px;
              min-width: 24px;
            }
            
            .chapters-icon svg {
              width: 12px;
              height: 12px;
            }
          }

          /* Tablettes petites (< 992px) */
          @media (max-width: 992px) {
            /* Forcer l'affichage du tableau en scroll horizontal */
            .programs-table {
              min-width: 900px;
            }
            
            .chapters-cell {
              font-size: 0.75rem;
            }
          }

          /* Mobile (< 768px) */
          @media (max-width: 768px) {
            /* Tableau scroll horizontal obligatoire */
            .programs-table {
              min-width: 800px;
              font-size: 0.85rem;
            }
            
            /* Réduire taille cellule chapitres */
            .chapters-cell {
              font-size: 0.7rem;
              gap: 4px;
            }
            
            .chapters-icon {
              width: 20px;
              height: 20px;
              min-width: 20px;
            }
            
            .chapters-icon svg {
              width: 10px;
              height: 10px;
            }
            
            /* Texte compact */
            .chapters-text {
              max-width: 60px;
            }
          }

          /* Très petit mobile (< 480px) */
          @media (max-width: 480px) {
            .programs-table {
              min-width: 700px;
            }
            
            .chapters-cell {
              font-size: 0.65rem;
              gap: 3px;
            }
            
            .chapters-icon {
              width: 18px;
              height: 18px;
              min-width: 18px;
            }
            
            .chapters-icon svg {
              width: 9px;
              height: 9px;
            }
            
            .chapters-text {
              max-width: 50px;
            }
          }
        `}
      </style>

      {/* ✅ ZONE FIXE : Header + Filtres */}
      <div style={{ 
        flexShrink: 0, 
        padding: "32px 24px 16px", 
        backgroundColor: "#F9FAFB",
        borderBottom: "1px solid #E5E7EB"
      }}>
        {/* En-tête */}
        <div className="header">
          <div>
            <h1 className="header-title">Programmes</h1>
            <p className="header-subtitle">Gérez vos programmes de formation</p>
          </div>
          <button 
            type="button" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAdd();
            }} 
            className="add-button"
          >
            <Plus size={18} />
            Ajouter un programme
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
          marginTop: 20,
          marginBottom: 20,
          border: `2px solid ${useSupabase ? '#3b82f6' : '#f59e0b'}`
        }}>
          <div style={{
            fontSize: 24,
          }}>
            {useSupabase ? '🔷' : '🔥'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              Source de données : {useSupabase ? 'Supabase (PostgreSQL)' : 'Firebase (Firestore)'}
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
            Basculer vers {useSupabase ? 'Firebase' : 'Supabase'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Filtres */}
        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">Visibilité</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous</option>
              <option value="visible">En ligne</option>
              <option value="hidden">Masqués</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Catégorie</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">Toutes</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ✅ ZONE SCROLLABLE : Tableau des programmes */}
      <div style={{ 
        flex: 1, 
        overflowY: "auto", 
        overflowX: "hidden", 
        padding: "24px",
        backgroundColor: "#F9FAFB"
      }}>
      {loadingList ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>Chargement des programmes...</p>
        </div>
      ) : sortedPrograms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <BookOpen size={64} color="#6B7280" style={{ margin: "0 auto" }} />
            <h3 className="empty-state-title">Aucun programme pour l'instant</h3>
            <p className="empty-state-text">
              Créez votre premier programme de formation et commencez à structurer vos contenus !
            </p>
            <button type="button" onClick={handleAdd} className="add-button">
              <Plus size={18} />
              Créer un programme
            </button>
          </div>
        </div>
      ) : (
        <div className="table-card">
          <table className="programs-table">
            <thead>
              <tr>
                <th
                  className={`sortable ${sortBy === "name" ? "active" : ""} ${sortDirection === "desc" ? "desc" : ""}`}
                  onClick={() => handleSort("name")}
                >
                  Programme
                </th>
                <th
                  className={`sortable ${sortBy === "metier" ? "active" : ""} ${sortDirection === "desc" ? "desc" : ""}`}
                  onClick={() => handleSort("metier")}
                >
                  Catégorie
                </th>
                <th
                  className={`sortable ${sortBy === "status" ? "active" : ""} ${sortDirection === "desc" ? "desc" : ""}`}
                  onClick={() => handleSort("status")}
                >
                  Statut
                </th>
                <th
                  className={`sortable ${sortBy === "createdAt" ? "active" : ""} ${sortDirection === "desc" ? "desc" : ""}`}
                  onClick={() => handleSort("createdAt")}
                >
                  Créé le
                </th>
                <th style={{ paddingRight: "1.5rem" }}>
                  Chapitres
                </th>
                <th style={{ width: "140px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPrograms.map((program) => {
                const categoryLabel = getCategoryLabel(program.categoryId);
                const IconComponent = getMetierIcon(categoryLabel);
                const metierColor = getMetierColor(categoryLabel);
                const chaptersNumber = chaptersCount[program.id] || 0;

                return (
                  <tr key={program.id} onClick={() => handleEditRedirect(program)}>
                    <td>
                      <div className="program-name">
                        <div
                          className="program-icon"
                          style={{
                            background: `linear-gradient(135deg, ${metierColor}33, ${metierColor}1A)`,
                          }}
                        >
                          <IconComponent size={22} style={{ color: metierColor }} />
                        </div>
                        <div className="program-details">
                          <h3>{program.name}</h3>
                          {program.description && <p>{program.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="metier-tag">
                        <Briefcase size={16} />
                        {categoryLabel}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {program.hidden ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: '#FEE2E2',
                            border: '1px solid #FCA5A5',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#DC2626'
                          }}>
                            <EyeOff size={14} strokeWidth={2.5} />
                            MASQUÉ
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: '#DCFCE7',
                            border: '1px solid #86EFAC',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#16A34A'
                          }}>
                            <Eye size={14} strokeWidth={2.5} />
                            EN LIGNE
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">{formatDate(program.createdAt)}</div>
                    </td>
                    <td>
                      <div className="chapters-cell">
                        <div className="chapters-icon">
                          <ListTree size={14} color="#8B5CF6" />
                        </div>
                        <span className="chapters-text">
                          {chaptersNumber} {chaptersNumber > 1 ? "chapitres" : "chapitre"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleHidden(program);
                          }}
                          title={program.hidden ? "Afficher le programme" : "Masquer le programme"}
                          style={{
                            background: program.hidden ? '#FEE2E2' : '#DCFCE7',
                            color: program.hidden ? '#DC2626' : '#16A34A',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (program.hidden) {
                              // Masqué → Hover vert (va afficher)
                              e.currentTarget.style.background = '#10B981';
                              e.currentTarget.style.color = '#FFFFFF';
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                            } else {
                              // Visible → Hover rouge (va masquer)
                              e.currentTarget.style.background = '#EF4444';
                              e.currentTarget.style.color = '#FFFFFF';
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = program.hidden ? '#FEE2E2' : '#DCFCE7';
                            e.currentTarget.style.color = program.hidden ? '#DC2626' : '#16A34A';
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {program.hidden ? (
                            <EyeOff size={20} strokeWidth={2.5} />
                          ) : (
                            <Eye size={20} strokeWidth={2.5} />
                          )}
                        </button>
                        <button
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRedirect(program);
                          }}
                          title="Modifier"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={(e) => handleDelete(program, e)}
                          title="Supprimer"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Popup création programme */}
      {isModalOpen && (() => {
        const modalRoot = document.getElementById('modal-root');
        if (!modalRoot) return null;
        return createPortal(
        <div 
          className="modal-backdrop" 
          onClick={(e) => {
            if (e.target.className === 'modal-backdrop') {
              closeModal();
            }
          }}
          style={{
            position: 'fixed',
            inset: '0px',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex !important',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px',
            visibility: 'visible',
            opacity: 1
          }}
        >
          <div 
            className="modal" 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              zIndex: 1000000,
              width: '100%',
              maxWidth: '500px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'block',
              visibility: 'visible',
              opacity: 1
            }}
          >
            <h3 className="modal-title">Nouveau programme</h3>
            <p className="modal-subtitle">
              Créez un nouveau programme de formation. La catégorie est optionnelle.
              Vous serez redirigé vers la page de contenu après la création.
            </p>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nom du programme *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="Ex: Formation Manager"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Catégorie (optionnel)</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Aucune catégorie --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                
                {/* Bouton pour créer une catégorie */}
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    color: '#3B82F6',
                    background: 'none',
                    border: 'none',
                    padding: '4px 0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 500
                  }}
                >
                  <Plus size={14} />
                  Créer une nouvelle catégorie
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Statut</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="draft">En brouillon</option>
                  <option value="published">Publié</option>
                  <option value="disabled">Désactivé</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (facultatif)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                  placeholder="Décrivez brièvement ce programme..."
                />
              </div>

              {formError && <div className="error-message">{formError}</div>}

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-button">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="submit-button">
                  {saving ? "Création..." : "Créer et ouvrir"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        modalRoot
        );
      })()}
      
      {/* Modal création catégorie */}
      {showCategoryModal && (() => {
        const modalRoot = document.getElementById('modal-root');
        if (!modalRoot) return null;
        return createPortal(
          <div 
            className="modal-backdrop" 
            onClick={() => {
              setShowCategoryModal(false);
              setNewCategoryName('');
            }}
            style={{ zIndex: 999999 }}
          >
            <div 
              className="modal" 
              onClick={(e) => e.stopPropagation()}
              style={{ 
                zIndex: 1000000,
                maxWidth: '450px'
              }}
            >
              <h3 className="modal-title">Nouvelle catégorie</h3>
              <p className="modal-subtitle">
                Créez une nouvelle catégorie pour organiser vos programmes.
              </p>
              
              <div className="form-group">
                <label className="form-label">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Sécurité routière"
                  className="form-input"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newCategoryName.trim()) {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                />
              </div>
              
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="cancel-button"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || isCreatingCategory}
                  className="submit-button"
                >
                  {isCreatingCategory ? 'Création...' : 'Créer'}
                </button>
              </div>
            </div>
          </div>,
          modalRoot
        );
      })()}
    </div>
  );
}
