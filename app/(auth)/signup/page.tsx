'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowLeft, Eye, EyeOff, Check, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';

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
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Confirmation email sent state
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(dict.auth.fillAllFieldsError || 'Veuillez renseigner un email et un mot de passe.');
      return;
    }

    if (password.length < 8) {
      setError(
        isEn
          ? 'Password must be at least 8 characters.'
          : 'Le mot de passe doit contenir au moins 8 caractères.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Une erreur est survenue lors de l'inscription.");
      }

      // Si Supabase requiert confirmation d'email
      if (resData.user && !resData.session) {
        setEmailSent(true);
        setLoading(false);
        return;
      }

      // Connexion directe
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
      }

      router.push('/commandes');
    } catch (err: any) {
      const msg = err?.message || 'Une erreur inattendue est survenue.';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('déjà')) {
        setError(
          isEn
            ? 'An account already exists with this email. Please log in.'
            : 'Un compte existe déjà avec cet email.'
        );
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || dict.auth.googleFailedError);
      setGoogleLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setResending(true);
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
    }
    setResending(false);
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 sm:p-8 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-sable/60 min-h-[520px] my-6">
        {/* Left Side: Brand Banner (Desktop only - 3 bullet points max) */}
        <div className="hidden lg:flex lg:col-span-5 bg-sombre text-white p-10 flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-sable hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'Back to Home' : "Retour à l'accueil"}</span>
            </Link>

            <div className="space-y-3 pt-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-gold/40 flex items-center justify-center text-gold shadow-md">
                <Scissors className="w-6 h-6 text-gold" />
              </div>
              <h1 className="text-3xl font-display font-bold text-white leading-tight">
                Ourlette<span className="text-gold title-highlight font-normal">.</span>
              </h1>
              <p className="text-sm text-sable/90 font-medium leading-relaxed">
                {isEn
                  ? 'The digital notebook tailored for fashion workshops.'
                  : "Le carnet de commandes et mesures conçu pour les ateliers de couture."}
              </p>
            </div>

            <ul className="space-y-3 text-xs font-medium text-white/90 pt-2">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-gold shrink-0 stroke-[3]" />
                <span>{isEn ? 'Order tracking & delivery alerts' : 'Suivi de commandes & alertes livraison'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-gold shrink-0 stroke-[3]" />
                <span>{isEn ? 'Client measurement sheets for life' : 'Fiches mesures client à vie'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-gold shrink-0 stroke-[3]" />
                <span>{isEn ? 'Works seamlessly offline (3G)' : '100% fonctionnel hors ligne'}</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 text-xs text-sable/60 font-medium border-t border-white/10 z-10">
            {isEn ? 'Free Starter • No credit card required' : 'Gratuit • Aucune carte bancaire requise'}
          </div>
        </div>

        {/* Right Side: Simple 2-Field Signup Form (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-12 flex flex-col justify-center space-y-6 bg-white">
          {emailSent ? (
            /* État : Vérifie ta boîte mail */
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-accent/10 text-accent flex items-center justify-center mx-auto shadow-xs border border-accent/20">
                <Mail className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-display font-bold text-sombre">
                  {isEn ? 'Check your mailbox' : 'Vérifie ta boîte mail'}
                </h2>
                <p className="text-sm text-sombre/70 font-medium max-w-sm mx-auto leading-relaxed">
                  {isEn ? 'We sent a confirmation link to' : 'Nous avons envoyé un lien de confirmation à'}{' '}
                  <strong className="text-sombre font-bold">{email}</strong>.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleResendEmail}
                  disabled={resending || resendCooldown > 0}
                  className="rounded-full text-xs font-bold gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? isEn
                        ? `Resend in ${resendCooldown}s`
                        : `Renvoyer dans ${resendCooldown}s`
                      : isEn
                      ? 'Resend email'
                      : "Renvoyer l'email"}
                  </span>
                </Button>

                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="text-xs font-bold text-accent hover:underline py-2"
                >
                  {isEn ? 'Change email address' : "Changer d'adresse"}
                </button>
              </div>
            </div>
          ) : (
            /* Formulaire standard 2 champs */
            <>
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">
                  {dict.auth.signupTitle}
                </h2>
                <p className="text-xs sm:text-sm text-sombre/70 font-medium">
                  {isEn ? 'Start free in less than 30 seconds.' : 'Démarre gratuitement en moins de 30 secondes.'}
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-accent/10 border border-accent/30 rounded-2xl text-xs sm:text-sm text-accent font-bold flex items-center justify-between gap-2">
                  <span>{error}</span>
                  {error.toLowerCase().includes('existe') && (
                    <Link href="/login" className="underline whitespace-nowrap">
                      {dict.auth.loginButton}
                    </Link>
                  )}
                </div>
              )}

              {/* 1. Bouton Google EN PREMIER */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-sable/80 hover:border-sombre rounded-2xl font-bold text-sm text-sombre shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <GoogleIcon />
                <span>{googleLoading ? dict.common.loading : dict.auth.googleLogin}</span>
              </button>

              {/* 2. Séparateur « ou » */}
              <div className="flex items-center gap-3 my-0.5">
                <div className="flex-1 border-b border-sable/60" />
                <span className="text-[11px] font-bold uppercase text-sombre/40">{dict.common.or}</span>
                <div className="flex-1 border-b border-sable/60" />
              </div>

              {/* 3. Formulaire 2 Champs : Email + Mot de passe */}
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-sombre mb-1.5">
                    {dict.auth.emailLabel}
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder={dict.auth.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-sable/80 rounded-2xl text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-sombre mb-1.5">
                    {dict.auth.passwordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={dict.auth.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-11 bg-[#FAF9F6] border border-sable/80 rounded-2xl text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-sombre/50 hover:text-sombre transition-colors cursor-pointer"
                      aria-label="Afficher ou masquer le mot de passe"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-[11px] text-accent font-semibold mt-1">
                      {isEn ? '8 characters minimum required.' : '8 caractères minimum requis.'}
                    </p>
                  )}
                </div>

                {/* Bouton Créer mon compte */}
                <Button
                  type="submit"
                  variant="accent"
                  fullWidth
                  size="lg"
                  disabled={loading}
                  className="rounded-full font-bold shadow-lg shadow-accent/20 text-sm sm:text-base py-3.5 cursor-pointer mt-1"
                >
                  {loading ? dict.auth.signingUp : dict.auth.signupButton}
                </Button>
              </form>

              {/* Une seule ligne d'acceptation CGU & Confidentialité */}
              <p className="text-center text-[11px] text-sombre/60 font-medium leading-relaxed">
                {isEn ? (
                  <>
                    By creating an account, you accept the{' '}
                    <Link href="/cgu" className="text-accent font-bold underline hover:no-underline">
                      Terms of Service
                    </Link>{' '}
                    and the{' '}
                    <Link href="/politique-confidentialite" className="text-accent font-bold underline hover:no-underline">
                      Privacy Policy
                    </Link>.
                  </>
                ) : (
                  <>
                    En créant un compte, tu acceptes les{' '}
                    <Link href="/cgu" className="text-accent font-bold underline hover:no-underline">
                      CGU
                    </Link>{' '}
                    et la{' '}
                    <Link href="/politique-confidentialite" className="text-accent font-bold underline hover:no-underline">
                      politique de confidentialité
                    </Link>.
                  </>
                )}
              </p>

              {/* Lien J'ai déjà un compte */}
              <div className="pt-2 text-center text-xs sm:text-sm text-sombre/70 border-t border-sable/40">
                <p>
                  {dict.auth.haveAccountPrompt}{' '}
                  <Link href="/login" className="font-bold text-accent underline hover:no-underline">
                    {dict.auth.loginLink}
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
