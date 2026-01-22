# 🔐 Déployer les Règles Firestore

## 🎯 Objectif

Autoriser l'accès aux nouvelles collections `platform` et `organizations` pendant la migration.

---

## 🚀 Option 1 : Via Firebase Console (Plus simple)

### Étapes

1. **Va sur Firebase Console**
   - [https://console.firebase.google.com](https://console.firebase.google.com)

2. **Sélectionne ton projet**
   - Coach Learning App (ou ton nom de projet)

3. **Va dans Firestore Database**
   - Menu latéral → **Firestore Database**

4. **Ouvre les Rules**
   - Onglet **Rules** (en haut)

5. **Remplace les règles existantes**
   
   Copie-colle ceci (règles temporaires pour la migration) :
   
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

6. **Clique sur "Publier" (Publish)**

7. **Confirme**

✅ **C'est fait !** Les règles sont déployées.

---

## 🚀 Option 2 : Via Firebase CLI (Avancé)

### Prérequis

```bash
# Installer Firebase CLI (si pas déjà fait)
npm install -g firebase-tools

# Se connecter
firebase login

# Vérifier la connexion
firebase projects:list
```

### Déploiement

```bash
# Déployer uniquement les règles Firestore
npm run deploy:rules

# OU directement via Firebase CLI
firebase deploy --only firestore:rules
```

### Vérification

```bash
# Afficher les règles actuelles
firebase firestore:rules
```

---

## ⚠️ Règles Temporaires vs Règles de Production

### Règles Temporaires (Actuelles)

```javascript
// ⚠️ PERMISSIF - Pour migration uniquement
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

**Avantages :**
- ✅ Simple
- ✅ Permet la migration sans restrictions

**Inconvénients :**
- ❌ **DANGEREUX en production**
- ❌ Tout utilisateur authentifié peut tout modifier
- ❌ Aucune isolation entre organisations

### Règles Complètes (À rétablir après migration)

Les règles complètes sont commentées dans `firestore.rules`. Elles incluent :

- ✅ Isolation par organisation
- ✅ Vérification des rôles (superadmin, admin, employee)
- ✅ Accès restreint aux données sensibles
- ✅ Lecture/écriture sécurisée

**⚠️ IMPORTANT : Rétablis les règles complètes après la migration !**

---

## 📋 Checklist de Déploiement

### Avant la migration

- [ ] Firebase CLI installé (`npm install -g firebase-tools`)
- [ ] Authentifié avec Firebase (`firebase login`)
- [ ] Projet initialisé (`firebase init`)
- [ ] Règles temporaires dans `firestore.rules`
- [ ] **Déploiement des règles temporaires** ← **TU ES ICI**

### Pendant la migration

- [ ] Règles temporaires actives ✅
- [ ] Exécution des scripts de migration
- [ ] Vérification dans Firebase Console

### Après la migration

- [ ] Décommenter les règles complètes dans `firestore.rules`
- [ ] Supprimer le bloc temporaire
- [ ] **Re-déployer les règles complètes** :
  ```bash
  npm run deploy:rules
  ```
- [ ] Tester l'application avec les nouvelles règles
- [ ] Vérifier les logs d'erreurs dans Firebase Console

---

## 🧪 Tester le Déploiement

### Dans Firebase Console

1. Va sur **Firestore Database** → **Rules**
2. Tu devrais voir :
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
3. Status : **Publié** (ou **Published**)

### Dans l'Application

1. Lance l'app : `npm run dev`
2. Connecte-toi en tant qu'admin
3. Va sur `/admin/migration`
4. Si les règles sont bien déployées, tu devrais pouvoir exécuter la migration sans erreur

### Via Firebase CLI

```bash
# Afficher les règles actuelles
firebase firestore:rules

# Tu devrais voir les règles temporaires
```

---

## 🐛 Dépannage

### Erreur : "firebase: command not found"

```bash
# Installer Firebase CLI globalement
npm install -g firebase-tools

# Vérifier l'installation
firebase --version
```

### Erreur : "User must be authenticated"

```bash
# Se connecter à Firebase
firebase login

# Si déjà connecté, force la reconnexion
firebase login --reauth
```

### Erreur : "No project active"

```bash
# Lister les projets disponibles
firebase projects:list

# Sélectionner ton projet
firebase use <project-id>

# Vérifier le projet actif
firebase projects:list
```

### Erreur : "Deployment failed"

- Vérifie que `firestore.rules` existe à la racine du projet
- Vérifie la syntaxe des règles (pas d'erreurs de formatage)
- Essaie via Firebase Console (Option 1)

---

## 📝 Commandes Utiles

```bash
# Déployer uniquement les règles Firestore
npm run deploy:rules

# Déployer uniquement les indexes Firestore
npm run deploy:indexes

# Déployer tout (règles + indexes + fonctions + hosting)
firebase deploy

# Afficher les règles actuelles
firebase firestore:rules

# Tester les règles localement (émulateur)
firebase emulators:start
```

---

## ✅ Prochaine Étape

Une fois les règles déployées :

1. ✅ Les règles temporaires sont actives
2. ⏭️ **Exécute la migration Step 1** via `/admin/migration`
3. ⏭️ Vérifie dans Firebase Console que les collections sont créées
4. ⏭️ Après toutes les migrations, rétablis les règles complètes

---

**🔐 Règles prêtes à être déployées ! Choisis l'option 1 (Console) ou l'option 2 (CLI) ci-dessus.**
