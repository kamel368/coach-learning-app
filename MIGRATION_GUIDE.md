# 🚀 Guide de Migration Firebase Multi-Tenant

## 📋 Prérequis

- [x] Firebase CLI installé (`npm install -g firebase-tools`)
- [x] Authentifié avec Firebase (`firebase login`)
- [x] Projet initialisé (`firebase init`)
- [x] Sauvegarde de la base de données (export Firestore)

---

## 🔧 Étape 1 : Configuration

### 1.1 Récupérer ton UID Firebase

1. Va sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionne ton projet
3. Va dans **Authentication** → **Users**
4. Trouve ton utilisateur (k.moussaoui@simply-permis.com)
5. Copie l'**User UID** : `Oh0YjUfRBxQqjP27IizG1vtvSRH2`

### 1.2 Vérifier la configuration

Ouvre `src/scripts/migration/migrationStep1.js` et vérifie :

```javascript
const CONFIG = {
  SUPER_ADMIN_UID: "Oh0YjUfRBxQqjP27IizG1vtvSRH2",  // ✅ Ton UID
  SUPER_ADMIN_EMAIL: "k.moussaoui@simply-permis.com", // ✅ Ton email
  SUPER_ADMIN_FIRST_NAME: "Kamel",                    // ✅ Ton prénom
  SUPER_ADMIN_LAST_NAME: "Super Admin",               // ✅ Ton nom
  DEFAULT_ORG_ID: "org_default",
  DEFAULT_ORG_NAME: "Organisation par défaut"
};
```

---

## 🔐 Étape 2 : Déployer les Règles Firestore

### Option A : Via Firebase Console (Recommandé pour débuter)

1. Va sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionne ton projet
3. Va dans **Firestore Database** → **Rules**
4. Les règles temporaires sont déjà dans `firestore.rules` :
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
5. Clique sur **Publier** (Publish)

### Option B : Via Firebase CLI

```bash
# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Vérifier le déploiement
firebase firestore:rules --project <ton-project-id>
```

---

## 🎯 Étape 3 : Exécuter la Migration Step 1

### 3.1 Lancer l'application

```bash
npm run dev
```

### 3.2 Accéder à la page de migration

1. Connecte-toi en tant qu'admin
2. Va sur : `http://localhost:5173/admin/migration`

### 3.3 Exécuter la migration

1. Lis le message d'avertissement
2. Clique sur **"▶️ Exécuter Step 1"**
3. Observe les logs en temps réel

**Logs attendus :**

```
[14:32:15] 🚀 Démarrage Migration Step 1...
[14:32:16] 📦 1/3 - Création /platform/settings...
[14:32:16]    ✅ /platform/settings créé
[14:32:17] 👑 2/3 - Création Super Admin...
[14:32:17]    ✅ Super Admin créé: k.moussaoui@simply-permis.com
[14:32:18] 🏢 3/3 - Création organisation par défaut...
[14:32:18]    ✅ Organisation créée: org_default
[14:32:18] ✅ Migration Step 1 terminée avec succès !
```

---

## ✅ Étape 4 : Vérification dans Firebase Console

1. Va sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionne ton projet
3. Va dans **Firestore Database**
4. Vérifie que ces collections existent :

