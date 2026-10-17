'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '../supabase/client';
import { Couturier } from '../types/database';
import { SupabaseService } from '../services/supabaseService';
import { DataService } from '../services/dataService';
import { MockStorageService } from '../services/mockStorage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  couturier: Couturier | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  couturier: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [couturier, setCouturier] = useState<Couturier | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('ourlette_cached_couturier');
      if (cached) return JSON.parse(cached);
    } catch {}
    return MockStorageService.getCouturier();
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCouturierProfile = async (authUser: User) => {
    try {
      let profile = await SupabaseService.getCouturier(authUser.id);
      if (!profile) {
        // S'assurer que le profil est créé s'il n'existe pas encore
        profile = await SupabaseService.createOrEnsureCouturier(authUser.id, {
          nom: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Couturier',
          email: authUser.email || '',
          nom_atelier: authUser.user_metadata?.nom_atelier || 'Mon Atelier',
          slug_vitrine: authUser.user_metadata?.slug_vitrine,
        });
      }

      if (profile) {
        setCouturier(profile);
        try {
          localStorage.setItem('ourlette_cached_couturier', JSON.stringify(profile));
        } catch {}
        await DataService.updateCouturier(authUser.id, profile);
      } else {
        const local = await DataService.getCouturier(authUser.id);
        if (local) setCouturier(local);
      }
    } catch (err) {
      console.warn('Chargement du profil distant différé (mode rapide / offline):', err);
      if (authUser?.id) {
        const local = await DataService.getCouturier(authUser.id);
        if (local) setCouturier(local);
      }
    }
  };

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Récupérer la session locale instantanément
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Si le profil est déjà en cache, libérer l'UI immédiatement sans attendre le réseau
        const hasCached = !!couturier || !!localStorage.getItem('ourlette_cached_couturier');
        if (hasCached) {
          setLoading(false);
          // Revalidation en tâche de fond (Stale-While-Revalidate)
          fetchCouturierProfile(session.user);
        } else {
          fetchCouturierProfile(session.user).finally(() => setLoading(false));
        }
      } else {
        setLoading(false);
      }
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchCouturierProfile(currentSession.user);
      } else {
        setCouturier(null);
        try {
          localStorage.removeItem('ourlette_cached_couturier');
        } catch {}
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const supabase = createClient();
    if (!supabase) {
      alert("Configuration Supabase manquante.");
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Google Auth Error:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    const currentUserId = user?.id;

    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Erreur Supabase signOut:', err);
      }
    }

    // Hygiène de session (appareils partagés) : Nettoyage complet du cache et de SQLite local
    if (typeof window !== 'undefined') {
      try {
        if (currentUserId) {
          const keysToRemove = [
            `ourlette_${currentUserId}_clients`,
            `ourlette_${currentUserId}_commandes`,
            `ourlette_${currentUserId}_mesures`,
            `ourlette_${currentUserId}_realisations`,
            `ourlette_${currentUserId}_couturier`,
            `ourlette_${currentUserId}_notifications`,
            `ourlette_${currentUserId}_sync_queue`,
          ];
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        }

        // Effacement de la base locale PowerSync SQLite pour empêcher toute fuite entre comptes
        const { getPowerSyncDb } = await import('@/lib/powersync/client');
        const db = getPowerSyncDb();
        if (db && typeof db.disconnectAndClear === 'function') {
          await db.disconnectAndClear();
        }

        // Purge du Service Worker Cache (Invariant 9)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_USER_CACHE' });
        }
      } catch (clearErr) {
        console.warn('Erreur lors du nettoyage local de session:', clearErr);
      }
    }

    setUser(null);
    setSession(null);
    setCouturier(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchCouturierProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        couturier,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
