# 🔄 Migration Step 2 : Users → Employees

## 🎯 Objectif

Migrer tous les utilisateurs existants de l'ancienne structure vers la nouvelle structure multi-tenant :
- **Ancienne structure :** `/users/{userId}`
- **Nouvelle structure :** `/organizations/{orgId}/employees/{userId}`

---

## 📊 Données Migrées

Pour chaque utilisateur, le script migre :

### 1. **Profil Employee** ✅
```
/organizations/org_default/employees/{userId}
  └─ profile: {
       userId: string
       email: string
       firstName: string
       lastName: string
       role: 'learner' | 'admin'
       status: 'active'
       createdAt: Timestamp
       updatedAt: Timestamp
     }
```

### 2. **Learning Data** ✅
```
/organizations/org_default/employees/{userId}/learning/data
  └─ assignedPrograms: string[]
  └─ lastActivityAt: Timestamp
```

### 3. **Gamification** ✅ (si existe)
```
Source : /users/{userId}/gamification/data
Cible : /organizations/org_default/employees/{userId}/learning/gamification

Champs migrés :
  - xp, level, currentStreak, longestStreak
  - lastActivityDate, badges, rewardedActions
  - + migratedAt: Timestamp
```

### 4. **Exercise Attempts** ✅ (si existe)
```
Source : /users/{userId}/exerciseAttempts/{attemptId}
Cible : /organizations/org_default/employees/{userId}/learning/exerciseAttempts/{attemptId}

Copie complète de tous les documents d'attempts.
```

### 5. **Evaluations** ✅ (si existe)
```
Source : /users/{userId}/programs/{programId}/evaluations/{evalId}
Cible : /organizations/org_default/employees/{userId}/learning/evaluations/{programId}_{evalId}

Champs :
  - Toutes les données de l'évaluation
  - + programId: string (ajouté pour faciliter les requêtes)
```

### 6. **Progress (User Progress)** ✅ (si existe)
```
Source : /userProgress/{userId}
  └─ programs: {
       [programId]: {
         completedLessons: string[]
         currentLesson: string
         percentage: number
         updatedAt: Timestamp
       }
     }

Cible : /organizations/org_default/employees/{userId}/learning/progress/{programId}
  └─ programId: string
  └─ completedLessons: string[]
  └─ currentLesson: string
  └─ percentage: number
  └─ updatedAt: Timestamp
  └─ migratedAt: Timestamp
```

---

## 🔄 Processus de Migration

### Étape 1 : Récupération
```javascript
const usersSnapshot = await getDocs(collection(db, 'users'));
```
- Récupère tous les documents de la collection `/users`
- Affiche le nombre total d'utilisateurs à migrer

### Étape 2 : Boucle sur chaque user
Pour chaque utilisateur :

#### 2.1 - Créer le profil employee
```javascript
await setDoc(doc(db, 'organizations', 'org_default', 'employees', userId), {
  profile: {
    userId: userId,
    email: userData.email || '',
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    role: userData.role || 'learner',
    status: 'active',
    createdAt: userData.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  }
});
```

#### 2.2 - Créer learning/data
```javascript
await setDoc(doc(db, 'organizations', 'org_default', 'employees', userId, 'learning', 'data'), {
  assignedPrograms: userData.assignedPrograms || [],
  lastActivityAt: serverTimestamp()
});
```

#### 2.3 - Migrer gamification (si existe)
```javascript
const gamifDoc = await getDoc(doc(db, 'users', userId, 'gamification', 'data'));
if (gamifDoc.exists()) {
  await setDoc(doc(db, 'organizations', 'org_default', 'employees', userId, 'learning', 'gamification'), {
    ...gamifDoc.data(),
    migratedAt: serverTimestamp()
  });
}
```

#### 2.4 - Migrer exerciseAttempts (si existe)
```javascript
const attemptsSnapshot = await getDocs(collection(db, 'users', userId, 'exerciseAttempts'));
for (const attemptDoc of attemptsSnapshot.docs) {
  await setDoc(
    doc(db, 'organizations', 'org_default', 'employees', userId, 'learning', 'exerciseAttempts', attemptDoc.id),
    attemptDoc.data()
  );
}
```

#### 2.5 - Migrer evaluations (si existe)
```javascript
const programsSnapshot = await getDocs(collection(db, 'users', userId, 'programs'));
for (const progDoc of programsSnapshot.docs) {
  const evalsSnapshot = await getDocs(collection(db, 'users', userId, 'programs', progDoc.id, 'evaluations'));
  for (const evalDoc of evalsSnapshot.docs) {
    await setDoc(
      doc(db, 'organizations', 'org_default', 'employees', userId, 'learning', 'evaluations', `${progDoc.id}_${evalDoc.id}`),
      {
        ...evalDoc.data(),
        programId: progDoc.id
      }
    );
  }
}
```

