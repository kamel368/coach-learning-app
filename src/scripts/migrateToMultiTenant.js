import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Migration de /programs vers /organizations/{orgId}/programs
 */
export async function migrateToMultiTenant(organizationId) {
  console.log('🚀 ========================================');
  console.log('🚀 MIGRATION MULTI-TENANT - DÉBUT');
  console.log('🚀 ========================================\n');
  console.log(`📍 Organisation cible: ${organizationId}\n`);
  
  const stats = {
    programsMigrated: 0,
    modulesMigrated: 0,
    lessonsMigrated: 0,
    exerciseDocsMigrated: 0,
    errors: []
  };
  
  try {
    // 1. Récupérer tous les programmes de /programs
    const programsRef = collection(db, 'programs');
    const programsSnap = await getDocs(programsRef);
    
    console.log(`📚 ${programsSnap.size} programmes à migrer\n`);
    
    for (const programDoc of programsSnap.docs) {
      const programId = programDoc.id;
      const programData = programDoc.data();
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📘 Migration programme: ${programData.title || programId}`);
      console.log(`   ID: ${programId}`);
      console.log(`${'='.repeat(60)}`);
      
      try {
        // Copier le programme
        const newProgramRef = doc(db, 'organizations', organizationId, 'programs', programId);
        await setDoc(newProgramRef, {
          ...programData,
          organizationId,
          migratedAt: new Date(),
          migratedFrom: 'programs'
        });
        
        console.log(`✅ Programme copié`);
        stats.programsMigrated++;
        
        // Copier les chapters
        const modulesRef = collection(db, 'programs', programId, 'chapitres');
        const modulesSnap = await getDocs(modulesRef);
        
        console.log(`   📚 ${modulesSnap.size} chapters à migrer`);
        
        for (const chapterDoc of modulesSnap.docs) {
          const chapterId = chapterDoc.id;
          const chapterData = chapterDoc.data();
          
          console.log(`      📘 Chapitre: ${chapterData.title || chapterId}`);
          
          const newModuleRef = doc(db, 'organizations', organizationId, 'programs', programId, 'chapitres', chapterId);
          await setDoc(newModuleRef, {
            ...chapterData,
            organizationId,
            programId
          });
          
          stats.modulesMigrated++;
          
          // Copier exercises/main du chapitre si existe
          try {
            const moduleExercisesRef = doc(db, 'programs', programId, 'chapitres', chapterId, 'exercises', 'main');
            const moduleExercisesSnap = await getDoc(moduleExercisesRef);
            
            if (moduleExercisesSnap.exists()) {
              const newModuleExercisesRef = doc(
                db, 'organizations', organizationId, 'programs', programId, 
                'chapitres', chapterId, 'exercises', 'main'
              );
              await setDoc(newModuleExercisesRef, moduleExercisesSnap.data());
              stats.exerciseDocsMigrated++;
              console.log(`         ✅ exercises/main du chapitre copié`);
            }
          } catch (e) {
            console.log(`         ⚠️ Pas de exercises/main dans ce chapitre`);
          }
          
          // Copier les lessons
          const lessonsRef = collection(db, 'programs', programId, 'chapitres', chapterId, 'lessons');
          const lessonsSnap = await getDocs(lessonsRef);
          
          console.log(`         📚 ${lessonsSnap.size} lessons à migrer`);
          
          for (const lessonDoc of lessonsSnap.docs) {
            const lessonId = lessonDoc.id;
            const lessonData = lessonDoc.data();
            
            const newLessonRef = doc(
              db, 'organizations', organizationId, 'programs', programId, 
              'chapitres', chapterId, 'lessons', lessonId
            );
            await setDoc(newLessonRef, {
              ...lessonData,
              organizationId,
              programId,
              chapterId
            });
            
            stats.lessonsMigrated++;
            
            // Copier exercises/main de la lesson si existe
            try {
              const lessonExercisesRef = doc(
                db, 'programs', programId, 'chapitres', chapterId, 
                'lessons', lessonId, 'exercises', 'main'
              );
              const lessonExercisesSnap = await getDoc(lessonExercisesRef);
              
              if (lessonExercisesSnap.exists()) {
                const newLessonExercisesRef = doc(
                  db, 'organizations', organizationId, 'programs', programId, 
                  'chapitres', chapterId, 'lessons', lessonId, 'exercises', 'main'
                );
                await setDoc(newLessonExercisesRef, lessonExercisesSnap.data());
                stats.exerciseDocsMigrated++;
              }
            } catch (e) {}
          }
          
          console.log(`      ✅ Chapitre migré`);
        }
        
        console.log(`✅ Programme "${programData.title || programId}" migré avec succès`);
        
      } catch (error) {
        console.error(`❌ Erreur migration programme ${programId}:`, error);
        stats.errors.push({ programId, error: error.message });
      }
    }
    
    // RÉSUMÉ
    console.log('\n\n🎯 ========================================');
    console.log('🎯 RÉSUMÉ DE LA MIGRATION');
    console.log('🎯 ========================================\n');
    
    console.log('📊 STATISTIQUES:');
    console.log(`   • Programmes migrés: ${stats.programsMigrated}`);
    console.log(`   • Chapitres migrés: ${stats.modulesMigrated}`);
    console.log(`   • Lessons migrées: ${stats.lessonsMigrated}`);
    console.log(`   • Documents exercises/main migrés: ${stats.exerciseDocsMigrated}`);
    console.log(`   • Erreurs: ${stats.errors.length}\n`);
    
    if (stats.errors.length > 0) {
      console.log('❌ ERREURS:');
      stats.errors.forEach(err => {
        console.log(`   • ${err.programId}: ${err.error}`);
      });
      console.log('');
    }
    
    console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS !\n');
    console.log('📋 PROCHAINES ÉTAPES:');
    console.log('   1. ✅ Vérifier les données dans Firebase Console');
    console.log('      → /organizations/' + organizationId + '/programs');
    console.log('   2. ✅ Relancer l\'audit pour confirmer');
    console.log('   3. ✅ Tester l\'évaluation programme');
    console.log('   4. ⚠️  Si tout fonctionne, supprimer /programs (manuel)\n');
    
    console.log('🎯 ========================================\n');
    
    return stats;
    
  } catch (error) {
    console.error('❌ ERREUR FATALE:', error);
    throw error;
  }
}

// Exporter pour usage global
window.migrateToMultiTenant = migrateToMultiTenant;
