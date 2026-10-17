import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  let success = false;

  if (token && token.trim().length > 6) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && serviceKey) {
        const supabase = createClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false },
        });

        const { error } = await supabase
          .from('couturiers')
          .update({
            email_opt_out: true,
            updated_at: new Date().toISOString(),
          })
          .eq('unsubscribe_token', token.trim());

        if (!error) {
          success = true;
        } else {
          console.error('[Unsubscribe] Erreur Supabase:', error);
        }
      }
    } catch (err) {
      console.error('[Unsubscribe] Erreur serveur:', err);
    }
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Désinscription confirmée — Ourlette</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAFAF8;
      color: #2B1215;
      margin: 0;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #ffffff;
      border: 1px solid #E5C0C4;
      border-radius: 24px;
      max-width: 480px;
      width: 100%;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(43, 18, 21, 0.05);
    }
    .logo {
      font-size: 26px;
      font-weight: 800;
      color: #2B1215;
      margin-bottom: 20px;
      letter-spacing: -0.5px;
    }
    .logo span {
      color: #D4AF37;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      background-color: #EBF7EE;
      color: #2D6A4F;
      border-radius: 50%;
      font-size: 24px;
      margin-bottom: 20px;
      border: 1px solid #C4E3CC;
    }
    h1 {
      font-size: 19px;
      color: #2B1215;
      margin: 0 0 12px 0;
      font-weight: 700;
      line-height: 1.4;
    }
    p {
      font-size: 14px;
      color: #5F1C25;
      margin: 0 0 28px 0;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      background-color: #AC0C21;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 9999px;
      transition: background 0.2s;
    }
    .btn:hover {
      background-color: #5F1C25;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Ourlette<span>.</span></div>
    <div class="badge">✓</div>
    <h1>Tu ne recevras plus d'emails de relance d'Ourlette.</h1>
    <p>Ton choix a bien été pris en compte. Ton carnet de commandes et tes fiches clients restent bien évidemment accessibles à tout moment sur ton espace couturier.</p>
    <a href="/commandes" class="btn">Accéder à mon carnet de commandes</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
