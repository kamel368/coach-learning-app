# 📦 Nouvelle Architecture de Données - userDataService.js

**Date :** 24 janvier 2026  
**Fichier créé :** `src/services/userDataService.js`  
**Statut :** ✅ CRÉÉ ET VALIDÉ  

---

## 🎯 Objectif

Centraliser toutes les opérations sur les données utilisateur (progression, évaluations, gamification) dans un seul fichier de services propre et réutilisable.

**Avantages :**
- ✅ Code centralisé et maintenable
- ✅ Structure de données cohérente
- ✅ Fonctions réutilisables dans tous les hooks
- ✅ Facilite les tests unitaires
- ✅ Documentation claire de la structure Firebase

---

## 📂 Structure Firebase

### 1. Collection `/userProgress`

**Chemin :** `/userProgress/{userId}__{programId}`

**Structure du document :**
```javascript
{
  organizationId: "qtCAf1TSqDxuSodEHTUT",
  userId: "ibnJU4Bz0oTTSKcLmSBSAyAYRdn2",
  programId: "e55HwUF8cAYmdSOblYtn",
  percentage: 50,                              // 0-100
  completedLessons: [
    "HLYem5oT1mLPvJSqZRZq",
    "lXQrIrndt2jXTlU7rCPZ",
    "xo5SqnLfJPqnD7tRd37k",
    "1A0NZ5hZUP24NLJTZPgu"
  ],
  completedChapters: [
    "hgsT8VKKSGDcybbFx3ex"
  ],
  lastAccessedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Clé composite :** `{userId}__{programId}`  
**Pourquoi ?** Permet de retrouver facilement la progression d'un utilisateur pour un programme spécifique.

---

### 2. Collection `/evaluationResults`

**Chemin :** `/evaluationResults/{auto-generated-id}`

**Structure du document :**
```javascript
{
  organizationId: "qtCAf1TSqDxuSodEHTUT",
  userId: "ibnJU4Bz0oTTSKcLmSBSAyAYRdn2",
  programId: "e55HwUF8cAYmdSOblYtn",
  chapterId: "hgsT8VKKSGDcybbFx3ex",
  score: 75,                                   // Points obtenus
  maxScore: 100,                               // Points maximum possible
  percentage: 75,                              // Calculé automatiquement
  duration: 180,                               // En secondes
  completedAt: Timestamp,
  answers: [
    {
      exerciseId: "ex_001",
      correct: true,
      earnedPoints: 10
    },
    {
      exerciseId: "ex_002",
      correct: false,
      earnedPoints: 0
    }
  ]
}
```

**Index recommandés :**
- `userId` + `programId` + `chapterId` (pour récupérer toutes les tentatives d'un chapitre)
- `userId` + `completedAt` (pour l'historique chronologique)

---

### 3. Collection `/gamification`

**Chemin :** `/gamification/{userId}`

**Structure du document :**
```javascript
{
  organizationId: "qtCAf1TSqDxuSodEHTUT",
  userId: "ibnJU4Bz0oTTSKcLmSBSAyAYRdn2",
  level: 5,
  xp: 450,
  badges: [
    "first_lesson",
    "perfect_score",
    "speed_demon"
  ],
  stats: {
    lessonsCompleted: 25,
    exercisesCompleted: 150,
    evaluationsCompleted: 10,
    excellentScores: 3,                        // Scores >= 90%
    totalTimeSpent: 7200                       // En secondes
  },
  history: [
    {
      action: "Leçon complétée",
      date: Timestamp,
      xp: 10
    },
    {
      action: "Score parfait",
      date: Timestamp,
      xp: 50
    }
  ],
  createdAt: Timestamp
}
```

**Calcul du niveau :** `niveau = floor(xp / 100) + 1`  
**Exemple :** 450 XP = Niveau 5

---

## 🔧 Fonctions Disponibles

### Progression

#### `getUserProgress(userId, programId)`
Récupère la progression d'un utilisateur pour un programme.

```javascript
const progress = await getUserProgress('user123', 'prog456');
// Retourne : { id, organizationId, userId, programId, percentage, completedLessons, ... }
// Ou null si n'existe pas
```

#### `createUserProgress(organizationId, userId, programId)`
Crée une nouvelle progression (appelé automatiquement lors du premier accès au programme).

```javascript
const progress = await createUserProgress('org123', 'user456', 'prog789');
// Retourne : { organizationId, userId, programId, percentage: 0, completedLessons: [], ... }
```

#### `updateUserProgress(userId, programId, updates)`
Met à jour la progression.

```javascript
await updateUserProgress('user123', 'prog456', {
  percentage: 75,
  completedLessons: ['lesson1', 'lesson2', 'lesson3']
});
```

#### `markLessonComplete(userId, programId, lessonId)`
Marque une leçon comme complétée (ajoute à la liste si pas déjà présente).

```javascript
await markLessonComplete('user123', 'prog456', 'lesson789');
```

---

### Évaluations

#### `saveEvaluationResult(resultData)`
Enregistre les résultats d'une évaluation.

```javascript
const result = await saveEvaluationResult({
  organizationId: 'org123',
  userId: 'user456',
  programId: 'prog789',
  chapterId: 'chap012',
  score: 85,
  maxScore: 100,
  duration: 300,
  answers: [
    { exerciseId: 'ex1', correct: true, earnedPoints: 10 },
    { exerciseId: 'ex2', correct: false, earnedPoints: 0 }
  ]
});
// Calcule automatiquement le percentage (85%)
```

#### `getEvaluationResults(userId, programId, chapterId)`
Récupère toutes les évaluations d'un chapitre spécifique.

```javascript
const results = await getEvaluationResults('user123', 'prog456', 'chap789');
// Retourne : [{ id, score, percentage, completedAt, ... }, ...]
```

#### `getAllUserEvaluationResults(userId)`
Récupère toutes les évaluations d'un utilisateur (tous programmes).

```javascript
const allResults = await getAllUserEvaluationResults('user123');
```

---

### Gamification

#### `getUserGamification(userId)`
Récupère les données de gamification.

```javascript
const gamif = await getUserGamification('user123');
// Retourne : { id, level, xp, badges, stats, history, ... }
```

#### `createUserGamification(organizationId, userId)`
Crée le profil de gamification (niveau 1, 0 XP).

```javascript
const gamif = await createUserGamification('org123', 'user456');
```

#### `addXP(userId, xpAmount, action)`
Ajoute de l'XP et recalcule le niveau automatiquement.

```javascript
await addXP('user123', 50, 'Évaluation terminée avec 90%');
// Si l'utilisateur avait 450 XP (niveau 5), il passe à 500 XP (niveau 6)
```

#### `incrementStat(userId, statName)`
Incrémente une statistique.

```javascript
await incrementStat('user123', 'lessonsCompleted');
await incrementStat('user123', 'excellentScores');
```

#### `addBadge(userId, badgeId)`
Ajoute un badge (si pas déjà possédé).

```javascript
await addBadge('user123', 'first_lesson');
await addBadge('user123', 'perfect_score');
```

---

### Helpers

#### `initializeUserData(organizationId, userId, programId)`
Initialise TOUTES les données utilisateur nécessaires (progression + gamification).

```javascript
const { progress, gamification } = await initializeUserData('org123', 'user456', 'prog789');
// Crée la progression ET la gamification si elles n'existent pas
```

#### `calculateProgressPercentage(completedLessons, totalLessons)`
Calcule le pourcentage de progression.

```javascript
const percentage = calculateProgressPercentage(['l1', 'l2', 'l3'], 10);
// Retourne : 30
```

#### `calculateLevel(xp)`
Calcule le niveau depuis l'XP.

```javascript
const level = calculateLevel(450);
// Retourne : 5
```

#### `getXPForNextLevel(currentXP)`
Calcule l'XP manquant pour le prochain niveau.

```javascript
const xpNeeded = getXPForNextLevel(450);
// Retourne : 50 (car 450 -> niveau 5, prochain niveau à 500 XP)
```

---

## 🚀 Utilisation dans les Hooks

### Exemple 1 : Hook de progression

```javascript
// src/hooks/useUserProgress.js
import { useEffect, useState } from 'react';
import { 
  getUserProgress, 
  markLessonComplete,
  updateUserProgress 
} from '../services/userDataService';

