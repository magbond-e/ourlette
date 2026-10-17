import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables (URL or Anon Key) are missing.');
  }

  const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60; // 365 jours
  const isProd = process.env.NODE_ENV === 'production';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      maxAge: ONE_YEAR_IN_SECONDS,
      sameSite: 'lax',
      path: '/',
      secure: isProd,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              maxAge: ONE_YEAR_IN_SECONDS,
              sameSite: 'lax',
              path: '/',
              httpOnly: true,
              secure: isProd,
            });
          });
        } catch {
          // The `setAll` method was called from a Server Component context
        }
      },
    },
  });
}

/**
 * Creates a Supabase admin client with service_role privileges.
 * Use ONLY in secure server-side environments (Route Handlers, Webhooks).
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
