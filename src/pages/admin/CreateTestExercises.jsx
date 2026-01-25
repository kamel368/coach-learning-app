import React, { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

export default function CreateTestExercises() {
  const { organizationId } = useAuth();
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // IDs à utiliser
  const programId = 'e55HwUF8cAYmdSOblYtn';
  const chapterId = 'dSKMwP7lmrIjUrXqoEdg'; // Chapitre "La regelementation"
  const lessonId = 'HLYem5oT1mLPvJSqZRZq'; // Lesson "L'amplitude"

  const handleCreateTestExercises = async () => {
    console.log('🧪 Création des exercices de test...');
    setCreating(true);
    setSuccess(false);
    
    try {
      const lessonRef = doc(
        db,
        'organizations', organizationId,
        'programs', programId,
        'chapitres', chapterId,
        'lessons', lessonId
      );

      // Récupérer la lesson actuelle
      const lessonSnap = await getDoc(lessonRef);
      if (!lessonSnap.exists()) {
        throw new Error('Lesson non trouvée');
      }

      const lessonData = lessonSnap.data();
      const currentBlocks = lessonData.blocks || [];

      console.log('📚 Blocks actuels:', currentBlocks.length);

      // Créer 3 nouveaux exercices
      const timestamp = Date.now();
      
      const testExercises = [
        // QCM
        {
          type: 'qcm',
          order: currentBlocks.length + 1,
          data: {
            id: `test_qcm_${timestamp}`,
            html: '<p><strong>Question 1 :</strong> Quelle est la durée maximale de travail par jour en France ?</p>',
            isSaved: true
          },
          content: {
            question: 'Quelle est la durée maximale de travail par jour en France ?',
            options: ['8 heures', '10 heures', '12 heures', '14 heures'],
            correctIndex: 1,
            explanation: 'La durée maximale de travail effectif est de 10 heures par jour.'
          },
          points: 5
        },
        // Vrai/Faux
        {
          type: 'true_false',
          order: currentBlocks.length + 2,
          data: {
            id: `test_tf_${timestamp}`,
            html: '<p><strong>Question 2 :</strong> Un salarié peut refuser de faire des heures supplémentaires.</p>',
            isSaved: true
          },
          content: {
            statement: 'Un salarié peut refuser de faire des heures supplémentaires.',
            correct: true,
            explanation: 'Dans certains cas justifiés, un salarié peut refuser les heures supplémentaires (contraintes familiales, etc.).'
          },
          points: 3
        },
        // Flashcard
        {
          type: 'flashcard',
          order: currentBlocks.length + 3,
          data: {
            id: `test_flash_${timestamp}`,
            html: '<p><strong>Question 3 :</strong> Combien de jours de congés payés légaux minimum par an ?</p>',
            isSaved: true
          },
          content: {
            question: 'Combien de jours de congés payés légaux minimum par an ?',
            answer: '30 jours ouvrables (ou 25 jours ouvrés)',
            hint: 'Environ 5 semaines'
          },
          points: 2
        }
      ];

      // Créer le nouveau tableau de blocks
      const newBlocks = [...currentBlocks, ...testExercises];

      // Mettre à jour la lesson
      await updateDoc(lessonRef, {
        blocks: newBlocks,
        updatedAt: new Date()
      });

      console.log('✅ Exercices créés avec succès !');
      console.log('📊 Nouveau total de blocks:', newBlocks.length);
      console.log('🎯 Exercices ajoutés:', testExercises);

      setSuccess(true);
      alert('✅ 3 exercices de test créés avec succès !\n\nTu peux maintenant tester l\'évaluation du programme.');
      
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      alert(`❌ Erreur : ${error.message}\n\nConsulte la console pour plus de détails.`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Retour
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Créer exercices de test
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Ajouter 3 exercices de test
            </h2>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">
                <strong>📍 Destination :</strong>
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Organisation : {organizationId || 'Non définie'}</li>
                <li>• Programme : e55HwUF8cAYmdSOblYtn</li>
                <li>• Chapitre : La regelementation (dSKMwP7lmrIjUrXqoEdg)</li>
                <li>• Lesson : L'amplitude (HLYem5oT1mLPvJSqZRZq)</li>
              </ul>
            </div>

            <p className="text-gray-600 mb-4">
              <strong>Les 3 exercices qui seront créés :</strong>
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <strong className="text-blue-600">QCM (5 points)</strong>
                  <p className="text-sm text-gray-600">Durée maximale de travail par jour</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <strong className="text-green-600">Vrai/Faux (3 points)</strong>
                  <p className="text-sm text-gray-600">Refus des heures supplémentaires</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🃏</span>
                <div>
                  <strong className="text-purple-600">Flashcard (2 points)</strong>
                  <p className="text-sm text-gray-600">Jours de congés payés</p>
                </div>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                💡 <strong>Total :</strong> 10 points disponibles pour l'évaluation
              </p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400">
              <p className="text-green-800 font-medium">
                ✅ Exercices créés avec succès !
              </p>
              <p className="text-sm text-green-700 mt-1">
                Tu peux maintenant tester l'évaluation du programme.
              </p>
            </div>
          )}

          <button
            onClick={handleCreateTestExercises}
            disabled={creating || success}
            className={`w-full px-6 py-4 rounded-lg font-medium text-lg transition-all ${
              creating || success
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {creating ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Création en cours...
              </>
            ) : success ? (
              <>
                ✅ Exercices créés !
              </>
            ) : (
              <>
                🧪 Créer les exercices de test
              </>
            )}
          </button>

          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important :</strong> Les exercices seront ajoutés aux blocks existants de la lesson.
              <br />
              Cette action ne peut pas être annulée facilement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