export function useUserProgress(userId, programId) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadProgress() {
      const data = await getUserProgress(userId, programId);
      setProgress(data);
      setLoading(false);
    }
    loadProgress();
  }, [userId, programId]);
  
  const completLesson = async (lessonId) => {
    await markLessonComplete(userId, programId, lessonId);
    // Recharger la progression
    const updated = await getUserProgress(userId, programId);
    setProgress(updated);
  };
  
  return { progress, loading, completLesson };
}
```

---

### Exemple 2 : Hook de gamification

```javascript
// src/hooks/useGamification.js
import { useEffect, useState } from 'react';
import { 
  getUserGamification, 
  addXP, 
  incrementStat,
  addBadge 
} from '../services/userDataService';

export function useGamification(userId) {
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadGamif() {
      const data = await getUserGamification(userId);
      setGamification(data);
      setLoading(false);
    }
    loadGamif();
  }, [userId]);
  
  const earnXP = async (amount, action) => {
    await addXP(userId, amount, action);
    const updated = await getUserGamification(userId);
    setGamification(updated);
  };
  
  const trackLessonComplete = async () => {
    await incrementStat(userId, 'lessonsCompleted');
    await earnXP(10, 'Leçon complétée');
  };
  
  return { 
    gamification, 
    loading, 
    earnXP, 
    trackLessonComplete 
  };
}
```

---

## 📊 Migration des Données Existantes

### Étape 1 : Identifier les données à migrer

Les données actuelles se trouvent probablement dans :
- `/users/{userId}/programs/{programId}/progress`
- `/users/{userId}/evaluations`
- `/organizations/{orgId}/employees/{userId}/learning/data`

### Étape 2 : Script de migration

```javascript
// src/scripts/migrateToNewStructure.js
import { getAllUsers } from '../services/usersService';
import { createUserProgress, createUserGamification } from '../services/userDataService';

