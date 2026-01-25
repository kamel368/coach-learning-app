# 🎮 Correctifs Gamification & Évaluations - Janvier 2026

## 📋 Vue d'ensemble

Ce document récapitule tous les correctifs apportés au système de gamification et d'évaluations pour assurer la cohérence avec la nouvelle architecture de données multi-tenant.

---

## 🗂️ Nouvelle Architecture de Données

### Structure `userProgress`

**Ancienne structure ❌:**
```
userProgress/{userId}/programs/{programId}
```

**Nouvelle structure ✅:**
```
userProgress/{userId}__{programId}
```

**Champs du document:**
```javascript
{
  userId: string,
  programId: string,
  organizationId: string | null,
  completedLessons: string[],        // IDs des leçons terminées
  currentLesson: string,              // ID de la leçon en cours
  lastAccessedAt: string,             // ISO timestamp
  percentage: number,                 // Pourcentage de complétion (0-100)
  totalLessons: number,               // Nombre total de leçons
  updatedAt: string                   // ISO timestamp
}
```

### Structure `evaluationResults`

**Collection racine:**
```
evaluationResults/{resultId}
```

**Champs du document:**
```javascript
{
  userId: string,
  organizationId: string,
  programId: string,
  chapterId: string | null,          // null pour évaluations de programme
  evaluationType: 'chapter' | 'program_full',
  score: number,                      // Pourcentage (0-100)
  correctAnswers: number,
  totalQuestions: number,
  answers: object,                    // Réponses détaillées
  duration: number,                   // Durée en secondes
  completedAt: string,                // ISO timestamp
  createdAt: string                   // ISO timestamp
}
```

### Structure `gamification`

**Collection racine:**
```
gamification/{userId}
```

**Champs du document:**
```javascript
{
  userId: string,
  organizationId: string,
  xp: number,                         // Points d'expérience
  level: number,                      // Niveau actuel
  badges: string[],                   // IDs des badges débloqués
  newBadges: string[],                // Badges récemment débloqués (à afficher)
  streakDays: number,                 // Jours consécutifs d'activité
  lastActivityDate: string,           // ISO date (YYYY-MM-DD)
  stats: {
    lessonsCompleted: number,
    modulesCompleted: number,
    evaluationsCompleted: number,
    exercisesCompleted: number,
    programsCompleted: number,
    perfectScores: number,
    totalTimeSpent: number           // En minutes
  },
  completedPrograms: string[],       // IDs des programmes terminés
  evaluationRewards: {
    [resultId]: true                 // Marque les évaluations déjà récompensées
  },
  createdAt: string,                 // ISO timestamp
  updatedAt: string                  // ISO timestamp
}
```

---

## 🔧 Fichiers Modifiés

### 1. **`src/services/userDataService.js`** ✅

**Rôle:** Service centralisé pour la nouvelle architecture de données.

**Corrections:**
- Import de `addDoc` ajouté pour `saveEvaluationResult`
- Toutes les fonctions utilisent les nouveaux chemins Firebase

**Fonctions principales:**
- `getUserProgress(userId, programId)` - Lecture progression
- `updateUserProgress(userId, programId, data, organizationId)` - Mise à jour
- `markLessonComplete(userId, programId, lessonId, organizationId)` - Marquer leçon
- `saveEvaluationResult(result)` - Sauvegarder résultat
- `getEvaluationResults(userId, options)` - Récupérer résultats
- `getUserGamification(userId)` - Lire gamification
- `addXP(userId, amount, reason, organizationId)` - Ajouter XP
- `incrementStat(userId, statName, organizationId)` - Incrémenter stat

---

### 2. **`src/hooks/useGamification.js`** ✅

**Rôle:** Hook React pour gérer la gamification.

**Corrections:**
- Re-implémentation complète pour compatibilité avec composants existants
- Ajout des exports `LEVELS`, `BADGES_CONFIG`, `XP_CONFIG`
- Ajout de toutes les fonctions nécessaires:
  - `onLessonCompleted()`
  - `onModuleCompleted()`
  - `onExerciseCompleted()`
  - `onEvaluationCompleted(percentage, type)`
  - `onProgramCompleted(programId)`
  - `updateStreak()`
  - `clearNewBadges()`

