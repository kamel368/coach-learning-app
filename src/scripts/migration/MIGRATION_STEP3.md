# 🔄 Migration Step 3 : Programs → Organization

## 🎯 Objectif

Migrer tous les programmes (et leur contenu) de l'ancienne structure vers la nouvelle structure multi-tenant :
- **Ancienne structure :** `/programs/{programId}`
- **Nouvelle structure :** `/organizations/{orgId}/programs/{programId}`

---

## 📊 Données Migrées

Pour chaque programme, le script migre :

### 1. **Programme (Document racine)** ✅
```
/organizations/org_default/programs/{programId}
  ├─ title: string
  ├─ description: string
  ├─ icon: string
  ├─ category: string
  ├─ status: 'published' | 'draft'
  ├─ createdAt: Timestamp
  ├─ updatedAt: Timestamp
  └─ migratedAt: Timestamp  ← AJOUTÉ par migration
```

### 2. **Modules** ✅
```
/organizations/org_default/programs/{programId}/modules/{moduleId}
  ├─ title: string
  ├─ description: string
  ├─ order: number
  └─ createdAt: Timestamp
```

### 3. **Lessons (Leçons)** ✅
```
/organizations/org_default/programs/{programId}/modules/{moduleId}/lessons/{lessonId}
  ├─ title: string
  ├─ blocks: [...]  ← Contenu de la leçon
  ├─ order: number
  └─ createdAt: Timestamp
```

### 4. **Exercises (Exercices)** ✅
```
/organizations/org_default/programs/{programId}/modules/{moduleId}/exercises/{exerciseId}
  ├─ blocks: [...]  ← Blocs d'exercices (QCM, Flashcards, etc.)
  ├─ settings: { passingScore, maxAttempts, ... }
  └─ createdAt: Timestamp
```

### 5. **Evaluation Config** ✅ (si existe)
```
/organizations/org_default/programs/{programId}/evaluation/{evalId}
  ├─ type: 'program'
  ├─ settings: {...}
  └─ createdAt: Timestamp
```

---

## 🔄 Processus de Migration

### Étape 1 : Récupération
```javascript
const programsSnapshot = await getDocs(collection(db, 'programs'));
```
- Récupère tous les documents de la collection `/programs`
- Affiche le nombre total de programmes à migrer

### Étape 2 : Boucle sur chaque programme
Pour chaque programme :

#### 2.1 - Copier le programme
```javascript
await setDoc(doc(db, 'organizations', 'org_default', 'programs', programId), {
  ...programData,
  migratedAt: serverTimestamp()
});
```
- ✅ Copie toutes les données du programme
- ✅ Ajoute `migratedAt` pour tracer la migration

#### 2.2 - Copier les modules
```javascript
const modulesSnapshot = await getDocs(collection(db, 'programs', programId, 'modules'));
for (const moduleDoc of modulesSnapshot.docs) {
  await setDoc(
    doc(db, 'organizations', 'org_default', 'programs', programId, 'modules', moduleDoc.id),
    moduleDoc.data()
  );
}
```

#### 2.3 - Copier les lessons de chaque module
```javascript
const lessonsSnapshot = await getDocs(
  collection(db, 'programs', programId, 'modules', moduleId, 'lessons')
);
for (const lessonDoc of lessonsSnapshot.docs) {
  await setDoc(
    doc(db, 'organizations', 'org_default', 'programs', programId, 'modules', moduleId, 'lessons', lessonDoc.id),
    lessonDoc.data()
  );
}
```

#### 2.4 - Copier les exercises de chaque module
```javascript
const exercisesSnapshot = await getDocs(
  collection(db, 'programs', programId, 'modules', moduleId, 'exercises')
);
for (const exerciseDoc of exercisesSnapshot.docs) {
  await setDoc(
    doc(db, 'organizations', 'org_default', 'programs', programId, 'modules', moduleId, 'exercises', exerciseDoc.id),
    exerciseDoc.data()
  );
}
```

#### 2.5 - Copier l'evaluation config (si existe)
```javascript
const evalConfigSnapshot = await getDocs(
  collection(db, 'programs', programId, 'evaluation')
);
for (const evalDoc of evalConfigSnapshot.docs) {
  await setDoc(
    doc(db, 'organizations', 'org_default', 'programs', programId, 'evaluation', evalDoc.id),
    evalDoc.data()
  );
}
```

---

## 📝 Logs Attendus

### Exemple de log pour un programme complet

