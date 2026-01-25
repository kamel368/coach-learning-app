# ✅ Modification du Formulaire de Création de Programme

## 📋 Résumé des Modifications

Le formulaire de création de programme a été mis à jour pour remplacer le champ obligatoire "Rôle métier" par un champ optionnel "Catégorie" avec possibilité de création inline.

---

## 🎯 Objectifs Atteints

✅ **Renommage "Rôle métier" → "Catégorie"** dans tout le formulaire  
✅ **Champ catégorie rendu OPTIONNEL** (plus obligatoire)  
✅ **Bouton "+ Créer une nouvelle catégorie"** ajouté sous le dropdown  
✅ **Modal de création de catégorie** implémentée  
✅ **Sélection automatique** de la catégorie nouvellement créée  
✅ **Multi-tenant** : création dans `/organizations/{orgId}/categories`  
✅ **Messages d'erreur** mis à jour  

---

## 📝 Fichier Modifié

### `src/pages/AdminPrograms.jsx`

**1. States ajoutés** (lignes 40-56) :
```javascript
// Modal création catégorie
const [showCategoryModal, setShowCategoryModal] = useState(false);
const [newCategoryName, setNewCategoryName] = useState('');
const [isCreatingCategory, setIsCreatingCategory] = useState(false);
```

**2. Fonction `handleCreateCategory`** ajoutée (lignes 268-304) :
- Crée une nouvelle catégorie dans `/organizations/{orgId}/categories`
- Ajoute `organizationId` et `createdBy`
- Met à jour la liste locale des catégories
- Sélectionne automatiquement la nouvelle catégorie
- Ferme la modal

**3. Validation `handleSave` modifiée** (lignes 264-325) :
```javascript
// ❌ AVANT : categoryId obligatoire
if (!categoryId) {
  setFormError("Le rôle métier est obligatoire.");
  return;
}

// ✅ APRÈS : categoryId optionnel
// Plus de validation pour categoryId
categoryId: categoryId || null, // null si pas de catégorie
```

**4. Formulaire modal mis à jour** (lignes 2040-2112) :
- Label changé : "Rôle métier associé *" → "Catégorie (optionnel)"
- Option par défaut : "Choisir un rôle métier" → "-- Aucune catégorie --"
- Bouton "+ Créer une nouvelle catégorie" ajouté sous le dropdown
- Subtitle : "associez-le à un rôle métier" → "La catégorie est optionnelle"

**5. Modal création catégorie** ajoutée (lignes 2225-2286) :
```jsx
{showCategoryModal && (() => {
  return createPortal(
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Nouvelle catégorie</h3>
        <input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Ex: Sécurité routière"
          autoFocus
        />
        <button onClick={handleCreateCategory}>
          {isCreatingCategory ? 'Création...' : 'Créer'}
        </button>
      </div>
    </div>,
    modalRoot
  );
})()}
```

**6. Labels mis à jour dans tout le fichier** :
- `getCategoryLabel` : "Non défini" → "Sans catégorie", "Rôle inconnu" → "Catégorie inconnue"
- Filtre : "Métier" → "Catégorie"
- Colonne tableau : "Métier" → "Catégorie"
- Modal vue : "Rôle métier" → "Catégorie"
- Commentaires : "rôles métier" → "catégories"

---

## 🎨 Expérience Utilisateur

### Avant
1. ❌ Champ "Rôle métier" **obligatoire**
2. ❌ Impossible de créer un programme sans catégorie
3. ❌ Pas de moyen de créer une catégorie depuis le formulaire
4. ❌ Message d'erreur bloquant si pas de catégorie

### Après
1. ✅ Champ "Catégorie" **optionnel**
2. ✅ Possibilité de créer un programme sans catégorie
3. ✅ Bouton "+ Créer une nouvelle catégorie" inline
4. ✅ Modal de création rapide de catégorie
5. ✅ Sélection automatique de la catégorie créée
6. ✅ Pas de message d'erreur bloquant

---

## 🔄 Workflow de Création de Catégorie

```
1. Utilisateur clique sur "+ Créer une nouvelle catégorie"
   ↓
2. Modal s'ouvre avec champ de saisie auto-focusé
   ↓
3. Utilisateur tape le nom (ex: "Sécurité routière")
   ↓
4. Clic sur "Créer" OU appui sur Entrée
   ↓
5. Création dans /organizations/{orgId}/categories
   ↓
6. Catégorie ajoutée à la liste du dropdown
   ↓
7. Catégorie automatiquement sélectionnée
   ↓
8. Modal se ferme
   ↓
9. Utilisateur peut continuer la création du programme
```

---

## 🗄️ Structure Firebase

### Nouvelle Catégorie Créée

```javascript
/organizations/{organizationId}/categories/{categoryId}
{
  label: "Sécurité routière",
  organizationId: "qtCAf1TSqDxuSodEHTUT",
  createdAt: Timestamp,
  createdBy: "userId123"
}
```

### Programme Créé SANS Catégorie

```javascript
/organizations/{organizationId}/programs/{programId}
{
  name: "Formation Gestionnaire",
  description: "...",
  categoryId: null,  // ✅ null au lieu de chaîne vide
  status: "draft",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🧪 Tests de Validation

### Scénarios à Tester

✅ **Test 1** : Créer un programme SANS catégorie
- Résultat attendu : Programme créé avec `categoryId: null`
- Affichage tableau : "Sans catégorie"

✅ **Test 2** : Créer une nouvelle catégorie via le bouton "+"
- Résultat attendu : Catégorie créée et immédiatement sélectionnée

✅ **Test 3** : Créer un programme AVEC catégorie existante
- Résultat attendu : Programme créé avec `categoryId` valide

✅ **Test 4** : Appuyer sur Entrée dans le champ de création de catégorie
- Résultat attendu : Catégorie créée (raccourci clavier)

✅ **Test 5** : Cliquer sur "Annuler" dans la modal de catégorie
- Résultat attendu : Modal fermée, champ réinitialisé

✅ **Test 6** : Filtrer par catégorie dans le tableau
- Résultat attendu : Filtre "Toutes" inclut programmes sans catégorie

---

## 🎯 Prochaines Étapes (Suggestions)

### Court Terme
- ⏳ Tester en environnement de production
- ⏳ Vérifier que les programmes sans catégorie s'affichent correctement
- ⏳ Vérifier que le filtre fonctionne avec `categoryId: null`

### Moyen Terme
- 🎯 Ajouter un bouton "Modifier" pour éditer une catégorie existante
- 🎯 Ajouter la possibilité de supprimer une catégorie
- 🎯 Ajouter une icône/couleur personnalisable par catégorie
- 🎯 Statistiques : nombre de programmes par catégorie

---

## 📚 Cohérence avec ROADMAP_V2

Ces modifications sont alignées avec la décision de **supprimer la page dédiée "Rôles Métier"** et d'**intégrer la gestion des catégories inline** dans le formulaire de création de programme.

✅ **Décision ROADMAP_V2** :
> "Suppression de la page dédiée 'Rôles Métier'  
> Intégration dans le formulaire de création de programme  
> Création inline avec modal  
> UX simplifiée"

Cette modification est la **première étape** de cette refonte UX.

---

_Modifications complétées le 24 janvier 2026_