### `/platform/settings`
```javascript
{
  appName: "Coach HR",
  version: "1.0.0",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `/platform/admins/Oh0YjUfRBxQqjP27IizG1vtvSRH2`
```javascript
{
  userId: "Oh0YjUfRBxQqjP27IizG1vtvSRH2",
  email: "k.moussaoui@simply-permis.com",
  firstName: "Kamel",
  lastName: "Super Admin",
  role: "superadmin",
  status: "active",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `/organizations/org_default`
```javascript
{
  info: {
    name: "Organisation par défaut",
    email: "k.moussaoui@simply-permis.com",
    logoUrl: null,
    createdAt: Timestamp
  },
  modules: ["learning"],
  status: "active",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "Oh0YjUfRBxQqjP27IizG1vtvSRH2"
}
```

---

## 🔄 Prochaines Étapes (après Step 1)

### Step 2 : Migration des utilisateurs (À CRÉER)

```javascript
// src/scripts/migration/migrationStep2.js
export const migrationStep2 = async () => {
  // 1. Récupérer tous les users
  // 2. Pour chaque user :
  //    - Créer /organizations/org_default/employees/{userId}
  //    - Migrer profile (firstName, lastName, email)
  //    - Migrer role (admin → admin, learner → employee)
  //    - Copier assignedPrograms
  // 3. Créer /organizations/org_default/employees/{userId}/learning/progress
  //    - Migrer completedLessons
  //    - Migrer currentLesson
  //    - Migrer percentage
  // 4. Créer /organizations/org_default/employees/{userId}/learning/gamification
  //    - Migrer xp, level, badges, streak
};
```

### Step 3 : Migration des contenus (À CRÉER)

```javascript
// src/scripts/migration/migrationStep3.js
export const migrationStep3 = async () => {
  // 1. Migrer /programs → /organizations/org_default/programs
  // 2. Migrer /categories → /organizations/org_default/categories
  // 3. Migrer /quizzes vers les modules respectifs
  // 4. Migrer /aiExercises → /organizations/org_default/aiExercises
};
```

---

## ⚠️ Sécurité : Rétablir les Règles Complètes

**APRÈS avoir terminé toutes les migrations**, rétablis les règles complètes :

1. Ouvre `firestore.rules`
2. Décommente le bloc `/* ... */` avec les règles complètes
3. Supprime le bloc temporaire :
   ```javascript
   match /{document=**} {
     allow read, write: if request.auth != null;
   }
   ```
4. Déploie :
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 🐛 Dépannage

### Erreur : "Missing or insufficient permissions"

**Cause :** Les règles Firestore ne sont pas déployées

**Solution :**
```bash
firebase deploy --only firestore:rules
```

### Erreur : "Document already exists"

**Cause :** La migration a déjà été exécutée

**Solution :** Vérifie dans Firebase Console si les documents existent

### Erreur : "Cannot read properties of undefined"

**Cause :** UID incorrect dans CONFIG

**Solution :** Vérifie ton UID dans Firebase Console → Authentication

---

## 📊 Checklist Complète

### Avant la migration
- [ ] Sauvegarde Firestore (export)
- [ ] Vérifie ton UID Firebase
- [ ] Modifie CONFIG dans migrationStep1.js
- [ ] Déploie les règles Firestore temporaires

### Exécution Step 1
- [ ] Lance l'application (npm run dev)
- [ ] Va sur /admin/migration
- [ ] Exécute Step 1
- [ ] Vérifie les logs (tous ✅)
- [ ] Vérifie dans Firebase Console

### Après Step 1
- [ ] Crée migrationStep2.js
- [ ] Exécute Step 2
- [ ] Crée migrationStep3.js
- [ ] Exécute Step 3
- [ ] Rétablis les règles complètes
- [ ] Teste l'application

---

## 📝 Notes Importantes

### ⚠️ Ne PAS re-exécuter Step 1

Une fois exécuté, Step 1 crée des documents. Les re-exécuter peut causer des erreurs de duplication.

### ⚠️ Règles temporaires = Dangereux en production

Les règles temporaires permettent à **tout utilisateur authentifié** de lire/écrire partout. À utiliser **uniquement pendant la migration** et **jamais en production**.

### ✅ Ordre d'exécution

1. Step 1 : Structure initiale (platform + org)
2. Step 2 : Migration users → employees
3. Step 3 : Migration contenus (programs, categories)
4. Rétablir règles complètes

---

## 🎉 Félicitations !

Une fois Step 1 terminé avec succès, tu as :
- ✅ Une structure platform/admins pour les super admins
- ✅ Une organisation par défaut
- ✅ Les fondations pour le multi-tenant

**Prochaine étape :** Créer et exécuter migrationStep2.js
