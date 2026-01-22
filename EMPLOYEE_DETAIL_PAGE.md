# 👤 PAGE FICHE EMPLOYÉ - DOCUMENTATION

## ✅ FONCTIONNALITÉS IMPLÉMENTÉES

### 1. Migration Firebase ✅
**Script créé** : `src/scripts/migration/migrationAddEmployeeFields.js`

Ajoute les champs `poste` et `contrat` à tous les employés :
- Structure nouvelle : `/organizations/org_default/employees/{id}/profile.poste` et `profile.contrat`
- Structure ancienne : `/users/{id}/poste` et `contrat` (compatibilité)

**Utilisation** :
1. Aller sur `/admin/migration`
2. Cliquer sur le bouton orange "▶️ Ajouter champs poste/contrat"
3. Le script met à jour tous les employés existants

---

### 2. Page de Détail Employé ✅
**Fichier créé** : `src/pages/admin/EmployeeDetailPage.jsx`

**Route** : `/admin/employees/:employeeId`

#### Sections affichées :
- **Profil complet** : Avatar, nom, email, poste, contrat, rôle, statut, date d'inscription
- **Programmes assignés** : Liste avec barres de progression, pourcentage complété, dates
- **Actions disponibles** : Modifier, changer rôle, activer/désactiver, voir comme

#### Modals disponibles :
1. **Modifier profil** : Prénom, nom, poste, contrat
2. **Changer rôle** : Apprenant / Formateur / Admin
3. **Assigner programmes** : Multi-sélection avec cases à cocher

---

### 3. Bouton dans AdminUsers ✅
**Fichier modifié** : `src/pages/AdminUsers.jsx`

Nouveau bouton "👤 Fiche" à côté du bouton "Gérer" :
- Couleur bleue distinctive
- Navigation vers `/admin/employees/{uid}`
- Design cohérent avec l'interface

---

### 4. Mode "Voir son compte" ✅
**Fonctionnalité** : Ouvrir le compte apprenant dans un nouvel onglet

**Fichiers modifiés** :
- `src/context/AuthContext.jsx` : Gestion du mode `viewAs`
- `src/components/apprenant/ApprenantLayout.jsx` : Bandeau indicateur violet

#### Comment ça marche :
1. Admin clique sur "👁️ Voir son compte" sur la fiche employé
2. S'ouvre dans un **nouvel onglet** avec le dashboard apprenant
3. **Bandeau violet** en haut indique "Mode Voir comme activé"
4. Toutes les données affichées sont celles de l'apprenant
5. Bouton "✕ Quitter" pour revenir au compte admin

**Stockage** : LocalStorage (`viewAsUserId`, `viewAsUserEmail`)

---

## 🎨 DESIGN

### Couleurs
- **Bouton Fiche** : Bleu (`#eff6ff` / `#1e40af`)
- **Bouton Voir comme** : Violet gradient (`#8b5cf6` → `#7c3aed`)
- **Bandeau Mode ViewAs** : Violet gradient avec ombre

### Icônes
- 👤 Fiche employé
- 👁️ Voir son compte
- ✏️ Modifier
- 🔄 Changer rôle
- ⏸️ Désactiver / ▶️ Activer

---

## 📊 STRUCTURE FIREBASE

### Nouvelle structure
```
/organizations/org_default/employees/{employeeId}/
  ├── profile/
  │   ├── email: string
  │   ├── firstName: string
  │   ├── lastName: string
  │   ├── poste: string ✨ NOUVEAU
  │   ├── contrat: string ✨ NOUVEAU
  │   ├── role: "learner" | "trainer" | "admin"
  │   ├── status: "active" | "inactive"
  │   ├── createdAt: Timestamp
  │   └── updatedAt: Timestamp
  └── learning/
      ├── data/
      │   └── assignedPrograms: array
      └── progress/
          └── programs/{programId}/ ← Progression par programme
```

### Ancienne structure (compatibilité)
```
/users/{userId}/
  ├── email: string
  ├── firstName: string
  ├── lastName: string
  ├── poste: string ✨ NOUVEAU
  ├── contrat: string ✨ NOUVEAU
  ├── role: string
  ├── assignedPrograms: array
  └── createdAt: Timestamp
```

---

## 🔧 OPTIONS CONTRAT

```javascript
const CONTRAT_OPTIONS = [
  { value: '', label: 'Non défini' },
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Indépendant', label: 'Indépendant' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Alternance', label: 'Alternance' }
];
```

---

## 🚀 UTILISATION

### Accéder à la fiche employé
1. Aller sur `/admin/users`
2. Cliquer sur le bouton **"👤 Fiche"** d'un utilisateur
3. Ou directement : `/admin/employees/{userId}`

### Modifier un profil
1. Cliquer sur le bouton `⋮` (trois points)
2. Choisir **"✏️ Modifier profil"**
3. Modifier les champs
4. Cliquer **"Enregistrer"**

### Voir comme un apprenant
1. Cliquer sur **"👁️ Voir son compte"**
2. Un nouvel onglet s'ouvre avec le dashboard apprenant
3. Le **bandeau violet** confirme le mode "Voir comme"
4. Pour revenir : cliquer **"✕ Quitter"** dans le bandeau

### Assigner des programmes
1. Cliquer sur **"📚 Assigner"**
2. Cocher les programmes à assigner
3. Cliquer **"Enregistrer"**
4. Les programmes apparaissent avec leur progression

---

## ⚡ FALLBACKS

Le système supporte les deux structures Firebase :
- Si l'employé existe dans `/organizations/org_default/employees` → utilise cette structure
- Sinon, fallback vers `/users/{id}` (ancienne structure)
- Les mises à jour sont faites dans les **deux structures** pour garantir la compatibilité

---

## 🎯 PROCHAINES ÉTAPES POSSIBLES

1. **Statistiques détaillées** : Graphiques d'activité, temps passé par module
2. **Export CSV** : Exporter les données d'un employé
3. **Historique des modifications** : Traçabilité des changements de rôle/statut
4. **Notifications** : Envoyer un email lors de l'assignation d'un programme
5. **Groupes/Équipes** : Assigner des groupes d'apprenants à un formateur

---

## 📝 NOTES TECHNIQUES

- **Compatibilité** : Double écriture (nouvelle + ancienne structure)
- **Sécurité** : Mode "viewAs" stocké en localStorage (côté client)
- **Performance** : Chargement en parallèle des programmes et progressions
- **UX** : Modals pour toutes les actions, confirmations avant suppression
- **Responsive** : Design adaptatif mobile-first

---

## ✅ CHECKLIST

- [x] Migration champs poste/contrat
- [x] Page EmployeeDetailPage.jsx créée
- [x] Route /admin/employees/:id ajoutée
- [x] Bouton "Fiche" dans AdminUsers
- [x] Mode "Voir comme" avec nouvel onglet
- [x] Bandeau indicateur mode ViewAs
- [x] Édition profil (prénom, nom, poste, contrat)
- [x] Changement de rôle
- [x] Activation/désactivation compte
- [x] Assignation programmes
- [x] Retrait programmes
- [x] Fallbacks anciennes/nouvelles structures
- [x] Tests linter passés

**Status** : ✅ **TOUTES LES FONCTIONNALITÉS SONT IMPLÉMENTÉES**

---

*Dernière mise à jour : 22 janvier 2026*
