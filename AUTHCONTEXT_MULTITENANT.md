# 🔐 AuthContext Multi-Tenant

## 🎯 Objectif

Le fichier `src/context/AuthContext.jsx` a été modifié pour supporter la **nouvelle structure multi-tenant** après la migration Firebase.

---

## 🔄 Changements Principaux

### **AVANT (Structure plate)**

```javascript
// Simple vérification dans /users
const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
if (userDoc.exists()) {
  setUserRole(userData.role || 'learner');
}
```

**Retournait :**
- `user` : Objet Firebase Auth
- `userRole` : `'admin'` ou `'learner'`
- `loading` : État de chargement

---

### **APRÈS (Structure multi-tenant)**

```javascript
// 1. Vérifier si Super Admin
const superAdminDoc = await getDoc(doc(db, 'platformAdmins', firebaseUser.uid));

// 2. Sinon, chercher dans employees
const employeeDoc = await getDoc(
  doc(db, 'organizations', DEFAULT_ORG_ID, 'employees', firebaseUser.uid)
);

// 3. Fallback sur ancienne structure /users
const oldUserDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
```

**Retourne maintenant :**
- `user` : Objet Firebase Auth
- `userRole` : `'superadmin'` | `'admin'` | `'trainer'` | `'learner'`
- `isSuperAdmin` : `true` si super admin
- `isAdmin` : `true` si admin ou super admin
- `isTrainer` : `true` si trainer
- `isLearner` : `true` si learner
- `organizationId` : ID de l'organisation (ex: `'org_default'`)
- `organizationInfo` : Données de l'organisation
- `employeeData` : Données complètes de l'employee
- `loading` : État de chargement
- **Helpers** : `getEmployeePath()`, `getLearningPath()`, `getProgramsPath()`, `getOrgPath()`

---

## 🏗️ Architecture de Détection

### **Étape 1 : Vérifier Super Admin**

```javascript
const superAdminDoc = await getDoc(doc(db, 'platformAdmins', firebaseUser.uid));

if (superAdminDoc.exists()) {
  setIsSuperAdmin(true);
  setUserRole('superadmin');
  setOrganizationId(null);  // Pas d'organisation pour un super admin
  setEmployeeData(superAdminDoc.data());
  return;
}
```

**Si trouvé :**
- ✅ Super Admin (accès à toutes les organisations)
- ✅ Pas d'organisation spécifique
- ✅ Données depuis `/platformAdmins/{uid}`

---

### **Étape 2 : Chercher Employee**

```javascript
const employeeDoc = await getDoc(
  doc(db, 'organizations', DEFAULT_ORG_ID, 'employees', firebaseUser.uid)
);

if (employeeDoc.exists()) {
  const empData = employeeDoc.data();
  const profile = empData.profile || {};
  
  setEmployeeData(empData);
  setUserRole(profile.role || 'learner');
  setOrganizationId(DEFAULT_ORG_ID);
  
  // Charger les infos de l'organisation
  const orgDoc = await getDoc(doc(db, 'organizations', DEFAULT_ORG_ID));
  if (orgDoc.exists()) {
    setOrganizationInfo(orgDoc.data());
  }
}
```

**Si trouvé :**
- ✅ Employee (admin, trainer ou learner)
- ✅ Appartient à `org_default`
- ✅ Données depuis `/organizations/org_default/employees/{uid}`

---

### **Étape 3 : Fallback Ancienne Structure**

```javascript
const oldUserDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

if (oldUserDoc.exists()) {
  const userData = oldUserDoc.data();
  
  setUserRole(userData.role || 'learner');
  setOrganizationId(DEFAULT_ORG_ID);
  setEmployeeData({ profile: userData });
  
  // Charger les infos de l'organisation
  const orgDoc = await getDoc(doc(db, 'organizations', DEFAULT_ORG_ID));
  if (orgDoc.exists()) {
    setOrganizationInfo(orgDoc.data());
  }
}
```

**Si trouvé :**
- ⚠️ Ancienne structure (utilisateur pas encore migré)
- ✅ Fonctionne quand même grâce au fallback
- ✅ Données depuis `/users/{uid}` (ancienne structure)

**Pourquoi ce fallback ?**
- Permet à l'application de fonctionner **avant ET après** la migration
- Les utilisateurs peuvent se connecter même si Step 2 n'est pas encore exécuté
- Transition douce sans interruption de service

---

## 📦 Nouvelles Propriétés du Contexte

### **1. Rôle et Permissions**

```javascript
const { 
  userRole,      // 'superadmin' | 'admin' | 'trainer' | 'learner'
  isSuperAdmin,  // true/false
  isAdmin,       // true si admin OU superadmin
  isTrainer,     // true si trainer
  isLearner      // true si learner
} = useAuth();
```

