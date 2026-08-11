import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-clair flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md space-y-4">
        <h1 className="text-6xl font-display font-extrabold text-sombre">404</h1>
        <h2 className="text-xl font-bold text-sombre">Page introuvable</h2>
        <p className="text-xs text-sombre/70 font-semibold">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="accent" size="md" className="rounded-full font-bold">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
