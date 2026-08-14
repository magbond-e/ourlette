'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { DataService } from '@/lib/services/dataService';

export default function PwaRegister() {
  const { user } = useAuth();

  useEffect(() => {
    // 1. Enregistrement sécurisé du Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          // Vérifier les mises à jour du service worker
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.info('[PWA] Nouvelle version disponible en cache.');
                }
              });
            }
          });

          console.info('[PWA] Service Worker actif (scope:', registration.scope, ')');
        } catch (err) {
          console.warn('[PWA] Échec de l\'enregistrement du Service Worker :', err);
        }
      };

      // Si le document a déjà fini de charger, on enregistre immédiatement
      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker, { once: true });
      }
    }

    // 2. Détection du retour du réseau & déclenchement de la synchronisation automatique
    const handleOnline = () => {
      if (user?.id) {
        console.info('[PWA] Réseau rétabli : synchronisation des données locales vers Supabase…');
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
