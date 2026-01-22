import { 
  doc, 
  setDoc, 
  getDocs,
  collection,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';

const DEFAULT_ORG_ID = "org_default";

export const migrationStep3 = async () => {
  console.log('🚀 ====================================');
  console.log('🚀 MIGRATION STEP 3 : Programs');
  console.log('🚀 ====================================\n');

  try {
    // ========================================
    // 1. Récupérer tous les programmes existants
    // ========================================
    console.log('📊 Récupération des programmes existants...');
    
    const programsSnapshot = await getDocs(collection(db, 'programs'));
    console.log(`   📦 ${programsSnapshot.size} programmes trouvés\n`);

    if (programsSnapshot.size === 0) {
      console.log('⚠️ Aucun programme à migrer');
      return { success: true, migrated: 0 };
    }

    let migratedCount = 0;
    let errorCount = 0;

    // ========================================
    // 2. Migrer chaque programme
    // ========================================
    for (const programDoc of programsSnapshot.docs) {
      const programId = programDoc.id;
      const programData = programDoc.data();
      
      console.log(`\n📚 Migration: ${programData.title || programId}`);

      try {
        // --- 2.1 Copier le programme ---
        const newProgramRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'programs', programId);
        
        await setDoc(newProgramRef, {
          ...programData,
          migratedAt: serverTimestamp()
        });
        console.log('   ✅ Programme copié');

        // --- 2.2 Copier les modules ---
        try {
          const modulesSnapshot = await getDocs(collection(db, 'programs', programId, 'modules'));
          
          for (const moduleDoc of modulesSnapshot.docs) {
            const moduleId = moduleDoc.id;
            const moduleData = moduleDoc.data();
            
            // Copier le module
            const newModuleRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'programs', programId, 'modules', moduleId);
            await setDoc(newModuleRef, moduleData);

            // --- 2.3 Copier les lessons ---
            try {
              const lessonsSnapshot = await getDocs(collection(db, 'programs', programId, 'modules', moduleId, 'lessons'));
              for (const lessonDoc of lessonsSnapshot.docs) {
                const newLessonRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'programs', programId, 'modules', moduleId, 'lessons', lessonDoc.id);
                await setDoc(newLessonRef, lessonDoc.data());
              }
              if (lessonsSnapshot.size > 0) {
                console.log(`   ✅ Module ${moduleId}: ${lessonsSnapshot.size} lessons`);
              }
            } catch (e) {
              console.log(`   ⚠️ Pas de lessons pour module ${moduleId}`);
            }

            // --- 2.4 Copier les exercises ---
            try {
              const exercisesSnapshot = await getDocs(collection(db, 'programs', programId, 'modules', moduleId, 'exercises'));
              for (const exerciseDoc of exercisesSnapshot.docs) {
                const newExerciseRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'programs', programId, 'modules', moduleId, 'exercises', exerciseDoc.id);
                await setDoc(newExerciseRef, exerciseDoc.data());
              }
              if (exercisesSnapshot.size > 0) {
                console.log(`   ✅ Module ${moduleId}: ${exercisesSnapshot.size} exercises`);
              }
            } catch (e) {
              console.log(`   ⚠️ Pas d'exercises pour module ${moduleId}`);
            }
          }
          
          if (modulesSnapshot.size > 0) {
            console.log(`   ✅ ${modulesSnapshot.size} modules migrés`);
          }
        } catch (e) {
          console.log('   ⚠️ Pas de modules');
        }

        // --- 2.5 Copier l'évaluation du programme ---
        try {
          const evalConfigSnapshot = await getDocs(collection(db, 'programs', programId, 'evaluation'));
          for (const evalDoc of evalConfigSnapshot.docs) {
            const newEvalRef = doc(db, 'organizations', DEFAULT_ORG_ID, 'programs', programId, 'evaluation', evalDoc.id);
            await setDoc(newEvalRef, evalDoc.data());
          }
          if (evalConfigSnapshot.size > 0) {
            console.log('   ✅ Evaluation config migrée');
          }
        } catch (e) {
          console.log('   ⚠️ Pas d\'evaluation config');
        }

        migratedCount++;

      } catch (error) {
        console.error(`   ❌ Erreur pour ${programId}:`, error.message);
        errorCount++;
      }
    }

    // ========================================
    // RÉSUMÉ
    // ========================================
    console.log('\n🎉 ====================================');
    console.log('🎉 MIGRATION STEP 3 TERMINÉE !');
    console.log('🎉 ====================================');
    console.log('\n📊 Résumé :');
    console.log(`   • Programmes migrés: ${migratedCount}`);
    console.log(`   • Erreurs: ${errorCount}`);
    console.log('\n✅ MIGRATION COMPLÈTE ! Prochaine étape : Adapter le code.');
    
    return { success: true, migrated: migratedCount, errors: errorCount };

  } catch (error) {
    console.error('\n❌ ERREUR Migration Step 3:', error);
    return { success: false, error };
  }
};
