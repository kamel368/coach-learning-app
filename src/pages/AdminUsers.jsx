// src/pages/AdminUsers.jsx
import { useEffect, useState } from "react";
import { db, createUserWithoutSignOut } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import Breadcrumb from "../components/Breadcrumb";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulaire création
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("learner");
  const [creating, setCreating] = useState(false);

  // Charger tous les utilisateurs
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtrer par recherche
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((u) =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  async function fetchUsers() {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
      setFilteredUsers(list);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRole(user) {
    const newRole = user.role === "admin" ? "learner" : "admin";
    try {
      await updateDoc(doc(db, "users", user.id), { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors du changement de rôle.");
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      alert("Email et mot de passe sont obligatoires.");
      return;
    }

    setCreating(true);

    try {
      // 1. Créer dans Firebase Auth (sans déconnecter l'admin)
      const newUser = await createUserWithoutSignOut(newEmail, newPassword);

      // 2. Créer le document Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newEmail,
        role: newRole,
        displayName: newEmail.split("@")[0],
        createdAt: serverTimestamp(),
      });

      // 3. Recharger la liste
      await fetchUsers();

      // 4. Réinitialiser le formulaire
      setNewEmail("");
      setNewPassword("");
      setNewRole("learner");
      setShowCreateForm(false);

      alert(`✅ Utilisateur ${newEmail} créé avec succès !`);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        alert("Cet email est déjà utilisé.");
      } else {
        alert("Erreur lors de la création de l'utilisateur.");
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Chargement...</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        padding: 24,
      }}
    >
      <Breadcrumb
        items={[{ label: "Admin", path: "/admin" }, { label: "Utilisateurs" }]}
      />

      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Gestion des utilisateurs</h1>
      <p style={{ fontSize: 14, color: "var(--color-muted)", marginBottom: 20 }}>
        Gérer les rôles et créer de nouveaux apprenants.
      </p>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      {/* Barre de recherche + Bouton créer */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Rechercher par email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: "10px 16px",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showCreateForm ? "Annuler" : "+ Créer un apprenant"}
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e5e7eb",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Nouveau compte apprenant</h2>
          <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="apprenant@example.com"
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                Mot de passe temporaire
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
                minLength={6}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
                Rôle
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              >
                <option value="learner">Apprenant</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              style={{
                marginTop: 8,
                padding: "10px 16px",
                background: creating ? "#9CA3AF" : "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: creating ? "not-allowed" : "pointer",
              }}
            >
              {creating ? "Création..." : "Créer le compte"}
            </button>
          </form>
        </div>
      )}

      {/* Liste des utilisateurs */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                Email
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                Rôle
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                Date de création
              </th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 20, textAlign: "center", color: "var(--color-muted)" }}>
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{user.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: user.role === "admin" ? "#FEF3C7" : "#DBEAFE",
                        color: user.role === "admin" ? "#92400E" : "#1E40AF",
                      }}
                    >
                      {user.role === "admin" ? "Admin" : "Apprenant"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--color-muted)" }}>
                    {user.createdAt?.toDate
                      ? new Date(user.createdAt.toDate()).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <button
                      onClick={() => handleToggleRole(user)}
                      style={{
                        padding: "6px 12px",
                        background: user.role === "admin" ? "#EF4444" : "#10B981",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {user.role === "admin" ? "Rétrograder" : "Promouvoir admin"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
