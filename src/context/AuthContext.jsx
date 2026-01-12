// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const AuthContext = createContext();

// Hook personnalisé pour utiliser facilement AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser(firebaseUser);
            setUserRole(userData.role || "learner");
          } else {
            const newUserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: "learner",
              displayName: firebaseUser.displayName || firebaseUser.email.split("@")[0],
              createdAt: serverTimestamp(),
            };

            await setDoc(userDocRef, newUserData);

            setUser(firebaseUser);
            setUserRole("learner");
          }
        } catch (error) {
          setUser(firebaseUser);
          setUserRole("learner");
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fonction de déconnexion
  const logout = async () => {
    console.log("🔓 Logout function called");
    await signOut(auth);
  };

  console.log("🎯 Current user role:", userRole);

  return (
    <AuthContext.Provider value={{ 
      user, 
      currentUser: user,
      userRole, 
      loading,
      logout 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
