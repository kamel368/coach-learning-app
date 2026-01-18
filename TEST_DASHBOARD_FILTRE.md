# 🧪 GUIDE DE TEST - Dashboard Apprenant Filtré

## 🎯 OBJECTIF
Tester que le dashboard apprenant affiche **uniquement** les programmes affectés et non tous les programmes publiés.

---

## ✅ CHECKLIST DE TEST

### 1️⃣ PRÉPARATION

**A. Vérifier que tu as 2 apprenants**

**Apprenant 1 : AVEC programmes**
- Email : `apprenant@test.com`
- Programmes affectés : `["anglais", "laver-roues", "math"]` (3 programmes)

**Apprenant 2 : SANS programmes**
- Email : `test4@gmail.com`
- Programmes affectés : `[]` (aucun)

**B. Vérifier que tu as plusieurs programmes publiés**
- Au moins 5 programmes avec `status: "published"`
- Exemples : anglais, laver-roues, math, python, français, etc.

---

### 2️⃣ TEST 1 : APPRENANT AVEC PROGRAMMES

**1. Connexion**
```bash
# Lance l'app
npm run dev

# Va sur http://localhost:5173/login
# Connecte-toi avec :
Email: apprenant@test.com
Password: (ton mot de passe)
```

**2. Vérification Dashboard**

**Tu devrais voir :**
- ✅ Exactement **3 programmes** (anglais, laver-roues, math)
- ✅ PAS les autres programmes publiés (python, français, etc.)
- ✅ Icône, nom, description pour chaque programme
- ✅ Nombre de leçons correct
- ✅ Bouton "Commencer" ou "Continuer"

