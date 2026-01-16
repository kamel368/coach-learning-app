import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

async function cleanupOldCollections() {
  console.log('🧹 Début du nettoyage des anciennes collections...\n');
  
  try {
    // ============================================
    // 1. Supprimer ancienne collection lessons/
    // ============================================
    console.log('📄 Suppression de la collection "lessons"...');
    const lessonsRef = collection(db, 'lessons');
    const lessonsSnap = await getDocs(lessonsRef);
    console.log(`   → ${lessonsSnap.size} anciennes leçons trouvées`);
    
    let lessonsDeleted = 0;
    for (const lessonDoc of lessonsSnap.docs) {
      await deleteDoc(doc(db, 'lessons', lessonDoc.id));
      lessonsDeleted++;
      console.log(`   ✅ Leçon ${lessonDoc.id} supprimée (${lessonsDeleted}/${lessonsSnap.size})`);
    }
    
    console.log(`✅ ${lessonsDeleted} leçons supprimées\n`);
    
    // ============================================
    // 2. Supprimer ancienne collection modules/
    // ============================================
    console.log('📦 Suppression de la collection "modules"...');
    const modulesRef = collection(db, 'modules');
    const modulesSnap = await getDocs(modulesRef);
    console.log(`   → ${modulesSnap.size} anciens modules trouvés`);
    
    let modulesDeleted = 0;
    for (const moduleDoc of modulesSnap.docs) {
      await deleteDoc(doc(db, 'modules', moduleDoc.id));
      modulesDeleted++;
      console.log(`   ✅ Module ${moduleDoc.id} supprimé (${modulesDeleted}/${modulesSnap.size})`);
    }
    
    console.log(`✅ ${modulesDeleted} modules supprimés\n`);
    
    // ============================================
    // 3. Résumé
    // ============================================
    console.log('═══════════════════════════════════════');
    console.log('✅ NETTOYAGE TERMINÉ !');
    console.log('═══════════════════════════════════════');
    console.log(`Total supprimé : ${lessonsDeleted + modulesDeleted} documents`);
    console.log('');
    console.log('Structure actuelle :');
    console.log('programs/{id}/modules/{id}/lessons/ ✅');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERREUR lors du nettoyage:', error);
    console.error('Détails:', error.message);
  }
}

// Exécuter le script
console.log('═══════════════════════════════════════');
console.log('🚀 SCRIPT DE NETTOYAGE FIREBASE');
console.log('═══════════════════════════════════════\n');

cleanupOldCollections()
  .then(() => {
    console.log('Script terminé. Tu peux fermer cette fenêtre.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
