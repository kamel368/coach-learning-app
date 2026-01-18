# ⚡️ QUICK START - Déploiement Firebase Rapide

## 🚀 OPTION 1 : DÉPLOIEMENT AUTOMATIQUE (Recommandé)

**Tout en une seule fois via Firebase CLI :**

```bash
# 1. Installer Firebase CLI (si pas déjà fait)
npm install -g firebase-tools

# 2. Se connecter
firebase login

# 3. Initialiser (si pas déjà fait)
firebase init firestore

# 4. Déployer règles + index
firebase deploy --only firestore

# 5. (Optionnel) Migrer les users
node scripts/addAssignedPrograms.js
```

**Temps estimé : ~3-5 minutes** ⏱️

---

## 🖱️ OPTION 2 : DÉPLOIEMENT MANUEL (Via Console)

**Si tu préfères faire ça dans la console Firebase :**

### Étape 1 : Règles (2 min)
1. https://console.firebase.google.com → **coach-learning-app**
2. **Firestore Database** → **Règles**
3. Copier le contenu de `firestore.rules`
4. Coller dans l'éditeur
5. Cliquer **Publier**

### Étape 2 : Index (3 min + 5-10 min d'attente)
1. **Firestore Database** → **Index**
2. **Créer un index** (4 fois au total)

**Index 1 :**
- Collection: `evaluations`
- Champs: `moduleId` (↑), `createdAt` (↓)

**Index 2 :**
- Collection: `evaluations`
- Champs: `programId` (↑), `type` (↑), `createdAt` (↓)

**Index 3 :**
- Collection: `userEvaluationAttempts`
- Champs: `userId` (↑), `completedAt` (↓)

**Index 4 :**
- Collection: `userEvaluationAttempts`
- Champs: `userId` (↑), `evaluationId` (↑), `completedAt` (↓)

### Étape 3 : Migration (Optionnel, 1 min)
**Option A : Script**
```bash
node scripts/addAssignedPrograms.js
```

**Option B : Manuel**
- **Firestore Database** → **users**
- Pour chaque user : Ajouter champ `assignedPrograms` (type array, vide)

**Temps estimé : ~10-15 minutes** ⏱️

---

## ✅ VÉRIFICATION RAPIDE

```bash
# Vérifier que les règles sont déployées
firebase firestore:rules get

# Vérifier que les index sont créés (via console uniquement)
# https://console.firebase.google.com → Firestore Database → Index
```

**Dans la console Firebase :**
- [ ] **Règles** : Tu vois `match /evaluations/` et `match /userEvaluationAttempts/`
- [ ] **Index** : 4 index avec statut "Activé" (ou "Création en cours...")
- [ ] **Users** : Un user a le champ `assignedPrograms: []`

---

## 🎯 APRÈS LE DÉPLOIEMENT

**Tu es prêt pour SESSION 1.2 !**

Dis **"FIREBASE OK"** et on passe à la création de l'interface admin d'affectation des programmes ! 🚀

---

## 📚 DOCUMENTATION COMPLÈTE

- **Guide détaillé :** `FIREBASE_SETUP.md`
- **Scripts :** `scripts/README.md`
- **Récapitulatif :** `SESSION_1.1_RECAP.md`
