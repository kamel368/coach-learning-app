# Guide d'utilisation du script de création de programmes

## 📋 Description

Ce script génère automatiquement 3 programmes de formation complets avec tout leur contenu :

- **Excellence Managériale** (Leadership, Gestion d'équipe, Performance, Innovation)
- **Excellence Commerciale** (Prospection, Négociation, Closing, Fidélisation)
- **Excellence RH** (Recrutement, Onboarding, Formation, Rétention)

Chaque programme contient :
- 4 chapitres
- 3 lessons par chapitre (12 lessons par programme)
- 2-3 exercices par lesson
- **Total : ~80 exercices variés** (flashcards, QCM, Vrai/Faux)

---

## 🚀 Méthode 1 : Via la console du navigateur

1. Ouvrir l'application dans le navigateur
2. Se connecter en tant qu'admin
3. Ouvrir la console développeur (F12)
4. Exécuter :

```javascript
// Importer le script
const { createAllTestPrograms } = await import('./src/scripts/createTestPrograms.js');

// Lancer la création
await createAllTestPrograms();
```

---

## 🎛️ Méthode 2 : Depuis l'interface admin (RECOMMANDÉ)

Ajouter un bouton dans une page admin existante (ex: `AuditPage.jsx`) :

```javascript
import { createAllTestPrograms } from '../../scripts/createTestPrograms';

// Dans votre composant :
<button
  onClick={async () => {
    if (window.confirm('⚠️ Créer 3 programmes complets avec 36 lessons et ~80 exercices ?\n\nCela va créer environ 150 documents dans Firebase.')) {
      try {
        console.log('🚀 Démarrage...');
        await createAllTestPrograms();
        alert('✅ Programmes créés avec succès !\n\nAllez dans la liste des programmes pour les voir.');
      } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la création : ' + error.message);
      }
    }
  }}
  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all"
>
  🚀 Créer les 3 programmes de test
</button>
```

---

## 📁 Structure créée

```
/organizations/{orgId}/programs/
├── Programme 1: Excellence Managériale
│   ├── chapitres/
│   │   ├── Leadership & Vision
│   │   │   ├── lessons/
│   │   │   │   ├── Les fondamentaux du leadership
│   │   │   │   ├── Développer sa vision stratégique
│   │   │   │   └── Communiquer sa vision efficacement
│   │   │   └── exercises/
│   │   │       └── main (contient tous les exercices)
│   │   ├── Gestion d'équipe
│   │   ├── Performance & Résultats
│   │   └── Développement & Innovation
│
├── Programme 2: Excellence Commerciale
│   └── (même structure)
│
└── Programme 3: Excellence RH
    └── (même structure)
```

---

## ⏱️ Temps d'exécution

- **~30-60 secondes** (selon la vitesse de Firebase)
- Firebase crée environ **150 documents**
- La console affiche la progression en temps réel

---

## ✅ Validation après création

### 1. Dans l'interface admin
- Aller dans "Programmes"
- Vérifier que 3 nouveaux programmes apparaissent
- Ouvrir un programme
- Vérifier que 4 chapitres sont présents
- Ouvrir un chapitre
- Vérifier que 3 lessons sont présentes

### 2. Dans Firebase Console
- Aller dans Firestore
- Naviguer vers `/organizations/{orgId}/programs/`
- Vérifier la structure des données

### 3. Test fonctionnel
- Se connecter en tant qu'apprenant (assigner un programme si besoin)
- Ouvrir un programme
- Lire une lesson
- Tester un exercice
- Lancer une évaluation de chapitre

---

## 🔧 Configuration

Si vous souhaitez modifier l'organisation cible, éditez le fichier `createTestPrograms.js` :

```javascript
// Ligne 8
const organizationId = 'VOTRE_ORG_ID_ICI';
const createdBy = 'votre.email@exemple.com';
```

---

## 🛡️ Sécurité

- Le script nécessite des droits Firebase en écriture
- Seuls les admins devraient pouvoir l'exécuter
- Les données sont créées dans l'organisation spécifiée
- Aucune donnée existante n'est modifiée ou supprimée

---

## 🗑️ Nettoyage

Si vous souhaitez supprimer les programmes de test :

1. Aller dans Firebase Console
2. Supprimer les documents programmes créés
3. Les sous-collections (chapitres, lessons, exercises) seront automatiquement inaccessibles

---

## 📊 Contenu pédagogique

### Excellence Managériale
- Leadership moderne
- Gestion d'équipe motivée
- Pilotage de la performance
- Innovation et changement

### Excellence Commerciale
- Prospection ciblée
- Techniques de vente
- Négociation efficace
- Fidélisation client

### Excellence RH
- Recrutement de qualité
- Onboarding réussi
- Formation continue
- Engagement et rétention

---

## 🐛 Dépannage

### Erreur : "organizationId manquant"
→ Vérifier que l'ID d'organisation est correct dans le script

### Erreur : "Permission denied"
→ Vérifier les règles Firestore
→ S'assurer d'être connecté avec un compte admin

### Les programmes n'apparaissent pas
→ Rafraîchir la page
→ Vérifier dans Firebase Console que les données sont créées
→ Vérifier les logs console pour d'éventuelles erreurs

---

## 💡 Conseils

- **Lancez le script une seule fois** pour éviter les doublons
- **Attendez la fin complète** avant de fermer la page
- **Vérifiez les logs console** pour suivre la progression
- **Testez d'abord sur un environnement de dev**

---

## 🎯 Prochaines étapes après création

1. ✅ Vérifier que tout est créé
2. 📝 Assigner les programmes à des apprenants
3. 🧪 Tester le parcours apprenant complet
4. 📊 Vérifier les évaluations
5. 🎮 Tester la gamification

Bon test ! 🚀
