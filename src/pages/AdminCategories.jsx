// src/pages/AdminCategories.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");

  // État de la popup (ajout / édition)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = ajout, objet = édition
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Charger les rôles métier (collection "categories")
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingList(true);
        const snap = await getDocs(collection(db, "categories"));
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setItems(list);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les rôles métier.");
      } finally {
        setLoadingList(false);
      }
    };

    fetchData();
  }, []);

  // Ouvrir popup en mode ajout
  const handleAdd = () => {
    setEditingItem(null);
    setLabel("");
    setFormError("");
    setIsModalOpen(true);
  };

  // Ouvrir popup en mode édition
  const handleEdit = (item) => {
    setEditingItem(item);
    setLabel(item.label || "");
    setFormError("");
    setIsModalOpen(true);
  };

  // Fermer popup
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setLabel("");
    setFormError("");
  };

  // Sauvegarde (ajout ou édition)
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!label.trim()) {
      setFormError("Le nom du métier est obligatoire.");
      return;
    }

    try {
      setSaving(true);

      if (editingItem) {
        // Mode édition : updateDoc
        const ref = doc(db, "categories", editingItem.id);
        await updateDoc(ref, { label });

        setItems((prev) =>
          prev.map((it) =>
            it.id === editingItem.id ? { ...it, label } : it
          )
        );
      } else {
        // Mode ajout : addDoc
        const ref = await addDoc(collection(db, "categories"), {
          label,
        });
        setItems((prev) => [...prev, { id: ref.id, label }]);
      }

      closeModal();
    } catch (err) {
      console.error(err);
      setFormError("Erreur lors de l'enregistrement du métier.");
    } finally {
      setSaving(false);
    }
  };

  // Suppression
  const handleDelete = async (item) => {
    const ok = window.confirm(
      `Supprimer le métier "${item.label}" ? Cette action est définitive.`
    );
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "categories", item.id));
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression du métier.");
    }
  };

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
        <h1 style={{ fontSize: 24 }}>Rôles Métier</h1>

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
          + Ajouter un métier
        </button>
      </div>

      {error && (
        <p style={{ color: "#dc2626", marginBottom: 10, fontSize: 13 }}>
          {error}
        </p>
      )}

      {/* Liste des rôles métier */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          boxShadow: "var(--shadow-soft)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 18, margin: 0 }}>Liste des rôles métier</h2>
        </div>

        {loadingList ? (
          <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
            Chargement des rôles métier...
          </p>
        ) : items.length === 0 ? (
          <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
            Aucun rôle métier pour l’instant.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {items.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                }}
              >
                {/* Libellé du métier */}
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--color-text)",
                  }}
                >
                  {item.label}
                </span>

                {/* Icônes modifier / supprimer */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    title="Modifier"
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
                    onClick={() => handleDelete(item)}
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

      {/* Popup ajout / édition */}
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
              maxWidth: 420,
              backgroundColor: "white",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 10px 40px rgba(15,23,42,0.3)",
            }}
          >
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>
              {editingItem ? "Modifier le métier" : "Nouveau métier"}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginBottom: 12,
              }}
            >
              {editingItem
                ? "Modifiez le nom du métier."
                : "Ajoutez un nouveau rôle métier (ex : Moniteur, Assistant, Gestionnaire...)."}
            </p>

            <form onSubmit={handleSave}>
              <label
                style={{
                  fontSize: 13,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Nom du métier
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
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
                  {saving
                    ? "Enregistrement..."
                    : editingItem
                    ? "Enregistrer"
                    : "Créer le métier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
