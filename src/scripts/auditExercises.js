import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Script d'audit pour identifier où sont stockés les exercices
 * Usage: Appeler depuis la console navigateur ou créer un bouton admin
 */
export async function auditExercises(organizationId, programId) {
  console.log('🔍 ========================================');
  console.log('🔍 AUDIT DES EXERCICES - DÉBUT');
  console.log('🔍 ========================================\n');
  console.log(`📍 Organization: ${organizationId}`);
  console.log(`📍 Programme: ${programId}\n`);
  
  const results = {
    lessonsWithBlocks: [],
    lessonsWithExercisesDoc: [],
    modulesWithExercisesDoc: [],
    exerciseTypes: new Set(),
    summary: {
      totalModules: 0,
      totalLessons: 0,
      totalExercisesInLessonBlocks: 0,
      totalExercisesInLessonDocs: 0,
      totalExercisesInModuleDocs: 0
    }
  };
  
  try {
    // 1. Scanner les chapters
    const modulesRef = collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres');
    const modulesSnap = await getDocs(modulesRef);
    
    results.summary.totalModules = modulesSnap.size;
    console.log(`📚 ${modulesSnap.size} chapters trouvés\n`);
    
    for (const chapterDoc of modulesSnap.docs) {
      const chapterId = chapterDoc.id;
      const chapterData = chapterDoc.data();
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📘 MODULE: ${chapterData.title || chapterId}`);
      console.log(`${'='.repeat(60)}`);
      
      // 1a. Vérifier si le chapitre a exercises/main
      try {
        const moduleExercisesRef = doc(
          db, 
          'organizations', organizationId, 
          'programs', programId, 
          'chapitres', chapterId, 
          'exercises', 'main'
        );
        const moduleExercisesSnap = await getDoc(moduleExercisesRef);
        
        if (moduleExercisesSnap.exists()) {
          const exerciseData = moduleExercisesSnap.data();
          const blocks = exerciseData.blocks || [];
          
          if (blocks.length > 0) {
            const types = blocks.map(b => b.type || b.data?.type);
            console.log(`  ✅ TROUVÉ: exercises/main dans MODULE`);
            console.log(`     📊 ${blocks.length} exercices`);
            console.log(`     🏷️  Types: ${types.join(', ')}`);
            
            results.modulesWithExercisesDoc.push({
              chapterId,
              chapterName: chapterData.title || 'Sans titre',
              blocksCount: blocks.length,
              types: types,
              path: `chapters/${chapterId}/exercises/main`
            });
            
            results.summary.totalExercisesInModuleDocs += blocks.length;
            types.forEach(t => results.exerciseTypes.add(t));
          }
        } else {
          console.log(`  ⚠️  Pas de exercises/main dans ce chapitre`);
        }
      } catch (e) {
        console.log(`  ❌ Erreur lecture exercises/main chapitre:`, e.message);
      }
      
      // 1b. Scanner les lessons du chapitre
      const lessonsRef = collection(
        db, 
        'organizations', organizationId, 
        'programs', programId, 
        'chapitres', chapterId, 
        'lessons'
      );
      const lessonsSnap = await getDocs(lessonsRef);
      
      results.summary.totalLessons += lessonsSnap.size;
      console.log(`\n  📚 ${lessonsSnap.size} lessons dans ce chapitre`);
      
      for (const lessonDoc of lessonsSnap.docs) {
        const lessonId = lessonDoc.id;
        const lessonData = lessonDoc.data();
        
        console.log(`\n    ${'─'.repeat(50)}`);
        console.log(`    📄 LESSON: ${lessonData.title || lessonId}`);
        console.log(`    ${'─'.repeat(50)}`);
        
        // 1b-i. Vérifier blocks dans le document lesson
        if (lessonData.blocks && Array.isArray(lessonData.blocks) && lessonData.blocks.length > 0) {
          const allTypes = lessonData.blocks.map(b => b.type || b.data?.type);
          
          // Filtrer les exercices (exclure text, separator, etc.)
          const exerciseBlocks = lessonData.blocks.filter(b => {
            const type = b.type || b.data?.type;
            return type && !['text', 'separator', 'heading', 'image'].includes(type);
          });
          
          console.log(`       ℹ️  Blocks dans lesson.blocks: ${lessonData.blocks.length} total`);
          console.log(`       🎯 Dont exercices: ${exerciseBlocks.length}`);
          console.log(`       🏷️  Tous types: ${allTypes.join(', ')}`);
          
          if (exerciseBlocks.length > 0) {
            const exerciseTypes = exerciseBlocks.map(b => b.type || b.data?.type);
            
            results.lessonsWithBlocks.push({
              chapterId,
              chapterName: chapterData.title || 'Sans titre',
              lessonId,
              lessonName: lessonData.title || 'Sans titre',
              blocksCount: exerciseBlocks.length,
              types: exerciseTypes,
              path: `chapters/${chapterId}/lessons/${lessonId} (field: blocks)`
            });
            
            results.summary.totalExercisesInLessonBlocks += exerciseBlocks.length;
            exerciseTypes.forEach(t => results.exerciseTypes.add(t));
          }
        } else {
          console.log(`       ⚠️  Pas de blocks dans lesson.blocks`);
        }
        
        // 1b-ii. Vérifier exercises/main dans la lesson
        try {
          const lessonExercisesRef = doc(
            db, 
            'organizations', organizationId, 
            'programs', programId, 
            'chapitres', chapterId, 
            'lessons', lessonId, 
            'exercises', 'main'
          );
          const lessonExercisesSnap = await getDoc(lessonExercisesRef);
          
          if (lessonExercisesSnap.exists()) {
            const exerciseData = lessonExercisesSnap.data();
            const blocks = exerciseData.blocks || [];
            
            if (blocks.length > 0) {
              const types = blocks.map(b => b.type || b.data?.type);
              console.log(`       ✅ TROUVÉ: exercises/main dans LESSON`);
              console.log(`          📊 ${blocks.length} exercices`);
              console.log(`          🏷️  Types: ${types.join(', ')}`);
              
              results.lessonsWithExercisesDoc.push({
                chapterId,
                chapterName: chapterData.title || 'Sans titre',
                lessonId,
                lessonName: lessonData.title || 'Sans titre',
                blocksCount: blocks.length,
                types: types,
                path: `chapters/${chapterId}/lessons/${lessonId}/exercises/main`
              });
              
              results.summary.totalExercisesInLessonDocs += blocks.length;
              types.forEach(t => results.exerciseTypes.add(t));
            }
          } else {
            console.log(`       ⚠️  Pas de exercises/main dans cette lesson`);
          }
        } catch (e) {
          console.log(`       ❌ Erreur lecture exercises/main lesson:`, e.message);
        }
      }
    }
    
    // AFFICHER LE RÉSUMÉ FINAL
    console.log('\n\n');
    console.log('🎯 ========================================');
    console.log('🎯 RÉSUMÉ DE L\'AUDIT');
    console.log('🎯 ========================================\n');
    
    console.log('📊 STATISTIQUES:');
    console.log(`   • Chapitres scannés: ${results.summary.totalModules}`);
    console.log(`   • Lessons scannées: ${results.summary.totalLessons}`);
    console.log(`   • Exercices dans lesson.blocks: ${results.summary.totalExercisesInLessonBlocks}`);
    console.log(`   • Exercices dans lessons/exercises/main: ${results.summary.totalExercisesInLessonDocs}`);
    console.log(`   • Exercices dans chapters/exercises/main: ${results.summary.totalExercisesInModuleDocs}`);
    
    const totalExercises = 
      results.summary.totalExercisesInLessonBlocks + 
      results.summary.totalExercisesInLessonDocs + 
      results.summary.totalExercisesInModuleDocs;
    
    console.log(`   • TOTAL EXERCICES: ${totalExercises}\n`);
    
    console.log('🏷️  TYPES D\'EXERCICES TROUVÉS:');
    const typesArray = Array.from(results.exerciseTypes).filter(t => t);
    typesArray.forEach(type => {
      console.log(`   • ${type}`);
    });
    
    console.log('\n📍 LOCALISATION DES EXERCICES:\n');
    
    if (results.modulesWithExercisesDoc.length > 0) {
      console.log(`✅ ${results.modulesWithExercisesDoc.length} chapters avec exercises/main:`);
      results.modulesWithExercisesDoc.forEach(item => {
        console.log(`   • ${item.chapterName}: ${item.blocksCount} exercices (${item.types.join(', ')})`);
      });
    }
    
    if (results.lessonsWithBlocks.length > 0) {
      console.log(`\n✅ ${results.lessonsWithBlocks.length} lessons avec exercices dans blocks:`);
      results.lessonsWithBlocks.forEach(item => {
        console.log(`   • ${item.chapterName} > ${item.lessonName}: ${item.blocksCount} exercices (${item.types.join(', ')})`);
      });
    }
    
    if (results.lessonsWithExercisesDoc.length > 0) {
      console.log(`\n✅ ${results.lessonsWithExercisesDoc.length} lessons avec exercises/main:`);
      results.lessonsWithExercisesDoc.forEach(item => {
        console.log(`   • ${item.chapterName} > ${item.lessonName}: ${item.blocksCount} exercices (${item.types.join(', ')})`);
      });
    }
    
    console.log('\n📋 DONNÉES COMPLÈTES (pour analyse):');
    console.log(JSON.stringify(results, null, 2));
    
    console.log('\n🎯 ========================================');
    console.log('🎯 AUDIT TERMINÉ');
    console.log('🎯 ========================================\n');
    
    return results;
    
  } catch (error) {
    console.error('❌ ERREUR FATALE LORS DE L\'AUDIT:', error);
    throw error;
  }
}

/**
 * Scanner TOUS les programmes d'une organisation pour trouver ceux avec exercices
 */
export async function findProgramsWithExercises(organizationId) {
  console.log('🔍 ========================================');
  console.log('🔍 RECHERCHE PROGRAMMES AVEC EXERCICES');
  console.log('🔍 ========================================\n');
  console.log(`📍 Organization: ${organizationId}\n`);
  
  try {
    const programsRef = collection(db, 'organizations', organizationId, 'programs');
    const programsSnap = await getDocs(programsRef);
    
    console.log(`📚 ${programsSnap.size} programmes trouvés\n`);
    
    const programsWithExercises = [];
    
    for (const programDoc of programsSnap.docs) {
      const programId = programDoc.id;
      const programData = programDoc.data();
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📘 PROGRAMME: ${programData.title || programId}`);
      console.log(`   ID: ${programId}`);
      console.log(`${'='.repeat(60)}`);
      
      let totalExercises = 0;
      const exerciseTypes = new Set();
      
      // Scanner les chapters
      const modulesRef = collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres');
      const modulesSnap = await getDocs(modulesRef);
      
      for (const chapterDoc of modulesSnap.docs) {
        const chapterId = chapterDoc.id;
        
        // Vérifier exercises/main dans chapitre
        try {
          const moduleExercisesRef = doc(
            db, 'organizations', organizationId, 'programs', programId, 
            'chapitres', chapterId, 'exercises', 'main'
          );
          const moduleExercisesSnap = await getDoc(moduleExercisesRef);
          
          if (moduleExercisesSnap.exists()) {
            const blocks = moduleExercisesSnap.data().blocks || [];
            if (blocks.length > 0) {
              totalExercises += blocks.length;
              blocks.forEach(b => exerciseTypes.add(b.type || b.data?.type));
            }
          }
        } catch (e) {}
        
        // Scanner les lessons
        const lessonsRef = collection(
          db, 'organizations', organizationId, 'programs', programId, 
          'chapitres', chapterId, 'lessons'
        );
        const lessonsSnap = await getDocs(lessonsRef);
        
        for (const lessonDoc of lessonsSnap.docs) {
          const lessonId = lessonDoc.id;
          const lessonData = lessonDoc.data();
          
          // Vérifier blocks dans lesson
          if (lessonData.blocks && Array.isArray(lessonData.blocks)) {
            const exerciseBlocks = lessonData.blocks.filter(b => {
              const type = b.type || b.data?.type;
              return type && !['text', 'separator', 'heading', 'image'].includes(type);
            });
            
            if (exerciseBlocks.length > 0) {
              totalExercises += exerciseBlocks.length;
              exerciseBlocks.forEach(b => exerciseTypes.add(b.type || b.data?.type));
            }
          }
          
          // Vérifier exercises/main dans lesson
          try {
            const lessonExercisesRef = doc(
              db, 'organizations', organizationId, 'programs', programId, 
              'chapitres', chapterId, 'lessons', lessonId, 'exercises', 'main'
            );
            const lessonExercisesSnap = await getDoc(lessonExercisesRef);
            
            if (lessonExercisesSnap.exists()) {
              const blocks = lessonExercisesSnap.data().blocks || [];
              if (blocks.length > 0) {
                totalExercises += blocks.length;
                blocks.forEach(b => exerciseTypes.add(b.type || b.data?.type));
              }
            }
          } catch (e) {}
        }
      }
      
      if (totalExercises > 0) {
        console.log(`✅ ${totalExercises} exercices trouvés`);
        console.log(`🏷️  Types: ${Array.from(exerciseTypes).join(', ')}`);
        
        programsWithExercises.push({
          programId,
          programName: programData.title || 'Sans titre',
          exercisesCount: totalExercises,
          types: Array.from(exerciseTypes)
        });
      } else {
        console.log(`❌ Aucun exercice trouvé`);
      }
    }
    
    console.log('\n\n🎯 ========================================');
    console.log('🎯 RÉSUMÉ');
    console.log('🎯 ========================================\n');
    
    if (programsWithExercises.length > 0) {
      console.log(`✅ ${programsWithExercises.length} programmes avec exercices:\n`);
      programsWithExercises.forEach(prog => {
        console.log(`📘 ${prog.programName}`);
        console.log(`   ID: ${prog.programId}`);
        console.log(`   Exercices: ${prog.exercisesCount}`);
        console.log(`   Types: ${prog.types.join(', ')}\n`);
      });
      
      console.log('💡 Pour auditer un programme spécifique, utilisez:');
      console.log(`   auditExercises("${organizationId}", "PROGRAM_ID")\n`);
    } else {
      console.log('❌ AUCUN programme avec exercices trouvé dans cette organisation !\n');
    }
    
    return programsWithExercises;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Scanner TOUTE la base de données, y compris hors structure multi-tenant
 */
export async function auditEntireDatabase(organizationId) {
  console.log('🔍 ========================================');
  console.log('🔍 AUDIT COMPLET BASE DE DONNÉES');
  console.log('🔍 ========================================\n');
  
  const results = {
    multiTenant: { total: 0, locations: [] },
    nonMultiTenant: { total: 0, locations: [] },
    rootCollections: []
  };
  
  try {
    // 1. SCANNER STRUCTURE MULTI-TENANT (déjà fait)
    console.log('📂 PARTIE 1 : Structure multi-tenant (/organizations/...)');
    console.log('─'.repeat(60));
    
    const orgProgramsRef = collection(db, 'organizations', organizationId, 'programs');
    const orgProgramsSnap = await getDocs(orgProgramsRef);
    
    console.log(`   Found ${orgProgramsSnap.size} programmes dans /organizations/${organizationId}/programs\n`);
    
    for (const programDoc of orgProgramsSnap.docs) {
      const programId = programDoc.id;
      const programData = programDoc.data();
      
      // Scanner chapters/lessons/exercises (comme avant)
      const modulesRef = collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres');
      const modulesSnap = await getDocs(modulesRef);
      
      for (const chapterDoc of modulesSnap.docs) {
        const chapterId = chapterDoc.id;
        
        // Vérifier exercises/main dans le chapitre (structure multi-tenant)
        try {
          const moduleExercisesRef = doc(
            db, 'organizations', organizationId, 'programs', programId, 
            'chapitres', chapterId, 'exercises', 'main'
          );
          const moduleExercisesSnap = await getDoc(moduleExercisesRef);
          
          if (moduleExercisesSnap.exists()) {
            const exerciseData = moduleExercisesSnap.data();
            const blocks = exerciseData.blocks || [];
            
            if (blocks.length > 0) {
              results.multiTenant.total += blocks.length;
              results.multiTenant.locations.push({
                path: `organizations/${organizationId}/programs/${programId}/chapitres/${chapterId}/exercises/main`,
                count: blocks.length,
                program: programData.title || programId
              });
            }
          }
        } catch (e) {
          // Pas d'exercises/main dans ce chapitre
        }
        
        const lessonsRef = collection(db, 'organizations', organizationId, 'programs', programId, 'chapitres', chapterId, 'lessons');
        const lessonsSnap = await getDocs(lessonsRef);
        
        for (const lessonDoc of lessonsSnap.docs) {
          const lessonId = lessonDoc.id;
          const lessonData = lessonDoc.data();
          
          // Blocks dans le document lesson
          if (lessonData.blocks && Array.isArray(lessonData.blocks)) {
            const exerciseBlocks = lessonData.blocks.filter(b => {
              const type = b.type || b.data?.type;
              return type && !['text', 'separator', 'heading', 'image'].includes(type);
            });
            
            if (exerciseBlocks.length > 0) {
              results.multiTenant.total += exerciseBlocks.length;
              results.multiTenant.locations.push({
                path: `organizations/${organizationId}/programs/${programId}/chapitres/${chapterId}/lessons/${lessonId}`,
                count: exerciseBlocks.length,
                program: programData.title || programId
              });
            }
          }
          
          // exercises/main dans la lesson (structure multi-tenant)
          try {
            const lessonExercisesRef = doc(
              db, 'organizations', organizationId, 'programs', programId, 
              'chapitres', chapterId, 'lessons', lessonId, 'exercises', 'main'
            );
            const lessonExercisesSnap = await getDoc(lessonExercisesRef);
            
            if (lessonExercisesSnap.exists()) {
              const blocks = lessonExercisesSnap.data().blocks || [];
              if (blocks.length > 0) {
                results.multiTenant.total += blocks.length;
                results.multiTenant.locations.push({
                  path: `organizations/${organizationId}/programs/${programId}/chapitres/${chapterId}/lessons/${lessonId}/exercises/main`,
                  count: blocks.length,
                  program: programData.title || programId
                });
              }
            }
          } catch (e) {
            // Pas d'exercises/main dans cette lesson
          }
        }
      }
    }
    
    console.log(`✅ Multi-tenant: ${results.multiTenant.total} exercices trouvés\n`);
    
    // 2. SCANNER STRUCTURE NON MULTI-TENANT (/programs directement)
    console.log('📂 PARTIE 2 : Structure NON multi-tenant (/programs/...)');
    console.log('─'.repeat(60));
    
    const rootProgramsRef = collection(db, 'programs');
    const rootProgramsSnap = await getDocs(rootProgramsRef);
    
    console.log(`   Found ${rootProgramsSnap.size} programmes dans /programs\n`);
    
    for (const programDoc of rootProgramsSnap.docs) {
      const programId = programDoc.id;
      const programData = programDoc.data();
      
      console.log(`   📘 Programme: ${programData.title || programId}`);
      
      const modulesRef = collection(db, 'programs', programId, 'chapitres');
      const modulesSnap = await getDocs(modulesRef);
      
      for (const chapterDoc of modulesSnap.docs) {
        const chapterId = chapterDoc.id;
        
        // Vérifier exercises/main dans chapitre
        try {
          const moduleExercisesRef = doc(db, 'programs', programId, 'chapitres', chapterId, 'exercises', 'main');
          const moduleExercisesSnap = await getDoc(moduleExercisesRef);
          
          if (moduleExercisesSnap.exists()) {
            const blocks = moduleExercisesSnap.data().blocks || [];
            if (blocks.length > 0) {
              console.log(`      ✅ ${blocks.length} exercices dans chapters/${chapterId}/exercises/main`);
              results.nonMultiTenant.total += blocks.length;
              results.nonMultiTenant.locations.push({
                path: `programs/${programId}/chapitres/${chapterId}/exercises/main`,
                count: blocks.length,
                program: programData.title || programId
              });
            }
          }
        } catch (e) {}
        
        // Scanner lessons
        const lessonsRef = collection(db, 'programs', programId, 'chapitres', chapterId, 'lessons');
        const lessonsSnap = await getDocs(lessonsRef);
        
        for (const lessonDoc of lessonsSnap.docs) {
          const lessonId = lessonDoc.id;
          const lessonData = lessonDoc.data();
          
          // Blocks dans lesson
          if (lessonData.blocks && Array.isArray(lessonData.blocks)) {
            const exerciseBlocks = lessonData.blocks.filter(b => {
              const type = b.type || b.data?.type;
              return type && !['text', 'separator', 'heading', 'image'].includes(type);
            });
            
            if (exerciseBlocks.length > 0) {
              console.log(`      ✅ ${exerciseBlocks.length} exercices dans lessons/${lessonId}.blocks`);
              results.nonMultiTenant.total += exerciseBlocks.length;
              results.nonMultiTenant.locations.push({
                path: `programs/${programId}/chapitres/${chapterId}/lessons/${lessonId}`,
                count: exerciseBlocks.length,
                program: programData.title || programId
              });
            }
          }
          
          // exercises/main dans lesson
          try {
            const lessonExercisesRef = doc(db, 'programs', programId, 'chapitres', chapterId, 'lessons', lessonId, 'exercises', 'main');
            const lessonExercisesSnap = await getDoc(lessonExercisesRef);
            
            if (lessonExercisesSnap.exists()) {
              const blocks = lessonExercisesSnap.data().blocks || [];
              if (blocks.length > 0) {
                console.log(`      ✅ ${blocks.length} exercices dans lessons/${lessonId}/exercises/main`);
                results.nonMultiTenant.total += blocks.length;
                results.nonMultiTenant.locations.push({
                  path: `programs/${programId}/chapitres/${chapterId}/lessons/${lessonId}/exercises/main`,
                  count: blocks.length,
                  program: programData.title || programId
                });
              }
            }
          } catch (e) {}
        }
      }
    }
    
    console.log(`\n✅ Non multi-tenant: ${results.nonMultiTenant.total} exercices trouvés\n`);
    
    // 3. COLLECTIONS RACINE
    console.log('📂 PARTIE 3 : Collections à la racine');
    console.log('─'.repeat(60));
    
    // Scanner /exercises
    try {
      const exercisesRootRef = collection(db, 'exercises');
      const exercisesRootSnap = await getDocs(exercisesRootRef);
      
      if (!exercisesRootSnap.empty) {
        console.log(`   ✅ Collection /exercises trouvée: ${exercisesRootSnap.size} documents`);
        results.rootCollections.push({ collection: 'exercises', count: exercisesRootSnap.size });
      }
    } catch (e) {
      console.log('   ⚠️ Pas de collection /exercises');
    }
    
    // Scanner /quizAttempts
    try {
      const quizAttemptsRef = collection(db, 'quizAttempts');
      const quizAttemptsSnap = await getDocs(quizAttemptsRef);
      
      if (!quizAttemptsSnap.empty) {
        console.log(`   ✅ Collection /quizAttempts trouvée: ${quizAttemptsSnap.size} documents`);
        results.rootCollections.push({ collection: 'quizAttempts', count: quizAttemptsSnap.size });
      }
    } catch (e) {
      console.log('   ⚠️ Pas de collection /quizAttempts');
    }
    
    // RÉSUMÉ FINAL
    console.log('\n\n🎯 ========================================');
    console.log('🎯 RÉSUMÉ COMPLET');
    console.log('🎯 ========================================\n');
    
    const grandTotal = results.multiTenant.total + results.nonMultiTenant.total;
    
    console.log(`📊 TOTAL EXERCICES TROUVÉS: ${grandTotal}\n`);
    console.log(`   • Structure multi-tenant: ${results.multiTenant.total}`);
    console.log(`   • Structure NON multi-tenant: ${results.nonMultiTenant.total}\n`);
    
    if (results.multiTenant.locations.length > 0) {
      console.log('📍 EXERCICES MULTI-TENANT:');
      results.multiTenant.locations.forEach(loc => {
        console.log(`   • ${loc.program}: ${loc.count} exercices`);
        console.log(`     ${loc.path}`);
      });
      console.log('');
    }
    
    if (results.nonMultiTenant.locations.length > 0) {
      console.log('📍 EXERCICES NON MULTI-TENANT:');
      results.nonMultiTenant.locations.forEach(loc => {
        console.log(`   • ${loc.program}: ${loc.count} exercices`);
        console.log(`     ${loc.path}`);
      });
      console.log('');
    }
    
    if (results.rootCollections.length > 0) {
      console.log('📦 COLLECTIONS RACINE:');
      results.rootCollections.forEach(col => {
        console.log(`   • /${col.collection}: ${col.count} documents`);
      });
    }
    
    console.log('\n📋 Données JSON:', JSON.stringify(results, null, 2));
    
    return results;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Fonctions helper pour lancer facilement depuis la console
window.auditExercises = auditExercises;
window.findProgramsWithExercises = findProgramsWithExercises;
window.auditEntireDatabase = auditEntireDatabase;
console.log('✅ Script d\'audit chargé. Usage: auditExercises("orgId", "programId")');
