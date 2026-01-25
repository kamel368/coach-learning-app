# Roadmap V2 - Fonctionnalités futures

## 🤖 Exercices avec IA (Gemini 2.0)

### Concept
Module d'entraînement conversationnel pour s'exercer à la rétention client par la création de personas et la connexion de bases de connaissance.

### Fonctionnalités prévues
- **Création de personas clients** : Définir des profils clients types avec leurs caractéristiques (âge, situation, objections courantes)
- **Simulations vocales avec Gemini** : Conversations en temps réel avec l'IA qui joue le rôle du client
- **Base de connaissances produits** : Alimenter l'IA avec des documents et fiches produits
- **Évaluation des interactions** : Analyse automatique de la qualité de la conversation (empathie, arguments, closing)
- **Scenarios personnalisables** : Créer des situations spécifiques (client mécontent, client hésitant, etc.)

### Technologies envisagées
- Google Gemini 2.0 (multimodal : texte + voix)
- Firebase Cloud Functions pour l'orchestration
- Real-time streaming pour les conversations
- Vector embeddings pour la base de connaissances

### Statut
- 📅 **Planifié pour V2**
- ❌ **Code V1 supprimé** (architecture à refaire complètement)
- 🎯 **Priorité** : Moyenne (après stabilisation V1)

---

## 📂 Catégories de programmes (intégration inline)

### Changement V2
La page dédiée "Rôles Métier" a été **supprimée** pour simplifier l'UX.

### Nouvelle approche
- **Suppression** de `/admin/roles-metier` (page standalone)
- **Intégration** directe dans le formulaire de création de programme
- **Création inline** avec modal/dropdown
- **UX simplifiée** : moins de clics, workflow plus fluide

### Exemple d'interface prévu

```jsx
// Dans le formulaire de création de programme
<div>
  <label>Catégorie du programme</label>
  <Select>
    <option value="">-- Sélectionnez une catégorie --</option>
    <option value="vente">Vente</option>
    <option value="management">Management</option>
    <option value="technique">Technique</option>
  </Select>
  <button onClick={() => setShowCategoryModal(true)}>
    + Nouvelle catégorie
  </button>
</div>

{/* Modal de création rapide */}
{showCategoryModal && (
  <Modal>
    <h3>Créer une catégorie</h3>
    <input placeholder="Nom de la catégorie" />
    <textarea placeholder="Description (optionnel)" />
    <button>Créer</button>
  </Modal>
)}
```

### Statut
- ✅ **Décision prise**
- ⏳ **Implémentation** : Après nettoyage du code
- 🗄️ **Collection Firebase** : `/organizations/{orgId}/categories` (conservée)

---

## 🎯 Prochaines étapes V1

Avant de passer à la V2, finaliser :

1. ✅ **Nettoyage du code** : Supprimer les pages et routes obsolètes
2. ⏳ **Migration multi-tenant** : Finaliser la structure `/organizations/{orgId}/...`
3. ⏳ **Stabilisation** : Corriger tous les bugs de navigation et de progression
4. ⏳ **Intégration catégories inline** : Implémenter le nouveau workflow
5. ⏳ **Tests utilisateurs** : Valider l'UX avec de vrais apprenants
6. ⏳ **Documentation** : Documenter l'architecture et le code

---

## 💡 Idées futures (V3+)

- **Gamification avancée** : Badges, classements, récompenses
- **Parcours adaptatifs** : IA qui adapte le contenu selon les résultats
- **Collaboration** : Groupes de travail, mentorat entre apprenants
- **Analytics poussées** : Tableaux de bord prédictifs pour les formateurs
- **Mobile native** : Application iOS/Android
- **Intégrations** : Slack, Teams, Google Workspace

---

_Dernière mise à jour : 24 janvier 2026_