#### 2.6 - Migrer progress (si existe)
```javascript
const progressDoc = await getDoc(doc(db, 'userProgress', userId));
if (progressDoc.exists()) {
  const progressData = progressDoc.data();
  for (const [programId, progData] of Object.entries(progressData.programs || {})) {
    await setDoc(
      doc(db, 'organizations', 'org_default', 'employees', userId, 'learning', 'progress', programId),
      {
        programId: programId,
        ...progData,
        migratedAt: serverTimestamp()
      }
    );
  }
}
```

---

## 📝 Logs Attendus

### Exemple de log pour un utilisateur complet

```
👤 Migration: kam@example.com
   ✅ Profil employee créé
   ✅ Learning data créé
   ✅ Gamification migrée
   ✅ 5 exerciseAttempts migrés
   ✅ 3 evaluations migrées
   ✅ Progress migré
```

### Exemple de log pour un utilisateur minimal

```
👤 Migration: learner@example.com
   ✅ Profil employee créé
   ✅ Learning data créé
   ⚠️ Pas de gamification
   ⚠️ Pas d'exerciseAttempts
   ⚠️ Pas d'evaluations
   ⚠️ Pas de progress
```

### Résumé final

```
🎉 ====================================
🎉 MIGRATION STEP 2 TERMINÉE !
🎉 ====================================

📊 Résumé :
   • Users migrés: 12
   • Erreurs: 0

⏭️  Prochaine étape : Exécuter migrationStep3 (programs)
```

---

## 🚨 Gestion des Erreurs

### Erreurs gérées (non-bloquantes)

| Erreur | Cause | Comportement |
|--------|-------|--------------|
| Gamification manquante | User n'a jamais eu de gamification | ⚠️ Log "Pas de gamification", continue |
| ExerciseAttempts manquants | User n'a jamais fait d'exercices | ⚠️ Log "Pas d'exerciseAttempts", continue |
| Evaluations manquantes | User n'a jamais fait d'évaluations | ⚠️ Log "Pas d'evaluations", continue |
| Progress manquant | User n'a jamais commencé de programme | ⚠️ Log "Pas de progress", continue |

### Erreurs critiques (bloquantes pour le user)

Si une erreur survient lors de la création du profil ou de learning/data :
- ❌ Log d'erreur avec le message
- Le user est compté dans `errorCount`
- La migration continue avec les autres users

---

## 🎯 Résultat Attendu

### Structure finale pour chaque user

```
/organizations/org_default/employees/{userId}
  ├─ profile: {...}              ← Profil de base (OBLIGATOIRE)
  └─ learning/
      ├─ data                    ← Programmes assignés (OBLIGATOIRE)
      ├─ gamification            ← XP, badges, streaks (OPTIONNEL)
      ├─ exerciseAttempts/
      │   ├─ {attemptId1}
      │   └─ {attemptId2}
      ├─ evaluations/
      │   ├─ {programId1}_{evalId1}
      │   └─ {programId2}_{evalId2}
      └─ progress/
          ├─ {programId1}        ← Progress du programme 1
          └─ {programId2}        ← Progress du programme 2
```

---

## 🔄 Avant / Après

### AVANT (Structure plate)

```
/users/
  └─ user123/
      ├─ email: "kam@example.com"
      ├─ firstName: "Kamel"
      ├─ role: "learner"
      ├─ assignedPrograms: [...]
      ├─ gamification/
      │   └─ data/
      ├─ exerciseAttempts/
      │   └─ {attemptId}/
      └─ programs/
          └─ {programId}/
              └─ evaluations/
                  └─ {evalId}/

/userProgress/
  └─ user123/
      └─ programs: {
           programId1: {...},
           programId2: {...}
         }
```

### APRÈS (Structure multi-tenant)

```
/organizations/org_default/employees/
  └─ user123/
      ├─ profile: {
      │    userId, email, firstName, role, status
      │  }
      └─ learning/
          ├─ data: {
          │    assignedPrograms: [...]
          │  }
          ├─ gamification: {
          │    xp, level, badges, streaks, ...
          │  }
          ├─ exerciseAttempts/
          │   └─ {attemptId}/
          ├─ evaluations/
          │   └─ {programId}_{evalId}/
          └─ progress/
              ├─ {programId1}/
              └─ {programId2}/
```

---

## ⚠️ IMPORTANT : Vérifications Avant Migration

### 1. Step 1 exécuté
✅ Assure-toi que Step 1 a été exécuté avec succès :
- `/platformSettings/config` existe
- `/platformAdmins/{superAdminUid}` existe
- `/organizations/org_default` existe

### 2. Backup
⚠️ **Avant de lancer la migration, fais un backup de ta base Firestore :**
- Via Firebase Console → Firestore Database → Export
- Ou via CLI : `firebase firestore:backup gs://your-bucket/backup`

### 3. Règles temporaires
✅ Assure-toi que les règles temporaires sont déployées :
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

3. **Clique sur "▶️ Exécuter Step 2 (Users)"**

4. **Observe les logs en temps réel**

### Logs en console

