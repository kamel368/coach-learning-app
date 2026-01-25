# 🔄 Plan de Refactoring : Module → Chapitre

## 📋 Vue d'ensemble

**Objectif** : Renommer tous les "modules" en "chapitres" dans l'application.

**Impact** : 39 fichiers identifiés  
**Complexité** : ⭐⭐⭐⭐⭐ (Très élevée)  
**Durée estimée** : 2-3 heures  
**Risque** : Élevé (breaking changes)

---

## 🎯 Règles de Transformation

### Code (JavaScript/JSX)

| Avant | Après | Contexte |
|-------|-------|----------|
| `module` | `chapter` | Variable (camelCase) |
| `Module` | `Chapter` | Nom de composant |
| `moduleId` | `chapterId` | ID Firebase |
| `modules` | `chapters` | Tableau |
| `useModule` | `useChapter` | Hook |
| `/modules/` | `/chapitres/` | Chemin Firebase |
| `/module/` | `/chapter/` | Route URL |

### UI (Textes affichés)

| Avant | Après |
|-------|-------|
| Module | Chapitre |
| Modules | Chapitres |
| module | chapitre |
| modules | chapitres |
| ce module | ce chapitre |
| du module | du chapitre |

### Firebase (Collections Firestore)

| Avant | Après |
|-------|-------|
| `/programs/{id}/modules` | `/programs/{id}/chapitres` |
| `/organizations/{orgId}/programs/{id}/modules` | `/organizations/{orgId}/programs/{id}/chapitres` |

### Noms de Fichiers

| Avant | Après |
|-------|-------|
| `ApprenantModuleDetail.jsx` | `ApprenantChapterDetail.jsx` |
| `ApprenantModuleEvaluation.jsx` | `ApprenantChapterEvaluation.jsx` |
| `ApprenantModuleEvaluationResults.jsx` | `ApprenantChapterEvaluationResults.jsx` |
| `useModuleEvaluation.js` | `useChapterEvaluation.js` |

---

## 📂 Fichiers à Modifier (39 fichiers)

### Hooks (2 fichiers)
- ✅ `src/hooks/useModuleEvaluation.js` → `useChapterEvaluation.js`
- ⚠️ `src/hooks/useProgramEvaluation.js` (références internes)

### Pages Apprenant (6 fichiers)
- ✅ `src/pages/apprenant/ApprenantModuleDetail.jsx` → `ApprenantChapterDetail.jsx`
- ✅ `src/pages/apprenant/ApprenantModuleEvaluation.jsx` → `ApprenantChapterEvaluation.jsx`
- ✅ `src/pages/apprenant/ApprenantModuleEvaluationResults.jsx` → `ApprenantChapterEvaluationResults.jsx`
- ⚠️ `src/pages/apprenant/ApprenantProgramDetail.jsx` (références)
- ⚠️ `src/pages/apprenant/ApprenantLessonViewer.jsx` (références)
- ⚠️ `src/pages/apprenant/ApprenantExercises.jsx` (références)

### Pages Admin (4 fichiers)
- ⚠️ `src/pages/AdminPrograms.jsx`
- ⚠️ `src/pages/AdminProgramDetail.jsx`
- ⚠️ `src/pages/AdminProgramDetail_new.jsx`
- ⚠️ `src/pages/Dashboard.jsx`

### Services (2 fichiers)
- ⚠️ `src/services/lessonsService.js`
- ⚠️ `src/services/progressionService.js`

### Scripts (7 fichiers)
- ⚠️ `src/scripts/auditExercises.js`
- ⚠️ `src/scripts/migrateToMultiTenant.js`
- ⚠️ `src/scripts/cleanupOldStructure.js`
- ⚠️ `src/scripts/verifyBeforeCleanup.js`
- ⚠️ `src/scripts/resetDatabasePartial.js`
- ⚠️ `src/scripts/migration/migrationStep1.js`
- ⚠️ `src/scripts/migration/migrationStep3.js`

### Autres (18 fichiers)
- ⚠️ `src/App.jsx` (routes)
- ⚠️ Tous les autres fichiers listés

---

## 🚨 Points Critiques

### 1. Firebase Paths
⚠️ **ATTENTION** : Changer les chemins Firebase va rendre les données existantes inaccessibles !

**Solution** : 
- Créer un script de migration Firestore
- Copier `/modules` → `/chapitres`
- Garder les deux structures pendant la transition
- Nettoyer après validation

### 2. Routes URL
Les routes changent :
- `/module/:id` → `/chapter/:id`
- `/modules` → `/chapters`

**Impact** : Les liens existants et bookmarks seront cassés.

### 3. LocalStorage/SessionStorage
Vérifier si des clés utilisent "module" :
```javascript
localStorage.getItem('currentModuleId')
// → localStorage.getItem('currentChapterId')
```

### 4. Backward Compatibility
Certains utilisateurs peuvent avoir des URLs bookmarkées.

