import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured yet, allow access to prototype routes
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60; // 365 jours (Section 11.1)
  const isProd = process.env.NODE_ENV === 'production';

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookieOptions: {
        maxAge: ONE_YEAR_IN_SECONDS,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              maxAge: ONE_YEAR_IN_SECONDS, // Expiration glissante (Rolling Session)
              sameSite: 'lax',
              path: '/',
              httpOnly: true,
              secure: isProd,
            })
          );
        },
      },
    });

    let user = null;
    let isNetworkError = false;

    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
      } else if (
        error &&
        (error.message?.toLowerCase().includes('fetch') ||
          error.message?.toLowerCase().includes('network') ||
          error.message?.toLowerCase().includes('timeout') ||
          error.message?.toLowerCase().includes('enotfound') ||
          error.status === 504 ||
          error.status === 502)
      ) {
        isNetworkError = true;
      }
    } catch (e: any) {
      if (
        e?.message?.toLowerCase().includes('fetch') ||
        e?.message?.toLowerCase().includes('network') ||
        e?.name === 'FetchError'
      ) {
        isNetworkError = true;
      }
    }

    // Détection de la présence de cookies de session Supabase
    const allCookies = request.cookies.getAll();
    const hasAuthCookie = allCookies.some(
      (c) =>
        (c.name.startsWith('sb-') && c.name.includes('-auth-token')) ||
        c.name === 'supabase-auth-token'
    );

    const pathname = request.nextUrl.pathname;
    const protectedRoutes = ['/commandes', '/clients', '/parametres', '/vitrine/gerer', '/pro'];
    const authRoutes = ['/login', '/signup'];
    const isAdminRoute = pathname.startsWith('/admin');

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Section 11.4 : En mode hors ligne ou incident réseau temporaire,
    // si un cookie de session existe, on ne déconnecte JAMAIS l'utilisateur vers /login.
    const isConsideredLoggedIn = Boolean(user || (isNetworkError && hasAuthCookie));

    if (!isConsideredLoggedIn && (isProtectedRoute || isAdminRoute)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }

    if (user && isAuthRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/commandes';
      return NextResponse.redirect(redirectUrl);
    }

    if (user && isAdminRoute) {
      // Vérification stricte du rôle administrateur dans la table `admins`
      const { data: adminRecord } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!adminRecord) {
        // Utilisateur connecté mais NON administrateur : accès interdit, redirection vers l'espace couturier
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/commandes';
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (err) {
    console.error('Middleware auth check error:', err);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
