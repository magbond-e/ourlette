'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { DataService } from '@/lib/services/dataService';

export default function PwaRegister() {
  const { user } = useAuth();

  useEffect(() => {
    // 1. Enregistrement du Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW enregistré avec succès dans le scope:', registration.scope);
          })
          .catch((err) => {
            console.warn('Échec de l\'enregistrement du SW:', err);
          });
      });
    }

    // 2. Détection du retour du réseau & déclenchement de la synchronisation automatique
    const handleOnline = () => {
      if (user?.id) {
        console.log('Réseau rétabli : déclenchement de la synchronisation des données en attente...');
        DataService.syncPendingQueue(user.id);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user?.id]);

  return null;
}
