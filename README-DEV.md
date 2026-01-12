# Coach Learning - Documentation Développeur

## 📦 Stack technique

### Frontend
- **React 19.2.3**
- **Vite** (bundler)
- **React Router DOM** (navigation)
- **Bootstrap 5** + **Bootstrap Icons** (UI)
- **React-Quill** (éditeur de texte riche HTML)
- **@dnd-kit** (drag & drop des blocs)

### Backend
- **Firebase Authentication**
- **Cloud Firestore** (base de données)
- **Firebase Storage** (upload images)

---

## 🗂️ Structure Firestore

modules/ (sous-collection)
  {moduleId}
    - title: string
    - order: number
    - createdAt: timestamp
    
    lessons/ (sous-collection)
      {lessonId}
        - title: string
        - status: 'draft' | 'published' | 'disabled'
        - content: string (HTML)
        - blocks: array (optionnel, système de blocs)
        - order: number
        - createdAt, updatedAt: timestamp

---

## 🧩 Composants clés

### Pages principales

#### **`src/pages/LessonEditorPage.jsx`**
- Wrapper de la page d'édition de leçon
- Header fixe avec bouton "Fermer"
- Charge `LessonBuilder` en plein écran (sans sidebar principale)
- Route : `/admin/programs/:programId/modules/:moduleId/lessons/:lessonId/edit`

#### **`src/components/lesson-builder/LessonBuilder.jsx`**
- **Composant principal** de l'éditeur de leçon
- Gère l'état global (lesson, blocks, history, future)
- Layout 30% sidebar + 70% contenu
- Onglets "Leçon" et "Blocs" (Bootstrap nav-underline)
- Drag & drop avec `@dnd-kit`
- Undo/Redo
- Boutons en haut : Undo/Redo, Vue/Édition, Statut, Sauvegarder

#### **`src/components/lesson-builder/LessonEditorView.jsx`**
- Zone d'édition des blocs (70% droite)
- Affiche chaque bloc en mode édition ou aperçu
- **Boutons "Annuler" et "Ajouter"/"Modifier"** en bas de chaque bloc
- **Icône corbeille bleue** en haut à droite des blocs sélectionnés
- Validation des champs obligatoires (message rouge)

#### **`src/components/lesson-builder/LessonOutlineTab.jsx`**
- Liste des blocs dans l'onglet "Leçon" (sidebar gauche)
- Drag & drop avec `useSortable`
- Icônes Bootstrap modernes
- Sélection des blocs pour édition

#### **`src/components/lesson-builder/BlocksPaletteTab.jsx`**
- Palette de blocs disponibles (onglet "Blocs")
- Grid 2 colonnes avec boutons uniformes
- Icônes modernes : Texte, Image, Vidéo, Info, Toggle, Timeline, Séparateur, Lien leçon
- Taille : 75px hauteur, police 11px

#### **`src/components/lesson-builder/LessonPreview.jsx`**
- Rendu final de la leçon (mode "Voir la page")
- Affiche tous les blocs en mode lecture seule

#### **`src/components/RichTextEditor.jsx`**
- Wrapper de React-Quill
- Toolbar complète (H1-H6, gras, couleurs, listes, images, vidéos, code, tableaux)
- Upload automatique vers Firebase Storage (`lessons/images/`)

---

## 🎨 Design & UI

### Sidebar principale (`Sidebar.jsx`)
- Fond clair : `#f8f9fa`
- Largeur ouverte : `220px`
- Largeur réduite : `60px` (juste icônes)
- Bouton hamburger en haut
- Animation smooth : `transition: 0.3s ease`
- Item actif : fond jaune `#fbbf24`
- Hover : fond gris `#f3f4f6`
- Masquée sur : `/login` et page d'édition leçon

### Éditeur de leçon
- Header fixe en haut : `56px` de hauteur
- Sidebar 30% : `320-400px`, fond `#f9fafb`
- Zone édition 70% : fond `#f9fafb`
- Blocs en édition : bordure bleue `#3b82f6`, fond blanc
- Blocs non sélectionnés : bordure grise `#e5e7eb`, fond `#f9fafb`

### Boutons
- **Annuler** : gris `#f9fafb`, bordure `#d1d5db`
- **Ajouter/Modifier** : dégradé bleu `linear-gradient(135deg, #3b82f6, #60a5fa)`
- **Sauvegarder** : jaune `btn-warning`, `minWidth: 100px`
- **Corbeille** : icône bleue `#3b82f6`, hover fond rouge clair `#fee2e2`

### Pastilles de statut
- **Draft** : jaune `#facc15`
- **Published** : vert `#22c55e`
- **Disabled** : rouge `#ef4444`

---

## 🔧 Types de blocs disponibles

| Type | Icône | Champs obligatoires | Champs optionnels |
|------|-------|---------------------|-------------------|
| **text** | `bi-file-text` | `html` (contenu) | - |
| **image** | `bi-image` | `url` | `alt`, `caption` |
| **video** | `bi-play-btn` | `url` | `title`, `description` |
| **info** | `bi-info-circle` | `title` | `body`, `variant` (info/warning/success) |
| **toggle** | `bi-chevron-down` | `title`, `body` | `defaultOpen` (boolean) |
| **timeline** | `bi-clock-history` | `items` (array, min 1) | - |
| **separator** | `bi-dash-lg` | Aucun | - |
| **lessonLink** | `bi-link-45deg` | `lessonId`, `lessonTitle` | `moduleTitle` |

---

## ⚙️ Configuration Firebase

### **`src/firebase.js`**
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = { /* ta config */ };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
{
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router-dom": "^6.x",
    "firebase": "^10.x",
    "react-quill": "beta",
    "quill-image-uploader": "^1.x",
    "bootstrap": "^5.3.8",
    "bootstrap-icons": "^1.x",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "uuid": "^x.x",
    "react-player": "^2.x"
  }
}
npm install --legacy-peer-deps
# Lancer le serveur de dev
npm run dev

# Build pour production
npm run build

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Déplacer fichier backup hors de src
mv src/pages/fichier.backup ./fichier.backup
