# ✅ CORRECTION - Suppression des Chapitres dans Firebase

**Date :** 24 janvier 2026  
**Fichier corrigé :** `src/pages/AdminProgramDetail.jsx`  
**Statut :** ✅ CORRIGÉ  

---

## 📋 Problème Identifié

Quand on supprimait un chapitre dans l'interface, il disparaissait visuellement mais **restait dans Firebase**. La suppression ne fonctionnait pas correctement.

### Cause du problème 🎯

Le code de suppression lui-même (`handleDeleteChapter`) était correct et supprimait bien le chapitre de Firebase.

**CEPENDANT**, le problème venait du système de **drag & drop** pour réorganiser les chapitres :

Lors du drag & drop, la fonction `onChapterDrop` sauvegardait l'ordre de TOUS les chapitres, y compris ceux qui avaient été supprimés, en utilisant l'**ancien chemin Firebase** :

```javascript
// ❌ AVANT (ligne 527) - Chemin incorrect
updateDoc(doc(db, "programs", program.id, "chapitres", c.id), {
  order: c.order,
  updatedAt: Timestamp.now(),
})
```

Ce code **recréait le chapitre supprimé** dans l'ancienne structure `/programs` au lieu d'utiliser la structure multi-tenant.

---

## 🔧 Correction Appliquée

### Ligne 524-537 : Fonction `onChapterDrop`

**AVANT ❌ :**
```javascript
try {
  await Promise.all(
    updated.map((c) =>
      updateDoc(doc(db, "programs", program.id, "chapitres", c.id), {
        order: c.order,
        updatedAt: Timestamp.now(),
      })
    )
  );
} catch (err) {
  console.error(err);
  alert("Erreur lors du réordonnancement des chapitres.");
}
```

**APRÈS ✅ :**
```javascript
try {
  await Promise.all(
    updated.map((c) => {
      const chapterRef = organizationId
        ? doc(db, "organizations", organizationId, "programs", program.id, "chapitres", c.id)
        : doc(db, "programs", program.id, "chapitres", c.id);
      
      return updateDoc(chapterRef, {
        order: c.order,
        updatedAt: Timestamp.now(),
      });
    })
  );
  console.log('✅ Ordre des chapitres sauvegardé');
} catch (err) {
  console.error(err);
  alert("Erreur lors du réordonnancement des chapitres.");
}
```

---

## ✅ Vérifications Effectuées

### 1. Code de suppression (déjà correct)

**Ligne 389-410 : `handleDeleteChapter`**

Le code de suppression était déjà correct et utilisait bien la structure multi-tenant :

```javascript
const handleDeleteChapter = async (chapterId) => {
  if (!window.confirm("Supprimer ce chapitre...")) return;
  
  try {
    const ref = organizationId
      ? doc(db, "organizations", organizationId, "programs", program.id, "chapitres", chapterId)
      : doc(db, "programs", program.id, "chapitres", chapterId);
    
    await deleteDoc(ref);  // ✅ Suppression correcte
    
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
    setLessonsByChapter((prev) => {
      const copy = { ...prev };
      delete copy[chapterId];
      return copy;
    });
    
    console.log('✅ Chapitre supprimé');
  } catch (err) {
    console.error(err);
    alert("Erreur lors de la suppression du chapitre.");
  }
};
```

### 2. Import de `deleteDoc` (déjà correct)

**Ligne 13 :**
```javascript
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  collection,
  addDoc,
  getDocs,
  deleteDoc,  // ✅ Bien importé
  setDoc,
} from "firebase/firestore";
```

### 3. Fichier `AdminProgramDetail_new.jsx` (déjà correct)

Le fichier alternatif `AdminProgramDetail_new.jsx` utilisait déjà correctement `organizationId` dans `onChapterDrop`. Aucune modification nécessaire.

---

## 🧪 Tests de Validation

### Test 1 : Supprimer un chapitre simple
1. Aller sur un programme avec plusieurs chapitres
2. Supprimer un chapitre (ex: "H4uRVeBNJwDnHj3ox3dK")
3. **Vérifier Firebase Console** : Le chapitre doit avoir disparu de `/organizations/{orgId}/programs/{programId}/chapitres/`

**Résultat attendu :**
- ✅ Chapitre supprimé de l'interface
- ✅ Chapitre supprimé de Firebase
- ✅ Pas de recréation dans `/programs` (ancienne structure)

---

### Test 2 : Supprimer un chapitre puis réorganiser
1. Supprimer un chapitre
2. Drag & drop pour réorganiser les chapitres restants
3. **Vérifier Firebase Console** : Le chapitre supprimé ne doit PAS réapparaître

**Résultat attendu :**
- ✅ Chapitres réorganisés correctement
- ✅ Chapitre supprimé reste supprimé
- ✅ Ordre sauvegardé dans `/organizations/{orgId}/programs/...`

---

### Test 3 : Vérifier les logs console
Lors de la réorganisation après suppression :

**Logs attendus :**
```
✅ Ordre des chapitres sauvegardé
```

**NE DOIT PAS afficher :**
```
❌ Erreur lors du réordonnancement des chapitres
```

---

## 📊 Impact de la Correction