```
📚 Migration: Formation React Avancée
   ✅ Programme copié
   ✅ Module module_1: 8 lessons
   ✅ Module module_1: 5 exercises
   ✅ Module module_2: 12 lessons
   ✅ Module module_2: 7 exercises
   ✅ Module module_3: 6 lessons
   ✅ Module module_3: 3 exercises
   ✅ 3 modules migrés
   ✅ Evaluation config migrée
```

### Exemple de log pour un programme minimal

```
📚 Migration: Programme Test
   ✅ Programme copié
   ⚠️ Pas de modules
```

### Résumé final

```
🎉 ====================================
🎉 MIGRATION STEP 3 TERMINÉE !
🎉 ====================================

📊 Résumé :
   • Programmes migrés: 5
   • Erreurs: 0

✅ MIGRATION COMPLÈTE ! Prochaine étape : Adapter le code.
```

---

## 🚨 Gestion des Erreurs

### Erreurs gérées (non-bloquantes)

| Erreur | Cause | Comportement |
|--------|-------|--------------|
| Modules manquants | Programme sans modules | ⚠️ Log "Pas de modules", continue |
| Lessons manquantes | Module sans leçons | ⚠️ Log "Pas de lessons", continue |
| Exercises manquants | Module sans exercices | ⚠️ Log "Pas d'exercises", continue |
| Evaluation config manquante | Programme sans config d'évaluation | ⚠️ Log "Pas d'evaluation config", continue |

### Erreurs critiques (bloquantes pour le programme)

Si une erreur survient lors de la copie du programme :
- ❌ Log d'erreur avec le message
- Le programme est compté dans `errorCount`
- La migration continue avec les autres programmes

---

## 🎯 Résultat Attendu

### Structure finale pour chaque programme

```
/organizations/org_default/programs/{programId}
  ├─ title: string              ← Données du programme
  ├─ description: string
  ├─ icon: string
  ├─ category: string
  ├─ status: string
  ├─ createdAt: Timestamp
  ├─ updatedAt: Timestamp
  ├─ migratedAt: Timestamp      ← AJOUTÉ
  └─ modules/
      └─ {moduleId}/
          ├─ title: string      ← Données du module
          ├─ description: string
          ├─ order: number
          ├─ lessons/
          │   ├─ {lessonId1}/
          │   │   ├─ title: string
          │   │   ├─ blocks: [...]
          │   │   └─ order: number
          │   └─ {lessonId2}/
          └─ exercises/
              ├─ {exerciseId1}/
              │   ├─ blocks: [...]
              │   └─ settings: {...}
              └─ {exerciseId2}/
```

---

## 🔄 Avant / Après

### AVANT (Structure racine)

```
/programs/
  └─ programId1/
      ├─ title: "Formation React"
      ├─ description: "..."
      ├─ status: "published"
      └─ modules/
          └─ moduleId1/
              ├─ title: "Introduction"
              ├─ lessons/
              │   └─ lessonId1/
              └─ exercises/
                  └─ exerciseId1/
```

### APRÈS (Structure multi-tenant)

```
/organizations/org_default/programs/
  └─ programId1/
      ├─ title: "Formation React"
      ├─ description: "..."
      ├─ status: "published"
      ├─ migratedAt: Timestamp     ← AJOUTÉ
      └─ modules/
          └─ moduleId1/
              ├─ title: "Introduction"
              ├─ lessons/
              │   └─ lessonId1/
              └─ exercises/
                  └─ exerciseId1/
```

**Changement clé :** Le chemin de base passe de `/programs/` à `/organizations/org_default/programs/`

---

## ⚠️ IMPORTANT : Vérifications Avant Migration

### 1. Steps précédents exécutés
✅ Assure-toi que Step 1 et Step 2 ont été exécutés avec succès :
- `/platformSettings/config` existe
- `/platformAdmins/{superAdminUid}` existe
- `/organizations/org_default` existe
- Les employees ont été migrés

### 2. Backup
⚠️ **Avant de lancer la migration, fais un backup de ta base Firestore :**
- Via Firebase Console → Firestore Database → Export
- Ou via CLI : `firebase firestore:backup gs://your-bucket/backup`

