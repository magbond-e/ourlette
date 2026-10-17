import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NotificationTemplates } from '@/lib/services/notificationService';

export const dynamic = 'force-dynamic';

/**
 * Point de terminaison Vercel Cron appelé quotidiennement (ex: 07:00 UTC)
 * pour synchroniser et émettre les alertes d'échéances et de retards de commandes.
 */
export async function GET(req: NextRequest) {
  // 1. Sécurité : Vérifier le secret CRON_SECRET ou l'en-tête natif Vercel
  const authHeader = req.headers.get('authorization');
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Supabase credentials manquants' }, { status: 500 });
  }

  // Client Supabase Service Role pour accès administratif sécurisé en tâche de fond
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let couturiersProcessed = 0;
  let alertsGenerated = 0;
  let alertsResolved = 0;

  try {
    // 2. Récupérer tous les ateliers actifs
    const { data: couturiers, error: couturiersError } = await supabase
      .from('couturiers')
      .select('id, nom, nom_atelier, email, notif_retard, notif_rappel_livraison, timezone')
      .neq('statut_compte', 'suspendu');

    if (couturiersError || !couturiers) {
      return NextResponse.json({ error: couturiersError?.message || 'Erreur couturiers' }, { status: 500 });
    }

    // 3. Traiter chaque atelier
    for (const c of couturiers) {
      couturiersProcessed++;
      const userTimezone = c.timezone || 'Africa/Porto-Novo';

      // Calculer la date actuelle dans le fuseau horaire du couturier
      const nowInTz = new Date(
        new Date().toLocaleString('en-US', { timeZone: userTimezone })
      );
      nowInTz.setHours(0, 0, 0, 0);
      const todayStr = nowInTz.toISOString().split('T')[0];

      // Récupérer les commandes en cours de cet atelier
      const { data: commandes } = await supabase
        .from('commandes')
        .select('id, client_id, description, statut, date_livraison_prevue')
        .eq('couturier_id', c.id)
        .neq('statut', 'livree');

      if (!commandes || commandes.length === 0) continue;

      // Récupérer les préférences de notification de cet atelier
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('couturier_id', c.id);

      const orderPref = prefs?.find((p) => p.category === 'order');
      const inAppAllowed = orderPref ? orderPref.in_app : (c.notif_retard ?? true);

      if (!inAppAllowed) continue;

      for (const cmd of commandes) {
        if (!cmd.date_livraison_prevue) continue;

        const datePrev = new Date(cmd.date_livraison_prevue);
        if (isNaN(datePrev.getTime())) continue;
        datePrev.setHours(0, 0, 0, 0);

        const diffDays = Math.round((datePrev.getTime() - nowInTz.getTime()) / (1000 * 3600 * 24));
        const formattedDate = new Date(cmd.date_livraison_prevue).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        // Cas A : Commande en retard (diffDays < 0)
        if (diffDays < 0 && (c.notif_retard ?? true)) {
          const daysOverdue = Math.abs(diffDays);
          const templ = NotificationTemplates.orderOverdue(
            c.id,
            { id: cmd.id, description: cmd.description, dateLivraisonPrevue: formattedDate },
            daysOverdue,
            todayStr
          );

          const { error: insertErr } = await supabase.from('notifications').insert([
            {
              couturier_id: c.id,
              type: templ.type,
              category: templ.category,
              priority: templ.priority,
              title: templ.title,
              message: templ.message,
              link: templ.link,
              action_url: templ.actionUrl,
              dedupe_key: templ.dedupeKey,
              data: templ.data,
              metadata: { orderId: cmd.id },
            },
          ]);

          if (!insertErr) {
            alertsGenerated++;
          }
        }
        // Cas B : Échéance imminente (0 <= diffDays <= 2)
        else if (diffDays >= 0 && diffDays <= 2 && (c.notif_rappel_livraison ?? true)) {
          const templ = NotificationTemplates.orderDueSoon(
            c.id,
            { id: cmd.id, description: cmd.description, dateLivraisonPrevue: formattedDate },
            diffDays,
            todayStr
          );

          const { error: insertErr } = await supabase.from('notifications').insert([
            {
              couturier_id: c.id,
              type: templ.type,
              category: templ.category,
              priority: templ.priority,
              title: templ.title,
              message: templ.message,
              link: templ.link,
              action_url: templ.actionUrl,
              dedupe_key: templ.dedupeKey,
              data: templ.data,
              metadata: { orderId: cmd.id },
            },
          ]);

          if (!insertErr) {
            alertsGenerated++;
          }
        }
      }

      // Résoudre automatiquement les alertes des commandes devenues 'livree'
      const { data: livrees } = await supabase
        .from('commandes')
        .select('id')
        .eq('couturier_id', c.id)
        .eq('statut', 'livree');

      if (livrees && livrees.length > 0) {
        for (const l of livrees) {
          const { count } = await supabase
            .from('notifications')
            .update({ resolved_at: new Date().toISOString() })
            .eq('couturier_id', c.id)
            .or(`dedupe_key.like.order_overdue:${l.id}:%,dedupe_key.like.order_due_soon:${l.id}:%`)
            .is('resolved_at', null);

          if (count) alertsResolved += count;
        }
      }
    }

    return NextResponse.json({
      success: true,
      couturiersProcessed,
      alertsGenerated,
      alertsResolved,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron Alerts] Erreur execution:', error);
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 });
  }
}