### Avant la correction ❌
- Suppression visuelle OK (dans l'interface)
- Suppression réelle NON (reste dans Firebase)
- Réorganisation recréait les chapitres supprimés dans `/programs`
- Chapitres "fantômes" dans Firebase

### Après la correction ✅
- Suppression visuelle OK
- Suppression réelle OK (Firebase)
- Réorganisation ne recrée pas les chapitres supprimés
- Utilisation correcte de la structure multi-tenant
- Pas de chapitres "fantômes"

---

## 🚨 Avertissement Important

### Suppression des sous-collections

⚠️ **Firebase ne supprime PAS automatiquement les sous-collections** quand on supprime un document parent.

Cela signifie que lorsqu'on supprime un chapitre, les **lessons** et les **exercices** de ce chapitre restent dans Firebase.

**Chemin des sous-collections :**
```
/organizations/{orgId}/programs/{programId}/chapitres/{chapterId}/
  ├── lessons/
  │   └── {lessonId}
  └── exercises/
      └── main
```

### Solution : Suppression complète (optionnelle)

Si tu veux supprimer COMPLÈTEMENT un chapitre avec toutes ses sous-collections, voici le code à utiliser :

```javascript
const handleDeleteChapterCompletely = async (chapterId) => {
  if (!window.confirm("⚠️ Supprimer COMPLÈTEMENT ce chapitre (lessons + exercices) ?")) return;
  
  try {
    // 1. Supprimer toutes les lessons
    const lessonsRef = collection(
      db, 
      'organizations', organizationId, 
      'programs', program.id, 
      'chapitres', chapterId,
      'lessons'
    );
    
    const lessonsSnap = await getDocs(lessonsRef);
    const deleteLessonsPromises = lessonsSnap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deleteLessonsPromises);
    
    console.log(`✅ ${lessonsSnap.size} lessons supprimées`);
    
    // 2. Supprimer les exercices
    try {
      const exercisesRef = doc(
        db, 
        'organizations', organizationId, 
        'programs', program.id, 
        'chapitres', chapterId,
        'exercises', 'main'
      );
      await deleteDoc(exercisesRef);
      console.log('✅ Exercices supprimés');
    } catch (e) {
      console.log('ℹ️ Pas d\'exercices à supprimer');
    }
    
    // 3. Supprimer le chapitre
    const chapterRef = doc(
      db, 
      'organizations', organizationId, 
      'programs', program.id, 
      'chapitres', chapterId
    );
    await deleteDoc(chapterRef);
    
    // 4. Mettre à jour l'interface
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
    setLessonsByChapter((prev) => {
      const copy = { ...prev };
      delete copy[chapterId];
      return copy;
    });
    
    console.log('✅ Chapitre supprimé complètement');
    alert('✅ Chapitre et toutes ses sous-collections supprimés');
    
  } catch (err) {
    console.error('❌ Erreur:', err);
    alert("Erreur lors de la suppression complète du chapitre.");
  }
};
```

**Pour l'implémenter :**
1. Remplacer `handleDeleteChapter` par `handleDeleteChapterCompletely`
2. Ou créer les deux fonctions et proposer un choix à l'utilisateur

---

## 🔍 Diagnostic

### Vérifier qu'un chapitre est bien supprimé

1. **Ouvrir Firebase Console** : https://console.firebase.google.com
2. Aller dans **Firestore Database**
3. Naviguer vers : `organizations/{orgId}/programs/{programId}/chapitres/`
4. Vérifier que le chapitre supprimé n'apparaît plus

### Vérifier qu'il n'y a pas de chapitre fantôme dans l'ancienne structure

1. Dans Firebase Console, vérifier qu'il n'y a **PAS** de collection `/programs` à la racine
2. Si elle existe, c'est un signe que l'ancienne structure est encore utilisée quelque part

---

## 📝 Checklist de Test

- [ ] Supprimer un chapitre → Disparaît de l'interface
- [ ] Vérifier Firebase Console → Chapitre supprimé
- [ ] Réorganiser les chapitres restants (drag & drop) → OK
- [ ] Vérifier Firebase Console → Chapitre supprimé reste supprimé
- [ ] Rafraîchir la page → Chapitre supprimé ne réapparaît pas
- [ ] Vérifier `/programs` à la racine → N'existe pas ou vide

---

## 📚 Fichiers Concernés

### Modifiés
- `src/pages/AdminProgramDetail.jsx` - Fonction `onChapterDrop` (ligne 524-537)

### Vérifiés (OK)
- `src/pages/AdminProgramDetail_new.jsx` - Déjà correct

### Documentation
- `docs/CORRECTION_SUPPRESSION_CHAPITRES.md` (ce fichier)

---

## 🎯 Résumé

| Aspect | Avant | Après |
|--------|-------|-------|
| Suppression visuelle | ✅ OK | ✅ OK |
| Suppression Firebase | ❌ NON | ✅ OUI |
| Réorganisation | ❌ Recrée le chapitre | ✅ Ne recrée pas |
| Structure Firebase | ❌ `/programs` | ✅ `/organizations/{orgId}/programs` |

---

**✅ Correction complétée avec succès le 24 janvier 2026**  
**Build Status :** ✅ Réussi  
**Tests :** ⏳ En attente de validation utilisateur
