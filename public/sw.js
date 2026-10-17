// Ourlette Service Worker — PWA & Mode Hors Ligne (v3)
const CACHE_NAME = 'ourlette-pwa-v3';

// Assets de base pré-mis en cache à l'installation
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
  '/fonts/Violense.woff',
];

// ── 1. Install Event — Mise en cache initiale & activation immédiate ──────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        await Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('[SW] Pré-cache ignoré pour', url, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── 2. Activate Event — Nettoyage radical des anciens caches (v1, v2) ─────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.info('[SW] Suppression de l\'ancien cache obsolète :', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ── 3. Fetch Event — Gestion réseau résiliente & Cache transparent ────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignorer les protocoles non-HTTP (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Ne JAMAIS intercepter les routes d'administration, API et auth serveur
  if (
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/pro/confirmation')
  ) {
    return;
  }

  // Ne pas intercepter les requêtes directes vers Supabase, SasPay ou PowerSync Cloud
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.in') ||
    url.hostname.includes('powersync') ||
    url.hostname.includes('saspay.me')
  ) {
    return;
  }

  // ── A. Assets Statiques Next.js, Polices, Images (Cache-First / Stale-While-Revalidate) ──
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/images/') ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    /\.(woff|woff2|ttf|eot|svg|png|jpg|jpeg|webp|ico|css|js|wasm)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidation silencieuse en arrière-plan
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse || new Response('', { status: 404 }));
      })
    );
    return;
  }

  // ── B. Navigation HTML (Pages de bord & publiques) ──────────────────────────
  // Stratégie : Network-First avec sauvegarde automatique en cache et restitution transparente hors-ligne
  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              cache.put(url.pathname, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // 1. Chercher la page exacte demandée dans le cache
          const exactMatch = await caches.match(request);
          if (exactMatch) return exactMatch;

          const pathMatch = await caches.match(url.pathname, { ignoreSearch: true });
          if (pathMatch) return pathMatch;

          // 2. Si non trouvée, chercher une page de secours du dashboard déjà en cache
          const dashboardFallback =
            (await caches.match('/commandes')) ||
            (await caches.match('/clients')) ||
            (await caches.match('/'));

          if (dashboardFallback) return dashboardFallback;

          // 3. Fallback d'urgence épuré (ne casse pas Next.js)
          return new Response(
            `<!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Ourlette</title>
              <style>
                body { font-family: sans-serif; background: #FAFAF8; color: #2B1215; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }
                .box { background: white; border: 1px solid #E5C0C4; border-radius: 20px; padding: 32px 24px; max-width: 400px; box-shadow: 0 4px 12px rgba(43,18,21,0.06); }
                h1 { font-size: 20px; margin-bottom: 8px; color: #2B1215; }
                p { font-size: 14px; color: #5F1C25; opacity: 0.8; margin-bottom: 20px; }
                button { background: #AC0C21; color: white; border: none; padding: 12px 24px; border-radius: 9999px; font-weight: bold; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="box">
                <h1>Connexion en attente</h1>
                <p>Vos données sont conservées sur votre appareil. Reconnectez-vous ou réessayez dans un instant.</p>
                <button onclick="window.location.reload()">Recharger la page</button>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
          );
        })
    );
    return;
  }

  // ── C. Next.js RSC (React Server Components payload ?_rsc=...) ──────────────
  // Quand hors-ligne, ne JAMAIS renvoyer une erreur 503 qui fait crasher Next.js !
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const pathCached = await caches.match(url.pathname, { ignoreSearch: true });
        if (pathCached) return pathCached;

        // Renvoyer une réponse vide 200 plutôt qu'un 503 fatal
        return new Response('', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});

// ── 4. Message Event — Réinitialisation de cache lors de la déconnexion ────────
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'CLEAR_USER_CACHE' || event.data.action === 'LOGOUT')) {
    caches.delete(CACHE_NAME).then(() => {
      console.info('[SW] Cache PWA réinitialisé suite à la déconnexion.');
    });
  }
});
