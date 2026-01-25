# Système d'Évaluation - Nouvelle Architecture

## Date : 24 janvier 2026

## Vue d'ensemble

Le système d'évaluation a été entièrement migré vers la nouvelle architecture de données centralisée. Toutes les évaluations (chapitres et programmes complets) sont maintenant sauvegardées dans `/evaluationResults/` et déclenchent automatiquement les mises à jour de gamification.

---

## Architecture

### Flux complet d'évaluation

```
1. Utilisateur démarre une évaluation
   ↓
2. Hook charge les exercices depuis /organizations/{orgId}/programs/{programId}/chapitres/{chapterId}/exercises/main
   ↓
3. Utilisateur répond aux questions
   ↓
4. Soumission de l'évaluation
   ↓
5. Sauvegarde dans /evaluationResults/{resultId}
   ↓
6. Mise à jour gamification dans /gamification/{userId}
   ↓
7. Affichage des résultats avec XP gagné et badges débloqués
```

---

## Composants principaux

### 1. Évaluation de chapitre

**Fichiers :**
- `src/pages/apprenant/ApprenantChapterEvaluation.jsx` - Interface d'évaluation
- `src/pages/apprenant/ApprenantChapterEvaluationResults.jsx` - Page de résultats
- `src/hooks/useChapterEvaluation.js` - Logique métier

**Fonctionnement :**
1. Charge TOUS les exercices du chapitre
2. Mélange aléatoirement (Fisher-Yates)
3. Présente un exercice à la fois
4. À la fin :
   - Sauvegarde dans `/evaluationResults/`
   - Met à jour gamification (`onEvaluationCompleted`)
   - Navigue vers la page de résultats

**Exemple d'utilisation :**
```javascript
const { 
  evaluation, 
  currentBlock, 
  answerBlock, 
  submitEvaluation 
} = useChapterEvaluation(userId, programId, chapterId, organizationId);

// Répondre à une question
answerBlock(blockId, userAnswer);

// Soumettre
const result = await submitEvaluation();
if (result.success) {
  // Mettre à jour gamification
  await onEvaluationCompleted(result.results.score, chapterId);
}
```

### 2. Évaluation de programme complet

**Fichiers :**
- `src/pages/apprenant/ApprenantProgramEvaluation.jsx` - Interface d'évaluation
- `src/pages/apprenant/ApprenantProgramEvaluationResults.jsx` - Page de résultats
- `src/hooks/useProgramEvaluation.js` - Logique métier

**Fonctionnement :**
1. Charge TOUS les exercices de TOUS les chapitres du programme
2. Mélange aléatoirement (Fisher-Yates)
3. Présente un exercice à la fois
4. À la fin :
   - Sauvegarde dans `/evaluationResults/` avec `chapterId: 'program_full'`
   - Met à jour gamification (`onEvaluationCompleted` + `onProgramCompleted` si score >= 70%)
   - Navigue vers la page de résultats

**Exemple d'utilisation :**
```javascript
const { 
  evaluation, 
  currentBlock, 
  answerBlock, 
  submitEvaluation 
} = useProgramEvaluation(userId, programId, organizationId);

// Répondre à une question
answerBlock(blockId, userAnswer);

// Soumettre
const result = await submitEvaluation();
if (result.success) {
  const percentage = result.results.score;
  
  // Mettre à jour gamification
  await onEvaluationCompleted(percentage, 'program_full');
  
  // Si réussi, marquer le programme comme complété
  if (percentage >= 70) {
    await onProgramCompleted(programId);
  }
}
```

---

## Structure des données

### Résultat d'évaluation

**Chemin :** `/evaluationResults/{resultId}`

```javascript
{
  id: "result_1706112000000_abc123",
  organizationId: "org789",
  userId: "user123",
  programId: "prog456",
  chapterId: "chap789", // ou "program_full" pour évaluation complète
  score: 85,
  maxScore: 100,
  duration: 180, // en secondes
  answers: {
    type: "chapter", // ou "program"
    userAnswers: {
      "block1": "answer1",
      "block2": ["answer2a", "answer2b"]
    },
    results: [
      {
        blockId: "block1",
        type: "qcm",
        isCorrect: true,
        points: 10,
        earnedPoints: 10,
        correctAnswer: 2,
        userAnswer: 2,
        sourceChapterId: "chap789",
        sourceChapterTitle: "Introduction"
      }
    ],
    totalPoints: 100,
    earnedPoints: 85
  },
  completedAt: Timestamp,
  createdAt: Timestamp
}
```

