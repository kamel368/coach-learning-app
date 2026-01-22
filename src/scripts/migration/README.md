# 🔧 Scripts de Migration Firebase

## 📁 Structure

```
src/scripts/migration/
├── README.md                  ← Tu es ici
├── FIREBASE_PATHS.md          ← Explication chemins Firebase
├── STRUCTURE_CHANGE.md        ← Changement structure /platform
├── MIGRATION_STEP2.md         ← ✅ Doc détaillée Step 2
├── MIGRATION_STEP3.md         ← ✅ Doc détaillée Step 3
├── migrationStep1.js          ← ✅ Structure initiale (platform + org)
├── migrationStep2.js          ← ✅ Migration users → employees
└── migrationStep3.js          ← ✅ Migration programs
```

---

## 🚀 Migration Step 1 : Structure Initiale

### Ce que fait ce script

1. **Crée `/platform/settings`**
   - Configuration globale de l'application
   - Nom de l'app, version, timestamps

2. **Crée le Super Admin** dans `/platform/admins/{UID}`
   - Toi (Kamel) en tant que super administrateur
   - Accès complet à toutes les organisations

3. **Crée l'organisation par défaut** dans `/organizations/org_default`
   - Organisation initiale pour migrer les données existantes
   - Module "learning" activé

### Configuration

**Avant d'exécuter, modifie ces valeurs dans `migrationStep1.js` :**

```javascript
const CONFIG = {
  SUPER_ADMIN_UID: "Oh0YjUfRBxQqjP27IizG1vtvSRH2",  // ✏️ TON UID Firebase Auth
  SUPER_ADMIN_EMAIL: "k.moussaoui@simply-permis.com", // ✏️ TON email
  SUPER_ADMIN_FIRST_NAME: "Kamel",                    // ✏️ TON prénom
  SUPER_ADMIN_LAST_NAME: "Super Admin",               // ✏️ TON nom
  DEFAULT_ORG_ID: "org_default",                      // ✅ OK tel quel
  DEFAULT_ORG_NAME: "Organisation par défaut"         // ✏️ Optionnel
};
```

### Exécution

**Option 1 : Via l'interface** (Recommandé)

1. Lance l'app : `npm run dev`
2. Va sur : `http://localhost:5173/admin/migration`
3. Clique sur **"▶️ Exécuter Step 1"**
4. Observe les logs

**Option 2 : Via la console** (Avancé)

```javascript
// Dans la console du navigateur (F12)
import { migrationStep1 } from './src/scripts/migration/migrationStep1.js';
await migrationStep1();
```

### Résultat attendu

```
🚀 ====================================
🚀 MIGRATION STEP 1 : Structure initiale
🚀 ====================================

📦 1/3 - Création /platform/settings...
   ✅ /platform/settings créé
👑 2/3 - Création Super Admin...
   ✅ Super Admin créé: k.moussaoui@simply-permis.com
🏢 3/3 - Création organisation par défaut...
   ✅ Organisation créée: org_default

🎉 ====================================
🎉 MIGRATION STEP 1 TERMINÉE !
🎉 ====================================

📊 Résumé :
   • /platform/settings ✅
   • /platform/admins/Oh0YjUfRBxQqjP27IizG1vtvSRH2 ✅
   • /organizations/org_default ✅

⏭️  Prochaine étape : Exécuter migrationStep2 (users → employees)
```

---

## ✅ Migration Step 2 : Users → Employees

### Ce que fait ce script

1. **Récupère tous les users** de `/users`
2. **Pour chaque user, migre :**
   - ✅ Profil employee (email, firstName, lastName, role)
   - ✅ Learning data (assignedPrograms)
   - ✅ Gamification (xp, level, badges, streaks)
   - ✅ Exercise attempts
   - ✅ Evaluations (avec ajout de `programId`)
   - ✅ Progress (depuis `/userProgress/{userId}`)

### Structure cible

