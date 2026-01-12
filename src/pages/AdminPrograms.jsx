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

export default function AdminPrograms() {
  const navigate = useNavigate();

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

  // Filtres
  const [sortBy, setSortBy] = useState("default"); // default | createdAt
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
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getStatusLabel = (s) => {
    if (s === "published") return "Publié";
    if (s === "disabled") return "Désactivé";
    return "En brouillon";
  };

  const getStatusColor = (s) => {
    if (s === "published") return "#16A34A";
    if (s === "disabled") return "#DC2626";
    return "#F59E0B";
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
  const handleDelete = async (program) => {
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
    if (sortBy === "createdAt") {
      const da = a.createdAt?.seconds || 0;
      const db = b.createdAt?.seconds || 0;
      return da - db;
    }
    return 0;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        padding: 24,
        position: "relative",
      }}
    >
      {/* En-tête + bouton Ajouter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 24 }}>Programmes</h1>

        <button
          type="button"
          onClick={handleAdd}
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
          + Ajouter un programme
        </button>
      </div>

      {error && (
        <p style={{ color: "#dc2626", marginBottom: 10, fontSize: 13 }}>
          {error}
        </p>
      )}

      {/* Filtres */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* Trier par */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--color-muted)",
              marginBottom: 2,
            }}
          >
            Trier par
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: 13,
            }}
          >
            <option value="default">Ordre d'affichage</option>
            <option value="createdAt">Date de création (croissante)</option>
          </select>
        </div>

        {/* Filtre statut */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--color-muted)",
              marginBottom: 2,
            }}
          >
            Statut
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: 13,
            }}
          >
            <option value="all">Tous</option>
            <option value="draft">En brouillon</option>
            <option value="published">Publié</option>
            <option value="disabled">Désactivé</option>
          </select>
        </div>

        {/* Filtre métier */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--color-muted)",
              marginBottom: 2,
            }}
          >
            Métier
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: 13,
            }}
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

      {/* Liste des programmes */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          boxShadow: "var(--shadow-soft)",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ fontSize: 18, margin: "0 0 12px 0" }}>Liste des programmes</h2>

        {loadingList ? (
          <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
            Chargement des programmes...
          </p>
        ) : sortedPrograms.length === 0 ? (
          <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
            Aucun programme pour l’instant.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sortedPrograms.map((program) => (
              <li
                key={program.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  gap: 8,
                }}
              >
                {/* Infos programme */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                      }}
                    >
                      {program.name}
                    </div>
                    {/* Statut */}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        backgroundColor: "#F3F4F6",
                        color: getStatusColor(program.status),
                      }}
                    >
                      {getStatusLabel(program.status)}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-muted)",
                      marginBottom: 2,
                    }}
                  >
                    Métier : {getCategoryLabel(program.categoryId)}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-muted)",
                      marginBottom: 2,
                    }}
                  >
                    Créé le : {formatDate(program.createdAt)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Modifié le : {formatDate(program.updatedAt || program.createdAt)}
                  </div>

                  {program.description && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--color-text)",
                        marginTop: 2,
                      }}
                    >
                      {program.description}
                    </div>
                  )}
                </div>

                {/* Icônes : vue, modifier (redirige), supprimer */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleView(program)}
                    title="Voir les métadonnées"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "999px",
                      border: "1px solid #D1D5DB",
                      backgroundColor: "#F9FAFB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    👁️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditRedirect(program)}
                    title="Éditer le contenu"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "999px",
                      border: "1px solid #D1D5DB",
                      backgroundColor: "#F9FAFB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(program)}
                    title="Supprimer"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "999px",
                      border: "1px solid #FCA5A5",
                      backgroundColor: "#FEE2E2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Popup création programme */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              backgroundColor: "white",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 10px 40px rgba(15,23,42,0.3)",
            }}
          >
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Nouveau programme</h3>
            <p
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginBottom: 12,
              }}
            >
              Créez un nouveau programme de formation et associez-le à un rôle métier.
              Vous serez redirigé vers la page de contenu après la création.
            </p>

            <form onSubmit={handleSave}>
              <label
                style={{
                  fontSize: 13,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Nom du programme
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  marginBottom: 10,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                }}
              />

              <label
                style={{
                  fontSize: 13,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Rôle métier associé
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  marginBottom: 10,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="">Choisir un rôle métier</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <label
                style={{
                  fontSize: 13,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  marginBottom: 10,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="draft">En brouillon</option>
                <option value="published">Publié</option>
                <option value="disabled">Désactivé</option>
              </select>

              <label
                style={{
                  fontSize: 13,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Description (facultatif)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  marginBottom: 10,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                }}
              />

              {formError && (
                <p
                  style={{
                    color: "#dc2626",
                    marginBottom: 8,
                    fontSize: 13,
                  }}
                >
                  {formError}
                </p>
              )}

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid #d1d5db",
                    backgroundColor: "#F9FAFB",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "none",
                    background:
                      "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Création..." : "Créer et ouvrir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup vue programme (métadonnées) */}
      {isViewOpen && viewProgram && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              backgroundColor: "white",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 10px 40px rgba(15,23,42,0.3)",
            }}
          >
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>
              {viewProgram.name}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "#4B5563",
                marginBottom: 4,
              }}
            >
              Rôle métier : {getCategoryLabel(viewProgram.categoryId)}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#4B5563",
                marginBottom: 4,
              }}
            >
              Statut : {getStatusLabel(viewProgram.status)}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#4B5563",
                marginBottom: 4,
              }}
            >
              Créé le : {formatDate(viewProgram.createdAt)}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#4B5563",
                marginBottom: 12,
              }}
            >
              Modifié le : {formatDate(viewProgram.updatedAt || viewProgram.createdAt)}
            </p>
            {viewProgram.description && (
              <p
                style={{
                  fontSize: 14,
                  color: "#4B5563",
                  marginBottom: 12,
                }}
              >
                {viewProgram.description}
              </p>
            )}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={closeView}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  backgroundColor: "#F9FAFB",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