---

## Gamification

### Récompenses automatiques

**Après une évaluation de chapitre :**
- XP : Variable selon le score (proportionnel)
- Stats : `evaluationsCompleted` +1
- Si score = 100% : `perfectScores` +1
- Si score >= 80% : `excellentScores` +1
- Badges potentiels : `perfect_score`, `excellent_5`

**Après une évaluation de programme (score >= 70%) :**
- XP : Bonus significatif (MODULE_COMPLETED * 2)
- Stats : `programsCompleted` +1
- Badges potentiels : `program_complete`, `all_programs`

### Exemple de mise à jour gamification

```javascript
import { useGamification } from '../../hooks/useGamification';

function EvaluationPage() {
  const { onEvaluationCompleted, onProgramCompleted } = useGamification();
  
  const handleSubmit = async () => {
    // ... calcul du score
    
    // Mise à jour gamification
    await onEvaluationCompleted(percentage, chapterId);
    
    // Si évaluation de programme réussie
    if (isProgramEvaluation && percentage >= 70) {
      await onProgramCompleted(programId);
    }
  };
}
```

---

## Types d'exercices supportés

Les types d'exercices suivants sont évalués automatiquement :

1. **Flashcard** (`flashcard`) - Auto-évaluation par l'apprenant
2. **Vrai/Faux** (`true_false`) - Question binaire
3. **QCM Simple** (`qcm`) - Une seule bonne réponse
4. **QCM Multiple** (`qcm_selective`) - Plusieurs bonnes réponses
5. **Réorganiser** (`reorder`) - Remettre dans le bon ordre
6. **Glisser-Déposer** (`drag_drop`) - Associer éléments et zones
7. **Associer des paires** (`match_pairs`) - Relier les bonnes paires

**Note :** Les exercices de type `text` (texte libre) ne sont PAS évalués automatiquement.

---

## Calcul du score

### Score global
```javascript
score = Math.round((earnedPoints / totalPoints) * 100)
```

### Points par exercice
Chaque exercice a un champ `points` qui définit sa valeur.

**Par défaut :** 10 points

**Correction :**
- ✅ Réponse correcte : Points complets
- ❌ Réponse incorrecte : 0 point
- ⚠️ Pas de points partiels (sauf pour les flashcards avec auto-évaluation)

---

## Critères de réussite

| Type d'évaluation | Seuil de réussite | Actions |
|-------------------|-------------------|---------|
| Chapitre | 70% | Déblocage du chapitre suivant |
| Programme complet | 70% | Programme marqué comme terminé, gros bonus XP |

---

## Navigation

### Routes

```javascript
// Évaluation de chapitre
/apprenant/evaluation/:programId/:chapterId

// Résultats de chapitre
/apprenant/evaluation/:programId/:chapterId/results

// Évaluation de programme complet
/apprenant/program-evaluation/:programId

// Résultats de programme
/apprenant/program-evaluation/:programId/results
```

---

## Logs de débogage

Le système log extensivement pour faciliter le débogage :

```javascript
// Chargement
console.log('🔍 Chargement évaluation chapitre:', { programId, chapterId });
console.log('📚 X chapitres trouvés dans le programme');

// Soumission
console.log('💾 Sauvegarde résultat évaluation avec userDataService');
console.log('✅ Évaluation soumise avec succès:', { resultId, score, duration });

// Gamification
console.log('🎮 Mise à jour gamification après évaluation:', { percentage, chapterId });
console.log('✅ Gamification mise à jour avec succès');
```

---

## Gestion des erreurs

### Erreurs non bloquantes
La mise à jour de la gamification est **non bloquante** :
- Si elle échoue, l'évaluation est quand même sauvegardée
- Un log d'avertissement est affiché
- L'utilisateur peut voir ses résultats normalement