**Utilisation:**
```javascript
const { 
  gamification, 
  onLessonCompleted, 
  onEvaluationCompleted, 
  onProgramCompleted 
} = useGamification(userId);
```

---

### 3. **`src/hooks/useUserProgress.js`** ✅

**Rôle:** Hook React pour gérer la progression utilisateur.

**Corrections:**
- Utilise la nouvelle structure `userProgress/{userId}__{programId}`
- Fonctions exportées:
  - `markComplete(lessonId)` - Marquer leçon terminée
  - `updateProgress(data)` - Mise à jour personnalisée
  - `refresh()` - Recharger les données

**Utilisation:**
```javascript
const { progress, loading, markComplete, updateProgress } = useUserProgress(userId, programId);
```

---

### 4. **`src/hooks/useEvaluationResults.js`** ✅

**Rôle:** Hook React pour gérer les résultats d'évaluations.

**Fonctions:**
- `saveResult(result)` - Sauvegarder un résultat
- `getResults(filters)` - Récupérer les résultats

**Utilisation:**
```javascript
const { saveResult, getResults, saving } = useEvaluationResults(userId);
```

---

### 5. **`src/services/progressionService.js`** ✅

**Rôle:** Service pour gérer la progression des apprenants.

**Corrections majeures:**

#### Fonction `getUserProgramProgress`
```javascript
export async function getUserProgramProgress(userId, programId, organizationId = null) {
  const progressDocId = `${userId}__${programId}`;
  const progressRef = doc(db, 'userProgress', progressDocId);
  // ...
}
```

#### Fonction `getAllUserProgress`
```javascript
export async function getAllUserProgress(userId, organizationId = null) {
  const progressQuery = query(
    collection(db, 'userProgress'),
    where('userId', '==', userId)
  );
  // ...
}
```

#### Fonction `markLessonCompleted`
```javascript
export async function markLessonCompleted(
  userId, 
  programId, 
  lessonId, 
  totalLessons, 
  organizationId = null
) {
  const progressDocId = `${userId}__${programId}`;
  const progressRef = doc(db, 'userProgress', progressDocId);
  
  // Sauvegarde avec organizationId
  await setDoc(progressRef, {
    userId,
    programId,
    organizationId: organizationId || null,
    completedLessons,
    currentLesson: lessonId,
    lastAccessedAt: new Date().toISOString(),
    percentage,
    totalLessons,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}
```

#### Fonction `updateCurrentLesson`
```javascript
export async function updateCurrentLesson(userId, programId, lessonId) {
  const progressDocId = `${userId}__${programId}`;
  const progressRef = doc(db, 'userProgress', progressDocId);
  // ...
}
```

---

### 6. **`src/hooks/useHistorique.js`** ✅

**Rôle:** Hook pour l'historique utilisateur.

**Correction:**

#### Fonction `getProgramReadingProgress`
```javascript
async function getProgramReadingProgress(userId, programId) {
  const progressDocId = `${userId}__${programId}`;
  const progressRef = doc(db, 'userProgress', progressDocId);
  const progressSnap = await getDoc(progressRef);
  // ...
}
```

---

### 7. **`src/hooks/useChapterEvaluation.js`** ✅

**Rôle:** Hook pour les évaluations de chapitre.

**Correction dans `submitEvaluation`:**
```javascript
const submitEvaluation = async () => {
  // ... calculs ...
  
  // ✅ Sauvegarde avec nouvelle structure
  const resultToSave = {
    userId,
    organizationId: effectiveOrgId,
    programId,
    chapterId,
    evaluationType: 'chapter',
    score: percentage,
    correctAnswers: correct,
    totalQuestions: totalBlocks,
    answers: answersData,
    duration,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  const resultDoc = await addDoc(
    collection(db, 'evaluationResults'), 
    resultToSave
  );
  
  // 🎮 Mise à jour gamification
  await awardXP(xpGain, `Évaluation chapitre ${chapterName}`);
  await incrementStat('evaluationsCompleted');
  
  // 📊 Mise à jour progression
  await updateProgress({
    [`chaptersEvaluated.${chapterId}`]: {
      score: percentage,
      completedAt: new Date().toISOString()
    }
  });
  
  return { 
    success: true, 
    results: { /* ... */ },
    resultId: resultDoc.id 
  };
};
```

