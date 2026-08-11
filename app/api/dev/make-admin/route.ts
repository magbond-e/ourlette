import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase URL or Anon key missing' }, { status: 500 });
  }

  // Get current logged-in user from request cookies
  const cookieStore = request.cookies;
  const supabaseServer = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });

  const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Vous devez être connecté pour cette action. Connectez-vous sur /login d\'abord.' },
      { status: 401 }
    );
  }

  let insertError: any = null;

  if (serviceRoleKey) {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const res = await supabaseAdmin.from('admins').upsert(
      {
        user_id: user.id,
        email: user.email || '',
        nom: user.user_metadata?.nom || user.email?.split('@')[0] || 'Admin',
      },
      { onConflict: 'user_id' }
    );
    insertError = res.error;
  } else {
    // Attempt insertion with authenticated user client
    const res = await supabaseServer.from('admins').upsert(
      {
        user_id: user.id,
        email: user.email || '',
        nom: user.user_metadata?.nom || user.email?.split('@')[0] || 'Admin',
      },
      { onConflict: 'user_id' }
    );
    insertError = res.error;
  }

  if (insertError) {
    return NextResponse.json(
      {
        error: insertError.message,
        hint: 'Exécutez le script SQL supabase/fix_admin_access.sql dans le Supabase SQL Editor pour donner les droits admins à votre compte.',
      },
      { status: 500 }
    );
  }

  // Redirect to /admin
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/admin';
  return NextResponse.redirect(redirectUrl);
}

