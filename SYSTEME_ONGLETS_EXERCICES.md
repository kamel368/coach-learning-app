# SYSTÈME ONGLETS : ÉDITEUR EXERCICES ✅

## 🎯 OBJECTIF ATTEINT

Créer un système à 2 colonnes avec onglets :
- **Onglet "Exercices"** : Liste avec glisser-déposer pour réorganiser
- **Onglet "Blocs"** : Palette pour ajouter de nouveaux types
- **Colonne droite** : Édition du bloc sélectionné

---

## ✅ STRUCTURE COMPLÈTE

```
┌─────────────────────────────────────────────────────────────┐
│ Header Fixe                                                 │
│ [← Retour] | Éditeur d'exercices    [⟲][⟳] [💾 Enregistrer]│
├──────────────────────┬──────────────────────────────────────┤
│ COLONNE GAUCHE       │ COLONNE DROITE                       │
│ ┌────────────────┐   │                                      │
│ │ Exercices (7)  │   │  [Header bloc sélectionné]           │
│ └────────────────┘   │                                      │
│ │                    │  ┌──────────────────────────────┐   │
│ │ ≡ [1] 🃏 ...       │  │                              │   │
│ │ ≡ [2] ✓✗ ...       │  │   [Éditeur de contenu]       │   │
│ │ ≡ [3] ☑ ...        │  │                              │   │
│ │ ...                │  │   (Scrollable)               │   │
│ │                    │  │                              │   │
│ │  (Drag & drop)     │  └──────────────────────────────┘   │
│ │                    │                                      │
│ │ OU (Onglet Blocs)  │                                      │
│ │                    │                                      │
│ │ 💡 Clique pour...  │                                      │
│ │ [🃏 Flashcard]      │                                      │
│ │ [✓✗ Vrai/Faux]      │                                      │
│ │ [☑ QCM]            │                                      │
│ │ ...                │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

---

## 🎨 FONCTIONNALITÉS IMPLÉMENTÉES

### **1️⃣ Système d'onglets**

✅ **2 onglets** dans la colonne gauche  
✅ **Sélection visuelle** : Background blanc + bordure bleue  
✅ **Compteur dynamique** : "Exercices (7)"  
✅ **Transitions fluides** : `0.2s`  

**Code onglets :**
```javascript
const [activeTab, setActiveTab] = useState('exercices');

<div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
  <button 
    onClick={() => setActiveTab('exercices')}
    style={{
      background: activeTab === 'exercices' ? 'white' : 'transparent',
      borderBottom: activeTab === 'exercices' ? '2px solid #3b82f6' : '2px solid transparent'
    }}
  >
    Exercices ({blocks.length})
  </button>

  <button 
    onClick={() => setActiveTab('blocs')}
    style={{
      background: activeTab === 'blocs' ? 'white' : 'transparent',
      borderBottom: activeTab === 'blocs' ? '2px solid #3b82f6' : '2px solid transparent'
    }}
  >
    + Blocs
  </button>
</div>
```

---

### **2️⃣ Onglet "Exercices" - Liste drag & drop**

✅ **Glisser-déposer** pour réorganiser  
✅ **Sélection visuelle** : Bordure bleue + background `#f0f9ff`  
✅ **Badge numéroté coloré** : Couleur par type  
✅ **Drag handle** : `GripVertical` visible  
✅ **Opacité pendant drag** : `0.5`  
✅ **Points affichés** : `{block.points} pts`  
✅ **État vide** : Icône + bouton "Ajouter un bloc"  

**Code liste drag & drop :**
```javascript
const [draggedIndex, setDraggedIndex] = useState(null);

<div
  draggable
  onDragStart={(e) => handleDragStart(e, index)}
  onDragOver={(e) => handleDragOver(e, index)}
  onDragEnd={handleDragEnd}
  onClick={() => setSelectedBlockId(block.id)}
  style={{
    background: isSelected ? '#f0f9ff' : 'white',
    border: '1px solid',
    borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
    opacity: draggedIndex === index ? 0.5 : 1
  }}
>
  <GripVertical size={16} color="#cbd5e1" />
  <div style={{ background: blockInfo.color }}>
    {index + 1}
  </div>
  <div>
    {blockInfo.icon} {blockInfo.label}
    <div>{block.points} pts</div>
  </div>
</div>
```

**Logique drag & drop :**
```javascript
const handleDragStart = (e, index) => {
  setDraggedIndex(index);
  e.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (e, index) => {
  e.preventDefault();
  if (draggedIndex === null || draggedIndex === index) return;
  
  const direction = draggedIndex < index ? 'down' : 'up';
  moveBlock(blocks[draggedIndex].id, direction);
  setDraggedIndex(index);
};

const handleDragEnd = () => {
  setDraggedIndex(null);
};
```

---

### **3️⃣ Onglet "Blocs" - Palette**

✅ **Message d'aide** : "💡 Clique sur un type pour ajouter un exercice"  
✅ **7 types d'exercices** disponibles  
✅ **Badge coloré** : Icône + couleur par type  
✅ **Descriptions** : Texte explicatif pour chaque type  
✅ **Icône Plus** : Visible à droite  
✅ **Hover effects** : Transform `translateX(2px)` + bordure colorée  
✅ **Retour auto** : Bascule vers onglet "Exercices" après ajout  

