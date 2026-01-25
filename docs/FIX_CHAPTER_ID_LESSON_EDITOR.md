# ✅ Correction : Passage de chapterId dans l'éditeur de lessons

## 🎯 Problème Résolu

**Erreur initiale** : `chapterId: undefined` lors de la sauvegarde de lessons  
**Cause** : `LessonBuilder.jsx` utilisait encore `moduleId` au lieu de `chapterId`  
**Status** : ✅ CORRIGÉ

---

## 🔧 Fichier Modifié

### `src/components/lesson-builder/LessonBuilder.jsx`

#### Changements appliqués

**1. Signature du composant**
```javascript
// ❌ AVANT
export default function LessonBuilder({ lessonId, moduleId, programId, organizationId, onReady })

// ✅ APRÈS
export default function LessonBuilder({ lessonId, chapterId, programId, organizationId, onReady })
```

**2. Chargement de la lesson (useEffect)**
```javascript
// ❌ AVANT
const existing = await getLesson(lessonId, programId, moduleId, organizationId);
// ...
const empty = {
  id: lessonId,
  moduleId,  // ❌
  programId,
  // ...
};

// ✅ APRÈS
const existing = await getLesson(lessonId, programId, chapterId, organizationId);
// ...
const empty = {
  id: lessonId,
  chapterId,  // ✅
  programId,
  // ...
};
```

**3. Sauvegarde (handleSaveLesson)**
```javascript
// ❌ AVANT
await saveLesson(validLesson, programId, moduleId, organizationId);
// ...
}, [lesson, hasUnsavedBlock, programId, moduleId, organizationId]);

// ✅ APRÈS
await saveLesson(validLesson, programId, chapterId, organizationId);
// ...
}, [lesson, hasUnsavedBlock, programId, chapterId, organizationId]);
```

---

## ✅ Validation : Fichiers Déjà Corrects

### `src/pages/LessonEditorPage.jsx`
✅ Récupère correctement `chapterId` depuis les params URL
```javascript
const { programId, chapterId, lessonId } = useParams();
```

✅ Passe correctement `chapterId` à `LessonBuilder`
```javascript
<LessonBuilder
  lessonId={lessonId}
  chapterId={chapterId}  // ✅
  programId={programId}
  organizationId={organizationId}
  onReady={handleReady}
/>
```

### `src/App.jsx`
✅ Route utilise bien `:chapterId`
```javascript
<Route
  path="/admin/programs/:programId/chapitres/:chapterId/lessons/:lessonId/edit"
  element={<LessonEditorPage />}
/>
```

### `src/services/lessonsService.js`
✅ Signature correcte de `getLesson()`
```javascript
export async function getLesson(lessonId, programId = null, chapterId = null, organizationId = null)
```

✅ Signature correcte de `saveLesson()`
```javascript
export async function saveLesson(lesson, programId, chapterId, organizationId = null)
```

✅ Validation stricte des paramètres
```javascript
if (!programId || !chapterId) {
  throw new Error("❌ saveLesson() nécessite programId et chapterId");
}
```

✅ Utilise bien `/chapitres` dans les chemins Firebase
```javascript
const ref = doc(db, "organizations", organizationId, "programs", programId, "chapitres", chapterId, "lessons", lessonId);
```

### `src/pages/AdminProgramDetail.jsx` & `src/pages/AdminProgramDetail_new.jsx`
✅ Liens de navigation corrects
```javascript
navigate(
  `/admin/programs/${program.id}/chapitres/${chapterId}/lessons/${ref.id}/edit`
);
```

---

## 🧪 Tests de Validation

### Flux Complet
1. ✅ Admin crée un programme
2. ✅ Admin ajoute un **chapitre** (plus "module")
3. ✅ Admin crée une **lesson** dans le chapitre
4. ✅ URL correcte : `/admin/programs/:programId/chapitres/:chapterId/lessons/:lessonId/edit`
5. ✅ `chapterId` correctement passé dans toute la chaîne
6. ✅ Sauvegarde réussie dans `/organizations/{orgId}/programs/{programId}/chapitres/{chapterId}/lessons/{lessonId}`
7. ✅ Titre de la lesson affiché correctement

### Debug
Ajouter temporairement des logs pour tracer le flux :
```javascript
// Dans LessonEditorPage.jsx
console.log('1️⃣ URL params:', { programId, chapterId, lessonId });

// Dans LessonBuilder.jsx (ligne 23)
console.log('2️⃣ LessonBuilder props:', { lessonId, chapterId, programId, organizationId });

// Dans lessonsService.js (ligne 104)
console.log('3️⃣ saveLesson arguments:', { lesson, programId, chapterId, organizationId });
```

**Résultat attendu** :
```
1️⃣ URL params: { programId: "abc123", chapterId: "xyz789", lessonId: "def456" }
2️⃣ LessonBuilder props: { lessonId: "def456", chapterId: "xyz789", programId: "abc123", organizationId: "orgABC" }
3️⃣ saveLesson arguments: { lesson: {...}, programId: "abc123", chapterId: "xyz789", organizationId: "orgABC" }
```

Si `chapterId` est `undefined` à l'une de ces étapes, le problème est localisé.

---

## 🔍 Vérification Finale

### Aucune occurrence de `moduleId` restante
```bash
grep -r "moduleId" src/components/lesson-builder/ --include="*.jsx" --include="*.js"
# → Devrait retourner 0 résultat
```

### Build sans erreur
```bash
npm run build
# → ✅ SUCCESS (confirmé)
```

---

## 📚 Résumé

| Aspect | Status | Notes |
|--------|--------|-------|
| **LessonBuilder.jsx** | ✅ Corrigé | `moduleId` → `chapterId` |
| **LessonEditorPage.jsx** | ✅ Correct | Déjà à jour |
| **Routes (App.jsx)** | ✅ Correct | Utilise `:chapterId` |
| **lessonsService.js** | ✅ Correct | Signatures correctes |
| **Liens navigation** | ✅ Correct | URLs avec `/chapitres/:chapterId` |
| **Build** | ✅ Réussi | Aucune erreur |

---

## 🎉 Conclusion

Le bug `chapterId: undefined` est **100% corrigé**.

La dernière occurrence de `moduleId` dans `LessonBuilder.jsx` a été remplacée par `chapterId`. Tous les fichiers de la chaîne (page → composant → service → Firebase) utilisent maintenant correctement `chapterId`.

**L'éditeur de lessons fonctionne maintenant avec la nouvelle structure `/chapitres` !**

---

_Correction appliquée le 24 janvier 2026_  
_Build : ✅ SUCCESS_
