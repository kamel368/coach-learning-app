# 📜 Scripts de Migration Firebase

Ce dossier contient les scripts de migration et de maintenance pour la base de données Firebase.

---

## 🔄 addAssignedPrograms.js

**Objectif :** Ajouter le champ `assignedPrograms: []` à tous les users existants qui n'ont pas encore ce champ.

### Prérequis

Le script utilise les modules ES6 (`import`). Pour pouvoir l'exécuter, assure-toi que :

**Option 1 : Utiliser Node avec support ES6**
```bash
# Lancer avec Node (si package.json a "type": "module")
node scripts/addAssignedPrograms.js
```

**Option 2 : Utiliser Node avec l'extension .mjs**
```bash
# Renommer le fichier en .mjs
mv scripts/addAssignedPrograms.js scripts/addAssignedPrograms.mjs

# Lancer
node scripts/addAssignedPrograms.mjs
```

**Option 3 : Utiliser Babel/ts-node**
```bash
# Installer les dépendances
npm install --save-dev @babel/node @babel/preset-env

# Lancer avec babel-node
npx babel-node scripts/addAssignedPrograms.js
```

### Utilisation

```bash
# Depuis la racine du projet
node scripts/addAssignedPrograms.js
```

### Sortie attendue

```
⚡️ Démarrage du script de migration...

🔄 MIGRATION DES USERS - Ajout de assignedPrograms
═══════════════════════════════════════════════════

📥 Récupération de tous les users...
✅ 5 users trouvés

✅ User abc123 (user1@example.com) → assignedPrograms ajouté
✅ User def456 (user2@example.com) → assignedPrograms ajouté
⏭️  User ghi789 (user3@example.com) → déjà à jour

═══════════════════════════════════════════════════
✅ MIGRATION TERMINÉE !
═══════════════════════════════════════════════════
📊 Statistiques:
   • Total users: 5
   • Mis à jour: 2
   • Déjà à jour: 3
   • Erreurs: 0
═══════════════════════════════════════════════════
```

---

## ⚠️ IMPORTANT

- **Sauvegarde :** Fais toujours une sauvegarde de ta base Firestore avant de lancer un script de migration.
- **Test :** Teste d'abord sur un environnement de développement.
- **Règles Firestore :** Assure-toi que tes règles Firestore permettent les écritures nécessaires.

---

## 📝 Autres scripts à venir

- `cleanupOldData.js` : Nettoyer les anciennes données obsolètes
- `migrateQuizzes.js` : Migrer les quizzes vers le nouveau format
- `fixUserRoles.js` : Corriger les rôles des users
