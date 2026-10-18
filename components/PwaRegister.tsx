'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { DataService } from '@/lib/services/dataService';

export default function PwaRegister() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 1. Enregistrement sécurisé du Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          // Forcer la vérification immédiate de mise à jour (purge ancien cache)
          registration.update().catch(() => {});

          // Vérifier les mises à jour du service worker
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.info('[PWA] Nouvelle version v8 disponible en cache.');
                }
              });
            }
          });

          console.info('[PWA] Service Worker actif (scope:', registration.scope, ')');
        } catch (err) {
          console.warn('[PWA] Échec de l\'enregistrement du Service Worker :', err);
        }
      };

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

    // 3. Pré-chargement proactif complet de TOUTES les sections du dashboard dans le cache
    let warmTimer: NodeJS.Timeout | null = null;
    const isDashboard =
      typeof window !== 'undefined' &&
      window.location.pathname !== '/' &&
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/signup');

    if (isDashboard && typeof window !== 'undefined' && 'caches' in window && navigator.onLine) {
      warmTimer = setTimeout(async () => {
        const routes = [
          '/commandes',
          '/commandes/nouvelle',
          '/clients',
          '/vitrine/gerer',
          '/parametres',
        ];

        // A. Next.js router prefetch
        routes.forEach((r) => {
          try {
            router.prefetch(r);
          } catch {}
        });

        // B. Télécharger et stocker uniquement le HTML pur et les scripts statiques
        try {
          const cache = await caches.open('ourlette-pwa-v8');
          await Promise.allSettled(
            routes.map(async (route) => {
              try {
                // 1. Pré-cache HTML document pur
                const htmlRes = await fetch(route, {
                  headers: { Accept: 'text/html' },
                  credentials: 'include',
                });
                if (htmlRes && htmlRes.status === 200) {
                  const htmlText = await htmlRes.text();
                  // S'assurer que le contenu retourné est bien une page HTML complète
                  if (htmlText.includes('<html') || htmlText.includes('<!DOCTYPE')) {
                    const cleanHtml = new Response(htmlText, {
                      status: 200,
                      headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': 'public, max-age=31536000',
                      },
                    });
                    await cache.put(route, cleanHtml.clone());
                    await cache.put(window.location.origin + route, cleanHtml);

                    // 2. Extraire et pré-télécharger les bundles JS & CSS découverts dans le HTML
                    const matches = Array.from(
                      htmlText.matchAll(/(\/_next\/static\/[a-zA-Z0-9_\-\.\/]+?\.(?:js|css))/g)
                    );
                    const staticUrls = Array.from(new Set(matches.map((m) => m[1])));
                    await Promise.allSettled(
                      staticUrls.map(async (assetUrl) => {
                        const existing = await cache.match(assetUrl);
                        if (!existing) {
                          const assetRes = await fetch(assetUrl);
                          if (assetRes && assetRes.status === 200) {
                            await cache.put(assetUrl, assetRes);
                          }
                        }
                      })
                    );
                  }
                }
              } catch (err) {
                console.debug('[PWA] Pré-cache route', route, 'ignoré:', err);
              }
            })
          );
          console.info('[PWA] Les 5 sections du dashboard (HTML + scripts) sont synchronisées hors ligne.');
        } catch (e) {
          console.debug('[PWA] Pré-cache global différé:', e);
        }
      }, 300);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      if (warmTimer) clearTimeout(warmTimer);
    };
  }, [user?.id, router]);

  return null;
}