### 3. Règles temporaires
✅ Assure-toi que les règles temporaires sont toujours déployées :
```javascript
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

---

## 🚀 Exécution

### Via l'interface de migration

1. **Lance l'application**
   ```bash
   npm run dev
   ```

2. **Va sur la page de migration**
   ```
   http://localhost:5173/admin/migration
   ```

3. **Clique sur "▶️ Exécuter Step 3 (Programs)"** (bouton violet)

4. **Observe les logs en temps réel**

### Logs en console

Tous les logs sont également affichés dans la console du navigateur (F12) :
```javascript
console.log('🚀 MIGRATION STEP 3 : Programs');
console.log('📊 Récupération des programmes existants...');
console.log(`   📦 ${programsSnapshot.size} programmes trouvés`);
console.log(`\n📚 Migration: ${programData.title}`);
console.log('   ✅ Programme copié');
// ...
```

---

## ✅ Vérification Post-Migration

### 1. Dans Firebase Console

Vérifie que la structure est correcte :

```
/organizations/org_default/programs/
  ├─ {programId1}/
  │   ├─ title, description, status, migratedAt
  │   └─ modules/
  │       └─ {moduleId}/
  │           ├─ title, description, order
  │           ├─ lessons/{lessonId}/
  │           └─ exercises/{exerciseId}/
  ├─ {programId2}/
  └─ ...
```

### 2. Compter les documents

**Avant :**
```
/programs/ : X documents (programmes)
```

**Après :**
```
/organizations/org_default/programs/ : X documents (programmes)
```

Le nombre doit correspondre !

### 3. Vérifier les sous-collections

Pour un programme test, vérifie que :
- ✅ Le programme a bien `migratedAt`
- ✅ Tous les modules sont présents
- ✅ Toutes les lessons de chaque module sont présentes
- ✅ Tous les exercises de chaque module sont présents
- ✅ L'evaluation config est présente (si elle existait)

### 4. Vérifier l'intégrité des données

Ouvre un lesson test et vérifie que :
- ✅ Le contenu (`blocks`) est intact
- ✅ Le `title` et `order` sont corrects
- ✅ Aucune donnée n'a été perdue

---

## 🔄 Répétabilité

Le script est **idempotent** :
- Si tu le relances, il va **écraser** les documents existants dans `/organizations/org_default/programs/`
- Utile si tu veux corriger une erreur ou re-migrer

⚠️ **Attention :** Si tu as fait des modifications manuelles dans `/organizations/org_default/programs/`, elles seront perdues !

---

## 📊 Statistiques de Migration

### Exemple de résultat

```json
{
  "success": true,
  "migrated": 5,
  "errors": 0
}
```

**Interprétation :**
- `success: true` → Migration terminée sans erreur fatale
- `migrated: 5` → 5 programmes ont été migrés avec succès
- `errors: 0` → Aucune erreur rencontrée

### Exemple avec erreurs

```json
{
  "success": true,
  "migrated": 4,
  "errors": 1
}
```

**Interprétation :**
- `success: true` → Migration terminée (mais avec 1 erreur non-bloquante)
- `migrated: 4` → 4 programmes migrés avec succès
- `errors: 1` → 1 programme n'a pas pu être migré (voir les logs pour identifier lequel)

---

## 🔗 Liens vers les autres Steps

| Step | Objectif | Statut |
|------|----------|--------|
| **Step 1** | Créer la structure de base (platformSettings, platformAdmins, organizations) | ✅ Créé |
| **Step 2** | Migrer les users vers employees | ✅ Créé |
| **Step 3** | Migrer les programs (et leur contenu) | ✅ **ACTUEL** |
| **Step 4** | Adapter le code (services, hooks, composants) | ⏳ À faire |
| **Step 5** | Cleanup et règles finales | ⏳ À faire |

---

## 🎓 Ce que tu apprends avec ce script

1. **Migration de données hiérarchiques** : Copier des programmes avec leurs modules, lessons et exercises
2. **Gestion des sous-collections imbriquées** : Navigation dans une structure à 4 niveaux
3. **Gestion des erreurs non-bloquantes** : Le script continue même si certaines sous-collections manquent
4. **Copie complète de structure** : Préservation de toute la hiérarchie des données
5. **Logs détaillés par niveau** : Feedback pour chaque niveau de la hiérarchie

---

## 🚨 Troubleshooting

### Problème : "❌ Erreur pour programId: Missing or insufficient permissions"

**Cause :** Les règles temporaires ne sont pas déployées

**Solution :**
```bash
npm run deploy:rules
```

---

### Problème : "⚠️ 0 programmes trouvés"

**Cause :** La collection `/programs` est vide ou n'existe pas

**Solution :**
- Vérifie dans Firebase Console que `/programs` contient des documents
- Si c'est une nouvelle installation, c'est normal, aucune migration nécessaire

---

### Problème : Migration très lente

**Cause :** Beaucoup de modules, lessons et exercises à migrer

**Solution :**
- C'est normal si tu as beaucoup de contenus
- La migration peut prendre plusieurs minutes pour de gros programmes
- Les logs te permettent de suivre l'avancement en temps réel
- **Optimisation possible :** Utiliser `Promise.all()` pour paralléliser les copies (mais plus risqué)

---

### Problème : Certains modules ont des lessons mais pas d'exercises (ou inversement)

**Ce n'est pas un problème !** C'est géré :
- ⚠️ Log "Pas de lessons" ou "Pas d'exercises"
- ✅ La migration continue normalement

---

## 🎯 Prochaines Étapes Après Step 3

### **Step 4 : Adapter le Code**

Une fois les données migrées, tu dois adapter le code pour lire depuis `/organizations/org_default/programs/` au lieu de `/programs/` :

#### Fichiers à modifier :

1. **`src/services/lessonsService.js`**
   ```javascript
   // AVANT
   const programRef = doc(db, 'programs', programId);
   
   // APRÈS
   const orgId = 'org_default'; // À récupérer depuis l'utilisateur
   const programRef = doc(db, 'organizations', orgId, 'programs', programId);
   ```

2. **`src/services/progressionService.js`**
   - Modifier les références à `/programs/` → `/organizations/{orgId}/programs/`

3. **`src/hooks/useExerciseEditor.js`**
   - Modifier les chemins pour les exercises

4. **`src/hooks/useExerciseSession.js`**
   - Modifier les chemins pour récupérer les exercises

5. **`src/pages/admin/AdminProgramDetail.jsx`**
   - Modifier les requêtes Firestore

6. **Tous les composants apprenants :**
   - `ApprenantProgramDetail.jsx`
   - `ApprenantModuleDetail.jsx`
   - `ApprenantLessonViewer.jsx`
   - `ApprenantExercises.jsx`
   - etc.

#### Stratégie de migration du code :

**Option A : Migration brutale** (recommandée pour petite app)
- Modifier tous les fichiers d'un coup
- Tester l'ensemble
- Déployer

**Option B : Migration progressive** (recommandée pour grosse app)
- Créer des fonctions utilitaires pour obtenir les chemins
- Modifier fichier par fichier
- Tester au fur et à mesure

**Exemple de fonction utilitaire :**

```javascript
// src/utils/firebasePaths.js
export const getProgramPath = (programId, orgId = 'org_default') => {
  return `organizations/${orgId}/programs/${programId}`;
};

