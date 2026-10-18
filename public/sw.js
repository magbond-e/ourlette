// Ourlette Service Worker — PWA & Mode Hors Ligne Résilient (v8)
const CACHE_NAME = 'ourlette-pwa-v8';

// Assets de base pré-mis en cache à l'installation (fichiers statiques légers uniquement)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
  '/fonts/Violense.woff',
];

// Helper pour vérifier qu'une réponse est du HTML valide
function isHtmlResponse(response) {
  if (!response) return false;
  const ct = response.headers.get('content-type') || '';
  return ct.includes('text/html');
}

// Helper pour supprimer les en-têtes Vary de Next.js qui empêchent les correspondances de cache en mode hors ligne
function createCleanResponse(response, contentType) {
  const headers = new Headers(response.headers);
  headers.delete('vary');
  headers.set('Cache-Control', 'public, max-age=31536000');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  return response.blob().then((blob) => {
    return new Response(blob, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  });
}

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

// ── 2. Activate Event — Nettoyage radical des anciens caches (v1 à v7) ─────────
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

  // ── A. Next.js RSC (React Server Components payload ?_rsc=...) ──────────────
  const isRsc =
    url.searchParams.has('_rsc') ||
    request.headers.get('RSC') === '1' ||
    Boolean(request.headers.get('Next-Router-State-Tree'));

  if (isRsc) {
    event.respondWith(
      fetch(request).catch(() => {
        // En mode hors ligne, renvoyer 503 permet à Next.js de basculer proprement
        // et automatiquement sur une navigation document classique (HTML)
        return new Response(null, { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // ── B. Assets Statiques Next.js, Polices, Images, Chunks JS ─────────────────
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
      caches.match(request, { ignoreVary: true }).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidation silencieuse en arrière-plan si en ligne
          fetch(request)
            .then(async (networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const clean = await createCleanResponse(networkResponse);
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, clean);
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clean = await createCleanResponse(networkResponse.clone());
              const cache = await caches.open(CACHE_NAME);
              await cache.put(request, clean);
            }
            return networkResponse;
          })
          .catch(() => cachedResponse || new Response('', { status: 404 }));
      })
    );
    return;
  }

  // ── C. Navigation HTML (Pages de bord & publiques) ──────────────────────────
  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const contentType = networkResponse.headers.get('content-type') || '';
            // Ne mettre en cache QUE les vrais documents HTML
            if (contentType.includes('text/html')) {
              const clean1 = await createCleanResponse(networkResponse.clone(), 'text/html; charset=utf-8');
              const clean2 = await createCleanResponse(networkResponse.clone(), 'text/html; charset=utf-8');
              const cache = await caches.open(CACHE_NAME);
              await cache.put(request, clean1);
              await cache.put(url.pathname, clean2);
            }
          }
          return networkResponse;
        })
        .catch(async () => {
          // 1. Chercher la page exacte demandée dans le cache
          const exactMatch = await caches.match(request, { ignoreSearch: true, ignoreVary: true });
          if (exactMatch && isHtmlResponse(exactMatch)) return exactMatch;

          // 2. Chercher par chemin exact (sans paramètres d'URL)
          const pathMatch = await caches.match(url.pathname, { ignoreSearch: true, ignoreVary: true });
          if (pathMatch && isHtmlResponse(pathMatch)) return pathMatch;

          // 3. Fallback contextuel STRICT par section (JAMAIS croisé entre sections)
          if (url.pathname.startsWith('/commandes')) {
            const cmdMatch =
              (await caches.match('/commandes', { ignoreSearch: true, ignoreVary: true })) ||
              (await caches.match('/commandes/nouvelle', { ignoreSearch: true, ignoreVary: true }));
            if (cmdMatch && isHtmlResponse(cmdMatch)) return cmdMatch;
          }

          if (url.pathname.startsWith('/clients')) {
            const clientMatch = await caches.match('/clients', { ignoreSearch: true, ignoreVary: true });
            if (clientMatch && isHtmlResponse(clientMatch)) return clientMatch;
          }

          if (url.pathname.startsWith('/parametres')) {
            const paramMatch = await caches.match('/parametres', { ignoreSearch: true, ignoreVary: true });
            if (paramMatch && isHtmlResponse(paramMatch)) return paramMatch;
          }

          if (url.pathname.startsWith('/vitrine')) {
            const vitrineMatch = await caches.match('/vitrine/gerer', { ignoreSearch: true, ignoreVary: true });
            if (vitrineMatch && isHtmlResponse(vitrineMatch)) return vitrineMatch;
          }

          // 4. Si la page demandée n'a jamais été mise en cache, afficher une page d'information dédiée
          // ATTENTION : Ne JAMAIS renvoyer le contenu d'un autre onglet (/commandes pour /vitrine, etc.) !
          const pageTitle = url.pathname.startsWith('/vitrine')
            ? 'Vitrine d\'atelier'
            : url.pathname.startsWith('/clients')
            ? 'Fiches clients'
            : url.pathname.startsWith('/parametres')
            ? 'Paramètres'
            : 'Section';

          const offlineHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ourlette — Hors ligne</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #FAFAF8; color: #2B1215; margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
    .card { background: white; border: 1px solid #E5C0C4; border-radius: 24px; padding: 32px 24px; max-width: 420px; text-align: center; box-shadow: 0 4px 20px rgba(43,18,21,0.06); }
    .brand { font-size: 26px; font-weight: bold; margin-bottom: 12px; }
    .brand span { color: #D4AF37; }
    .badge { display: inline-block; background: #FFF1F2; color: #AC0C21; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 999px; border: 1px solid #FFE4E6; margin-bottom: 16px; }
    h1 { font-size: 18px; margin: 0 0 8px; color: #2B1215; }
    p { font-size: 13px; color: #5F1C25; line-height: 1.5; margin: 0 0 24px; }
    .btn { display: inline-block; background: #AC0C21; color: white; text-decoration: none; font-size: 13px; font-weight: bold; padding: 12px 24px; border-radius: 999px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Ourlette<span>.</span></div>
    <div class="badge">Mode Hors Ligne</div>
    <h1>${pageTitle} non synchronisée</h1>
    <p>Cette page n'a pas encore été chargée sur cet appareil avec une connexion Internet active.<br/><br/>Reconnectez-vous brièvement pour synchroniser l'ensemble de votre atelier.</p>
    <a href="/commandes" class="btn">Retourner aux commandes</a>
  </div>
</body>
</html>`;

          return new Response(offlineHtml, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }
});

// ── 4. Message Event — Réinitialisation de cache ─────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Purge complète du cache lors de la déconnexion
  if (event.data.type === 'CLEAR_USER_CACHE' || event.data.action === 'LOGOUT') {
    caches.delete(CACHE_NAME).then(() => {
      console.info('[SW] Cache PWA réinitialisé suite à la déconnexion.');
    });
  }
});

// ── 4. Message Event — Réinitialisation de cache ─────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Purge complète du cache lors de la déconnexion
  if (event.data.type === 'CLEAR_USER_CACHE' || event.data.action === 'LOGOUT') {
    caches.delete(CACHE_NAME).then(() => {
      console.info('[SW] Cache PWA réinitialisé suite à la déconnexion.');
    });
  }
});