**Tu NE dois PAS voir :**
- ❌ Les programmes NON affectés (même s'ils sont publiés)
- ❌ Tous les 5+ programmes de la base

**Screenshot attendu :** Dashboard avec 3 programmes seulement

---

### 3️⃣ TEST 2 : APPRENANT SANS PROGRAMMES

**1. Déconnexion + Reconnexion**
```bash
# Clique sur "Se déconnecter"
# Retourne sur /login
# Connecte-toi avec :
Email: test4@gmail.com
Password: (ton mot de passe)
```

**2. Vérification Dashboard**

**Tu devrais voir :**
- ✅ Icône 📚 grisée (dans un cercle gris)
- ✅ Titre : "Aucun programme affecté"
- ✅ Message : "Contactez votre administrateur pour accéder à des programmes de formation"
- ✅ Aucune carte de programme

**Tu NE dois PAS voir :**
- ❌ La liste des programmes publiés
- ❌ Le message "Aucun programme disponible pour le moment"

**Screenshot attendu :** Message "Aucun programme affecté"

---

### 4️⃣ TEST 3 : AFFECTATION EN TEMPS RÉEL

**1. En tant qu'admin, affecte un programme**
```bash
# Déconnecte-toi de test4@gmail.com
# Connecte-toi en tant qu'admin
# Va sur /admin/users
# Clique "Gérer" pour test4@gmail.com
# Coche "Programme Python"
# Clique "Enregistrer"
```

**2. Retour à l'apprenant**
```bash
# Déconnecte-toi de l'admin
# Reconnecte-toi avec test4@gmail.com
# Va sur /apprenant/dashboard
```

**Tu devrais voir :**
- ✅ Exactement **1 programme** (Python)
- ✅ Plus le message "Aucun programme affecté"

**Screenshot attendu :** Dashboard avec 1 programme

---

### 5️⃣ TEST 4 : DÉSAFFECTATION EN TEMPS RÉEL

**1. En tant qu'admin, retire un programme**
```bash
# Connecte-toi en tant qu'admin
# Va sur /admin/users
# Clique "Gérer" pour apprenant@test.com
# Décoche "Anglais"
# Clique "Enregistrer"
```

**2. Retour à l'apprenant**
```bash
# Déconnecte-toi de l'admin
# Reconnecte-toi avec apprenant@test.com
# Va sur /apprenant/dashboard
```

**Tu devrais voir :**
- ✅ Exactement **2 programmes** (laver-roues, math)
- ✅ "Anglais" a **disparu**

**Screenshot attendu :** Dashboard avec 2 programmes

---

### 6️⃣ TEST 5 : CONSOLE LOGS

**Ouvre la console (F12) et vérifie les logs :**

**Apprenant AVEC programmes :**
```
🔍 Fetching assigned programs for user: QEFHB6uMhwgw7n3TKz2OFkVNjtl1
🔍 getUserAssignedProgramsWithDetails for user: QEFHB6uMhwgw7n3TKz2OFkVNjtl1
📋 Assigned program IDs: (3) ["anglais", "laver-roues", "math"]
📚 Total published programs: 5
✅ Assigned and published programs: 3
  → Formation Anglais: 5 leçons
  → Laver les roues: 3 leçons
  → Mathématiques: 8 leçons
🎉 getUserAssignedProgramsWithDetails completed: 3 programs
✅ Assigned programs: (3) [{...}, {...}, {...}]
```

**Apprenant SANS programmes :**
```
🔍 Fetching assigned programs for user: xyz789
🔍 getUserAssignedProgramsWithDetails for user: xyz789
📋 Assigned program IDs: []
ℹ️ No programs assigned to this user
✅ Assigned programs: []
```

---

### 7️⃣ TEST 6 : VÉRIFICATION FIREBASE

**Va sur Firebase Console :**
```bash
https://console.firebase.google.com
→ Firestore Database → users
```

**Pour `apprenant@test.com` :**
- ✅ Champ `assignedPrograms` existe
- ✅ C'est un **array**
- ✅ Contient `["anglais", "laver-roues", "math"]` (ou selon tes affectations)

**Pour `test4@gmail.com` :**
- ✅ Champ `assignedPrograms` existe
- ✅ C'est un **array vide** `[]` (ou contient 1 ID si tu as affecté Python)

**Screenshot attendu :** Document Firestore avec `assignedPrograms`

---

### 8️⃣ TEST 7 : PROGRAMMES DRAFT/DISABLED

**1. Crée un programme affecté mais non publié**
```bash
# En tant qu'admin
# Va sur /admin/programs
# Crée un nouveau programme "Test Draft"
# Status : "draft" (pas "published")
# Sauvegarde
```

**2. Affecte-le à un apprenant**
```bash
# Va sur /admin/users
# Clique "Gérer" pour apprenant@test.com
# Coche "Test Draft"
# Clique "Enregistrer"
```

**3. Vérification dashboard**
```bash
# Connecte-toi avec apprenant@test.com
# Va sur /apprenant/dashboard
```

**Tu devrais voir :**
- ✅ "Test Draft" **n'apparaît PAS** (car status = "draft")
- ✅ Seuls les programmes avec `status: "published"` sont visibles

---

## 📸 SCREENSHOTS ATTENDUS

**Pour validation complète, prends 5 screenshots :**

1. **Apprenant avec 3 programmes** : Dashboard avec anglais, laver-roues, math
2. **Apprenant sans programmes** : Message "Aucun programme affecté"
3. **Après affectation** : Dashboard avec le nouveau programme ajouté
4. **Après désaffectation** : Dashboard avec le programme retiré disparu
5. **Firebase** : Document user avec `assignedPrograms: [...]`

---

## 🐛 BUGS POTENTIELS

### Problème : Tous les programmes s'affichent
**Cause :** La fonction `getUserAssignedProgramsWithDetails` n'est pas utilisée
**Solution :** Vérifie que l'import est correct dans `ApprenantDashboard.jsx`

### Problème : Message "Aucun programme affecté" même avec affectations
**Cause :** Le champ `assignedPrograms` n'existe pas dans Firestore
**Solution :** Lance le script `node scripts/addAssignedPrograms.js`

### Problème : Console log "No programs assigned"
**Cause :** Le tableau `assignedPrograms` est vide ou n'existe pas
**Solution :** Affecte des programmes via `/admin/users`

### Problème : Erreur "getUserAssignedProgramsWithDetails is not a function"
**Cause :** Import manquant ou fonction non exportée
**Solution :** Vérifie que la fonction est bien exportée dans `progressionService.js`

---

## ✅ VALIDATION FINALE

**Une fois tous les tests passés, vérifie :**

- [ ] Dashboard affiche uniquement les programmes affectés
- [ ] Message clair si aucun programme affecté
- [ ] Affectation/désaffectation fonctionne en temps réel
- [ ] Programmes "draft" ne sont pas visibles
- [ ] Logs console sont corrects
- [ ] Pas d'erreurs dans la console

---

## 🎉 TESTS RÉUSSIS !

**Si tous les tests sont OK, dis :**

**"DASHBOARD FILTRÉ OK"** + envoie le screenshot du dashboard avec programmes ! 📸

**Ensuite on pourra faire le RÉCAP GÉNÉRAL de toute la SESSION 1 ! 🎊**

---

## 📞 BESOIN D'AIDE ?

**Problèmes ?**
- Consulte `SESSION_1.3_RECAP.md` pour le fonctionnement détaillé
- Vérifie `FIX_BOUTON_GERER.md` si le bouton "Gérer" ne s'affiche pas
- Regarde la console (F12) pour les erreurs JavaScript
- Vérifie Firebase Console pour les données
