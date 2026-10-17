import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { Couturier, Realisation } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params?.slug?.toLowerCase().trim();
    if (!slug || slug.includes('.')) {
      return NextResponse.json({ couturier: null, realisations: [] }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service backend indisponible' },
        { status: 500 }
      );
    }

    // Recherche de l'atelier par son slug ou son ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
    let query = supabase.from('couturiers').select('*');
    if (isUuid) {
      query = query.or(`id.eq.${slug},slug_vitrine.eq.${slug}`);
    } else {
      query = query.eq('slug_vitrine', slug);
    }

    const { data: rawCouturier, error: couturierError } = await query.limit(1).maybeSingle();

    if (couturierError) {
      console.error('Erreur API vitrine getCouturier:', couturierError);
      return NextResponse.json({ couturier: null, realisations: [] }, { status: 500 });
    }

    if (!rawCouturier) {
      return NextResponse.json({ couturier: null, realisations: [] }, { status: 200 });
    }

    // Récupération des réalisations de l'atelier
    const { data: rawRealisations, error: realsError } = await supabase
      .from('realisations')
      .select('*')
      .eq('couturier_id', rawCouturier.id)
      .order('date_publication', { ascending: false });

    if (realsError) {
      console.error('Erreur API vitrine getRealisations:', realsError);
    }

    // Assainissement des données publiques (Règle 3 & 5 d'AGENTS.md : aucune fuite de données privées)
    const sanitizedCouturier: Partial<Couturier> = {
      id: rawCouturier.id,
      nom: rawCouturier.nom,
      nom_atelier: rawCouturier.nom_atelier || 'Atelier',
      slug_vitrine: rawCouturier.slug_vitrine || slug,
      bio: rawCouturier.bio || '',
      ville: rawCouturier.ville || '',
      pays: rawCouturier.pays || '',
      adresse_atelier: rawCouturier.adresse_atelier || '',
      logo_url: rawCouturier.logo_url || null,
      cover_url: rawCouturier.cover_url || null,
      vitrine_active: rawCouturier.vitrine_active ?? true,
      whatsapp_contact: rawCouturier.whatsapp_contact || rawCouturier.telephone || '',
      devise: rawCouturier.devise || 'FCFA',
      plan: rawCouturier.plan || 'free',
      // Note : email privé et autres métadonnées sensibles exclus
    };

    return NextResponse.json({
      couturier: sanitizedCouturier,
      realisations: (rawRealisations || []) as Realisation[],
    });
  } catch (err: any) {
    console.error('Erreur inattendue API vitrine:', err);
    return NextResponse.json({ couturier: null, realisations: [] }, { status: 500 });
  }
}