**Usage :**

```javascript
// Vérifier si c'est un super admin
if (isSuperAdmin) {
  // Afficher le sélecteur d'organisation
}

// Vérifier si c'est un admin (ou super admin)
if (isAdmin) {
  // Afficher le panneau d'administration
}

// Vérifier le rôle exact
if (userRole === 'trainer') {
  // Afficher les fonctionnalités du formateur
}
```

---

### **2. Organisation**

```javascript
const { 
  organizationId,    // 'org_default' ou null (super admin)
  organizationInfo   // { info: {...}, modules: [...], status: 'active', ... }
} = useAuth();
```

**Usage :**

```javascript
// Afficher le nom de l'organisation
if (organizationInfo) {
  console.log('Organisation:', organizationInfo.info.name);
}

// Vérifier les modules actifs
if (organizationInfo?.modules.includes('learning')) {
  // Module learning activé
}
```

---

### **3. Données Employee**

```javascript
const { 
  employeeData  // { profile: { userId, email, firstName, lastName, role, status }, ... }
} = useAuth();
```

**Usage :**

```javascript
// Afficher le nom complet
const fullName = `${employeeData?.profile.firstName} ${employeeData?.profile.lastName}`;

// Vérifier le statut
if (employeeData?.profile.status === 'active') {
  // Compte actif
}
```

---

### **4. Helpers pour les Chemins Firebase**

```javascript
const { 
  getEmployeePath,   // (userId?) => 'organizations/{orgId}/employees/{userId}'
  getLearningPath,   // (userId?) => 'organizations/{orgId}/employees/{userId}/learning'
  getProgramsPath,   // () => 'organizations/{orgId}/programs'
  getOrgPath         // () => 'organizations/{orgId}'
} = useAuth();
```

**Usage :**

```javascript
// Récupérer le profil de l'utilisateur connecté
const employeePath = getEmployeePath();
const employeeRef = doc(db, employeePath);
const employeeDoc = await getDoc(employeeRef);

// Récupérer les données learning d'un autre utilisateur
const learningPath = getLearningPath('otherUserId');
const gamifRef = doc(db, learningPath, 'gamification');

// Récupérer la liste des programmes
const programsPath = getProgramsPath();
const programsRef = collection(db, programsPath);
const programsSnapshot = await getDocs(programsRef);

// Récupérer les infos de l'organisation
const orgPath = getOrgPath();
const orgRef = doc(db, orgPath);
const orgDoc = await getDoc(orgRef);
```

**Avantages :**
- ✅ Centralisation des chemins Firebase
- ✅ Pas besoin de se souvenir de la structure exacte
- ✅ Facilite les migrations futures
- ✅ Code plus maintenable

---

## 🔄 Compatibilité Avant/Après Migration

### **Scénario 1 : AVANT la migration (Step 1/2/3 pas encore exécutés)**

```
Firebase Database:
/users/
  └─ {userId}/
      ├─ email: "kam@example.com"
      ├─ role: "learner"
      └─ ...

/programs/
  └─ {programId}/...
```

**Comportement de l'AuthContext :**
1. ❌ Super Admin non trouvé dans `/platformAdmins/{uid}`
2. ❌ Employee non trouvé dans `/organizations/org_default/employees/{uid}`
3. ✅ **Fallback sur `/users/{uid}`**
4. ✅ Utilisateur connecté avec `userRole: 'learner'`

**Résultat :**
- ✅ L'application fonctionne normalement
- ✅ `getProgramsPath()` retourne `'programs'` (ancienne structure)

---

### **Scénario 2 : APRÈS la migration (Step 1/2/3 exécutés)**

```
Firebase Database:
/platformSettings/config
/platformAdmins/{superAdminId}
/organizations/org_default/
  ├─ employees/{userId}/
  │   ├─ profile: {...}
  │   └─ learning/...
  └─ programs/{programId}/...

/users/{userId}/           ← Ancienne structure toujours présente
```

**Comportement de l'AuthContext :**

**Pour un super admin :**
1. ✅ **Super Admin trouvé dans `/platformAdmins/{uid}`**
2. ✅ `isSuperAdmin: true`, `userRole: 'superadmin'`
3. ✅ Pas d'organisation spécifique

**Pour un employee :**
1. ❌ Super Admin non trouvé
2. ✅ **Employee trouvé dans `/organizations/org_default/employees/{uid}`**
3. ✅ `organizationId: 'org_default'`, `userRole: 'learner'` (ou 'admin')

**Résultat :**
- ✅ L'application fonctionne avec la nouvelle structure
- ✅ `getProgramsPath()` retourne `'organizations/org_default/programs'`
- ✅ Support du multi-tenant
- ✅ Fallback toujours disponible si un utilisateur n'a pas été migré

