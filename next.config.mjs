/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  swcMinify: true,

  // ── PowerSync / WASM & Optimisation des modules ──────────────────
  experimental: {
    serverComponentsExternalPackages: ['@powersync/web'],
    optimizePackageImports: ['lucide-react', '@supabase/ssr', '@supabase/supabase-js'],
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
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://*.supabase.in; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.powersync.journeyapps.com wss://*.powersync.journeyapps.com https://api.saspay.me https://*.saspay.me; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://*.saspay.me;",
          },
        ],
      },
    ];
  },

  // ── Images ──────────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
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