export const getModulePath = (programId, moduleId, orgId = 'org_default') => {
  return `${getProgramPath(programId, orgId)}/modules/${moduleId}`;
};

export const getLessonPath = (programId, moduleId, lessonId, orgId = 'org_default') => {
  return `${getModulePath(programId, moduleId, orgId)}/lessons/${lessonId}`;
};

// Usage
const programRef = doc(db, getProgramPath(programId));
```

---

### **Step 5 : Cleanup**

1. **Vérifier que tout fonctionne** avec les nouvelles données
2. **Supprimer les anciennes collections** (une fois sûr) :
   - `/programs/` (après avoir vérifié que `/organizations/org_default/programs/` fonctionne)
   - `/users/` (après avoir vérifié que `/organizations/org_default/employees/` fonctionne)
   - `/userProgress/` (déjà migré vers `/employees/{userId}/learning/progress/`)
3. **Déployer les règles finales** (sécurisées)
4. **Mettre à jour la documentation**

---

## 📚 Documentation Complémentaire

| Document | Contenu |
|----------|---------|
| `MIGRATION_GUIDE.md` | Guide complet de toutes les migrations |
| `FIREBASE_PATHS.md` | Explication détaillée des chemins Firebase |
| `STRUCTURE_CHANGE.md` | Changement de `/platform` à `/platformSettings` |
| `MIGRATION_STEP2.md` | Migration Users → Employees |
| `MIGRATION_STEP3.md` | ✨ **CE DOCUMENT** - Migration Programs |

---

## ✅ Checklist Finale

### Avant la migration Step 3
- [ ] ✅ Step 1 et Step 2 exécutés avec succès
- [ ] ✅ `/platformSettings/config` existe
- [ ] ✅ `/platformAdmins/{ton-uid}` existe
- [ ] ✅ `/organizations/org_default` existe
- [ ] ✅ Employees migrés dans `/organizations/org_default/employees/`
- [ ] ✅ Règles temporaires déployées
- [ ] ✅ Backup Firestore fait (recommandé)

### Exécution Step 3
- [ ] ✅ Application lancée (`npm run dev`)
- [ ] ✅ Page `/admin/migration` ouverte
- [ ] ✅ Bouton "▶️ Exécuter Step 3 (Programs)" cliqué
- [ ] ✅ Logs observés en temps réel
- [ ] ✅ Message de succès reçu

### Vérification post-migration
- [ ] ✅ Nombre de programmes = Nombre de programmes originaux
- [ ] ✅ Structure correcte dans Firebase Console
- [ ] ✅ Données d'un programme test vérifiées
- [ ] ✅ Tous les modules présents
- [ ] ✅ Toutes les lessons présentes pour chaque module
- [ ] ✅ Tous les exercises présents pour chaque module
- [ ] ✅ Evaluation config présente (si existait)
- [ ] ✅ Champ `migratedAt` présent sur chaque programme

### Après la migration
- [ ] ⏳ Adapter le code (services, hooks, composants)
- [ ] ⏳ Tester l'application complète
- [ ] ⏳ Cleanup des anciennes collections
- [ ] ⏳ Déployer les règles finales
- [ ] ⏳ Mettre à jour la documentation

---

**🎊 Migration Step 3 prête ! Tous les programmes seront migrés vers `/organizations/org_default/programs/` ! 🚀✨**

---

## 🎁 BONUS : Script de Vérification Post-Migration

Voici un script que tu peux exécuter dans la console Firebase (ou créer en tant que Step 4) pour vérifier l'intégrité de la migration :

```javascript
// src/scripts/migration/verifyMigration.js
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../firebase';

