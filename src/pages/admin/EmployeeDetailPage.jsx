import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, User, Mail, Briefcase, FileText, Shield, Calendar, Eye, MoreVertical, Plus, Check } from 'lucide-react';

const CONTRAT_OPTIONS = [
  { value: '', label: 'Non défini' },
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Indépendant', label: 'Indépendant' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Alternance', label: 'Alternance' }
];

const ROLE_OPTIONS = [
  { value: 'learner', label: 'Apprenant' },
  { value: 'trainer', label: 'Formateur' },
  { value: 'admin', label: 'Administrateur' }
];

export default function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  
  const [employee, setEmployee] = useState(null);
  const [learningData, setLearningData] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [allPrograms, setAllPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // États pour les modals
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // États pour l'édition
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    poste: '',
    contrat: ''
  });
  const [saving, setSaving] = useState(false);
  
  // États pour l'assignation
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Charger les données de l'employé
  useEffect(() => {
    if (employeeId) {
      loadEmployeeData();
    }
  }, [employeeId]);

  async function loadEmployeeData() {
    setLoading(true);
    try {
      // 1. Charger le profil employee
      let employeeData = null;
      let assignedPrograms = [];
      
      // D'abord charger depuis /users (ancienne structure avec les vraies données)
      const userDoc = await getDoc(doc(db, 'users', employeeId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        assignedPrograms = userData.assignedPrograms || [];
        console.log('📦 assignedPrograms depuis /users:', assignedPrograms);
        
        employeeData = {
          id: userDoc.id,
          profile: {
            oderId: userDoc.id,
            email: userData.email,
            firstName: userData.firstName || userData.displayName?.split(' ')[0] || '',
            lastName: userData.lastName || userData.displayName?.split(' ')[1] || '',
            role: userData.role || 'learner',
            status: userData.status || 'active',
            poste: userData.poste || '',
            contrat: userData.contrat || '',
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
          }
        };
      }
      
      // Si pas trouvé, essayer nouvelle structure
      if (!employeeData && organizationId) {
        const empDoc = await getDoc(
          doc(db, 'organizations', organizationId, 'employees', employeeId)
        );
        
        if (empDoc.exists()) {
          employeeData = { id: empDoc.id, ...empDoc.data() };
          
          // Charger assignedPrograms depuis learning/data
          try {
            const learningDoc = await getDoc(
              doc(db, 'organizations', organizationId, 'employees', employeeId, 'learning', 'data')
            );
            if (learningDoc.exists()) {
              assignedPrograms = learningDoc.data().assignedPrograms || [];
            }
          } catch (e) {
            // Ignore
          }
        }
      }
      
      if (!employeeData) {
        setError('Employé non trouvé');
        setLoading(false);
        return;
      }
      
      setEmployee(employeeData);
      setLearningData({ assignedPrograms });
      setSelectedPrograms(assignedPrograms);
      
      setEditForm({
        firstName: employeeData.profile?.firstName || '',
        lastName: employeeData.profile?.lastName || '',
        poste: employeeData.profile?.poste || '',
        contrat: employeeData.profile?.contrat || ''
      });
      
      // 2. Charger TOUS les programmes
      let allProgramsList = [];
      
      // D'abord /programs (ancienne structure)
      const programsSnap = await getDocs(collection(db, 'programs'));
      if (programsSnap.size > 0) {
        allProgramsList = programsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('📚 Programmes depuis /programs:', allProgramsList.length);
      }
      
      // Si vide, essayer nouvelle structure
      if (allProgramsList.length === 0 && organizationId) {
        const orgProgramsSnap = await getDocs(
          collection(db, 'organizations', organizationId, 'programs')
        );
        allProgramsList = orgProgramsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      
      setAllPrograms(allProgramsList);
      console.log('📚 Total programmes:', allProgramsList.length);
      
      // 3. Construire la liste des programmes ASSIGNÉS avec leur progression
      const assignedProgramsWithProgress = [];
      
      for (const progId of assignedPrograms) {
        const prog = allProgramsList.find(p => p.id === progId);
        if (prog) {
          // Charger la progression depuis userProgress/{userId}/programs/{programId}
          let progress = { percentage: 0, status: 'not_started', completedLessons: [] };
          
          try {
            // La progression est dans une SOUS-COLLECTION
            const progressDoc = await getDoc(
              doc(db, 'userProgress', employeeId, 'programs', progId)
            );
            
            if (progressDoc.exists()) {
              const progressData = progressDoc.data();
              progress = {
                percentage: progressData.percentage || 0,
                status: progressData.percentage === 100 ? 'completed' : progressData.percentage > 0 ? 'in_progress' : 'not_started',
                completedLessons: progressData.completedLessons || [],
                currentLesson: progressData.currentLesson || null,
                lastAccessedAt: progressData.lastAccessedAt || null
              };
              console.log('✅ Progression pour', prog.title || prog.name, ':', progress.percentage + '%');
            } else {
              console.log('⚠️ Pas de progression pour', prog.title || prog.name);
            }
          } catch (e) {
            console.log('⚠️ Erreur chargement progression:', e.message);
          }
          
          assignedProgramsWithProgress.push({ ...prog, progress });
        } else {
          console.log('⚠️ Programme non trouvé dans la liste:', progId);
        }
      }
      
      setPrograms(assignedProgramsWithProgress);
      console.log('📊 Total programmes avec progression:', assignedProgramsWithProgress.length);
      
    } catch (err) {
      console.error('Erreur chargement employé:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  // ⚠️ FONCTION DÉPRÉCIÉE - La logique est maintenant intégrée dans loadEmployeeData()
  // Cette fonction n'est plus utilisée car elle causait des problèmes de dépendance avec selectedPrograms
  /*
  async function loadAllPrograms() {
    // Cette fonction est maintenant intégrée dans loadEmployeeData()
    // pour éviter les problèmes de timing avec selectedPrograms
  }
  */

  // Sauvegarder les modifications du profil
  async function handleSaveProfile() {
    setSaving(true);
    try {
      // Mettre à jour nouvelle structure
      await updateDoc(
        doc(db, 'organizations', organizationId, 'employees', employeeId),
        {
          'profile.firstName': editForm.firstName,
          'profile.lastName': editForm.lastName,
          'profile.poste': editForm.poste,
          'profile.contrat': editForm.contrat,
          'profile.updatedAt': serverTimestamp()
        }
      );
      
      // Mettre à jour ancienne structure aussi
      try {
        await updateDoc(doc(db, 'users', employeeId), {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          poste: editForm.poste,
          contrat: editForm.contrat,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        // Ignore si ancienne structure n'existe pas
      }
      
      // Recharger
      await loadEmployeeData();
      setShowEditModal(false);
      alert('✅ Profil mis à jour !');
      
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  // Changer le rôle
  async function handleChangeRole(newRole) {
    setSaving(true);
    try {
      await updateDoc(
        doc(db, 'organizations', organizationId, 'employees', employeeId),
        {
          'profile.role': newRole,
          'profile.updatedAt': serverTimestamp()
        }
      );
      
      try {
        await updateDoc(doc(db, 'users', employeeId), {
          role: newRole,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        // Ignore si ancienne structure n'existe pas
      }
      
      await loadEmployeeData();
      setShowRoleModal(false);
      alert('✅ Rôle mis à jour !');
      
    } catch (err) {
      console.error('Erreur changement rôle:', err);
      alert('❌ Erreur lors du changement de rôle');
    } finally {
      setSaving(false);
    }
  }

  // Activer/Désactiver
  async function handleToggleStatus() {
    const newStatus = employee.profile?.status === 'active' ? 'inactive' : 'active';
    const confirmMsg = newStatus === 'inactive' 
      ? 'Voulez-vous désactiver ce compte ?' 
      : 'Voulez-vous réactiver ce compte ?';
    
    if (!window.confirm(confirmMsg)) return;
    
    setSaving(true);
    try {
      await updateDoc(
        doc(db, 'organizations', organizationId, 'employees', employeeId),
        {
          'profile.status': newStatus,
          'profile.updatedAt': serverTimestamp()
        }
      );
      
      await loadEmployeeData();
      setShowActionsMenu(false);
      alert(`✅ Compte ${newStatus === 'active' ? 'activé' : 'désactivé'} !`);
      
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur');
    } finally {
      setSaving(false);
    }
  }

  // Assigner des programmes
  async function handleSaveAssignment() {
    setAssignLoading(true);
    try {
      // 1. Mettre à jour l'ancienne structure /users (prioritaire)
      await updateDoc(doc(db, 'users', employeeId), {
        assignedPrograms: selectedPrograms
      });
      console.log('✅ /users mis à jour');
      
      // 2. Aussi mettre à jour la nouvelle structure si elle existe
      try {
        const learningDataRef = doc(db, 'organizations', organizationId, 'employees', employeeId, 'learning', 'data');
        const learningDoc = await getDoc(learningDataRef);
        
        if (learningDoc.exists()) {
          await updateDoc(learningDataRef, {
            assignedPrograms: selectedPrograms,
            lastActivityAt: serverTimestamp()
          });
        } else {
          // Créer le document s'il n'existe pas
          const { setDoc } = await import('firebase/firestore');
          await setDoc(learningDataRef, {
            assignedPrograms: selectedPrograms,
            lastActivityAt: serverTimestamp()
          });
        }
        console.log('✅ Nouvelle structure mise à jour');
      } catch (e) {
        console.log('⚠️ Nouvelle structure non mise à jour:', e.message);
      }
      
      await loadEmployeeData(); // Recharge tout (profil + programmes + progressions)
      setShowAssignModal(false);
      alert('✅ Programmes assignés !');
      
    } catch (err) {
      console.error('Erreur assignation:', err);
      alert('❌ Erreur lors de l\'assignation');
    } finally {
      setAssignLoading(false);
    }
  }

  // Retirer un programme
  async function handleRemoveProgram(programId) {
    if (!window.confirm('Retirer ce programme de l\'apprenant ?')) return;
    
    const newAssigned = selectedPrograms.filter(id => id !== programId);
    setSelectedPrograms(newAssigned);
    
    try {
      // 1. Mettre à jour /users
      await updateDoc(doc(db, 'users', employeeId), {
        assignedPrograms: newAssigned
      });
      
      // 2. Mettre à jour nouvelle structure
      try {
        await updateDoc(
          doc(db, 'organizations', organizationId, 'employees', employeeId, 'learning', 'data'),
          { assignedPrograms: newAssigned }
        );
      } catch (e) {
        // Ignore si nouvelle structure n'existe pas
      }
      
      setPrograms(programs.filter(p => p.id !== programId));
      alert('✅ Programme retiré !');
      
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur');
    }
  }

  // Ouvrir vue apprenant dans nouvel onglet
  function handleViewAsEmployee() {
    // Stocker l'ID pour le mode "voir comme"
    localStorage.setItem('viewAsUserId', employeeId);
    localStorage.setItem('viewAsUserEmail', employee.profile?.email || '');
    localStorage.setItem('viewAsUserName', 
      [employee.profile?.firstName, employee.profile?.lastName].filter(Boolean).join(' ') || 
      employee.profile?.email?.split('@')[0] || 'Utilisateur'
    );
    
    // Ouvrir dans un nouvel onglet avec un paramètre
    window.open(`/apprenant/dashboard?viewAs=${employeeId}`, '_blank');
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>
        <button onClick={() => navigate('/admin/users')} style={{
          padding: '10px 20px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          Retour à la liste
        </button>
      </div>
    );
  }

  const profile = employee?.profile || {};
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email?.split('@')[0] || 'Sans nom';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc', 
      padding: '24px' 
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/admin/users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#64748b'
              }}
            >
              <ArrowLeft size={18} />
              Retour
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              Fiche Employé
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleViewAsEmployee}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              <Eye size={18} />
              Voir son compte
            </button>
            
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                <MoreVertical size={20} color="#64748b" />
              </button>
              
              {showActionsMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  zIndex: 100,
                  minWidth: '180px'
                }}>
                  <button
                    onClick={() => { setShowEditModal(true); setShowActionsMenu(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#1e293b',
                      textAlign: 'left'
                    }}
                  >
                    ✏️ Modifier profil
                  </button>
                  <button
                    onClick={() => { setShowRoleModal(true); setShowActionsMenu(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#1e293b',
                      textAlign: 'left'
                    }}
                  >
                    🔄 Changer rôle
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: profile.status === 'active' ? '#ef4444' : '#10b981',
                      textAlign: 'left'
                    }}
                  >
                    {profile.status === 'active' ? '⏸️ Désactiver' : '▶️ Activer'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Profil */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <User size={36} color="#6366f1" />
            </div>
            
            {/* Infos */}
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                fontSize: '22px', 
                fontWeight: '700', 
                color: '#1e293b', 
                marginBottom: '4px' 
              }}>
                {displayName}
              </h2>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: '#64748b',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                <Mail size={16} />
                {profile.email}
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={16} color="#64748b" />
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Poste:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                    {profile.poste || 'Non défini'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="#64748b" />
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Contrat:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                    {profile.contrat || 'Non défini'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} color="#64748b" />
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Rôle:</span>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: profile.role === 'admin' ? '#fef3c7' : profile.role === 'trainer' ? '#dbeafe' : '#dcfce7',
                    color: profile.role === 'admin' ? '#92400e' : profile.role === 'trainer' ? '#1e40af' : '#166534'
                  }}>
                    {profile.role === 'admin' ? 'Admin' : profile.role === 'trainer' ? 'Formateur' : 'Apprenant'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: profile.status === 'active' ? '#10b981' : '#ef4444'
                  }} />
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Statut:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: profile.status === 'active' ? '#10b981' : '#ef4444' }}>
                    {profile.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="#64748b" />
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Membre depuis:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                    {profile.createdAt?.toDate 
                      ? new Date(profile.createdAt.toDate()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Non disponible'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Programmes */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              📚 Programmes assignés
            </h3>
            <button
              onClick={() => setShowAssignModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              <Plus size={16} />
              Assigner
            </button>
          </div>
          
          {programs.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#94a3b8',
              background: '#f8fafc',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
              Aucun programme assigné
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {programs.map(prog => (
                <div 
                  key={prog.id}
                  style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px' }}>
                          {prog.progress?.percentage === 100 ? '📗' : '📘'}
                        </span>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                          {prog.title || prog.name || 'Programme sans titre'}
                        </span>
                        {prog.progress?.percentage === 100 && (
                          <span style={{ color: '#10b981', fontSize: '14px' }}>✅</span>
                        )}
                      </div>
                      
                      {/* Barre de progression */}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{
                          height: '8px',
                          background: '#e2e8f0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${prog.progress?.percentage || 0}%`,
                            background: prog.progress?.percentage === 100 
                              ? 'linear-gradient(135deg, #10b981, #059669)'
                              : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            borderRadius: '4px',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          {prog.progress?.percentage || 0}% complété
                          {prog.progress?.completedAt && (
                            <span> • Terminé le {new Date(prog.progress.completedAt.toDate()).toLocaleDateString('fr-FR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveProgram(prog.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Modifier Profil */}
      {showEditModal && (
        <>
          <div onClick={() => setShowEditModal(false)} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 999
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: '16px', padding: '24px',
            width: '90%', maxWidth: '450px', zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Modifier le profil</h3>
              <button onClick={() => setShowEditModal(false)} style={{
                background: '#f1f5f9', border: 'none', borderRadius: '8px',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px'
              }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Prénom</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Nom</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Poste</label>
                <input
                  type="text"
                  value={editForm.poste}
                  onChange={(e) => setEditForm({ ...editForm, poste: e.target.value })}
                  placeholder="Ex: Développeur, Commercial..."
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Contrat</label>
                <select
                  value={editForm.contrat}
                  onChange={(e) => setEditForm({ ...editForm, contrat: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', fontSize: '14px'
                  }}
                >
                  {CONTRAT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowEditModal(false)} style={{
                padding: '10px 20px', background: '#f1f5f9', border: 'none',
                borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>Annuler</button>
              <button onClick={handleSaveProfile} disabled={saving} style={{
                padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1
              }}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </>
      )}

      {/* Modal Changer Rôle */}
      {showRoleModal && (
        <>
          <div onClick={() => setShowRoleModal(false)} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 999
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: '16px', padding: '24px',
            width: '90%', maxWidth: '350px', zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Changer le rôle</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleChangeRole(opt.value)}
                  disabled={saving}
                  style={{
                    padding: '12px 16px',
                    background: profile.role === opt.value ? '#eff6ff' : '#f8fafc',
                    border: profile.role === opt.value ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  {opt.label}
                  {profile.role === opt.value && <Check size={18} color="#3b82f6" />}
                </button>
              ))}
            </div>
            
            <button onClick={() => setShowRoleModal(false)} style={{
              width: '100%', marginTop: '16px', padding: '10px',
              background: '#f1f5f9', border: 'none', borderRadius: '8px',
              fontSize: '14px', cursor: 'pointer'
            }}>Annuler</button>
          </div>
        </>
      )}

      {/* Modal Assigner Programmes */}
      {showAssignModal && (
        <>
          <div onClick={() => setShowAssignModal(false)} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 999
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: '16px', padding: '24px',
            width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto',
            zIndex: 1000, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Assigner des programmes</h3>
              <button onClick={() => setShowAssignModal(false)} style={{
                background: '#f1f5f9', border: 'none', borderRadius: '8px',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px'
              }}>✕</button>
            </div>
            
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Apprenant</div>
              <div style={{ fontSize: '15px', fontWeight: '600' }}>{displayName}</div>
            </div>
            
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              Programmes disponibles :
            </div>
            
            {allPrograms.filter(p => !selectedPrograms.includes(p.id)).length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                Tous les programmes sont déjà assignés
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {allPrograms.filter(p => !selectedPrograms.includes(p.id)).map(prog => (
                  <label key={prog.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', borderRadius: '10px',
                    border: '2px solid #e2e8f0', cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedPrograms.includes(prog.id)}
                      onChange={() => {
                        setSelectedPrograms(prev => 
                          prev.includes(prog.id) 
                            ? prev.filter(id => id !== prog.id)
                            : [...prev, prog.id]
                        );
                      }}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{prog.title || prog.name}</div>
                      {prog.description && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{prog.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAssignModal(false)} style={{
                padding: '10px 20px', background: '#f1f5f9', border: 'none',
                borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>Annuler</button>
              <button onClick={handleSaveAssignment} disabled={assignLoading} style={{
                padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600', cursor: assignLoading ? 'not-allowed' : 'pointer'
              }}>{assignLoading ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </>
      )}
      
      {/* Clic hors menu pour fermer */}
      {showActionsMenu && (
        <div 
          onClick={() => setShowActionsMenu(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}
        />
      )}
    </div>
  );
}