---

### 8. **`src/hooks/useProgramEvaluation.js`** ✅

**Rôle:** Hook pour les évaluations de programme complet.

**Correction similaire:**
```javascript
const submitEvaluation = async () => {
  // ... calculs ...
  
  const resultToSave = {
    userId,
    organizationId: effectiveOrgId,
    programId,
    chapterId: null,
    evaluationType: 'program_full',
    score: percentage,
    correctAnswers: correct,
    totalQuestions: totalBlocks,
    answers: answersData,
    duration,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  const resultDoc = await addDoc(
    collection(db, 'evaluationResults'), 
    resultToSave
  );
  
  return { 
    success: true, 
    results: { /* ... */ },
    resultId: resultDoc.id 
  };
};
```

---

### 9. **`src/pages/apprenant/ApprenantChapterEvaluation.jsx`** ✅

**Rôle:** Page d'évaluation de chapitre.

**Correction dans `handleFinish`:**
```javascript
const handleFinish = async () => {
  const result = await submitEvaluation();
  
  if (result.success) {
    // ✅ Mettre à jour la gamification
    try {
      const percentage = result.results.score;
      await onEvaluationCompleted(percentage, 'chapter');
      console.log('✅ Gamification mise à jour avec succès');
    } catch (gamifError) {
      console.error('⚠️ Erreur gamification (non bloquante):', gamifError);
    }
    
    navigate(`/apprenant/chapter-evaluation/${programId}/${chapterId}/results`, {
      state: { 
        results: result.results, 
        duration: result.duration 
      }
    });
  }
};
```

---

### 10. **`src/pages/apprenant/ApprenantProgramEvaluation.jsx`** ✅

**Rôle:** Page d'évaluation de programme complet.

**Correction dans `handleFinish`:**
```javascript
const handleFinish = async () => {
  const result = await submitEvaluation();
  
  if (result.success) {
    try {
      const percentage = result.results.score;
      
      // Attribuer XP et marquer l'évaluation comme récompensée
      await onEvaluationCompleted(percentage, 'program_full');
      
      // Si score >= 70%, marquer le programme comme complété
      if (percentage >= 70) {
        await onProgramCompleted(programId);
      }
      
      console.log('✅ Gamification mise à jour avec succès');
    } catch (gamifError) {
      console.error('⚠️ Erreur gamification (non bloquante):', gamifError);
    }
    
    navigate(`/apprenant/program-evaluation/${programId}/results`, {
      state: { 
        results: result.results, 
        duration: result.duration 
      }
    });
  }
};
```

---

### 11. **`src/pages/apprenant/ApprenantDashboard.jsx`** ✅

**Rôle:** Tableau de bord apprenant.

**Corrections:**
- Utilise `useUserProgress` et `useGamification`
- Remplace les appels Firebase directs par les nouveaux hooks

---

### 12. **`src/pages/apprenant/ApprenantChapterDetail.jsx`** ✅

**Rôle:** Page de détail d'un chapitre.

**Corrections:**
- Utilise `useUserProgress` pour récupérer le statut de complétion des leçons

---

### 13. **`src/pages/admin/EmployeeDetailPage.jsx`** ✅

**Rôle:** Page admin pour voir les détails d'un employé.

**Corrections:**
- Utilise la nouvelle structure `userProgress/{userId}__{programId}` pour afficher la progression

---

### 14. **`src/pages/apprenant/ApprenantLessonViewer.jsx`** ✅

**Rôle:** Visualiseur de leçon pour les apprenants.

**Corrections:**
- Les appels à `markLessonCompleted` passent maintenant `organizationId`:
```javascript
await markLessonCompleted(
  targetUserId, 
  programId, 
  lessonId, 
  totalProgramLessons, 
  effectiveOrgId  // ✅ Ajouté
);
```

---

## 📦 Scripts de Migration

### **`src/scripts/migrateUserProgressStructure.js`** ✅

**Rôle:** Migrer les données de progression de l'ancienne à la nouvelle structure.

**Utilisation:**
```javascript
import { migrateUserProgressStructure } from './scripts/migrateUserProgressStructure.js';
await migrateUserProgressStructure();
```

