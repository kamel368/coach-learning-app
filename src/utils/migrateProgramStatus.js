import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Migre tous les programmes de status → published
 * À exécuter UNE SEULE FOIS depuis la console
 */
export async function migrateProgramStatus(organizationId) {
  try {
    console.log('🔄 Migration status → published...');
    
    const programsRef = organizationId
      ? collection(db, 'organizations', organizationId, 'programs')
      : collection(db, 'programs');
    
    const snapshot = await getDocs(programsRef);
    let migrated = 0;
    
    for (const programDoc of snapshot.docs) {
      const data = programDoc.data();
      
      // Si déjà migré, skip
      if (data.published !== undefined) {
        console.log(`⏭️ ${programDoc.id} déjà migré`);
        continue;
      }
      
      // Convertir status → published
      const published = data.status === 'published';
      
      const ref = organizationId
        ? doc(db, 'organizations', organizationId, 'programs', programDoc.id)
        : doc(db, 'programs', programDoc.id);
      
      await updateDoc(ref, {
        published: published,
        // Garder status pour historique
        legacyStatus: data.status
      });
      
      migrated++;
      console.log(`✅ ${programDoc.id}: status="${data.status}" → published=${published}`);
    }
    
    console.log(`✅ Migration terminée: ${migrated} programmes migrés sur ${snapshot.size}`);
    return { success: true, migrated };
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    return { success: false, error };
  }
}

// Export pour utilisation dans console
if (typeof window !== 'undefined') {
  window.migrateProgramStatus = migrateProgramStatus;
}