**Solution** : Ajouter des redirections dans `App.jsx` :
```javascript
<Route path="/module/:id" element={<Navigate to="/chapter/:id" replace />} />
```

---

## 🔧 Stratégie de Migration

### Phase 1 : Préparation
1. ✅ Créer une branche Git dédiée
2. ✅ Backup de la base de données
3. ✅ Documentation du plan

### Phase 2 : Code
1. Renommer les fichiers (hooks, pages)
2. Mettre à jour les imports
3. Remplacer les variables (`module` → `chapter`)
4. Remplacer les textes UI
5. Compiler et corriger les erreurs

### Phase 3 : Firebase (CRITIQUE)
1. **Option A** : Migration progressive
   - Garder `/modules` en lecture seule
   - Écrire dans `/chapitres`
   - Double lecture (fallback)
   
2. **Option B** : Migration complète
   - Script de copie Firestore
   - Vérification intégrité
   - Suppression ancienne structure

**Recommandation** : Option A pour éviter la casse

### Phase 4 : Tests
1. Compiler sans erreurs
2. Tester création de programme
3. Tester navigation apprenant
4. Tester évaluations
5. Vérifier Firebase Console

### Phase 5 : Déploiement
1. Déployer le code
2. Exécuter script de migration Firebase
3. Vérifier en production
4. Nettoyer après 1 semaine

---

## 📝 Checklist de Validation

### Code
- [ ] Aucune occurrence de `moduleId` (sauf commentaires)
- [ ] Aucune occurrence de `/modules/` dans les chemins Firebase
- [ ] Tous les imports mis à jour
- [ ] Compilation sans erreur
- [ ] Linter sans erreur

### UI
- [ ] Tous les textes affichent "Chapitre"
- [ ] Breadcrumbs corrects
- [ ] Titres de page corrects
- [ ] Notifications/toasts corrects

### Firebase
- [ ] Création de chapitre fonctionne
- [ ] Lecture de chapitre fonctionne
- [ ] Mise à jour fonctionne
- [ ] Suppression fonctionne
- [ ] Migration complète des données

### Routes
- [ ] `/chapter/:id` fonctionne
- [ ] Redirections `/module/:id` fonctionnent
- [ ] Navigation breadcrumb fonctionne
- [ ] Retour arrière navigateur fonctionne

---

## 🎯 Fichiers Prioritaires (Ordre de modification)

### Niveau 1 : Hooks (Base)
1. `useModuleEvaluation.js` → `useChapterEvaluation.js`

### Niveau 2 : Services
2. `progressionService.js`
3. `lessonsService.js`

### Niveau 3 : Pages Apprenant
4. `ApprenantModuleDetail.jsx` → `ApprenantChapterDetail.jsx`
5. `ApprenantModuleEvaluation.jsx` → `ApprenantChapterEvaluation.jsx`
6. `ApprenantModuleEvaluationResults.jsx` → `ApprenantChapterEvaluationResults.jsx`
7. `ApprenantProgramDetail.jsx`
8. `ApprenantLessonViewer.jsx`

### Niveau 4 : Pages Admin
9. `AdminPrograms.jsx`
10. `AdminProgramDetail.jsx`
11. `AdminProgramDetail_new.jsx`
12. `Dashboard.jsx`

### Niveau 5 : Routes
13. `App.jsx`

### Niveau 6 : Scripts
14. Tous les scripts de migration

---

## ⚠️ Risques Identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Données inaccessibles | Élevée | Critique | Migration + fallback |
| Imports cassés | Moyenne | Élevée | Tests compilation |
| Routes cassées | Élevée | Moyenne | Redirections |
| Regressions UI | Faible | Faible | Tests manuels |
| Performance Firebase | Faible | Faible | Indexation |

---

## 🚀 Estimation Temps

| Phase | Temps estimé |
|-------|--------------|
| Renommer fichiers | 10 min |
| Mise à jour imports | 15 min |
| Remplacer variables | 30 min |
| Remplacer textes UI | 20 min |
| Chemins Firebase | 30 min |
| Compilation + correction | 30 min |
| Script migration Firebase | 45 min |
| Tests | 30 min |
| Documentation | 20 min |
| **TOTAL** | **3h 50min** |

---

## 🆘 Plan de Rollback

En cas de problème majeur :

1. **Git** : `git revert` ou `git reset --hard`
2. **Firebase** : Restaurer backup
3. **Déploiement** : Redéployer version précédente
4. **Communication** : Informer les utilisateurs

---

## 📚 Commandes Utiles

### Recherche
```bash
# Trouver tous les "module" dans le code
grep -r "module" src/ --include="*.js" --include="*.jsx"

# Compter les occurrences
grep -r "module" src/ --include="*.js" --include="*.jsx" | wc -l
```

### Remplacement (À UTILISER AVEC PRÉCAUTION)
```bash
# Remplacer dans tous les fichiers (DRY RUN d'abord)
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's/moduleId/chapterId/g' {} +
```

---

_Document créé le 24 janvier 2026_
_Dernière mise à jour : 24 janvier 2026_