**Fonctionnement:**
1. Lit tous les documents de `/userProgress/{userId}/programs/{programId}`
2. Copie les données vers `/userProgress/{userId}__{programId}`
3. Vérifie que les données sont correctement copiées
4. Optionnel: Supprime l'ancienne structure (mode `deleteOld: true`)

---

## ✅ Checklist de Vérification

### Tests à effectuer

- [ ] **Progression des leçons**
  - Ouvrir une leçon et la marquer comme terminée
  - Vérifier dans Firebase que le document est créé/mis à jour dans `userProgress/{userId}__{programId}`
  - Vérifier que `completedLessons[]` contient l'ID de la leçon
  - Vérifier que `percentage` est calculé correctement

- [ ] **Évaluation de chapitre**
  - Compléter une évaluation de chapitre
  - Vérifier qu'un document est créé dans `evaluationResults/` avec `evaluationType: 'chapter'`
  - Vérifier que la gamification est mise à jour (XP, stats)
  - Vérifier la navigation vers la page de résultats

- [ ] **Évaluation de programme**
  - Compléter une évaluation de programme
  - Vérifier qu'un document est créé dans `evaluationResults/` avec `evaluationType: 'program_full'`
  - Si score >= 70%, vérifier que le programme est marqué complété dans `gamification/{userId}.completedPrograms[]`
  - Vérifier la navigation vers la page de résultats

- [ ] **Gamification**
  - Vérifier que `gamification/{userId}` existe et contient les bons champs
  - Vérifier que les XP sont correctement ajoutés
  - Vérifier que les statistiques sont incrémentées
  - Vérifier que les badges sont débloqués correctement

- [ ] **Dashboard apprenant**
  - Vérifier que la progression des programmes s'affiche correctement
  - Vérifier que les badges et XP sont affichés
  - Vérifier que les programmes complétés ont le bon statut

- [ ] **Page admin employé**
  - Vérifier que la progression de l'employé s'affiche correctement
  - Vérifier que les résultats d'évaluations sont récupérables

---

## 🚀 Prochaines Étapes

1. **Tester en environnement de développement**
   - Créer un utilisateur de test
   - Assigner un programme
   - Suivre le parcours complet (leçons → évaluations)
   - Vérifier les données dans Firebase

2. **Migrer les données existantes**
   ```bash
   # Ouvrir la console du navigateur sur l'application
   const { migrateUserProgressStructure } = await import('./src/scripts/migrateUserProgressStructure.js');
   await migrateUserProgressStructure();
   ```

3. **Déployer en production**
   - Une fois tous les tests validés
   - Effectuer la migration sur la base de production
   - Surveiller les logs pour détecter d'éventuels problèmes

---

## 📝 Notes Importantes

### Compatibilité ascendante

Les fonctions de `progressionService.js` et `userDataService.js` ont des paramètres par défaut pour assurer la compatibilité avec le code existant:

```javascript
export async function markLessonCompleted(
  userId, 
  programId, 
  lessonId, 
  totalLessons, 
  organizationId = null  // ← Optionnel
)
```

### Gestion des erreurs

Toutes les mises à jour de gamification sont encapsulées dans des `try...catch` pour éviter que des erreurs bloquent le flux principal:

```javascript
try {
  await onEvaluationCompleted(percentage, 'chapter');
  console.log('✅ Gamification mise à jour avec succès');
} catch (gamifError) {
  console.error('⚠️ Erreur gamification (non bloquante):', gamifError);
}
```

### Logs de débogage

Des logs détaillés ont été ajoutés dans toutes les fonctions critiques pour faciliter le débogage:

```javascript
console.log('📝 markLessonCompleted appelé:', { userId, programId, lessonId, totalLessons });
console.log('✅ Leçon ajoutée aux complétées');
console.log('💾 Progression sauvegardée dans Firebase (nouvelle structure)');
```

---

## 👤 Auteur & Date

**Date:** Janvier 2026  
**Développeur:** Assistant IA Coach Learning  
**Version:** 2.0

---

## 📚 Références

- [Documentation Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Documentation React Hooks](https://react.dev/reference/react)
- Architecture multi-tenant de Coach Learning App

---

**🎉 Fin du document - Tous les correctifs sont documentés !**
