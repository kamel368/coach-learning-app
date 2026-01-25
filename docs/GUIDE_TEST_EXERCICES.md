# 🧪 GUIDE DE TEST - Correction Exercices Multi-Tenant

## 📋 Vue d'ensemble

Ce guide vous permet de valider que la correction des exercices multi-tenant fonctionne correctement.

**Durée estimée :** 10-15 minutes  
**Prérequis :** Accès admin à l'application + accès Firebase Console

---

## ✅ Test 1 : Création d'un Nouvel Exercice

### Objectif
Vérifier que les nouveaux exercices sont créés dans la structure multi-tenant correcte.

### Étapes

1. **Se connecter en tant qu'admin**
   - Email : `k.moussaoui@simply-permis.com` (ou votre compte admin)

2. **Naviguer vers un programme**
   - Aller dans "Programmes"
   - Cliquer sur n'importe quel programme existant

3. **Sélectionner un chapitre**
   - Cliquer sur un chapitre existant
   - OU créer un nouveau chapitre de test

4. **Ouvrir l'éditeur d'exercices**
   - Cliquer sur le bouton "🎯 Exercices" (ou "Gérer les exercices")

5. **Créer un exercice de test**
   - Aller dans l'onglet "Blocs"
   - Cliquer sur "Flashcard"
   - Remplir :
     - Question : "Test multi-tenant - Question"
     - Réponse : "Test multi-tenant - Réponse"
   - Cliquer sur "Enregistrer"

6. **Vérifier les logs console** (F12 > Console)
   ```
   ✅ Logs attendus :
   📚 Chargement exercices depuis: organizations/{orgId}/programs/{programId}/chapitres/{chapterId}/exercises/main
   💾 Sauvegarde exercices dans: organizations/{orgId}/programs/{programId}/chapitres/{chapterId}/exercises/main
   ✅ Exercices sauvegardés avec succès
   
   ❌ Ne doit PAS contenir :
   programs/{programId}/chapitres/{chapterId}/exercises/main (sans "organizations")
   ```

7. **Vérifier Firebase Console**
   - Ouvrir Firebase Console : https://console.firebase.google.com
   - Aller dans Firestore Database
   - Naviguer vers :
     ```
     organizations
       └── {votre-org-id}
           └── programs
               └── {program-id}
                   └── chapitres
                       └── {chapitre-id}
                           └── exercises
                               └── main
     ```
   - ✅ Le document doit exister ici
   - ❌ Vérifier qu'il n'existe PAS dans `/programs` (à la racine)

### Résultat attendu
- [x] Exercice créé avec succès
- [x] Alert "✅ Exercices enregistrés !" affiché
- [x] Logs console corrects
- [x] Document dans `/organizations/{orgId}/programs/...`
- [x] Document N'EXISTE PAS dans `/programs/...`

---

## ✅ Test 2 : Modification d'un Exercice Existant

### Objectif
Vérifier que la modification d'exercices fonctionne correctement.

### Étapes

1. **Retourner sur l'éditeur d'exercices** (même chapitre que Test 1)

2. **Modifier l'exercice de test**
   - Changer la question en : "Test multi-tenant - Question MODIFIÉE"
   - Cliquer sur "Enregistrer"

3. **Vérifier les logs console**
   ```
   ✅ Logs attendus :
   💾 Sauvegarde exercices dans: organizations/{orgId}/programs/{programId}/chapitres/{chapterId}/exercises/main
   ✅ Exercices sauvegardés avec succès
   ```

4. **Rafraîchir la page**
   - Vérifier que la modification est bien persistée
   - L'exercice doit afficher "Question MODIFIÉE"

### Résultat attendu
- [x] Modification enregistrée avec succès
- [x] Modification persistée après rafraîchissement
- [x] Logs console corrects

---

## ✅ Test 3 : Chargement d'Exercices Existants

### Objectif
Vérifier que les exercices existants se chargent correctement.

### Étapes

1. **Fermer l'onglet de l'éditeur d'exercices**

2. **Rouvrir l'éditeur d'exercices** (même chapitre)

