/**
 * 🔄 SCRIPT DE MIGRATION : Ajouter assignedPrograms aux users existants
 * 
 * Ce script ajoute le champ assignedPrograms (tableau vide) à tous les users
 * qui n'ont pas encore ce champ dans Firestore.
 * 
 * USAGE:
 * 1. Installer les dépendances si nécessaire: npm install firebase
 * 2. Lancer: node scripts/addAssignedPrograms.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Configuration Firebase (copié depuis src/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyC-IpCoGFM11pxotPTf5Tyi78vFrSQp4QI",
  authDomain: "coach-learning-app.firebaseapp.com",
  projectId: "coach-learning-app",
  storageBucket: "coach-learning-app.firebasestorage.app",
  messagingSenderId: "510964880802",
  appId: "1:510964880802:web:f4312e4ae06be3b9fc0efb",
  measurementId: "G-RR0ZFX51CD"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Fonction principale de migration
 */
async function migrateUsers() {
  console.log('\n🔄 MIGRATION DES USERS - Ajout de assignedPrograms');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    // Récupérer tous les users
    console.log('📥 Récupération de tous les users...');
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`✅ ${usersSnap.size} users trouvés\n`);
    
    let countUpdated = 0;
    let countSkipped = 0;
    let countErrors = 0;
    
    // Parcourir chaque user
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        // Si assignedPrograms n'existe pas déjà
        if (!userData.assignedPrograms) {
          await updateDoc(doc(db, 'users', userId), {
            assignedPrograms: []
          });
          countUpdated++;
          console.log(`✅ User ${userId} (${userData.email || 'N/A'}) → assignedPrograms ajouté`);
        } else {
          countSkipped++;
          console.log(`⏭️  User ${userId} (${userData.email || 'N/A'}) → déjà à jour`);
        }
      } catch (error) {
        countErrors++;
        console.error(`❌ Erreur pour user ${userId}:`, error.message);
      }
    }
    
    // Résumé
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ MIGRATION TERMINÉE !');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 Statistiques:`);
    console.log(`   • Total users: ${usersSnap.size}`);
    console.log(`   • Mis à jour: ${countUpdated}`);
    console.log(`   • Déjà à jour: ${countSkipped}`);
    console.log(`   • Erreurs: ${countErrors}`);
    console.log('═══════════════════════════════════════════════════\n');
    
    // Terminer proprement
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error);
    process.exit(1);
  }
}

// Lancer la migration
console.log('\n⚡️ Démarrage du script de migration...\n');
migrateUsers();