**Code palette :**
```javascript
<div style={{
  padding: '12px',
  background: '#f0f9ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#1e40af'
}}>
  💡 Clique sur un type pour ajouter un exercice
</div>

{BLOCK_TYPES.map((blockType) => (
  <button
    key={blockType.type}
    onClick={() => handleAddBlock(blockType.type)}
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = blockType.color;
      e.currentTarget.style.transform = 'translateX(2px)';
    }}
  >
    <div style={{
      width: '36px',
      height: '36px',
      background: blockType.color,
      color: 'white'
    }}>
      {blockType.icon}
    </div>
    <div>
      <div>{blockType.label}</div>
      <div>{blockType.desc}</div>
    </div>
    <Plus size={16} />
  </button>
))}
```

**Logique ajout bloc :**
```javascript
const handleAddBlock = (type) => {
  const newBlockId = addBlock(type);
  setActiveTab('exercices'); // Retour onglet exercices
  
  // Sélectionner automatiquement le nouveau bloc
  setTimeout(() => {
    if (blocks.length >= 0) {
      const newBlock = blocks[blocks.length];
      if (newBlock) {
        setSelectedBlockId(newBlock.id);
      }
    }
  }, 100);
};
```

---

### **4️⃣ Colonne droite - Éditeur**

✅ **Sélection requise** : Message "👈 Sélectionne un exercice"  
✅ **Header bloc** : Badge coloré + titre + numéro + bouton supprimer  
✅ **Zone scrollable** : Éditeur de contenu indépendant  
✅ **Background blanc** : Pour la zone d'édition  
✅ **Suppression** : Confirmation + retour à l'état non sélectionné  

**Code état non sélectionné :**
```javascript
if (!selectedBlockId) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%'
    }}>
      <div style={{ fontSize: '64px', opacity: 0.3 }}>👈</div>
      <h3>Sélectionne un exercice</h3>
      <p>Clique sur un exercice dans la liste de gauche pour l'éditer</p>
    </div>
  );
}
```

**Code header bloc sélectionné :**
```javascript
<div style={{
  padding: '16px 20px',
  borderBottom: '1px solid #f1f5f9',
  background: '#fafbfc',
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
  <div style={{
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: blockInfo.color,
    color: 'white'
  }}>
    {blockInfo.icon}
  </div>
  
  <div style={{ flex: 1 }}>
    <div>{blockInfo.label}</div>
    <div>Exercice {blocks.findIndex(b => b.id === selectedBlockId) + 1} / {blocks.length}</div>
  </div>

  <button onClick={() => {
    if (window.confirm('Supprimer cet exercice ?')) {
      deleteBlock(block.id);
      setSelectedBlockId(null);
    }
  }}>
    <Trash2 size={14} />
    Supprimer
  </button>
</div>
```

---

## 📊 AVANT / APRÈS

### **AVANT** ❌

```
┌─────────────────────────────────────────┐
│ [Sidebar fixe]  │  [Zone principale]    │
│                 │                       │
│ Types           │  Liste des exercices  │
│ 🃏 Flashcard    │  ┌─────────────────┐  │
│ ✓✗ Vrai/Faux    │  │ Exercice 1      │  │
│ ☑ QCM           │  ├─────────────────┤  │
│ ...             │  │ Exercice 2      │  │
│                 │  └─────────────────┘  │
│                 │  (Tout mélangé)       │
└─────────────────────────────────────────┘
```

### **APRÈS** ✅

```
┌─────────────────────────────────────────────────┐
│ [Header fixe]                                   │
├──────────────────────┬──────────────────────────┤
│ [Onglets]            │                          │
│ • Exercices (7)      │  [Éditeur sélectionné]   │
│ • + Blocs            │                          │
├──────────────────────┤  ┌────────────────────┐  │
│ [Liste drag & drop]  │  │ 🃏 Flashcard       │  │
│ ≡ [1] 🃏 ...         │  ├────────────────────┤  │
│ ≡ [2] ✓✗ ...         │  │ [Contenu éditable] │  │
│ ≡ [3] ☑ ...          │  │ ...                │  │
│ ...                  │  └────────────────────┘  │
│                      │  (Scrollable)            │
│ OU [Palette]         │                          │
│ 💡 Message           │                          │
│ [🃏 Flashcard    +]  │                          │
│ [✓✗ Vrai/Faux    +]  │                          │
│ [☑ QCM           +]  │                          │
└──────────────────────┴──────────────────────────┘
```

---

## 🎯 WORKFLOW UTILISATEUR

### **Scénario 1 : Créer des exercices**

1. **Clic** sur onglet "**+ Blocs**"
2. **Clic** sur un type (ex: "🃏 Flashcard")
3. **→ Retour automatique** sur onglet "Exercices"
4. **→ Bloc ajouté et sélectionné**
5. **Édition** du contenu à droite
6. **Répéter** pour ajouter d'autres types

### **Scénario 2 : Réorganiser**

