import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.email);
      
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

          // 2. Chercher dans employees (nouvelle structure)
          setIsSuperAdmin(false);
          
          const employeeDoc = await getDoc(
            doc(db, 'organizations', DEFAULT_ORG_ID, 'employees', firebaseUser.uid)
          );
          
          if (employeeDoc.exists()) {
            const empData = employeeDoc.data();
            const profile = empData.profile || {};
            
            console.log('👤 Employee trouvé:', profile.email, '- Role:', profile.role);
            
            setEmployeeData(empData);
            setUserRole(profile.role || 'learner');
            setOrganizationId(DEFAULT_ORG_ID);
            
            const orgDoc = await getDoc(doc(db, 'organizations', DEFAULT_ORG_ID));
            if (orgDoc.exists()) {
              setOrganizationInfo(orgDoc.data());
            }
          } else {
            // 3. Fallback ancienne structure /users
            console.log('⚠️ Vérification ancienne structure /users...');
            
            const oldUserDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (oldUserDoc.exists()) {
              const userData = oldUserDoc.data();
              console.log('📦 User trouvé (ancienne structure):', userData.email);
              
              setUserRole(userData.role || 'learner');
              setOrganizationId(DEFAULT_ORG_ID);
              setEmployeeData({ profile: userData });
              
              const orgDoc = await getDoc(doc(db, 'organizations', DEFAULT_ORG_ID));
              if (orgDoc.exists()) {
                setOrganizationInfo(orgDoc.data());
              }
            } else {
              console.log('❌ Utilisateur non trouvé');
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
  }, []);

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