export async function migrateAllUsers() {
  const users = await getAllUsers();
  
  for (const user of users) {
    // Migrer la progression
    const oldProgress = await getOldProgressStructure(user.id);
    if (oldProgress) {
      await createUserProgress(
        user.organizationId,
        user.id,
        oldProgress.programId
      );
    }
    
    // Migrer la gamification
    const oldGamif = await getOldGamificationStructure(user.id);
    if (oldGamif) {
      await createUserGamification(user.organizationId, user.id);
    }
  }
}
```

---

## 🔒 Règles de Sécurité Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Progression utilisateur
    match /userProgress/{progressId} {
      allow read: if request.auth != null 
        && (request.auth.uid == resource.data.userId 
            || hasRole('admin') 
            || hasRole('superadmin'));
      
      allow write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    // Résultats d'évaluation
    match /evaluationResults/{resultId} {
      allow read: if request.auth != null 
        && (request.auth.uid == resource.data.userId 
            || hasRole('admin') 
            || hasRole('superadmin'));
      
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
      
      allow update, delete: if false; // Immutables
    }
    
    // Gamification
    match /gamification/{userId} {
      allow read: if request.auth != null 
        && (request.auth.uid == userId 
            || hasRole('admin') 
            || hasRole('superadmin'));
      
      allow write: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    // Helper function
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
  }
}
```

---

## ✅ Avantages de Cette Architecture

### 1. Séparation des Préoccupations
- **Progression** : Suivi des leçons/chapitres complétés
- **Évaluations** : Historique des tentatives et résultats
- **Gamification** : XP, niveaux, badges

### 2. Performance
- Collections à plat (pas de sous-collections profondes)
- Requêtes optimisées avec index
- Clés composites pour accès rapide

### 3. Évolutivité
- Facile d'ajouter de nouveaux champs
- Structure documentée et cohérente
- Fonctions réutilisables

### 4. Maintenabilité
- Code centralisé dans `userDataService.js`
- Documentation intégrée
- Tests unitaires facilités

---

## 📝 Checklist d'Intégration

- [x] Fichier `userDataService.js` créé
- [x] Build réussi sans erreurs
- [ ] Créer les hooks consommateurs (useUserProgress, useGamification)
- [ ] Mettre à jour les composants existants
- [ ] Créer le script de migration des données
- [ ] Mettre à jour les règles Firestore
- [ ] Créer les index Firestore recommandés
- [ ] Tests unitaires des fonctions
- [ ] Documentation utilisateur
- [ ] Déploiement progressif

---

## 📚 Prochaines Étapes

1. **Créer les hooks** basés sur `userDataService.js`
2. **Migrer progressivement** les composants existants
3. **Tester en environnement de staging**
4. **Migrer les données de production**
5. **Déprécier l'ancienne structure**

---

**✅ Service créé avec succès le 24 janvier 2026**  
**Build Status :** ✅ Réussi  
**Prêt pour l'intégration :** ✅ OUI
