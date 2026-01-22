import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Hook pour gérer le mode "Voir comme" dans les pages apprenant
 * Permet à un admin de visualiser le compte d'un apprenant
 */
export const useViewAs = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Récupérer l'ID de l'utilisateur à visualiser (depuis URL ou localStorage)
  const viewAsUserId = searchParams.get('viewAs') || localStorage.getItem('viewAsUserId');
  
  // Vérifier si on est en mode "Voir comme"
  const isViewingAs = !!viewAsUserId && viewAsUserId !== user?.uid;
  
  // L'ID à utiliser pour charger les données (apprenant visualisé ou utilisateur connecté)
  const targetUserId = isViewingAs ? viewAsUserId : user?.uid;
  
  // Informations de l'apprenant visualisé
  const viewAsUserName = localStorage.getItem('viewAsUserName') || '';
  const viewAsUserEmail = localStorage.getItem('viewAsUserEmail') || '';
  
  /**
   * Nettoie les données du mode "Voir comme" du localStorage
   */
  const clearViewAs = () => {
    localStorage.removeItem('viewAsUserId');
    localStorage.removeItem('viewAsUserName');
    localStorage.removeItem('viewAsUserEmail');
  };
  
  return {
    isViewingAs,
    targetUserId,
    viewAsUserName,
    viewAsUserEmail,
    clearViewAs
  };
};

export default useViewAs;
