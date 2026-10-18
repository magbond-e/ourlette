import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const db = serviceClient || supabase;

    // Purge de toutes les données du couturier
    await Promise.allSettled([
      db.from('commandes').delete().eq('couturier_id', user.id),
      db.from('mesures').delete().eq('couturier_id', user.id),
      db.from('clients').delete().eq('couturier_id', user.id),
      db.from('realisations').delete().eq('couturier_id', user.id),
      db.from('notifications').delete().eq('couturier_id', user.id),
    ]);

    await db.from('couturiers').delete().eq('id', user.id);

    // Suppression définitive du compte auth via service client si disponible
    if (serviceClient) {
      try {
        await serviceClient.auth.admin.deleteUser(user.id);
      } catch (err) {
        console.warn('Erreur admin.deleteUser:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erreur suppression compte:', err);
    return NextResponse.json(
      { error: err?.message || 'Erreur lors de la suppression du compte' },
      { status: 500 }
    );
  }
}
