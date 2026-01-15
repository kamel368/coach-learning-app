// src/pages/AdminPrograms.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { 
  Plus, 
  Eye, 
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminPrograms() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [programs, setPrograms] = useState([]);
  const [categories, setCategories] = useState([]); // rôles métier
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");

  // Popup (création uniquement)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Popup vue (inchangé)
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewProgram, setViewProgram] = useState(null);

  // Hover state pour les boutons
  const [hoveredButton, setHoveredButton] = useState(null);

  // Filtres
  const [sortBy, setSortBy] = useState("default"); // default | name | metier | status | createdAt | updatedAt
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Charger programmes + rôles métier
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingList(true);

        const progSnap = await getDocs(collection(db, "programs"));
        const progList = progSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setPrograms(progList);

        const catSnap = await getDocs(collection(db, "categories"));
        const catList = catSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setCategories(catList);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les programmes ou les rôles métier.");
      } finally {
        setLoadingList(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryLabel = (id) => {
    if (!id) return "Non défini";
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.label : "Rôle inconnu";
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

  const statusLabels = {
    published: "Publié",
    disabled: "Désactivé",
    draft: "Brouillon",
  };

  const getStatusColor = (s) => {
    if (s === "published") return "#10B981";
    if (s === "disabled") return "#EF4444";
    return "#F59E0B";
  };

  const getStatusBg = (s) => {
    if (s === "published") return "rgba(16, 185, 129, 0.1)";
    if (s === "disabled") return "rgba(239, 68, 68, 0.1)";
    return "rgba(245, 158, 11, 0.1)";
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

  // Ouvrir vue
  const handleView = (program) => {
    setViewProgram(program);
    setIsViewOpen(true);
  };

  const closeView = () => {
    setViewProgram(null);
    setIsViewOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setName("");
    setDescription("");
    setCategoryId("");
    setStatus("draft");
    setFormError("");
  };

  // Création + redirection vers page détail
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Le nom du programme est obligatoire.");
      return;
    }
    if (!categoryId) {
      setFormError("Le rôle métier est obligatoire.");
      return;
    }

    try {
      setSaving(true);
      const now = Timestamp.now();
      const ref = await addDoc(collection(db, "programs"), {
        name,
        description,
        categoryId,
        status: status || "draft",
        createdAt: now,
        updatedAt: now,
      });

      const newProgram = {
        id: ref.id,
        name,
        description,
        categoryId,
        status: status || "draft",
        createdAt: now,
        updatedAt: now,
      };

      setPrograms((prev) => [...prev, newProgram]);

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
      await deleteDoc(doc(db, "programs", program.id));
      setPrograms((prev) => prev.filter((p) => p.id !== program.id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression du programme.");
    }
  };

  // Filtres + tri
  const filteredPrograms = programs.filter((p) => {
    if (filterStatus !== "all" && (p.status || "draft") !== filterStatus) {
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
        comparison = (a.status || "draft").localeCompare(b.status || "draft");
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
    <div style={{ minHeight: "100vh", background: "#F9FAFB", padding: "32px 24px" }}>
      <style>
        {`
          /* Table Card Container */
          .table-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          /* Table Base */
          .programs-table {
            width: 100%;
            border-collapse: collapse;
          }

          /* En-têtes */
          .programs-table thead {
            background: linear-gradient(to bottom, #F9FAFB, white);
            border-bottom: 2px solid #E5E7EB;
          }

          .programs-table th {
            padding: 1.25rem 3rem 1.25rem 1.5rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.75rem;
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

          /* Cellules */
          .programs-table td {
            padding: 1.25rem 1.5rem;
            font-size: 0.9rem;
            vertical-align: middle;
          }

          /* Programme (nom + icône) */
          .program-name {
            display: flex;
            align-items: center;
            gap: 0.875rem;
          }

          .program-icon {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.3s ease;
          }

          .program-details h3 {
            font-size: 0.95rem;
            font-weight: 600;
            color: #111827;
            margin: 0 0 0.25rem 0;
          }

          .program-details p {
            font-size: 0.8rem;
            color: #6B7280;
            line-height: 1.4;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* Métier Tag */
          .metier-tag {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.875rem;
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            font-size: 0.85rem;
            color: #374151;
          }

          /* Status Badge */
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
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
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
          }

          /* Date */
          .date-cell {
            font-size: 0.875rem;
            color: #374151;
            font-weight: 500;
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
            width: 40px;
            height: 40px;
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

          /* FORCER l'affichage des icônes SVG - TAILLE AUGMENTÉE */
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
            background: #4F7FFF;
            color: white;
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 4px 8px rgba(79, 127, 255, 0.3);
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

          /* Responsive */
          @media (max-width: 1200px) {
            .program-details p {
              display: none;
            }
          }

          /* ========================================
             RESPONSIVE DESIGN
             ======================================== */

          /* Tablettes (< 1200px) */
          @media (max-width: 1200px) {
            /* Cacher les descriptions des programmes */
            .program-details p {
              display: none;
            }
            
            /* Réduire taille icône programme */
            .program-icon {
              width: 38px;
              height: 38px;
            }
            
            /* Ajuster padding cellules */
            .programs-table th, .programs-table td {
              padding: 1rem 1.25rem;
            }
            
            /* Réduire taille texte */
            .program-details h3 {
              font-size: 0.9rem;
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

          /* Tablettes petites (< 992px) */
          @media (max-width: 992px) {
            /* Passer en scroll horizontal */
            .table-card {
              overflow-x: auto;
            }
            
            .programs-table {
              min-width: 900px;
            }
            
            /* Réduire espacements */
            .programs-table th, .programs-table td {
              padding: 0.875rem 1rem;
            }
            
            /* Filtres en colonne */
            .filters-container {
              flex-direction: column;
              align-items: stretch;
            }
          }

          /* Mobile (< 768px) */
          @media (max-width: 768px) {
            /* Header en colonne */
            .header {
              flex-direction: column;
              gap: 1rem;
              align-items: stretch;
              margin-bottom: 1.5rem;
            }
            
            .header-title {
              font-size: 1.5rem;
            }
            
            .header-subtitle {
              font-size: 0.85rem;
            }
            
            .add-button {
              width: 100%;
              justify-content: center;
            }
            
            /* Filtres compacts */
            .filters-container {
              padding: 1rem;
              flex-direction: column;
            }
            
            .filter-group {
              width: 100%;
            }
            
            .filter-select {
              font-size: 0.8rem;
              padding: 0.5rem 0.875rem;
            }
            
            /* Tableau scroll horizontal obligatoire */
            .table-card {
              overflow-x: auto;
              border-radius: 12px;
            }
            
            .programs-table {
              min-width: 800px;
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
            
            /* Programme */
            .program-icon {
              width: 32px;
              height: 32px;
            }
            
            .program-details h3 {
              font-size: 0.85rem;
            }
            
            /* Actions plus petites sur mobile */
            .action-btn {
              width: 36px;
              height: 36px;
            }
            
            .action-btn svg {
              width: 18px !important;
              height: 18px !important;
              min-width: 18px !important;
              min-height: 18px !important;
            }
            
            /* Ajustement hauteur lignes sur mobile */
            tbody tr {
              min-height: 60px;
            }
            
            tbody tr:hover {
              transform: scale(1);
            }
          }

          /* Très petit mobile (< 480px) */
          @media (max-width: 480px) {
            .header-title {
              font-size: 1.25rem;
            }
            
            .programs-table {
              min-width: 700px;
            }
            
            .programs-table th, .programs-table td {
              padding: 0.75rem 0.5rem;
            }
            
            .filters-container {
              padding: 0.75rem;
            }
            
            .filter-select {
              font-size: 0.75rem;
              padding: 0.4rem 0.75rem;
            }
          }

          /* Scroll horizontal visible sur mobile */
          .table-card::-webkit-scrollbar {
            height: 8px;
          }

          .table-card::-webkit-scrollbar-track {
            background: #F3F4F6;
            border-radius: 4px;
          }

          .table-card::-webkit-scrollbar-thumb {
            background: #D1D5DB;
            border-radius: 4px;
          }

          .table-card::-webkit-scrollbar-thumb:hover {
            background: #9CA3AF;
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
        `}
      </style>

      {/* En-tête */}
      <div className="header">
        <div>
          <h1 className="header-title">Programmes</h1>
          <p className="header-subtitle">Gérez vos programmes de formation</p>
        </div>
        <button type="button" onClick={handleAdd} className="add-button">
          <Plus size={18} />
          Ajouter un programme
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filtres */}
      <div className="filters-container">
        <div className="filter-group">
          <label className="filter-label">Statut</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous</option>
            <option value="draft">En brouillon</option>
            <option value="published">Publié</option>
            <option value="disabled">Désactivé</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Métier</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau des programmes */}
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
                  Métier
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
                <th
                  className={`sortable ${sortBy === "updatedAt" ? "active" : ""} ${sortDirection === "desc" ? "desc" : ""}`}
                  onClick={() => handleSort("updatedAt")}
                >
                  Modifié le
                </th>
                <th style={{ width: "140px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPrograms.map((program) => {
                const categoryLabel = getCategoryLabel(program.categoryId);
                const IconComponent = getMetierIcon(categoryLabel);
                const metierColor = getMetierColor(categoryLabel);

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
                      <span className={`status-badge ${program.status || "draft"}`}>
                        <span className="status-dot"></span>
                        {statusLabels[program.status || "draft"]}
                      </span>
                    </td>
                    <td>
                      <div className="date-cell">{formatDate(program.createdAt)}</div>
                    </td>
                    <td>
                      <div className="date-cell">
                        {formatDate(program.updatedAt || program.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(program);
                          }}
                          title="Voir"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <button
                          className="action-btn"
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

      {/* Popup création programme */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Nouveau programme</h3>
            <p className="modal-subtitle">
              Créez un nouveau programme de formation et associez-le à un rôle métier.
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
                <label className="form-label">Rôle métier associé *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="form-select"
                >
                  <option value="">Choisir un rôle métier</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
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
        </div>
      )}

      {/* Popup vue programme (métadonnées) */}
      {isViewOpen && viewProgram && (
        <div className="modal-backdrop" onClick={closeView}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{viewProgram.name}</h3>

            <div className="form-group">
              <label className="form-label">Rôle métier</label>
              <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>
                {getCategoryLabel(viewProgram.categoryId)}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Statut</label>
              <div>
                <span className={`status-badge ${viewProgram.status || "draft"}`}>
                  <span className="status-dot"></span>
                  {statusLabels[viewProgram.status || "draft"]}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="form-label">Créé le</label>
                <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>
                  {formatDate(viewProgram.createdAt)}
                </p>
              </div>
              <div>
                <label className="form-label">Modifié le</label>
                <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>
                  {formatDate(viewProgram.updatedAt || viewProgram.createdAt)}
                </p>
              </div>
            </div>

            {viewProgram.description && (
              <div className="form-group">
                <label className="form-label">Description</label>
                <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                  {viewProgram.description}
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <button type="button" onClick={closeView} className="submit-button" style={{ width: "100%" }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
