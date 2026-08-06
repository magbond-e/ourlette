'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowLeft, Check, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Veuillez remplir votre email/téléphone et votre mot de passe.');
      return;
    }

    setLoading(true);
    setError('');

    // TODO: Remplacer par Supabase Auth avant déploiement
    // const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
    // if (error) { setError(error.message); setLoading(false); return; }
    // router.push('/commandes');

    // Simulation temporaire (MVP sans Supabase actif)
    setTimeout(() => {
      setLoading(false);
      router.push('/commandes');
    }, 400);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetSent(true);
    setTimeout(() => {
      setResetSent(false);
      setShowForgotModal(false);
      setResetEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-sable/60 min-h-[600px]">
        {/* Left Side: Brand Banner (Farata style) */}
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
                Ourlette <span className="text-gold title-highlight font-normal">.</span>
              </h1>
              <p className="text-sm sm:text-base text-clair/80 font-medium max-w-md leading-relaxed">
                Le carnet d&apos;atelier numérique conçu spécialement pour les couturiers et ateliers sur-mesure.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gold">Pourquoi Ourlette ?</p>
              <ul className="space-y-2 text-xs sm:text-sm font-medium text-clair/90">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0" />
                  <span>Carnet de commandes & suivi d&apos;atelier en 1 tap</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0" />
                  <span>Fiches mesures numériques enregistrées par client</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0" />
                  <span>Vitrine publique WhatsApp générée automatiquement</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 text-xs text-clair/60 font-medium border-t border-white/10 z-10">
            « La rigueur de la coupe, la simplicité de la gestion. »
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6 bg-white">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">Connexion Atelier</h2>
            <p className="text-sm text-sombre/70 font-medium">Accédez à votre espace d&apos;atelier en toute sécurité</p>
          </div>

          {error && (
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-2xl text-xs sm:text-sm text-accent font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email ou Téléphone"
              type="text"
              placeholder="ex: +221 77 123 45 67 ou atelier@gmail.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <div className="space-y-2">
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(identifier);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-bold text-accent hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>

            <Button type="submit" variant="accent" fullWidth size="lg" disabled={loading} className="shadow-lg shadow-accent/20">
              {loading ? 'Connexion en cours…' : 'Se connecter →'}
            </Button>
          </form>

          <div className="pt-4 text-center text-sm text-sombre/70 space-y-3">
            <p>
              Pas encore de compte ?{' '}
              <Link href="/signup" className="font-bold text-accent underline hover:no-underline">
                Créer un atelier gratuit
              </Link>
            </p>

{/* Bouton de démo retiré avant déploiement — ne jamais exposer de credentials en production */}
          </div>
        </div>
      </div>

      {/* Forgot password modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-sombre/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 space-y-4 shadow-xl border border-sable rounded-3xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-sombre">Mot de passe oublié ?</h3>
              <button onClick={() => setShowForgotModal(false)} className="text-sm font-bold text-sombre/50 hover:text-sombre">
                ✕
              </button>
            </div>

            <p className="text-sm text-sombre/70 font-medium">
              Entrez votre adresse email ou numéro de téléphone pour recevoir le lien de réinitialisation.
            </p>

            {resetSent ? (
              <div className="p-4 bg-vertbouton/15 border border-vertbouton/30 rounded-2xl text-sm text-vertbouton font-bold text-center">
                ✓ Instructions envoyées ! Vérifiez votre boîte mail.
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                  label="Email ou Téléphone"
                  type="text"
                  placeholder="ex: atelier@gmail.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForgotModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="accent" size="sm">
                    Réinitialiser
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
