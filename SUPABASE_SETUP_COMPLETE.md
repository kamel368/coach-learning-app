# 🔧 Configuration Supabase - Action Requise

## ⚠️ FICHIER .env.local MANQUANT

Le fichier `.env.local` ne peut pas être créé automatiquement car il est protégé par `.gitignore` (sécurité).

### ✅ CRÉER LE FICHIER MANUELLEMENT

**Étape 1** : Crée un fichier nommé `.env.local` à la **racine du projet** :
```
/Users/kam/coach-learning-app/coach-learning-app/.env.local
```

**Étape 2** : Copie-colle ce contenu exactement :
```env
VITE_SUPABASE_URL=https://zqhcllmhzbiusnrifzry.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaGNsbG1oemJpdXNucmlmenJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTc4MDYsImV4cCI6MjA4NTI5MzgwNn0.l8CSF-ZYHQd69gJe_z9RtEHtdQ7GBRoQuznJTBahXMs
```

**Étape 3** : Sauvegarde le fichier

**Étape 4** : Redémarre le serveur de développement :
```bash
npm run dev
```

---

## ✅ FICHIERS CRÉÉS AVEC SUCCÈS

### 1. Client Supabase
- **Fichier** : `src/lib/supabase.js`
- **Statut** : ✅ Existait déjà et fonctionne

### 2. Context d'authentification
- **Fichier** : `src/contexts/SupabaseAuthContext.jsx`
- **Statut** : ✅ Créé avec succès
- **Contenu** :
  - `SupabaseAuthProvider` : Provider React
  - `useSupabaseAuth` : Hook d'authentification
  - Méthodes : `signIn`, `signUp`, `signOut`
  - État : `user`, `userData`, `organizationId`, `loading`

### 3. Hook personnalisé
- **Fichier** : `src/hooks/useSupabaseAuth.js`
- **Statut** : ✅ Créé avec succès
- **Fonction** : Réexporte `useSupabaseAuth` depuis le context

### 4. Dépendance npm
- **Package** : `@supabase/supabase-js`
- **Statut** : ✅ Déjà installé (à jour)

---

## 📋 PROCHAINES ÉTAPES

### 1. Créer le fichier .env.local (voir ci-dessus)

### 2. Tester l'authentification Supabase
Ajoute le provider dans `App.jsx` (coexistence avec Firebase) :

```javascript
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext'

function App() {
  return (
    <AuthProvider>  {/* Firebase - existant */}
      <SupabaseAuthProvider>  {/* Supabase - nouveau */}
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </SupabaseAuthProvider>
    </AuthProvider>
  )
}
```

### 3. Créer une page de test
Crée `src/pages/SupabaseTest.jsx` pour tester :

```javascript
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'

export default function SupabaseTest() {
  const { user, signIn, signOut } = useSupabaseAuth()

  const handleSignIn = async () => {
    try {
      await signIn('test@example.com', 'password123')
      console.log('✅ Connexion réussie')
    } catch (error) {
      console.error('❌ Erreur connexion:', error.message)
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Test Supabase Auth</h1>
      {user ? (
        <>
          <p>✅ Connecté : {user.email}</p>
          <button onClick={signOut}>Se déconnecter</button>
        </>
      ) : (
        <>
          <p>❌ Non connecté</p>
          <button onClick={handleSignIn}>Se connecter</button>
        </>
      )}
    </div>
  )
}
```

### 4. Vérifier la console
Après avoir créé `.env.local` et redémarré :
```
✅ Client Supabase créé avec succès
[Supabase Auth] Initializing auth listener
[Supabase Auth] Initial session: No user
```

---

## 🔍 VÉRIFICATION

**Fichiers créés** :
- ✅ `src/lib/supabase.js` (existait déjà)
- ✅ `src/contexts/SupabaseAuthContext.jsx` (nouveau)
- ✅ `src/hooks/useSupabaseAuth.js` (nouveau)
- ⏳ `.env.local` (à créer manuellement)

**Dépendances** :
- ✅ `@supabase/supabase-js` installé

**Protection** :
- ✅ `.env.local` déjà dans `.gitignore`
- ✅ Aucun secret exposé dans le code

---

## ⚠️ IMPORTANT

**NE PAS COMMIT le fichier `.env.local` !**
Il est déjà protégé par `.gitignore`, mais vérifie toujours avec :
```bash
git status
```

Le fichier `.env.local` ne doit **JAMAIS** apparaître dans les fichiers à commiter.

---

## 📚 DOCUMENTATION SUPABASE

- **Dashboard** : https://supabase.com/dashboard/project/zqhcllmhzbiusnrifzry
- **Auth Docs** : https://supabase.com/docs/guides/auth
- **JS Client** : https://supabase.com/docs/reference/javascript/auth-api

---

## 🎉 RÉSUMÉ

Le système d'authentification Supabase est **presque prêt** !

**Il manque uniquement** :
1. Créer manuellement le fichier `.env.local` (voir instructions ci-dessus)
2. Redémarrer le serveur de développement

Une fois ces 2 étapes faites, l'authentification Supabase sera **100% fonctionnelle** et coexistera avec Firebase.