```javascript
try {
  await onEvaluationCompleted(percentage, chapterId);
} catch (gamifError) {
  console.error('⚠️ Erreur mise à jour gamification (non bloquante):', gamifError);
}
```

### Erreurs bloquantes
- Échec de sauvegarde dans `/evaluationResults/` : Alerte utilisateur
- Paramètres manquants (userId, programId, organizationId) : Bloque la soumission

---

## Tests recommandés

### 1. Test basique
- [ ] Démarrer une évaluation de chapitre
- [ ] Répondre à toutes les questions
- [ ] Soumettre l'évaluation
- [ ] Vérifier que la page de résultats s'affiche
- [ ] Vérifier le score calculé

### 2. Test gamification
- [ ] Noter l'XP avant l'évaluation
- [ ] Compléter l'évaluation avec score >= 80%
- [ ] Vérifier que l'XP a augmenté
- [ ] Vérifier que les stats sont mises à jour
- [ ] Vérifier les badges débloqués

### 3. Test Firebase
- [ ] Ouvrir Firebase Console
- [ ] Naviguer vers `/evaluationResults/`
- [ ] Vérifier qu'un nouveau document a été créé
- [ ] Vérifier que `organizationId`, `userId`, `programId`, `chapterId` sont corrects
- [ ] Naviguer vers `/gamification/{userId}`
- [ ] Vérifier que `xp`, `level`, `stats` sont mis à jour

### 4. Test évaluation programme
- [ ] Compléter une évaluation de programme complet
- [ ] Obtenir un score >= 70%
- [ ] Vérifier que `programsCompleted` augmente
- [ ] Vérifier le badge `program_complete`

---

## Dépannage

### Les résultats ne s'affichent pas
**Cause :** `location.state` est vide  
**Solution :** Vérifier que `submitEvaluation()` retourne bien `results` et `duration`

### La gamification ne se met pas à jour
**Cause :** `organizationId` manquant ou `userId` incorrect  
**Solution :** Vérifier les logs console, s'assurer que `useAuth()` retourne les bonnes valeurs

### Les exercices ne se chargent pas
**Cause :** Chemin Firebase incorrect ou exercices manquants  
**Solution :** Vérifier que les exercices existent dans `/organizations/{orgId}/programs/{programId}/chapitres/{chapterId}/exercises/main`

### Double récompense XP
**Cause :** L'utilisateur a refait la même évaluation  
**Solution :** Le système vérifie `rewardedActions.evaluations` pour éviter les doublons. Si le problème persiste, vérifier que l'ID d'évaluation est bien passé.

---

## Prochaines améliorations possibles

1. **Historique des tentatives** : Afficher toutes les tentatives d'une évaluation
2. **Analyse par type d'exercice** : "Tu maîtrises bien les QCM mais moins les Vrai/Faux"
3. **Révision des erreurs** : Bouton "Revoir mes erreurs" avec correction détaillée
4. **Timer par question** : Limite de temps par exercice
5. **Mode révision** : Refaire uniquement les questions ratées
6. **Classement** : Comparer ses scores avec les autres apprenants

---

## Résumé technique

✅ **Sauvegarde centralisée** : Tous les résultats dans `/evaluationResults/`  
✅ **Multi-tenant** : `organizationId` inclus dans chaque document  
✅ **Gamification automatique** : XP, badges et stats mis à jour automatiquement  
✅ **Gestion d'erreurs robuste** : Erreurs gamification non bloquantes  
✅ **Logs détaillés** : Débogage facilité avec logs emoji  
✅ **Types d'exercices variés** : 7 types supportés  
✅ **Score calculé précisément** : Points pondérés par exercice  
✅ **Interface moderne** : Design soigné avec gradient et animations  

---

## Support

Pour toute question :
- Consulter les logs console (filtrer par emoji 🔍 📚 💾 ✅ ❌)
- Vérifier Firebase Console pour l'état des données
- Consulter `MIGRATION_NOUVELLE_ARCHITECTURE.md` pour la structure globale