export const verifyMigration = async () => {
  console.log('🔍 Vérification de la migration...\n');
  
  // Compter les programmes originaux
  const oldPrograms = await getDocs(collection(db, 'programs'));
  const oldCount = oldPrograms.size;
  
  // Compter les programmes migrés
  const newPrograms = await getDocs(collection(db, 'organizations', 'org_default', 'programs'));
  const newCount = newPrograms.size;
  
  console.log(`📊 Programmes originaux: ${oldCount}`);
  console.log(`📊 Programmes migrés: ${newCount}`);
  
  if (oldCount === newCount) {
    console.log('✅ Tous les programmes ont été migrés !');
  } else {
    console.log(`⚠️ Différence : ${oldCount - newCount} programmes manquants`);
  }
  
  // Vérifier les sous-collections pour chaque programme
  for (const programDoc of newPrograms.docs) {
    const programId = programDoc.id;
    const programData = programDoc.data();
    
    console.log(`\n📚 Vérification: ${programData.title}`);
    
    // Vérifier migratedAt
    if (programData.migratedAt) {
      console.log('   ✅ migratedAt présent');
    } else {
      console.log('   ⚠️ migratedAt manquant');
    }
    
    // Compter les modules
    const modules = await getDocs(collection(db, 'organizations', 'org_default', 'programs', programId, 'modules'));
    console.log(`   📦 ${modules.size} modules`);
    
    // Pour chaque module, compter lessons et exercises
    for (const moduleDoc of modules.docs) {
      const moduleId = moduleDoc.id;
      
      const lessons = await getDocs(collection(db, 'organizations', 'org_default', 'programs', programId, 'modules', moduleId, 'lessons'));
      const exercises = await getDocs(collection(db, 'organizations', 'org_default', 'programs', programId, 'modules', moduleId, 'exercises'));
      
      console.log(`   ├─ Module ${moduleId}: ${lessons.size} lessons, ${exercises.size} exercises`);
    }
  }
  
  console.log('\n✅ Vérification terminée !');
};
```

**Usage :**
```javascript
// Dans la console du navigateur
import { verifyMigration } from './src/scripts/migration/verifyMigration.js';
await verifyMigration();
```

---

**📖 Pour comprendre en détail les changements de structure, lis :**
- `src/scripts/migration/MIGRATION_STEP3.md` : Ce document

**🚀 Pour exécuter la migration, suis :**
- `MIGRATION_GUIDE.md` : Guide pas à pas

**🔐 Pour déployer les règles, consulte :**
- `DEPLOY_RULES.md` : Instructions de déploiement
