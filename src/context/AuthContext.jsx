import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Créer le contexte
const AuthContext = createContext();

// Hook personnalisé
export const useAuth = () => useContext(AuthContext);

// Organisation par défaut
const DEFAULT_ORG_ID = 'org_default';

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [organizationInfo, setOrganizationInfo] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Mode "Voir comme" - pour les admins qui veulent voir le compte d'un apprenant
  const [viewAsUserId, setViewAsUserId] = useState(null);

  useEffect(() => {
    // Vérifier si on est en mode "viewAs" au chargement
    const savedViewAsUserId = localStorage.getItem('viewAsUserId');
    if (savedViewAsUserId) {
      setViewAsUserId(savedViewAsUserId);
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.email);
      
      // Si mode "viewAs" activé, charger les données de l'utilisateur cible
      const targetUserId = savedViewAsUserId || viewAsUserId;
      
      if (firebaseUser && targetUserId) {
        console.log('👁️ Mode "Voir comme" activé pour:', targetUserId);
        
        try {
          // D'abord, récupérer l'organizationId de l'utilisateur cible depuis /users
          const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
          const targetOrgId = targetUserDoc.exists() 
            ? (targetUserDoc.data().organizationId || DEFAULT_ORG_ID)
            : DEFAULT_ORG_ID;
          
          console.log('👁️ organizationId de l\'utilisateur cible:', targetOrgId);
          
          // Charger les données de l'utilisateur cible depuis son organisation
          const targetEmployeeDoc = await getDoc(
            doc(db, 'organizations', targetOrgId, 'employees', targetUserId)
          );
          
          if (targetEmployeeDoc.exists()) {
            const targetData = targetEmployeeDoc.data();
            const targetProfile = targetData.profile || {};
            
            // Créer un user object modifié
            const viewAsUser = {
              ...firebaseUser,
              uid: targetUserId,
              email: targetProfile.email,
              displayName: `${targetProfile.firstName || ''} ${targetProfile.lastName || ''}`.trim()
            };
            
            setUser(viewAsUser);
            setEmployeeData(targetData);
            setUserRole(targetProfile.role || 'learner');
            setOrganizationId(targetOrgId);
            setIsSuperAdmin(false);
            setLoading(false);
            
            console.log('✅ Mode "Voir comme" activé avec succès pour org:', targetOrgId);
            return;
          }
        } catch (error) {
          console.error('❌ Erreur mode "Voir comme":', error);
          // Nettoyer le mode viewAs en cas d'erreur
          localStorage.removeItem('viewAsUserId');
          localStorage.removeItem('viewAsUserEmail');
          setViewAsUserId(null);
        }
      }
      
      if (firebaseUser) {
        setUser(firebaseUser);

        try {
          // 1. Vérifier si Super Admin
          const superAdminDoc = await getDoc(
            doc(db, 'platformAdmins', firebaseUser.uid)
          );
          
          if (superAdminDoc.exists()) {
            console.log('👑 Super Admin détecté');
            setIsSuperAdmin(true);
            setUserRole('superadmin');
            setEmployeeData(superAdminDoc.data());
            
            // Super Admin a accès à l'org par défaut pour pouvoir tester
            setOrganizationId(DEFAULT_ORG_ID);
            
            // Charger les infos de l'org par défaut
            try {
              const orgDoc = await getDoc(doc(db, 'organizations', DEFAULT_ORG_ID));
              if (orgDoc.exists()) {
                setOrganizationInfo(orgDoc.data());
                console.log('🏢 Organisation chargée pour Super Admin:', DEFAULT_ORG_ID);
              }
            } catch (e) {
              console.log('⚠️ Impossible de charger l\'organisation par défaut');
            }
            
            setLoading(false);
            return;
          }

          // 2. Chercher d'abord dans /users pour récupérer l'organizationId
          setIsSuperAdmin(false);
          
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let userOrgId = DEFAULT_ORG_ID;
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userOrgId = userData.organizationId || DEFAULT_ORG_ID;
            console.log('📦 organizationId depuis /users:', userOrgId);
          }
          
          // Puis chercher dans employees avec le bon organizationId
          const employeeDoc = await getDoc(
            doc(db, 'organizations', userOrgId, 'employees', firebaseUser.uid)
          );
          
          if (employeeDoc.exists()) {
            const empData = employeeDoc.data();
            const profile = empData.profile || {};
            
            console.log('👤 Employee trouvé:', profile.email, '- Role:', profile.role, '- Org:', userOrgId);
            
            setEmployeeData(empData);
            setUserRole(profile.role || 'learner');
            setOrganizationId(userOrgId);
            
            const orgDoc = await getDoc(doc(db, 'organizations', userOrgId));
            if (orgDoc.exists()) {
              setOrganizationInfo(orgDoc.data());
            }
          } else {
            // 3. Fallback ancienne structure /users
            console.log('⚠️ Fallback: Employee non trouvé, utilisation des données /users');
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('📦 User trouvé (ancienne structure):', userData.email);
              console.log('📦 organizationId depuis /users:', userData.organizationId);
              
              setUserRole(userData.role || 'learner');
              
              // Utiliser l'organizationId du document, sinon fallback sur org_default
              const orgId = userData.organizationId || DEFAULT_ORG_ID;
              setOrganizationId(orgId);
              setEmployeeData({ profile: userData });
              console.log('✅ organizationId défini:', orgId);
              
              const orgDoc = await getDoc(doc(db, 'organizations', orgId));
              if (orgDoc.exists()) {
                setOrganizationInfo(orgDoc.data());
              }
            } else {
              console.log('❌ Utilisateur non trouvé dans /users');
              setUserRole(null);
              setOrganizationId(null);
            }
          }
          
        } catch (error) {
          console.error('❌ Erreur AuthContext:', error);
          setUserRole(null);
          setOrganizationId(null);
        }
        
      } else {
        setUser(null);
        setUserRole(null);
        setOrganizationId(null);
        setOrganizationInfo(null);
        setIsSuperAdmin(false);
        setEmployeeData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [viewAsUserId]);

  // Helpers pour les chemins Firebase
  const getEmployeePath = (userId = null) => {
    const id = userId || user?.uid;
    if (!organizationId || !id) return null;
    return `organizations/${organizationId}/employees/${id}`;
  };

  const getLearningPath = (userId = null) => {
    const id = userId || user?.uid;
    if (!organizationId || !id) return null;
    return `organizations/${organizationId}/employees/${id}/learning`;
  };

  const getProgramsPath = () => {
    if (!organizationId) return 'programs';
    return `organizations/${organizationId}/programs`;
  };

  const getOrgPath = () => {
    if (!organizationId) return null;
    return `organizations/${organizationId}`;
  };

  // Fonction pour activer le mode "viewAs"
  const enableViewAs = (userId) => {
    setViewAsUserId(userId);
    localStorage.setItem('viewAsUserId', userId);
  };
  
  // Fonction pour désactiver le mode "viewAs"
  const disableViewAs = () => {
    setViewAsUserId(null);
    localStorage.removeItem('viewAsUserId');
    localStorage.removeItem('viewAsUserEmail');
    window.location.reload(); // Recharger pour revenir à l'état normal
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      console.log('🚪 Déconnexion en cours...');
      
      // Nettoyer le mode "viewAs" si actif
      if (viewAsUserId) {
        localStorage.removeItem('viewAsUserId');
        localStorage.removeItem('viewAsUserEmail');
        localStorage.removeItem('viewAsUserName');
        setViewAsUserId(null);
      }
      
      // Déconnexion Firebase
      await signOut(auth);
      
      // Réinitialiser les états
      setUser(null);
      setUserRole(null);
      setEmployeeData(null);
      setOrganizationId(null);
      setOrganizationInfo(null);
      setIsSuperAdmin(false);
      
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    isSuperAdmin,
    isAdmin: userRole === 'admin' || isSuperAdmin,
    isTrainer: userRole === 'trainer',
    isLearner: userRole === 'learner',
    organizationId,
    organizationInfo,
    employeeData,
    loading,
    viewAsUserId,
    enableViewAs,
    disableViewAs,
    logout,
    getEmployeePath,
    getLearningPath,
    getProgramsPath,
    getOrgPath,
    DEFAULT_ORG_ID
  };

  console.log('🎯 AuthContext:', { email: user?.email, userRole, isSuperAdmin, organizationId });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export du contexte pour useContext direct si nécessaire
export { AuthContext };

export default AuthProvider;
