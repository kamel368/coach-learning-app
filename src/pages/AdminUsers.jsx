// src/pages/AdminUsers.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { assignProgramsToUser, getAllPrograms } from '../services/assignmentService';
import { useAuth } from '../context/AuthContext';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { organizationId } = useAuth();
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

  // États pour la modal d'affectation
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Charger tous les utilisateurs
  useEffect(() => {
    if (organizationId) {
      fetchUsers();
    }
  }, [organizationId]);

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
      let snapshot;
      
      if (organizationId) {
        // Nouvelle structure : charger depuis /organizations/{orgId}/employees
        const employeesRef = collection(db, "organizations", organizationId, "employees");
        snapshot = await getDocs(employeesRef);
        
        // Transformer les données pour correspondre au format attendu
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          const profile = data.profile || {};
          return {
            id: d.id,
            email: profile.email || '',
            role: profile.role || 'learner',
            displayName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email,
            createdAt: profile.createdAt || data.createdAt,
            status: profile.status || 'active',
            ...profile
          };
        });
        
        console.log('📚 Utilisateurs chargés depuis /organizations/' + organizationId + '/employees');
        setUsers(list);
        setFilteredUsers(list);
      } else {
        // Fallback ancienne structure
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"));
        snapshot = await getDocs(q);
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        console.log('⚠️ Fallback: Utilisateurs chargés depuis /users');
        setUsers(list);
        setFilteredUsers(list);
      }
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
      // Mettre à jour dans la nouvelle structure
      if (organizationId) {
        await updateDoc(
          doc(db, "organizations", organizationId, "employees", user.id),
          { 'profile.role': newRole, 'profile.updatedAt': serverTimestamp() }
        );
      }
      
      // Aussi mettre à jour dans /users pour compatibilité
      try {
        await updateDoc(doc(db, "users", user.id), { role: newRole });
      } catch (e) {
        console.log('User doc not found in /users, skipping');
      }
      
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
      const oderId = newUser.uid;

      // 2. Créer dans la nouvelle structure /organizations/{orgId}/employees
      if (organizationId) {
        await setDoc(doc(db, "organizations", organizationId, "employees", oderId), {
          profile: {
            oderId: oderId,
            email: newEmail,
            firstName: '',
            lastName: '',
            role: newRole,
            status: 'active',
            poste: '',
            contrat: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        });
        
        // Créer aussi le document learning/data
        await setDoc(
          doc(db, "organizations", organizationId, "employees", oderId, "learning", "data"),
          {
            assignedPrograms: [],
            lastActivityAt: serverTimestamp()
          }
        );
        
        console.log('✅ Utilisateur créé dans /organizations/' + organizationId + '/employees');
      }

      // 3. Aussi créer dans /users pour compatibilité
      await setDoc(doc(db, "users", oderId), {
        oderId: oderId,
        uid: oderId, // Pour compatibilité
        email: newEmail,
        role: newRole,
        displayName: newEmail.split("@")[0],
        organizationId: organizationId,
        createdAt: serverTimestamp(),
      });
      
      console.log('✅ Utilisateur créé dans /users (compatibilité)');

      // 4. Recharger la liste
      await fetchUsers();

      // 5. Réinitialiser le formulaire
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

  // Fonction pour ouvrir la modal d'affectation
  async function handleOpenAssignModal(user) {
    setSelectedUser(user);
    setSelectedPrograms(user.assignedPrograms || []);
    setShowAssignModal(true);
    
    // Charger les programmes disponibles depuis l'organisation
    await loadProgramsForAssignment();
  }
  
  // Fonction pour charger les programmes pour l'assignation
  async function loadProgramsForAssignment() {
    try {
      let progSnap;
      
      if (organizationId) {
        // Charger depuis l'organisation
        progSnap = await getDocs(collection(db, "organizations", organizationId, "programs"));
        console.log('📚 Programmes pour assignation depuis /organizations/' + organizationId + '/programs');
      } else {
        // Fallback
        progSnap = await getDocs(collection(db, "programs"));
        console.log('⚠️ Fallback: Programmes depuis /programs');
      }
      
      const programsList = progSnap.docs.map(d => ({ 
        id: d.id, 
        name: d.data().name || d.data().title || 'Programme sans titre',
        ...d.data() 
      }));
      
      setAvailablePrograms(programsList);
    } catch (error) {
      console.error('Erreur chargement programmes:', error);
      setAvailablePrograms([]);
    }
  }

  // Fonction pour sauvegarder l'affectation
  async function handleSaveAssignment() {
    if (!selectedUser) return;
    
    setAssignLoading(true);
    try {
      const oderId = selectedUser.id;
      
      // 1. Sauvegarder dans la nouvelle structure /organizations/{orgId}/employees/{userId}/learning/data
      if (organizationId) {
        await setDoc(
          doc(db, "organizations", organizationId, "employees", oderId, "learning", "data"),
          { 
            assignedPrograms: selectedPrograms,
            lastActivityAt: serverTimestamp()
          },
          { merge: true }
        );
        console.log('✅ Programmes affectés dans /organizations/' + organizationId + '/employees/' + oderId + '/learning/data');
      }
      
      // 2. Aussi sauvegarder dans /users pour compatibilité
      try {
        await updateDoc(doc(db, "users", oderId), {
          assignedPrograms: selectedPrograms
        });
        console.log('✅ Programmes affectés dans /users/' + oderId + ' (compatibilité)');
      } catch (e) {
        console.log('User doc not found in /users, skipping compatibility update');
      }
      
      alert('✅ Programmes affectés avec succès !');
      
      // Mettre à jour la liste locale
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, assignedPrograms: selectedPrograms }
          : u
      ));
      setFilteredUsers(filteredUsers.map(u => 
        u.id === selectedUser.id 
          ? { ...u, assignedPrograms: selectedPrograms }
          : u
      ));
      
      setShowAssignModal(false);
      setSelectedUser(null);
      setSelectedPrograms([]);
    } catch (error) {
      console.error('Erreur lors de l\'affectation:', error);
      alert('❌ Erreur lors de l\'affectation: ' + error.message);
    } finally {
      setAssignLoading(false);
    }
  }

  // Fonction pour toggle un programme
  function toggleProgram(programId) {
    setSelectedPrograms(prev => 
      prev.includes(programId)
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    );
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
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600 }}>
                Programmes affectés
              </th>
              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, fontWeight: 600 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--color-muted)" }}>
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
                  <td style={{ padding: "12px 16px" }}>
                    {user.role === "learner" ? (
                      <div>
                        {user.assignedPrograms && user.assignedPrograms.length > 0 ? (
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                            {user.assignedPrograms.length} programme{user.assignedPrograms.length > 1 ? 's' : ''}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                            Aucun programme
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => navigate(`/admin/employees/${user.id}`)}
                            style={{
                              padding: "4px 8px",
                              background: "#eff6ff",
                              border: "1px solid #3b82f6",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#1e40af",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#dbeafe";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#eff6ff";
                            }}
                          >
                            👤 Fiche
                          </button>
                          <button
                            onClick={() => handleOpenAssignModal(user)}
                            style={{
                              padding: "4px 8px",
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#3b82f6",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#e0f2fe";
                              e.currentTarget.style.borderColor = "#3b82f6";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#f1f5f9";
                              e.currentTarget.style.borderColor = "#e2e8f0";
                            }}
                          >
                            Gérer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                    )}
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

      {/* Modal d'affectation */}
      {showAssignModal && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setShowAssignModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
              animation: 'fadeIn 0.2s ease'
            }}
          />
          
          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              zIndex: 1000,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'slideUp 0.3s ease'
            }}
          >
            <style>
              {`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideUp {
                  from { 
                    opacity: 0;
                    transform: translate(-50%, -45%);
                  }
                  to { 
                    opacity: 1;
                    transform: translate(-50%, -50%);
                  }
                }
              `}
            </style>
            
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                Affecter des programmes
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
            
            {/* User info */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                Apprenant
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                {selectedUser?.name || selectedUser?.email}
              </div>
            </div>
            
            {/* Liste programmes */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '12px'
              }}>
                Sélectionne les programmes à affecter :
              </div>
              
              {availablePrograms.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '14px'
                }}>
                  Aucun programme disponible
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {availablePrograms.map(program => (
                    <label
                      key={program.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid',
                        borderColor: selectedPrograms.includes(program.id) ? '#3b82f6' : '#e5e7eb',
                        background: selectedPrograms.includes(program.id) ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedPrograms.includes(program.id)) {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedPrograms.includes(program.id)) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPrograms.includes(program.id)}
                        onChange={() => toggleProgram(program.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1e293b'
                        }}>
                          {program.name}
                        </div>
                        {program.description && (
                          <div style={{
                            fontSize: '12px',
                            color: '#64748b',
                            marginTop: '2px'
                          }}>
                            {program.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            {/* Compteur */}
            <div style={{
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#64748b',
              textAlign: 'center'
            }}>
              {selectedPrograms.length} programme{selectedPrograms.length > 1 ? 's' : ''} sélectionné{selectedPrograms.length > 1 ? 's' : ''}
            </div>
            
            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={assignLoading}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#64748b',
                  cursor: assignLoading ? 'not-allowed' : 'pointer',
                  opacity: assignLoading ? 0.5 : 1
                }}
              >
                Annuler
              </button>
              
              <button
                onClick={handleSaveAssignment}
                disabled={assignLoading}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: assignLoading ? 'not-allowed' : 'pointer',
                  opacity: assignLoading ? 0.7 : 1
                }}
              >
                {assignLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
