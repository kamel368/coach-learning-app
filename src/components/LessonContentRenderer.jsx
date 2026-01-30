import React from 'react';

/**
 * Composant pour afficher le contenu d'une leçon (editor_data JSON)
 * Structure attendue : { blocks: [{ type: "paragraph", data: { text: "..." } }, ...] }
 */
export default function LessonContentRenderer({ editorData }) {
  if (!editorData) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: 'center', 
        color: '#999' 
      }}>
        Aucun contenu disponible pour cette leçon.
      </div>
    );
  }

  // Parser le JSON si c'est une string
  let content = editorData;
  if (typeof editorData === 'string') {
    try {
      content = JSON.parse(editorData);
    } catch (error) {
      console.error('Erreur parsing editor_data:', error);
      return (
        <div style={{ 
          padding: 40, 
          textAlign: 'center', 
          color: '#e74c3c' 
        }}>
          Erreur de chargement du contenu.
        </div>
      );
    }
  }

  // Vérifier la structure
  const blocks = content?.blocks || [];

  if (blocks.length === 0) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: 'center', 
        color: '#999' 
      }}>
        Cette leçon ne contient pas encore de contenu.
      </div>
    );
  }

  // Render chaque bloc
  return (
    <div style={{ 
      maxWidth: 800, 
      margin: '0 auto',
      fontSize: 16,
      lineHeight: 1.8,
      color: '#333'
    }}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <p 
                key={index}
                style={{ 
                  marginBottom: 16,
                  textAlign: 'justify'
                }}
                dangerouslySetInnerHTML={{ __html: block.data?.text || '' }}
              />
            );

          case 'header':
            const HeaderTag = `h${block.data?.level || 2}`;
            return React.createElement(
              HeaderTag,
              {
                key: index,
                style: {
                  marginTop: 32,
                  marginBottom: 16,
                  fontWeight: 700,
                  color: '#1a1a1a'
                }
              },
              block.data?.text || ''
            );

          case 'list':
            const ListTag = block.data?.style === 'ordered' ? 'ol' : 'ul';
            return React.createElement(
              ListTag,
              {
                key: index,
                style: {
                  marginBottom: 16,
                  paddingLeft: 24
                }
              },
              (block.data?.items || []).map((item, i) => (
                <li 
                  key={i} 
                  style={{ marginBottom: 8 }}
                  dangerouslySetInnerHTML={{ __html: item }}
                />
              ))
            );

          case 'quote':
            return (
              <blockquote
                key={index}
                style={{
                  borderLeft: '4px solid #3b82f6',
                  paddingLeft: 16,
                  marginLeft: 0,
                  marginBottom: 16,
                  fontStyle: 'italic',
                  color: '#666'
                }}
                dangerouslySetInnerHTML={{ __html: block.data?.text || '' }}
              />
            );

          case 'code':
            return (
              <pre
                key={index}
                style={{
                  background: '#f5f7fa',
                  padding: 16,
                  borderRadius: 8,
                  overflow: 'auto',
                  marginBottom: 16,
                  fontSize: 14
                }}
              >
                <code>{block.data?.code || ''}</code>
              </pre>
            );

          case 'image':
            return (
              <div
                key={index}
                style={{
                  marginBottom: 24,
                  textAlign: 'center'
                }}
              >
                <img
                  src={block.data?.file?.url || ''}
                  alt={block.data?.caption || ''}
                  style={{
                    maxWidth: '100%',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                {block.data?.caption && (
                  <div style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    {block.data.caption}
                  </div>
                )}
              </div>
            );

          case 'delimiter':
            return (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  margin: '32px 0',
                  color: '#999'
                }}
              >
                * * *
              </div>
            );

          default:
            // Type de bloc non supporté, afficher le JSON brut pour debug
            console.warn('Type de bloc non supporté:', block.type);
            return (
              <div
                key={index}
                style={{
                  background: '#fff3cd',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: '#856404'
                }}
              >
                Type de bloc non supporté : {block.type}
                <pre style={{ marginTop: 8, fontSize: 11 }}>
                  {JSON.stringify(block.data, null, 2)}
                </pre>
              </div>
            );
        }
      })}
    </div>
  );
}
