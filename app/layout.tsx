import type { Metadata } from 'next';
import { Playfair_Display, DM_Serif_Text, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSerif = DM_Serif_Text({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
});

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
    priceCurrency: 'XOF',
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
    <html lang="fr" className={`${playfair.variable} ${dmSerif.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="antialiased bg-clair text-sombre selection:bg-accent selection:text-white min-h-screen font-sans">
        <main className="min-h-screen pb-12">{children}</main>
      </body>
    </html>
  );
}
