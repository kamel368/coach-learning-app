import { useState, useMemo } from 'react';

export default function MatchPairsExercise({ block, answer, onAnswer }) {
  const { content } = block;
  const pairs = content.pairs || [];
  
  const [matches, setMatches] = useState(answer || {});
  const [selectedLeft, setSelectedLeft] = useState(null);
  
  // useMemo pour garantir que shuffledRight ne change JAMAIS
  const shuffledRight = useMemo(() => {
    const indices = pairs.map((_, i) => i);
    
    // Fisher-Yates shuffle pour mélange vraiment aléatoire
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return indices;
  }, [pairs.length]); // Ne recalcule que si le nombre de paires change

  const handleLeftClick = (leftIndex) => {
    if (selectedLeft === leftIndex) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftIndex);
    }
  };

  const handleRightClick = (rightIndex) => {
    if (selectedLeft !== null) {
      // Créer ou retirer le match
      const newMatches = { ...matches };
      
      if (newMatches[selectedLeft] === rightIndex) {
        // Si déjà matché, retirer
        delete newMatches[selectedLeft];
      } else {
        // Sinon, créer le match
        newMatches[selectedLeft] = rightIndex;
      }
      
      setMatches(newMatches);
      onAnswer(newMatches);
      setSelectedLeft(null);
    }
  };

  const removeMatch = (leftIndex) => {
    const newMatches = { ...matches };
    delete newMatches[leftIndex];
    setMatches(newMatches);
    onAnswer(newMatches);
  };

  const matchedRightIndices = Object.values(matches);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Alert */}
      <div style={{
        padding: '12px 16px',
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#92400e'
      }}>
        💡 <strong>Mode d'emploi :</strong> {content.question || 'Clique sur un élément de gauche, puis sur son correspondant à droite.'}
      </div>

      {/* Grille de paires */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth >= 768 ? '1fr auto 1fr' : '1fr',
        gap: '16px',
        alignItems: 'start'
      }}>
        {/* Colonne GAUCHE */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#64748b',
            marginBottom: '4px'
          }}>
            Colonne A
          </h3>

          {pairs.map((pair, leftIndex) => {
            const isMatched = matches[leftIndex] !== undefined;
            const isSelected = selectedLeft === leftIndex;
            
            return (
              <div key={leftIndex} style={{ position: 'relative' }}>
                <button
                  onClick={() => handleLeftClick(leftIndex)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: isMatched 
                      ? '#d1fae5' 
                      : isSelected 
                      ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                      : 'white',
                    border: '2px solid',
                    borderColor: isMatched ? '#10b981' : isSelected ? '#3b82f6' : '#e2e8f0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isSelected ? 'white' : '#1e293b',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  {pair.left}
                  {isMatched && (
                    <span style={{
                      marginLeft: '8px',
                      color: '#10b981'
                    }}>
                      ✓
                    </span>
                  )}
                </button>

                {isMatched && (
                  <button
                    onClick={() => removeMatch(leftIndex)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      padding: '4px 8px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✗
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Séparateur (desktop uniquement) */}
        {window.innerWidth >= 768 && (
          <div style={{
            width: '2px',
            height: '100%',
            background: '#e2e8f0',
            alignSelf: 'stretch'
          }} />
        )}

        {/* Colonne DROITE (MÉLANGÉE) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#64748b',
            marginBottom: '4px'
          }}>
            Colonne B
          </h3>

          {shuffledRight.map((originalIndex, position) => {
            const pair = pairs[originalIndex];
            const isMatched = matchedRightIndices.includes(originalIndex);
            const willMatch = selectedLeft !== null && matches[selectedLeft] === originalIndex;
            
            return (
              <button
                key={position}
                onClick={() => handleRightClick(originalIndex)}
                disabled={isMatched && !willMatch}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: isMatched 
                    ? '#f1f5f9' 
                    : willMatch
                    ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                    : 'white',
                  border: '2px solid',
                  borderColor: isMatched ? '#e2e8f0' : willMatch ? '#8b5cf6' : '#e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isMatched ? '#cbd5e1' : willMatch ? 'white' : '#1e293b',
                  cursor: (isMatched && !willMatch) ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  opacity: (isMatched && !willMatch) ? 0.6 : 1
                }}
              >
                {pair.right}
                {isMatched && (
                  <span style={{
                    marginLeft: '8px',
                    color: '#10b981'
                  }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compteur */}
      <div style={{
        padding: '12px 16px',
        background: Object.keys(matches).length === pairs.length ? '#d1fae5' : '#f1f5f9',
        border: '1px solid',
        borderColor: Object.keys(matches).length === pairs.length ? '#10b981' : '#e2e8f0',
        borderRadius: '8px',
        fontSize: '14px',
        color: Object.keys(matches).length === pairs.length ? '#065f46' : '#64748b',
        textAlign: 'center',
        fontWeight: '600'
      }}>
        {Object.keys(matches).length}/{pairs.length} paire(s) reliée(s)
        {Object.keys(matches).length === pairs.length && ' ✓'}
      </div>
    </div>
  );
}
