import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * RESET TOTAL : Supprime TOUT
 * ATTENTION : Vous devrez recréer les comptes manuellement
 */
export async function resetDatabaseTotal() {
  console.log('💀 ========================================');
  console.log('💀 RESET TOTAL ABSOLU - OPTION B');
  console.log('💀 ========================================\n');
  console.log('⚠️  SUPPRESSION DE TOUT !\n');
  
  const stats = {
    totalDeleted: 0,
    collections: {}
  };
  
  // Liste de TOUTES les collections à supprimer
  const collectionsToDelete = [
    'aiExercises',
    'categories',
    'organizations',
    'platform',
    'platformAdmins',
    'platformSettings',
    'programs',
    'quizAttempts',
    'quizzes',
    'userProgress',
    'users',
    'org_default',  // Collection bizarre détectée dans Firebase
    'employees',     // Si existe
    'gamification'   // Si existe
  ];
  
  try {
    for (const collectionName of collectionsToDelete) {
      console.log(`🗑️  Suppression /${collectionName}...`);
      
      try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        
        stats.collections[collectionName] = snapshot.size;
        
        for (const docSnapshot of snapshot.docs) {
          await deleteDoc(docSnapshot.ref);
          stats.totalDeleted++;
        }
        
        console.log(`   ✅ ${snapshot.size} documents supprimés\n`);
        
      } catch (error) {
        console.log(`   ℹ️  Collection n'existe pas ou vide\n`);
        stats.collections[collectionName] = 0;
      }
    }
    
    // RÉSUMÉ
    console.log('\n💀 ========================================');
    console.log('💀 RÉSUMÉ DU RESET TOTAL');
    console.log('💀 ========================================\n');
    
    console.log('📊 SUPPRIMÉ:');
    Object.entries(stats.collections).forEach(([name, count]) => {
      if (count > 0) {
        console.log(`   • ${name}: ${count} documents`);
      }
    });
    console.log(`\n   TOTAL: ${stats.totalDeleted} documents supprimés\n`);
    
    console.log('💀 BASE DE DONNÉES COMPLÈTEMENT VIDE\n');
    
    console.log('📋 PROCHAINES ÉTAPES OBLIGATOIRES:');
    console.log('   1. ✅ Recréer une organisation dans Firebase Console');
    console.log('   2. ✅ Noter le nouvel organizationId');
    console.log('   3. ✅ Recréer les comptes users avec ce nouvel orgId');
    console.log('   4. ✅ Se reconnecter');
    console.log('   5. ✅ Auditer le code de création');
    console.log('   6. ✅ Corriger TOUTES les routes bugguées');
    console.log('   7. ✅ Créer un programme test\n');
    
    console.log('💀 ========================================\n');
    
    return stats;
    
  } catch (error) {
    console.error('❌ ERREUR:', error);
    throw error;
  }
}

window.resetDatabaseTotal = resetDatabaseTotal;
