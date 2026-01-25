# Migration vers la Nouvelle Architecture de Données

## Date : 24 janvier 2026

## Vue d'ensemble

Migration complète de l'architecture des données utilisateur vers une structure centralisée et multi-tenant.

### Ancienne structure (dépréciée)
```
/users/{userId}/programs/{programId}/...
/users/{userId}/gamification/data/...
/users/{userId}/programs/{programId}/chapitres/{chapterId}/evaluations/{evalId}
```

### Nouvelle structure
```
/userProgress/{userId}__{programId}
/gamification/{userId}
/evaluationResults/{resultId}
```

---

## Fichiers créés

### 1. Services centralisés

#### `/src/services/userDataService.js`
Service centralisé pour gérer :
- **Progression utilisateur** : `getUserProgress()`, `createUserProgress()`, `updateUserProgress()`, `markLessonComplete()`
- **Résultats d'évaluation** : `saveEvaluationResult()`, `getEvaluationResults()`, `getAllUserEvaluationResults()`
- **Gamification** : `getUserGamification()`, `createUserGamification()`, `addXP()`, `incrementStat()`, `addBadge()`

### 2. Nouveaux hooks

#### `/src/hooks/useUserProgress.js`
Hook pour gérer la progression d'un utilisateur dans un programme.
- Utilise `/userProgress/{userId}__{programId}`
- Fonctions : `markComplete()`, `updateProgress()`, `refresh()`

#### `/src/hooks/useGamification.js` (réécrit)
Hook pour gérer la gamification d'un utilisateur.
- Utilise `/gamification/{userId}`
- Fonctions : `onLessonCompleted()`, `onExerciseCompleted()`, `onEvaluationCompleted()`, `awardXP()`
- Exporte : `LEVELS`, `BADGES_CONFIG`, `XP_CONFIG`

#### `/src/hooks/useEvaluationResults.js`
Hook pour gérer les résultats d'évaluation.
- Utilise `/evaluationResults/{resultId}`
- Fonctions : `saveResult()`, `getResults()`, `getAllResults()`

---

## Fichiers modifiés

### Pages apprenant

#### `/src/pages/apprenant/ApprenantDashboard.jsx`
✅ Migré pour utiliser la nouvelle structure `/userProgress/{userId}__{programId}`
- Chargement des progressions de lecture
- Calcul de la progression globale

#### `/src/pages/apprenant/ApprenantChapterDetail.jsx`
✅ Migré pour utiliser `/userProgress/{userId}__{programId}`
- Chargement des leçons complétées

### Pages admin

#### `/src/pages/admin/EmployeeDetailPage.jsx`
✅ Migré pour utiliser `/userProgress/{userId}__{programId}`
- Affichage de la progression des employés

### Hooks

#### `/src/hooks/useChapterEvaluation.js`
✅ Migré pour utiliser `saveEvaluationResult()` du service centralisé
- Soumission des évaluations vers `/evaluationResults/{resultId}`

---

## Structure des données

### 1. userProgress
```javascript
{
  id: "{userId}__{programId}",
  userId: "abc123",
  programId: "prog456",
  organizationId: "org789",
  completedLessons: ["lesson1", "lesson2"],
  totalLessons: 10,
  percentage: 20,
  currentLesson: "lesson3",
  lastAccessedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. gamification
```javascript
{
  id: "{userId}",
  userId: "abc123",
  organizationId: "org789",
  xp: 150,
  level: 2,
  currentStreak: 3,
  maxStreak: 5,
  lastActiveDate: "2026-01-24",
  badges: ["first_lesson", "reader_10"],
  rewardedActions: {
    lessons: ["lesson1", "lesson2"],
    exercises: ["ex1"],
    evaluations: ["eval1"],
    modules: [],
    programs: []
  },
  stats: {
    lessonsCompleted: 10,
    modulesCompleted: 2,
    exercisesCompleted: 5,
    evaluationsCompleted: 1,
    perfectScores: 0,
    excellentScores: 2,
    programsCompleted: 0,
    allProgramsCompleted: false,
    maxLessonsInDay: 3,
    todayLessons: 1,
    earlyBird: false
  },
  history: [
    { action: "lesson_completed", xp: 10, date: "2026-01-24T10:00:00Z" },
    { action: "badge_unlocked", badge: "first_lesson", date: "2026-01-24T10:00:00Z" }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3. evaluationResults
```javascript
{
  id: "result_{timestamp}_{random}",
  organizationId: "org789",
  userId: "abc123",
  programId: "prog456",
  chapterId: "chap789",
  score: 85,
  maxScore: 100,
  duration: 120, // secondes
  answers: {
    userAnswers: { ... },
    results: [ ... ],
    totalPoints: 100,
    earnedPoints: 85
  },
  completedAt: Timestamp,
  createdAt: Timestamp
}
```

---

## Avantages de la nouvelle architecture

### 1. **Performance améliorée**
- Moins de requêtes imbriquées
- Accès direct aux documents par ID

### 2. **Multi-tenant simplifié**
- `organizationId` inclus dans chaque document
- Facile de filtrer par organisation

### 3. **Maintenance facilitée**
- Code centralisé dans `userDataService.js`
- Moins de duplication de logique

### 4. **Évolutivité**
- Structure plate, facile à interroger
- Possibilité d'ajouter des index Firestore

### 5. **Debugging amélioré**
- Logs détaillés dans les services
- Structure de données cohérente

---

## Migration des données existantes

Pour migrer les données existantes, utilisez les scripts de migration :
- `/src/scripts/migration/migrationStep2.js`

⚠️ **Important** : Testez toujours sur un environnement de dev avant de migrer la production !

---

## Tests à effectuer

- [ ] Connexion apprenant
- [ ] Affichage du dashboard apprenant
- [ ] Lecture d'une leçon et marquage comme "lu"
- [ ] Soumission d'une évaluation de chapitre
- [ ] Affichage de la progression dans le dashboard admin
- [ ] Calcul correct des XP et déblocage de badges

---

## Notes importantes

1. **Compatibilité ascendante** : L'ancienne structure `/users/{uid}/programs/...` n'est plus utilisée dans le code. Les données doivent être migrées.

2. **organizationId requis** : Tous les nouveaux enregistrements nécessitent un `organizationId` valide.

3. **Hook useHistorique** : Utilise encore l'ancienne structure pour l'historique détaillé. À migrer dans une future phase.

4. **Toasts et notifications** : Le système de gamification utilise `useToast()` pour afficher les badges débloqués et les gains d'XP.

---

## Prochaines étapes

1. ✅ Migration des hooks et composants principaux
2. 🔄 Tests manuels complets (en cours)
3. ⏳ Migration du hook `useHistorique`
4. ⏳ Nettoyage des anciennes données (après confirmation)
5. ⏳ Documentation pour les développeurs

---

## Support

Pour toute question ou problème lié à cette migration, consultez :
- `/src/services/userDataService.js` : Code source du service
- Ce fichier : Documentation de la migration
