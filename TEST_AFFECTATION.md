# 🧪 GUIDE DE TEST - Affectation de Programmes

## 🎯 OBJECTIF
Tester la nouvelle fonctionnalité d'affectation de programmes aux apprenants.

---

## ✅ CHECKLIST DE TEST

### 1️⃣ PRÉPARATION

**A. Vérifier que Firebase est configuré**
- [ ] Les règles Firestore sont déployées (voir `FIREBASE_SETUP.md`)
- [ ] Les index sont créés (voir `QUICK_START.md`)

**B. Avoir des données de test**
- [ ] Au moins 1 apprenant créé dans la base
- [ ] Au moins 2 programmes créés

**Si besoin, crée un apprenant de test :**
1. Va sur `/admin/users`
2. Clique "Créer un utilisateur"
3. Email : `test@example.com`
4. Mot de passe : `Test123!`
5. Rôle : **Apprenant**

---

### 2️⃣ TEST 1 : AFFICHAGE INITIAL

**Aller sur :** `/admin/users`

**Vérifier :**
- [ ] Nouvelle colonne "Programmes affectés" visible
- [ ] Pour chaque apprenant, tu vois :
  - "X programme(s)" ou "Aucun programme"
  - Bouton "Gérer" en bleu
- [ ] Pour les admins, tu vois "—" (pas de bouton)

**Screenshot attendu :** Tableau avec la nouvelle colonne

---

### 3️⃣ TEST 2 : OUVERTURE DE LA MODAL

**Action :**
1. Clique sur "Gérer" pour un apprenant

**Vérifier :**
- [ ] La modal s'ouvre avec une animation (slide up + fade in)
- [ ] L'overlay sombre est visible derrière
- [ ] Le nom/email de l'apprenant est affiché
- [ ] La liste des programmes disponibles s'affiche
- [ ] Si l'apprenant a déjà des programmes, ils sont pré-cochés
- [ ] Le compteur affiche "X programme(s) sélectionné(s)"

**Screenshot attendu :** Modal ouverte

---

### 4️⃣ TEST 3 : SÉLECTION DES PROGRAMMES

**Action :**
1. Coche/décoche différents programmes

**Vérifier :**
- [ ] Les checkboxes fonctionnent
- [ ] Les cartes changent de couleur quand cochées :
  - Cochée : bleu clair (#eff6ff) avec bordure bleue
  - Non cochée : blanc avec bordure grise
- [ ] Le compteur se met à jour en temps réel
- [ ] Le hover sur les cartes non cochées change la bordure

**Screenshot attendu :** Modal avec plusieurs programmes sélectionnés

---

### 5️⃣ TEST 4 : SAUVEGARDE

**Action :**
1. Sélectionne 2 programmes
2. Clique "Enregistrer"

**Vérifier :**
- [ ] Le bouton affiche "Enregistrement..." pendant le chargement
- [ ] Un message de confirmation s'affiche : "✅ Programmes affectés avec succès !"
- [ ] La modal se ferme
- [ ] Le tableau se met à jour immédiatement :
  - La colonne "Programmes affectés" affiche "2 programmes"

**Screenshot attendu :** Tableau mis à jour

---

### 6️⃣ TEST 5 : VÉRIFICATION FIREBASE

**Action :**
1. Va sur https://console.firebase.google.com
2. Projet → Firestore Database → users
3. Clique sur le document de l'apprenant testé

**Vérifier :**
- [ ] Le champ `assignedPrograms` existe
- [ ] C'est un **array**
- [ ] Il contient les IDs des 2 programmes sélectionnés

**Screenshot attendu :** Document Firestore avec `assignedPrograms`

---

### 7️⃣ TEST 6 : MODIFICATION D'UNE AFFECTATION

**Action :**
1. Clique à nouveau sur "Gérer" pour le même apprenant
2. Décoche 1 programme (il en reste 1)
3. Clique "Enregistrer"

**Vérifier :**
- [ ] La modal affiche les 2 programmes précédemment cochés
- [ ] Après sauvegarde, le tableau affiche "1 programme"
- [ ] Dans Firebase, `assignedPrograms` contient 1 seul ID

---

### 8️⃣ TEST 7 : SUPPRESSION DE TOUS LES PROGRAMMES

**Action :**
1. Clique sur "Gérer"
2. Décoche tous les programmes
3. Clique "Enregistrer"

**Vérifier :**
- [ ] Le compteur affiche "0 programme sélectionné"
- [ ] Après sauvegarde, le tableau affiche "Aucun programme"
- [ ] Dans Firebase, `assignedPrograms` est un tableau vide `[]`

---

### 9️⃣ TEST 8 : ANNULATION

**Action :**
1. Clique sur "Gérer"
2. Coche/décoche des programmes
3. Clique "Annuler" (ou clique sur l'overlay)

**Vérifier :**
- [ ] La modal se ferme sans sauvegarder
- [ ] Le tableau ne change pas
- [ ] Dans Firebase, `assignedPrograms` reste inchangé

---

### 🔟 TEST 9 : BOUTON X

**Action :**
1. Clique sur "Gérer"
2. Clique sur le X en haut à droite de la modal

**Vérifier :**
- [ ] La modal se ferme
- [ ] Aucune modification sauvegardée

---

## 📸 SCREENSHOTS ATTENDUS

**Pour validation complète, prends 4 screenshots :**

1. **Tableau initial** : Nouvelle colonne "Programmes affectés" visible
2. **Modal ouverte** : Liste des programmes avec checkboxes
3. **Programmes sélectionnés** : Compteur à jour, cartes bleues
4. **Firebase** : Document user avec `assignedPrograms: [...]`

---

## 🐛 BUGS POTENTIELS À SURVEILLER

### Problème : Modal ne s'ouvre pas
**Cause possible :** Erreur de chargement des programmes
**Solution :** Vérifie la console (F12) pour voir les erreurs

### Problème : Bouton "Enregistrer" ne fait rien
**Cause possible :** Règles Firestore bloquent l'écriture
**Solution :** Vérifie que les règles sont déployées (voir `FIREBASE_SETUP.md`)

### Problème : `assignedPrograms` n'apparaît pas dans Firebase
**Cause possible :** User n'a pas le champ
**Solution :** Lance le script `node scripts/addAssignedPrograms.js`

### Problème : "Permission denied" dans la console
**Cause possible :** Règles Firestore mal configurées
**Solution :** Redéploie les règles (voir `FIREBASE_SETUP.md`)

---

## ✅ VALIDATION FINALE

**Une fois tous les tests passés, vérifie :**

- [ ] Le tableau affiche correctement les programmes affectés
- [ ] La modal s'ouvre et se ferme correctement
- [ ] La sélection fonctionne parfaitement
- [ ] La sauvegarde met à jour Firebase et le tableau
- [ ] Pas d'erreurs dans la console

---

## 🎉 TESTS RÉUSSIS !

**Si tous les tests sont OK, dis :**

**"AFFECTATION OK"** + envoie le screenshot de la modal ! 📸

**Ensuite on passe à SESSION 1.3 : Dashboard Apprenant Filtré ! 🎯**

---

## 📞 BESOIN D'AIDE ?

**Problèmes ?**
- Consulte `SESSION_1.2_RECAP.md` pour le fonctionnement détaillé
- Vérifie `FIREBASE_SETUP.md` pour la configuration Firebase
- Regarde la console (F12) pour les erreurs JavaScript
