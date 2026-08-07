'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowLeft, Store, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { SupabaseService } from '@/lib/services/supabaseService';
import { MockStorageService } from '@/lib/services/mockStorage';

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function SignupPage() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [nom, setNom] = useState('');
  const [nomAtelier, setNomAtelier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ville, setVille] = useState('Dakar');
  const [pays, setPays] = useState('Sénégal');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const slug = nomAtelier
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'mon-atelier';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !nomAtelier || !email || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    if (!supabase) {
      // Local fallback if Supabase client unavailable
      MockStorageService.updateCouturier({
        nom,
        nom_atelier: nomAtelier,
        email,
        ville,
        pays,
        slug_vitrine: slug,
      });
      setTimeout(() => {
        setLoading(false);
        router.push('/commandes');
      }, 400);
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          nom: nom.trim(),
          nom_atelier: nomAtelier.trim(),
          ville: ville.trim(),
          pays: pays.trim(),
          slug_vitrine: slug,
        },
      },
    });

    if (authErr) {
      setError(authErr.message.includes('User already registered')
        ? 'Un compte existe déjà avec cette adresse email.'
        : authErr.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      await SupabaseService.createOrEnsureCouturier(authData.user.id, {
        nom: nom.trim(),
        nom_atelier: nomAtelier.trim(),
        email: email.trim(),
        ville: ville.trim(),
        pays: pays.trim(),
        slug_vitrine: slug,
      });
    }

    setLoading(false);
    router.push('/commandes');
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Échec de l’inscription via Google.');
      setGoogleLoading(false);
    }
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
            <p className="text-sm text-sombre/70 font-medium">Inscription avec Email ou compte Google</p>
          </div>

          {error && (
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-2xl text-xs sm:text-sm text-accent font-bold">
              {error}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-sable/80 hover:border-sombre rounded-2xl font-bold text-sm text-sombre shadow-xs hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <GoogleIcon />
            <span>{googleLoading ? 'Inscription avec Google…' : 'S’inscrire avec Google'}</span>
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 border-b border-sable/60" />
            <span className="text-xs font-bold uppercase text-sombre/40">Ou avec votre email</span>
            <div className="flex-1 border-b border-sable/60" />
          </div>

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
              label="Adresse Email"
              type="email"
              placeholder="ex: atelier@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

            <Button type="submit" variant="accent" fullWidth size="lg" disabled={loading} className="mt-2 shadow-lg shadow-accent/20 font-bold rounded-full">
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
