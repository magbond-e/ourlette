// Ourlette Service Worker — Mode Hors Ligne & PWA (Cache-First Assets & Network-First Pages)
const CACHE_NAME = 'ourlette-pwa-v2';

const PRECACHE_ASSETS = [
  '/',
  '/commandes',
  '/clients',
  '/vitrine/gerer',
  '/parametres',
  '/offline',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
  '/fonts/Violense.woff'
];

// Fallback HTML au cas où aucun cache HTML n'est encore disponible
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mode Hors Ligne — Ourlette</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #F9E7E9;
      color: #2B1215;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(43, 18, 21, 0.08);
      border: 1px solid #E5C0C4;
    }
    h1 {
      font-size: 22px;
      margin: 16px 0 8px;
      color: #2B1215;
    }
    p {
      font-size: 14px;
      line-height: 1.5;
      color: rgba(43, 18, 21, 0.7);
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 12px;
      background-color: #AC0C21;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      box-sizing: border-box;
      transition: background 0.2s;
    }
    .btn:hover {
      background-color: #8E091A;
    }
    .links {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
      text-align: left;
    }
    .link-item {
      display: block;
      padding: 10px 14px;
      background: #FFF3F4;
      border: 1px solid #E5C0C4;
      border-radius: 8px;
      color: #2B1215;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }
    .link-item:hover {
      background: #F9E7E9;
    }
  </style>
</head>
<body>
  <div class="card">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#AC0C21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto;">
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
      <line x1="12" y1="20" x2="12.01" y2="20"></line>
    </svg>
    <h1>Mode Hors Ligne</h1>
    <p>Vous êtes hors connexion. Accédez à vos sections locales sauvegardées :</p>
    <div class="links">
      <a href="/commandes" class="link-item">📋 Commandes en cours</a>
      <a href="/clients" class="link-item">👥 Clients & Mesures</a>
      <a href="/parametres" class="link-item">⚙️ Paramètres Atelier</a>
    </div>
    <button class="btn" onclick="window.location.reload()">Réessayer la connexion</button>
  </div>
</body>
</html>`;

// ── 1. Install Event — Pré-cache sécurisé (Promise.allSettled) ──────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Utilisation d'un pré-cache résilient : une URL inaccessible ne bloque pas les autres
      await Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Pré-cache avertissement pour', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── 2. Activate Event — Nettoyage des anciens caches & prise de contrôle imméd. ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.info('[SW] Nettoyage ancien cache :', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ── 3. Fetch Event — Stratégies de cache avancées ────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP (extensions, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Ignorer les appels API backend / WebSockets externes (Supabase, PowerSync Cloud)
  // PowerSync et Supabase gèrent leur propre persistance locale (SQLite / LocalStorage)
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('powersync')
  ) {
    return;
  }

  // ── A. Assets Statiques Next.js & Fichiers Publics (Cache-First / Stale-While-Revalidate) ──
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
        // Si présent dans le cache, on retourne immédiatement
        if (cachedResponse) {
          // Revalidation en tâche de fond pour mettre à jour si le réseau est disponible
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {
              // Réseau inaccessible — ignoré silencieusement car on a déjà le cache
            });
          return cachedResponse;
        }

        // Sinon, on va chercher sur le réseau et on met en cache
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }

  // ── B. Navigation HTML & Pages (Network-First avec Fallback Résilient) ───────
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
              // Mettre en cache également sans query string pour les correspondances futures
              if (url.search) {
                cache.put(url.pathname, networkResponse.clone());
              }
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // 1. Chercher la requête exacte en cache
          const exactMatch = await caches.match(request);
          if (exactMatch) return exactMatch;

          // 2. Chercher le chemin sans paramètre d'URL
          const pathMatch = await caches.match(url.pathname, { ignoreSearch: true });
          if (pathMatch) return pathMatch;

          // 3. Chercher la page dashboard principale '/commandes'
          const commandesMatch = await caches.match('/commandes');
          if (commandesMatch) return commandesMatch;

          // 4. Chercher la racine '/'
          const rootMatch = await caches.match('/');
          if (rootMatch) return rootMatch;

          // 5. Chercher la page dédiée /offline
          const offlineMatch = await caches.match('/offline');
          if (offlineMatch) return offlineMatch;

          // 6. Ultime fallback HTML inline (évite l'écran d'erreur natif du navigateur)
          return new Response(OFFLINE_FALLBACK_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 200,
          });
        })
    );
    return;
  }

  // ── C. Next.js RSC (React Server Components payload ?_rsc=...) & Données ────
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

        return new Response(null, { status: 503, statusText: 'Offline' });
      })
  );
});
