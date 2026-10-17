import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { LanguageProvider } from '@/lib/i18n';
import { CookieBanner } from '@/components/ui/CookieBanner';
import PwaRegister from '@/components/PwaRegister';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ourlette.app';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Ourlette — Le carnet d’atelier Haute Couture & Logiciel Couturier',
    template: '%s | Ourlette Couture',
  },
  description:
    'SaaS gratuit pour couturiers et ateliers de couture : carnet de commandes d’atelier, gestion des fiches mesures numériques, suivi des livraisons et vitrine publique WhatsApp.',
  keywords: [
    'couture',
    'logiciel couturier',
    'carnet d atelier',
    'fiche mesure couture',
    'haute couture',
    'vitrine whatsapp couturier',
    'gestion atelier couture',
    'couture sur mesure',
    'ourlette',
  ],
  authors: [{ name: 'Ourlette' }],
  creator: 'Ourlette',
  publisher: 'Ourlette',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Ourlette — Le carnet d’atelier Haute Couture',
    description:
      'SaaS gratuit pour couturiers et ateliers : carnet de commandes, fiche mesures numérique, vitrine publique WhatsApp.',
    url: appUrl,
    siteName: 'Ourlette',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ourlette — Le carnet d’atelier Haute Couture',
    description:
      'SaaS gratuit pour couturiers et ateliers : carnet de commandes, fiche mesures numérique, vitrine publique WhatsApp.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'z5nal6ufPT9d9SeePPKdG9fp54RBCdcY9M81aMWxJUQ',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/favicon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.svg',
  },
};

export const viewport = {
  themeColor: '#2B1215',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ourlette',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'FCFA',
  },
  description:
    'SaaS gratuit pour couturiers et ateliers de couture : carnet de commandes d’atelier, gestion des fiches mesures numériques et vitrine publique WhatsApp.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData).replace(/</g, '\\u003c') }}
        />
      </head>
      <body className="antialiased bg-[#FAFAF8] text-sombre selection:bg-accent selection:text-white min-h-screen font-sans">
        <AuthProvider>
          <LanguageProvider>
            <PwaRegister />
            <main className="min-h-screen bg-[#FAFAF8]">{children}</main>
            <CookieBanner />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