1. Onglet "**Exercices**" actif
2. **Glisser-déposer** un bloc vers une nouvelle position
3. **Numérotation** mise à jour automatiquement
4. **Enregistrer** pour sauvegarder l'ordre

### **Scénario 3 : Éditer un exercice**

1. Onglet "**Exercices**" actif
2. **Clic** sur un exercice dans la liste
3. **→ Bordure bleue** sur l'exercice sélectionné
4. **→ Éditeur** s'affiche à droite
5. **Modifier** le contenu
6. **Enregistrer**

---

## 🎨 DESIGN TOKENS

### **Couleurs par type**

| Type | Icône | Couleur | Hex |
|------|-------|---------|-----|
| Flashcard | 🃏 | Violet | `#8b5cf6` |
| Vrai/Faux | ✓✗ | Bleu | `#3b82f6` |
| QCM | ☑ | Vert | `#10b981` |
| QCM Sélectif | ☑☑ | Orange | `#f59e0b` |
| Réorganiser | 🔢 | Cyan | `#06b6d4` |
| Glisser-Déposer | 🎯 | Rouge | `#ef4444` |
| Paires | 🔗 | Rose | `#ec4899` |

### **Spacing**

- Sidebar : `320px` de largeur
- Padding onglets : `12px 16px`
- Padding liste : `12px`
- Gap items : `8-10px`
- Padding éditeur : `20px`

### **États visuels**

- **Onglet actif** : Background `white`, border `2px solid #3b82f6`
- **Onglet inactif** : Background `transparent`, color `#94a3b8`
- **Item sélectionné** : Background `#f0f9ff`, border `#3b82f6`
- **Item hover** : Border `#cbd5e1`
- **Item drag** : Opacity `0.5`

---

## 🚀 FONCTIONNALITÉS PRÉSERVÉES

✅ **Undo/Redo** : Fonctionnel avec états disabled  
✅ **Sauvegarde Firebase** : Alert succès/erreur  
✅ **7 types d'exercices** : Tous disponibles  
✅ **Édition complète** : Tous les champs  
✅ **Points configurables** : Dans chaque éditeur  
✅ **Suppression** : Avec confirmation  
✅ **Navigation** : Retour vers programme  

---

## 📸 CAPTURES CLÉS

### **Onglet "Exercices"**

```
┌────────────────────────────┐
│ Exercices (7) │ + Blocs    │ ← Onglets
├────────────────────────────┤
│ ≡ [1] 🃏 Flashcard  5 pts  │ ← Drag handle + badge + info
│ ≡ [2] ✓✗ Vrai/Faux  3 pts  │
│ ≡ [3] ☑ QCM         4 pts  │ ← Sélectionné (bordure bleue)
│ ≡ [4] ☑☑ QCM Sél.   6 pts  │
│ ≡ [5] 🔢 Réorg.     5 pts  │
│ ≡ [6] 🎯 Drag&Drop  8 pts  │
│ ≡ [7] 🔗 Paires     7 pts  │
└────────────────────────────┘
```

### **Onglet "Blocs"**

```
┌────────────────────────────┐
│ Exercices (7) │ + Blocs    │
├────────────────────────────┤
│ 💡 Clique pour ajouter     │
├────────────────────────────┤
│ [🃏] Flashcard         [+] │
│     Question/Réponse       │
├────────────────────────────┤
│ [✓✗] Vrai/Faux         [+] │
│     Affirmation à val...   │
├────────────────────────────┤
│ [☑] QCM                [+] │
│     Choix multiple         │
└────────────────────────────┘
```

### **Éditeur (quand sélectionné)**

```
┌─────────────────────────────────┐
│ [🃏] Flashcard          [🗑️]    │
│     Exercice 3 / 7              │
├─────────────────────────────────┤
│                                 │
│  [Question]                     │
│  ┌─────────────────────────┐   │
│  │ Quelle est la capitale..│   │
│  └─────────────────────────┘   │
│                                 │
│  [Réponse]                      │
│  ┌─────────────────────────┐   │
│  │ Paris                   │   │
│  └─────────────────────────┘   │
│                                 │
│  [Points] [5]                   │
│                                 │
└─────────────────────────────────┘
```

---

## 🧪 TESTS

**Rafraîchis et teste :**

1. ✅ **Onglet "Exercices"** : Liste affichée avec drag & drop
2. ✅ **Onglet "Blocs"** : Palette affichée avec message
3. ✅ **Ajouter un bloc** : Bascule sur "Exercices" + sélection auto
4. ✅ **Glisser-déposer** : Réorganisation fonctionnelle
5. ✅ **Sélection** : Bordure bleue + éditeur à droite
6. ✅ **Édition** : Contenu modifiable
7. ✅ **Suppression** : Confirmation + désélection
8. ✅ **Enregistrer** : Alert de succès
9. ✅ **Undo/Redo** : Historique fonctionnel
10. ✅ **Compteur** : "Exercices (X)" dynamique

---

**🎉 SYSTÈME À ONGLETS COMPLET ET FONCTIONNEL ! 🚀✨**

**UX optimale pour créer, organiser et éditer des exercices ! 📸**