---

## 📝 Exemples d'Usage

### **Exemple 1 : Afficher le profil utilisateur**

```javascript
import { useAuth } from '../context/AuthContext';

function UserProfile() {
  const { user, employeeData, userRole, organizationInfo } = useAuth();
  
  if (!employeeData) return <div>Chargement...</div>;
  
  const profile = employeeData.profile || {};
  
  return (
    <div>
      <h2>{profile.firstName} {profile.lastName}</h2>
      <p>Email: {profile.email}</p>
      <p>Rôle: {userRole}</p>
      {organizationInfo && (
        <p>Organisation: {organizationInfo.info.name}</p>
      )}
    </div>
  );
}
```

---

### **Exemple 2 : Récupérer les programmes de l'organisation**

```javascript
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function ProgramList() {
  const { getProgramsPath } = useAuth();
  const [programs, setPrograms] = useState([]);
  
  useEffect(() => {
    async function loadPrograms() {
      const programsPath = getProgramsPath();
      const programsRef = collection(db, programsPath);
      const snapshot = await getDocs(programsRef);
      
      setPrograms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    
    loadPrograms();
  }, [getProgramsPath]);
  
  return (
    <ul>
      {programs.map(program => (
        <li key={program.id}>{program.title}</li>
      ))}
    </ul>
  );
}
```

---

### **Exemple 3 : Enregistrer la progression d'un utilisateur**

```javascript
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

function saveProgress(programId, lessonId) {
  const { getLearningPath } = useAuth();
  
  const learningPath = getLearningPath();
  const progressRef = doc(db, learningPath, 'progress', programId);
  
  await setDoc(progressRef, {
    programId,
    completedLessons: [lessonId],
    updatedAt: serverTimestamp()
  }, { merge: true });
}
```

---

### **Exemple 4 : Vérifier les permissions**

```javascript
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

function AdminOnlyPage() {
  const { isAdmin, loading } = useAuth();
  
  if (loading) return <div>Chargement...</div>;
  
  if (!isAdmin) {
    return <Navigate to="/apprenant/dashboard" />;
  }
  
  return (
    <div>
      <h1>Panneau d'Administration</h1>
      {/* ... */}
    </div>
  );
}
```

---

### **Exemple 5 : Sélecteur d'organisation (super admin)**

```javascript
import { useAuth } from '../context/AuthContext';

function OrganizationSelector() {
  const { isSuperAdmin, organizationId } = useAuth();
  
  if (!isSuperAdmin) return null; // Pas affiché pour les autres
  
  return (
    <select value={organizationId || ''}>
      <option value="">Toutes les organisations</option>
      <option value="org_default">Organisation par défaut</option>
      <option value="org_company1">Entreprise 1</option>
      {/* ... */}
    </select>
  );
}
```

---

## 🔧 Migration Progressive du Code

### **Étape 1 : Identifier les fichiers à modifier**

Recherche tous les fichiers qui utilisent :
- `doc(db, 'users', userId)`
- `doc(db, 'programs', programId)`
- `collection(db, 'users')`
- `collection(db, 'programs')`

**Commande :**
```bash
grep -r "doc(db, 'users'" src/
grep -r "doc(db, 'programs'" src/
grep -r "collection(db, 'users'" src/
grep -r "collection(db, 'programs'" src/
```

---

### **Étape 2 : Remplacer progressivement**

**AVANT :**
```javascript
const userRef = doc(db, 'users', userId);
const programRef = doc(db, 'programs', programId);
```

**APRÈS :**
```javascript
import { useAuth } from '../context/AuthContext';

const { getEmployeePath, getProgramsPath } = useAuth();

const employeePath = getEmployeePath(userId);
const userRef = doc(db, employeePath);

const programsPath = getProgramsPath();
const programRef = doc(db, programsPath, programId);
```

---

### **Étape 3 : Tester**

1. ✅ Teste avec un utilisateur **avant migration** (ancienne structure `/users`)
2. ✅ Teste avec un utilisateur **après migration** (nouvelle structure `/employees`)
3. ✅ Teste avec un **super admin**
4. ✅ Teste tous les rôles (`admin`, `trainer`, `learner`)

---

## 📊 Logs de Debug

Le nouveau `AuthContext` affiche des logs détaillés pour faciliter le debug :

```
🔐 Auth state changed: kam@example.com
👑 Super Admin détecté
🎯 AuthContext value: {
  email: 'kam@example.com',
  userRole: 'superadmin',
  isSuperAdmin: true,
  organizationId: null,
  loading: false
}
```

Ou pour un employee :

```
🔐 Auth state changed: learner@example.com
👤 Employee trouvé: learner@example.com - Role: learner
🎯 AuthContext value: {
  email: 'learner@example.com',
  userRole: 'learner',
  isSuperAdmin: false,
  organizationId: 'org_default',
  loading: false
}
```

