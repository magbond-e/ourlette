import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendWelcomeEmail, notifyTelegramNewSignup } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      nom,
      nom_atelier,
      telephone,
      pays,
      ville,
      device,
    } = body;

    if (!email || !password || !nom || !nom_atelier) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs obligatoires.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
        { status: 400 }
      );
    }

    // Extraction IP et Device
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const detectedDevice = device || (
      /mobile|android|iphone|ipad|phone/i.test(userAgent) ? 'Mobile' : 'Ordinateur'
    );

    const supabase = createClient();
    const serviceClient = createServiceClient();

    // Inscription via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          nom: nom.trim(),
          nom_atelier: nom_atelier.trim(),
          telephone: telephone?.trim() || '',
          pays: pays?.trim() || 'Bénin',
          ville: ville?.trim() || '',
        },
      },
    });

    if (authError) {
      const isAlreadyRegistered = authError.message.toLowerCase().includes('already registered');
      return NextResponse.json(
        {
          error: isAlreadyRegistered
            ? 'Un compte existe déjà avec cette adresse email.'
            : authError.message,
        },
        { status: 400 }
      );
    }

    const userId = authData.user?.id;
    const unsubscribeToken = crypto.randomBytes(20).toString('hex');

    // Générer slug vitrine unique
    const baseSlug = nom_atelier
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'atelier';
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slugVitrine = `${baseSlug}-${randomSuffix}`;

    // Profil couturier complet
    const profilePayload = {
      id: userId,
      nom: nom.trim(),
      nom_atelier: nom_atelier.trim(),
      email: email.trim().toLowerCase(),
      telephone: telephone?.trim() || '',
      whatsapp_contact: telephone?.trim() || '',
      pays: pays?.trim() || 'Bénin',
      ville: ville?.trim() || '',
      slug_vitrine: slugVitrine,
      plan: 'free',
      cookie_consent_at: new Date().toISOString(),
      onboarding_emails_enabled: true,
      email_opt_out: false,
      unsubscribe_token: unsubscribeToken,
      device: detectedDevice,
      last_ip: clientIp,
      updated_at: new Date().toISOString(),
    };

    if (userId) {
      const dbClient = serviceClient || supabase;
      const { error: upsertErr } = await dbClient
        .from('couturiers')
        .upsert(profilePayload, { onConflict: 'id' });

      if (upsertErr) {
        console.error('[Register] Erreur sauvegarde couturier:', upsertErr);
      }
    }

    // Déclenchement asynchrone sécurisé des notifications de bienvenue
    const notifPayload = {
      email: email.trim().toLowerCase(),
      nom: nom.trim(),
      nom_atelier: nom_atelier.trim(),
      telephone: telephone?.trim() || '',
      pays: pays?.trim() || 'Bénin',
      ville: ville?.trim() || '',
      device: detectedDevice,
      ip: clientIp,
      unsubscribeToken,
    };

    // Vercel attend bien la fin des promesses via Promise.allSettled
    await Promise.allSettled([
      sendWelcomeEmail(notifPayload),
      notifyTelegramNewSignup(notifPayload),
    ]);

    return NextResponse.json({
      success: true,
      user: authData.user,
      session: authData.session,
      profile: profilePayload,
    });
  } catch (err: any) {
    console.error('[Register] Erreur générale:', err);
    return NextResponse.json(
      { error: err?.message || "Une erreur est survenue lors de l'inscription." },
      { status: 500 }
    );
  }
}
