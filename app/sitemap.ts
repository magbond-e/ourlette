import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ourlette.vercel.app';

  const publicRoutes = [
    '',
    '/comment-ca-marche',
    '/faq',
    '/cgu',
    '/mentions-legales',
    '/politique-confidentialite',
    '/cookies',
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
