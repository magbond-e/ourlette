'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowLeft, Check, Store, MapPin, Phone, User, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { MockStorageService } from '@/lib/services/mockStorage';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

const COUNTRIES = [
  { name: 'Bénin', dial: '+229', flag: '🇧🇯' },
  { name: 'Côte d’Ivoire', dial: '+225', flag: '🇨🇮' },
  { name: 'Sénégal', dial: '+221', flag: '🇸🇳' },
  { name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { name: 'Cameroun', dial: '+237', flag: '🇨🇲' },
  { name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
  { name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { name: 'Guinée', dial: '+224', flag: '🇬🇳' },
  { name: 'Niger', dial: '+227', flag: '🇳🇪' },
  { name: 'Gabon', dial: '+241', flag: '🇬🇦' },
  { name: 'Congo', dial: '+242', flag: '🇨🇬' },
  { name: 'RDC', dial: '+243', flag: '🇨🇩' },
  { name: 'Tchad', dial: '+235', flag: '🇹🇩' },
  { name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { name: 'Nigéria', dial: '+234', flag: '🇳🇬' },
  { name: 'France', dial: '+33', flag: '🇫🇷' },
  { name: 'Belgique', dial: '+32', flag: '🇧🇪' },
  { name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { name: 'États-Unis', dial: '+1', flag: '🇺🇸' },
  { name: 'Autre', dial: '+', flag: '🌍' },
];

function detectClientDevice(): string {
  if (typeof window === 'undefined') return 'Appareil inconnu';
  const ua = navigator.userAgent;
  let deviceType = 'Ordinateur';
  if (/mobile/i.test(ua)) deviceType = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablette';

  let os = '';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = '';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';

  const details = [os, browser].filter(Boolean).join(' - ');
  return `${deviceType}${details ? ` (${details})` : ''}`;
}

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

  const [nom, setNom] = useState('');
  const [nomAtelier, setNomAtelier] = useState('');
  const [pays, setPays] = useState('Bénin');
  const [indicatif, setIndicatif] = useState('+229');
  const [phoneNumero, setPhoneNumero] = useState('');
  const [ville, setVille] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCountryChange = (countryName: string) => {
    setPays(countryName);
    const found = COUNTRIES.find((c) => c.name === countryName);
    if (found && found.dial !== '+') {
      setIndicatif(found.dial);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !nomAtelier.trim() || !email.trim() || !password || !phoneNumero.trim() || !ville.trim()) {
      setError(dict.auth.fillAllFieldsError || 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 6) {
      setError(isEn ? 'Password must be at least 6 characters.' : 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    setError('');

    const fullPhone = `${indicatif} ${phoneNumero.trim()}`;
    const detectedDevice = detectClientDevice();

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          nom_atelier: nomAtelier.trim(),
          pays: pays.trim(),
          telephone: fullPhone,
          ville: ville.trim(),
          email: email.trim().toLowerCase(),
          password,
          device: detectedDevice,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Une erreur est survenue lors de l'inscription.");
      }

      // Sync mock storage for local dev / offline preview
      MockStorageService.updateCouturier({
        nom: nom.trim(),
        nom_atelier: nomAtelier.trim(),
        email: email.trim().toLowerCase(),
        telephone: fullPhone,
        whatsapp_contact: fullPhone,
        ville: ville.trim(),
        pays: pays.trim(),
        device: detectedDevice,
        onboarding_emails_enabled: true,
        cookie_consent_at: new Date().toISOString(),
      });

      // If Supabase client is available, also log in on the browser client
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
      }

      setLoading(false);

      if (resData.session) {
        window.location.href = '/commandes';
      } else {
        // Confirmation email maybe required or direct login
        window.location.href = '/commandes';
      }
    } catch (err: any) {
      console.error('[Signup] Error:', err);
      // Fallback local if Supabase is offline/unconfigured
      const supabase = createClient();
      if (!supabase) {
        MockStorageService.updateCouturier({
          nom: nom.trim(),
          nom_atelier: nomAtelier.trim(),
          email: email.trim().toLowerCase(),
          telephone: fullPhone,
          ville: ville.trim(),
          pays: pays.trim(),
          cookie_consent_at: new Date().toISOString(),
        });
        setTimeout(() => {
          setLoading(false);
          router.push('/commandes');
        }, 300);
        return;
      }

      setError(err?.message || "Une erreur inattendue est survenue.");
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

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-3 sm:p-8 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-sable/60 min-h-[640px] my-6">
        {/* Left Side: Brand Banner (4 cols) */}
        <div className="lg:col-span-4 bg-sombre text-white p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-clair/80 hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'Back to Home' : "Retour à l'accueil"}</span>
            </Link>

            <div className="space-y-3 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-gold/40 flex items-center justify-center text-gold shadow-md">
                <Scissors className="w-6 h-6 text-gold" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white leading-tight">
                {dict.auth.signupTitle}<span className="text-gold title-highlight font-normal">.</span>
              </h1>
              <p className="text-xs sm:text-sm text-clair/80 font-medium leading-relaxed">
                {isEn
                  ? 'Set up your workshop account once and manage orders, client measurements and public showcase with ease.'
                  : 'Configurez votre atelier en une seule étape. Fini les formulaires répétés : démarrez immédiatement.'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-gold">
                {isEn ? 'Everything included:' : 'Inclus immédiatement :'}
              </p>
              <ul className="space-y-2 text-xs font-medium text-clair/90">
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

          <div className="pt-6 text-xs text-clair/60 font-medium border-t border-white/10 z-10">
            {isEn ? '« For tailoring artisans & fashion ateliers around the world. »' : "« Pour tous les couturiers & ateliers d'Afrique et du monde. »"}
          </div>
        </div>

        {/* Right Side: Complete Profile Signup Form (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-10 flex flex-col justify-center space-y-5 bg-white">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-bold text-sombre">
              {isEn ? 'Create your Couturier Account' : 'Créer votre compte Couturier'}
            </h2>
            <p className="text-xs sm:text-sm text-sombre/70 font-medium">
              {isEn
                ? 'Fill in your atelier info once. Your dashboard is ready instantly.'
                : 'Renseignez les détails de votre atelier. Votre espace sera directement prêt.'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-accent/10 border border-accent/30 rounded-2xl text-xs sm:text-sm text-accent font-bold">
              {error}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-sable/80 hover:border-sombre rounded-2xl font-bold text-xs sm:text-sm text-sombre shadow-xs hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <GoogleIcon />
            <span>{googleLoading ? dict.common.loading : dict.auth.googleLogin}</span>
          </button>

          <div className="flex items-center gap-3 my-0.5">
            <div className="flex-1 border-b border-sable/60" />
            <span className="text-[11px] font-bold uppercase text-sombre/40">{dict.auth.orContinueWith}</span>
            <div className="flex-1 border-b border-sable/60" />
          </div>

          <form onSubmit={handleSignup} className="space-y-3.5">
            {/* Row 1: Nom couturier & Nom atelier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-sombre mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accent" />
                  <span>{isEn ? 'Full Name *' : 'Votre Nom & Prénom *'}</span>
                </label>
                <input
                  type="text"
                  placeholder={isEn ? 'e.g. Moussa Traoré' : 'ex. Moussa Traoré'}
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sombre mb-1 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-accent" />
                  <span>{isEn ? 'Workshop Name *' : "Nom de l'Atelier *"}</span>
                </label>
                <input
                  type="text"
                  placeholder={isEn ? 'e.g. Élégance Couture' : 'ex. Élégance Couture'}
                  value={nomAtelier}
                  onChange={(e) => setNomAtelier(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </div>

            {/* Row 2: Pays + Ville */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-sombre mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  <span>{isEn ? 'Country *' : 'Pays *'}</span>
                </label>
                <select
                  value={pays}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs sm:text-sm text-sombre focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium cursor-pointer"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name} ({c.dial})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-sombre mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  <span>{isEn ? 'City *' : 'Ville *'}</span>
                </label>
                <input
                  type="text"
                  placeholder={isEn ? 'e.g. Cotonou, Abidjan, Dakar' : 'ex. Cotonou, Abidjan, Dakar'}
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </div>

            {/* Row 3: Phone with Dial Code Selector */}
            <div>
              <label className="block text-xs font-bold text-sombre mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-accent" />
                <span>{isEn ? 'Phone / WhatsApp Number *' : 'Numéro Téléphone / WhatsApp *'}</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={indicatif}
                  onChange={(e) => setIndicatif(e.target.value)}
                  className="w-28 shrink-0 px-2.5 py-2.5 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs sm:text-sm text-sombre font-bold focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent cursor-pointer"
                >
                  {COUNTRIES.map((c) => (
                    <option key={`${c.name}-${c.dial}`} value={c.dial}>
                      {c.flag} {c.dial}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder={isEn ? 'e.g. 97 00 11 22' : 'ex. 97 00 11 22'}
                  value={phoneNumero}
                  onChange={(e) => setPhoneNumero(e.target.value)}
                  required
                  className="flex-1 px-3.5 py-2.5 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </div>

            {/* Row 4: Email & Mot de passe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-sombre mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-accent" />
                  <span>{dict.auth.emailLabel} *</span>
                </label>
                <input
                  type="email"
                  placeholder={dict.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sombre mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-accent" />
                  <span>{dict.auth.passwordLabel} (min. 6) *</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-sable/80 rounded-xl text-xs sm:text-sm text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="accent"
              fullWidth
              size="lg"
              disabled={loading}
              className="mt-3 shadow-lg shadow-accent/20 font-bold rounded-full py-3.5 text-sm sm:text-base cursor-pointer"
            >
              {loading ? (isEn ? 'Creating workshop…' : 'Création de votre atelier…') : (isEn ? 'Start using Ourlette' : 'Démarrer avec Ourlette')}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs sm:text-sm text-sombre/70 font-medium">
            {dict.auth.haveAccountPrompt}{' '}
            <Link href="/login" className="font-bold text-accent underline hover:no-underline">
              {dict.auth.loginLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