```
/organizations/org_default/employees/{userId}/
  ├─ profile: { userId, email, firstName, lastName, role, status }
  └─ learning/
      ├─ data: { assignedPrograms: [], lastActivityAt }
      ├─ gamification: { xp, level, badges, streaks, rewardedActions }
      ├─ exerciseAttempts/{attemptId}
      ├─ evaluations/{programId}_{evalId}
      └─ progress/{programId}
```

### Configuration

**Aucune configuration nécessaire** ✅
- Utilise automatiquement `org_default`
- Migre tous les users automatiquement
- Gère les erreurs de manière non-bloquante

### Exécution

**Via l'interface** (Recommandé)

1. Lance l'app : `npm run dev`
2. Va sur : `http://localhost:5173/admin/migration`
3. **Exécute d'abord Step 1** si pas encore fait
4. Clique sur **"▶️ Exécuter Step 2 (Users)"**
5. Observe les logs en temps réel

### Résultat attendu

```
🚀 ====================================
🚀 MIGRATION STEP 2 : Users → Employees
🚀 ====================================

📊 Récupération des users existants...
   📦 12 users trouvés

👤 Migration: kam@example.com
   ✅ Profil employee créé
   ✅ Learning data créé
   ✅ Gamification migrée
   ✅ 5 exerciseAttempts migrés
   ✅ 3 evaluations migrées
   ✅ Progress migré

👤 Migration: learner@example.com
   ✅ Profil employee créé
   ✅ Learning data créé
   ⚠️ Pas de gamification
   ⚠️ Pas d'exerciseAttempts
   ⚠️ Pas d'evaluations
   ✅ Progress migré

...

🎉 ====================================
🎉 MIGRATION STEP 2 TERMINÉE !
🎉 ====================================

📊 Résumé :
   • Users migrés: 12
   • Erreurs: 0

⏭️  Prochaine étape : Exécuter migrationStep3 (programs)
```

### Documentation complète

📖 **Pour tous les détails, consulte :** [`MIGRATION_STEP2.md`](./MIGRATION_STEP2.md)

**Ce document contient :**
- 🔄 Processus détaillé étape par étape
- 🚨 Gestion des erreurs et cas particuliers
- 📊 Exemples de logs pour chaque cas
- ✅ Checklist de vérification post-migration
- 🐛 Troubleshooting complet

---

## ✅ Migration Step 3 : Programs

### Ce que fait ce script

1. **Récupère tous les programmes** de `/programs`
2. **Pour chaque programme, migre :**
   - ✅ Document programme (avec ajout de `migratedAt`)
   - ✅ Modules (`/programs/{programId}/modules/`)
   - ✅ Lessons de chaque module (`/modules/{moduleId}/lessons/`)
   - ✅ Exercises de chaque module (`/modules/{moduleId}/exercises/`)
   - ✅ Evaluation config (`/programs/{programId}/evaluation/`)

### Structure cible

```
/organizations/org_default/programs/{programId}/
  ├─ title, description, icon, category, status
  ├─ migratedAt: Timestamp
  └─ modules/{moduleId}/
      ├─ title, description, order
      ├─ lessons/{lessonId}/
      │   ├─ title, blocks, order
      │   └─ createdAt
      └─ exercises/{exerciseId}/
          ├─ blocks, settings
          └─ createdAt
```

### Configuration

**Aucune configuration nécessaire** ✅
- Utilise automatiquement `org_default`
- Migre tous les programmes automatiquement
- Gère les erreurs de manière non-bloquante

### Exécution

**Via l'interface** (Recommandé)

1. Lance l'app : `npm run dev`
2. Va sur : `http://localhost:5173/admin/migration`
3. **Exécute d'abord Step 1 et Step 2** si pas encore fait
4. Clique sur **"▶️ Exécuter Step 3 (Programs)"** (bouton violet)
5. Observe les logs en temps réel

### Résultat attendu

