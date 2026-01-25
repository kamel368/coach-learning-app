import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Migration des exercices de /programs vers /organizations/{orgId}/programs
 * 
 * Ce script :
 * 1. Scanne tous les programmes dans /programs
 * 2. Pour chaque chapitre, copie exercises/main vers la structure multi-tenant
 * 3. Ajoute organizationId dans les données
 * 4. Optionnellement, supprime l'ancienne structure
 */
export async function migrateExercises(organizationId, options = {}) {
  const { deleteOld = false, dryRun = false } = options;

  console.log('🚀 ========================================');
  console.log('🚀 MIGRATION DES EXERCICES');
  console.log('🚀 ========================================\n');
  console.log(`🏢 Organisation cible: ${organizationId}`);
  console.log(`🗑️  Supprimer anciens: ${deleteOld ? 'OUI' : 'NON'}`);
  console.log(`🧪 Mode test (dry-run): ${dryRun ? 'OUI' : 'NON'}`);
  console.log('');

  const stats = {
    programsScanned: 0,
    chaptersScanned: 0,
    exercisesMigrated: 0,
    exercisesDeleted: 0,
    errors: []
  };

  try {
    // 1. Scanner tous les programmes dans /programs
    console.log('📂 Scan de /programs...\n');
    const programsRef = collection(db, 'programs');
    const programsSnap = await getDocs(programsRef);
    stats.programsScanned = programsSnap.size;

    console.log(`📚 ${programsSnap.size} programme(s) trouvé(s)\n`);

    for (const programDoc of programsSnap.docs) {
      const programId = programDoc.id;
      const programData = programDoc.data();

      console.log(`${'='.repeat(60)}`);
      console.log(`📘 Programme: ${programData.title || programId}`);
      console.log(`${'='.repeat(60)}`);

      try {
        // 2. Scanner tous les chapitres du programme
        const chaptersRef = collection(db, 'programs', programId, 'chapitres');
        const chaptersSnap = await getDocs(chaptersRef);
        stats.chaptersScanned += chaptersSnap.size;

        console.log(`   📚 ${chaptersSnap.size} chapitre(s) dans ce programme\n`);

        for (const chapterDoc of chaptersSnap.docs) {
          const chapterId = chapterDoc.id;
          const chapterData = chapterDoc.data();

          console.log(`   📘 Chapitre: ${chapterData.title || chapterId}`);

          try {
            // 3. Vérifier si exercises/main existe
            const oldExercisesRef = doc(
              db,
              'programs', programId,
              'chapitres', chapterId,
              'exercises', 'main'
            );

            const oldExercisesSnap = await getDoc(oldExercisesRef);

            if (!oldExercisesSnap.exists()) {
              console.log(`      ⚠️  Pas d'exercices (exercises/main n'existe pas)\n`);
              continue;
            }

            const exercisesData = oldExercisesSnap.data();
            const blocksCount = exercisesData.blocks?.length || 0;

            console.log(`      ✅ ${blocksCount} exercice(s) trouvé(s)`);
            console.log(`      📍 Ancien chemin: /programs/${programId}/chapitres/${chapterId}/exercises/main`);

            // 4. Créer le nouveau chemin
            const newExercisesRef = doc(
              db,
              'organizations', organizationId,
              'programs', programId,
              'chapitres', chapterId,
              'exercises', 'main'
            );

            console.log(`      📍 Nouveau chemin: /organizations/${organizationId}/programs/${programId}/chapitres/${chapterId}/exercises/main`);

            // 5. Copier les données avec organizationId
            const migratedData = {
              ...exercisesData,
              organizationId,
              programId,
              chapterId,
              migratedAt: new Date(),
              migratedFrom: 'programs'
            };

            if (dryRun) {
              console.log(`      🧪 [DRY-RUN] Copie simulée`);
            } else {
              await setDoc(newExercisesRef, migratedData);
              stats.exercisesMigrated += blocksCount;
              console.log(`      ✅ Exercices copiés avec succès`);
            }

            // 6. Supprimer l'ancien si demandé
            if (deleteOld && !dryRun) {
              await deleteDoc(oldExercisesRef);
              stats.exercisesDeleted += blocksCount;
              console.log(`      🗑️  Ancien document supprimé`);
            }

            console.log('');

          } catch (chapterError) {
            console.error(`      ❌ Erreur chapitre ${chapterId}:`, chapterError.message);
            stats.errors.push({
              programId,
              chapterId,
              error: chapterError.message
            });
          }
        }

        console.log('');

      } catch (programError) {
        console.error(`   ❌ Erreur programme ${programId}:`, programError.message);
        stats.errors.push({
          programId,
          error: programError.message
        });
      }
    }

    // RÉSUMÉ
    console.log('\n🎯 ========================================');
    console.log('🎯 RÉSUMÉ DE LA MIGRATION');
    console.log('🎯 ========================================\n');
    console.log('📊 STATISTIQUES:');
    console.log(`   • Programmes scannés: ${stats.programsScanned}`);
    console.log(`   • Chapitres scannés: ${stats.chaptersScanned}`);
    console.log(`   • Exercices migrés: ${stats.exercisesMigrated}`);
    if (deleteOld) {
      console.log(`   • Exercices supprimés (ancien): ${stats.exercisesDeleted}`);
    }
    console.log(`   • Erreurs: ${stats.errors.length}\n`);

    if (stats.errors.length > 0) {
      console.log('❌ ERREURS:');
      stats.errors.forEach(err => {
        const location = err.chapterId 
          ? `${err.programId}/${err.chapterId}`
          : err.programId;
        console.log(`   • ${location}: ${err.error}`);
      });
      console.log('');
    }

    if (dryRun) {
      console.log('🧪 MODE TEST - Aucune modification effectuée');
      console.log('   Relancez avec { dryRun: false } pour appliquer les changements\n');
    } else if (stats.errors.length === 0) {
      console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS !\n');
      console.log('📋 VÉRIFICATIONS:');
      console.log('   1. Ouvrir Firebase Console');
      console.log(`   2. Vérifier /organizations/${organizationId}/programs/*/chapitres/*/exercises/main`);
      console.log('   3. Tester l\'application (créer/modifier exercices)');
      if (deleteOld) {
        console.log('   4. Vérifier que /programs/*/chapitres/*/exercises/main a été supprimé');
      }
      console.log('');
    }

    console.log('🎯 ========================================\n');

    return stats;

  } catch (error) {
    console.error('❌ ERREUR FATALE:', error);
    throw error;
  }
}

// Exporter pour usage global dans la console
if (typeof window !== 'undefined') {
  window.migrateExercises = migrateExercises;
}

/**
 * USAGE:
 * 
 * // Mode test (ne modifie rien)
 * await migrateExercises('qtCAf1TSqDxuSodEHTUT', { dryRun: true });
 * 
 * // Migration sans suppression de l'ancien
 * await migrateExercises('qtCAf1TSqDxuSodEHTUT');
 * 
 * // Migration avec suppression de l'ancien
 * await migrateExercises('qtCAf1TSqDxuSodEHTUT', { deleteOld: true });
 */
