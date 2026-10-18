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

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Veuillez renseigner un email et un mot de passe.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères.' },
        { status: 400 }
      );
    }

    const defaultNom = nom?.trim() || 'Artisan Couturier';
    const defaultAtelier = nom_atelier?.trim() || 'Mon Atelier';

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
          nom: defaultNom,
          nom_atelier: defaultAtelier,
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
    const baseSlug = defaultAtelier
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'atelier';
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slugVitrine = `${baseSlug}-${randomSuffix}`;

    // Profil couturier complet
    const profilePayload = {
      id: userId,
      nom: defaultNom,
      nom_atelier: defaultAtelier,
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

    // Déclenchement sécurisé des notifications de bienvenue (Email & Telegram)
    // Non bloquant : capturé par try/catch, loggé, et ne fait JAMAIS échouer l'inscription.
    // Sur Vercel, await Promise.allSettled garantit que les requêtes asynchrones se terminent avant la coupure de la fonction serverless.
    try {
      const notifPayload = {
        email: email.trim().toLowerCase(),
        nom: defaultNom,
        nom_atelier: defaultAtelier,
        telephone: telephone?.trim() || '',
        pays: pays?.trim() || 'Bénin',
        ville: ville?.trim() || '',
        device: detectedDevice,
        ip: clientIp,
        unsubscribeToken,
      };

      await Promise.allSettled([
        sendWelcomeEmail(notifPayload),
        notifyTelegramNewSignup(notifPayload),
      ]);
    } catch (notifErr: any) {
      console.error('[Register] Erreur silencieuse notifications:', notifErr?.message || notifErr);
    }

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
