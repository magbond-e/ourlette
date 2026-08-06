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

export const metadata: Metadata = {
  title: 'Ourlette — Le carnet d’atelier Haute Couture',
  description:
    'SaaS gratuit pour couturiers et ateliers : carnet de commandes, fiche mesures numérique, vitrine publique WhatsApp.',
  manifest: '/manifest.json',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${playfair.variable} ${dmSerif.variable} ${inter.variable}`}>
      <body className="antialiased bg-clair text-sombre selection:bg-accent selection:text-white min-h-screen font-sans">
        <main className="min-h-screen pb-12">{children}</main>
      </body>
    </html>
  );
}
