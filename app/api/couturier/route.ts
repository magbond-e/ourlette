import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { Couturier } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseUserClient = createClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service backend indisponible' }, { status: 500 });
    }

    const { data, error } = await serviceClient
      .from('couturiers')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Erreur GET couturier:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ couturier: data });
  } catch (err: any) {
    console.error('Erreur inattendue GET couturier:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseUserClient = createClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    // Protection stricte : interdire la modification de plan, statut_compte, id
    const {
      plan: _forbiddenPlan,
      statut_compte: _forbiddenStatut,
      plan_change_manuel: _forbiddenManual,
      id: _forbiddenId,
      ...safeUpdates
    } = body;

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service backend indisponible' }, { status: 500 });
    }

    // Mise à jour ou création si absent
    const { data: existing } = await serviceClient
      .from('couturiers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await serviceClient
        .from('couturiers')
        .update({
          ...safeUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Erreur update couturier:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      const { data, error } = await serviceClient
        .from('couturiers')
        .insert([{
          ...safeUpdates,
          id: user.id,
          email: user.email || safeUpdates.email || '',
          plan: 'free',
          statut_compte: 'actif',
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur insert couturier:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ couturier: result });
  } catch (err: any) {
    console.error('Erreur inattendue PATCH couturier:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