3. **Vérifier les logs console au chargement**
   ```
   ✅ Logs attendus :
   📚 Chargement exercices depuis: organizations/{orgId}/programs/{programId}/chapitres/{chapterId}/exercises/main
   ✅ Exercices chargés: X blocs
   ```

4. **Vérifier que l'exercice de test s'affiche correctement**
   - Question : "Test multi-tenant - Question MODIFIÉE"
   - Type : Flashcard

### Résultat attendu
- [x] Exercices chargés automatiquement
- [x] Logs console corrects
- [x] Contenu correct affiché

---

## ✅ Test 4 : Page de Diagnostic

### Objectif
Vérifier que la page de diagnostic affiche les bonnes informations.

### Étapes

1. **Récupérer les IDs** (depuis l'URL de l'éditeur d'exercices)
   - URL type : `/admin/programs/{programId}/chapitres/{chapterId}/exercises`
   - Noter `programId` et `chapterId`

2. **Ouvrir la page de diagnostic**
   - Aller sur : `/apprenant/programs/{programId}/chapitres/{chapterId}/exercise-debug`
   - Remplacer `{programId}` et `{chapterId}` par les valeurs notées

3. **Vérifier les informations affichées**
   ```
   ✅ Doit afficher :
   📍 CHEMIN FIREBASE
   organizations/{org-id}/programs/{program-id}/chapitres/{chapitre-id}/exercises/main
   
   🆔 IDENTIFIANTS
   Organization ID: {org-id}
   Program ID: {program-id}
   Chapitre ID: {chapitre-id}
   
   ✅ DOCUMENT EXISTE
   
   📦 DONNÉES
   {
     "organizationId": "{org-id}",
     "programId": "{program-id}",
     "chapterId": "{chapitre-id}",
     "blocks": [...]
   }
   ```

### Résultat attendu
- [x] Page de diagnostic s'affiche
- [x] Chemin correct (avec `organizations/{orgId}/`)
- [x] Organization ID affiché
- [x] Document existe
- [x] Données correctes affichées

---

## ✅ Test 5 : Évaluation Côté Apprenant

### Objectif
Vérifier que les apprenants peuvent faire les exercices correctement.

### Étapes

1. **Se connecter en tant qu'apprenant** (ou utiliser "Voir comme")
   - Si pas d'apprenant, en créer un temporairement
   - Lui assigner le programme de test

2. **Naviguer vers le programme**
   - Dashboard Apprenant > Programme de test

3. **Ouvrir le chapitre**
   - Cliquer sur le chapitre avec l'exercice de test

4. **Lancer les exercices**
   - Cliquer sur "🎯 Faire les exercices" (ou similaire)

5. **Vérifier les logs console**
   ```
   ✅ Logs attendus :
   🎯 Exercices depuis /organizations/{orgId}/programs/{programId}/chapitres/{chapterId}
   ✅ X exercices trouvés
   ```

6. **Compléter l'exercice**
   - Répondre à l'exercice Flashcard de test
   - Valider

### Résultat attendu
- [x] Exercices chargés correctement
- [x] Exercice s'affiche correctement
- [x] Peut être complété sans erreur
- [x] Logs console corrects

---

## ✅ Test 6 : Évaluation de Chapitre

### Objectif
Vérifier que les évaluations de chapitre incluent bien les exercices.

### Étapes

1. **Toujours connecté en tant qu'apprenant**

2. **Retourner sur le chapitre de test**

3. **Lancer une évaluation**
   - Cliquer sur "📊 Évaluation" (ou "Passer l'évaluation")

4. **Vérifier les logs console**
   ```
   ✅ Logs attendus :
   🔍 Chargement évaluation chapitre: { programId, chapterId }
   📚 X chapitres trouvés dans le programme
   🏢 Chargement depuis /organizations/{orgId}
   ✅ Chapitre "..." : X exercices
   🎯 Total exercices avant mélange: X
   🔀 Exercices mélangés: X
   ✅ Évaluation chargée avec succès
   ```

5. **Vérifier que l'exercice de test apparaît**
   - L'exercice Flashcard de test doit être dans l'évaluation

### Résultat attendu
- [x] Évaluation se lance
- [x] Exercices chargés depuis la structure multi-tenant
- [x] Exercice de test présent
- [x] Logs console corrects

---

## ✅ Test 7 : Vérification Firebase (Global)

### Objectif
S'assurer qu'aucune nouvelle collection `/programs` n'est créée à la racine.

### Étapes

1. **Ouvrir Firebase Console**
   - https://console.firebase.google.com
   - Firestore Database

2. **Vérifier la racine de la base de données**
   ```
   ✅ Structure correcte :
   organizations/
     └── {org-id}/
         └── programs/
             └── ... (vos programmes)
   
   users/
   platformAdmins/
   
   ❌ Ne doit PAS avoir :
   programs/ (à la racine, en dehors de organizations)
   ```

3. **Vérifier un document d'exercices**
   - Ouvrir un document `exercises/main` créé récemment
   - Vérifier qu'il contient le champ `organizationId`
   ```javascript
   {
     "organizationId": "qtCAf1TSqDxuSodEHTUT",
     "programId": "...",
     "chapterId": "...",
     "blocks": [...],
     "updatedAt": {...}
   }
   ```

### Résultat attendu
- [x] Pas de collection `/programs` à la racine
- [x] Tous les exercices dans `/organizations/{orgId}/programs/...`
- [x] Champ `organizationId` présent dans les documents

---

## 🚨 En Cas de Problème

### Problème : Exercices créés dans `/programs` au lieu de `/organizations`

**Symptômes :**
- Document créé dans `/programs/{programId}/chapitres/{chapterId}/exercises/main`
- Logs : `programs/{programId}...` (sans "organizations")

**Diagnostic :**
1. Vérifier la console : Y a-t-il une erreur `organizationId manquant` ?
2. Vérifier `AuthContext` : `organizationId` est-il bien défini ?

**Solution :**
1. Vérifier que l'utilisateur a bien un `organizationId` dans `/users/{userId}`
2. Rafraîchir la page
3. Réessayer de créer un exercice

---

### Problème : Exercices ne se chargent pas

**Symptômes :**
- Éditeur vide
- Message "Aucun exercice"

**Diagnostic :**
1. Ouvrir la console (F12)
2. Chercher les logs de chargement
3. Y a-t-il une erreur ?

**Solution :**
1. Utiliser la page de diagnostic : `/apprenant/programs/{programId}/chapitres/{chapterId}/exercise-debug`
2. Vérifier le chemin Firebase affiché
3. Vérifier que le document existe dans Firebase Console

---

### Problème : Évaluation vide

**Symptômes :**
- Message "Aucun exercice trouvé dans ce chapitre"

**Diagnostic :**
1. Console : Logs `⚠️ Aucun exercice trouvé`
2. Vérifier Firebase Console : Le document `exercises/main` existe-t-il ?

**Solution :**
1. Aller sur l'éditeur d'exercices
2. Créer au moins 1 exercice
3. Sauvegarder
4. Relancer l'évaluation

---

## 📊 Checklist Finale

Cochez tous les tests réussis :

- [ ] Test 1 : Création d'un nouvel exercice
- [ ] Test 2 : Modification d'un exercice existant
- [ ] Test 3 : Chargement d'exercices existants
- [ ] Test 4 : Page de diagnostic
- [ ] Test 5 : Évaluation côté apprenant
- [ ] Test 6 : Évaluation de chapitre
- [ ] Test 7 : Vérification Firebase (global)

### Si tous les tests sont ✅

**🎉 CORRECTION VALIDÉE !**

La correction de la structure multi-tenant des exercices fonctionne parfaitement. Vous pouvez :
- Continuer à créer des exercices normalement
- Migrer les données existantes (si nécessaire) avec le script `migrateExercises`

---

### Si des tests échouent ❌

1. Noter quel(s) test(s) échoue(nt)
2. Consulter la section "En Cas de Problème"
3. Vérifier les logs console
4. Vérifier Firebase Console
5. Si le problème persiste, consulter `docs/EXERCICES_MULTI_TENANT_FIX.md`

---

**Date du test :** _______________  
**Testeur :** _______________  
**Résultat global :** ✅ / ❌  
**Commentaires :** _______________________________________________
