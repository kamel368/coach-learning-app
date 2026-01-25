import React from 'react';
import { motion } from 'framer-motion';

/**
 * Composant pour afficher un exercice de type "text"
 * Affiche du contenu HTML théorique/informatif
 */
export default function TextExercise({ block, answer, onAnswer }) {
  // Marquer automatiquement comme "lu" après 2 secondes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!answer) {
        onAnswer({ read: true, timestamp: Date.now() });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [answer, onAnswer]);

  // Extraire le contenu HTML
  const htmlContent = block.content?.html || block.html || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Contenu HTML */}
      {htmlContent ? (
        <div 
          className="prose prose-lg max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      ) : (
        <p className="text-gray-500 italic">Contenu non disponible</p>
      )}

      {/* Indicateur de lecture */}
      {answer?.read && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-green-600 text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Contenu lu</span>
        </motion.div>
      )}
    </motion.div>
  );
}