```
🚀 ====================================
🚀 MIGRATION STEP 3 : Programs
🚀 ====================================

📊 Récupération des programmes existants...
   📦 5 programmes trouvés

📚 Migration: Formation React Avancée
   ✅ Programme copié
   ✅ Module module_1: 8 lessons
   ✅ Module module_1: 5 exercises
   ✅ Module module_2: 12 lessons
   ✅ Module module_2: 7 exercises
   ✅ 2 modules migrés
   ✅ Evaluation config migrée

...

🎉 ====================================
🎉 MIGRATION STEP 3 TERMINÉE !
🎉 ====================================

📊 Résumé :
   • Programmes migrés: 5
   • Erreurs: 0

✅ MIGRATION COMPLÈTE ! Prochaine étape : Adapter le code.
```

### Documentation complète

📖 **Pour tous les détails, consulte :** [`MIGRATION_STEP3.md`](./MIGRATION_STEP3.md)

**Ce document contient :**
- 🔄 Processus détaillé étape par étape
- 🚨 Gestion des erreurs et cas particuliers
- 📊 Exemples de logs pour chaque cas
- ✅ Checklist de vérification post-migration
- 🎯 Prochaines étapes (adaptation du code)
- 🎁 Script de vérification bonus
- 🐛 Troubleshooting complet

---

## 🔐 Sécurité

### Règles Firestore temporaires

Pendant la migration, utilise des règles permissives :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ À REMPLACER après migration par des règles complètes !**

### Déploiement des règles

```bash
# Via npm script
npm run deploy:rules

# Ou via Firebase CLI
firebase deploy --only firestore:rules
```

---

## 📊 Ordre d'Exécution

1. ✅ **Step 1** : Structure initiale (platformSettings, platformAdmins, organizations) ← **Créé**
2. ✅ **Step 2** : Migration users → employees (profil, learning data, gamification, attempts, evaluations, progress) ← **Créé**
3. ✅ **Step 3** : Migration programs (programmes, modules, lessons, exercises, evaluation config) ← **Créé**
4. ⏳ **Step 4** : Adapter le code (services, hooks, composants pour utiliser les nouveaux chemins) ← **À faire**
5. 🔐 **Step 5** : Cleanup et règles finales ← **À faire**

---

## 🐛 Dépannage

### Erreur : "Missing or insufficient permissions"
→ Déploie les règles Firestore temporaires

### Erreur : "Document already exists"
→ La migration a déjà été exécutée, vérifie dans Firebase Console

### Erreur : "Cannot read properties of undefined"
→ Vérifie que CONFIG.SUPER_ADMIN_UID est correct

---

## 📝 Notes

- **NE PAS re-exécuter** une migration déjà terminée
- **Toujours sauvegarder** la base de données avant migration
- **Tester en local** avant de déployer en production
- **Vérifier dans Firebase Console** après chaque step

---

## 🎯 Checklist

### Avant toute migration
- [ ] Sauvegarde Firestore (export)
- [ ] Règles temporaires déployées
- [ ] CONFIG vérifié et correct

### Step 1
- [x] migrationStep1.js créé
- [x] CONFIG modifié avec ton UID
- [ ] Migration exécutée
- [ ] Résultats vérifiés dans Firebase Console

### Step 2
- [x] migrationStep2.js créé ✅
- [x] Documentation MIGRATION_STEP2.md créée ✅
- [ ] Migration exécutée
- [ ] Résultats vérifiés (voir MIGRATION_STEP2.md pour checklist)

### Step 3
- [x] migrationStep3.js créé ✅
- [x] Documentation MIGRATION_STEP3.md créée ✅
- [ ] Migration exécutée
- [ ] Résultats vérifiés (voir MIGRATION_STEP3.md pour checklist)

### Après migration
- [ ] Règles complètes rétablies
- [ ] Application testée
- [ ] Documentation mise à jour

---

**🚀 Prêt pour la migration ? Exécute Step 1 via `/admin/migration` !**
