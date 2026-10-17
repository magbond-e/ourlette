'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowLeft, Check, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

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

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const { dict, locale } = useLanguage();
  const isEn = locale === 'en';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(dict.auth.fillAllFieldsError);
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    if (!supabase) {
      setTimeout(() => {
        setLoading(false);
        router.push('/commandes');
      }, 400);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(
        authError.message.includes('Invalid login credentials')
          ? dict.auth.invalidCredentialsError
          : authError.message
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    window.location.href = '/commandes';
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || dict.auth.googleFailedError);
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setResetError('');
    const supabase = createClient();
    if (!supabase) {
      setResetSent(true);
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${origin}/auth/callback?next=/parametres`,
    });

    if (resetErr) {
      setResetError(resetErr.message);
      return;
    }

    setResetSent(true);
    setTimeout(() => {
      setResetSent(false);
      setShowForgotModal(false);
      setResetEmail('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 sm:p-8 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-sable/60 min-h-[600px]">
        {/* Left Side: Brand Banner */}
        <div className="bg-sombre text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 z-10">
            <Link href="/" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-clair/80 hover:text-gold transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'Back to Home' : "Retour à l'accueil"}</span>
            </Link>

            <div className="space-y-3 pt-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-gold/40 flex items-center justify-center text-gold shadow-md">
                <Scissors className="w-6 h-6 text-gold" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight">
                Ourlette <span className="text-gold title-highlight font-normal">.</span>
              </h1>
              <p className="text-sm sm:text-base text-clair/80 font-medium max-w-md leading-relaxed">
                {dict.landing.heroSubtitle}
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gold">{isEn ? 'Why Ourlette?' : 'Pourquoi Ourlette ?'}</p>
              <ul className="space-y-2 text-xs sm:text-sm font-medium text-clair/90">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0" />
                  <span>{dict.landing.carnetFeatureTitle}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0" />
                  <span>{dict.landing.mesuresFeatureTitle}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gold shrink-0" />
                  <span>{dict.landing.vitrineFeatureTitle}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 text-xs text-clair/60 font-medium border-t border-white/10 z-10">
            {isEn ? '« Precision in the cut, simplicity in management. »' : '« La rigueur de la coupe, la simplicité de la gestion. »'}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6 bg-white">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-sombre">{dict.auth.loginTitle}</h2>
            <p className="text-sm text-sombre/70 font-medium">{dict.auth.loginSubtitle}</p>
          </div>

          {error && (
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-2xl text-xs sm:text-sm text-accent font-bold">
              {error}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-sable/80 hover:border-sombre rounded-2xl font-bold text-sm text-sombre shadow-xs hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <GoogleIcon />
            <span>{googleLoading ? dict.common.loading : dict.auth.googleLogin}</span>
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 border-b border-sable/60" />
            <span className="text-xs font-bold uppercase text-sombre/40">{dict.auth.orContinueWith}</span>
            <div className="flex-1 border-b border-sable/60" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label={dict.auth.emailLabel}
              type="email"
              placeholder={dict.auth.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-2">
              <Input
                label={dict.auth.passwordLabel}
                type="password"
                placeholder={dict.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-bold text-accent hover:underline"
                >
                  {dict.auth.forgotPassword}
                </button>
              </div>
            </div>

            <Button type="submit" variant="accent" fullWidth size="lg" disabled={loading} className="shadow-lg shadow-accent/20 font-bold rounded-full">
              {loading ? dict.auth.loggingIn : dict.auth.loginButton}
            </Button>
          </form>

          <div className="pt-2 text-center text-sm text-sombre/70">
            <p>
              {dict.auth.noAccountPrompt}{' '}
              <Link href="/signup" className="font-bold text-accent underline hover:no-underline">
                {dict.auth.createAccountLink}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sombre/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-sable space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold text-sombre">{dict.auth.resetModalTitle}</h3>
              <p className="text-xs text-sombre/70 leading-relaxed">
                {dict.auth.resetModalDesc}
              </p>
            </div>

            {resetSent ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200">
                {dict.auth.resetSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-accent/10 text-accent text-xs font-bold rounded-xl border border-accent/20">
                    {resetError}
                  </div>
                )}
                <Input
                  label={dict.auth.emailLabel}
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={dict.auth.emailPlaceholder}
                  required
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForgotModal(false)}
                    className="rounded-full"
                  >
                    {dict.common.cancel}
                  </Button>
                  <Button type="submit" variant="accent" size="sm" className="rounded-full font-bold">
                    {dict.auth.sendResetBtn}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
