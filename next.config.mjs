/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── PowerSync / WASM ────────────────────────────────────────────
  // @powersync/web utilise un worker WASM (SQLite) qui a besoin de SharedArrayBuffer.
  // SharedArrayBuffer nécessite Cross-Origin isolation (COOP + COEP).
  experimental: {
    serverComponentsExternalPackages: ['@powersync/web'],
  },

  // ── Security Headers ────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // ── Cross-Origin Isolation (requis pour PowerSync SQLite worker) ──
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },

  // ── Images ──────────────────────────────────────────────────────
  images: {
    // Domaines autorisés explicitement (plus de wildcard **)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
