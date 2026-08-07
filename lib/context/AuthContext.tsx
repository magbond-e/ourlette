'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '../supabase/client';
import { Couturier } from '../types/database';
import { SupabaseService } from '../services/supabaseService';
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
  const [couturier, setCouturier] = useState<Couturier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCouturierProfile = async (authUser: User) => {
    try {
      let profile = await SupabaseService.getCouturier(authUser.id);
      if (!profile) {
        // Ensure profile is created if it doesn't exist yet
        profile = await SupabaseService.createOrEnsureCouturier(authUser.id, {
          nom: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Couturier',
          email: authUser.email || '',
          nom_atelier: authUser.user_metadata?.nom_atelier || 'Mon Atelier',
          slug_vitrine: authUser.user_metadata?.slug_vitrine,
        });
      }

      if (profile) {
        setCouturier(profile);
        MockStorageService.updateCouturier(profile);
      } else {
        const local = MockStorageService.getCouturier();
        setCouturier(local);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      const local = MockStorageService.getCouturier();
      setCouturier(local);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCouturierProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await fetchCouturierProfile(currentSession.user);
      } else {
        setCouturier(null);
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
    if (supabase) {
      await supabase.auth.signOut();
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
