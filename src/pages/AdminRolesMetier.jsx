// src/pages/AdminRolesMetier.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ArrowLeft, Plus, Edit2, Trash2, Briefcase } from "lucide-react";

// 📝 Note: Collection nommée "categories" en DB pour des raisons historiques
// Elle correspond aux "rôles métier" dans l'interface utilisateur
// (Laveur de voiture, Secrétaire, Moniteur, etc.)

export default function AdminRolesMetier() {
  const navigate = useNavigate();
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
        height: "100vh",
        overflow: "hidden",
        background: "#f8fafc",
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Bouton retour */}
      <div style={{ marginBottom: "12px" }}>
        <button
          onClick={() => navigate('/admin/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
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
          <ArrowLeft size={14} />
          Retour au dashboard
        </button>
      </div>

      {/* Header avec titre et bouton */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div>
          <h1 style={{ 
            fontSize: "24px", 
            fontWeight: "700", 
            color: "#1e293b",
            marginBottom: "4px",
            letterSpacing: "-0.5px"
          }}>
            Rôles Métier
          </h1>
          <p style={{
            fontSize: "13px",
            color: "#64748b",
            margin: 0
          }}>
            Gérez les différents métiers et rôles de votre organisation
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          style={{
            padding: "10px 16px",
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
          }}
        >
          <Plus size={16} />
          Ajouter un rôle métier
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: "10px 12px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          marginBottom: "12px"
        }}>
          <p style={{ 
            color: "#dc2626", 
            margin: 0, 
            fontSize: "13px",
            fontWeight: "500"
          }}>
            {error}
          </p>
        </div>
      )}

      {/* Liste des rôles métier */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e5e7eb",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
          paddingBottom: "12px",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Briefcase size={18} color="#6366f1" strokeWidth={2} />
          </div>
          <div>
            <h2 style={{ 
              fontSize: "16px", 
              fontWeight: "700",
              color: "#1e293b",
              margin: 0,
              marginBottom: "2px"
            }}>
              Liste des rôles métier
            </h2>
            <p style={{
              fontSize: "12px",
              color: "#64748b",
              margin: 0
            }}>
              {items.length} {items.length > 1 ? "métiers" : "métier"} enregistré{items.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "4px"
        }}>
          {loadingList ? (
            <div style={{
              textAlign: "center",
              padding: "30px 20px",
              color: "#64748b"
            }}>
              <p style={{ fontSize: "13px", margin: 0 }}>
                Chargement des rôles métier...
              </p>
            </div>
          ) : items.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "30px 20px",
              color: "#64748b"
            }}>
              <Briefcase size={40} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: "12px" }} />
              <p style={{ 
                fontSize: "14px", 
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: "6px"
              }}>
                Aucun rôle métier
              </p>
              <p style={{ fontSize: "13px", margin: 0 }}>
                Commencez par ajouter votre premier métier
              </p>
            </div>
          ) : (
            <div style={{ 
              display: "grid",
              gap: "8px"
            }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Libellé du métier */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                    }} />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#1e293b",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* Boutons modifier / supprimer */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      title="Modifier"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "7px",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f0f9ff";
                        e.currentTarget.style.borderColor = "#3b82f6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }}
                    >
                      <Edit2 size={14} color="#3b82f6" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      title="Supprimer"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "7px",
                        border: "1px solid #fecaca",
                        backgroundColor: "#fef2f2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fee2e2";
                        e.currentTarget.style.borderColor = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fef2f2";
                        e.currentTarget.style.borderColor = "#fecaca";
                      }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal ajout / édition */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            animation: "fadeIn 0.2s ease"
          }}
          onClick={closeModal}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(15,23,42,0.3)",
              animation: "modalScaleIn 0.3s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "16px",
              marginBottom: "24px"
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <Briefcase size={24} color="#6366f1" strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontSize: "20px", 
                  fontWeight: "700",
                  color: "#1e293b",
                  marginBottom: "6px"
                }}>
                  {editingItem ? "Modifier le métier" : "Nouveau rôle métier"}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                    margin: 0,
                    lineHeight: "1.5"
                  }}
                >
                  {editingItem
                    ? "Modifiez le nom du métier ci-dessous."
                    : "Ajoutez un nouveau rôle métier (ex : Moniteur, Assistant, Gestionnaire...)."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#1e293b",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Nom du métier
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Moniteur d'auto-école"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6366f1";
                    e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {formError && (
                <div style={{
                  padding: "12px 16px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  marginBottom: "16px"
                }}>
                  <p
                    style={{
                      color: "#dc2626",
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: "500"
                    }}
                  >
                    {formError}
                  </p>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#64748b",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
                    }
                  }}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingItem
                    ? "Enregistrer"
                    : "Créer le rôle métier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
