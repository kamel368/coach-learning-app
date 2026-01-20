/**
 * 🔧 SCRIPT DE CORRECTION DES POURCENTAGES CORROMPUS
 * 
 * Ce script corrige les pourcentages de progression > 100% dans Firebase
 * 
 * USAGE :
 *   node scripts/fixCorruptedProgressPercentages.js
 * 
 * ATTENTION :
 *   - Ce script modifie directement les données Firebase
 *   - Faire un backup avant de lancer
 *   - Exécuter en dehors des heures de production
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  getDoc
} from 'firebase/firestore';

// Configuration Firebase (à adapter selon votre projet)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixCorruptedProgressPercentages() {
  console.log('🔧 DÉBUT DE LA CORRECTION DES POURCENTAGES CORROMPUS\n');
  
  let totalUsersChecked = 0;
  let totalProgramsChecked = 0;
  let totalProgramsFixed = 0;
  const corruptedPrograms = [];

  try {
    // 1. Récupérer tous les utilisateurs
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`👥 ${usersSnap.size} utilisateurs trouvés\n`);
    
    // 2. Pour chaque utilisateur
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userName = userDoc.data().email || userDoc.data().name || userId;
      totalUsersChecked++;
      
      console.log(`\n🔍 Vérification utilisateur: ${userName} (${userId})`);
      
      // 3. Récupérer tous les programmes de cet utilisateur
      const userProgressRef = collection(db, `userProgress/${userId}/programs`);
      const programsSnap = await getDocs(userProgressRef);
      
      if (programsSnap.empty) {
        console.log('   ℹ️  Aucun programme trouvé');
        continue;
      }
      
      console.log(`   📚 ${programsSnap.size} programme(s) trouvé(s)`);
      
      // 4. Pour chaque programme
      for (const programDoc of programsSnap.docs) {
        const programId = programDoc.id;
        const data = programDoc.data();
        const currentPercentage = data.percentage || 0;
        totalProgramsChecked++;
        
        // Récupérer le nom du programme
        let programName = programId;
        try {
          const progDoc = await getDoc(doc(db, 'programs', programId));
          if (progDoc.exists()) {
            programName = progDoc.data().name || programId;
          }
        } catch (e) {
          // Ignorer l'erreur
        }
        
        // 5. Vérifier si le pourcentage est > 100%
        if (currentPercentage > 100) {
          console.log(`   ⚠️  CORROMPU: "${programName}" → ${currentPercentage}%`);
          
          corruptedPrograms.push({
            userId,
            userName,
            programId,
            programName,
            oldPercentage: currentPercentage,
            newPercentage: 100
          });
          
          // 6. Corriger à 100%
          const progressDocRef = doc(db, `userProgress/${userId}/programs/${programId}`);
          await updateDoc(progressDocRef, {
            percentage: 100
          });
          
          totalProgramsFixed++;
          console.log(`   ✅ Corrigé: ${currentPercentage}% → 100%`);
        } else if (currentPercentage < 0) {
          console.log(`   ⚠️  NÉGATIF: "${programName}" → ${currentPercentage}%`);
          
          corruptedPrograms.push({
            userId,
            userName,
            programId,
            programName,
            oldPercentage: currentPercentage,
            newPercentage: 0
          });
          
          // Corriger à 0%
          const progressDocRef = doc(db, `userProgress/${userId}/programs/${programId}`);
          await updateDoc(progressDocRef, {
            percentage: 0
          });
          
          totalProgramsFixed++;
          console.log(`   ✅ Corrigé: ${currentPercentage}% → 0%`);
        } else {
          console.log(`   ✓ OK: "${programName}" → ${currentPercentage}%`);
        }
      }
    }
    
    // 7. Résumé
    console.log('\n\n📊 RÉSUMÉ DE LA CORRECTION\n');
    console.log(`✓ Utilisateurs vérifiés : ${totalUsersChecked}`);
    console.log(`✓ Programmes vérifiés : ${totalProgramsChecked}`);
    console.log(`✓ Programmes corrigés : ${totalProgramsFixed}`);
    
    if (corruptedPrograms.length > 0) {
      console.log('\n\n⚠️  PROGRAMMES CORROMPUS TROUVÉS ET CORRIGÉS:\n');
      corruptedPrograms.forEach((prog, index) => {
        console.log(`${index + 1}. ${prog.userName} → "${prog.programName}"`);
        console.log(`   Ancien: ${prog.oldPercentage}% → Nouveau: ${prog.newPercentage}%`);
      });
    } else {
      console.log('\n✅ Aucun programme corrompu trouvé !');
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    throw error;
  }
  
  console.log('\n\n🎉 CORRECTION TERMINÉE !\n');
}

// Lancer le script
fixCorruptedProgressPercentages()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
