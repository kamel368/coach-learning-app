# 🔥 CONFIGURATION FIREBASE - Guide Complet

Ce guide t'accompagne pour configurer Firebase pour le nouveau système d'évaluations et d'affectations.

---

## 📋 ÉTAPE 1 : DÉPLOYER LES RÈGLES FIRESTORE

### Option A : Via Firebase CLI (Recommandé)

**1. Installer Firebase CLI (si pas déjà fait) :**
```bash
npm install -g firebase-tools
```

**2. Se connecter à Firebase :**
```bash
firebase login
```

**3. Initialiser Firebase dans le projet (si pas déjà fait) :**
```bash
firebase init firestore
```
Choisis :
- ✅ `firestore.rules` comme fichier de règles
- ✅ Utilise les valeurs par défaut pour le reste

**4. Déployer les règles :**
```bash
firebase deploy --only firestore:rules
```

**Résultat attendu :**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/coach-learning-app/overview
```

---

### Option B : Via la Console Firebase (Manuel)

**1. Accéder aux règles :**
- Va sur https://console.firebase.google.com
- Clique sur ton projet **coach-learning-app**
- Dans le menu de gauche : **Firestore Database** → **Règles**

**2. Copier/Coller les règles :**
- Ouvre le fichier `firestore.rules` à la racine du projet
- Copie tout son contenu
- Colle-le dans l'éditeur de la console Firebase
- Clique sur **Publier**

**3. Vérification :**
Tu devrais voir un message : "Vos règles ont été publiées avec succès"

---

## 📊 ÉTAPE 2 : CRÉER LES INDEX FIRESTORE

Les index sont nécessaires pour les requêtes complexes (tri, filtrage sur plusieurs champs).

### Accéder aux Index

1. Va sur https://console.firebase.google.com
2. Clique sur **coach-learning-app**
3. Dans le menu de gauche : **Firestore Database** → **Index**
4. Clique sur **Créer un index**

---

### Index 1 : Evaluations par Module

**Objectif :** Récupérer toutes les évaluations d'un module triées par date

```
Collection ID: evaluations

Champs indexés :
  1. moduleId       → Ascending
  2. createdAt      → Descending

Statut de la requête : Enabled
```

**Comment créer :**
- Clique "Créer un index"
- Collection ID : `evaluations`
- Ajouter un champ : `moduleId` → Ordre : **Croissant**
- Ajouter un champ : `createdAt` → Ordre : **Décroissant**
- Clique "Créer"

---

### Index 2 : Evaluations par Programme et Type

**Objectif :** Récupérer les évaluations d'un programme filtrées par type

```
Collection ID: evaluations

Champs indexés :
  1. programId      → Ascending
  2. type           → Ascending
  3. createdAt      → Descending

Statut de la requête : Enabled
```

**Comment créer :**
- Clique "Créer un index"
- Collection ID : `evaluations`
- Ajouter un champ : `programId` → Ordre : **Croissant**
- Ajouter un champ : `type` → Ordre : **Croissant**
- Ajouter un champ : `createdAt` → Ordre : **Décroissant**
- Clique "Créer"

---

### Index 3 : Tentatives par User

**Objectif :** Récupérer toutes les tentatives d'un user triées par date

```
Collection ID: userEvaluationAttempts

Champs indexés :
  1. userId         → Ascending
  2. completedAt    → Descending

Statut de la requête : Enabled
```

**Comment créer :**
- Clique "Créer un index"
- Collection ID : `userEvaluationAttempts`
- Ajouter un champ : `userId` → Ordre : **Croissant**
- Ajouter un champ : `completedAt` → Ordre : **Décroissant**
- Clique "Créer"

---

### Index 4 : Tentatives par User et Evaluation

**Objectif :** Récupérer toutes les tentatives d'un user pour une évaluation spécifique

```
Collection ID: userEvaluationAttempts

Champs indexés :
  1. userId         → Ascending
  2. evaluationId   → Ascending
  3. completedAt    → Descending

Statut de la requête : Enabled
```

**Comment créer :**
- Clique "Créer un index"
- Collection ID : `userEvaluationAttempts`
- Ajouter un champ : `userId` → Ordre : **Croissant**
- Ajouter un champ : `evaluationId` → Ordre : **Croissant**
- Ajouter un champ : `completedAt` → Ordre : **Décroissant**
- Clique "Créer"

---

### ⏱️ Temps de Création

- Les index prennent **quelques minutes** à se créer
- Status : "Création en cours..." → "Activé"
- Tu peux continuer à travailler pendant ce temps

---

## 🔄 ÉTAPE 3 : MIGRATION DES USERS (Optionnel)

**Objectif :** Ajouter le champ `assignedPrograms: []` à tous les users existants.

### Option A : Via le Script

```bash
# Depuis la racine du projet
node scripts/addAssignedPrograms.js
```

**Voir `scripts/README.md` pour plus de détails.**

---

### Option B : Manuellement via la Console

Pour chaque user dans **Firestore Database** → **users** :

1. Clique sur un document user
2. Clique sur "Ajouter un champ"
3. Nom du champ : `assignedPrograms`
4. Type : **array**
5. Valeur : (laisser vide pour un tableau vide)
6. Clique "Mettre à jour"
7. Répète pour tous les users

---

## ✅ VÉRIFICATION FINALE

### Règles Déployées ✓

**Dans la console Firebase :**
- Firestore Database → Règles
- Tu devrais voir tes nouvelles règles avec `match /evaluations/` et `match /userEvaluationAttempts/`

---

### Index Créés ✓

**Dans la console Firebase :**
- Firestore Database → Index
- Tu devrais voir 4 index :
  1. `evaluations` (moduleId, createdAt)
  2. `evaluations` (programId, type, createdAt)
  3. `userEvaluationAttempts` (userId, completedAt)
  4. `userEvaluationAttempts` (userId, evaluationId, completedAt)

Status : **Activé** (ou "Création en cours...")

---

### Users Migrés ✓

**Dans la console Firebase :**
- Firestore Database → users
- Clique sur un user
- Tu devrais voir le champ `assignedPrograms: []`

---

## 🚨 TROUBLESHOOTING

### Erreur : "Permission denied"

**Cause :** Les règles Firestore ne sont pas déployées correctement.

**Solution :**
1. Va dans Firestore Database → Règles
2. Vérifie que les règles sont publiées
3. Vérifie que l'utilisateur est authentifié dans l'app

---

### Erreur : "Missing index"

**Cause :** Un index n'est pas créé.

**Solution :**
1. Va dans Firestore Database → Index
2. Clique sur le lien dans l'erreur (il crée automatiquement l'index)
3. Attends quelques minutes que l'index soit activé

---

### Script de migration ne fonctionne pas

**Erreur :** `Cannot use import statement outside a module`

**Solution :**
```bash
# Renommer en .mjs
mv scripts/addAssignedPrograms.js scripts/addAssignedPrograms.mjs

# Relancer
node scripts/addAssignedPrograms.mjs
```

---

## 📚 RÉSUMÉ

**Fichiers créés :**
- ✅ `firestore.rules` : Règles de sécurité
- ✅ `scripts/addAssignedPrograms.js` : Script de migration
- ✅ `scripts/README.md` : Documentation des scripts
- ✅ `FIREBASE_SETUP.md` : Ce guide (vous êtes ici !)

**Actions à faire :**
- ✅ Déployer les règles Firestore
- ✅ Créer les 4 index
- ✅ (Optionnel) Lancer le script de migration

---

**Une fois tout fait, tu peux passer à la création de l'interface admin ! 🎯**