Ou pour un utilisateur non migré :

```
🔐 Auth state changed: old-user@example.com
⚠️ Employee non trouvé, vérification ancienne structure...
📦 User trouvé dans ancienne structure: old-user@example.com
🎯 AuthContext value: {
  email: 'old-user@example.com',
  userRole: 'learner',
  isSuperAdmin: false,
  organizationId: 'org_default',
  loading: false
}
```

---

## ✅ Checklist de Migration

### **Avant la migration des données**
- [x] ✅ `AuthContext.jsx` modifié
- [ ] ⏳ Code testé avec ancienne structure `/users`
- [ ] ⏳ Vérifier que tous les composants fonctionnent

### **Après Step 1 (Structure)**
- [ ] ⏳ Tester la connexion (devrait toujours fonctionner avec fallback)

### **Après Step 2 (Users → Employees)**
- [ ] ⏳ Tester avec un utilisateur migré
- [ ] ⏳ Vérifier que `organizationId` est bien `'org_default'`
- [ ] ⏳ Vérifier que `employeeData` est correctement chargé

### **Après Step 3 (Programs)**
- [ ] ⏳ Vérifier que `getProgramsPath()` retourne `'organizations/org_default/programs'`
- [ ] ⏳ Tester l'affichage des programmes

### **Après adaptation du code**
- [ ] ⏳ Remplacer tous les `doc(db, 'users', ...)` par `getEmployeePath()`
- [ ] ⏳ Remplacer tous les `doc(db, 'programs', ...)` par `getProgramsPath()`
- [ ] ⏳ Tester toutes les fonctionnalités de l'application

---

## 🚨 Points d'Attention

### **1. Fallback sur ancienne structure**

Le fallback permet de fonctionner pendant la transition, mais :
- ⚠️ Les nouveaux champs (`organizationInfo`, etc.) seront incomplets
- ⚠️ Une fois la migration terminée, tu peux supprimer le fallback

**Pour supprimer le fallback :**

Supprime cette section dans `AuthContext.jsx` :

```javascript
// 3. FALLBACK : Chercher dans l'ancienne structure /users
const oldUserDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
if (oldUserDoc.exists()) {
  // ... tout ce bloc ...
}
```

---

### **2. `DEFAULT_ORG_ID` hardcodé**

Pour l'instant, `DEFAULT_ORG_ID = 'org_default'` est hardcodé.

**À l'avenir, pour un vrai multi-tenant :**
- Récupérer l'organisation depuis l'URL (ex: `app.example.com/org/org_company1/...`)
- Ou depuis un sélecteur d'organisation (pour les super admins)
- Ou depuis un cookie/localStorage (pour les utilisateurs qui appartiennent à plusieurs orgs)

---

### **3. Performance**

Le `AuthContext` fait maintenant **3 requêtes Firebase max** au chargement :
1. `platformAdmins/{uid}` (super admin ?)
2. `organizations/{orgId}/employees/{uid}` (employee ?)
3. `users/{uid}` (fallback ancienne structure)

**Optimisation possible :**
- Mettre en cache `organizationInfo` (si elle ne change pas souvent)
- Utiliser des listeners en temps réel (`onSnapshot`) pour certaines données

---

## 📚 Documentation Complémentaire

| Document | Contenu |
|----------|---------|
| `MIGRATION_GUIDE.md` | Guide complet de migration |
| `FIREBASE_PATHS.md` | Explication détaillée des chemins Firebase |
| `MIGRATION_STEP2.md` | Migration Users → Employees |
| `MIGRATION_STEP3.md` | Migration Programs |
| `AUTHCONTEXT_MULTITENANT.md` | ✨ **CE DOCUMENT** - AuthContext multi-tenant |

---

## 🎯 Résumé

### **Avant**
- ✅ Structure simple : `/users`, `/programs`
- ✅ 1 seul rôle : `admin` ou `learner`
- ✅ 1 seule organisation (implicite)

### **Après**
- ✅ Structure multi-tenant : `/organizations/{orgId}/employees`, `/organizations/{orgId}/programs`
- ✅ 4 rôles : `superadmin`, `admin`, `trainer`, `learner`
- ✅ Support de plusieurs organisations
- ✅ Helpers pour les chemins Firebase
- ✅ Fallback sur ancienne structure (pendant la transition)

---

**🎊 AuthContext prêt pour le multi-tenant ! 🚀✨**

**Usage dans ton code :**
```javascript
import { useAuth } from '../context/AuthContext';

const { 
  user, 
  userRole, 
  isAdmin, 
  organizationId, 
  getEmployeePath, 
  getProgramsPath 
} = useAuth();
```