Tous les logs sont également affichés dans la console du navigateur (F12) :
```javascript
console.log('🚀 MIGRATION STEP 2 : Users → Employees');
console.log('📊 Récupération des users existants...');
console.log(`   📦 ${usersSnapshot.size} users trouvés`);
console.log(`\n👤 Migration: ${userData.email}`);
console.log('   ✅ Profil employee créé');
// ...
```

---

## ✅ Vérification Post-Migration

### 1. Dans Firebase Console

Vérifie que la structure est correcte :

```
/organizations/org_default/employees/
  ├─ {userId1}/
  │   ├─ profile
  │   └─ learning/
  │       ├─ data
  │       ├─ gamification (si existait)
  │       ├─ exerciseAttempts/ (si existait)
  │       ├─ evaluations/ (si existait)
  │       └─ progress/ (si existait)
  ├─ {userId2}/
  └─ ...
```

### 2. Compter les documents

**Avant :**
```
/users/ : X documents
```

**Après :**
```
/organizations/org_default/employees/ : X documents
```

Le nombre doit correspondre !

### 3. Vérifier les données

Pour un utilisateur test, vérifie que :
- ✅ Email, firstName, lastName sont corrects
- ✅ `assignedPrograms` a été copié
- ✅ Gamification (xp, badges, streaks) est présente
- ✅ `exerciseAttempts` sont tous là
- ✅ `evaluations` sont toutes là avec `programId`
- ✅ `progress` de chaque programme est là

---

## 🔄 Répétabilité

Le script est **idempotent** :
- Si tu le relances, il va **écraser** les documents existants dans `/organizations/org_default/employees/`
- Utile si tu veux corriger une erreur ou re-migrer

⚠️ **Attention :** Si tu as fait des modifications manuelles dans `/organizations/org_default/employees/`, elles seront perdues !

---

## 📊 Statistiques de Migration

### Exemple de résultat

```json
{
  "success": true,
  "migrated": 12,
  "errors": 0
}
```

**Interprétation :**
- `success: true` → Migration terminée sans erreur fatale
- `migrated: 12` → 12 utilisateurs ont été migrés avec succès
- `errors: 0` → Aucune erreur rencontrée

### Exemple avec erreurs

```json
{
  "success": true,
  "migrated": 11,
  "errors": 1
}
```

**Interprétation :**
- `success: true` → Migration terminée (mais avec 1 erreur non-bloquante)
- `migrated: 11` → 11 utilisateurs migrés avec succès
- `errors: 1` → 1 utilisateur n'a pas pu être migré (voir les logs pour identifier lequel)

---

## 🔗 Liens vers les autres Steps

| Step | Objectif | Statut |
|------|----------|--------|
| **Step 1** | Créer la structure de base (platformSettings, platformAdmins, organizations) | ✅ Créé |
| **Step 2** | Migrer les users vers employees | ✅ **ACTUEL** |
| **Step 3** | Migrer les programs (prévu) | ⏳ À créer |
| **Step 4** | Cleanup (prévu) | ⏳ À créer |

---

## 🎓 Ce que tu apprends avec ce script

1. **Migration de données à grande échelle** : Boucle sur tous les utilisateurs
2. **Gestion des erreurs non-bloquantes** : Le script continue même si certaines sous-collections manquent
3. **Transformation de structure** : De flat (`/users/{userId}`) à nested (`/organizations/{orgId}/employees/{userId}/learning/`)
4. **Gestion des relations** : Conserver les liens entre programmes et évaluations via `programId`
5. **Logs détaillés** : Feedback en temps réel pour suivre l'avancement

---

## 🚨 Troubleshooting

### Problème : "❌ Erreur pour user123: Missing or insufficient permissions"

**Cause :** Les règles temporaires ne sont pas déployées

**Solution :**
```bash
npm run deploy:rules
```

---

### Problème : "⚠️ 0 users trouvés"

**Cause :** La collection `/users` est vide ou n'existe pas

**Solution :**
- Vérifie dans Firebase Console que `/users` contient des documents
- Si c'est une nouvelle installation, c'est normal, aucune migration nécessaire

---

### Problème : Migration très lente

**Cause :** Beaucoup de sous-collections à migrer (exerciseAttempts, evaluations)

**Solution :**
- C'est normal si tu as beaucoup de données
- La migration peut prendre plusieurs minutes pour 100+ users avec historiques complets
- Les logs te permettent de suivre l'avancement en temps réel

---

## 📚 Documentation Complémentaire

| Document | Contenu |
|----------|---------|
| `MIGRATION_GUIDE.md` | Guide complet de toutes les migrations |
| `FIREBASE_PATHS.md` | Explication détaillée des chemins Firebase |
| `STRUCTURE_CHANGE.md` | Changement de `/platform` à `/platformSettings` |
| `MIGRATION_STEP2.md` | ✨ **CE DOCUMENT** - Migration Users → Employees |

---

**🎊 Migration Step 2 prête ! Tous les users seront migrés vers la nouvelle structure employees ! 🚀✨**
