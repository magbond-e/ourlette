'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowLeft, Store, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MockStorageService } from '@/lib/services/mockStorage';

export default function SignupPage() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [nomAtelier, setNomAtelier] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [ville, setVille] = useState('Dakar');
  const [pays, setPays] = useState('Sénégal');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const slug = nomAtelier
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'mon-atelier';

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !nomAtelier || !contact || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    setError('');

    MockStorageService.updateCouturier({
      nom,
      nom_atelier: nomAtelier,
      telephone: contact.includes('@') ? '' : contact,
      email: contact.includes('@') ? contact : '',
      ville,
      pays,
      slug_vitrine: slug,
    });

    setTimeout(() => {
      setLoading(false);
      router.push('/commandes');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-sable/60 min-h-[640px]">
        {/* Left Side: Brand Banner */}
        <div className="bg-sombre text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 z-10">
            <Link href="/" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-clair/80 hover:text-gold transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à l&apos;accueil</span>
            </Link>

            <div className="space-y-3 pt-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-gold/40 flex items-center justify-center text-gold shadow-md">
                <Scissors className="w-6 h-6 text-gold" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight">
                Créer votre Atelier <span className="text-gold title-highlight font-normal">.</span>
              </h1>
              <p className="text-sm sm:text-base text-clair/80 font-medium max-w-md leading-relaxed">
                Inscrivez votre atelier en 2 minutes et commencez immédiatement à gérer vos commandes et clients.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gold">Inclus gratuitement :</p>
              <ul className="space-y-2 text-xs sm:text-sm font-medium text-clair/90">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0" />
                  <span>Accès illimité au carnet de commandes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0" />
                  <span>Fiches de mesures personnalisées</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0" />
                  <span>Lien de vitrine WhatsApp sur-mesure</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 text-xs text-clair/60 font-medium border-t border-white/10 z-10">
            « Pour tous les ateliers & couturiers d&apos;Afrique et d&apos;ailleurs. »
          </div>
        </div>

        {/* Right Side: Signup Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center space-y-5 bg-white">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">Création d&apos;Atelier</h2>
            <p className="text-sm text-sombre/70 font-medium">Inscription simple et immédiate</p>
          </div>

          {error && (
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-2xl text-xs sm:text-sm text-accent font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Votre Nom complet"
              type="text"
              placeholder="ex: Adia Sylla"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />

            <Input
              label="Nom de votre Atelier de couture"
              type="text"
              placeholder="ex: Atelier Adia Couture"
              value={nomAtelier}
              onChange={(e) => setNomAtelier(e.target.value)}
              required
            />

            <div className="p-3 bg-[#FAFAF8] rounded-2xl border border-sable/70 flex items-center gap-2.5 text-xs sm:text-sm text-sombre font-sans">
              <Store className="w-4 h-4 text-accent shrink-0" />
              <span className="font-mono text-xs sm:text-sm truncate">
                ourlette.app/<strong className="text-accent font-bold">{slug}</strong>
              </span>
            </div>

            <Input
              label="Téléphone ou Email"
              type="text"
              placeholder="ex: +221 77 123 45 67"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ville"
                type="text"
                placeholder="ex: Dakar"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
              />

              <Input
                label="Pays"
                type="text"
                placeholder="ex: Sénégal"
                value={pays}
                onChange={(e) => setPays(e.target.value)}
              />
            </div>

            <Input
              label="Mot de passe"
              type="password"
              placeholder="Minimum 6 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="accent" fullWidth size="lg" disabled={loading} className="mt-2 shadow-lg shadow-accent/20">
              {loading ? 'Création en cours…' : 'Ouvrir mon carnet digital →'}
            </Button>
          </form>

          <div className="pt-2 text-center text-sm text-sombre/70">
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="font-bold text-accent underline hover:no-underline">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
